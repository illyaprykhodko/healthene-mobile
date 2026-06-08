/**
 * Pedometer Service
 * Real-time step counting via CMPedometer (iOS) and the hardware Step Counter sensor (Android),
 * wrapping @dongminyu/react-native-step-counter. Event-driven — used for the live step counter
 * during an active walking session (not aggregate Health queries).
 */
// outsource dependencies
import { Platform, PermissionsAndroid } from 'react-native';
import {
    parseStepData,
    stopStepCounterUpdate,
    startStepCounterUpdate,
    isStepCountingSupported,
} from '@dongminyu/react-native-step-counter';

export interface PedometerUpdate {
    /** Steps reported by the sensor for the current subscription. */
    steps: number;
}

let subscription: { remove: () => void } | null = null;

/**
 * Whether the device exposes a usable step-counting sensor.
 */
const isAvailable = async (): Promise<boolean> => {
    try {
        const { supported } = await isStepCountingSupported();
        return Boolean(supported);
    } catch {
        return false;
    }
};

/**
 * Ensure we may read steps. Android needs a runtime ACTIVITY_RECOGNITION grant; on iOS the
 * Motion (CMPedometer) prompt is presented by the system on the first startStepCounterUpdate,
 * so here we only confirm hardware support.
 */
const requestPermission = async (): Promise<boolean> => {
    try {
        if (Platform.OS === 'android') {
            const result = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION
            );
            return result === PermissionsAndroid.RESULTS.GRANTED;
        }
        const { supported } = await isStepCountingSupported();
        return Boolean(supported);
    } catch {
        return false;
    }
};

/**
 * Subscribe to live step updates for a new session segment. Steps are reported relative to the
 * start time passed below; the caller still baselines the first reading to stay robust across
 * platforms. Always pair with stop().
 */
const start = (onUpdate: (update: PedometerUpdate) => void): void => {
    stop();
    subscription = startStepCounterUpdate(new Date(), data => {
        const parsed = parseStepData(data);
        onUpdate({ steps: Number(parsed.steps) || 0 });
    });
};

/**
 * Stop live updates and release the native subscription.
 */
const stop = (): void => {
    if (subscription) {
        subscription.remove();
        subscription = null;
    }
    stopStepCounterUpdate();
};

const PedometerService = {
    stop,
    start,
    isAvailable,
    requestPermission,
};

export default PedometerService;
