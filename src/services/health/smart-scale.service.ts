// outsource dependencies
import { Buffer } from 'buffer';
import { BleManager, State } from 'react-native-ble-plx';
// local dependencies
import type { SmartScaleReading, BLEDevice } from 'types/health';

type WeightUpdateHandler = (reading: SmartScaleReading) => void;
type DeviceFoundHandler = (device: BLEDevice) => void;

let manager: BleManager | null = null;
let onWeightUpdate: WeightUpdateHandler | null = null;
let onDeviceFound: DeviceFoundHandler | null = null;
let currentWeight: SmartScaleReading | null = null;

const SUPPORTED_DEVICES = ['ADV', 'Smart Scale'];

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

const getStatus = async (): Promise<State> => {
    try {
        const bleManager = initManager();
        
        // Wait a bit for BLE manager to initialize
        await new Promise<void>(resolve => setTimeout(() => resolve(), 100));
        
        const state = await bleManager.state();
        return state;
    } catch (error) {
        console.error('[SmartScale] Error getting BLE status:', error);
        return State.Unknown;
    }
};

/**
 * Subscribe to Bluetooth state changes
 * @param listener Function to call when state changes
 * @returns Subscription object with remove() method
 */
const onStateChange = (
    listener: (state: State) => void
): { remove: () => void } => {
    const bleManager = initManager();
    const subscription = bleManager.onStateChange(listener, true);
    return subscription;
};

const setOnWeightUpdate = (updateHandler: WeightUpdateHandler): void => {
    onWeightUpdate = updateHandler;
};

const setOnDeviceFound = (foundHandler: DeviceFoundHandler): void => {
    onDeviceFound = foundHandler;
};

const getCurrentWeight = (): SmartScaleReading | null => {
    return currentWeight;
};

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

                        if (onDeviceFound) {
                            onDeviceFound(bleDevice);
                        }

                        resolve(bleDevice);
                    }
                } catch (processError: any) {
                    console.error('[SmartScale] Error processing device:', processError);
                }
            }
        });

        setTimeout(() => {
            stopScan();
            reject(new Error('Scan timeout: No smart scale found'));
        }, 30000);
    });
};

const stopScan = (): void => {
    if (manager) {
        console.info('[SmartScale] Stopping device scan');
        manager.stopDeviceScan();
    }
};

const reset = (): void => {
    currentWeight = null;
    onWeightUpdate = null;
    onDeviceFound = null;
    stopScan();
};

const SmartScaleService = {
    reset,
    stopScan,
    getStatus,
    startScan,
    onStateChange,
    setOnDeviceFound,
    getCurrentWeight,
    setOnWeightUpdate,
};

export default SmartScaleService;
