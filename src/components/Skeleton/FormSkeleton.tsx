// outsource dependencies
import React from 'react';
import { View, StyleSheet } from 'react-native';

// local dependencies
import { Skeleton } from './Skeleton';
import { OFFSET } from 'constants/offset';

interface FormSkeletonProps {
    fields?: number;
}

export const FormSkeleton: React.FC<FormSkeletonProps> = ({ fields = 4 }) => {
    return (
        <View style={styles.container}>
            {Array.from({ length: fields }).map((_, index) => (
                <View key={index} style={styles.field}>
                    <Skeleton width="30%" height={14} borderRadius={4} style={styles.label} />
                    <Skeleton width="100%" height={48} borderRadius={8} />
                </View>
            ))}
            <Skeleton width="100%" height={50} borderRadius={8} style={styles.button} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: OFFSET.HORIZONTAL,
        paddingVertical: OFFSET.VERTICAL,
    },
    field: {
        marginBottom: OFFSET.VERTICAL * 1.5,
    },
    label: {
        marginBottom: 8,
    },
    button: {
        marginTop: OFFSET.VERTICAL,
    },
});
