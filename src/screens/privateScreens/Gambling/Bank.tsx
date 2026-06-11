// outsource dependencies
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
// local dependencies
import Text from 'components/Text';
import Screen from 'components/Screen';
import { useTheme } from 'hooks/useTheme';
import { RootStackParamList } from 'services/navigation';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const Bank: React.FC = () => {
    const navigation = useNavigation<Navigation>();
    const theme = useTheme();

    return (
        <Screen initialized style={styles.container}>
            <View style={styles.content}>
                <Text variant="h3" style={[styles.title, { color: theme.colors.text }]}>$ Bank</Text>
                <Text variant="h5" style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                    Placeholder screen. Bank details and transactions come next.
                </Text>
            </View>
            <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={[styles.backButton, { borderColor: theme.colors.border }]}
            >
                <Text variant="h5" style={styles.backText}>Back</Text>
            </TouchableOpacity>
        </Screen>
    );
};

export default Bank;

const styles = StyleSheet.create({
    container: {
        padding: 16,
        justifyContent: 'space-between',
    },
    content: {
        marginTop: 16,
        gap: 12,
    },
    title: {
        fontFamily: 'Outfit-Bold',
    },
    subtitle: {},
    backButton: {
        borderWidth: 1,
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 16,
        alignSelf: 'flex-start',
        backgroundColor: '#F8A0A0',
    },
    backText: {
        fontFamily: 'Outfit-Bold',
        color: '#111111',
    },
});
