// outsource dependencies
import Matter from 'matter-js';
import { useHeaderHeight } from '@react-navigation/elements';
import React, { memo, useEffect, useRef, useState } from 'react';
import { SharedValue, makeMutable } from 'react-native-reanimated';
import { ANYTIME_HEIGHT } from 'components/AnytimeMenu/AnytimeMenu.tsx';
import { StyleSheet, Dimensions, View, LayoutChangeEvent } from 'react-native';
import { SkPoint, Canvas, Image, vec, useImage, SkImage } from '@shopify/react-native-skia';

const { width } = Dimensions.get('window');

const BOX_SIZE = 6;
const engine = Matter.Engine.create();
const world = engine.world;

const ACTIVE_WIDTH = width * 0.15;

export type SeedsCoordinates = {
    centerX: number,
    centerY: number
}

interface SeedsAnimationProps {
    seeds: SeedsCoordinates[]
}

interface BoxCoords {
    type: 'box';
    width: number;
    height: number;
    image: SkImage | null;
    x: SharedValue<number>;
    y: SharedValue<number>;
    origin: SharedValue<SkPoint>;
    angle: SharedValue<[{ rotateZ: number }]>;
}

type GameObjects = BoxCoords;


const SeedsAnimation = ({ seeds }: SeedsAnimationProps) => {
    const headerHeight = useHeaderHeight();
    const [elements, setElements] = useState<GameObjects[]>([]);
    const boxesWorld = useRef<Matter.Body[]>([]);
    const bottomWallRef = useRef<Matter.Body | null>(null);
    console.log('headerHeight!', headerHeight);

    const [canvasHeight, setCanvasHeight] = useState(0);
    const seedImages = [
        useImage(require('../../assets/seeds/seed1.png')),
        useImage(require('../../assets/seeds/seed2.png')),
        useImage(require('../../assets/seeds/seed3.png')),
        useImage(require('../../assets/seeds/seed4.png')),
    ];

    const processedCount = useRef(0);
    useEffect(() => {
        if (!seeds.length) { return; }

        const newSeeds = seeds.slice(processedCount.current);
        if (!newSeeds.length) { return; }

        newSeeds.forEach(seed => {
            dropSeedsFrom(seed);
        });

        processedCount.current = seeds.length;
    }, [seeds]);

    useEffect(() => {
        let animationFrame: any;
        const update = () => {
            Matter.Engine.update(engine, 1000 / 60);
            // eslint-disable-next-line no-undef
            animationFrame = requestAnimationFrame(update);
            elements.forEach((element, i) => {
                element.x.value = boxesWorld.current[i].position.x;
                element.y.value = boxesWorld.current[i].position.y;
                element.angle.value = [{ rotateZ: boxesWorld.current[i].angle }];
                element.origin.value = vec(
                    element.x.value + BOX_SIZE / 2,
                    element.y.value + BOX_SIZE / 2
                );
            });
        };

        update();

        // eslint-disable-next-line no-undef
        return () => cancelAnimationFrame(animationFrame);
    }, [elements]);

    const dropSeedsFrom = (origin: SeedsCoordinates) => {
        const COLLISION_SIZE = BOX_SIZE * 0.7;
        const TOTAL = 5;
        const DELAY = 100;

        let count = 0;

        const spawnNext = () => {
            if (count >= TOTAL) { return; }

            const randomImage = seedImages[Math.floor(Math.random() * seedImages.length)] ?? null;

            const spread = ACTIVE_WIDTH * 0.1;
            const maxY = canvasHeight - ANYTIME_HEIGHT - BOX_SIZE;
            const adjustedY = Math.min(
                Math.max(origin.centerY - headerHeight, 0),
                maxY
            );
            const spawnX = origin.centerX + (Math.random() - 0.5) * spread;

            const newBoxCoords: BoxCoords = {
                type: 'box',
                width: BOX_SIZE,
                height: BOX_SIZE,
                image: randomImage,
                x: makeMutable(spawnX),
                y: makeMutable(adjustedY),
                origin: makeMutable(vec(0, 0)),
                angle: makeMutable([{ rotateZ: 0 }]),
            };

            const newBox = Matter.Bodies.rectangle(
                spawnX,
                adjustedY,
                COLLISION_SIZE,
                COLLISION_SIZE,
                {
                    slop: 0.001,
                    friction: 0.8,
                    restitution: 0,
                    frictionAir: 0.05,
                    sleepThreshold: 40,
                    frictionStatic: 1.2,
                }
            );

            Matter.World.add(world, newBox);
            boxesWorld.current.push(newBox);
            setElements(prev => [...prev, newBoxCoords]);

            count += 1;
            setTimeout(spawnNext, DELAY);
        };

        spawnNext();
    };

    const handleLayout = (e: LayoutChangeEvent) => {
        const h = e.nativeEvent.layout.height;
        setCanvasHeight(h);

        if (!bottomWallRef.current) {
            const FLOOR_OFFSET = 2;

            const bottomCenterY = h - ANYTIME_HEIGHT / 2 - FLOOR_OFFSET;

            const wall = Matter.Bodies.rectangle(
                width / 2,
                bottomCenterY,
                width,
                ANYTIME_HEIGHT,
                { isStatic: true }
            );

            Matter.World.add(world, wall);
            bottomWallRef.current = wall;
        }
    };


    return (
        <View
            style={styles.canvasContainer}
            onLayout={handleLayout}
        >
            <Canvas style={StyleSheet.absoluteFill}>
                {elements.map((box, index) => {
                    return <Image
                        x={box.x}
                        y={box.y}
                        key={index}
                        image={box.image}
                        width={box.width}
                        color="limegreen"
                        origin={box.origin}
                        height={box.height}
                        transform={box.angle}
                    />;
                })}
            </Canvas>
        </View>
    );
};

export default memo(SeedsAnimation);

SeedsAnimation.propTypes = {};
SeedsAnimation.defaultProps = {};

const styles = StyleSheet.create({
    canvasContainer: {
        flex: 1,
        zIndex: 99,
        borderWidth: 1,
        borderColor: 'red',
        pointerEvents: 'none',
        ...StyleSheet.absoluteFillObject,
    },
});

