// outsource dependencies
import Icon from '@react-native-vector-icons/ionicons';
import type { BiometryType } from 'react-native-biometrics';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Pressable, TouchableOpacity, Alert } from 'react-native';

// local dependencies
import { LoginData } from 'types';
import Text from 'components/Text';
import Screen from 'components/Screen';
import { useAuth } from 'hooks/useAuth';
import { ROUTES } from 'constants/routes';
import { useTheme } from 'hooks/useTheme';
import { OFFSET } from 'constants/offset';
import { Button } from 'components/Button';
import TextInput from 'components/TextInput';
import { navigate } from 'services/navigation';
import { TextLogo } from 'components/TextLogo';
import { IconButton } from 'components/IconButton';
import { MessageService } from 'services/messages';
import { SplashScreen } from 'components/SplashScreen';
import BackgroundImage from 'components/BackgroundImage';
import { AnimatedWelcome } from 'components/AnimatedWelcome';
import { biometricService } from 'services/biometricService';
import { isBadCredentialsError, isNetworkError } from 'services/auth/errors';
// import { useGetLibraryItemsTotalTreeQuery } from 'store/api/dayOverviewApi';


const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const getSignInErrorMessage = (error: any): string => {
    if (isBadCredentialsError(error)) {
        return 'The email or password you entered is incorrect. Please try again.';
    }
    if (isNetworkError(error)) {
        return 'Unable to reach the server. Check your connection and try again.';
    }
    return error?.data?.message || 'Something went wrong. Please try again.';
};

