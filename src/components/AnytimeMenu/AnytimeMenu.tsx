// outsource dependencies
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
// local dependencies
import { useTheme } from '../../hooks/useTheme';
import { useAnytimeData } from '../../hooks/useAnytimeData';
import { Badge } from './Badge';
import {
    FoodIcon,
    DrinkIcon,
    ActivityIcon,
    SupplementIcon,
    MeasurementIcon,
} from './AnytimeIcons';
import { AnytimeModal } from './AnytimeModal';
import { COLORS } from '../../constants/colors';
import type { AnytimeItemType } from '../../types/anytime';

interface AnytimeMenuProps {
    date?: string;
    disabled?: boolean;
    modalFullScreen?: boolean;
    modalMaxHeight?: number;
}

const styles = StyleSheet.create({
    container: {
        borderTopColor: '#2978A0',
        borderTopWidth: 2,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: 16,
        backgroundColor: COLORS.WHITE,
        marginBottom: Platform.OS === 'ios' ? 16 : 0,
    },
    iconButton: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
    },
});

export const AnytimeMenu: React.FC<AnytimeMenuProps> = ({
    date,
    modalMaxHeight,
    disabled = false,
    modalFullScreen = true,
}) => {
    // const theme = useTheme();
    const { data, counts, isLoading, hasAnytimePhase } = useAnytimeData(date);
    const [activeModal, setActiveModal] = useState<AnytimeItemType | null>(null);

    // Don't render if there's no anytime phase
    if (!hasAnytimePhase) {
        return null;
    }

    const handleIconPress = (type: AnytimeItemType) => {
        if (disabled || isLoading) { return; }
        setActiveModal(type);
    };

    const handleCloseModal = () => {
        setActiveModal(null);
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

    return (
        <>
            <View style={styles.container}>
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
                    <Badge count={counts.physicalActivities}>
                        <ActivityIcon disabled={!counts.physicalActivities || disabled || isLoading} />
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
            </View>

            {/* Modals */}
            {activeModal && (
                <AnytimeModal
                    visible={true}
                    onClose={handleCloseModal}
                    maxHeight={modalMaxHeight}
                    fullScreen={modalFullScreen}
                    {...getModalProps(activeModal)}
                    disabled={disabled || isLoading}
                />
            )}
        </>
    );
};
