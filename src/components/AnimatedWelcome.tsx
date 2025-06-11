// outsource dependencies
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View, Easing } from 'react-native';
// local dependencies
import Text from './Text';
import { TextLogo } from './TextLogo';
import { useTheme } from '../hooks/useTheme';

interface AnimatedWelcomeProps {
  children: React.ReactNode;
  onFinish?: () => void;
}

const ANIMATION_DURATION = 900;
const DELAY_BEFORE_ANIMATION = 400;

export const AnimatedWelcome: React.FC<AnimatedWelcomeProps> = ({ children, onFinish = () => {} }) => {
    const [showWelcome, setShowWelcome] = useState(true);
    const scale = useRef(new Animated.Value(2)).current;
    const translateY = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(1)).current;
    const theme = useTheme();
    useEffect(() => {
        const timeout = setTimeout(() => {
            Animated.parallel([
                Animated.timing(scale, {
                    toValue: 1,
                    duration: ANIMATION_DURATION,
                    easing: Easing.out(Easing.exp),
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: -120,
                    duration: ANIMATION_DURATION,
                    easing: Easing.out(Easing.exp),
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 400,
                    delay: ANIMATION_DURATION - 300,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setShowWelcome(false);
                if (onFinish) { onFinish(); }
            });
        }, DELAY_BEFORE_ANIMATION);
        return () => clearTimeout(timeout);
    }, []);

    return (
        <View style={{ flex: 1 }}>
            {showWelcome && (
                <Animated.View
                    style={[
                        styles.animatedContainer,
                        {
                            transform: [
                                { scale },
                                { translateY },
                            ],
                            opacity,
                        },
                    ]}
                >
                    <Text textAlign="center" color={theme.colors.primary}>Welcome to</Text>
                    <TextLogo style={styles.bigText} color={theme.colors.primary} />
                </Animated.View>
            )}
            {!showWelcome && (
                <View style={{ flex: 1 }}>{children}</View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    animatedContainer: {
    // position: 'absolute',
    // left: 0,
    // right: 0,
        top: '40%',
        alignSelf: 'center',
        zIndex: 10,
        paddingHorizontal: 25,
        marginHorizontal: 25,

    },
    bigText: {
        fontSize: 40,
        fontWeight: 'bold',
        letterSpacing: 1,
        textAlign: 'center',
    },
});
