import React from 'react';
import { View, StyleSheet } from 'react-native';
// local dependencies
import Text from '../../components/Text';
import Screen from '../../components/Screen';

export const SignUp: React.FC = () => {
    return (
        <Screen initialized={true}>
            <View style={styles.container}>
                <Text variant="h4">Sign Up</Text>
            </View>
        </Screen>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
