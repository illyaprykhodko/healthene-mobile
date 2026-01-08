// outsource dependencies
import React from 'react';
import { View, StyleSheet } from 'react-native';

// local dependencies
import { Skeleton } from './Skeleton';
import { OFFSET } from 'constants/offset';

export const ShoppingPreferencesSkeleton: React.FC = () => {
    const skeletonCount = 4;

    return (
        <View style={styles.container}>
            <View style={styles.grid}>
                <Skeleton width="75%" height={35} style={styles.title} />
                {Array.from({ length: skeletonCount }).map((_, i) => (
                    <View key={i} style={styles.gridItem}>
                        <Skeleton width="100%" height={100} borderRadius={8} />
                    </View>
                ))}
                <View style={styles.buttonContainer}>
                    <Skeleton width="100%" height={60} borderRadius={30} style={styles.button} />
                    <Skeleton width="100%" height={60} borderRadius={30} style={styles.button} />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: OFFSET.HORIZONTAL,
        justifyContent: 'center',
        // alignItems: 'center',
    },
    section: {
        marginBottom: OFFSET.VERTICAL * 3,
    },
    title: {
        marginTop: OFFSET.VERTICAL,
        marginBottom: OFFSET.VERTICAL * 3,
    },
    spacer: {
        height: OFFSET.VERTICAL,
    },
    spacerSmall: {
        marginBottom: 8,
    },
    profileSkeleton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: OFFSET.HORIZONTAL,
    },
    profileInfo: {
        flex: 1,
        marginLeft: OFFSET.HORIZONTAL,
    },
    grid: {
        // flexDirection: 'row',
        // flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    gridItem: {
        width: '95%',
        marginBottom: OFFSET.VERTICAL * 2,
    },
    buttonContainer: {
        flexDirection: 'row',
        // justifyContent: 'space-between',
        // alignItems: 'center',
    },
    button: {
        // marginBottom: OFFSET.VERTICAL * 2,
        width: '45%',
        marginRight: OFFSET.HORIZONTAL,
    },
});
