// outsource dependencies
import React from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';

// local dependencies
import Text from 'components/Text.tsx';
import { filters } from 'services/filter';
import { OFFSET } from 'constants/offset.ts';
import { useTheme } from 'hooks/useTheme.ts';

export interface BreadcrumbItem {
    name: string;
    id: number | undefined
}

interface BreadcrumbsProps {
  data: BreadcrumbItem[];
  onPress: (item: BreadcrumbItem, index: number) => void;
}

export const Breadcrumbs = ({ data, onPress }: BreadcrumbsProps) => {
    const theme = useTheme();
    return <FlatList
        horizontal
        data={data}
        bounces={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyExtractor={item => (item.id ? item.id.toString() : Math.random().toString())}
        style={[
            styles.container,
            {
                borderColor: theme.colors.grey,
                backgroundColor: theme.colors.lighterGrey,
            }]}
        renderItem={({ item, index }) => {
            const isLastItem = index === data.length - 1;
            const isFirstItem = index === 0;
            return <>
                {isFirstItem ? null : <Text> / </Text>}
                <Pressable onPress={() => onPress(item, index)}>
                    <Text
                        style={{ alignItems: 'center' }}
                        variant={isLastItem && !isFirstItem ? 'common' : 'bold'}
                        color={isLastItem && !isFirstItem ? theme.colors.black : theme.colors.primary}
                    >
                        {`${filters.truncate(item.name, { length: 12, end: '...' })}`}
                    </Text>
                </Pressable>
            </>;
        }}
    />;
};

const styles = StyleSheet.create({
    container: {
        borderWidth: 1,
    },
    content: {
        paddingVertical: OFFSET.POINT * 2,
        paddingHorizontal: OFFSET.HORIZONTAL,
    }
});
