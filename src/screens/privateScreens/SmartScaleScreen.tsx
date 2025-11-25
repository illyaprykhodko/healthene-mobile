// outsource dependencies
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    Text,
    View,
    Linking,
    Platform,
    Animated,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { State } from 'react-native-ble-plx';
import { useNavigation, useRoute } from '@react-navigation/native';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
// local dependencies
import { useTheme } from 'hooks/useTheme';
import type { SmartScaleReading } from 'types/health';
import { useMeasurementSubmit } from 'hooks/useMeasurementSubmit';
import SmartScaleService from 'services/health/smart-scale.service';

const SmartScaleScreen: React.FC = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const theme = useTheme();

    const [bluetoothStatus, setBluetoothStatus] = useState<State>(State.Unknown);
    const [locationStatus, setLocationStatus] = useState<string | null>(null);
    const [weightData, setWeightData] = useState<SmartScaleReading | null>(null);
    const [deviceFound, setDeviceFound] = useState(false);
    const [isScanning, setIsScanning] = useState(false);

    const animation = useRef(new Animated.Value(0)).current;

    const measurementPhaseItem = (route.params as any)?.measurementPhaseItem;
    const item = measurementPhaseItem || {};
    const { submit, isSubmitting } = useMeasurementSubmit(item, {
        onSuccess: () => {
            SmartScaleService.reset();
            navigation.goBack();
        },
        onError: error => {
            // console.error('[SmartScaleScreen] Submit error:', error);
        },
    });

    useEffect(() => {
        Animated.timing(animation, {
            duration: 500,
            useNativeDriver: true,
            toValue: deviceFound ? 1 : 0,
        }).start();
    }, [deviceFound, animation]);

    const opacity = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0],
    });

    useEffect(() => {
        const subscription = SmartScaleService.onStateChange(state => {
            setBluetoothStatus(state);
        });

        return () => {
            subscription.remove();
        };
    }, []);

    useEffect(() => {
        const fetchPermissions = async () => {
            const permission
                = Platform.OS === 'ios'
                    ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
                    : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
            const status = await request(permission);
            setLocationStatus(status);
        };
        fetchPermissions();
    }, []);

    useEffect(() => {
        if (bluetoothStatus === State.PoweredOn && locationStatus === RESULTS.GRANTED) {
            setIsScanning(true);
            SmartScaleService.setOnWeightUpdate((reading: SmartScaleReading) => {
                setWeightData(reading);
            });
            SmartScaleService.setOnDeviceFound(device => {
                setDeviceFound(true);
            });
            SmartScaleService.startScan()
                .then(() => {
                    // console.log('[SmartScaleScreen] Scan completed');
                })
                .catch(error => {
                    console.error('[SmartScaleScreen] Scan error:', error);
                    setIsScanning(false);
                });

            return () => {
                SmartScaleService.stopScan();
                SmartScaleService.setOnWeightUpdate(() => {});
                SmartScaleService.setOnDeviceFound(() => {});
            };
        }
    }, [bluetoothStatus, locationStatus]);

    const openSettings = useCallback(async () => {
        await Linking.openSettings();
    }, []);

    const recheckBluetooth = useCallback(async () => {
        const status = await SmartScaleService.getStatus();
        setBluetoothStatus(status);
    }, []);

    const handleSave = useCallback(async () => {
        if (weightData && weightData.complete) {
            await submit(
                { value: weightData.weight.toString() },
                'HEALTHENE_MANUAL_INPUT',
                'lbs'
            );
        }
    }, [weightData, submit]);

    const renderBluetoothStatus = () => {
        switch (bluetoothStatus) {
            case State.PoweredOff:
                return (
                    <View style={styles.messageContainer}>
                        <Text style={[styles.messageText, { color: theme.colors.primary }]}>
                        It seems that Bluetooth is turned off. Please enable it in your device&apos;s settings to continue.
                        </Text>
                        <TouchableOpacity
                            onPress={openSettings}
                            style={[styles.settingsButton, { backgroundColor: theme.colors.warning }]}
                        >
                            <Text style={styles.settingsButtonText}>Open Settings</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={recheckBluetooth}
                            style={[styles.settingsButton, { backgroundColor: theme.colors.primary, marginTop: 10 }]}
                        >
                            <Text style={styles.settingsButtonText}>Recheck Status</Text>
                        </TouchableOpacity>
                    </View>
                );
            case State.Unsupported:
                return (
                    <View style={styles.messageContainer}>
                        <Text style={[styles.messageText, { color: theme.colors.error }]}>
                            Bluetooth is not supported on this device. This feature requires
                            Bluetooth capabilities.
                        </Text>
                    </View>
                );
            case State.Unauthorized:
                return (
                    <View style={styles.messageContainer}>
                        <Text style={[styles.messageText, { color: theme.colors.primary }]}>
                            Bluetooth access is unauthorized. Please allow Bluetooth permissions for
                            this app in your device's settings.
                        </Text>
                        <TouchableOpacity
                            style={[styles.settingsButton, { backgroundColor: theme.colors.warning }]}
                            onPress={openSettings}
                        >
                            <Text style={styles.settingsButtonText}>Open Settings</Text>
                        </TouchableOpacity>
                    </View>
                );
            case State.Unknown:
                return (
                    <View style={styles.messageContainer}>
                        <Text style={[styles.messageText, { color: theme.colors.primary }]}>
                            Checking Bluetooth status...
                        </Text>
                        <ActivityIndicator
                            size="large"
                            style={styles.loader}
                            color={theme.colors.primary}
                        />
                        <TouchableOpacity
                            style={[styles.settingsButton, { backgroundColor: theme.colors.primary, marginTop: 10 }]}
                            onPress={recheckBluetooth}
                        >
                            <Text style={styles.settingsButtonText}>Recheck Status</Text>
                        </TouchableOpacity>
                    </View>
                );
            default:
                return null;
        }
    };

    const isReadyToScan = bluetoothStatus === State.PoweredOn && locationStatus === RESULTS.GRANTED;

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {renderBluetoothStatus()}
            {locationStatus && locationStatus !== RESULTS.GRANTED && (
                <View style={styles.messageContainer}>
                    <Text style={[styles.messageText, { color: theme.colors.primary }]}>
                        Location services are required for Bluetooth to locate and connect with
                        devices accurately.
                    </Text>
                    <TouchableOpacity
                        style={[styles.settingsButton, { backgroundColor: theme.colors.warning }]}
                        onPress={openSettings}
                    >
                        <Text style={styles.settingsButtonText}>Open Settings</Text>
                    </TouchableOpacity>
                </View>
            )}

            {isReadyToScan && (
                <Animated.View style={{ opacity }}>
                    <Text style={[styles.instructionText, { color: theme.colors.primary }]}>
                        Please step on scale
                    </Text>
                </Animated.View>
            )}

            <View style={styles.scaleContainer}>
                <View style={[styles.valueContainer, { borderColor: theme.colors.text }]}>
                    <Text style={[styles.weightText, { color: theme.colors.text }]}>
                        {weightData ? `${weightData.weight.toFixed(1)} lbs` : '0.0 lbs'}
                    </Text>
                    {isScanning && !weightData && (
                        <ActivityIndicator
                            size="small"
                            style={styles.loader}
                            color={theme.colors.primary}
                        />
                    )}
                </View>
            </View>
            <TouchableOpacity
                style={[
                    styles.saveButton,
                    {
                        backgroundColor:
                            weightData && weightData.complete && !isSubmitting
                                ? theme.colors.success
                                : theme.colors.textSecondary,
                    },
                ]}
                onPress={handleSave}
                disabled={!weightData || !weightData.complete || isSubmitting}
            >
                {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                )}
            </TouchableOpacity>
        </View>
    );
};

export default SmartScaleScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 18,
    },
    messageContainer: {
        marginVertical: 18,
    },
    messageText: {
        fontSize: 18,
        textAlign: 'center',
        lineHeight: 24,
    },
    settingsButton: {
        marginTop: 18,
        paddingVertical: 14,
        borderRadius: 25,
        alignItems: 'center',
    },
    settingsButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
    instructionText: {
        alignSelf: 'center',
        fontSize: 20,
        fontWeight: '600',
        textShadowRadius: 5,
    },
    scaleContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    valueContainer: {
        minWidth: '80%',
        padding: 16,
        marginVertical: 20,
        borderWidth: 2,
        borderRadius: 16,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
    },
    weightText: {
        fontSize: 54,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    loader: {
        marginTop: 10,
    },
    saveButton: {
        paddingVertical: 18,
        borderRadius: 25,
        alignItems: 'center',
        marginBottom: 20,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '700',
    },
});
