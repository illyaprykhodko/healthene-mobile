// outsource dependencies
import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
    Easing,
} from 'react-native-reanimated';

// local dependencies
import { useTheme } from 'hooks/useTheme';

interface SkeletonProps {
    width?: ViewStyle['width'];
    height?: ViewStyle['height'];
    style?: StyleProp<ViewStyle>;
    borderRadius?: ViewStyle['borderRadius'];
}

export const Skeleton: React.FC<SkeletonProps> = ({
    style,
    height = 20,
    width = '100%',
    borderRadius = 4,
}) => {
    const theme = useTheme();
    const shimmerValue = useSharedValue(0);

    React.useEffect(() => {
        shimmerValue.value = withRepeat(
            withTiming(1, {
                duration: 1500,
                easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            }),
            -1,
            false
        );
    }, [shimmerValue]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: 0.5 + shimmerValue.value * 0.5,
        };
    });

    return (
        <View style={[styles.container, { width, height, borderRadius }, style]}>
            <Animated.View
                style={[
                    styles.shimmer,
                    {
                        backgroundColor: theme.colors.grey,
                        borderRadius,
                    },
                    animatedStyle,
                ]}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
    },
    shimmer: {
        width: '100%',
        height: '100%',
    },
});
