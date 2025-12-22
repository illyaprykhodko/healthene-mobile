// outsource dependencies
import React, { useRef } from 'react';
import Icon from '@react-native-vector-icons/material-icons';
import { ListRenderItemInfo, Pressable, StyleSheet } from 'react-native';
import { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetModal } from '@gorhom/bottom-sheet';

// local dependencies
import Text from 'components/Text.tsx';
import { useTheme } from 'hooks/useTheme.ts';
import { OFFSET } from 'constants/offset.ts';
import Selector from 'components/Selector/components/Selector.tsx';
import Separator from 'components/Selector/components/Separator.tsx';
import ListHeader from 'components/Selector/components/ListHeader.tsx';

interface SearchSelectorProps <T extends Record<string, any>> {
    data: T[];
    label: string,
    value?: string,
    touched?: boolean;
    disabled?: boolean;
    errorText?: string;
    valueField: keyof T;
    placeholder: string;
    searchValue?: string;
    onSelect: (item: T) => void;
    onSearch: (item: string) => void;
}

const SearchSelector = <T extends Record<string, any>>({
    data,
    label,
    touched,
    disabled,
    onSearch,
    onSelect,
    errorText,
    valueField,
    value = '',
    searchValue,
    placeholder
}: SearchSelectorProps<T>) => {
    const theme = useTheme();
    const modalSheetRef = useRef<BottomSheetModal>(null);
    const openModalSheet = () => modalSheetRef.current?.present();
    const handlePress = (item: T) => {
        modalSheetRef.current?.close();
        onSelect(item);
    };

    return <>
        <Selector label={label} value={value} touched={touched} errorText={errorText} openModalSheet={openModalSheet} />
        <BottomSheetModal
            ref={modalSheetRef}
            snapPoints={['90%']}
            enablePanDownToClose
            enableDynamicSizing={false}
            backdropComponent={backdropProps => (
                <BottomSheetBackdrop
                    {...backdropProps}
                    opacity={0.5}
                    appearsOnIndex={0}
                    disappearsOnIndex={-1}
                />
            )}>
            <BottomSheetFlatList
                data={data}
                ItemSeparatorComponent={Separator}
                contentContainerStyle={styles.contentContainer}
                keyExtractor={(item: T) => String(item[valueField])}
                ListHeaderComponent={<ListHeader
                    value={value}
                    onSearch={onSearch}
                    disabled={disabled}
                    searchValue={searchValue}
                    placeholder={placeholder}
                />}
                renderItem={({ item }: ListRenderItemInfo<T>) => {
                    return <Pressable onPress={() => handlePress(item)} style={styles.itemContainer}>
                        {item.value === value
                            ? <Icon name="radio-button-checked" size={24} color={theme.colors.primary}/>
                            : <Icon name="radio-button-off" size={24} color={theme.colors.grey}/>
                        }
                        <Text style={styles.itemText}>{item[valueField]}</Text>
                    </Pressable>;
                }}
            />
        </BottomSheetModal>
    </>;
};

export default SearchSelector;

const styles = StyleSheet.create({
    contentContainer: {
        paddingVertical: OFFSET.VERTICAL,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        paddingVertical: OFFSET.POINT * 2,
        paddingHorizontal: OFFSET.HORIZONTAL,
        borderBottomWidth: 1
    },
    inputStyle: {
        width: '100%',
        flexShrink: 1,
        marginRight: OFFSET.POINT * 2,
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
