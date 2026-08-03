// outsource dependencies
import Sound from 'react-native-nitro-sound';
import Toast from 'react-native-toast-message';
import Slider from '@react-native-community/slider';
import Icon from '@react-native-vector-icons/fontawesome5';
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';

// local dependencies
import { useTheme } from 'hooks/useTheme.ts';
import { OFFSET } from 'constants/offset.ts';
import { formatDuration } from 'utils/general.ts';
import { MAX_FONT_SCALE } from 'constants/typography.ts';

type AudioPlayerProps = {
    file: string | undefined;
};

const AudioPlayer = ({ file }: AudioPlayerProps) => {
    const theme = useTheme();
    if (!file) {
        Toast.show({
            type: 'error',
            text1: 'Audio error',
            text2: 'Audio file is missing or unavailable. Playback cannot be started.'
        });
        return null;
    }
    const [isPlaying, setIsPlaying] = useState(false);
    const [position, setPosition] = useState(0);
    const [duration, setDuration] = useState(0);

    const play = useCallback(async () => {
        await Sound.startPlayer(file);
        setIsPlaying(true);

        Sound.addPlayBackListener(e => {
            setPosition(e.currentPosition);
            setDuration(e.duration);
        });
    }, [file]);

    const pause = useCallback(async () => {
        await Sound.pausePlayer();
        setIsPlaying(false);
    }, []);

    const stop = useCallback(async () => {
        await Sound.stopPlayer();
        Sound.removePlayBackListener();
        setIsPlaying(false);
        setPosition(0);
    }, []);

    const seek = async (value: number) => {
        await Sound.seekToPlayer(value);
        setPosition(value);
    };

    useEffect(() => {
        return () => {
            Sound.stopPlayer();
            Sound.removePlayBackListener();
        };
    }, []);


    return (
        <View style={[styles.player, { backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md }]}>
            <Pressable
                style={styles.button}
                onPress={isPlaying ? pause : play}
            >
                <Icon
                    size={20}
                    iconStyle="solid"
                    color={theme.colors.white}
                    name={isPlaying ? 'pause' : 'play'}
                />
            </Pressable>

            <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.time}>
                {formatDuration(Math.floor(position / 1000))}
            </Text>

            <Slider
                minimumValue={0}
                value={position}
                style={styles.slider}
                maximumValue={duration}
                onSlidingComplete={seek}
                thumbTintColor={theme.colors.white}
                minimumTrackTintColor={theme.colors.white}
                maximumTrackTintColor={theme.colors.grey}
            />

            <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.time}>
                {formatDuration(Math.floor(duration / 1000))}
            </Text>

            <Pressable onPress={stop} style={styles.button}>
                <Icon iconStyle="solid" name="stop" size={18} color={theme.colors.white} />
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    player: {
        marginHorizontal: OFFSET.HORIZONTAL,
        padding: OFFSET.POINT,
        flexDirection: 'row',
        alignItems: 'center',
    },
    slider: {
        flex: 1,
        alignSelf: 'center',
        marginHorizontal: Platform.select({ ios: 5 }),
    },
    time: {
        color: '#FFF',
        width: 45,
        textAlign: 'center',
    },
    button: {
        marginHorizontal: OFFSET.POINT * 2,
    },
});

export default AudioPlayer;
