// outsource dependencies
import React, { useState } from 'react';
import Icon from '@react-native-vector-icons/fontawesome5';
import { Image, View, StyleSheet, ImageStyle } from 'react-native';

type DefImageIconName =
    | 'utensils'

interface DefImageProps {
    src?: string;
    style?: ImageStyle;
    defaultIcon?: DefImageIconName;
}

const DefImage: React.FC<DefImageProps> = ({ src, style, defaultIcon = 'utensils' }) => {
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    if (!src || hasError) {
        return (
            <View style={[styles.placeholder, style]}>
                <Icon iconStyle="solid" name={defaultIcon} size={24} color="#CCCCCC" />
            </View>
        );
    }

    return (
        <Image
            style={style}
            source={{ uri: src }}
            onError={() => setHasError(true)}
            onLoad={() => setIsLoading(false)}
            onLoadStart={() => setIsLoading(true)}
        />
    );
};

export default DefImage;

const styles = StyleSheet.create({
    placeholder: {
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
