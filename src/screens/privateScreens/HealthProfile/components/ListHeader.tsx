// outsource dependencies
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Icon from '@react-native-vector-icons/fontawesome5';

// local dependencies
import Text from 'components/Text.tsx';
import { useTheme } from 'hooks/useTheme.ts';
import { OFFSET } from 'constants/offset.ts';

interface ListHeaderProps {
    title: string;
    onAction: () => void;
}

const ListHeader = ({ onAction, title }: ListHeaderProps) => {
    const theme = useTheme();
    return <View style={styles.container}>
        <Text variant="h4" color={theme.colors.primary}>{title}</Text>
        <Pressable onPress={onAction}>
            <Icon iconStyle="solid" name="edit" size={24} color={theme.colors.grey} />
        </Pressable>
    </View>;
};

export default ListHeader;
const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: OFFSET.VERTICAL,
    },
});
