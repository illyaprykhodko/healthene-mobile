/**
 * Virtualized continuous-ribbon chart (Apple-Health style) for measurements.
 *
 * The parent keeps a WINDOW of period pages (anchor ± N) loaded and passes them in `pages` (ordered
 * by their integer period index `k`). This component renders them as ONE continuous line on a single
 * (pages.length × W) Skia canvas and pans it with a `tx` shared value on the UI thread, so the chart
 * follows the finger seamlessly across period boundaries. As the centred period drifts a full period,
 * it asks the parent to re-anchor (`onAnchorChange`); when the window then shifts, `tx` is carried by
 * the same amount in a layout effect so the same moment stays under the finger (no jump, and the
 * overlapping window keeps the visible data loaded).
 *
 * Line/area/points are built on the UI thread from data values + a LIVE Y range (`rangeMin`/`rangeMax`)
 * that blends between the two columns under the viewport → the scale morphs smoothly while scrolling.
 * The line breaks across empty periods (`computeBreaks`, column jump ≥ 2) instead of bridging them.
 * Scrubbing (long-press) glides a dot along the exact curve (`curveYAt`) and reads the nearest sample.
 *
 * `FREE_SCROLL` = true → the ribbon parks wherever released; false → it snaps to the nearest period.
 * The future is bounded at `maxK` (today's period) with rubber-band resistance.
 *
 * Author: Viktor
 */
import { useHaptic } from 'hooks/useHaptic';
import { scheduleOnRN } from 'react-native-worklets';
import { View, Text, StyleSheet, type LayoutChangeEvent } from 'react-native';
import React, { memo, useMemo, useRef, useState, useEffect, useLayoutEffect } from 'react';
import { GestureDetector, usePanGesture, useCompetingGestures } from 'react-native-gesture-handler';
import Animated, {
    FadeIn,
    FadeOut,
    withSpring,
    withTiming,
    useSharedValue,
    useDerivedValue,
    useReducedMotion,
    useAnimatedStyle,
    useAnimatedReaction,
} from 'react-native-reanimated';
import { Skia, Path, Line, Group, Canvas, DashPathEffect, LinearGradient, vec } from '@shopify/react-native-skia';

// local dependencies
import ChartHeader from './ChartHeader';
import type { ScrubInfo } from './skia-chart-helpers';
import { MAX_FONT_SCALE } from 'constants/typography.ts';
import { useThemeContext } from 'providers/ThemeProvider';
import { CENTERED_VALUE_PERIODS, type MeasurementTab, type DatePeriod } from 'constants/measurement-chart';
import { calculateInterval, getDateRangeText, getHorizontalLabels, getHorizontalLabelPositions } from './chart-helpers';

const PLOT_Y_GUTTER = 40;
const PLOT_X_LABEL_H = 28;
const PLOT_PADDING_TOP = 16;
const PRIMARY_COLOR = '#E91218';
const SECONDARY_COLOR = '#156F93';

const TIMING = { duration: 260 } as const;
const SPRING = { damping: 20, stiffness: 220, mass: 0.6 } as const;
const VELOCITY_THRESHOLD = 500;
// EXPERIMENT: free-scroll — the ribbon follows the finger and PARKS wherever released (no snap to a
// period). Set to false to restore period-by-period paging (snap to the nearest period on release).
const FREE_SCROLL = true;

export interface ChartPageData {
    k: number;
    restData: any[];
    chartData: any[];
    tab: MeasurementTab;
    isLoading?: boolean;
}

interface ChartCarouselProps {
    maxK: number;
    anchorK: number;
    period: DatePeriod;
    currentValue?: any;
    pages: ChartPageData[];
    isBloodPressure?: boolean;
    onAnchorChange: (k: number) => void;
}

const clampIdx = (i: number, n: number): number => {
    'worklet';
    return i < 0 ? 0 : i > n - 1 ? n - 1 : i;
};

// Dense periods (DAY ~24, MONTH ~31 slots) reserve a couple of empty slots on the right so the last
// slot ("today") is not crammed against the axis. Sparse periods (WEEK/6M/YEAR) are already spaced.
const RIGHT_PAD_SLOTS = 2;
const slotDivision = (W: number, count: number): number => W / (count + (count > 15 ? RIGHT_PAD_SLOTS : 0));

// Touch radius (px) for scrubbing an ISOLATED point that has no line under it (e.g. a single reading).
const SCRUB_SNAP_PX = 40;

