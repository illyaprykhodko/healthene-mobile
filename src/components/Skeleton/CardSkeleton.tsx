// outsource dependencies
import React from 'react';
import { View, StyleSheet } from 'react-native';

// local dependencies
import { Skeleton } from './Skeleton';
import { OFFSET } from 'constants/offset';
import { useTheme } from 'hooks/useTheme';

interface CardSkeletonProps {
    showImage?: boolean;
    imageHeight?: number;
    lines?: number;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({
    imageHeight = 150,
    showImage = true,
    lines = 3,
}) => {
    const theme = useTheme();

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                },
            ]}
        >
            {showImage && (
                <Skeleton
                    width="100%"
                    borderRadius={0}
                    height={imageHeight}
                    style={styles.image}
                />
            )}
            <View style={styles.content}>
                <Skeleton
                    width="70%"
                    height={20}
                    borderRadius={4}
                    style={styles.title}
                />
                {Array.from({ length: lines }).map((_, index) => (
                    <Skeleton
                        key={index}
                        height={14}
                        borderRadius={4}
                        style={styles.line}
                        width={index === lines - 1 ? '50%' : '100%'}
                    />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
        marginBottom: OFFSET.VERTICAL,
    },
    image: {
        width: '100%',
    },
    content: {
        padding: OFFSET.HORIZONTAL,
    },
    title: {
        marginBottom: 12,
    },
    line: {
        marginBottom: 8,
    },
});

