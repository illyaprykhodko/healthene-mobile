// outsource dependencies
import React, { useMemo, useCallback } from 'react';
import Icon from '@react-native-vector-icons/fontawesome5';
import { View, Switch, Linking, FlatList, StyleSheet, TouchableOpacity } from 'react-native';

// local dependencies
import Text from 'components/Text';
import Screen from 'components/Screen';
import { OFFSET } from 'constants/offset';
import { useTheme } from 'hooks/useTheme';
import {
    NotificationSetting,
    useGetNotificationSettingsQuery,
    useUpdateNotificationSettingsMutation,
} from 'store/api/settingsApi';

const ALLOWED_NOTIFICATION_TYPES = new Set([
    'UNREAD_MESSAGE',
    'SHOPPING_LIST_GENERATED',
    'WEIGHT_TRACKING_REMINDER',
]);

const humanizeNotificationType = (value: string): string =>
    value
        .toLowerCase()
        .split('_')
        .map(chunk => `${chunk.charAt(0).toUpperCase()}${chunk.slice(1)}`)
        .join(' ');

export const NotificationsScreen: React.FC = () => {
    const theme = useTheme();
    const { data, isLoading, isFetching } = useGetNotificationSettingsQuery();
    const [updateSettings, { isLoading: isSubmitting }] = useUpdateNotificationSettingsMutation();

    const list = useMemo(
        () => (data || []).filter(item => ALLOWED_NOTIFICATION_TYPES.has(item.notificationType)),
        [data]
    );

    const enableAll = useMemo(
        () => list.length > 0 && list.every(item => item.enabled),
        [list]
    );

    const disabled = isLoading || isFetching || isSubmitting;

    const updateList = useCallback(async (nextList: NotificationSetting[]) => {
        try {
            await updateSettings(nextList).unwrap();
        } catch (error) {
            console.error('[NotificationsSettings] Failed to update notification settings', error);
        }
    }, [updateSettings]);

    const handleToggleAll = useCallback(() => {
        const nextList = list.map(item => ({ ...item, enabled: !enableAll }));
        updateList(nextList);
    }, [enableAll, list, updateList]);

    const handleToggleItem = useCallback((id: number) => {
        const nextList = list.map(item => (
            item.id === id
                ? { ...item, enabled: !item.enabled }
                : item
        ));
        updateList(nextList);
    }, [list, updateList]);

    const openSystemNotificationSettings = useCallback(async () => {
        await Linking.openSettings();
    }, []);

    return (
        <Screen initialized={!isLoading}>
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <View style={[styles.headerRow, { borderBottomColor: theme.colors.border }]}>
                    <TouchableOpacity
                        disabled={disabled}
                        style={styles.settingsButton}
                        onPress={openSystemNotificationSettings}
                    >
                        <Icon
                            size={20}
                            name="cog"
                            iconStyle="solid"
                            color={disabled ? theme.colors.grey : theme.colors.primary}
                        />
                    </TouchableOpacity>
                    <Text variant="h5" color={theme.colors.text}>Allow All Notifications</Text>
                    <Switch
                        value={enableAll}
                        disabled={disabled}
                        onValueChange={handleToggleAll}
                        thumbColor={theme.colors.white}
                        ios_backgroundColor={theme.colors.white}
                        accessibilityLabel="Allow All Notifications"
                        trackColor={{ false: '#B2B2B2', true: '#4CDA64' }}
                    />
                </View>

                <FlatList
                    data={list}
                    keyExtractor={item => String(item.id)}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => (
                        <View style={styles.row}>
                            <Text
                                variant="body"
                                style={styles.rowTitle}
                                color={theme.colors.text}
                            >
                                {humanizeNotificationType(item.notificationType)}
                            </Text>
                            <Switch
                                disabled={disabled}
                                value={item.enabled}
                                thumbColor={theme.colors.white}
                                ios_backgroundColor={theme.colors.white}
                                onValueChange={() => handleToggleItem(item.id)}
                                trackColor={{ false: '#B2B2B2', true: '#4CDA64' }}
                                accessibilityLabel={humanizeNotificationType(item.notificationType)}
                            />
                        </View>
                    )}
                    ListEmptyComponent={(
                        !isLoading
                            ? (
                                <Text
                                    variant="body"
                                    textAlign="center"
                                    style={styles.emptyText}
                                    color={theme.colors.grey}
                                >
                                    Notification settings are unavailable
                                </Text>
                            )
                            : null
                    )}
                />
            </View>
        </Screen>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        paddingHorizontal: OFFSET.HORIZONTAL,
        paddingVertical: OFFSET.VERTICAL,
    },
    settingsButton: {
        width: 28,
        height: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: OFFSET.HORIZONTAL / 2,
    },
    listContent: {
        paddingHorizontal: OFFSET.HORIZONTAL,
        paddingVertical: OFFSET.VERTICAL / 2,
    },
    row: {
        marginVertical: OFFSET.VERTICAL / 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    rowTitle: {
        textTransform: 'capitalize',
        flex: 1,
        marginRight: OFFSET.HORIZONTAL,
    },
    emptyText: {
        marginTop: OFFSET.VERTICAL * 2,
    },
});

export default NotificationsScreen;
