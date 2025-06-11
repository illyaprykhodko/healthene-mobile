// outsource dependencies
import React, { useEffect } from 'react';
import { StyleSheet, Animated } from 'react-native';
// local dependencies
import { useTheme } from '../hooks/useTheme';
import { LogoAnimate } from './LogoAnimate';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
    const theme = useTheme();
    const fadeAnim = new Animated.Value(0);

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
    }, []);
    // console.log('theme.colors.background', theme.colors.background);
    return (
        <Animated.View
            style={[
                styles.container,
                {
                    backgroundColor: theme.colors.background,
                    opacity: fadeAnim
                }
            ]}
        >
            <LogoAnimate
                size={200}
                onAnimationComplete={onFinish}
            />
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
