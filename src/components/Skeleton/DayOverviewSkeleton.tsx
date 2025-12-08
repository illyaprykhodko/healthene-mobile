// outsource dependencies
import React from 'react';
import { View, StyleSheet } from 'react-native';

// local dependencies
import { Skeleton } from './Skeleton';
import { OFFSET } from 'constants/offset';
import { useTheme } from 'hooks/useTheme';
import { AnytimeMenuSkeleton } from './AnytimeMenuSkeleton';

const TIMELINE_WIDTH = 50;
const ICON_SIZE = 40;
const ROW_HEIGHT = 75;

interface SkeletonPhaseItemProps {
    index: number;
}

const SkeletonPhaseItem: React.FC<SkeletonPhaseItemProps> = ({ index }) => {
    const theme = useTheme();

    return (
        <View style={[styles.phaseItem, { borderBottomColor: theme.colors.border }]}>
            {/* Timeline dot */}
            <View style={styles.timelineContainer}>
                <Skeleton width={8} height={8} borderRadius={4} />
            </View>

            {/* Icon */}
            <View style={styles.iconContainer}>
                <Skeleton width={ICON_SIZE} height={ICON_SIZE} borderRadius={ICON_SIZE / 2} />
            </View>

            {/* Content */}
            <View style={styles.contentContainer}>
                <Skeleton width="70%" height={18} borderRadius={4} style={styles.titleSkeleton} />
                <Skeleton width="40%" height={14} borderRadius={4} />
            </View>
        </View>
    );
};

export const DayOverviewSkeleton: React.FC = () => {
    const theme = useTheme();
    const skeletonCount = 7;

    return (
        <View style={styles.container}>
            {/* Header skeleton */}
            <View style={styles.header}>
                <Skeleton width={120} height={24} borderRadius={4} />
            </View>

            {/* Timeline line */}
            <View
                style={[
                    styles.timelineLine,
                    {
                        backgroundColor: theme.colors.grey,
                        opacity: 0.3,
                    },
                ]}
            />

            {/* Phase items */}
            <View style={styles.phasesList}>
                {Array.from({ length: skeletonCount }).map((_, index) => (
                    <SkeletonPhaseItem key={index} index={index} />
                ))}
            </View>

            {/* Bottom buttons skeleton */}
            <View style={styles.bottomButtons}>
                <AnytimeMenuSkeleton />
                {/* <Skeleton width={60} height={60} borderRadius={30} style={styles.fabButton} /> */}
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
        left: TIMELINE_WIDTH / 2,
        top: 80,
        width: 1,
        height: ROW_HEIGHT * 5,
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
        // For floating action button
    },
});