const shouldShowXLabel = (index: number, total: number, maxLabels: number): boolean => {
    if (total <= maxLabels) { return true; }
    const step = Math.ceil(total / maxLabels);
    return (total - 1 - index) % step === 0;
};

// ---- UI-thread geometry (worklets) ----

// value -> screen y for the given (animated) range `[mn, mx]`.
const cyOf = (v: number, top: number, h: number, range: number[]): number => {
    'worklet';
    const mn = range[0];
    const mx = range[1];
    const r = mx - mn || 1;
    return top + ((mx - v) * h) / r;
};

// Append one contiguous smooth (Catmull-Rom -> Bezier) run over index bounds `[s, e]` to an SkPath.
const addSmoothRun = (p: any, xs: number[], ys: number[], bounds: number[]): void => {
    'worklet';
    const s = bounds[0];
    const e = bounds[1];
    if (e < s) { return; }
    p.moveTo(xs[s], ys[s]);
    if (e === s) { return; }
    if (e - s === 1) {
        p.lineTo(xs[e], ys[e]);
        return;
    }
    const t = 0.2;
    for (let i = s; i < e; i++) {
        const p0x = i === s ? xs[s] : xs[i - 1];
        const p0y = i === s ? ys[s] : ys[i - 1];
        const p1x = xs[i];
        const p1y = ys[i];
        const p2x = xs[i + 1];
        const p2y = ys[i + 1];
        const p3x = i + 2 <= e ? xs[i + 2] : xs[e];
        const p3y = i + 2 <= e ? ys[i + 2] : ys[e];
        const d01 = Math.hypot(p1x - p0x, p1y - p0y) || 1;
        const d12 = Math.hypot(p2x - p1x, p2y - p1y) || 1;
        const d23 = Math.hypot(p3x - p2x, p3y - p2y) || 1;
        const fb = (t * d12) / (d01 + d12);
        const fa = (t * d12) / (d12 + d23);
        p.cubicTo(p1x + fb * (p2x - p0x), p1y + fb * (p2y - p0y), p2x - fa * (p3x - p1x), p2y - fa * (p3y - p1y), p2x, p2y);
    }
};

// Smooth SkPath, split into separate runs at each `breaks[i]` (large data gap → no bridging line).
const smoothSkPath = (xs: number[], ys: number[], breaks: boolean[]) => {
    'worklet';
    const p = Skia.Path.Make();
    const n = xs.length;
    if (n === 0) { return p; }
    let start = 0;
    for (let end = 0; end < n; end++) {
        if (end === n - 1 || breaks[end]) {
            addSmoothRun(p, xs, ys, [start, end]);
            start = end + 1;
        }
    }
    return p;
};

// Gradient-fill area: each contiguous run closed down to `baseline` (skips gaps and lone points).
const areaSkPath = (xs: number[], ys: number[], breaks: boolean[], baseline: number) => {
    'worklet';
    const p = Skia.Path.Make();
    const n = xs.length;
    let start = 0;
    for (let end = 0; end < n; end++) {
        if (end === n - 1 || breaks[end]) {
            if (end > start) {
                addSmoothRun(p, xs, ys, [start, end]);
                p.lineTo(xs[end], baseline);
                p.lineTo(xs[start], baseline);
                p.close();
            }
            start = end + 1;
        }
    }
    return p;
};

