// outsource dependencies
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
// local dependencies
import Text from 'components/Text';
import Screen from 'components/Screen';
import { RootStackParamList } from 'services/navigation';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const Bank: React.FC = () => {
    const navigation = useNavigation<Navigation>();

    return (
        <Screen initialized style={styles.container}>
            <View style={styles.content}>
                <Text variant="h3" style={styles.title}>$ Bank</Text>
                <Text variant="h5" style={styles.subtitle}>
                    Placeholder screen. Bank details and transactions come next.
                </Text>
            </View>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
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
        color: '#111111',
    },
    subtitle: {
        color: '#5F5F5F',
    },
    backButton: {
        borderWidth: 1,
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderColor: '#A9A9A9',
        alignSelf: 'flex-start',
        backgroundColor: '#F8A0A0',
    },
    backText: {
        fontFamily: 'Outfit-Bold',
        color: '#111111',
    },
});
