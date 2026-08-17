// outsource dependencies
import React from 'react';
import { View, StyleSheet } from 'react-native';

// local dependencies
import { OFFSET } from 'constants/offset';
import { useTheme } from 'hooks/useTheme';
import { Skeleton, useShimmerProgress } from './Skeleton';

// Mirrors StockList's real geometry so swapping in real content does not shift a single pixel.
// Note the 16 / 20 asymmetry between header and row padding: the real screen genuinely has it
// (`styles.section` uses paddingLeft 16, `styles.itemContainer` uses padding 20), so the skeleton
// reproduces it rather than "fixing" it.
const IMAGE_SIZE = 80;
const ROW_HEIGHT = 121;      // 20 padding * 2 + 80 image + 1 border
const HEADER_HEIGHT = 57;    // 16 padding * 2 + 24 line-height (h4) + 1 border
const CHECKBOX_SIZE = 28;
const SECTION_SHAPE = [3, 2, 3];
const CHIP_WIDTHS = [92, 68, 110, 84, 74];

interface StockListSkeletonProps {
    /** Item counts per placeholder section. */
    sections?: number[];
}

export const StockListSkeleton: React.FC<StockListSkeletonProps> = ({ sections = SECTION_SHAPE }) => {
    const theme = useTheme();
    // One driver for the whole screen — every block pulses in phase on a single Reanimated loop.
    const progress = useShimmerProgress();

    return (
        <View style={styles.container}>
            <View style={styles.chipsRow}>
                {CHIP_WIDTHS.map((width, index) => (
                    <Skeleton
                        height={32}
                        key={index}
                        width={width}
                        borderRadius={25}
                        progress={progress}
                        style={styles.chip}
                    />
                ))}
            </View>

            {sections.map((rows, sectionIndex) => (
                <View key={sectionIndex}>
                    <View style={[styles.header, {
                        backgroundColor: theme.colors.surfaceAlt,
                        borderBottomColor: theme.colors.border,
                    }]}>
                        <Skeleton width={180} height={20} progress={progress} />
                    </View>
                    {Array.from({ length: rows }).map((_, rowIndex) => (
                        <View key={rowIndex} style={[styles.row, { borderBottomColor: theme.colors.border }]}>
                            <Skeleton
                                borderRadius={8}
                                width={IMAGE_SIZE}
                                height={IMAGE_SIZE}
                                progress={progress}
                            />
                            <View style={styles.textColumn}>
                                <Skeleton width="72%" height={20} progress={progress} style={styles.titleLine} />
                                <Skeleton width="38%" height={16} progress={progress} />
                            </View>
                            <Skeleton
                                borderRadius={5}
                                progress={progress}
                                width={CHECKBOX_SIZE}
                                height={CHECKBOX_SIZE}
                            />
                        </View>
                    ))}
                </View>
            ))}
        </View>
    );
};

export default StockListSkeleton;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // Trailing placeholder rows clip at the viewport edge instead of forcing the screen to scroll.
        overflow: 'hidden',
    },
    chipsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 10,
    },
    chip: {
        marginHorizontal: 10,
    },
    header: {
        height: HEADER_HEIGHT,
        justifyContent: 'center',
        borderBottomWidth: 1,
        paddingLeft: OFFSET.HORIZONTAL,
    },
    row: {
        padding: 20,
        height: ROW_HEIGHT,
        alignItems: 'center',
        flexDirection: 'row',
        borderBottomWidth: 1,
    },
    textColumn: {
        flex: 1,
        marginLeft: OFFSET.HORIZONTAL,
    },
    titleLine: {
        marginBottom: 8,
    },
});