// Exact screen-y on the SMOOTH curve at screen-x `x` (same Catmull-Rom→Bezier the line is built from,
// so the scrub dot rides the rendered line, not a linear approximation). NaN when `x` is in a gap.
const curveYAt = (xs: number[], ys: number[], breaks: boolean[], x: number): number => {
    'worklet';
    const n = xs.length;
    if (n === 0) { return NaN; }
    // Outside the data range → NaN (no dot / no tooltip when scrubbing empty space beyond the data).
    if (x < xs[0] || x > xs[n - 1]) { return NaN; }
    if (n === 1) { return ys[0]; }
    let seg = -1;
    for (let i = 0; i < n - 1; i++) {
        if (x >= xs[i] && x <= xs[i + 1]) { seg = i; break; }
    }
    if (seg < 0 || breaks[seg]) { return NaN; }
    let s = seg;
    while (s > 0 && !breaks[s - 1]) { s--; }
    let e = seg + 1;
    while (e < n - 1 && !breaks[e]) { e++; }
    const i = seg;
    const p0x = i === s ? xs[s] : xs[i - 1];
    const p0y = i === s ? ys[s] : ys[i - 1];
    const p1x = xs[i];
    const p1y = ys[i];
    const p2x = xs[i + 1];
    const p2y = ys[i + 1];
    const p3x = i + 2 <= e ? xs[i + 2] : xs[e];
    const p3y = i + 2 <= e ? ys[i + 2] : ys[e];
    const t = 0.2;
    const d01 = Math.hypot(p1x - p0x, p1y - p0y) || 1;
    const d12 = Math.hypot(p2x - p1x, p2y - p1y) || 1;
    const d23 = Math.hypot(p3x - p2x, p3y - p2y) || 1;
    const fb = (t * d12) / (d01 + d12);
    const fa = (t * d12) / (d12 + d23);
    const cp1x = p1x + fb * (p2x - p0x);
    const cp1y = p1y + fb * (p2y - p0y);
    const cp2x = p2x - fa * (p3x - p1x);
    const cp2y = p2y - fa * (p3y - p1y);
    let lo = 0;
    let hi = 1;
    let u = 0.5;
    for (let k = 0; k < 22; k++) {
        u = (lo + hi) / 2;
        const mt = 1 - u;
        const bx = mt * mt * mt * p1x + 3 * mt * mt * u * cp1x + 3 * mt * u * u * cp2x + u * u * u * p2x;
        if (bx < x) { lo = u; } else { hi = u; }
    }
    const mt = 1 - u;
    return mt * mt * mt * p1y + 3 * mt * mt * u * cp1y + 3 * mt * u * u * cp2y + u * u * u * p2y;
};

// "Break after point i" when a whole period column is empty between two consecutive (x-sorted) points
// (column index jumps by ≥2). Sparse data inside a period stays connected as one continuous line.
const computeBreaks = (pts: { col: number }[]): boolean[] =>
    pts.map((p, i) => (i === pts.length - 1 ? false : pts[i + 1].col - p.col >= 2));

// Auto Y-range [min, max] (±5 margin) for a page's data, or null when the page has no data.
const rangeOf = (chartData: any[], restData: any[]): [number, number] | null => {
    const vals = [...chartData.map(p => p.y), ...restData.map(p => p.y)].filter(Number.isFinite);
    if (!vals.length) { return null; }
    const mn = Math.floor(Math.min(...vals)) - 5;
    let mx = Math.ceil(Math.max(...vals)) + 5;
    if (mx === mn) { mx = mn + 1; }
    return [mn, mx];
};

