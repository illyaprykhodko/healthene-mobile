// outsource dependencies
import Slider from '@react-native-community/slider';
import React, { memo, useCallback, useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Platform, ViewStyle, StyleProp } from 'react-native';

// local dependencies
import Text from 'components/Text';
import { useTheme } from 'hooks/useTheme';
import { OFFSET } from 'constants/offset';

interface RangeSliderProps {
    item?: any;
    title?: string;
    value?: number;
    isFormDirty?: boolean;
    minimumValue?: number;
    maximumValue?: number;
    style?: StyleProp<ViewStyle>;
    onChange?: (item: any, value: number) => void;
}

const RangeSliderComponent: React.FC<RangeSliderProps> = ({
    item,
    style,
    onChange,
    value = 1,
    title = '',
    minimumValue = 1,
    maximumValue = 10,
    isFormDirty = false,
}) => {
    const theme = useTheme();
    const [isDirty, setIsDirty] = useState(false);
    const isSliding = useRef(false);

    useEffect(() => {
        if (!isFormDirty) {
            setIsDirty(false);
        }
    }, [isFormDirty]);

    const handleSlidingStart = useCallback(() => {
        isSliding.current = true;
        setIsDirty(true);
    }, []);

    // Update parent state only when sliding completes with rounded value
    const handleSlidingComplete = useCallback((newValue: number) => {
        isSliding.current = false;
        const roundedValue = Math.round(newValue);
        onChange?.(item, roundedValue);
    }, [onChange, item]);

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.white }, style]}>
            <View style={styles.content}>
                <Text variant="body" style={styles.title}>{title}</Text>
                <View style={styles.sliderContainer} />
                <View style={styles.sliderWrapper}>
                    <Slider
                        value={value}
                        style={styles.slider}
                        minimumValue={minimumValue}
                        maximumValue={maximumValue}
                        onSlidingStart={handleSlidingStart}
                        onSlidingComplete={handleSlidingComplete}
                        maximumTrackTintColor={theme.colors.border}
                        minimumTrackTintColor={isDirty ? theme.colors.primary : theme.colors.text}
                        thumbTintColor={isDirty ? theme.colors.successAlt : theme.colors.textSecondary}
                    />
                    <View style={styles.ticksContainer}>
                        <View style={[styles.tickFirst, { backgroundColor: theme.colors.text }]} />
                        <View style={[styles.tickLast, { backgroundColor: theme.colors.border }]} />
                    </View>
                </View>
            </View>
            <View style={styles.footer}>
                <Text variant="caption" color={theme.colors.textSecondary}>Less</Text>
                <Text variant="caption" color={theme.colors.textSecondary}>More</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 8,
        marginVertical: OFFSET.POINT,
        paddingVertical: OFFSET.VERTICAL,
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    content: {
        alignItems: 'center',
    },
    ticksContainer: {
        bottom: 27,
        width: '100%',
        position: 'relative',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    tickFirst: {
        width: 2,
        height: 15,
        marginLeft: Platform.OS === 'ios' ? 3 : 15,
    },
    tickLast: {
        width: 2,
        height: 15,
        marginRight: Platform.OS === 'ios' ? 3 : 15,
    },
    title: {
        marginTop: 5,
        textAlign: 'left',
        alignSelf: 'flex-start',
        fontWeight: '500',
    },
    sliderContainer: {
        marginVertical: 10,
        alignSelf: 'stretch',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
    },
    sliderWrapper: {
        width: '100%',
        paddingHorizontal: 20,
    },
    slider: {
        height: 40,
        zIndex: 999,
        width: '100%',
    },
    footer: {
        flexDirection: 'row',
        paddingHorizontal: 10,
        justifyContent: 'space-between',
    },
});

export const RangeSlider = memo(RangeSliderComponent);
export default RangeSlider;
