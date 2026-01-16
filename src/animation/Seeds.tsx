import Matter from 'matter-js';
import { Button } from 'components/Button.tsx';
import { StyleSheet, Dimensions } from 'react-native';
import React, { memo, useEffect, useRef, useState } from 'react';
import { SharedValue, makeMutable } from 'react-native-reanimated';
import { SkPoint, Canvas, Image, vec, useImage, SkImage } from '@shopify/react-native-skia';

const { height, width } = Dimensions.get('window');

const BOX_SIZE = 6;
const BOTTOM_HEIGHT = 160;

const engine = Matter.Engine.create();
const world = engine.world;

const topWall = Matter.Bodies.rectangle(
    width / 2,
    0,
    width,
    1,
    { isStatic: true }
);

const bottomWall = Matter.Bodies.rectangle(
    width / 2,
    height - BOTTOM_HEIGHT,
    width,
    BOTTOM_HEIGHT,
    { isStatic: true }
);

const ACTIVE_WIDTH = width * 0.15;
const leftLimit = (width - ACTIVE_WIDTH) / 2;
const rightLimit = leftLimit + ACTIVE_WIDTH;

const slopeAngle = Math.PI / 8;

const leftWall = Matter.Bodies.rectangle(
    leftLimit - 6,
    height - BOTTOM_HEIGHT / 2,
    6,
    BOTTOM_HEIGHT,
    {
        isStatic: true,
        angle: slopeAngle,
        friction: 1,
        frictionStatic: 1,
        restitution: 0,
    }
);

const rightWall = Matter.Bodies.rectangle(
    rightLimit + 6,
    height - BOTTOM_HEIGHT / 2,
    6,
    BOTTOM_HEIGHT,
    {
        isStatic: true,
        angle: -slopeAngle,
        friction: 1,
        frictionStatic: 1,
        restitution: 0,
    }
);

Matter.World.add(world, [bottomWall, topWall, leftWall, rightWall]);

type BoxCoords = {
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


const SeedsAnimation = () => {

    const [elements, setElements] = useState<GameObjects[]>([]);
    const boxesWorld = useRef<Matter.Body[]>([]);

    const seedImages = [
        useImage(require('../../assets/seeds/seed1.png')),
        useImage(require('../../assets/seeds/seed2.png')),
        useImage(require('../../assets/seeds/seed3.png')),
        useImage(require('../../assets/seeds/seed4.png')),
    ];


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

    const handleCoordinates = () => {
        const center = (leftLimit + rightLimit) / 2;
        const spread = ACTIVE_WIDTH * 0.1;
        const COLLISION_SIZE = BOX_SIZE * 0.7;

        const TOTAL = 5;
        const DELAY = 100;
        let count = 0;
        const spawnNext = () => {
            if (count >= TOTAL) { return; }

            const randomImage
                = seedImages[Math.floor(Math.random() * seedImages.length)] ?? null;

            const spawnX = center + (Math.random() - 0.5) * spread;

            const newBoxCoords: BoxCoords = {
                type: 'box',
                width: BOX_SIZE,
                height: BOX_SIZE,
                image: randomImage,
                x: makeMutable(spawnX),
                y: makeMutable(200),
                origin: makeMutable(vec(0, 0)),
                angle: makeMutable([{ rotateZ: 0 }]),
            };

            const newBox = Matter.Bodies.rectangle(
                newBoxCoords.x.value + BOX_SIZE / 2,
                newBoxCoords.y.value + BOX_SIZE / 2,
                COLLISION_SIZE,
                COLLISION_SIZE,
                {
                    restitution: 0.05,
                    friction: 1,
                    frictionStatic: 0.6,
                    frictionAir: 0.02,
                    slop: 0.01,
                    sleepThreshold: 150,
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

    return (
        <>
            <Canvas style={styles.canvas}>
                {elements.map((box, index) => {
                    return <Image
                        x={box.x}
                        y={box.y}
                        key={index}
                        // style="stroke"
                        // strokeWidth={3}
                        image={box.image}
                        width={box.width}
                        color="limegreen"
                        origin={box.origin}
                        height={box.height}
                        transform={box.angle}
                    />;
                })}
            </Canvas>
            <Button title="Add" onPress={handleCoordinates} />
        </>
    );
};

export default memo(SeedsAnimation);

SeedsAnimation.propTypes = {};
SeedsAnimation.defaultProps = {};

const styles = StyleSheet.create({
    canvas: {
        flex: 1,
        backgroundColor: 'white',
    }
});

