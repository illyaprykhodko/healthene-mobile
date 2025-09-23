// Shared layout offsets
export const OFFSET = {
    HORIZONTAL: 16,
    VERTICAL: 20,
    POINT: 4,
} as const;

export type OffsetKey = keyof typeof OFFSET;
