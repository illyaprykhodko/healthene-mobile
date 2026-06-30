// outsource dependencies
import React, { useRef, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    ViewStyle,
    StyleSheet,
    NativeScrollEvent,
    InteractionManager,
    ListRenderItemInfo,
    NativeSyntheticEvent,
} from 'react-native';
// local dependencies
import { useTheme } from 'hooks/useTheme';
import { useHaptic } from 'hooks/useHaptic';

export const ITEM_HEIGHT = 50;

// Generate arrays helper (kept for reference)
// const makeRange = (n: number) => Array.from({ length: n + 1 }, (_, i) => i);
// prebuilt ranges kept for potential reuse

// ---- WheelPicker
type WheelPickerProps = {
  data: number[];
  selectedIndex: number;
  selectedItemStyle: ViewStyle;
  onSelect: (index: number) => void;
};

const WheelPickerImpl: React.FC<WheelPickerProps> = ({
    data,
    onSelect,
    selectedIndex,
    selectedItemStyle,
}) => {
    const theme = useTheme();
    const flatListRef = useRef<FlatList<number>>(null);
    const haptics = useHaptic();
    const lastTickIndexRef = useRef(selectedIndex);

    useEffect(() => {
        if (flatListRef.current != null && selectedIndex != null) {
            InteractionManager.runAfterInteractions(() => {
                try {
                    flatListRef.current?.scrollToIndex({ index: selectedIndex, animated: true });
                } catch {
                    // ignore out-of-range errors
                }
            });
        }
    }, [selectedIndex]);

    const keyExtractor = useCallback((item: number) => item.toString(), []);

    const renderItem = useCallback(
        ({ item, index }: ListRenderItemInfo<number>) => (
            <View style={[styles.item, index === selectedIndex && selectedItemStyle]}>
                {/* Fixed-height wheel row (ITEM_HEIGHT + getItemLayout + snapToInterval): opt out of
                    font scaling so the picker geometry and snap offsets stay stable. */}
                <Text
                    allowFontScaling={false}
                    style={[
                        styles.text,
                        { color: index === selectedIndex ? theme.colors.text : theme.colors.textSecondary },
                        index === selectedIndex && styles.selectedText,
                    ]}
                >
                    {item}
                </Text>
            </View>
        ),
        [selectedIndex, selectedItemStyle, theme.colors]
    );

    const getItemLayout = useCallback(
        (_data: ArrayLike<number> | null | undefined, index: number) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
        }),
        []
    );
    // const getItemLayout: FlatListProps<number>['getItemLayout'] = useCallback(
    //     (_data: ArrayLike<number> | null | undefined, index: number) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index }),
    //     []
    // );
    const onMomentumScrollEnd = useCallback(
        (e: NativeSyntheticEvent<NativeScrollEvent>) => {
            const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
            onSelect(index);
        },
        [onSelect]
    );

    // Light "tick" each time the wheel crosses to a new value (iOS-picker feel).
    const onScroll = useCallback(
        (e: NativeSyntheticEvent<NativeScrollEvent>) => {
            const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
            if (index !== lastTickIndexRef.current) {
                lastTickIndexRef.current = index;
                haptics.medium();
            }
        },
        [haptics]
    );

    return (
        <FlatList
            data={data}
            bounces={false}
            ref={flatListRef}
            onScroll={onScroll}
            decelerationRate="fast"
            renderItem={renderItem}
            scrollEventThrottle={16}
            keyExtractor={keyExtractor}
            snapToInterval={ITEM_HEIGHT}
            getItemLayout={getItemLayout}
            style={{ height: ITEM_HEIGHT * 5 }}
            showsVerticalScrollIndicator={false}
            onMomentumScrollEnd={onMomentumScrollEnd}
            contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
        />
    );
};

// Wrap with React.memo so re-renders of MultiWheelPicker (which juggles inputs,
// errors, mode toggle, etc.) don't re-render every wheel column unnecessarily.
export const WheelPicker = React.memo(WheelPickerImpl);

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    pickerColumn: {
        marginHorizontal: 3,
        width: '50%',
    },
    title: {
        fontWeight: 'bold',
        marginVertical: 15,
        fontSize: 16,
        textAlign: 'center',
    },
    item: {
        height: ITEM_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedItemReps: {
        backgroundColor: '#CAE1F9',
    },
    selectedItemSeconds: {
        backgroundColor: '#E8EDD1',
    },
    text: {
        color: '#8E8E8E',
        fontSize: 18,
    },
    selectedText: {
        fontWeight: '700',
    },
});
