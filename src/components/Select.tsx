// outsource dependencies
import React, { useState } from 'react';
import { Picker } from '@react-native-picker/picker';
import { Pressable, StyleSheet, Modal, TouchableOpacity } from 'react-native';

// local dependencies
import Text from 'components/Text.tsx';
import { useTheme } from 'hooks/useTheme';
import { OFFSET } from 'constants/offset.ts';
import log from 'eslint-plugin-react/lib/util/log';

type Item = {
  value: string, label: string
}
interface SelectProps {
  data: Item[];
  currentValue?: string | null;
  onSelect: (value: string) => void;
}

export const Select = ({ onSelect, data, currentValue = null }: SelectProps) => {
    const theme = useTheme();
    const [selected, setSelected] = useState<string>(currentValue ?? data[1].value);
    return <Picker
        style={{ backgroundColor: theme.colors.background }}
        selectedValue={selected}
        onValueChange={itemValue => {
            setSelected(itemValue);
            onSelect(itemValue);
        }}>
        {data.length
            ? data.map((item: Item) => <Picker.Item key={item.label} label={item.label} value={item.value} />)
            : null
        }
    </Picker>;

};

const styles = StyleSheet.create({
    container: {

    },
    currentItem: {
        borderBottomWidth: 1,
        paddingVertical: OFFSET.VERTICAL,
    },
    modalWrapper: {
        ...StyleSheet.absoluteFillObject,
        flex: 1,
        opacity: 0.5,
    },
});
