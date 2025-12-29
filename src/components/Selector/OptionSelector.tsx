// outsource dependencies
import React, { useRef } from 'react';
import Icon from '@react-native-vector-icons/material-icons';
import { ListRenderItemInfo, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetModal } from '@gorhom/bottom-sheet';

// local dependencies
import Text from 'components/Text.tsx';
import { useTheme } from 'hooks/useTheme.ts';
import { OFFSET } from 'constants/offset.ts';
import Selector from 'components/Selector/components/Selector.tsx';
import Separator from 'components/Selector/components/Separator.tsx';

type DataType = { label: string; value: string }
interface OptionSelectorProps {
    label: string,
    value?: string,
    data: DataType[];
    style?: ViewStyle;
    touched?: boolean;
    errorText?: string;
    onSelect: (item: DataType) => void;
}

const OptionSelector = ({ label, touched, errorText, data, onSelect, style, value = '' }: OptionSelectorProps) => {
    const theme = useTheme();
    const modalSheetRef = useRef<BottomSheetModal>(null);
    const openModalSheet = () => modalSheetRef.current?.present();
    const handlePress = (item: DataType) => {
        modalSheetRef.current?.close();
        onSelect(item);
    };
    return (
        <View style={style}>
            <Selector label={label} value={value} touched={touched} errorText={errorText} openModalSheet={openModalSheet} />
            <BottomSheetModal
                ref={modalSheetRef}
                enablePanDownToClose
                enableDynamicSizing
                backdropComponent={backdropProps => (
                    // show overlay
                    (<BottomSheetBackdrop
                        {...backdropProps}
                        opacity={0.5}
                        appearsOnIndex={0}
                        disappearsOnIndex={-1}
                    />)
                )}>
                <BottomSheetFlatList
                    data={data}
                    ItemSeparatorComponent={Separator}
                    contentContainerStyle={styles.contentContainer}
                    keyExtractor={({ value }: DataType) => value.toString()}
                    renderItem={({ item }: ListRenderItemInfo<DataType>) => {
                        return <Pressable onPress={() => handlePress(item)} style={styles.itemContainer}>
                            {item.value === value
                                ? <Icon name="radio-button-checked" size={24} color={theme.colors.primary}/>
                                : <Icon name="radio-button-off" size={24} color={theme.colors.grey}/>
                            }
                            <Text style={styles.itemText}>{item.label}</Text>
                        </Pressable>;
                    }}
                />
            </BottomSheetModal>
        </View>
    );
};


export default OptionSelector;

const styles = StyleSheet.create({
    selectBtn: {
        height: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 0.5,
    },
    contentContainer: {
        paddingVertical: OFFSET.VERTICAL,
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: OFFSET.HORIZONTAL,
        paddingVertical: OFFSET.VERTICAL
    },
    itemText: {
        marginLeft: OFFSET.POINT * 2
    },
});
