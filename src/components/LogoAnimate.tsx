// outsource dependencies
import React, { useMemo, useRef, useEffect } from 'react';
import { StyleSheet, Animated, Text, View } from 'react-native';
import Svg, { Defs, G, Ellipse, Path, RadialGradient, Stop, LinearGradient } from 'react-native-svg';
// local dependencies
import { useTheme } from '../hooks/useTheme';

interface LogoAnimateProps {
  size?: number;
  preload?: boolean;
  onAnimationComplete?: () => void;
}

// Configure
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedText = Animated.createAnimatedComponent(Text);
// const animatedLeafConfig = { toValue: 1, duration: 100, useNativeDriver: true };
// const animatedDotConfig = { toValue: 1, duration: 500, useNativeDriver: true };
export const LogoAnimate = ({ preload = true, onAnimationComplete, size }: LogoAnimateProps) => {
    const leaves = Array.from({ length: 7 }).map(() => ({
        opacity: useRef(new Animated.Value(0)).current,
        scale: useRef(new Animated.Value(0.8)).current,
    }));
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;
    const theme = useTheme();

    const styles = useMemo(
        () =>
            StyleSheet.create({
                container: {
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                },
                titleContainer: {
                    flexDirection: 'row',
                },
                title: {
                    marginTop: 16,
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: theme.colors.primary,
                },
            }),
        [theme.colors.primary]
    );
    useEffect(() => {
        const animateLeaves = () => {
            const fadeIn = leaves.map((leaf, i) =>
                Animated.parallel([
                    Animated.timing(leaf.opacity, {
                        toValue: 1,
                        duration: 250,
                        delay: i * 80,
                        useNativeDriver: true,
                    }),
                    Animated.spring(leaf.scale, {
                        toValue: 1,
                        friction: 5,
                        delay: i * 80,
                        useNativeDriver: true,
                    }),
                ])
            );
            const fadeOut = leaves.map((leaf, i) =>
                Animated.parallel([
                    Animated.timing(leaf.opacity, {
                        toValue: 0,
                        duration: 250,
                        delay: i * 80,
                        useNativeDriver: true,
                    }),
                    Animated.spring(leaf.scale, {
                        toValue: 0.8,
                        friction: 5,
                        delay: i * 80,
                        useNativeDriver: true,
                    }),
                ])
            );
            return Animated.sequence([
                Animated.stagger(80, fadeIn),
                Animated.stagger(80, fadeOut),
            ]);
        };
        const loop = Animated.loop(animateLeaves());
        loop.start();
        Animated.loop(
            Animated.sequence([
                Animated.timing(dot1, { toValue: 1, duration: 500, useNativeDriver: true }),
                Animated.timing(dot2, { toValue: 1, duration: 500, useNativeDriver: true }),
                Animated.timing(dot3, { toValue: 1, duration: 500, useNativeDriver: true }),
                Animated.timing(dot1, { toValue: 0, duration: 0, useNativeDriver: true }),
                Animated.timing(dot2, { toValue: 0, duration: 0, useNativeDriver: true }),
                Animated.timing(dot3, { toValue: 0, duration: 0, useNativeDriver: true }),
            ])
        ).start();
        return () => {
            loop.stop();
            onAnimationComplete?.();
        };
    }, [onAnimationComplete]);

    return <View style={styles.container}>
        <Svg viewBox="0 0 595.33 654.17" height={size} width={size}>
            <Defs>
                <RadialGradient
                    r="184.31"
                    cx="277.51"
                    cy="584.91"
                    id="radial-gradient"
                    gradientUnits="userSpaceOnUse"
                    gradientTransform="translate(0 26.61) scale(1 0.95)"
                >
                    <Stop offset="0" stopColor="#a5da6f" />
                    <Stop offset="0.39" stopColor="#96c677" />
                    <Stop offset="1" stopColor="#5a7a94" />
                </RadialGradient>
                <LinearGradient
                    x1="269.98"
                    x2="289.6"
                    y1="358.6"
                    y2="639.05"
                    id="linear-gradient"
                    gradientUnits="userSpaceOnUse"
                >
                    <Stop offset="0" stopColor="#c5ee32" />
                    <Stop offset="0" stopColor="#e1652d" />
                    <Stop offset="0.41" stopColor="#cb5829" />
                    <Stop offset="1" stopColor="#802c1d" />
                </LinearGradient>
                <RadialGradient
                    r="21.31"
                    cx="274.64"
                    cy="421.18"
                    id="radial-gradient-2"
                    gradientUnits="userSpaceOnUse"
                >
                    <Stop offset="0" stopColor="#c5ee32" />
                    <Stop offset="0" stopColor="#e1652d" />
                    <Stop offset="0.32" stopColor="#de632c" />
                    <Stop offset="0.56" stopColor="#d55e2b" />
                    <Stop offset="0.76" stopColor="#c55428" />
                    <Stop offset="0.95" stopColor="#af4724" />
                    <Stop offset="1" stopColor="#a84323" />
                </RadialGradient>
                <LinearGradient
                    x1="25.2"
                    y1="345.53"
                    x2="256.36"
                    y2="345.53"
                    id="linear-gradient-2"
                    gradientUnits="userSpaceOnUse"
                >
                    <Stop offset="0" stopColor="#e3c22f" />
                    <Stop offset="0" stopColor="#d94f30" />
                    <Stop offset="0.41" stopColor="#de752f" />
                    <Stop offset="1" stopColor="#efc02d" />
                </LinearGradient>
                <LinearGradient
                    x1="373.87"
                    y1="394.56"
                    x2="508.2"
                    y2="152.22"
                    id="linear-gradient-3"
                    gradientUnits="userSpaceOnUse"
                >
                    <Stop offset="0" stopColor="#e3c22f" />
                    <Stop offset="0" stopColor="#d94f30" />
                    <Stop offset="0" stopColor="#d4633a" />
                    <Stop offset="0.73" stopColor="#ecca33" />
                </LinearGradient>
            </Defs>
            <G id="arch">
                <Path
                    id="cls-1"
                    fill="url(#radial-gradient)"
                    d="M485,507.54C439.88,570.4,363.79,611.69,277.51,611.69S115.15,570.4,70,507.54H28.61c45.29,86.87,139.72,146.63,248.9,146.63s203.62-59.76,248.91-146.63Z"
                />
            </G>
            <G id="man">
                <Path
                    id="cls-2"
                    fill="url(#linear-gradient)"
                    d="M195.35,413.09a.53.53,0,0,0-.36,1c46.07,34.06,56.13,58.11,58,71,.31,2.1.35,5.14.59,9.72a184.17,184.17,0,0,1-9.26,67.56A164.91,164.91,0,0,1,228,598.2a151.58,151.58,0,0,1-12.57,18.19s-8.52,11.24-15.75,21.47c-4.52,6.4,12.72-1.37,20.89-7.92,4-3.19,21.15-18.68,39.42-50.38,13.93-24.18,17.13-34.35,24.26-34.43,6-.08,9.78,10.62,16.43,25,15.79,34.17,51.13,66.71,54.79,64.17,1.43-1-2-7.41-7.63-17-24.46-41.48-33.07-73.17-35.81-85.69-9.47-43.3-1.67-83.86,5.35-103.5,16.91-47.28,39.1-70.76,42.78-75.53,2-2.57-26,11.46-41.61,33.39-8,11.31-19.91,36.39-25.69,63.66-.49,2.3-3.27,14.36-11.09,15.91-5.09,1-11.06.52-16-5.61-11.08-13.82-3.62-4.75-12.91-16.86C244.59,432.3,232.67,416.62,195.35,413.09Z"
                />
                <Ellipse
                    rx="16.7"
                    ry="25.09"
                    cx="274.64"
                    cy="421.18"
                    fill="url(#radial-gradient-2)"
                />
            </G>
            <G id="leaf_1" data-name="leaf_1">
                <AnimatedPath
                    id="cls-4"
                    fill="#668b21"
                    opacity={leaves[0].opacity}
                    transform={[{ scale: leaves[0].scale }]}
                    d="M79.84,417.21C50.27,426.75,22.65,464.15.13,485.89a.4.4,0,0,0,.19.69c37.91,8.91,80.35,8.49,112.48-5.59,27.15-11.89,56.11-40.93,73-66.51a.4.4,0,0,0-.31-.63C175.15,413.07,112.53,406.65,79.84,417.21Z"
                />
            </G>
            <G id="leaf_2" data-name="leaf_2">
                <AnimatedPath
                    id="cls-5"
                    opacity={leaves[1].opacity}
                    transform={[{ scale: leaves[1].scale }]}
                    fill="url(#linear-gradient-2)"
                    d="M151.72,303.65c-27.53-5.66-57.37,1.54-124.26-2.32-.4,0-3.86,0-1.36,3.05,30,36.59,69.6,69.26,110.75,80.46,34.37,9.36,83.17,4.27,118.56-6.73a1.35,1.35,0,0,0,.6-2.19C211.75,326.07,178.85,309.23,151.72,303.65Z"
                />
            </G>
            <G id="leaf_3" data-name="leaf_3">
                <AnimatedPath
                    id="cls-6"
                    fill="#4c79b2"
                    opacity={leaves[2].opacity}
                    transform={[{ scale: leaves[2].scale }]}
                    d="M226.86,184.16c-28-25.74-45.22-42.15-117.6-75.82-.47-.22-5.77-2.23-4.33,2.73,19,65.45,34.69,127.85,61.86,163.72,24.46,32.31,81.2,69.43,120.72,77.58.95.2,2.37.72,2.81-.07s.66-5.82.67-6.43c.59-74.95-19.81-107.63-37.37-130.77A315.76,315.76,0,0,0,226.86,184.16Z"
                />
            </G>
            <G id="leaf_4" data-name="leaf_4">
                <AnimatedPath
                    id="cls-7"
                    fill="#36547e"
                    opacity={leaves[3].opacity}
                    transform={[{ scale: leaves[3].scale }]}
                    d="M299.74,132.79C276.9,89.92,266.52,76.29,200.8,2.43c-.43-.48-5.2-5.71-5.28.83-1,86.19-3.34,167.07,12.39,222.46,11.48,40.44,55.44,105.72,92.49,136,1.42,1.17,8.47,7.39,10.77,9.09a1.28,1.28,0,0,0,1.95-.58c24.07-63.3,20.34-128,12.46-169.56C320.73,175.12,301.21,135.55,299.74,132.79Z"
                />
            </G>
            <G id="leaf_5" data-name="leaf_5">
                <AnimatedPath
                    id="cls-8"
                    fill="#6eb1e7"
                    opacity={leaves[4].opacity}
                    transform={[{ scale: leaves[4].scale }]}
                    d="M290.22,352c.42-1.63,1-10.74,1-11.35.59-74.93-20.12-102.46-37.67-125.59a314.68,314.68,0,0,0-26.74-30.93c-10.26-9.44-19.08-17.62-29.69-25.86,1.9,25.06,5.19,47.83,10.75,67.41,4.49,15.85,12.12,38.25,24.55,57.62,16.57,25.79,38,50.55,57.6,69.24A2.87,2.87,0,0,0,290.22,352Z"
                />
            </G>
            <G id="leaf_6" data-name="leaf_6">
                <AnimatedPath
                    id="cls-9"
                    fill="url(#linear-gradient-3)"
                    opacity={leaves[5].opacity}
                    transform={[{ scale: leaves[5].scale }]}
                    d="M376.17,254.8c-8.4,12.85-14.77,24.44-19.52,41.44-6,21.55-8.24,45.43-8.16,45.08,0,0-2.05,39.45.38,39.34,45.13-2.09,71.91-13.5,92.51-25,15.39-8.61,29.64-19.76,37.84-28.39,5-5.22,4.37-3.79,13.82-16.31,30.35-40.18,42.5-75.89,50.88-136.9.37-2.72-.32-2.94-5.21-1.63C461.65,193.06,409.64,203.61,376.17,254.8Z"
                />
            </G>
            <G id="leaf_7" data-name="leaf_7">
                <AnimatedPath
                    id="cls-10"
                    fill="#aada56"
                    opacity={leaves[6].opacity}
                    transform={[{ scale: leaves[6].scale }]}
                    d="M481.25,449.1c20.77,1.86,51.55-2.51,69.63-7.28,15.4-4.07,16.52-4.82,21.91-6.91.81-.32,18.77-6.81,22.26-9.06.46-.3.25-.63.07-.74-25.32-14.61-67.76-35.8-105.34-38.88-25.71-2.11-51.21-.27-85.06,15.16-5.2,2.36-13.71,7-14.44,7.87,0,0-.34.27-.12.5C399.86,419.86,446.75,446,481.25,449.1Z"
                />
            </G>
        </Svg>
        {preload && <View style={styles.titleContainer}>
            <Text style={styles.title}>Stand-by</Text>
            <AnimatedText style={StyleSheet.flatten([styles.title, { opacity: dot1 }])}>.</AnimatedText>
            <AnimatedText style={StyleSheet.flatten([styles.title, { opacity: dot2 }])}>.</AnimatedText>
            <AnimatedText style={StyleSheet.flatten([styles.title, { opacity: dot3 }])}>.</AnimatedText>
        </View>}

    </View>;
};
