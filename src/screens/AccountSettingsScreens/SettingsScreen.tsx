// outsource dependencies
import React from 'react';
import { StyleSheet, View, FlatList } from 'react-native';

// local dependencies
import { Humanize } from 'services/filter';
import { OFFSET } from 'constants/offset.ts';
import { useTheme } from 'hooks/useTheme.ts';
import Text from 'components/Text.tsx';
import FeatherIcon from 'react-native-vector-icons/Feather';

interface MenuScreenProps {
  // props here
}

const ITEM = {
    ADDRESS: 'Address',
    SETTINGS: 'Settings',
    NOTIFICATIONS: 'Notifications',
    FOOD_ALLERGIES: 'Food Allergies',
    FOOD_PREFERENCES: 'Food Preferences',
    PERSONAL_INFORMATION: 'Personal Information',
};
const SettingsScreen = (props: MenuScreenProps) => {
    const theme = useTheme();
    const settingItem = [
        { title: ITEM.PERSONAL_INFORMATION },
        { title: ITEM.ADDRESS },
        { title: ITEM.SETTINGS },
        { title: ITEM.FOOD_PREFERENCES },
        { title: ITEM.FOOD_ALLERGIES },
        { title: ITEM.NOTIFICATIONS },
    ];
    return <View style={styles.container}>
        <FlatList
            data={settingItem}
            renderItem={({ item }) => <View style={[styles.itemContainer, { borderBottomColor: theme.colors.border }]}>
                <Text>{item.title}</Text>
                <FeatherIcon
                    size={24}
                    name="chevron-right"
                    color={theme.colors.grey}
                />
            </View>}
        />
    </View>;
};

const styles = StyleSheet.create({
    container: {
    // style here
    },
    itemContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: OFFSET.HORIZONTAL,
        paddingVertical: OFFSET.VERTICAL,
        borderBottomWidth: 1
    }

});

export default SettingsScreen;
