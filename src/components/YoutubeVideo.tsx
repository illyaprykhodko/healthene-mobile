import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from 'hooks/useTheme';

interface YoutubeVideoProps {
    url: string;
}

export const YoutubeVideo: React.FC<YoutubeVideoProps> = ({ url }) => {
    const theme = useTheme();
    return (
        <View style={[styles.container, { backgroundColor: theme.colors.lightGrey }]}>
            <Text style={[styles.text, { color: theme.colors.text }]}>YouTube Video: {url}</Text>
            <Text style={[styles.note, { color: theme.colors.grey }]}>Video component not implemented yet</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        marginVertical: 10,
    },
    text: {
        fontSize: 16,
        marginBottom: 8,
    },
    note: {
        fontSize: 12,
        fontStyle: 'italic',
    },
});
