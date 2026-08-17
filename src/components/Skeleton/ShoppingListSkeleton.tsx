// outsource dependencies
import React from 'react';
import { View, StyleSheet } from 'react-native';

// local dependencies
import { OFFSET } from 'constants/offset';
import { useTheme } from 'hooks/useTheme';
import { Skeleton, useShimmerProgress } from './Skeleton';

// The screen supplies the exact heights it feeds to `getItemLayout`, so the skeleton cannot drift
// out of sync with what replaces it. The previous fixed ROW_HEIGHT = 75 (against real rows of
// ~133-169) made content visibly jump when the data landed.
const IMAGE_SIZE = 100;
const SECTION_SHAPE = [3, 2, 3];
const CHIP_WIDTHS = [58, 96, 72, 104, 80];

interface ShoppingListSkeletonProps {
    /** Real row height, from the screen's itemMetrics. */
    rowHeight: number;
    /** Mirror the compact (CONFIRMED / SHOP_ON_MY_OWN) row variant. */
    compact?: boolean;
    /** Item counts per placeholder section. */
    sections?: number[];
    /** Real sticky section header height, from the screen's itemMetrics. */
    headerHeight: number;
    /**
     * Stand in for HorizontalMenu. The real bar is kept unmounted while loading because its only
     * tab at that point is "All", so mounting it would show a lone chip that then expands.
     */
    showChips?: boolean;
}

export const ShoppingListSkeleton: React.FC<ShoppingListSkeletonProps> = ({
    rowHeight,
    headerHeight,
    compact = false,
    showChips = true,
    sections = SECTION_SHAPE,
}) => {
    const theme = useTheme();
    // One driver for the whole screen — every block pulses in phase on a single Reanimated loop.
    const progress = useShimmerProgress();

    return (
        <View style={styles.container}>
            {showChips && (
                <View style={styles.chipsRow}>
                    {CHIP_WIDTHS.map((width, index) => (
                        <Skeleton
                            key={index}
                            height={32}
                            width={width}
                            borderRadius={25}
                            progress={progress}
                            style={styles.chip}
                        />
                    ))}
                </View>
            )}
            {sections.map((rows, sectionIndex) => (
                <View key={sectionIndex}>
                    <View style={[styles.header, {
                        height: headerHeight,
                        backgroundColor: theme.colors.surfaceAlt,
                        borderBottomColor: theme.colors.border,
                    }]}>
                        <Skeleton width={150} height={24} progress={progress} />
                    </View>
                    {Array.from({ length: rows }).map((_, rowIndex) => (
                        <View
                            key={rowIndex}
                            style={[styles.row, { height: rowHeight, borderBottomColor: theme.colors.border }]}
                        >
                            <Skeleton width={IMAGE_SIZE} height={IMAGE_SIZE} progress={progress} />
                            <View style={styles.textColumn}>
                                <Skeleton width="70%" height={22} progress={progress} style={styles.titleLine} />
                                <Skeleton
                                    progress={progress}
                                    width={compact ? 60 : 67}
                                    height={compact ? 40 : 76}
                                    borderRadius={compact ? 20 : 10}
                                />
                            </View>
                        </View>
                    ))}
                </View>
            ))}
        </View>
    );
};

export default ShoppingListSkeleton;

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
        justifyContent: 'center',
        borderBottomWidth: 1,
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    row: {
        alignItems: 'center',
        flexDirection: 'row',
        borderBottomWidth: 1,
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    textColumn: {
        flex: 1,
        marginLeft: OFFSET.HORIZONTAL,
    },
    titleLine: {
        marginBottom: 16,
    },
});
