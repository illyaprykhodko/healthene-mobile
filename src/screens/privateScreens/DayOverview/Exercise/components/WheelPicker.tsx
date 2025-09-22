import React, { useEffect, useRef } from 'react';
import { View, FlatList, Text, StyleSheet, InteractionManager } from 'react-native';

export const ITEM_HEIGHT = 50;

interface WheelPickerProps {
    data: number[];
    selectedIndex: number;
    onSelect: (idx: number) => void;
    selectedItemStyle: any;
}

export const WheelPicker: React.FC<WheelPickerProps> = ({ data, selectedIndex, onSelect, selectedItemStyle }) => {
    const flatListRef = useRef<FlatList>(null as any);

    useEffect(() => {
        if (flatListRef.current && selectedIndex != null) {
            InteractionManager.runAfterInteractions(() => {
                (flatListRef.current as any)?.scrollToIndex({ index: selectedIndex, animated: true, useNativeDriver: true });
            });
        }
    }, [selectedIndex]);

    return (
        <FlatList
            data={data}
            bounces={false}
            ref={flatListRef}
            decelerationRate="fast"
            snapToInterval={ITEM_HEIGHT}
            style={{ height: ITEM_HEIGHT * 5 }}
            showsVerticalScrollIndicator={false}
            keyExtractor={item => item.toString()}
            contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
            renderItem={({ item, index }) => (
                <View style={[styles.item, index === selectedIndex && selectedItemStyle]}>
                    <Text style={[styles.text, index === selectedIndex && styles.selectedText]}>{item}</Text>
                </View>
            )}
            getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
            onMomentumScrollEnd={e => {
                const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
                onSelect(index);
            }}
        />
    );
};

const styles = StyleSheet.create({
    item: {
        height: ITEM_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        color: '#8E8E8E',
        fontSize: 18,
    },
    selectedText: {},
});
