// outsource dependencies
import React, { memo } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

// local dependencies
import Text from 'components/Text';
import { OFFSET } from 'constants/offset';
import { useTheme } from 'hooks/useTheme';
import { Skeleton, useShimmerProgress } from 'components/Skeleton/Skeleton';

export type ListFooterState = 'idle' | 'loading' | 'end';

interface ListFooterLoaderProps {
    /** Number of placeholder rows. 2 reads as "more is coming" without dominating the viewport. */
    rows?: number;
    /** MUST match the real row height so the scroll position does not jump when the page lands. */
    rowHeight: number;
    /** Leading square placeholder size — 100 for ShoppingItem, 80 for StockList. */
    imageSize?: number;
    /** Extra bottom padding, e.g. to clear a floating bottom bar. */
    bottomInset?: number;
    /** idle = nothing to show, loading = next page in flight, end = every page is in the cache. */
    state: ListFooterState;
    /** Terminal copy. `null` renders nothing (e.g. single-page lists). */
    endLabel?: string | null;
    style?: StyleProp<ViewStyle>;
}

interface SkeletonRowProps {
    height: number;
    imageSize: number;
    progress: SharedValue<number>;
}

const SkeletonRow: React.FC<SkeletonRowProps> = ({ height, imageSize, progress }) => {
    const theme = useTheme();

    return (
        <View style={[styles.row, { height, borderBottomColor: theme.colors.border }]}>
            <Skeleton progress={progress} width={imageSize} height={imageSize} borderRadius={8} />
            <View style={styles.rowContent}>
                <Skeleton progress={progress} width="72%" height={18} style={styles.line} />
                <Skeleton progress={progress} width="42%" height={14} />
            </View>
        </View>
    );
};

/**
 * Three-state footer for paginated lists.
 *
 * The `loading` state renders skeleton rows of exactly the real row height, so real content replaces
 * them pixel for pixel with no scroll jump — which is the point over a bare spinner: the user sees
 * the shape of what is arriving. The `end` state is what removes the "nothing else loaded" doubt.
 */
const ListFooterLoaderComponent: React.FC<ListFooterLoaderProps> = ({
    state,
    style,
    rows = 2,
    rowHeight,
    imageSize = 100,
    bottomInset = 0,
    endLabel = null,
}) => {
    const theme = useTheme();
    // One loop for every placeholder block in the footer.
    const progress = useShimmerProgress();

    if (state === 'loading') {
        return (
            <View
                style={[{ paddingBottom: bottomInset }, style]}
                accessibilityLabel="Loading more items"
            >
                {Array.from({ length: rows }, (_, index) => (
                    <SkeletonRow key={index} height={rowHeight} imageSize={imageSize} progress={progress} />
                ))}
            </View>
        );
    }

    if (state === 'end' && endLabel) {
        return (
            <View style={[styles.end, { paddingBottom: OFFSET.VERTICAL + bottomInset }, style]}>
                <View style={[styles.rule, { backgroundColor: theme.colors.border }]} />
                <Text variant="caption" textAlign="center" color={theme.colors.textSecondary}>{endLabel}</Text>
                <View style={[styles.rule, { backgroundColor: theme.colors.border }]} />
            </View>
        );
    }

    return bottomInset ? <View style={{ height: bottomInset }} /> : null;
};

ListFooterLoaderComponent.displayName = 'ListFooterLoader';

export const ListFooterLoader = memo(ListFooterLoaderComponent);
export default ListFooterLoader;

const styles = StyleSheet.create({
    row: {
        alignItems: 'center',
        flexDirection: 'row',
        borderBottomWidth: 1,
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    rowContent: {
        flex: 1,
        marginLeft: OFFSET.HORIZONTAL,
    },
    line: {
        marginBottom: 8,
    },
    end: {
        alignItems: 'center',
        flexDirection: 'row',
        paddingTop: OFFSET.VERTICAL,
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    rule: {
        flex: 1,
        height: 1,
        marginHorizontal: OFFSET.POINT * 3,
    },
});
