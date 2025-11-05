// outsource dependencies
import React, { useState } from 'react';
import { Picker } from '@react-native-picker/picker';

// local dependencies
import { useTheme } from 'hooks/useTheme';

type Item = {
  value: string, label: string
}
interface SelectProps {
  data: Item[];
  currentValue?: string | null;
  onSelect: (value: string) => void;
}

const Select = ({ onSelect, data, currentValue = null }: SelectProps) => {
    const theme = useTheme();
    const [selected, setSelected] = useState<string>(currentValue ?? data[1].value);
    return <Picker
        selectedValue={selected}
        itemStyle={{ color: theme.colors.black }}
        style={{ backgroundColor: theme.colors.green, color: theme.colors.black }}
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

export default Select;
