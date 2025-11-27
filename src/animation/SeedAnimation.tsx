// outsource dependencies
import Animated, {
    Easing,
    withDelay,
    withTiming,
    useSharedValue,
    useAnimatedStyle
} from 'react-native-reanimated';
import React, { memo, useEffect, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dimensions, Image, StyleSheet, ImageSourcePropType } from 'react-native';

// local dependencies
import { SEED_SIZE } from 'screens/privateScreens/DayOverview/Edit';

interface SeedAnimationProps {
    x: number,
    y: number,
    seedIndex: number
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
export const SeedAnimation = memo(({ x, y, seedIndex }: SeedAnimationProps) => {
    const insets = useSafeAreaInsets();
    const seedsArray = useMemo(() => {
        const images: ImageSourcePropType[] = [
            require('../../assets/seeds/seed1.png'),
            require('../../assets/seeds/seed2.png'),
            require('../../assets/seeds/seed3.png'),
            require('../../assets/seeds/seed4.png'),
        ];
        let delay = 0;
        let offsetX = -30;
        return Array.from({ length: 7 }).map((_, i) => {
            const index = Math.floor(Math.random() * images.length);
            const BASE_SPREAD_X = 40;
            const SPREAD_X = Math.max(BASE_SPREAD_X - seedIndex * 20, 5);

            const item = {
                delay,
                duration: 1500,
                translateYValue: 0,
                source: images[index],
                id: Math.random().toString(),
                offsetY: (Math.random() - 0.5),
                offsetX: offsetX + (Math.random() - 0.5) * SPREAD_X,
            };

            delay = delay + 6;
            offsetX = offsetX + 6;
            return item;
        });
    }, [seedIndex]);

    const seeds = seedsArray.map(seed => ({
        ...seed,
        translateY: useSharedValue(0),
    }));

    useEffect(() => {
        seeds.forEach(seed => {
            seed.translateY.value = withDelay(
                seed.delay,
                withTiming(
                    SCREEN_HEIGHT - y - insets.top - 34 - SEED_SIZE - 100 - (seedIndex + SEED_SIZE),
                    {
                        easing: Easing.linear,
                        duration: seed.duration,
                    }
                )
            );
        });
    }, [y, seeds, seedIndex]);

    return (
        <>
            {seeds.map(seed => {
                const animatedStyle = useAnimatedStyle(() => ({
                    transform: [{ translateY: seed.translateY.value }],
                }));

                return (
                    <Animated.View
                        key={seed.id}
                        style={[
                            animatedStyle,
                            styles.container,
                            {
                                top: y + seed.offsetY,
                                left: x + seed.offsetX,
                            },
                        ]}
                    >
                        <Image
                            source={seed.source}
                            style={{ width: '100%', height: '100%' }}
                        />
                    </Animated.View>
                );
            })}
        </>
    );
});

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        zIndex: 99,
        width: SEED_SIZE,
        height: SEED_SIZE,
    },
});
