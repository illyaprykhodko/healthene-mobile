// outsource dependencies
import Toast from 'react-native-toast-message';
import Icon from '@react-native-vector-icons/ionicons';
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Switch,
    Linking,
    Platform,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';

// local dependencies
import Text from 'components/Text';
import Screen from 'components/Screen';
import { useTheme } from 'hooks/useTheme';
import { OFFSET } from 'constants/offset';
import healthSyncService from 'services/health/health-sync.service';
import { openHealthConnectSettings } from 'react-native-health-connect';
import { getAvailability, type HealthConnectAvailability } from 'services/health/health-connect.service';

const IS_IOS = Platform.OS === 'ios';
const HEALTH_APP_NAME = IS_IOS ? 'Apple Health' : 'Health Connect';
// NOTE opens the health app itself, where the patient can change which types are shared. On
// iOS that is the only way back: the permission sheet is shown once per requested set of types
// and never again, so from inside our app there is nothing left to open.
const APPLE_HEALTH_URL = 'x-apple-health://';
// NOTE Health Connect is a separate app on Android 13 and below, so it can be missing or too
// old to talk to. Both cases are normal, not failures — this is where the patient is sent.
const HEALTH_CONNECT_PLAY_URL = 'market://details?id=com.google.android.apps.healthdata';

