import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from 'hooks/useTheme.ts';

const Separator = () => {
    const theme = useTheme();
    return <View style={[styles.separator, { borderTopColor: theme.colors.border }]} />;
};

export default Separator;
const styles = StyleSheet.create({
    separator: {
        borderTopWidth: 1
    }
});
