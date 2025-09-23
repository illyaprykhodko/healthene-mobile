// outsource dependencies
import React, { useCallback, useEffect, useState, ReactNode } from 'react';
import { StyleSheet, ImageBackground, Platform, Keyboard, ViewStyle } from 'react-native';
// local dependencies
import { OFFSET } from 'constants/offset';

interface BackgroundImageProps {
  style?: ViewStyle;
  children: ReactNode;
}

const styles = StyleSheet.create({
    image: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: OFFSET.VERTICAL * 2,
    },
});

const BackgroundImage: React.FC<BackgroundImageProps> = ({ children, style = {} }) => {
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
        return () => {
            keyboardDidHideListener.remove();
            keyboardDidShowListener.remove();
        };
    }, []);

    const backgroundImage = Platform.OS === 'ios'
        ? require('../../assets/sign-in-bg.png')
        : { uri: 'asset:/sign-in-bg.png' };

    const backgroundImageStyle = useCallback(() => StyleSheet.flatten([
        styles.image,
        style,
        { height: isKeyboardVisible ? 110 : 320 },
    ]), [isKeyboardVisible, style]);

    return (
        <ImageBackground source={backgroundImage} style={backgroundImageStyle()}>
            {children}
        </ImageBackground>
    );
};

export default React.memo(BackgroundImage);
