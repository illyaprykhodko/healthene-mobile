// outsource dependencies
import { Text } from '@react-native-material/core';
import Icon from 'react-native-vector-icons/Ionicons';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, TouchableWithoutFeedback, Pressable } from 'react-native';
// local dependencies
import { LoginData } from 'types';
import Screen from 'components/Screen';
import { useAuth } from 'hooks/useAuth';
import { ROUTES } from 'constants/routes';
import { useTheme } from 'hooks/useTheme';
import { OFFSET } from 'constants/offset';
import { Button } from 'components/Button';
// import { LoginData } from 'store/api/types';
import TextInput from 'components/TextInput';
import { navigate } from 'services/navigation';
import { TextLogo } from 'components/TextLogo';
import { IconButton } from 'components/IconButton';
import { MessageService } from 'services/messages';
import { SplashScreen } from 'components/SplashScreen';
import BackgroundImage from 'components/BackgroundImage';
import { AnimatedWelcome } from 'components/AnimatedWelcome';


const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const SignIn: React.FC = (): React.ReactElement => {
    const { signIn, isLoading } = useAuth();
    const theme = useTheme();

    const [formData, setFormData] = useState<LoginData>({
        username: '',
        password: '',
    });
    const [securePassword, setSecurePassword] = useState(true);


    // const fadeAnim = new Animated.Value(0);
    // const slideAnim = new Animated.Value(50);
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
    }, []);

    const handleChange = useCallback((field: keyof LoginData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const toggleSecurePassword = useCallback(() => {
        setSecurePassword(prev => !prev);
    }, []);

    const handleSubmit = async () => {
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

            await signIn(formData);
        } catch (error) {
            console.error('Sign in error:', error);
        }
    };

    if (isLoading) {
        return <SplashScreen onFinish={() => {}} />;
    }

    return (
        <AnimatedWelcome>
            <Screen initialized={true} style={styles.container}>
                <BackgroundImage>
                    <Text color={theme.colors.background}>Welcome to</Text>
                    <TextLogo />
                    {/* <LogoAnimate size={150} /> */}
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
                    {/* <Text
            variant="h4"
            color={theme.colors.text}
            style={styles.title}
          >
            Sign In
          </Text> */}
                    <TextInput
                        name="email"
                        label="Email"
                        disabled={false}
                        autoComplete="email"
                        autoCapitalize="none"
                        value={formData.username}
                        keyboardType="email-address"
                        accessibilityLabel="Email input field"
                        accessibilityHint="Enter your email address to sign in"
                        onChangeText={value => handleChange('username', value)}
                        leading={(props: any) => <Icon name="mail-outline" {...props} />}
                    />

                    <TextInput
                        name="password"
                        label="Password"
                        disabled={false}
                        autoComplete="password"
                        value={formData.password}
                        secureTextEntry={securePassword}
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
                        onPress={handleSubmit}
                        // disabled={isLoading}
                        // loading={isLoading}
                        style={styles.button}

                        // fullWidth
                        // title="LOGIN"
                        // type="submit"
                        variant="outline"
                        // onPress={handleSubmit}
                        // style={{ marginTop: 30 }}
                        color={theme.colors.primary}
                    />

                    <View style={styles.linksContainer}>
                        <TouchableWithoutFeedback onPress={() => navigate(ROUTES.FORGOT_PASSWORD)}>
                            <View style={styles.link}>
                                <Text
                                    variant="h6"
                                    color={theme.colors.primary}
                                    style={styles.forgotPassword}
                                >
                  Forgot Password?
                                </Text>
                            </View>
                        </TouchableWithoutFeedback>

                        <TouchableWithoutFeedback
                            // onPress={() => navigate(ROUTES.TERMS_AND_CONDITIONS)}
                        >
                            <Pressable onPress={() => navigate(ROUTES.TERMS_AND_CONDITIONS)} style={styles.link}>
                                <Text variant="caption" color={theme.colors.textSecondary}>
                                    Terms and conditions
                                </Text>
                            </Pressable>
                        </TouchableWithoutFeedback>
                    </View>
                </Animated.View>
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
    linksContainer: {
        alignItems: 'center',
        marginTop: OFFSET.VERTICAL,
    },
    link: {
        marginTop: OFFSET.VERTICAL,
        alignItems: 'center',
    },
    title: {
        marginBottom: OFFSET.VERTICAL,
    },
    forgotPassword: {
        marginTop: OFFSET.VERTICAL,
        alignItems: 'center',
    },
    signUp: {
        marginTop: OFFSET.VERTICAL,
        alignItems: 'center',
    },
});
