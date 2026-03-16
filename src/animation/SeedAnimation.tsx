/// <reference types="matter-js" />
// outsource dependencies
import Matter from 'matter-js';
import { useHeaderHeight } from '@react-navigation/elements';
import { Dimensions, Image, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { makeMutable, useAnimatedStyle } from 'react-native-reanimated';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

// local dependencies
import { COMPONENT_HEIGHT } from '../components/AnytimeMenu/constants';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const SEED_SIZE = 8;
const SEED_RADIUS = SEED_SIZE / 2; // Match visual; same size = no gaps/incorrect overlap
const SEEDS_PER_CHECK = 5;
const MAX_SEEDS = 50;
const FLOOR_HEIGHT = 20;

const SEED_IMAGES = [
    require('../../assets/seeds/seed1.png'),
    require('../../assets/seeds/seed2.png'),
    require('../../assets/seeds/seed3.png'),
    require('../../assets/seeds/seed4.png'),
] as const;

interface SeedState {
    body: Matter.Body;
    imageIndex: number;
    x: ReturnType<typeof makeMutable<number>>;
    y: ReturnType<typeof makeMutable<number>>;
    angle: ReturnType<typeof makeMutable<number>>;
}

export interface SeedAnimationRef {
    spawnSeeds: (x: number, y: number) => void;
}

interface SeedSpriteProps {
    x: ReturnType<typeof makeMutable<number>>;
    y: ReturnType<typeof makeMutable<number>>;
    angle: ReturnType<typeof makeMutable<number>>;
    imageIndex: number;
}

const SeedSprite: React.FC<SeedSpriteProps> = ({ x, y, angle, imageIndex }) => {
    const animatedStyle = useAnimatedStyle(() => {
        'worklet';
        return {
            position: 'absolute' as const,
            left: x.value - SEED_SIZE / 2,
            top: y.value - SEED_SIZE / 2,
            width: SEED_SIZE,
            height: SEED_SIZE,
            transform: [{ rotate: `${angle.value}rad` }],
        };
    });

    return (
        <Animated.View style={animatedStyle}>
            <Image
                source={SEED_IMAGES[imageIndex]}
                style={styles.seedImage}
                resizeMode="contain"
            />
        </Animated.View>
    );
};

const engine = Matter.Engine.create({
    gravity: { x: 0, y: 1 },
    enableSleeping: true, // Resting seeds sleep so the pile stabilizes and expands naturally
    positionIterations: 12,
    velocityIterations: 8,
});
const world = engine.world;

export const SeedAnimation = forwardRef<SeedAnimationRef, object>((_props, ref) => {
    const insets = useSafeAreaInsets();
    const headerHeight = useHeaderHeight();
    const floorY = SCREEN_HEIGHT - insets.bottom - COMPONENT_HEIGHT - headerHeight + SEED_SIZE;

    const containerRef = useRef<View>(null);
    const [seeds, setSeeds] = useState<SeedState[]>([]);
    const bodiesRef = useRef<Matter.Body[]>([]);
    const animationFrameRef = useRef<number | null>(null);
    const floorRef = useRef<Matter.Body | null>(null);
    const leftWallRef = useRef<Matter.Body | null>(null);
    const rightWallRef = useRef<Matter.Body | null>(null);

    const spawnSeeds = useCallback((spawnX: number, spawnY: number) => {
        // Both checkbox and container use measureInWindow – convert to exact local coords
        containerRef.current?.measureInWindow((cx, cy) => {
            const localX = spawnX - cx;
            const localY = spawnY - cy;

            const newSeeds: SeedState[] = [];
            for (let i = 0; i < SEEDS_PER_CHECK; i++) {
                const offsetX = 0; // No horizontal spread – straight vertical column
                const offsetY = i * SEED_SIZE; // Seeds touch (back-to-back) as they fall, no gaps
                const posX = localX + offsetX;
                const posY = localY + offsetY;

                const x = makeMutable(posX);
                const y = makeMutable(posY);
                const angle = makeMutable(0);
                const imageIndex = Math.floor(Math.random() * 4);

                const body = Matter.Bodies.circle(posX, posY, SEED_RADIUS, {
                    restitution: 0.1,
                    friction: 0.8,
                });

                Matter.Body.setVelocity(body, { x: 0, y: 0 });
                Matter.Body.setAngularVelocity(body, 0);

                Matter.World.add(world, body);

                newSeeds.push({ body, imageIndex, x, y, angle });
            }

            setSeeds(prev => {
                const next = [...prev, ...newSeeds];
                bodiesRef.current = next.map(s => s.body);

                if (next.length > MAX_SEEDS) {
                    const toRemove = next.slice(0, next.length - MAX_SEEDS);
                    toRemove.forEach(s => Matter.World.remove(world, s.body));
                    return next.slice(next.length - MAX_SEEDS);
                }
                return next;
            });
        });
    }, []);

    useEffect(() => {
        const floor = Matter.Bodies.rectangle(
            SCREEN_WIDTH / 2,
            floorY + FLOOR_HEIGHT / 2,
            SCREEN_WIDTH * 2,
            FLOOR_HEIGHT,
            { isStatic: true }
        );
        const leftWall = Matter.Bodies.rectangle(-20, SCREEN_HEIGHT / 2, 1, SCREEN_HEIGHT * 2, {
            isStatic: true,
        });
        const rightWall = Matter.Bodies.rectangle(
            SCREEN_WIDTH + 20,
            SCREEN_HEIGHT / 2,
            1,
            SCREEN_HEIGHT * 2,
            { isStatic: true }
        );

        Matter.World.add(world, [floor, leftWall, rightWall]);
        floorRef.current = floor;
        leftWallRef.current = leftWall;
        rightWallRef.current = rightWall;

        return () => {
            Matter.World.remove(world, [floor, leftWall, rightWall]);
        };
    }, [floorY]);

    useEffect(() => {
        bodiesRef.current = seeds.map(s => s.body);

        const update = () => {
            Matter.Engine.update(engine, 1000 / 60);

            seeds.forEach((seed) => {
                const body = seed.body;
                seed.x.value = body.position.x;
                seed.y.value = body.position.y;
                seed.angle.value = body.angle;
            });

            animationFrameRef.current = requestAnimationFrame(update);
        };

        update();

        return () => {
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [seeds]);

    useImperativeHandle(ref, () => ({
        spawnSeeds,
    }), [spawnSeeds]);

    return (
        <View ref={containerRef} style={styles.container} pointerEvents="none" collapsable={false}>
            {seeds.map((seed, index) => (
                <SeedSprite
                  x={seed.x}
                  y={seed.y}
                  angle={seed.angle}
                  imageIndex={seed.imageIndex}
                  key={`${seed.body.id}-${index}`}
                />
            ))}
        </View>
    );
});

SeedAnimation.displayName = 'SeedAnimation';

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 19999998,
    },
    seedImage: {
        width: SEED_SIZE,
        height: SEED_SIZE,
    },
});
