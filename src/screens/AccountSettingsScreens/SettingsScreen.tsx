// outsource dependencies
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import FeatherIcon from '@react-native-vector-icons/feather';
import { StyleSheet, View, FlatList, Pressable } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// local dependencies
import Text from 'components/Text.tsx';
import { OFFSET } from 'constants/offset.ts';
import { useTheme } from 'hooks/useTheme.ts';
import { ROUTES } from 'constants/routes.ts';
import { RootStackParamList } from 'services/navigation';

const ITEM = {
    ADDRESS: 'Address',
    APPEARANCE: 'Appearance',
    HEALTH_SYNC: 'Health App Sync',
    NOTIFICATIONS: 'Notifications',
    FOOD_ALLERGIES: 'Food Allergies',
    FOOD_PREFERENCES: 'Food Preferences',
    ACCOUNT_SETTINGS: 'Account Settings',
    ANIMATION_SETTINGS: 'Animation Settings',
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
        { title: ITEM.ACCOUNT_SETTINGS, navigate: () => navigation.navigate(ROUTES.ACCOUNT_SETTINGS) },
        { title: ITEM.FOOD_PREFERENCES, navigate: () => navigation.navigate(ROUTES.FOOD_PREFERENCES) },
        { title: ITEM.FOOD_ALLERGIES, navigate: () => navigation.navigate(ROUTES.FOOD_ALLERGIES) },
        { title: ITEM.NOTIFICATIONS, navigate: () => navigation.navigate(ROUTES.NOTIFICATIONS) },
        { title: ITEM.HEALTH_SYNC, navigate: () => navigation.navigate(ROUTES.HEALTH_SYNC_SETTINGS) },
        { title: ITEM.APPEARANCE, navigate: () => navigation.navigate(ROUTES.APPEARANCE_SETTINGS) },
        { title: ITEM.ANIMATION_SETTINGS, navigate: () => navigation.navigate(ROUTES.ANIMATION_SETTINGS) },
    ];
    return <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
        flex: 1
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
