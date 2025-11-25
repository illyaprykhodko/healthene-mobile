// outsource dependencies
import React from 'react';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { StyleSheet, View, FlatList, Pressable } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// local dependencies
import Text from 'components/Text.tsx';
import { OFFSET } from 'constants/offset.ts';
import { useTheme } from 'hooks/useTheme.ts';
import { ROUTES } from 'constants/routes.ts';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from 'services/navigation';

const ITEM = {
    ADDRESS: 'Address',
    SETTINGS: 'Settings',
    NOTIFICATIONS: 'Notifications',
    FOOD_ALLERGIES: 'Food Allergies',
    FOOD_PREFERENCES: 'Food Preferences',
    PERSONAL_INFORMATION: 'Personal Information',
    BIOMETRIC_AUTHENTICATION: 'Biometric Authentication',
};

const SettingsScreen = () => {
    const theme = useTheme();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const settingItem = [
        { title: ITEM.PERSONAL_INFORMATION, navigate: () => navigation.navigate(ROUTES.PERSONAL_INFORMATION) },
        { title: ITEM.BIOMETRIC_AUTHENTICATION, navigate: () => navigation.navigate(ROUTES.BIOMETRIC_SETTINGS) },
        { title: ITEM.ADDRESS, navigate: () => navigation.navigate(ROUTES.ADDRESS) },
        { title: ITEM.SETTINGS },
        { title: ITEM.FOOD_PREFERENCES },
        { title: ITEM.FOOD_ALLERGIES },
        { title: ITEM.NOTIFICATIONS },
    ];
    return <View style={styles.container}>
        <FlatList
            data={settingItem}
            renderItem={({ item }) => <Pressable onPress={item.navigate} style={[styles.itemContainer, { borderBottomColor: theme.colors.border }]}>
                <Text>{item.title}</Text>
                <FeatherIcon
                    size={24}
                    name="chevron-right"
                    color={theme.colors.grey}
                />
            </Pressable>}
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
