// outsource dependencies
import React, { useRef } from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ListRenderItemInfo, Pressable, StyleSheet, View } from 'react-native';
import { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetModal } from '@gorhom/bottom-sheet';

// local dependencies
import Text from 'components/Text.tsx';
import { humanize } from 'services/filter';
import { useTheme } from 'hooks/useTheme.ts';
import { OFFSET } from 'constants/offset.ts';

type DataType = { label: string; value: string }
interface OptionSelectorProps {
    label: string,
    value?: string,
    data: DataType[];
    touched?: boolean;
    errorText?: string;
    onSelect: (item: DataType) => void;
}

const OptionSelector = ({ label, touched, errorText, data, onSelect, value = '' }: OptionSelectorProps) => {
    const theme = useTheme();
    const modalSheetRef = useRef<BottomSheetModal>(null);
    const handlePress = (item: DataType) => {
        modalSheetRef.current?.close();
        onSelect(item);
    };
    const ItemSeparator = () => (<View style={[styles.separator, { borderTopColor: theme.colors.border }]} />);
    return <>
        <View>
            <Text color={touched && errorText ? theme.colors.error : theme.colors.black} variant="caption">
                {label}
            </Text>
            <Pressable
                onPress={() => modalSheetRef.current?.present()}
                style={[styles.selectBtn, { borderBottomColor: touched && errorText ? theme.colors.error : theme.colors.grey }]}
            >
                <Text color={value ? theme.colors.black : theme.colors.grey}>
                    {value ? humanize(value) : 'Select item'}
                </Text>
                <Ionicons color={theme.colors.grey} name="chevron-down-sharp" size={16} />
            </Pressable>
        </View>
        <BottomSheetModal
            ref={modalSheetRef}
            enablePanDownToClose
            enableDynamicSizing
            backdropComponent={backdropProps => (
                // show overlay
                <BottomSheetBackdrop
                    {...backdropProps}
                    opacity={0.5}
                    appearsOnIndex={0}
                    disappearsOnIndex={-1}
                />
            )}>
            <BottomSheetFlatList
                data={data}
                ItemSeparatorComponent={ItemSeparator}
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
    </>;
};


export default OptionSelector;

const styles = StyleSheet.create({
    container: {
    // style here
    },
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
    separator: {
        borderTopWidth: 1
    }
});
