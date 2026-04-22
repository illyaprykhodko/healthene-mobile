/** Red star (SVG). Short rays via RAY_LENGTH; pulse uses SCALE_ANIMATION / SCALE_DURATION. */
export const STAR_CONFIG = {
    RAYS_COUNT: 18,
    WIDTH: 160,
    HEIGHT: 160,
    /** How far outer peaks extend beyond inner valleys (px) — keep small for subtle spikes. */
    RAY_LENGTH: 5,
    SCALE_ANIMATION: 1.15,
    SCALE_DURATION: 300,
    /** Opacity fade-out after grains + pulse + counter bump complete (ms). */
    FADE_OUT_AFTER_REWARD_MS: 1000,
    /**
     * Placement inside the full-screen reward overlay (dp). The overlay already sits below the
     * app header / stack chrome, so `TOP_FROM_SAFE_AREA: 0` is the top of that layer — not the
     * physical screen notch (do not add safe-area here; that pushed the star down twice).
     */
    POSITION: {
        TOP_FROM_SAFE_AREA: 0,
        ALIGN_HORIZONTAL: 'center' as 'left' | 'center' | 'right',
        OFFSET_X: 0,
    },
} as const;

/** Counter inside star (global cumulative; starts at 0). */
export const COUNTER_CONFIG = {
    INITIAL_VALUE: 0,
    FONT_SIZE: 18,
} as const;

/**
 * Grains flight + star pulse. COUNTER_INCREMENT per completed flight (after grains + pulse).
 * STAR_SCALE should match STAR_CONFIG.SCALE_ANIMATION for one pulse knob.
 */
export const ANIMATION_CONFIG = {
    /** Number of grain images per tap (plan: 5–8). */
    GRAIN_COUNT: 6,
    /** Delay between each grain starting (ms). */
    GRAIN_STAGGER_MS: 32,
    /** Each grain’s fly segment duration (ms). */
    FLY_DURATION: 520,
    /** Arc perpendicular offset scale (max px capped in overlay). */
    PARTICLE_RADIUS: 48,
    STAR_SCALE: 1.15,
    COUNTER_INCREMENT: 1,
    /** Slight horizontal spread at launch (px). */
    SEED_SPREAD_PX: 5,
} as const;

/** Total timeline = stagger tail + one full grain flight (used by master progress). */
export const getGrainFlightTotalDurationMs = (): number =>
    ANIMATION_CONFIG.FLY_DURATION
    + (ANIMATION_CONFIG.GRAIN_COUNT - 1) * ANIMATION_CONFIG.GRAIN_STAGGER_MS;
