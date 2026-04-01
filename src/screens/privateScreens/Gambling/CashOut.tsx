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

const CashOut: React.FC = () => {
    const navigation = useNavigation<Navigation>();

    return (
        <Screen initialized style={styles.container}>
            <View style={styles.content}>
                <Text variant="h3" style={styles.title}>Cash Out</Text>
                <Text variant="h5" style={styles.subtitle}>
                    Placeholder screen. Cash out flow will be implemented next.
                </Text>
            </View>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Text variant="h5" style={styles.backText}>Back</Text>
            </TouchableOpacity>
        </Screen>
    );
};

export default CashOut;

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
        alignSelf: 'flex-start',
        backgroundColor: '#F8A0A0',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    backText: {
        fontFamily: 'Outfit-Bold',
        color: '#111111',
    },
});
