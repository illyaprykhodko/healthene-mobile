// outsource dependencies
import React, { memo, useMemo } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';

// local dependencies
import Text from 'components/Text.tsx';
import { useTheme } from 'hooks/useTheme.ts';
import { OFFSET } from 'constants/offset.ts';
import { Button } from 'components/Button.tsx';

interface NoCameraDeviceErrorProps {
    hasCameraPermission: boolean;
    hasMicPermission: boolean;
}

const NoCameraPermissions = ({ hasCameraPermission, hasMicPermission }: NoCameraDeviceErrorProps) => {
    const theme = useTheme();
    const isBoth = useMemo(() => !hasCameraPermission && !hasMicPermission, [hasCameraPermission, hasMicPermission]);
    const title = isBoth
        ? 'Camera and microphone access required'
        : hasMicPermission
            ? 'Camera access required'
            : 'Microphone access required';

    const description = isBoth
        ? 'To continue, please allow access to your camera and microphone in your device settings.'
        : hasMicPermission
            ? 'To continue, please allow camera access in your device settings.'
            : 'To continue, please allow microphone access in your device settings.';

    return <View style={styles.container}>
        <View style={styles.wrapper}>
            <FeatherIcon
                size={148}
                name="camera-off"
                style={styles.icon}
                color={theme.colors.darkGrey}
            />
            <Text variant="h3" textAlign="center">{title}</Text>
            <Text textAlign="center">{description}</Text>
        </View>
        <Button onPress={() => Linking.openSettings()} style={styles.button} title="Allow access" />
    </View>;
};

export default memo(NoCameraPermissions);
const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        marginVertical: OFFSET.VERTICAL,
    },
    wrapper: {
        flex: 1,
        marginVertical: OFFSET.VERTICAL,
    },
    icon: {
        alignSelf: 'center',
    },
    button: {
        marginBottom: OFFSET.VERTICAL,
    },
});