export const HealthSyncSettingsScreen: React.FC = () => {
    const theme = useTheme();
    const [isLoading, setIsLoading] = useState(true);
    const [isAvailable, setIsAvailable] = useState(false);
    const [isEnabled, setIsEnabled] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    // NOTE Android distinguishes "Health Connect is missing" from "it is installed but too old",
    // and the patient can act on both — so the screen keeps the finer state instead of collapsing
    // it into `isAvailable`. On iOS there is nothing comparable to report.
    const [availability, setAvailability] = useState<HealthConnectAvailability>('unavailable');

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const [available, enabled] = await Promise.all([
                    healthSyncService.isAvailable(),
                    healthSyncService.isEnabled(),
                ]);
                setIsAvailable(available);
                setIsEnabled(enabled);
                if (!IS_IOS && !available) {
                    setAvailability(await getAvailability());
                }
            } catch (error) {
                console.error('[HealthSyncSettings] Error checking status:', error);
            } finally {
                setIsLoading(false);
            }
        };

        checkStatus();
    }, []);

    const handleToggle = useCallback(async (nextValue: boolean) => {
        setIsProcessing(true);
        try {
            if (!nextValue) {
                await healthSyncService.disable();
                setIsEnabled(false);
                return;
            }

            // NOTE this is the only place the system permission dialog is shown, so the
            // patient always sees it as a result of their own action. On iOS it resolves
            // successfully even when read access is denied — HealthKit hides read
            // authorisation deliberately — which is why the info block below explains what
            // to do when no data turns up rather than us claiming success or failure.
            const granted = await healthSyncService.requestPermissions();
            if (!granted) {
                Toast.show({
                    type: 'error',
                    text1: 'Access not granted',
                    text2: `${HEALTH_APP_NAME} did not grant access to your health data.`,
                });
                setIsEnabled(false);
                return;
            }

            await healthSyncService.enable();
            setIsEnabled(true);
            // NOTE deliberately does not promise that data will arrive. On iOS we cannot know:
            // `initHealthKit` succeeds even when the patient left the individual types
            // switched off in the sheet, and HealthKit then returns empty results instead of
            // an error. The hint below tells them where to check.
            Toast.show({
                type: 'success',
                text1: 'Health sync is on',
                text2: `New measurements from ${HEALTH_APP_NAME} will be imported when you sign in.`,
            });
            // Import straight away so the patient sees the result of switching it on.
            void healthSyncService.runImport({ force: true });
        } catch (error) {
            console.error('[HealthSyncSettings] Error toggling health sync:', error);
            Toast.show({
                type: 'error',
                text1: 'Something went wrong',
                text2: 'Could not change the health sync setting. Please try again.',
            });
        } finally {
            setIsProcessing(false);
        }
    }, []);

    const handleOpenHealthApp = useCallback(async () => {
        if (!IS_IOS) {
            // Health Connect exposes its own settings screen; that is where per-type access lives.
            openHealthConnectSettings();
            return;
        }

        try {
            await Linking.openURL(APPLE_HEALTH_URL);
        } catch {
            // Fall back to our own settings page — better than doing nothing.
            await Linking.openSettings();
        }
    }, []);

    const handleInstallHealthConnect = useCallback(async () => {
        try {
            await Linking.openURL(HEALTH_CONNECT_PLAY_URL);
        } catch {
            // The Play Store app may be absent (or the URL scheme unhandled) — fall back to web.
            await Linking.openURL(
                'https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata'
            );
        }
    }, []);

    if (isLoading) {
        return (
            <Screen initialized style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            </Screen>
        );
    }

    if (!isAvailable) {
        // NOTE on Android this is usually fixable by the patient — Health Connect is a separate
        // app on Android 13 and below, so it can simply be missing or out of date. Offering the
        // Play Store beats telling them their device cannot do it.
        const isFixable = !IS_IOS && (availability === 'update-required' || availability === 'unavailable');

        return (
            <Screen initialized style={styles.container}>
                <View style={styles.notAvailableContainer}>
                    <Icon name="heart-dislike" size={64} color={theme.colors.grey} />
                    <Text
                        variant="h5"
                        color={theme.colors.text}
                        style={styles.notAvailableTitle}
                    >
                        {availability === 'update-required'
                            ? `${HEALTH_APP_NAME} Needs an Update`
                            : `${HEALTH_APP_NAME} Not Available`}
                    </Text>
                    <Text
                        variant="body"
                        textAlign="center"
                        style={styles.notAvailableText}
                        color={theme.colors.textSecondary}
                    >
                        {isFixable
                            ? `Healthene needs ${HEALTH_APP_NAME} to read your measurements. Install or update it, then come back to this screen.`
                            : `This device does not provide ${HEALTH_APP_NAME}, so measurements cannot be imported automatically.`}
                    </Text>
                    {isFixable && (
                        <TouchableOpacity
                            onPress={handleInstallHealthConnect}
                            style={[styles.manageButton, styles.notAvailableAction, { borderColor: theme.colors.primary }]}
                        >
                            <Icon size={20} name="download-outline" color={theme.colors.primary} />
                            <Text
                                variant="body"
                                style={styles.manageButtonText}
                                color={theme.colors.primary}
                            >
                                {availability === 'update-required'
                                    ? `Update ${HEALTH_APP_NAME}`
                                    : `Get ${HEALTH_APP_NAME}`}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </Screen>
        );
    }

    return (
        <Screen initialized style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Icon size={48} name="heart-circle" color={theme.colors.primary} />
                    <Text
                        variant="h4"
                        style={styles.title}
                        color={theme.colors.text}
                    >
                        {HEALTH_APP_NAME}
                    </Text>
                    <Text
                        variant="body"
                        textAlign="center"
                        style={styles.subtitle}
                        color={theme.colors.textSecondary}
                    >
                        Add the weight, blood glucose and blood pressure you record in{' '}
                        {HEALTH_APP_NAME} to your Healthene record automatically.
                    </Text>
                </View>

                <View
                    style={[
                        styles.toggleContainer,
                        { backgroundColor: theme.colors.surface },
                    ]}
                >
                    <View style={styles.toggleContent}>
                        <View style={styles.toggleInfo}>
                            <Text variant="body" color={theme.colors.text}>
                                Sync data from {HEALTH_APP_NAME}
                            </Text>
                            <Text variant="caption" color={theme.colors.textSecondary}>
                                {isEnabled
                                    ? 'New measurements are added on sign in'
                                    : 'Measurements are not imported'}
                            </Text>
                        </View>
                        <Switch
                            value={isEnabled}
                            disabled={isProcessing}
                            onValueChange={handleToggle}
                            thumbColor={theme.colors.white}
                            accessibilityLabel={`Sync data from ${HEALTH_APP_NAME}`}
                            trackColor={{
                                false: theme.colors.grey,
                                true: theme.colors.primary,
                            }}
                        />
                    </View>
                </View>

                <TouchableOpacity
                    onPress={handleOpenHealthApp}
                    style={[styles.manageButton, { borderColor: theme.colors.primary }]}
                >
                    <Icon size={20} name="open-outline" color={theme.colors.primary} />
                    <Text
                        variant="body"
                        color={theme.colors.primary}
                        style={styles.manageButtonText}
                    >
                            Manage access in {HEALTH_APP_NAME}
                    </Text>
                </TouchableOpacity>

                <View style={styles.infoSection}>
                    <Text
                        variant="caption"
                        style={styles.infoTitle}
                        color={theme.colors.text}
                    >
                        What to expect
                    </Text>
                    <View style={styles.infoItem}>
                        <Icon size={16} name="repeat" color={theme.colors.textSecondary} />
                        <Text
                            variant="caption"
                            style={styles.infoText}
                            color={theme.colors.textSecondary}
                        >
                            Only measurements recorded after the last import are added, so nothing
                            is duplicated in your record.
                        </Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Icon size={16} name="lock-closed" color={theme.colors.textSecondary} />
                        <Text
                            variant="caption"
                            style={styles.infoText}
                            color={theme.colors.textSecondary}
                        >
                            Healthene only reads these measurements. Nothing is written back to{' '}
                            {HEALTH_APP_NAME}.
                        </Text>
                    </View>
                    {Platform.OS === 'ios' && (
                        <View style={styles.infoItem}>
                            <Icon
                                size={16}
                                name="settings-outline"
                                color={theme.colors.textSecondary}
                            />
                            <Text
                                variant="caption"
                                style={styles.infoText}
                                color={theme.colors.textSecondary}
                            >
                                If no measurements appear, check Settings → Health → Data Access &
                                Devices → Healthene. Access can only be granted or revoked there,
                                not from this screen.
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </Screen>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: OFFSET.HORIZONTAL,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    notAvailableContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: OFFSET.HORIZONTAL * 2,
    },
    notAvailableTitle: {
        marginTop: OFFSET.VERTICAL * 2,
        marginBottom: OFFSET.VERTICAL,
    },
    notAvailableText: {
        maxWidth: 300,
    },
    header: {
        alignItems: 'center',
        marginBottom: OFFSET.VERTICAL * 2,
    },
    title: {
        marginTop: OFFSET.VERTICAL,
        marginBottom: OFFSET.VERTICAL / 2,
    },
    subtitle: {
        maxWidth: 320,
    },
    toggleContainer: {
        padding: OFFSET.HORIZONTAL,
        borderRadius: 12,
        marginBottom: OFFSET.VERTICAL * 2,
    },
    toggleContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    toggleInfo: {
        flex: 1,
        marginRight: OFFSET.HORIZONTAL,
    },
    notAvailableAction: {
        marginTop: OFFSET.VERTICAL * 2,
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    manageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: OFFSET.VERTICAL,
        borderRadius: 12,
        borderWidth: 1,
        gap: OFFSET.HORIZONTAL / 2,
        marginBottom: OFFSET.VERTICAL,
    },
    manageButtonText: {
        fontWeight: '600',
    },
    infoSection: {
        marginTop: OFFSET.VERTICAL,
    },
    infoTitle: {
        fontWeight: '600',
        marginBottom: OFFSET.VERTICAL,
        textTransform: 'uppercase',
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: OFFSET.VERTICAL / 2,
    },
    infoText: {
        flex: 1,
        marginLeft: OFFSET.HORIZONTAL / 2,
    },
});

export default HealthSyncSettingsScreen;
