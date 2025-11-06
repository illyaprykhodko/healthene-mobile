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

export const WheelPicker: React.FC<WheelPickerProps> = ({
    data,
    onSelect,
    selectedIndex,
    selectedItemStyle,
}) => {
    const flatListRef = useRef<FlatList<number>>(null);

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
                <Text style={[styles.text, index === selectedIndex && styles.selectedText]}>{item}</Text>
            </View>
        ),
        [selectedIndex, selectedItemStyle]
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

    return (
        <FlatList
            data={data}
            bounces={false}
            ref={flatListRef}
            decelerationRate="fast"
            renderItem={renderItem}
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
