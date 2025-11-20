// outsource dependencies
import React from 'react';
import { View, StyleSheet } from 'react-native';

// local dependencies
import { Skeleton } from './Skeleton';
import { OFFSET } from 'constants/offset';
import { useTheme } from 'hooks/useTheme';

interface ListItemSkeletonProps {
    showImage?: boolean;
    lines?: number;
}

export const ListItemSkeleton: React.FC<ListItemSkeletonProps> = ({
    showImage = true,
    lines = 2,
}) => {
    const theme = useTheme();

    return (
        <View
            style={[
                styles.container,
                { borderBottomColor: theme.colors.border },
            ]}
        >
            {showImage && (
                <Skeleton
                    width={50}
                    height={50}
                    borderRadius={8}
                    style={styles.image}
                />
            )}
            <View style={styles.content}>
                {Array.from({ length: lines }).map((_, index) => (
                    <Skeleton
                        key={index}
                        borderRadius={4}
                        style={styles.line}
                        height={index === 0 ? 16 : 14}
                        width={index === 0 ? '80%' : '60%'}
                    />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: OFFSET.VERTICAL,
        paddingHorizontal: OFFSET.HORIZONTAL,
        borderBottomWidth: 1,
    },
    image: {
        marginRight: OFFSET.HORIZONTAL,
    },
    content: {
        flex: 1,
    },
    line: {
        marginBottom: 8,
    },
});
