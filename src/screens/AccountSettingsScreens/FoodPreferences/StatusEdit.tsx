// outsource dependencies
import Animated, {
    Easing,
    withDelay,
    withTiming,
    useSharedValue,
    useAnimatedStyle,
} from 'react-native-reanimated';
import { useSelector } from 'react-redux';
import { Pressable, StyleSheet, } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import React, { useCallback, useEffect, useState } from 'react';

// local dependencies
import { RootState } from 'store';
import { OFFSET } from 'constants/offset.ts';
import { useTheme } from 'hooks/useTheme.ts';
import { CATEGORY_STATUS } from 'constants/spec.ts';
import { useUpdatePatientCategoriesMutation } from 'store/api/categoryTreeApi.ts';
import { CategoryItem, CategoryStatusType, PatientCategories } from 'types/categoryTree.ts';


const STATUS_SIZE = 36.5;

export const StatusEdit = ({ id, name }: CategoryItem) => {
    const theme = useTheme();
    const [updateCategory] = useUpdatePatientCategoriesMutation();

    const user = useSelector((state: RootState) => state.app.user);
    const categories = useSelector((state: RootState) => state.foodPreferences.categories);

    const [category, setCategory] = useState<PatientCategories | null>(null);
    const [statusTypes, setStatusTypesStatus] = useState<CategoryStatusType[]>([]);
    useEffect(() => {
        const category = (categories || []).find(
            c => c.foodCategory?.id === id
        );
        setCategory(category ?? null);
        const statuses = Array.from(
            new Set([
                category?.categoryStatus ?? CATEGORY_STATUS.INCLUDE,
                ...Object.values(CATEGORY_STATUS)
            ])
        );
        setStatusTypesStatus(statuses);
    }, [categories, id]);

    // Animation
    const expanded = useSharedValue(0);
    const animatedStyle = useAnimatedStyle(() => {
        return {
            duration: 350,
            easing: Easing.linear,
            width: withTiming(expanded.value ? STATUS_SIZE * statusTypes.length : STATUS_SIZE),
        };
    });

    const onTouch = () => {
        if (expanded.value === 0) {
            expanded.value = 1;
            expanded.value = withDelay(2000, withTiming(0));
        } else {
            expanded.value = withTiming(0);
        }
    };

    const getStatusIcon = (status: CategoryStatusType) => {
        switch (status) {
            default: return <Icon name="question" color={theme.colors.red} size={22} />;
            case CATEGORY_STATUS.I_LOVE_IT: return <Icon name="heart" color={theme.colors.red} size={22} />;
            case CATEGORY_STATUS.INCLUDE: return <Icon name="thumbs-up" color={theme.colors.green} size={22} />;
            case CATEGORY_STATUS.EXCLUDE: return <Icon name="thumbs-down" color={theme.colors.orange} size={22} />;
        }
    };

    const handleEdit = useCallback((categoryStatus: CategoryStatusType) => {
        const userId = user?.id;
        const visitId = user?.activeVisit?.id;
        if (visitId && userId) {
            if (category) {
                updateCategory({
                    ...category,
                    categoryStatus,
                    visit: { id: visitId }
                });
            } else {
                updateCategory({
                    categoryStatus,
                    visit: { id: visitId },
                    patient: { id: userId },
                    foodCategory: { id, name }
                });
            }
        }
    }, [category, id, name, user?.id, user?.activeVisit?.id, updateCategory]);

    return <Animated.View
        onTouchEnd={onTouch}
        pointerEvents="box-none"
        style={[
            animatedStyle,
            styles.container,
            {
                borderColor: theme.colors.darkGrey,
                backgroundColor: theme.colors.lighterGrey
            }
        ]}
    >
        {statusTypes.map(status => <Pressable onPress={() => handleEdit(status)} key={status} style={[styles.icon, { borderColor: theme.colors.lighterGrey }]}>
            {getStatusIcon(status)}
        </Pressable>)}
    </Animated.View>;
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 'auto',
        borderWidth: 0.6,
        borderRadius: 50,
        overflow: 'hidden',
    },
    icon: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 30,
        margin: 2,
        padding: OFFSET.POINT,
        borderRadius: 15,
        borderWidth: 0.3,
    },
});
