// outsource dependencies
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
// local dependencies
import Text from '../Text';
import Checkbox from '../Checkbox';
import { useTheme } from '../../hooks/useTheme';
import { COLORS } from '../../constants/colors';
import type { AnytimeItem } from '../../types/anytime';

interface AnytimeListItemProps {
  item: AnytimeItem;
  onUpdateItem: (item: AnytimeItem) => void;
  disabled?: boolean;
  isFutureDate?: boolean;
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E9E9E9',
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    image: {
        width: 48,
        height: 48,
        borderRadius: 8,
        marginRight: 12,
        backgroundColor: COLORS.LIGHT_GREY,
    },
    textContainer: {
        flex: 1,
        marginRight: 12,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.BLACK,
        marginBottom: 4,
    },
    itemDetails: {
        fontSize: 14,
        color: '#8E8E8E',
        fontWeight: '400',
    },
    checkboxContainer: {
        paddingLeft: 8,
    },
    completed: {
        opacity: 0.6,
    },
});

const getItemDisplayData = (item: AnytimeItem) => {
    switch (item.type) {
        case 'FOOD':
        case 'DRINK':
            return {
                image: item.food?.coverImage?.url,
                name: item.food?.name || 'Unknown Food',
                details: `${item.amount || 1} ${item.weight?.unit?.name || ''}`,
            };
        case 'SUPPLEMENT':
            return {
                image: item.supplement?.coverImage?.url,
                name: item.supplement?.name || 'Unknown Supplement',
                details: `${item.amount || 1} ${item.supplement?.servingSizes?.[0]?.unit || ''}`,
            };
        case 'MEASUREMENT':
            return {
                details: '',
                image: null,
                name: item.measurement?.name || 'Unknown Measurement',
            };
        case 'PHYSICAL_ACTIVITY':
            return {
                details: '',
                image: null,
                name: item.physicalActivity?.name || 'Exercise',
            };
        default:
            return {
                details: '',
                image: null,
                name: 'Unknown Item',
            };
    }
};

export const AnytimeListItem: React.FC<AnytimeListItemProps> = ({
    item,
    onUpdateItem,
    disabled = false,
    isFutureDate = false,
}) => {
    // const theme = useTheme();
    const { name, details, image } = getItemDisplayData(item);
  
    const isCompleted = item.status === 'DONE';
    const canToggle = !disabled && !isFutureDate;

    const handleToggle = () => {
        if (canToggle) {
            onUpdateItem(item);
        }
    };

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            disabled={!canToggle}
            onPress={handleToggle}
            style={[styles.container, isCompleted && styles.completed]}
        >
            <View style={styles.content}>
                {image ? (
                    <Image
                        resizeMode="cover"
                        style={styles.image}
                        source={{ uri: image }}
                    />
                ) : (
                    <View style={styles.image} />
                )}
        
                <View style={styles.textContainer}>
                    <Text style={styles.itemName}>
                        {name}
                    </Text>
                    {details ? (
                        <Text style={styles.itemDetails}>
                            {details}
                        </Text>
                    ) : null}
                </View>
            </View>

            {!isFutureDate && (
                <View style={styles.checkboxContainer}>
                    <Checkbox
                        value={isCompleted}
                        editable={!disabled}
                        onChange={handleToggle}
                    />
                </View>
            )}
        </TouchableOpacity>
    );
};