const ChartCarousel: React.FC<ChartCarouselProps> = ({
    pages,
    maxK,
    period,
    anchorK,
    currentValue,
    onAnchorChange,
    isBloodPressure = false,
}) => {
    const { theme } = useThemeContext();
    const haptic = useHaptic();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const [size, setSize] = useState({ w: 0, h: 0 });
    const [scrubInfo, setScrubInfo] = useState<ScrubInfo | null>(null);
    const tx = useSharedValue(0);
    const startTx = useSharedValue(0);

    const handleLayout = (e: LayoutChangeEvent) => {
        const { width, height } = e.nativeEvent.layout;
        setSize(prevS => (prevS.w === width && prevS.h === height ? prevS : { w: width, h: height }));
    };

    const W = size.w;
    const n = pages.length;
    const plotTop = PLOT_PADDING_TOP;
    const plotBottom = Math.max(plotTop, size.h - PLOT_X_LABEL_H);
    const innerHeight = plotBottom - plotTop;

    const windowStartK = pages[0]?.k ?? 0;
    const anchorIndex = clampIdx(anchorK - windowStartK, n);
    const anchorPage = pages[anchorIndex];

    // Per-page auto Y-range, with empty pages filled from the nearest neighbour.
    const pageRanges = useMemo<number[][]>(() => {
        const raw = pages.map(p => rangeOf(p.chartData, p.restData));
        return raw.map((r, i) => {
            if (r) { return r; }
            for (let d = 1; d < raw.length; d++) {
                if (raw[i - d]) { return raw[i - d] as number[]; }
                if (raw[i + d]) { return raw[i + d] as number[]; }
            }
            return [0, 100];
        });
    }, [pages]);

    const curRange = pageRanges[anchorIndex] ?? [0, 100];
    const yMin = curRange[0];
    const yMax = curRange[1];
    const verticalLabels = useMemo(() => calculateInterval([yMin, yMax]), [yMin, yMax]);

    // pageRanges lives in a shared value updated in the SAME layout effect as the `tx` carry, so the
    // range blend and the offset stay in sync across a window shift (no one-frame flicker).
    const pageRangesSV = useSharedValue<number[][]>([[0, 100]]);

    // Live Y range blends between the two columns under the viewport → smooth scale morph on scroll.
    const rangeMin = useDerivedValue(() => {
        const pr = pageRangesSV.value;
        const nn = pr.length;
        if (nn === 0) { return 0; }
        const jc = W === 0 ? 0 : -tx.value / W;
        const j0 = clampIdx(Math.floor(jc), nn);
        const j1 = clampIdx(j0 + 1, nn);
        const frac = Math.max(0, Math.min(1, jc - j0));
        return pr[j0][0] + (pr[j1][0] - pr[j0][0]) * frac;
    });
    const rangeMax = useDerivedValue(() => {
        const pr = pageRangesSV.value;
        const nn = pr.length;
        if (nn === 0) { return 100; }
        const jc = W === 0 ? 0 : -tx.value / W;
        const j0 = clampIdx(Math.floor(jc), nn);
        const j1 = clampIdx(j0 + 1, nn);
        const frac = Math.max(0, Math.min(1, jc - j0));
        return pr[j0][1] + (pr[j1][1] - pr[j0][1]) * frac;
    });

    // Canvas x for one page's points at column `col` (= page index).
    const periodXsVals = (page: ChartPageData, col: number) => {
        const count = page.tab.count || 1;
        const isCentered = CENTERED_VALUE_PERIODS.includes(page.tab.name);
        const division = slotDivision(W, count);
        const getCx = (slot: number) => col * W + (isCentered ? division * slot - division / 2 : division * slot);
        const out: { x: number; value: number; value2?: number; date: string; col: number }[] = [];
        page.chartData.forEach((p, i) => {
            const x = getCx(p.x);
            if (!Number.isFinite(x) || !Number.isFinite(p.y)) { return; }
            out.push({
                x,
                col,
                value: p.y,
                date: p.displayFromDate || p.fromDate || '',
                value2: isBloodPressure ? page.restData[i]?.y : undefined,
            });
        });
        return out;
    };

    // Combined, x-sorted points across the whole window → arrays fed to the UI-thread path builder.
    const combined = useMemo(() => {
        if (W === 0) { return []; }
        return pages
            .flatMap((page, col) => periodXsVals(page, col))
            .sort((a, b) => a.x - b.x);
        // eslint-disable-next-line
    }, [pages, size, isBloodPressure]);

    // Point arrays live in shared values so the derived SkPaths rebuild on the UI thread.
    const xsP = useSharedValue<number[]>([]);
    const valsP = useSharedValue<number[]>([]);
    const valsP2 = useSharedValue<number[]>([]); // secondary (diastolic) aligned with xsP; NaN if none
    const breaksP = useSharedValue<boolean[]>([]);
    const xsS = useSharedValue<number[]>([]);
    const valsS = useSharedValue<number[]>([]);
    const breaksS = useSharedValue<boolean[]>([]);

    // Sync point arrays + carry `tx` when the window shifts (keep the same moment under the finger),
    // all BEFORE paint so a shifted window never shows the previous line at the new offset.
    const prevStartK = useRef<number | null>(null);
    const prevPeriod = useRef<DatePeriod | null>(null);
    useLayoutEffect(() => {
        if (W === 0) { return; }
        xsP.value = combined.map(p => p.x);
        valsP.value = combined.map(p => p.value);
        valsP2.value = combined.map(p => (Number.isFinite(p.value2) ? (p.value2 as number) : NaN));
        breaksP.value = computeBreaks(combined);
        const bp = combined.filter(p => Number.isFinite(p.value2));
        xsS.value = bp.map(p => p.x);
        valsS.value = bp.map(p => p.value2 as number);
        breaksS.value = computeBreaks(bp);
        pageRangesSV.value = pageRanges;

        if (prevStartK.current === null || prevPeriod.current !== period) {
            // First real layout or a tab (period) switch → recentre on the anchor column.
            tx.value = -anchorIndex * W;
            startTx.value = -anchorIndex * W;
        } else if (prevStartK.current !== windowStartK) {
            // Window shifted (re-anchor) → carry by the same amount so the view stays continuous.
            const delta = windowStartK - prevStartK.current;
            tx.value += delta * W;
            startTx.value += delta * W;
        }
        prevStartK.current = windowStartK;
        prevPeriod.current = period;
        // eslint-disable-next-line
    }, [combined, windowStartK, W, period]);

    // draw-on reveal (first mount / metric change only, not while scrolling)
    const progress = useSharedValue(0);
    const reduceMotion = useReducedMotion();
    useEffect(() => {
        if (reduceMotion) {
            progress.value = 1;
            return;
        }
        progress.value = 0;
        progress.value = withTiming(1, { duration: 1100 });
    }, [period, isBloodPressure, reduceMotion]);

    // --- UI-thread paths ---
    const linePathP = useDerivedValue(() => {
        const xs = xsP.value;
        if (xs.length === 0) { return Skia.Path.Make(); }
        const ys = xs.map((_, i) => cyOf(valsP.value[i], plotTop, innerHeight, [rangeMin.value, rangeMax.value]));
        return smoothSkPath(xs, ys, breaksP.value);
    });
    const areaPathP = useDerivedValue(() => {
        const xs = xsP.value;
        if (xs.length < 2) { return Skia.Path.Make(); }
        const ys = xs.map((_, i) => cyOf(valsP.value[i], plotTop, innerHeight, [rangeMin.value, rangeMax.value]));
        return areaSkPath(xs, ys, breaksP.value, plotBottom);
    });
    const dotsP = useDerivedValue(() => {
        const xs = xsP.value;
        const p = Skia.Path.Make();
        for (let i = 0; i < xs.length; i++) {
            p.addCircle(xs[i], cyOf(valsP.value[i], plotTop, innerHeight, [rangeMin.value, rangeMax.value]), 5);
        }
        return p;
    });
    const linePathS = useDerivedValue(() => {
        const xs = xsS.value;
        if (xs.length === 0) { return Skia.Path.Make(); }
        const ys = xs.map((_, i) => cyOf(valsS.value[i], plotTop, innerHeight, [rangeMin.value, rangeMax.value]));
        return smoothSkPath(xs, ys, breaksS.value);
    });
    const areaPathS = useDerivedValue(() => {
        const xs = xsS.value;
        if (xs.length < 2) { return Skia.Path.Make(); }
        const ys = xs.map((_, i) => cyOf(valsS.value[i], plotTop, innerHeight, [rangeMin.value, rangeMax.value]));
        return areaSkPath(xs, ys, breaksS.value, plotBottom);
    });
    const dotsS = useDerivedValue(() => {
        const xs = xsS.value;
        const p = Skia.Path.Make();
        for (let i = 0; i < xs.length; i++) {
            p.addCircle(xs[i], cyOf(valsS.value[i], plotTop, innerHeight, [rangeMin.value, rangeMax.value]), 5);
        }
        return p;
    });

    // Per-page X-axis labels + dashed vertical guides at their columns.
    const xAxis = useMemo(() => {
        if (W === 0) { return [] as { key: string; x: number; label: string }[]; }
        const maxLabels = Math.max(2, Math.floor(W / 44));
        const out: { key: string; x: number; label: string }[] = [];
        pages.forEach((page, col) => {
            const labels = getHorizontalLabels(page.tab.name, page.tab.options.endDate, page.tab.count);
            const positions = getHorizontalLabelPositions(page.tab.name, page.tab.count);
            const isCentered = CENTERED_VALUE_PERIODS.includes(page.tab.name);
            const division = slotDivision(W, page.tab.count || 1);
            labels.forEach((label, i) => {
                if (!shouldShowXLabel(i, labels.length, maxLabels)) { return; }
                const slot = positions[i];
                const x = col * W + (isCentered ? division * slot - division / 2 : division * slot);
                out.push({ key: `${col}-${i}`, x, label });
            });
        });
        // Drop labels that would visually collide across column boundaries (e.g. the last day of one
        // month sits ~1px from the first day of the next → "2828"). `out` is already x-sorted; keep a
        // label only if it clears the last KEPT one by MIN_LABEL_GAP px.
        const MIN_LABEL_GAP = 34;
        const kept: typeof out = [];
        let lastX = -Infinity;
        for (const l of out) {
            if (l.x - lastX >= MIN_LABEL_GAP) {
                kept.push(l);
                lastX = l.x;
            }
        }
        return kept;
    }, [pages, size]);

    const dateRange = anchorPage
        ? getDateRangeText(anchorPage.tab.name, anchorPage.tab.options.startDate, anchorPage.tab.options.endDate)
        : '';
    useEffect(() => setScrubInfo(null), [anchorK, period]);

    // --- scrub over the whole ribbon (works at any scroll offset) ---
    const touchX = useSharedValue(0);
    const scrubActive = useSharedValue(false);

    // Screen touchX → canvas x (canvas x = screen x - tx, since screen x = canvas x + tx).
    const canvasX = useDerivedValue(() => Math.max(0, Math.min(touchX.value - tx.value, n * W)));
    const activeIndex = useDerivedValue(() => {
        const arr = xsP.value;
        if (!arr.length) { return -1; }
        let best = 0;
        let bestD = Math.abs(arr[0] - canvasX.value);
        for (let i = 1; i < arr.length; i++) {
            const d = Math.abs(arr[i] - canvasX.value);
            if (d < bestD) { bestD = d; best = i; }
        }
        return best;
    });
    // Primary-line y under the finger; NaN when NOT over the line (empty period / gap / outside range).
    const scrubY = useDerivedValue(() => {
        const xs = xsP.value;
        if (!xs.length) { return NaN; }
        const ys = xs.map((_, i) => cyOf(valsP.value[i], plotTop, innerHeight, [rangeMin.value, rangeMax.value]));
        return curveYAt(xs, ys, breaksP.value, canvasX.value);
    });
    const overLine = useDerivedValue(() => Number.isFinite(scrubY.value));
    // Nearest data point's canvas x (for scrubbing ISOLATED points that have no line under them).
    const nearestX = useDerivedValue(() => {
        const arr = xsP.value;
        const i = activeIndex.value;
        return i >= 0 && i < arr.length ? arr[i] : NaN;
    });
    const nearPoint = useDerivedValue(() => Number.isFinite(nearestX.value) && Math.abs(nearestX.value - canvasX.value) <= SCRUB_SNAP_PX);
    // Valid when over the line OR within touch range of a point → never surfaces an off-screen point.
    const scrubValid = useDerivedValue(() => overLine.value || nearPoint.value);
    // The indicator follows the finger over a line, but snaps to an isolated point when near one.
    const indX = useDerivedValue(() => (overLine.value ? canvasX.value : nearestX.value));
    const indTop = useDerivedValue(() => vec(indX.value, plotTop));
    const indBottom = useDerivedValue(() => vec(indX.value, plotBottom));
    const indDotTopPath = useDerivedValue(() => {
        const p = Skia.Path.Make();
        const range = [rangeMin.value, rangeMax.value];
        if (overLine.value) {
            p.addCircle(canvasX.value, scrubY.value, 5);
        } else if (nearPoint.value) {
            p.addCircle(nearestX.value, cyOf(valsP.value[activeIndex.value], plotTop, innerHeight, range), 5);
        }
        return p;
    });
    const indDotBottomPath = useDerivedValue(() => {
        const p = Skia.Path.Make();
        const range = [rangeMin.value, rangeMax.value];
        if (overLine.value) {
            const xs = xsS.value;
            if (xs.length) {
                const ys = xs.map((_, i) => cyOf(valsS.value[i], plotTop, innerHeight, range));
                const y = curveYAt(xs, ys, breaksS.value, canvasX.value);
                if (Number.isFinite(y)) { p.addCircle(canvasX.value, y, 5); }
            }
        } else if (nearPoint.value) {
            const v2 = valsP2.value[activeIndex.value];
            if (Number.isFinite(v2)) { p.addCircle(nearestX.value, cyOf(v2, plotTop, innerHeight, range), 5); }
        }
        return p;
    });
    // Indicator visible only while actively scrubbing AND over the line / near a point.
    const scrubOpacity = useDerivedValue(() => withTiming(scrubActive.value && scrubValid.value ? 1 : 0, { duration: 120 }));

    const emitScrub = (index: number) => {
        const d = combined[index];
        if (!d) { return; }
        setScrubInfo({ value: d.value, value2: d.value2, date: d.date });
        haptic.selection();
    };
    const emitScrubEnd = () => setScrubInfo(null);
    const clearScrub = () => setScrubInfo(null);

    // Show the readout only when over the line; hide it (and the indicator) over No Data / gaps.
    useAnimatedReaction(
        () => ({ i: activeIndex.value, show: scrubActive.value && scrubValid.value }),
        (cur, prevR) => {
            const wasShow = prevR ? prevR.show : false;
            if (cur.show) {
                if (!wasShow || (prevR && cur.i !== prevR.i)) {
                    scheduleOnRN(emitScrub, cur.i);
                }
            } else if (wasShow) {
                scheduleOnRN(emitScrubEnd);
            }
        }
    );

    // Re-anchor when the centred period drifts to a new integer (keeps the header/window in sync).
    const lastReq = useRef(anchorK);
    useEffect(() => {
        lastReq.current = anchorK;
    }, [anchorK]);
    const requestAnchor = (target: number) => {
        if (target === lastReq.current) { return; }
        lastReq.current = target;
        onAnchorChange(target);
    };
    useAnimatedReaction(
        () => tx.value,
        v => {
            if (W === 0) { return; }
            const kc = windowStartK - v / W;
            let target = Math.round(kc);
            if (target > maxK) { target = maxK; }
            if (target !== anchorK) { scheduleOnRN(requestAnchor, target); }
        },
        [W, windowStartK, anchorK, maxK]
    );

    // --- gestures (gesture-handler v3 hooks) ---
    const scrubGesture = usePanGesture({
        activateAfterLongPress: 120,
        onActivate: e => {
            'worklet';
            touchX.value = e.x;
            scrubActive.value = true;
        },
        onUpdate: e => {
            'worklet';
            touchX.value = e.x;
        },
        onFinalize: () => {
            'worklet';
            scrubActive.value = false;
        },
    });

    const pageGesture = usePanGesture({
        activeOffsetX: [-12, 12],
        failOffsetY: [-16, 16],
        onActivate: () => {
            'worklet';
            startTx.value = tx.value;
            scheduleOnRN(clearScrub);
        },
        onUpdate: e => {
            'worklet';
            if (W === 0) { return; }
            let next = startTx.value + e.translationX;
            const bound = (windowStartK - maxK) * W; // tx >= bound → cannot scroll past "today"
            if (next < bound) { next = bound + (next - bound) * 0.25; }
            tx.value = next;
        },
        onDeactivate: e => {
            'worklet';
            if (W === 0) { return; }
            const bound = (windowStartK - maxK) * W;
            if (FREE_SCROLL) {
                if (tx.value < bound) { tx.value = withSpring(bound, SPRING); }
                return;
            }
            // Paging: snap to the nearest period (± by fling velocity), clamped to the future bound.
            const kc = windowStartK - tx.value / W;
            let target = Math.round(kc);
            if (e.velocityX < -VELOCITY_THRESHOLD) {
                target += 1;
            } else if (e.velocityX > VELOCITY_THRESHOLD) {
                target -= 1;
            }
            if (target > maxK) { target = maxK; }
            tx.value = withTiming((windowStartK - target) * W, TIMING);
        },
    });

    const gesture = useCompetingGestures(scrubGesture, pageGesture);

    const rowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }] }));

    const ready = size.w > 0 && size.h > 0;

    return (
        <View style={styles.container}>
            <ChartHeader
                dateRange={dateRange}
                scrubInfo={scrubInfo}
                currentValue={currentValue}
                isBloodPressure={isBloodPressure}
            />

            <View style={styles.plotArea}>
                <View style={styles.ribbonArea} onLayout={handleLayout}>
                    {ready && (
                        <GestureDetector gesture={gesture}>
                            {/* Fixed full-size overlay → gesture x is screen-relative; the ribbon slides inside. */}
                            <View style={StyleSheet.absoluteFill}>
                                <Animated.View style={[styles.row, { width: W * n }, rowStyle]}>
                                    <Canvas style={StyleSheet.absoluteFill}>
                                        {/* horizontal grid lines (even fractions, static) */}
                                        {verticalLabels.map((_, index, arr) => {
                                            const y = plotTop + (index * innerHeight) / (arr.length - 1);
                                            return (
                                                <Path
                                                    style="stroke"
                                                    opacity={0.25}
                                                    strokeWidth={1}
                                                    key={`grid-${index}`}
                                                    color={theme.colors.border}
                                                    path={`M 0 ${y} L ${W * n} ${y}`}
                                                />
                                            );
                                        })}

                                        {/* dashed vertical guides at each period's X labels */}
                                        {xAxis.map(l => (
                                            <Path
                                                opacity={0.35}
                                                style="stroke"
                                                strokeWidth={1}
                                                color="#B0B0B0"
                                                key={`vg-${l.key}`}
                                                path={`M ${l.x} ${plotTop} L ${l.x} ${plotBottom}`}
                                            >
                                                <DashPathEffect intervals={[1, 4]} />
                                            </Path>
                                        ))}

                                        {/* line + gradient + dots */}
                                        <Group>
                                            <Path path={areaPathP} style="fill" opacity={progress}>
                                                <LinearGradient
                                                    start={vec(0, plotTop)}
                                                    end={vec(0, plotBottom)}
                                                    colors={[`${PRIMARY_COLOR}47`, `${PRIMARY_COLOR}00`]}
                                                />
                                            </Path>
                                            <Path
                                                start={0}
                                                style="stroke"
                                                end={progress}
                                                path={linePathP}
                                                strokeCap="round"
                                                strokeWidth={2.5}
                                                strokeJoin="round"
                                                color={PRIMARY_COLOR}
                                            />
                                            <Path path={dotsP} style="fill" color={PRIMARY_COLOR} opacity={progress} />

                                            {isBloodPressure && (
                                                <Path path={areaPathS} style="fill" opacity={progress}>
                                                    <LinearGradient
                                                        start={vec(0, plotTop)}
                                                        end={vec(0, plotBottom)}
                                                        colors={[`${SECONDARY_COLOR}47`, `${SECONDARY_COLOR}00`]}
                                                    />
                                                </Path>
                                            )}
                                            {isBloodPressure && (
                                                <Path
                                                    start={0}
                                                    end={progress}
                                                    style="stroke"
                                                    path={linePathS}
                                                    strokeWidth={2.5}
                                                    strokeCap="round"
                                                    strokeJoin="round"
                                                    color={SECONDARY_COLOR}
                                                />
                                            )}
                                            {isBloodPressure && <Path path={dotsS} style="fill" color={SECONDARY_COLOR} opacity={progress} />}
                                        </Group>

                                        {/* scrub indicator */}
                                        <Group opacity={scrubOpacity}>
                                            <Line style="stroke" strokeWidth={1.5} p1={indTop} p2={indBottom} color={theme.colors.textSecondary} />
                                            <Path path={indDotTopPath} style="fill" color={PRIMARY_COLOR} />
                                            {isBloodPressure && <Path path={indDotBottomPath} style="fill" color={SECONDARY_COLOR} />}
                                        </Group>
                                    </Canvas>

                                    {/* X-axis labels (move with the ribbon) */}
                                    {xAxis.map(l => (
                                        <Text
                                            key={`xl-${l.key}`}
                                            maxFontSizeMultiplier={MAX_FONT_SCALE}
                                            style={[styles.xLabel, { left: l.x - 20, color: theme.colors.textSecondary }]}
                                        >
                                            {l.label}
                                        </Text>
                                    ))}
                                </Animated.View>
                            </View>
                        </GestureDetector>
                    )}

                    {/* Empty state (centred period only) — fades so it doesn't blink at a crossing */}
                    {ready && (anchorPage?.chartData.length ?? 0) === 0 && (
                        <Animated.View
                            pointerEvents="none"
                            style={styles.emptyWrap}
                            exiting={FadeOut.duration(180)}
                            entering={FadeIn.duration(180)}
                        >
                            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No Data</Text>
                        </Animated.View>
                    )}
                </View>

                {/* Fixed Y-axis value labels (right) */}
                {ready
                    && verticalLabels
                        .slice()
                        .reverse()
                        .map((value, index, arr) => {
                            const y = plotTop + (index * innerHeight) / (arr.length - 1);
                            return (
                                <Text
                                    key={`yl-${index}`}
                                    maxFontSizeMultiplier={MAX_FONT_SCALE}
                                    style={[styles.yLabel, { top: y - 8, color: theme.colors.textSecondary }]}
                                >
                                    {value}
                                </Text>
                            );
                        })}
            </View>
        </View>
    );
};

export default memo(ChartCarousel);

const createStyles = (_theme: any) =>
    StyleSheet.create({
        container: {
            flex: 1,
        },
        plotArea: {
            flex: 1,
            overflow: 'hidden',
        },
        ribbonArea: {
            ...StyleSheet.absoluteFill,
            overflow: 'hidden',
        },
        row: {
            flex: 1,
            flexDirection: 'row',
        },
        emptyWrap: {
            ...StyleSheet.absoluteFill,
            alignItems: 'center',
            justifyContent: 'center',
        },
        emptyText: {
            fontSize: 30,
            fontWeight: 'bold',
        },
        yLabel: {
            right: 0,
            fontSize: 12,
            textAlign: 'left',
            fontWeight: 'bold',
            position: 'absolute',
            width: PLOT_Y_GUTTER - 6,
        },
        xLabel: {
            width: 40,
            bottom: 4,
            fontSize: 13,
            textAlign: 'center',
            fontWeight: 'bold',
            position: 'absolute',
        },
    });
