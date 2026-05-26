// outsource dependencies
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
// local dependencies
import Text from 'components/Text';
import { COLORS } from 'constants/colors';
import { OFFSET } from 'constants/offset';
import { useDayAdherence } from 'hooks/useDayAdherence';
import { ActivityRings } from 'components/ActivityRings';

interface DayAdherenceCardProps {
    date: string;
}

export const DayAdherenceCard: React.FC<DayAdherenceCardProps> = ({ date }) => {
    const { rings, overall, hasData } = useDayAdherence(date);

    if (!hasData) { return null; }

    const overallPct = Math.round(overall * 100);

    return (
        <Animated.View style={styles.card} entering={FadeIn.duration(400)}>
            <ActivityRings
                size={132}
                rings={rings}
                strokeWidth={12}
                // centerSubtext="done"
                centerText={`${overallPct}%`}
            />
            <View style={styles.legend}>
                {rings.map(ring => (
                    <View key={ring.key} style={styles.legendRow}>
                        <View style={[styles.dot, { backgroundColor: ring.color }]} />
                        <Text variant="h5" style={styles.legendLabel}>
                            {ring.label}
                        </Text>
                        <Text style={styles.legendValue} color={COLORS.GREY}>
                            {ring.total > 0 ? `${ring.done}/${ring.total}` : '—'}
                        </Text>
                    </View>
                ))}
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    card: {
        marginTop: 10,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        // paddingVertical: OFFSET.VERTICAL,
        backgroundColor: COLORS.WHITE,
        paddingHorizontal: OFFSET.HORIZONTAL,
        // marginBottom: OFFSET.VERTICAL,
    },
    legend: {
        flex: 1,
        marginLeft: OFFSET.HORIZONTAL,
    },
    legendRow: {
        paddingVertical: 6,
        flexDirection: 'row',
        alignItems: 'center',
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 10,
    },
    legendLabel: {
        flex: 1,
        color: COLORS.DARK_GREY,
    },
    legendValue: {
        fontSize: 14,
        fontWeight: '600',
    },
});
