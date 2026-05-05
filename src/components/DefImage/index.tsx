// outsource dependencies
import React, { useState } from 'react';
import { Image, ImageStyle } from 'react-native';

interface DefImageProps {
    src?: string;
    style?: ImageStyle;
}

const defaultImage = require('../../../assets/def-image.png');

const DefImage: React.FC<DefImageProps> = ({ src, style }) => {
    const [hasError, setHasError] = useState(false);

    if (!src || hasError) {
        return <Image style={style} source={defaultImage} />;
    }

    return (
        <Image
            style={style}
            source={{ uri: src }}
            onError={() => setHasError(true)}
        />
    );
};

export default DefImage;
