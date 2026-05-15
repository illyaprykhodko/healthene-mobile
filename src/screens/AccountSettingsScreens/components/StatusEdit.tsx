// outsource dependencies
import Animated, {
    Easing,
    withDelay,
    withTiming,
    useSharedValue,
    useAnimatedStyle,
} from 'react-native-reanimated';
import { useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import { Pressable, StyleSheet, } from 'react-native';
import Icon from '@react-native-vector-icons/fontawesome5';
import React, { useCallback, useEffect, useState } from 'react';

// local dependencies
import { RootState } from 'store';
import { OFFSET } from 'constants/offset.ts';
import { useTheme } from 'hooks/useTheme.ts';
import { CATEGORY_STATUS, TREE_TYPE } from 'constants/spec.ts';
import { useUpdatePatientCategoriesMutation } from 'store/api/categoryTreeApi.ts';
import { CategoryItem, CategoryStatusType, PatientCategories, TreeType } from 'types/categoryTree.ts';

interface StatusEditProps extends CategoryItem{
    treeTypeViewLabel: TreeType
}
const STATUS_SIZE = 36.5;

export const StatusEdit = ({ id, name, treeTypeViewLabel }: StatusEditProps) => {
    const theme = useTheme();
    const [updateCategory] = useUpdatePatientCategoriesMutation();
    const user = useSelector((state: RootState) => state.app.user);
    const categories = useSelector((state: RootState) => state.foodPreferences.categories);

    const [category, setCategory] = useState<PatientCategories | null>(null);
    const [statusTypes, setStatusTypesStatus] = useState<CategoryStatusType[]>([]);
    const [optimisticStatus, setOptimisticStatus] = useState<CategoryStatusType | null>(null);
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

    // Clear optimistic override once the slice catches up with the server's confirmed status
    useEffect(() => {
        setOptimisticStatus(null);
    }, [category?.categoryStatus]);

    const displayStatus = optimisticStatus ?? category?.categoryStatus ?? CATEGORY_STATUS.INCLUDE;

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

    const getStatusIcon = useCallback((status: CategoryStatusType) => {
        if (treeTypeViewLabel === TREE_TYPE.DISLIKE) {
            switch (status) {
                default: return <Icon iconStyle="solid" name="question" color={theme.colors.red} size={22} />;
                case CATEGORY_STATUS.I_LOVE_IT: return <Icon name="heart" color={theme.colors.red} size={22} />;
                case CATEGORY_STATUS.INCLUDE: return <Icon name="thumbs-up" color={theme.colors.green} size={22} />;
                case CATEGORY_STATUS.EXCLUDE: return <Icon name="thumbs-down" color={theme.colors.orange} size={22} />;
            }
        } else {
            switch (status) {
                default: return <Icon name="question-circle" color={theme.colors.green} size={22} />;
                case CATEGORY_STATUS.EXCLUDE: return <Icon name="check-square" color={theme.colors.red} size={22} />;
                case CATEGORY_STATUS.INCLUDE: return <Icon name="square" color={theme.colors.grey} size={22} />;
            }
        }
    }, [treeTypeViewLabel]);

    const handleEdit = useCallback((status: CategoryStatusType) => {
        const userId = user?.id;
        const visitId = user?.activeVisit?.id;
        const categoryStatus = treeTypeViewLabel === TREE_TYPE.DISLIKE
            ? status
            : status === CATEGORY_STATUS.EXCLUDE ? CATEGORY_STATUS.INCLUDE : CATEGORY_STATUS.EXCLUDE;

        if (visitId && userId) {
            setOptimisticStatus(categoryStatus);
            const request = category
                ? updateCategory({
                    ...category,
                    categoryStatus,
                    visit: { id: visitId }
                })
                : updateCategory({
                    categoryStatus,
                    visit: { id: visitId },
                    patient: { id: userId },
                    foodCategory: { id, name }
                });
            request.unwrap().catch(() => {
                setOptimisticStatus(null);
                Toast.show({
                    type: 'error',
                    text1: 'Update failed',
                    text2: `Could not save "${name}". Please try again.`,
                });
            });
        }
    }, [category, id, name, user?.id, user?.activeVisit?.id, updateCategory, treeTypeViewLabel]);

    return treeTypeViewLabel === TREE_TYPE.DISLIKE ? <Animated.View
        onTouchEnd={onTouch}
        pointerEvents="box-none"
        style={[
            animatedStyle,
            styles.dislike,
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
    </Animated.View> : <Pressable onPress={() => handleEdit(displayStatus)} style={styles.container}>
        {getStatusIcon(displayStatus)}
    </Pressable>;
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 'auto',
    },
    dislike: {
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
