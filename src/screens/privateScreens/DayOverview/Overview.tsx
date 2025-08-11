// outsource dependencies
import moment from 'moment';
import React, { useMemo } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
// local dependencies
import Text from '../../../components/Text';
import { useAppSelector } from '../../../store';
import Screen from '../../../components/Screen';
import { useTheme } from '../../../hooks/useTheme';
import { COLORS } from '../../../constants/colors';
import { selectDayOverview } from '../../../store/slices/dayOverviewSlice';
import { useGetDayOverviewQuery, Phase } from '../../../store/api/dayOverviewApi';

// Temporary types
export type PhaseType = 'MEAL' | 'MEASUREMENT' | 'SUPPLEMENT' | 'MEDICATION' | 'ADDED_BY_PATIENT' | 'PHYSICAL_ACTIVITY';

interface PhaseItem {
    title: string;
    type: PhaseType;
    id: string | number;
    status?: 'DONE' | 'PENDING' | 'INCOMPLETE';
}

const TIMELINE_WIDTH = 50;
const ICON_SIZE = 40;
const DOT_SIZE = 8;
const CONNECTOR_WIDTH = 1;
const ROW_HEIGHT = 75; // Height of each row for vertical connector calculation
const GAP_SIZE = 15; // Gap around dots

const DottedLine: React.FC<{ width: number; height: number; color: string }> = ({ width, height, color }) => {
    const dots = [];
    const dotSize = 2;
    const gap = 3;
    const totalDots = Math.floor(width / (dotSize + gap));
  
    for (let i = 0; i < totalDots; i++) {
        dots.push(
            <View
                key={i}
                style={{
                    width: dotSize,
                    height: height,
                    marginRight: gap,
                    backgroundColor: color,
                }}
            />
        );
    }

    return (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {dots}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: {
        flex: 1,
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 20,
        position: 'relative',
        height: ROW_HEIGHT,
    },
    leftColumn: {
        width: TIMELINE_WIDTH,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    verticalConnectorSegment: {
        position: 'absolute',
        width: CONNECTOR_WIDTH,
        left: TIMELINE_WIDTH / 2 - CONNECTOR_WIDTH / 2,
        backgroundColor: COLORS.GREY,
    },
    phaseDot: {
        width: DOT_SIZE,
        height: DOT_SIZE,
        borderRadius: DOT_SIZE / 2,
        backgroundColor: COLORS.GREY,
        position: 'absolute',
        left: TIMELINE_WIDTH / 2 - DOT_SIZE / 2,
        zIndex: 2,
    },
    horizontalConnector: {
        position: 'absolute',
        left: TIMELINE_WIDTH / 2 + GAP_SIZE,
        zIndex: 1,
    },
    iconWrapper: {
        width: ICON_SIZE,
        height: ICON_SIZE,
        borderRadius: ICON_SIZE / 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 20,
    },
    rightContent: {
        flex: 1,
        paddingLeft: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.DARK_GREY,
        marginVertical: 16,
    },
});

const getIconColorByType = (type: PhaseType) => {
    switch (type) {
        case 'MEAL':
            return { bg: '#FFD9B3', fg: '#C56A00', name: 'utensils' as const };
        case 'ADDED_BY_PATIENT':
            return { bg: '#D4E09B', fg: '#647C2E', name: 'plus' as const };
        case 'MEASUREMENT':
            return { bg: COLORS.LIGHT_GREY, fg: COLORS.BLACK, name: 'ruler' as const };
        case 'SUPPLEMENT':
        case 'MEDICATION':
            return { bg: COLORS.LIGHT_GREY, fg: COLORS.BLACK, name: 'capsules' as const };
        case 'PHYSICAL_ACTIVITY':
            return { bg: '#F9C1C3', fg: COLORS.BLACK, name: 'running' as const };
        default:
            return { bg: COLORS.LIGHTER_GREY, fg: COLORS.DARK_GREY, name: 'dot-circle' as const };
    }
};

export const Overview: React.FC = () => {
    const theme = useTheme();
    const { date } = useAppSelector(selectDayOverview);
    const currentDate = date || moment().format('YYYY-MM-DD');

    const { data, isLoading, error } = useGetDayOverviewQuery(currentDate, {
        skip: !currentDate,
        refetchOnMountOrArgChange: true
    });

    const phases: PhaseItem[] = useMemo(() => {
        if (!data?.phases) { return []; }
        return data.phases.map((p: Phase) => ({
            id: p.id,
            type: p.type as PhaseType,
            title: p.meal?.name || p.measurement?.measurement?.name || p.name || 'Item',
            status: p.status as 'DONE' | 'PENDING' | 'INCOMPLETE',
        }));
    }, [data]);

    const verticalSegments = useMemo(() => {
        if (phases.length <= 1) { return []; }
    
        const segments = [];
        for (let i = 0; i < phases.length - 1; i++) {
            const top = (i + 1) * ROW_HEIGHT - GAP_SIZE;
            const height = GAP_SIZE * 2;
      
            segments.push(
                <View
                    key={`segment-${i}`}
                    style={[
                        styles.verticalConnectorSegment,
                        {
                            top,
                            height,
                        }
                    ]}
                />
            );
        }
        return segments;
    }, [phases.length]);

    if (isLoading) {
        return (
            <Screen initialized={true} style={styles.container}>
                <View style={styles.content}>
                    <Text variant="h3" style={{ marginTop: 12, marginBottom: 8, color: theme.colors.text }}>
            Loading...
                    </Text>
                </View>
            </Screen>
        );
    }

    return (
        <Screen initialized={true} style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>
          My Daily Plan
                </Text>

                <View style={{ position: 'relative' }}>
                    {verticalSegments}
          
                    <FlatList
                        data={phases}
                        scrollEnabled={false}
                        keyExtractor={item => String(item.id)}
                        renderItem={({ item, index }) => {
                            const { bg, fg, name } = getIconColorByType(item.type);

                            return (
                                <View key={String(item.id)} style={styles.row}>
                                    <View style={styles.leftColumn}>
                                        <View style={styles.phaseDot} />
                                        <View style={styles.horizontalConnector}>
                                            <DottedLine width={25} height={1} color={COLORS.GREY} />
                                        </View>
                                    </View>
                                    <View style={[styles.iconWrapper, { backgroundColor: bg }]}>
                                        <Icon name={name} color={fg} size={18} />
                                    </View>
                                    <View style={styles.rightContent}>
                                        <Text variant="h4" style={{ color: theme.colors.text }}>
                                            {item.title}
                                        </Text>
                                    </View>
                                </View>
                            );
                        }}
                    />
                </View>
            </View>
        </Screen>
    );
};

export default Overview;
