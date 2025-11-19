// outsource dependencies
import React from 'react';
import { FlatList, StyleSheet } from 'react-native';

// local dependencies
import Text from 'components/Text.tsx';
import { OFFSET } from 'constants/offset.ts';
import { useTheme } from 'hooks/useTheme.ts';

export interface BreadcrumbItem {
    name: string;
    id: number | null
}

interface BreadcrumbsProps {
  data: BreadcrumbItem[];
}

export const Breadcrumbs = ({ data }: BreadcrumbsProps) => {
    const theme = useTheme();
    return <FlatList
        horizontal
        data={data}
        style={[styles.container, { backgroundColor: theme.colors.lighterGrey }]}
        renderItem={({ item, index }) => {
            const isLastItem = index === data.length - 1;
            console.log('isLastItem', isLastItem);
            return <Text variant={isLastItem ? 'common' : 'bold'} >{item.name}</Text>;
        }}
    />;
};

const styles = StyleSheet.create({
    container: {
        padding: OFFSET.POINT
    },
});
