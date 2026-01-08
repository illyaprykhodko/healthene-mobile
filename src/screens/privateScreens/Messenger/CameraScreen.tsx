// outsource dependencies
import React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// local dependencies
import Camera from 'components/Camera';
import { ROUTES } from 'constants/routes.ts';
import { Attachment } from 'types/messenger.ts';
import { RootStackParamList } from 'services/navigation';
import { setAttachment } from 'store/slices/messengerSlice.ts';

const CameraScreen = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const handleCapture = (item: Attachment) => {
        dispatch(setAttachment(item));
        navigation.navigate(ROUTES.WRITE_MESSAGE);
    };

    return <Camera cameraPosition="front" onCapture={handleCapture} />;
};

export default CameraScreen;

