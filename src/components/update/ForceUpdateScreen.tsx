// outsource dependencies
import React from 'react';
import { StyleSheet, View } from 'react-native';

// local dependencies
import Text from 'components/Text';
import { UpdatePolicy } from 'types';
import { OFFSET } from 'constants/offset';
import { Button } from 'components/Button';

interface ForceUpdateScreenProps {
    policy: UpdatePolicy;
    onUpdate: () => void;
}

export const ForceUpdateScreen: React.FC<ForceUpdateScreenProps> = ({ policy, onUpdate }) => {
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text variant="h3" textAlign="center" style={styles.title}>
                    {policy.forceTitle || 'Update Required'}
                </Text>
                <Text variant="body" textAlign="center" style={styles.message}>
                    {policy.forceMessage}
                </Text>
                <Button
                    title="Update App"
                    onPress={onUpdate}
                    style={styles.button}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: OFFSET.HORIZONTAL * 1.5,
    },
    content: {
        alignItems: 'center',
    },
    title: {
        marginBottom: OFFSET.VERTICAL,
    },
    message: {
        marginBottom: OFFSET.VERTICAL * 1.5,
    },
    button: {
        alignSelf: 'stretch',
    },
});
