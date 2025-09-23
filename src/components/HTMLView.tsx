// outsource dependencies
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
// local dependencies
import { useTheme } from '../hooks/useTheme';

interface HTMLViewProps {
    value: string;
    stylesheet?: any;
}

export const HTMLView: React.FC<HTMLViewProps> = ({ value, stylesheet }) => {
    const theme = useTheme();
    // Simple HTML to text conversion for now
    const cleanText = value
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
        .replace(/&amp;/g, '&') // Replace &amp; with &
        .replace(/&lt;/g, '<') // Replace &lt; with <
        .replace(/&gt;/g, '>') // Replace &gt; with >
        .replace(/&quot;/g, '"') // Replace &quot; with "
        .trim();

    return (
        <View style={styles.container}>
            <Text style={[styles.text, { color: theme.colors.text }, stylesheet?.p]}>
                {cleanText}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 10,
    },
    text: {
        fontSize: 16,
        lineHeight: 24,
    },
});
