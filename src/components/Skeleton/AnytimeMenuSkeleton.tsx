// outsource dependencies
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';

// local dependencies
import { Skeleton } from './Skeleton';
import { useTheme } from 'hooks/useTheme';

export const AnytimeMenuSkeleton: React.FC = () => {
    const theme = useTheme();

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: theme.colors.surface,
                    borderTopColor: theme.colors.grey,
                },
            ]}
        >
            {Array.from({ length: 5 }).map((_, index) => (
                <View key={index} style={styles.iconButton}>
                    <Skeleton width={48} height={48} borderRadius={24} />
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderTopWidth: 2,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 5,
        marginBottom: Platform.OS === 'ios' ? 16 : 0,
    },
    iconButton: {
        // width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
    },
});
