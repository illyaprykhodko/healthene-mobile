// outsource dependencies
import Animated, {
    Easing,
    withTiming,
    useSharedValue,
    useDerivedValue,
    useAnimatedStyle,
} from 'react-native-reanimated';
import React, { memo, useMemo, useCallback, useEffect } from 'react';
import { StyleSheet, View, FlatList, ListRenderItemInfo } from 'react-native';

// local dependencies
import Text from 'components/Text.tsx';
import { OFFSET } from 'constants/offset.ts';
import { useTheme } from 'hooks/useTheme.ts';
import { Checkbox } from 'components/Checkbox.tsx';
import Separator from 'components/FlatListSeparator';
import { MedicalEntity, MedicalEntityItem } from 'types/healthProfile.ts';
import { HealthProfileSectionType } from './HealthProfileListSection.tsx';

interface SelectedItemsAccordionProps {
    isExpanded: boolean;
    data: MedicalEntity[];
    type: HealthProfileSectionType;
    onRemove?: (id: number) => void;
}

const SelectedItemsAccordion = ({ data, isExpanded, type, onRemove }: SelectedItemsAccordionProps) => {
    const theme = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const selectedItemsList = useMemo(() => {
        return data
            .map((item: MedicalEntity) => {
                if (type === 'medication') {
                    return item.medication;
                }
                return item.medicalTerm;
            })
            .filter((item): item is MedicalEntityItem => item !== undefined);
    }, [data, type]);

    const expanded = useSharedValue(0);
    const itemHeight = 74; // Approximate height per item
    const contentHeight = selectedItemsList.length * itemHeight;

    useEffect(() => {
        expanded.value = withTiming(isExpanded ? 1 : 0, {
            duration: 300,
            easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        });
    }, [isExpanded, expanded]);

    const animatedHeight = useDerivedValue(() => {
        return expanded.value * contentHeight;
    });

    const animatedStyle = useAnimatedStyle(() => {
        return {
            height: animatedHeight.value,
            opacity: expanded.value,
        };
    });

    const handleCheckboxChange = useCallback((itemId: number, value: boolean) => {
        if (!value && onRemove) {
            onRemove(itemId);
        }
    }, [onRemove]);

    const renderItem = useCallback(({ item }: ListRenderItemInfo<{ id: number; name: string }>) => {
        return (
            <View style={styles.item}>
                <Text style={styles.itemText} numberOfLines={1}>{item?.name}</Text>
                <Checkbox
                    size={12}
                    value={true}
                    onChange={value => handleCheckboxChange(item?.id, value)}
                />
            </View>
        );
    }, [styles, handleCheckboxChange]);

    const keyExtractor = useCallback((item: { id: number; name: string }) => item?.id.toString(), []);

    if (selectedItemsList.length === 0) {
        return null;
    }

    return (
        <Animated.View style={[styles.accordionContainer, animatedStyle]}>
            <FlatList
                scrollEnabled={false}
                renderItem={renderItem}
                data={selectedItemsList}
                keyExtractor={keyExtractor}
                ItemSeparatorComponent={Separator}
                contentContainerStyle={styles.listContent}
            />
        </Animated.View>
    );
};

export default memo(SelectedItemsAccordion);

const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
    accordionContainer: {
        overflow: 'hidden',
    },
    listContent: {
        paddingVertical: OFFSET.VERTICAL,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: OFFSET.VERTICAL,
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    itemText: {
        flex: 1,
        paddingRight: OFFSET.POINT * 2,
        color: theme.colors.text,
    },
});
