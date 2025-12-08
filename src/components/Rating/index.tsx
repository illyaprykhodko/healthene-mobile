// outsource dependencies
import React, { useState } from 'react';
import { Svg, Path } from 'react-native-svg';
import { View, StyleSheet, Pressable, ViewStyle } from 'react-native';

// local dependencies
import { OFFSET } from 'constants/offset';
import { useTheme } from 'hooks/useTheme';

interface RatingProps {
    value?: number;
    style?: ViewStyle;
    disabled?: boolean;
    onApply?: (data: { rating: number }) => void;
}

const Rating: React.FC<RatingProps> = ({ value = 0, disabled = false, style, onApply }) => {
    const theme = useTheme();
    const [rating, setRating] = useState(value);

    const handleStarPress = (index: number) => {
        if (disabled) { return; }

        const newRating = index + 1;
        setRating(newRating);
        onApply?.({ rating: newRating });
    };

    return (
        <View style={[styles.container, style]}>
            {[0, 1, 2, 3, 4].map(index => {
                const isFilled = index < rating;
                return (
                    <Pressable
                        key={index}
                        disabled={disabled}
                        style={styles.starButton}
                        onPress={() => handleStarPress(index)}
                    >
                        <Star size={35} filled={isFilled} strokeColor="#C79944" fillColor="#FFC55A" />
                    </Pressable>
                );
            })}
        </View>
    );
};

export default Rating;

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        paddingVertical: OFFSET.VERTICAL,
    },
    starButton: {
        marginHorizontal: 4,
    },
});

interface StarProps {
    size?: number;
    filled: boolean;
    fillColor: string;
    strokeColor: string;
}

const Star = ({ size = 45, filled, strokeColor, fillColor }: StarProps) => (
    <Svg width={size} height={size} viewBox="0 0 34 33" fill="none">
        <Path
            fill={fillColor} // fill={filled ? fillColor : 'none'}
            strokeWidth="1.5"
            fillOpacity={filled ? 1 : 0}
            stroke={!filled ? strokeColor : fillColor}
            d="M15.6474 2.16292C16.0731 0.852608 17.9269 0.852608 18.3526 2.16292L21.171 10.8369C21.3614 11.4229 21.9074 11.8197 22.5236 11.8197H31.644C33.0217 11.8197 33.5946 13.5827 32.4799 14.3925L25.1014 19.7533C24.6029 20.1155 24.3943 20.7574 24.5847 21.3434L27.4031 30.0174C27.8288 31.3277 26.3291 32.4173 25.2145 31.6075L17.836 26.2467C17.3375 25.8845 16.6625 25.8845 16.164 26.2467L8.78548 31.6075C7.67087 32.4173 6.17116 31.3277 6.59691 30.0174L9.41527 21.3434C9.60566 20.7574 9.39708 20.1155 8.89861 19.7533L1.52006 14.3925C0.405444 13.5827 0.97828 11.8197 2.35602 11.8197H11.4764C12.0926 11.8197 12.6386 11.4229 12.829 10.8369L15.6474 2.16292Z"
        />
    </Svg>
);
