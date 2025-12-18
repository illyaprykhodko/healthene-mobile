// outsource dependencies
import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

// local dependencies
import { OFFSET } from 'constants/offset.ts';
import { useTheme } from 'hooks/useTheme.ts';
import { Attachment } from 'types/messenger.ts';
import Text from 'components/Text.tsx';
import AudioControls from 'components/AudioRecord/AudioControls.tsx';

interface AudioRecordProps {
    onCapture: (item: Attachment) => void
}

const AudioRecord = (props: AudioRecordProps) => {
    const theme = useTheme();
    return <View style={styles.container}>
        <View style={styles.wrapper}>
            <Icon
                size={148}
                name="multitrack-audio"
                style={styles.icon}
                color={theme.colors.darkGrey}
            />
        </View>
        <View style={{ height: 120, width: '100%', backgroundColor: theme.colors.grey }}>
            <AudioControls onPress={() => {}} isRecording={false} recordingDuration={1} onStopRecording={() => {}} onStartRecording={() => {}}/>
        </View>
    </View>;
};

export default memo(AudioRecord);
const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        // marginVertical: OFFSET.VERTICAL,
    },
    wrapper: {
        flex: 1,
        borderWidth: 1,
        justifyContent: 'center',
        marginVertical: OFFSET.VERTICAL,
    },
    icon: {
        alignSelf: 'center',
    },
    button: {
        marginBottom: OFFSET.VERTICAL,
    },
});
