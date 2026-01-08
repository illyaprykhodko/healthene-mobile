// outsource dependencies
import React, { memo, useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

type Props = {
  /**
   * How many emoji visible at once (default 7)
   */
  count?: number;
  /**
   * Interval between appearances in ms (default 160)
   */
  staggerMs?: number;
  /**
   * Emoji size in px (default 18)
   */
  size?: number;
  /**
   * Space between emoji in px (default 8)
   */
  gap?: number;
  /**
   * Optional: override emoji set
   */
  emojis?: string[];
};

const DEFAULT_EMOJIS = [
    '🥦', '🥕', '🍅', '🫑', '🥒', '🧅', '🌽', '🍆', '🥬', '🧄', '🍄', '🥑',
];

export const VeggieEmojiRail: React.FC<Props> = memo(({
    staggerMs = 160,
    size = 18,
    count = 7,
    gap = 8,
    emojis,
}) => {
    const pool = emojis?.length ? emojis : DEFAULT_EMOJIS;

    // Pick a stable sequence of emojis for the rail
    const seq = useMemo(() => {
        const out: string[] = [];
        for (let i = 0; i < count; i += 1) {
            out.push(pool[i % pool.length]);
        }
        return out;
    }, [count, pool]);

    // Animated values: opacity + translateY + scale for each emoji
    const opacities = useRef(seq.map(() => new Animated.Value(0))).current;
    const translates = useRef(seq.map(() => new Animated.Value(6))).current;
    const scales = useRef(seq.map(() => new Animated.Value(0.9))).current;

    const loopRef = useRef<Animated.CompositeAnimation | null>(null);

    useEffect(() => {
    // Reset all values before each loop
        const reset = () => {
            opacities.forEach(v => v.setValue(0));
            translates.forEach(v => v.setValue(6));
            scales.forEach(v => v.setValue(0.9));
        };

        const makeOne = (i: number) => Animated.parallel([
            Animated.timing(opacities[i], {
                toValue: 1,
                duration: 220,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(translates[i], {
                toValue: 0,
                duration: 240,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(scales[i], {
                toValue: 1,
                duration: 240,
                easing: Easing.out(Easing.back(1.4)),
                useNativeDriver: true,
            }),
        ]);

        const makeFadeAll = Animated.parallel(
            opacities.map(v =>
                Animated.timing(v, {
                    toValue: 0,
                    duration: 260,
                    easing: Easing.inOut(Easing.quad),
                    useNativeDriver: true,
                })
            )
        );

        const run = () => {
            reset();

            const appearSeq = Animated.stagger(staggerMs, seq.map((_, i) => makeOne(i)));

            // Optional small pause after the line is complete
            const pause = Animated.delay(420);

            loopRef.current = Animated.sequence([appearSeq, pause, makeFadeAll, Animated.delay(150)]);
            loopRef.current.start(({ finished }) => {
                if (finished) { run(); }
            });
        };

        run();

        return () => {
            loopRef.current?.stop();
        };
    }, [opacities, translates, scales, seq, staggerMs]);

    return (
        <View style={[styles.row, { gap }]}>
            {seq.map((emoji, i) => (
                <Animated.Text
                    key={`${emoji}_${i}`}
                    style={[
                        styles.emoji,
                        {
                            fontSize: size,
                            opacity: opacities[i],
                            transform: [{ translateY: translates[i] }, { scale: scales[i] }],
                        },
                    ]}
                >
                    {emoji}
                </Animated.Text>
            ))}
        </View>
    );
});

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    emoji: {
        includeFontPadding: false,
        textAlignVertical: 'center',
    },
});

export default VeggieEmojiRail;
