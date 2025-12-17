// outsource dependencies
import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

// local dependencies
import Text from 'components/Text.tsx';
import Screen from 'components/Screen.tsx';

interface AudioScreenProps {
  // props here
}

const AudioScreen = (props: AudioScreenProps) => {
    return <Screen initialized={true}>
    </Screen>;
};

export default memo(AudioScreen);
const styles = StyleSheet.create({
    container: {
    // style here
    },
});
