// outsource dependencies
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
// local dependencies
import { useAuth } from 'hooks/useAuth';
import { ROUTES } from '../../../constants/routes';
import { navigate } from '../../../services/navigation';

export default function HomeScreen () {
    const { signOut } = useAuth();
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome to Home Screen</Text>
      
            <TouchableOpacity
                style={styles.button}
                onPress={() => navigate(ROUTES.PROFILE)}
            >
                <Text style={styles.buttonText}>Go to Profile</Text>
            </TouchableOpacity>
      
            <TouchableOpacity
                style={styles.button}
                onPress={() => signOut()}
            >
                <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.button}
                onPress={() => navigate(ROUTES.SETTINGS)}
            >
                <Text style={styles.buttonText}>Go to Settings</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 30,
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        marginVertical: 10,
        width: '100%',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
});