export const SignIn: React.FC = (): React.ReactElement => {
    const { signIn, isLoading } = useAuth();
    const theme = useTheme();

    const [formData, setFormData] = useState<LoginData>({
        username: '',
        password: '',
    });
    const [securePassword, setSecurePassword] = useState(true);
    const [biometricAvailable, setBiometricAvailable] = useState(false);
    const [biometricEnabled, setBiometricEnabled] = useState(false);
    const [biometryType, setBiometryType] = useState<BiometryType | null>(null);
    const [isBiometricLoading, setIsBiometricLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccessLoader, setShowSuccessLoader] = useState(false);
    // const { isLoading: isLibraryItemsTotalTreeLoading } = useGetLibraryItemsTotalTreeQuery();

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        setTimeout(() => {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ]).start();
        }, 2000);
        checkBiometricAvailability();
    }, []);

    const checkBiometricAvailability = async () => {
        try {
            const { available, biometryType } = await biometricService.isAvailable();
            const enabled = await biometricService.isEnabled();
            const hasCredentials = await biometricService.hasCredentials();
            setBiometricAvailable(available && enabled && hasCredentials);
            setBiometricEnabled(enabled && hasCredentials);
            setBiometryType(biometryType);
        } catch (error) {
            console.error('[SignIn] Error checking biometric:', error);
        }
    };

    const handleChange = useCallback((field: keyof LoginData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const toggleSecurePassword = useCallback(() => {
        setSecurePassword(prev => !prev);
    }, []);

    const handleSubmit = async () => {
        if (isSubmitting || isBiometricLoading) {
            return;
        }
        try {
            if (!formData.username || !formData.password) {
                MessageService.error({
                    uid: 'SignIn',
                    title: 'Validation Error',
                    message: 'Please fill in all fields',
                });
                return;
            }

            if (!validateEmail(formData.username)) {
                MessageService.error({
                    uid: 'SignIn',
                    title: 'Validation Error',
                    message: 'Please enter a valid email address',
                });
                return;
            }

            setIsSubmitting(true);
            await signIn(formData);
            setShowSuccessLoader(true);
            // setTimeout(() => {
            //     setShowSuccessLoader(false);
            // }, 10000);

            if (!biometricEnabled) {
                const { available } = await biometricService.isAvailable();
                if (available) {
                    setTimeout(() => {
                        Alert.alert(
                            'Enable Biometric Login?',
                            'Log in faster and more securely with biometric authentication',
                            [
                                {
                                    text: 'Not Now',
                                    style: 'cancel',
                                },
                                {
                                    text: 'Enable',
                                    onPress: async () => {
                                        try {
                                            const saved = await biometricService.saveCredentials(
                                                formData.username,
                                                formData.password
                                            );
                                            if (saved) {
                                                await biometricService.enable();
                                                MessageService.success({
                                                    uid: 'SignIn',
                                                    title: 'Biometric Enabled',
                                                    message: 'Biometric authentication has been enabled',
                                                });
                                            }
                                        } catch (error) {
                                            console.error('[SignIn] Failed to enable biometric:', error);
                                        }
                                    },
                                },
                            ],
                        );
                    }, 1000);
                }
            }
        } catch (error) {
            console.error('Sign in error:', error);
            MessageService.error({
                uid: 'SignIn',
                title: 'Sign In Error',
                message: getSignInErrorMessage(error),
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBiometricLogin = async () => {
        setIsBiometricLoading(true);
        try {
            const credentials = await biometricService.getCredentials();

            if (credentials) {
                await signIn({
                    username: credentials.username,
                    password: credentials.password,
                });
            } else {
                MessageService.error({
                    uid: 'SignIn',
                    title: 'Biometric Failed',
                    message: 'Please use your password to log in',
                });
            }
        } catch (error: any) {
            MessageService.error({
                uid: 'SignIn',
                title: 'Biometric Failed',
                message: isBadCredentialsError(error)
                    ? 'Your saved credentials are no longer valid. Please log in with your password.'
                    : getSignInErrorMessage(error),
            });
        } finally {
            setIsBiometricLoading(false);
        }
    };
    // if (isLoading) {
    //     return <SplashScreen onFinish={() => {}} />;
    // }
    // if (isLibraryItemsTotalTreeLoading) {
    //     return <SplashScreen onFinish={() => {}} />;
    // }

    return (
        <AnimatedWelcome>
            <Screen initialized={true} style={styles.container}>
                <BackgroundImage>
                    <Text color={theme.colors.white}>Welcome to</Text>
                    <TextLogo />
                </BackgroundImage>

                <Animated.View
                    style={[
                        styles.formContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        }
                    ]}
                >
                    <TextInput
                        name="email"
                        label="Email"
                        autoComplete="email"
                        autoCapitalize="none"
                        value={formData.username}
                        keyboardType="email-address"
                        disabled={isSubmitting || isLoading}
                        accessibilityLabel="Email input field"
                        accessibilityHint="Enter your email address to sign in"
                        onChangeText={value => handleChange('username', value)}
                        leading={(props: any) => <Icon name="mail-outline" {...props} />}
                    />

                    <TextInput
                        name="password"
                        label="Password"
                        autoComplete="password"
                        value={formData.password}
                        secureTextEntry={securePassword}
                        disabled={isSubmitting || isLoading}
                        accessibilityHint="Enter your password"
                        accessibilityLabel="Password input field"
                        onChangeText={value => handleChange('password', value)}
                        leading={(props: any) => <Icon name="lock-closed-outline" {...props} />}
                        trailing={
                            <IconButton
                                onPress={toggleSecurePassword}
                                CustomIcon={ <Icon size={22} name={securePassword ? 'eye-outline' : 'eye-off-outline'} />}
                            />}
                    />

                    <Button
                        title="Sign In"
                        variant="outline"
                        style={styles.button}
                        onPress={handleSubmit}
                        loading={isSubmitting}
                        color={theme.colors.primary}
                        disabled={isSubmitting || isLoading}
                    />

                    {biometricAvailable && (
                        <TouchableOpacity
                            style={[styles.biometricButton, { borderColor: theme.colors.primary }]}
                            onPress={handleBiometricLogin}
                            disabled={isBiometricLoading || isLoading || isSubmitting}
                        >
                            <Icon
                                size={24}
                                color={theme.colors.primary}
                                name={biometricService.getBiometricIcon(biometryType)}
                            />
                            <Text variant="body" color={theme.colors.primary}>
                                Log in with {biometricService.getBiometricTypeName(biometryType)}
                            </Text>
                        </TouchableOpacity>
                    )}

                    <View style={styles.linksContainer}>
                        <Pressable onPress={() => navigate(ROUTES.FORGOT_PASSWORD)}>
                            <Text
                                variant="h6"
                                color={theme.colors.primary}
                                style={styles.forgotPassword}
                            >
                                    Forgot Password?
                            </Text>
                        </Pressable>
                        <Pressable onPress={() => navigate(ROUTES.TERMS_AND_CONDITIONS)}>
                            <Text variant="caption" color={theme.colors.textSecondary}>
                                    Terms and conditions
                            </Text>
                        </Pressable>
                    </View>
                </Animated.View>
                {/* {showSuccessLoader && (
                    <View style={styles.loaderOverlay}>
                        <SplashScreen onFinish={() => {}} />
                    </View>
                )} */}
            </Screen>
        </AnimatedWelcome>
    );
};

const styles = StyleSheet.create({
    container: {
    // paddingLeft: -20,
    // paddingRight: -20,
    },
    formContainer: {
        margin: OFFSET.HORIZONTAL,
    },
    button: {
        marginTop: OFFSET.VERTICAL * 1.5,
    },
    biometricButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: OFFSET.HORIZONTAL / 2,
        paddingVertical: OFFSET.VERTICAL,
        paddingHorizontal: OFFSET.HORIZONTAL,
        borderRadius: 8,
        borderWidth: 1,
        marginTop: OFFSET.VERTICAL,
    },
    linksContainer: {
        alignItems: 'center',
        marginTop: OFFSET.VERTICAL,
    },
    title: {
        marginBottom: OFFSET.VERTICAL,
    },
    forgotPassword: {
        marginTop: OFFSET.VERTICAL * 2,
        marginBottom: OFFSET.VERTICAL,
        alignItems: 'center',
        fontSize: 16,
    },
    signUp: {
        marginTop: OFFSET.VERTICAL,
        alignItems: 'center',
    },
    loaderOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 20,
    },
});
