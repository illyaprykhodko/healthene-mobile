// outsource dependencies
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Alert,
    Switch,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import Toast from 'react-native-toast-message';
import Icon from '@react-native-vector-icons/ionicons';
import type { BiometryType } from 'react-native-biometrics';

// local dependencies
import Text from 'components/Text';
import Screen from 'components/Screen';
import { useAppSelector } from 'store';
import { useTheme } from 'hooks/useTheme';
import { OFFSET } from 'constants/offset';
import { Button } from 'components/Button';
import TextInput from 'components/TextInput';
import { isBadCredentialsError } from 'services/auth/errors';
import { biometricService } from 'services/biometricService';
import { useVerifyPasswordMutation } from 'store/api/authApi';

export const BiometricSettingsScreen: React.FC = () => {
    const theme = useTheme();
    const user = useAppSelector(state => state.app.user);
    const [verifyPassword] = useVerifyPasswordMutation();

    const [isLoading, setIsLoading] = useState(true);
    const [isAvailable, setIsAvailable] = useState(false);
    const [isEnabled, setIsEnabled] = useState(false);
    const [hasCredentials, setHasCredentials] = useState(false);
    const [biometryType, setBiometryType] = useState<BiometryType | null>(null);
    const [showPasswordInput, setShowPasswordInput] = useState(false);
    const [password, setPassword] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        checkBiometricStatus();
    }, []);

    const checkBiometricStatus = async () => {
        setIsLoading(true);
        try {
            const { available, biometryType } = await biometricService.isAvailable();
            const enabled = await biometricService.isEnabled();
            const credentials = await biometricService.hasCredentials();

            setIsAvailable(available);
            setBiometryType(biometryType);
            setIsEnabled(enabled);
            setHasCredentials(credentials);
        } catch (error) {
            console.error('[BiometricSettings] Error checking status:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleBiometric = useCallback(async (value: boolean) => {
        if (value) {
            setShowPasswordInput(true);
        } else {
            Alert.alert(
                'Disable Biometric Login',
                'Are you sure you want to disable biometric authentication? You will need to enter your password to log in.',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                    },
                    {
                        text: 'Disable',
                        style: 'destructive',
                        onPress: async () => {
                            setIsProcessing(true);
                            try {
                                await biometricService.disable();
                                setIsEnabled(false);
                                setHasCredentials(false);
                                Toast.show({
                                    type: 'success',
                                    text1: 'Biometric Disabled',
                                    text2: 'Biometric authentication has been disabled',
                                });
                            } catch (error) {
                                Toast.show({
                                    type: 'error',
                                    text1: 'Error',
                                    text2: 'Failed to disable biometric authentication',
                                });
                            } finally {
                                setIsProcessing(false);
                            }
                        },
                    },
                ],
            );
        }
    }, []);

    const handleEnableBiometric = useCallback(async () => {
        if (!password) {
            Toast.show({
                type: 'error',
                text1: 'Password Required',
                text2: 'Please enter your password',
            });
            return;
        }

        if (!user?.email) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'User email not found',
            });
            return;
        }

        setIsProcessing(true);
        try {
            try {
                await verifyPassword({ username: user.email, password }).unwrap();
            } catch (verifyError: any) {
                const badCredentials = isBadCredentialsError(verifyError);
                Toast.show({
                    type: 'error',
                    text1: badCredentials ? 'Incorrect Password' : 'Verification Failed',
                    text2: badCredentials
                        ? 'The password you entered is incorrect'
                        : 'Unable to verify password. Please try again.',
                });
                return;
            }

            const saved = await biometricService.saveCredentials(user.email, password);

            if (saved) {
                await biometricService.enable();
                setIsEnabled(true);
                setHasCredentials(true);
                setShowPasswordInput(false);
                setPassword('');

                Toast.show({
                    type: 'success',
                    text1: 'Biometric Enabled',
                    text2: `${biometricService.getBiometricTypeName(biometryType)} authentication is now enabled`,
                });
            } else {
                throw new Error('Failed to save credentials');
            }
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to enable biometric authentication',
            });
        } finally {
            setIsProcessing(false);
        }
    }, [password, user?.email, biometryType, verifyPassword]);

    const handleTestBiometric = useCallback(async () => {
        setIsProcessing(true);
        try {
            const authenticated = await biometricService.authenticate(
                'Test biometric authentication'
            );

            if (authenticated) {
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Biometric authentication successful',
                });
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Failed',
                    text2: 'Biometric authentication failed',
                });
            }
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to test biometric authentication',
            });
        } finally {
            setIsProcessing(false);
        }
    }, []);

    if (isLoading) {
        return (
            <Screen initialized style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            </Screen>
        );
    }

    if (!isAvailable) {
        return (
            <Screen initialized style={styles.container}>
                <View style={styles.notAvailableContainer}>
                    <Icon name="lock-closed" size={64} color={theme.colors.grey} />
                    <Text
                        variant="h5"
                        color={theme.colors.text}
                        style={styles.notAvailableTitle}
                    >
                        Biometric Not Available
                    </Text>
                    <Text
                        variant="body"
                        textAlign="center"
                        style={styles.notAvailableText}
                        color={theme.colors.textSecondary}
                    >
                        Your device does not support biometric authentication or it is not set up.
                    </Text>
                </View>
            </Screen>
        );
    }

    return (
        <Screen initialized style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <View
                        style={[
                            styles.iconContainer,
                            { backgroundColor: theme.colors.primary },
                        ]}
                    >
                        <Icon
                            size={48}
                            color={theme.colors.primary}
                            name={biometricService.getBiometricIcon(biometryType)}
                        />
                    </View>
                    <Text
                        variant="h4"
                        style={styles.title}
                        color={theme.colors.text}
                    >
                        {biometricService.getBiometricTypeName(biometryType)}
                    </Text>
                    <Text
                        variant="body"
                        textAlign="center"
                        style={styles.subtitle}
                        color={theme.colors.textSecondary}
                    >
                        Use biometric authentication to quickly and securely log in to your account
                    </Text>
                </View>
                <View
                    style={[
                        styles.toggleContainer,
                        { backgroundColor: theme.colors.surface },
                    ]}
                >
                    <View style={styles.toggleContent}>
                        <View style={styles.toggleInfo}>
                            <Text variant="body" color={theme.colors.text}>
                                Enable {biometricService.getBiometricTypeName(biometryType)}
                            </Text>
                            <Text variant="caption" color={theme.colors.textSecondary}>
                                {isEnabled
                                    ? 'Biometric login is active'
                                    : 'Biometric login is disabled'}
                            </Text>
                        </View>
                        <Switch
                            value={isEnabled}
                            onValueChange={handleToggleBiometric}
                            disabled={isProcessing}
                            trackColor={{
                                false: theme.colors.grey,
                                true: theme.colors.primary,
                            }}
                            thumbColor={theme.colors.white}
                        />
                    </View>
                </View>
                {showPasswordInput && !isEnabled && (
                    <View style={styles.passwordContainer}>
                        <Text
                            variant="body"
                            color={theme.colors.text}
                            style={styles.passwordLabel}
                        >
                            Enter your password to enable biometric authentication
                        </Text>
                        <TextInput
                            name="password"
                            secureTextEntry
                            label="Password"
                            value={password}
                            autoComplete="password"
                            disabled={isProcessing}
                            onChangeText={setPassword}
                            leading={(props: any) => (
                                <Icon name="lock-closed-outline" {...props} />
                            )}
                        />
                        <View style={styles.buttonRow}>
                            <Button
                                title="Cancel"
                                variant="outline"
                                onPress={() => {
                                    setShowPasswordInput(false);
                                    setPassword('');
                                }}
                                style={styles.button}
                                disabled={isProcessing}
                            />
                            <Button
                                title="Enable"
                                style={styles.button}
                                onPress={handleEnableBiometric}
                                disabled={isProcessing || !password}
                            />
                        </View>
                    </View>
                )}

                {isEnabled && hasCredentials && (
                    <View style={styles.infoSection}>
                        <View
                            style={[
                                styles.infoCard,
                                { backgroundColor: theme.colors.successAlt },
                            ]}
                        >
                            <Icon
                                size={24}
                                name="checkmark-circle"
                                color={theme.colors.success}
                            />
                            <Text
                                variant="body"
                                style={styles.infoText}
                                color={theme.colors.text}
                            >
                                Biometric authentication is active. You can now log in using{' '}
                                {biometricService.getBiometricTypeName(biometryType)}.
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.testButton,
                                { borderColor: theme.colors.primary },
                            ]}
                            onPress={handleTestBiometric}
                            disabled={isProcessing}
                        >
                            <Icon
                                size={20}
                                name="finger-print"
                                color={theme.colors.primary}
                            />
                            <Text
                                variant="body"
                                style={styles.testButtonText}
                                color={theme.colors.primary}
                            >
                                Test Biometric Authentication
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.securityInfo}>
                    <Text
                        variant="caption"
                        color={theme.colors.text}
                        style={styles.securityTitle}
                    >
                        Security Information
                    </Text>
                    <View style={styles.securityItem}>
                        <Icon
                            size={16}
                            name="shield-checkmark"
                            color={theme.colors.textSecondary}
                        />
                        <Text
                            variant="caption"
                            style={styles.securityText}
                            color={theme.colors.textSecondary}
                        >
                            Your credentials are stored securely in your device's encrypted keychain
                        </Text>
                    </View>
                    <View style={styles.securityItem}>
                        <Icon
                            size={16}
                            name="lock-closed"
                            color={theme.colors.textSecondary}
                        />
                        <Text
                            variant="caption"
                            style={styles.securityText}
                            color={theme.colors.textSecondary}
                        >
                            Biometric data never leaves your device
                        </Text>
                    </View>
                    <View style={styles.securityItem}>
                        <Icon
                            size={16}
                            name="phone-portrait"
                            color={theme.colors.textSecondary}
                        />
                        <Text
                            variant="caption"
                            style={styles.securityText}
                            color={theme.colors.textSecondary}
                        >
                            Credentials are tied to this device only
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </Screen>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: OFFSET.HORIZONTAL,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notAvailableContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: OFFSET.HORIZONTAL * 2,
    },
    notAvailableTitle: {
        marginTop: OFFSET.VERTICAL * 2,
        marginBottom: OFFSET.VERTICAL,
    },
    notAvailableText: {
        maxWidth: 300,
    },
    header: {
        alignItems: 'center',
        marginBottom: OFFSET.VERTICAL * 2,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: OFFSET.VERTICAL,
    },
    title: {
        marginBottom: OFFSET.VERTICAL / 2,
    },
    subtitle: {
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    toggleContainer: {
        borderRadius: 12,
        padding: OFFSET.HORIZONTAL,
        marginBottom: OFFSET.VERTICAL * 2,
    },
    toggleContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    toggleInfo: {
        flex: 1,
        marginRight: OFFSET.HORIZONTAL,
    },
    passwordContainer: {
        marginBottom: OFFSET.VERTICAL * 2,
    },
    passwordLabel: {
        marginBottom: OFFSET.VERTICAL,
    },
    buttonRow: {
        flexDirection: 'row',
        marginTop: OFFSET.VERTICAL,
        gap: OFFSET.HORIZONTAL,
    },
    button: {
        flex: 1,
    },
    infoSection: {
        marginBottom: OFFSET.VERTICAL * 2,
    },
    infoCard: {
        flexDirection: 'row',
        padding: OFFSET.HORIZONTAL,
        borderRadius: 12,
        marginBottom: OFFSET.VERTICAL,
    },
    infoText: {
        flex: 1,
        marginLeft: OFFSET.HORIZONTAL,
    },
    testButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: OFFSET.VERTICAL,
        borderRadius: 12,
        borderWidth: 1,
        gap: OFFSET.HORIZONTAL / 2,
    },
    testButtonText: {
        fontWeight: '600',
    },
    securityInfo: {
        marginTop: OFFSET.VERTICAL,
    },
    securityTitle: {
        fontWeight: '600',
        marginBottom: OFFSET.VERTICAL,
        textTransform: 'uppercase',
    },
    securityItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: OFFSET.VERTICAL / 2,
    },
    securityText: {
        flex: 1,
        marginLeft: OFFSET.HORIZONTAL / 2,
    },
});

