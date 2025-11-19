// outsource dependencies
import React from 'react';
import { StyleSheet, View } from 'react-native';

// local dependencies
import { useTheme } from 'hooks/useTheme.ts';
import { TREE_TYPE } from 'constants/spec.ts';
import { useGetAllCategoriesQuery } from 'store/api/categoryTreeApi.ts';

interface FoodPreferencesProps {
  // props here
}

const FoodPreferences = (props: FoodPreferencesProps) => {
    const theme = useTheme();
    const { data: treeList, isLoading } = useGetAllCategoriesQuery({
        body: {
            treeTypeViewLabel: TREE_TYPE.DISLIKE,
        },
        params: {
            page: 0
        }
    });
    console.log('treeList', treeList);
    return <View style={styles.container}>{/* Code here */}</View>;
};

export default FoodPreferences;

const styles = StyleSheet.create({
    container: {
    // style here
    },
});
