import React from 'react';
import { useTheme } from 'hooks/useTheme.ts';
import { StyleSheet, View } from 'react-native';

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
