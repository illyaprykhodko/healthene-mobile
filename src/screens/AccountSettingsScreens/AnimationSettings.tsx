// outsource dependencies
import React from 'react';
import { View, Switch, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// local dependencies
import Text from 'components/Text';
import Screen from 'components/Screen';
import { OFFSET } from 'constants/offset';
import { useTheme } from 'hooks/useTheme';
import { useAppDispatch, useAppSelector } from 'store';
import { setBirdSoundEnabled, selectBirdSoundEnabled } from 'store/slices/appSlice';

const BIRD_SOUND_KEY = '@birdSoundEnabled';

// TODO: sync with backend (HS-3044) when API is ready

const AnimationSettings: React.FC = () => {
    const theme = useTheme();
    const dispatch = useAppDispatch();
    const birdSoundEnabled = useAppSelector(selectBirdSoundEnabled);

    return (
        <Screen initialized>
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <View style={[styles.row, { borderBottomColor: theme.colors.border }]}>
                    <Text variant="body" color={theme.colors.text}>Bird Animation Sound</Text>
                    <Switch
                        value={birdSoundEnabled}
                        onValueChange={v => {
                            dispatch(setBirdSoundEnabled(v));
                            AsyncStorage.setItem(BIRD_SOUND_KEY, String(v));
                        }}
                        thumbColor={theme.colors.white}
                        ios_backgroundColor={theme.colors.white}
                        trackColor={{ false: '#B2B2B2', true: '#4CDA64' }}
                    />
                </View>
            </View>
        </Screen>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        paddingHorizontal: OFFSET.HORIZONTAL,
        paddingVertical: OFFSET.VERTICAL,
    },
});

export default AnimationSettings;
