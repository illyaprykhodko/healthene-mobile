// outsource dependencies
import React, { useEffect } from 'react';
import Svg, { Circle } from 'react-native-svg';
import { StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    withDelay,
    withTiming,
    useSharedValue,
    useReducedMotion,
    useAnimatedProps,
} from 'react-native-reanimated';
// local dependencies
import Text from 'components/Text';
import { COLORS } from 'constants/colors';
import type { AdherenceRing } from 'hooks/useDayAdherence';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface RingProps {
    delay: number;
    radius: number;
    center: number;
    strokeWidth: number;
    ring: AdherenceRing;
}

const Ring: React.FC<RingProps> = ({ ring, radius, center, strokeWidth, delay }) => {
    const circumference = 2 * Math.PI * radius;
    const reduceMotion = useReducedMotion();
    const progress = useSharedValue(0);

    useEffect(() => {
        const target = Math.max(0, Math.min(1, ring.progress));
        progress.value = reduceMotion
            ? target
            : withDelay(delay, withTiming(target, { duration: 950, easing: Easing.out(Easing.cubic) }));
    }, [ring.progress, reduceMotion, delay, progress]);

    const animatedProps = useAnimatedProps(() => ({
        strokeDashoffset: circumference * (1 - progress.value),
    }));

    return (
        <>
            <Circle
                r={radius}
                fill="none"
                cx={center}
                cy={center}
                stroke={ring.color}
                strokeOpacity={0.16}
                strokeWidth={strokeWidth}
            />
            <AnimatedCircle
                r={radius}
                fill="none"
                cx={center}
                cy={center}
                stroke={ring.color}
                strokeLinecap="round"
                strokeWidth={strokeWidth}
                animatedProps={animatedProps}
                strokeDasharray={circumference}
                transform={`rotate(-90 ${center} ${center})`}
            />
        </>
    );
};

interface ActivityRingsProps {
    /** Outer -> inner. */
    gap?: number;
    size?: number;
    centerText?: string;
    strokeWidth?: number;
    centerSubtext?: string;
    rings: AdherenceRing[];
}

export const ActivityRings: React.FC<ActivityRingsProps> = ({
    rings,
    gap = 5,
    size = 140,
    centerText,
    centerSubtext,
    strokeWidth = 12,
}) => {
    const center = size / 2;

    return (
        <View style={{ width: size, height: size }}>
            <Svg width={size} height={size}>
                {rings.map((ring, index) => (
                    <Ring
                        ring={ring}
                        key={ring.key}
                        center={center}
                        delay={index * 120}
                        strokeWidth={strokeWidth}
                        radius={center - strokeWidth / 2 - index * (strokeWidth + gap)}
                    />
                ))}
            </Svg>
            {centerText ? (
                <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
                    <Text variant="h3" style={styles.centerText}>
                        {centerText}
                    </Text>
                    {centerSubtext ? (
                        <Text style={styles.centerSubtext} color={COLORS.GREY}>
                            {centerSubtext}
                        </Text>
                    ) : null}
                </View>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    center: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerText: {
        fontWeight: '700',
        color: COLORS.DARK_GREY,
    },
    centerSubtext: {
        fontSize: 11,
        marginTop: 2,
    },
});
