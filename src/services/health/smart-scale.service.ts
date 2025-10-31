/**
 * Smart Scale BLE Service
 * Modern functional wrapper for Bluetooth Low Energy smart scales
 */

import { Buffer } from 'buffer';
import { BleManager, State } from 'react-native-ble-plx';
import type { SmartScaleReading, BLEDevice } from '../../types/health';

/**
 * Callback types
 */
type WeightUpdateHandler = (reading: SmartScaleReading) => void;
type DeviceFoundHandler = (device: BLEDevice) => void;

/**
 * Service state (module-level, singleton pattern)
 */
let manager: BleManager | null = null;
let onWeightUpdate: WeightUpdateHandler | null = null;
let onDeviceFound: DeviceFoundHandler | null = null;
let currentWeight: SmartScaleReading | null = null;

/**
 * Supported device names (can be extended)
 */
const SUPPORTED_DEVICES = ['ADV', 'Smart Scale'];

/**
 * Convert weight from kg to lbs (legacy format compatibility)
 */
const convertWeightToLbs = (weightKg: number): number => {
    let temp = Math.floor(weightKg * 2.2046 / 2);
    if ((weightKg * 2.2046) % 1 >= 0.5) {
        temp = Math.floor((weightKg * 2.2046 + 1) / 2);
    }
    const weightLbs = temp * 2;
    return weightLbs / 10;
};

/**
 * Initialize BLE manager (lazy initialization)
 */
const initManager = (): BleManager => {
    if (!manager) {
        manager = new BleManager();
    }
    return manager;
};

/**
 * Get current BLE permission/power status
 */
const getStatus = async (): Promise<State> => {
    try {
        const bleManager = initManager();
        const state = await bleManager.state();
        return state;
    } catch (error) {
        console.error('[SmartScale] Error getting BLE status:', error);
        return State.Unknown;
    }
};

/**
 * Set handler for weight updates
 */
const setOnWeightUpdate = (updateHandler: WeightUpdateHandler): void => {
    onWeightUpdate = updateHandler;
};

/**
 * Set handler for device found
 */
const setOnDeviceFound = (foundHandler: DeviceFoundHandler): void => {
    onDeviceFound = foundHandler;
};

/**
 * Get latest weight reading
 */
const getCurrentWeight = (): SmartScaleReading | null => {
    return currentWeight;
};

/**
 * Process manufacturer data from BLE device
 */
const processManufacturerData = (data: Buffer): SmartScaleReading | null => {
    if (!data || data.length !== 15) {
        console.warn('[SmartScale] Invalid manufacturer data length:', data?.length);
        return null;
    }

    try {
        const weightRaw = (data[2] << 8) + data[3];
        const flags = data[8];
        const weightInLbs = convertWeightToLbs(weightRaw);
        const complete = Boolean((flags & 1) === 1);

        return {
            weight: weightInLbs,
            complete,
            timestamp: new Date().toISOString(),
        };
    } catch (error) {
        console.error('[SmartScale] Error processing manufacturer data:', error);
        return null;
    }
};

/**
 * Update weight and notify listeners
 */
const updateWeight = (reading: SmartScaleReading): void => {
    currentWeight = reading;
    if (onWeightUpdate) {
        onWeightUpdate(reading);
    }
};

/**
 * Start scanning for smart scale devices
 * @returns Promise that resolves when a device is found
 */
const startScan = async (): Promise<BLEDevice> => {
    const bleManager = initManager();

    return new Promise((resolve, reject) => {
        console.info('[SmartScale] Starting device scan...');

        bleManager.startDeviceScan(null, null, (error, device) => {
            if (error) {
                console.error('[SmartScale] Scan error:', error);
                reject(error);
                return;
            }

            if (!device) {
                return;
            }

            // Check if device name matches supported devices
            const isSupported = device.name
                && SUPPORTED_DEVICES.some(name => device.name?.includes(name));

            if (isSupported && device.manufacturerData) {
                try {
                    const encodedData = Buffer.from(device.manufacturerData, 'base64');
                    const reading = processManufacturerData(encodedData);

                    if (reading) {
                        updateWeight(reading);

                        const bleDevice: BLEDevice = {
                            id: device.id,
                            name: device.name,
                            rssi: device.rssi || 0,
                            manufacturerData: device.manufacturerData,
                        };

                        // Notify device found handler
                        if (onDeviceFound) {
                            onDeviceFound(bleDevice);
                        }

                        // Stop scanning on first valid device
                        stopScan();
                        resolve(bleDevice);
                    }
                } catch (processError: any) {
                    console.error('[SmartScale] Error processing device:', processError);
                }
            }
        });

        // Timeout after 30 seconds
        setTimeout(() => {
            stopScan();
            reject(new Error('Scan timeout: No smart scale found'));
        }, 30000);
    });
};

/**
 * Stop scanning for devices
 */
const stopScan = (): void => {
    if (manager) {
        console.info('[SmartScale] Stopping device scan');
        manager.stopDeviceScan();
    }
};

/**
 * Reset service state
 */
const reset = (): void => {
    currentWeight = null;
    onWeightUpdate = null;
    onDeviceFound = null;
    stopScan();
};

/**
 * Smart Scale Service (functional API)
 */
const SmartScaleService = {
    getStatus,
    setOnWeightUpdate,
    setOnDeviceFound,
    getCurrentWeight,
    startScan,
    stopScan,
    reset,
};

export default SmartScaleService;
