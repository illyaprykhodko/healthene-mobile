// outsource dependencies
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';

// local dependencies
import Text from '../../../components/Text';
import Screen from '../../../components/Screen';
import { useTheme } from '../../../hooks/useTheme';

interface PlaceholderScreenProps {
    title?: string;
}

export const PlaceholderScreen: React.FC<PlaceholderScreenProps> = ({ title }) => {
    const theme = useTheme();
    const route = useRoute();
    const screenName = title || route.name;

    return (
        <Screen style={styles.container} initialized={true}>
            <View style={styles.content}>
                <Text
                    variant="h1"
                    style={[styles.title, { color: theme.colors.text }]}
                >
                    {screenName}
                </Text>
                <Text
                    variant="body"
                    style={[styles.subtitle, { color: theme.colors.textSecondary }]}
                >
                    This screen is under development
                </Text>
            </View>
        </Screen>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    title: {
        textAlign: 'center',
        marginBottom: 20,
    },
    subtitle: {
        textAlign: 'center',
    },
});
