import { STAR_CONFIG } from './config';

export type DeferCancelHandle = { cancel: () => void };

/**
 * Two RAFs after tap: enough separation from CheckboxBurstEffect’s Modal mount without blocking on
 * InteractionManager (logs showed ~400ms deferral then `finished:false` at progress 0 — IM was a bad fit).
 */
export function deferTwoFramesCancelable (onReady: () => void): DeferCancelHandle {
    let cancelled = false;
    let id2: number | null = null;
    const raf = globalThis.requestAnimationFrame.bind(globalThis);
    const craf = globalThis.cancelAnimationFrame.bind(globalThis);
    const id1 = raf(() => {
        if (cancelled) {
            return;
        }
        id2 = raf(() => {
            if (cancelled) {
                return;
            }
            id2 = null;
            onReady();
        });
    });
    return {
        cancel () {
            cancelled = true;
            craf(id1);
            if (id2 != null) {
                craf(id2);
            }
        },
    };
}

/** Star center in window space when the star view has not laid out yet (uses overlay rect from measure). */
export function getStarFallbackCenterWindow (
    overlayOx: number,
    overlayOy: number,
    overlayW: number
): { cx: number; cy: number } {
    const { WIDTH, HEIGHT, POSITION } = STAR_CONFIG;
    const cy = overlayOy + POSITION.TOP_FROM_SAFE_AREA + HEIGHT / 2;
    const align = POSITION.ALIGN_HORIZONTAL ?? 'center';
    const { OFFSET_X } = POSITION;
    let cx: number;
    if (align === 'left') {
        cx = overlayOx + OFFSET_X + WIDTH / 2;
    } else if (align === 'right') {
        cx = overlayOx + overlayW - WIDTH / 2 + OFFSET_X;
    } else {
        cx = overlayOx + overlayW / 2 + OFFSET_X;
    }
    return { cx, cy };
}

export function buildStarPolygonPoints (width: number, height: number, rays: number, rayLength: number): string {
    const cx = width / 2;
    const cy = height / 2;
    const fit = Math.min(width, height);
    const innerR = Math.max(4, fit * 0.12);
    const outerR = innerR + rayLength;
    const pts: string[] = [];
    const steps = rays * 2;
    for (let i = 0; i < steps; i++) {
        const angle = (i * Math.PI) / rays - Math.PI / 2;
        const r = i % 2 === 0 ? outerR : innerR;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        pts.push(`${x},${y}`);
    }
    return pts.join(' ');
}

export type FlightLayout = {
    ox: number;
    oy: number;
    cxWin: number;
    cyWin: number;
    endXWin: number;
    endYWin: number;
};

export const STAR_PULSE_PEAK = STAR_CONFIG.SCALE_ANIMATION;

export const GRAIN_SIZE = 20;
export const GRAIN_HALF = GRAIN_SIZE / 2;
export const ARC_CAP_PX = 36;
