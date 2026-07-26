/**
 * Pure geometry helpers for the Skia measurement chart — smooth (Catmull-Rom → Bezier)
 * path building and area-fill closing. Kept framework-agnostic (returns SVG path strings,
 * which Skia consumes via `Skia.Path.MakeFromSVGString`). Mirrors the math the legacy SVG
 * `ChartRenderer` uses, extracted here so the Skia renderer does not depend on it.
 *
 * Author: Viktor
 */

export type ScreenPoint = { x: number; y: number };

/**
 * Control points for Bezier smoothing between p1 → p2 (Catmull-Rom to Bezier, tension factor).
 */
const getControlPoints = (
    p0: ScreenPoint,
    p1: ScreenPoint,
    p2: ScreenPoint,
    tension = 0.2,
): [ScreenPoint, ScreenPoint] => {
    const d01 = Math.hypot(p1.x - p0.x, p1.y - p0.y) || 1;
    const d12 = Math.hypot(p2.x - p1.x, p2.y - p1.y) || 1;

    const fa = (tension * d01) / (d01 + d12);
    const fb = (tension * d12) / (d01 + d12);

    return [
        { x: p1.x - fa * (p2.x - p0.x), y: p1.y - fa * (p2.y - p0.y) },
        { x: p1.x + fb * (p2.x - p0.x), y: p1.y + fb * (p2.y - p0.y) },
    ];
};

/**
 * Builds a smooth cubic-Bezier SVG path string from screen points.
 */
export const buildSmoothPath = (pts: ScreenPoint[]): string | null => {
    if (!pts.length) {
        return null;
    }
    if (pts.length === 1) {
        return `M ${pts[0].x} ${pts[0].y}`;
    }
    if (pts.length === 2) {
        return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;
    }

    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = i === 0 ? pts[0] : pts[i - 1];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = i + 2 < pts.length ? pts[i + 2] : pts[pts.length - 1];

        const [, cp1] = getControlPoints(p0, p1, p2);
        const [cp2] = getControlPoints(p1, p2, p3);

        d += ` C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${p2.x} ${p2.y}`;
    }
    return d;
};

/**
 * Extends a smooth line path into a closed area path down to `baselineY`
 * (for the gradient fill under the curve). Returns null for < 2 points.
 */
export const buildAreaPath = (linePath: string | null, pts: ScreenPoint[], baselineY: number): string | null => {
    if (!linePath || pts.length < 2) {
        return null;
    }
    const first = pts[0];
    const last = pts[pts.length - 1];
    return `${linePath} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
};
