
// outsource dependencies
import moment from 'moment/moment';
import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';

// local dependencies
import {
    FoodIcon,
    DrinkIcon,
    ActivityIcon,
    SupplementIcon,
    MeasurementIcon,
} from './AnytimeIcons';
import { Badge } from './Badge';
import { useTheme } from 'hooks/useTheme';
import { AnytimeModal } from './AnytimeModal';
import { PHASE_ITEM_STATUS } from 'constants/spec';
import type { AnytimeItemType } from 'types/anytime';
import { useAnytimeData } from 'hooks/useAnytimeData';
import PressableScale from 'components/PressableScale';
import { AnytimeExercisesModal } from './AnytimeExercisesModal';
import { useGetDayOverviewQuery } from 'store/api/dayOverviewApi';

interface AnytimeMenuProps {
    date?: string;
    disabled?: boolean;
    modalMaxHeight?: number;
    modalFullScreen?: boolean;
}

export const AnytimeMenu: React.FC<AnytimeMenuProps> = ({
    date,
    modalMaxHeight,
    disabled = false,
    modalFullScreen = true,
}) => {
    const theme = useTheme();
    const { data, counts, isLoading, hasAnytimePhase } = useAnytimeData(date);
    const { data: dayOverviewData } = useGetDayOverviewQuery(date || new Date().toISOString().split('T')[0]);
    const [activeModal, setActiveModal] = useState<AnytimeItemType | null>(null);
    const [showExercisesModal, setShowExercisesModal] = useState(false);
    const isFutureDay = moment(date).isAfter(moment(), 'day');

    const handleIconPress = (type: AnytimeItemType) => {
        if (disabled || isLoading) { return; }

        if (type === 'PHYSICAL_ACTIVITY') {
            setShowExercisesModal(true);
        } else {
            setActiveModal(type);
        }
    };

    const handleCloseModal = () => {
        setActiveModal(null);
    };

    const handleCloseExercisesModal = () => {
        setShowExercisesModal(false);
    };

    const getModalProps = (type: AnytimeItemType) => {
        switch (type) {
            case 'FOOD':
                return {
                    icon: 'utensils',
                    items: data.foods,
                    title: 'Anytime Foods',
                };
            case 'DRINK':
                return {
                    items: data.drinks,
                    icon: 'glass-martini',
                    title: 'Anytime Drinks',
                };
            case 'SUPPLEMENT':
                return {
                    icon: 'capsules',
                    items: data.supplements,
                    title: 'Anytime Supplements',
                };
            case 'MEASUREMENT':
                return {
                    icon: 'ruler',
                    items: data.measurements,
                    title: 'Anytime Measurements',
                };
            case 'PHYSICAL_ACTIVITY':
                return {
                    icon: 'running',
                    title: 'Exercise',
                    items: data.physicalActivities,
                };
            default:
                return {
                    icon: '',
                    title: '',
                    items: [],
                };
        }
    };

    const exercisePendingCount = useMemo(() => {
        const anytimePhase = dayOverviewData?.phases?.find(phase => phase.type === 'ANYTIME');
        const anytimeItems = anytimePhase?.items || [];
        const exerciseItems = anytimeItems.filter(item =>
            item.type?.startsWith('EXERCISE_') || item.type === 'PHYSICAL_ACTIVITY');
        return exerciseItems.filter(item => item.status === PHASE_ITEM_STATUS.PENDING).length;
    }, [dayOverviewData]);

    // Don't render if there's no anytime phase
    if (!hasAnytimePhase) {
        return null;
    }

    return (
        <>
            <View style={[
                styles.container,
                isFutureDay && styles.opacityFuture,
                { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.blue }
            ]}>
                <PressableScale
                    style={styles.iconButton}
                    disabled={disabled || isLoading}
                    onPress={() => handleIconPress('FOOD')}
                >
                    <Badge count={counts.foods}>
                        <FoodIcon disabled={!counts.foods || disabled || isLoading} />
                    </Badge>
                </PressableScale>

                <PressableScale
                    style={styles.iconButton}
                    disabled={disabled || isLoading}
                    onPress={() => handleIconPress('DRINK')}
                >
                    <Badge count={counts.drinks}>
                        <DrinkIcon disabled={!counts.drinks || disabled || isLoading} />
                    </Badge>
                </PressableScale>

                <PressableScale
                    style={styles.iconButton}
                    disabled={disabled || isLoading}
                    onPress={() => handleIconPress('MEASUREMENT')}
                >
                    <Badge count={counts.measurements}>
                        <MeasurementIcon disabled={!counts.measurements || disabled || isLoading} />
                    </Badge>
                </PressableScale>

                <PressableScale
                    style={styles.iconButton}
                    disabled={disabled || isLoading}
                    onPress={() => handleIconPress('PHYSICAL_ACTIVITY')}
                >
                    <Badge count={exercisePendingCount}>
                        <ActivityIcon disabled={!exercisePendingCount || disabled || isLoading} />
                    </Badge>
                </PressableScale>

                <PressableScale
                    style={styles.iconButton}
                    disabled={disabled || isLoading}
                    onPress={() => handleIconPress('SUPPLEMENT')}
                >
                    <Badge count={counts.supplements}>
                        <SupplementIcon disabled={!counts.supplements || disabled || isLoading} />
                    </Badge>
                </PressableScale>
            </View>

            {/* Modals */}
            {activeModal && (
                <AnytimeModal
                    date={date}
                    visible={true}
                    onClose={handleCloseModal}
                    maxHeight={modalMaxHeight}
                    isFutureDate={isFutureDay}
                    fullScreen={modalFullScreen}
                    {...getModalProps(activeModal)}
                    disabled={disabled || isLoading}
                />
            )}

            <AnytimeExercisesModal
                date={date}
                maxHeight={modalMaxHeight}
                fullScreen={modalFullScreen}
                visible={showExercisesModal}
                disabled={disabled || isLoading}
                onClose={handleCloseExercisesModal}
            />
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        borderTopWidth: 2,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        // paddingTop: 5,
        marginBottom: Platform.OS === 'ios' ? 16 : 0,
    },
    iconButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
    },
    opacityFuture: {
        opacity: 0.4,
    },
});
