// outsource dependencies
import React from 'react';
import FeatherIcon from '@react-native-vector-icons/feather';
import { Image, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from 'hooks/useTheme';

interface ProfileImageProps {
    width?: number;
    height?: number;
    style?: ViewStyle;
    uri: string | undefined;
}

const ProfileImage = ({ width = 48, height = 48, uri, style }: ProfileImageProps) => {
    const theme = useTheme();
    return <View style={[styles.container, style, { borderRadius: width / 2 }]}>
        {uri
            ? <Image source={{ uri }} width={width} height={height}/>
            : <FeatherIcon color={theme.colors.text} size={48} name="user"/>
        }
    </View>;

};

export default ProfileImage;

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
        alignSelf: 'flex-start'
    },
});
