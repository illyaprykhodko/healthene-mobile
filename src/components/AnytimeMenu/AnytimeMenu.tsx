// outsource dependencies
import React, { useMemo, useState } from 'react';
import { StyleSheet, TouchableOpacity, Platform } from 'react-native';
// local dependencies
import { Badge } from './Badge';
import { useTheme } from 'hooks/useTheme';
import { useAnytimeData } from 'hooks/useAnytimeData';
import { GlassSurface } from 'components/GlassSurface';
import {
    FoodIcon,
    DrinkIcon,
    ActivityIcon,
    SupplementIcon,
    MeasurementIcon,
} from './AnytimeIcons';
import { AnytimeModal } from './AnytimeModal';
import { PHASE_ITEM_STATUS } from 'constants/spec';
import type { AnytimeItemType } from '../../types/anytime';
import { AnytimeExercisesModal } from './AnytimeExercisesModal';
import { useGetDayOverviewQuery } from 'store/api/dayOverviewApi';

interface AnytimeMenuProps {
    date?: string;
    disabled?: boolean;
    modalFullScreen?: boolean;
    modalMaxHeight?: number;
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
            <GlassSurface
                tint="light"
                intensity={28}
                style={[styles.container, { borderTopColor: theme.colors.blue }]}
            >
                <TouchableOpacity
                    style={styles.iconButton}
                    disabled={disabled || isLoading}
                    onPress={() => handleIconPress('FOOD')}
                >
                    <Badge count={counts.foods}>
                        <FoodIcon disabled={!counts.foods || disabled || isLoading} />
                    </Badge>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.iconButton}
                    disabled={disabled || isLoading}
                    onPress={() => handleIconPress('DRINK')}
                >
                    <Badge count={counts.drinks}>
                        <DrinkIcon disabled={!counts.drinks || disabled || isLoading} />
                    </Badge>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.iconButton}
                    disabled={disabled || isLoading}
                    onPress={() => handleIconPress('MEASUREMENT')}
                >
                    <Badge count={counts.measurements}>
                        <MeasurementIcon disabled={!counts.measurements || disabled || isLoading} />
                    </Badge>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.iconButton}
                    disabled={disabled || isLoading}
                    onPress={() => handleIconPress('PHYSICAL_ACTIVITY')}
                >
                    <Badge count={exercisePendingCount}>
                        <ActivityIcon disabled={!exercisePendingCount || disabled || isLoading} />
                    </Badge>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.iconButton}
                    disabled={disabled || isLoading}
                    onPress={() => handleIconPress('SUPPLEMENT')}
                >
                    <Badge count={counts.supplements}>
                        <SupplementIcon disabled={!counts.supplements || disabled || isLoading} />
                    </Badge>
                </TouchableOpacity>
            </GlassSurface>

            {/* Modals */}
            {activeModal && (
                <AnytimeModal
                    date={date}
                    visible={true}
                    onClose={handleCloseModal}
                    maxHeight={modalMaxHeight}
                    fullScreen={modalFullScreen}
                    {...getModalProps(activeModal)}
                    disabled={disabled || isLoading}
                />
            )}

            <AnytimeExercisesModal
                date={date}
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
        paddingTop: 5,
        marginBottom: Platform.OS === 'ios' ? 16 : 0,
    },
    iconButton: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
    },
});
