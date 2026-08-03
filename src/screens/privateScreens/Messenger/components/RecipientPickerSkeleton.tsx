// outsource dependencies
import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

// local dependencies
import { OFFSET } from 'constants/offset';
import { useTheme } from 'hooks/useTheme';
import { Skeleton } from 'components/Skeleton';

interface RecipientPickerSkeletonProps {
    /**
     * How many fake rows to render. Default 8 — roughly fills a phone screen
     * after the search input + role chips and a section header are accounted for.
     */
    rows?: number;
}

const RecipientPickerSkeletonComponent: React.FC<RecipientPickerSkeletonProps> = ({ rows = 8 }) => {
    const theme = useTheme();

    return (
        <View>
            <View
                style={[
                    styles.sectionHeader,
                    { backgroundColor: theme.colors.surfaceAlt, borderBottomColor: theme.colors.border },
                ]}
            >
                <Skeleton width={90} height={12} borderRadius={3} />
                <Skeleton width={24} height={12} borderRadius={3} />
            </View>
            {Array.from({ length: rows }).map((_, index) => (
                <View
                    key={index}
                    style={[styles.row, { borderBottomColor: theme.colors.border }]}
                >
                    <Skeleton width={44} height={44} borderRadius={22} style={styles.avatar} />
                    <View style={styles.body}>
                        <Skeleton width="60%" height={14} borderRadius={4} style={styles.line} />
                        <Skeleton width="40%" height={12} borderRadius={4} />
                    </View>
                </View>
            ))}
        </View>
    );
};

export const RecipientPickerSkeleton = memo(RecipientPickerSkeletonComponent);
export default RecipientPickerSkeleton;

const styles = StyleSheet.create({
    sectionHeader: {
        paddingHorizontal: OFFSET.HORIZONTAL,
        paddingVertical: OFFSET.POINT * 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: OFFSET.VERTICAL / 2,
        paddingHorizontal: OFFSET.HORIZONTAL,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    avatar: {
        marginRight: OFFSET.HORIZONTAL,
    },
    body: {
        flex: 1,
    },
    line: {
        marginBottom: 6,
    },
});
