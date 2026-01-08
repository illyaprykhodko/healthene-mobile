// outsource dependencies
import React from 'react';
import { View, StyleSheet } from 'react-native';

// local dependencies
import { Skeleton } from './Skeleton';
import { OFFSET } from 'constants/offset';
import { useTheme } from 'hooks/useTheme';

const TIMELINE_WIDTH = 50;
const ICON_SIZE = 55;
const ROW_HEIGHT = 75;

interface SkeletonListItemProps {
    index: number;
}

const SkeletonListItem: React.FC<SkeletonListItemProps> = ({ index }) => {
    const theme = useTheme();

    return (
        <View style={[styles.phaseItem, { borderBottomColor: theme.colors.border }]}>
            {index % 2 !== 0 && (<View style={styles.iconContainer}>
                <Skeleton width={ICON_SIZE} height={ICON_SIZE} />
            </View>)}
            {index % 2 === 0 && (
                <Skeleton height={35} borderRadius={4} />
            )}
            <View style={styles.contentContainer}>
                <Skeleton width="70%" height={18} borderRadius={4} style={styles.titleSkeleton} />
                <Skeleton width="40%" height={14} borderRadius={4} />
            </View>
            {index % 2 !== 0 && (<View style={styles.iconContainer}>
                <Skeleton width={25} height={25} />
            </View>)}
        </View>
    );
};

export const ShoppingListSkeleton: React.FC = () => {
    const skeletonCount = 9;
    return (
        <View style={styles.container}>
            <View style={styles.phasesList}>
                {Array.from({ length: skeletonCount }).map((_, index) => (
                    <SkeletonListItem key={index} index={index} />
                ))}
            </View>

            <Skeleton width="90%" height={60} borderRadius={30} style={styles.fabButton} />
            <View style={styles.bottomButtons}>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'relative',
    },
    header: {
        paddingHorizontal: OFFSET.HORIZONTAL,
        paddingVertical: OFFSET.VERTICAL,
    },
    timelineLine: {
        position: 'absolute',
        left: 40,
        top: 100,
        width: 1,
        height: ROW_HEIGHT * 6,
    },
    phasesList: {
        flex: 1,
    },
    phaseItem: {
        flexDirection: 'row',
        alignItems: 'center',
        height: ROW_HEIGHT,
        paddingHorizontal: OFFSET.HORIZONTAL,
        borderBottomWidth: 1,
    },
    timelineContainer: {
        width: TIMELINE_WIDTH,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        marginRight: OFFSET.HORIZONTAL,
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    titleSkeleton: {
        marginBottom: 8,
    },
    bottomButtons: {
        position: 'absolute',
        bottom: 20,
        // right: 20,
    },
    fabButton: {
        marginBottom: 20,
        marginHorizontal: 'auto',
        // For floating action button
    },
});
