// Exact geometry helpers for React Native's `SectionList`.
//
// RN flattens a SectionList into a single VirtualizedList index where EVERY section contributes
// `[header, ...items, footer]` — the footer slot exists even when `renderSectionFooter` is
// undefined (it renders `null`, height 0). See `VirtualizedSectionList._getItem`:
// `itemIdx = index - 1`, then `itemIdx -= itemCount + 2` per section. Which gives:
//
//   header(s) = Σ_{j<s} (count_j + 2)
//   item(s,k) = header(s) + 1 + k
//   footer(s) = header(s) + count_s + 1
//
// This module is a local replacement for `react-native-section-list-get-item-layout`, plus the
// scroll-position → active-section resolution used to keep a category tab bar in sync.

export interface ItemLayout {
    index: number;
    length: number;
    offset: number;
}

export interface SectionLayoutConfig {
    /** Height of a single data row. Must equal the RENDERED height exactly. */
    itemHeight: number;
    /** Height of `renderSectionHeader` output. */
    headerHeight: number;
    /** Height of `renderSectionFooter` output. 0 when the prop is not provided. */
    footerHeight?: number;
    /** Height of `ListHeaderComponent`, if any — RN treats getItemLayout offsets as absolute. */
    listHeaderHeight?: number;
}

interface SectionLike {
    data: readonly unknown[];
}

export interface ScrollMetrics {
    y: number;
    contentHeight: number;
    viewportHeight: number;
}

/**
 * Builds an exact `getItemLayout` for a SectionList.
 *
 * Without it `scrollToLocation` cannot reach a section outside the render window — it falls through
 * to `onScrollToIndexFailed` — and every offset-based calculation has to guess row heights.
 */
export const createSectionListGetItemLayout = <S extends SectionLike>(config: SectionLayoutConfig) => {
    const { itemHeight, headerHeight, footerHeight = 0, listHeaderHeight = 0 } = config;

    return (sections: readonly S[] | null, index: number): ItemLayout => {
        let offset = listHeaderHeight;
        let cursor = 0;

        for (const section of sections ?? []) {
            const count = section.data.length;

            if (index === cursor) { return { length: headerHeight, offset, index }; }
            offset += headerHeight;
            cursor += 1;

            if (index < cursor + count) {
                return { length: itemHeight, offset: offset + (index - cursor) * itemHeight, index };
            }
            offset += count * itemHeight;
            cursor += count;

            if (index === cursor) { return { length: footerHeight, offset, index }; }
            offset += footerHeight;
            cursor += 1;
        }

        // Out of range — report a zero-height cell at the end of the content.
        return { length: 0, offset, index };
    };
};

/**
 * Absolute content offset of every section header, in the same coordinate space as
 * `contentOffset.y`. Compute once per `sections` identity and reuse for tab <-> scroll sync.
 */
export const getSectionOffsets = <S extends SectionLike>(
    sections: readonly S[],
    { itemHeight, headerHeight, footerHeight = 0, listHeaderHeight = 0 }: SectionLayoutConfig,
): number[] => {
    let offset = listHeaderHeight;

    return sections.map(section => {
        const headerOffset = offset;
        offset += headerHeight + section.data.length * itemHeight + footerHeight;
        return headerOffset;
    });
};

/**
 * Which section "owns" the current scroll position?
 *
 * For most of the list the answer is "the one whose header is pinned at the top", so the reference
 * line sits `stickyHeaderHeight` below the top edge. Subtracting the sticky header is what stops the
 * highlight from lagging one section behind its own pinned title.
 *
 * That rule alone can never reach the LAST sections: once the remaining content is shorter than the
 * viewport, no further header can climb to the top. So across the final screenful the reference line
 * glides down to the bottom edge, and at `y === maxScroll` it points exactly at the last section.
 * That is the end-of-content clamp, without the multi-chip jump a binary clamp would produce.
 */
export const resolveActiveSectionIndex = (
    offsets: readonly number[],
    { y, contentHeight, viewportHeight }: ScrollMetrics,
    stickyHeaderHeight: number,
): number => {
    if (offsets.length === 0) { return 0; }

    const maxScroll = contentHeight - viewportHeight;
    // Content fits on one screen — nothing can ever scroll, so the first section always wins.
    if (maxScroll <= 1) { return 0; }

    // 0 for the bulk of the list, ramping to 1 over the final viewport. Clamped so iOS rubber-band
    // overscroll (y > maxScroll) stays pinned to the last section instead of wrapping around.
    const tailBlend = Math.min(1, Math.max(0, 1 - (maxScroll - y) / viewportHeight));
    const focusY = y + stickyHeaderHeight + tailBlend * Math.max(0, viewportHeight - stickyHeaderHeight);

    for (let i = offsets.length - 1; i >= 0; i--) {
        if (offsets[i] <= focusY) { return i; }
    }
    return 0;
};
