// local dependencies
import { MAX_FONT_SCALE } from 'constants/typography';

// Deterministic list geometry for ShoppingList.
//
// `getItemLayout` must be EXACT, so a row's height cannot depend on how long a food name is. Both
// `ShoppingItem`'s style and the layout helper read these numbers, so they can never drift apart.
//
// Reserving NAME_MAX_LINES lines is what makes every row identical whether the name wraps or not.
// Drop it to 1 if the extra vertical breathing room is unwanted — the rest of the math follows.
export const NAME_MAX_LINES = 2;

const NAME_GAP = 16;           // name marginBottom 8 + itemInfo marginTop 8
const ROW_BORDER = 1;
const IMAGE_SIZE = 100;
const NAME_LINE_HEIGHT = 22;   // Text variant="h5"
const ROW_PADDING_VERTICAL = 16;

// Select button: 1px top border + input + label + 5px bottom border.
const SELECT_BORDER_TOP = 1;
const SELECT_INPUT_BORDER = 1;
const SELECT_BORDER_BOTTOM = 5;
const SELECT_INPUT_PADDING = 10;
const SELECT_INPUT_FONT_SIZE = 20;
const SELECT_INPUT_MIN_HEIGHT = 48;
const SELECT_LABEL_LINE_HEIGHT = 20;  // pinned explicitly in ShoppingItem — the `common` variant has none
const SELECT_LABEL_PADDING_BOTTOM = 2;

// Compact (CONFIRMED / SHOP_ON_MY_OWN) shows a plain amount pill instead of the select control.
const AMOUNT_CONTAINER_MIN_HEIGHT = 40;

// Section header: 16*2 padding + h3 line height + 1px border.
const HEADER_BORDER = 1;
const HEADER_LINE_HEIGHT = 28;  // Text variant="h3"
const HEADER_PADDING_VERTICAL = 16;

// `Text`/`TextInput` scale their line height by the OS font scale, capped at MAX_FONT_SCALE, so a
// literal height would clip at large Dynamic Type. Every height below tracks the same multiplier.
const effective = (fontScale: number) => Math.min(fontScale, MAX_FONT_SCALE);

const getSelectBlockHeight = (scale: number): number => {
    const input = Math.max(
        SELECT_INPUT_MIN_HEIGHT,
        Math.ceil(SELECT_INPUT_FONT_SIZE * scale) + SELECT_INPUT_PADDING * 2 + SELECT_INPUT_BORDER * 2,
    );
    const label = Math.ceil(SELECT_LABEL_LINE_HEIGHT * scale) + SELECT_LABEL_PADDING_BOTTOM;
    return SELECT_BORDER_TOP + input + label + SELECT_BORDER_BOTTOM;
};

/**
 * Height of one `ShoppingItem`.
 *
 * `compact` mirrors the branch where the select control is replaced by the read-only amount pill.
 */
export const getShoppingItemHeight = (fontScale: number, compact: boolean): number => {
    const scale = effective(fontScale);
    const nameHeight = Math.ceil(NAME_LINE_HEIGHT * scale) * NAME_MAX_LINES;
    const control = compact ? AMOUNT_CONTAINER_MIN_HEIGHT : getSelectBlockHeight(scale);
    const textColumn = nameHeight + NAME_GAP + control;
    return ROW_PADDING_VERTICAL * 2 + Math.max(IMAGE_SIZE, textColumn) + ROW_BORDER;
};

/** Height of the sticky section header. */
export const getSectionHeaderHeight = (fontScale: number): number =>
    HEADER_PADDING_VERTICAL * 2 + Math.ceil(HEADER_LINE_HEIGHT * effective(fontScale)) + HEADER_BORDER;

// Vertical space a row/header spends on padding and borders. Subtract from the total height to get
// the box the content actually has — that is what the __DEV__ overflow guard checks against.
export const ROW_CONTENT_INSET = ROW_PADDING_VERTICAL * 2 + ROW_BORDER;
export const HEADER_CONTENT_INSET = HEADER_PADDING_VERTICAL * 2 + HEADER_BORDER;
