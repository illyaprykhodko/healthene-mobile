import {
    getSectionOffsets,
    resolveActiveSectionIndex,
    createSectionListGetItemLayout,
} from '../src/utils/sectionListLayout';

const CONFIG = { itemHeight: 100, headerHeight: 60 };

// Two sections of 3 and 2 items. Flattened indices:
//   0 header(s0) | 1..3 items(s0) | 4 footer(s0) | 5 header(s1) | 6..7 items(s1) | 8 footer(s1)
const SECTIONS = [
    { title: 'a', data: [1, 2, 3] },
    { title: 'b', data: [4, 5] },
];

describe('createSectionListGetItemLayout', () => {
    const getItemLayout = createSectionListGetItemLayout<{ data: readonly number[] }>(CONFIG);

    test('maps the flattened [header, ...items, footer] index to exact offsets', () => {
        expect(getItemLayout(SECTIONS, 0)).toEqual({ index: 0, length: 60, offset: 0 });
        expect(getItemLayout(SECTIONS, 1)).toEqual({ index: 1, length: 100, offset: 60 });
        expect(getItemLayout(SECTIONS, 3)).toEqual({ index: 3, length: 100, offset: 260 });
        expect(getItemLayout(SECTIONS, 4)).toEqual({ index: 4, length: 0, offset: 360 });
        expect(getItemLayout(SECTIONS, 5)).toEqual({ index: 5, length: 60, offset: 360 });
        expect(getItemLayout(SECTIONS, 6)).toEqual({ index: 6, length: 100, offset: 420 });
        expect(getItemLayout(SECTIONS, 8)).toEqual({ index: 8, length: 0, offset: 620 });
    });

    test('accounts for a non-zero section footer', () => {
        const withFooter = createSectionListGetItemLayout<{ data: readonly number[] }>({ ...CONFIG, footerHeight: 20 });
        expect(withFooter(SECTIONS, 4)).toEqual({ index: 4, length: 20, offset: 360 });
        // Section 1's header now sits one footer lower.
        expect(withFooter(SECTIONS, 5)).toEqual({ index: 5, length: 60, offset: 380 });
    });

    test('an empty section still occupies exactly two indices', () => {
        const sections = [{ data: [] }, { data: [1] }];
        expect(getItemLayout(sections, 0)).toEqual({ index: 0, length: 60, offset: 0 });
        expect(getItemLayout(sections, 1)).toEqual({ index: 1, length: 0, offset: 60 });
        expect(getItemLayout(sections, 2)).toEqual({ index: 2, length: 60, offset: 60 });
    });

    test('listHeaderHeight shifts every offset', () => {
        const shifted = createSectionListGetItemLayout<{ data: readonly number[] }>({ ...CONFIG, listHeaderHeight: 40 });
        expect(shifted(SECTIONS, 0).offset).toBe(40);
        expect(shifted(SECTIONS, 5).offset).toBe(400);
    });

    test('out-of-range and null input degrade to a zero-height cell', () => {
        expect(getItemLayout(SECTIONS, 99)).toEqual({ index: 99, length: 0, offset: 620 });
        expect(getItemLayout(null, 0)).toEqual({ index: 0, length: 0, offset: 0 });
    });
});

describe('getSectionOffsets', () => {
    test('matches getItemLayout for every section header index', () => {
        const getItemLayout = createSectionListGetItemLayout<{ data: readonly number[] }>(CONFIG);
        expect(getSectionOffsets(SECTIONS, CONFIG)).toEqual([
            getItemLayout(SECTIONS, 0).offset,
            getItemLayout(SECTIONS, 5).offset,
        ]);
    });

    test('respects footer and list-header heights', () => {
        expect(getSectionOffsets(SECTIONS, { ...CONFIG, footerHeight: 20, listHeaderHeight: 40 })).toEqual([40, 420]);
    });
});

describe('resolveActiveSectionIndex', () => {
    // Four sections: a long one, then three short tails that can never reach the top of the screen.
    const OFFSETS = [0, 500, 620, 740];
    const CONTENT_HEIGHT = 860;
    const VIEWPORT = 400;
    const MAX_SCROLL = CONTENT_HEIGHT - VIEWPORT; // 460
    const STICKY = 60;

    const at = (y: number) => resolveActiveSectionIndex(
        OFFSETS,
        { y, contentHeight: CONTENT_HEIGHT, viewportHeight: VIEWPORT },
        STICKY,
    );

    test('the top of the list selects the first section', () => {
        expect(at(0)).toBe(0);
    });

    test('mid-list selects the section pinned under the sticky header', () => {
        // Reference line = 100 + 60 = 160, still inside section 0.
        expect(at(100)).toBe(0);
    });

    test('the tail glides through the short trailing sections', () => {
        const walked = [0, 100, 200, 300, 400, MAX_SCROLL].map(at);
        // Monotonically non-decreasing — the highlight never jumps backwards while scrolling down.
        expect(walked).toEqual([...walked].sort((a, b) => a - b));
        expect(new Set(walked).size).toBeGreaterThan(1);
    });

    test('the very bottom clamps to the last section', () => {
        expect(at(MAX_SCROLL)).toBe(OFFSETS.length - 1);
    });

    test('iOS rubber-band overscroll stays on the last section', () => {
        expect(at(MAX_SCROLL + 120)).toBe(OFFSETS.length - 1);
    });

    test('content shorter than the viewport always resolves to the first section', () => {
        expect(resolveActiveSectionIndex(
            OFFSETS,
            { y: 0, contentHeight: 300, viewportHeight: 400 },
            STICKY,
        )).toBe(0);
    });

    test('an empty section list resolves to 0', () => {
        expect(resolveActiveSectionIndex([], { y: 0, contentHeight: 900, viewportHeight: 400 }, STICKY)).toBe(0);
    });
});
