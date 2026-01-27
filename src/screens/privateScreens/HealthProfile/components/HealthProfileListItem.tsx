// outsource dependencies
import React, { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

// local dependencies
import Text from 'components/Text.tsx';
import { OFFSET } from 'constants/offset.ts';
import { Checkbox } from 'components/Checkbox.tsx';
import { MedicalEntityItem } from 'types/healthProfile.ts';

interface HealthProfileListItemProps {
    isChecked: boolean;
    item: MedicalEntityItem;
    onToggle: (id: number) => void;
}

const HealthProfileListItem = ({ item, isChecked, onToggle }: HealthProfileListItemProps) => {
    const styles = useMemo(() => createStyles(), []);

    const handleCheckboxChange = (value: boolean) => {
        onToggle(item.id);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.itemText}>{item.name}</Text>
            <Checkbox
                size={12}
                value={isChecked}
                onChange={handleCheckboxChange}
            />
        </View>
    );
};

export default memo(HealthProfileListItem);

const createStyles = () => StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: OFFSET.VERTICAL,
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    itemText: {
        flex: 1,
        paddingRight: OFFSET.POINT * 2,
    },
});
