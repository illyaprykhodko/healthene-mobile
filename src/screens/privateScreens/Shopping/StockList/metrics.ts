// local dependencies
import { MAX_FONT_SCALE } from 'constants/typography';

// Deterministic list geometry for StockList.
//
// `getItemLayout` and the chip-sync math derive from these numbers, and `StockListItem` / the section
// header apply them as explicit heights — so the rendered height and the reported height can never
// drift apart. That is what makes `scrollToLocation` land exactly and the active-category highlight
// accurate; the previous ITEM_HEIGHT_APPROX = 121 / SECTION_HEADER_HEIGHT = 53 estimates accumulated
// error down the list (the header was actually 57px, and rows with wrapping names were taller).
export const ROW_BORDER = 1;
export const IMAGE_SIZE = 80;
export const ROW_PADDING = 20;
export const NAME_MAX_LINES = 2;
export const NAME_LINE_HEIGHT = 22;   // Text variant="h5"
export const WEIGHT_LINE_HEIGHT = 20; // Text variant="h6"

export const HEADER_BORDER = 1;
export const HEADER_LINE_HEIGHT = 24; // Text variant="h4"
export const HEADER_PADDING_VERTICAL = 16;

// `Text` scales an explicit lineHeight by the OS font scale, capped at MAX_FONT_SCALE, so a
// hardcoded height would clip at large Dynamic Type. Both heights track the same effective scale.
const effective = (fontScale: number) => Math.min(fontScale, MAX_FONT_SCALE);

/** 20*2 padding + max(80px thumbnail, two name lines + one weight line) + 1px border. */
export const getStockItemHeight = (fontScale: number): number => {
    const textBlock = (NAME_LINE_HEIGHT * NAME_MAX_LINES + WEIGHT_LINE_HEIGHT) * effective(fontScale);
    return ROW_PADDING * 2 + Math.max(IMAGE_SIZE, Math.ceil(textBlock)) + ROW_BORDER;
};

/** 16*2 padding + h4 line height + 1px border. */
export const getStockHeaderHeight = (fontScale: number): number =>
    HEADER_PADDING_VERTICAL * 2 + Math.ceil(HEADER_LINE_HEIGHT * effective(fontScale)) + HEADER_BORDER;

// Vertical space a row/header spends on padding and borders. Subtract from the total height to get
// the box the content actually has — that is what the __DEV__ overflow guard checks against.
export const ROW_CONTENT_INSET = ROW_PADDING * 2 + ROW_BORDER;
export const HEADER_CONTENT_INSET = HEADER_PADDING_VERTICAL * 2 + HEADER_BORDER;
