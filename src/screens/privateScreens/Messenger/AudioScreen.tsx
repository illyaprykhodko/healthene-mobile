// outsource dependencies
import React, { memo } from 'react';
import { StyleSheet } from 'react-native';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// local dependencies
import { ROUTES } from 'constants/routes.ts';
import { Attachment } from 'types/messenger.ts';
import AudioRecord from 'components/AudioRecord';
import { RootStackParamList } from 'services/navigation';
import { setAttachment } from 'store/slices/messengerSlice.ts';

interface AudioScreenProps {
  // props here
}

const AudioScreen = (props: AudioScreenProps) => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const handleCapture = (item: Attachment) => {
        dispatch(setAttachment(item));
        navigation.navigate(ROUTES.WRITE_MESSAGE);
    };
    return <AudioRecord onCapture={handleCapture}/>;
};

export default memo(AudioScreen);
const styles = StyleSheet.create({
    container: {
    // style here
    },
});
