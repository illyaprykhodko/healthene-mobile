/**
 * Apple HealthKit Service
 * Modern functional wrapper around react-native-health
 */
// outsource dependencies
import { NativeModules } from 'react-native';
import AppleHealthKit from 'react-native-health';
// local dependencies
import { formatAppleHealthDate } from 'utils/measurement/health-import';
import type {
    DateRange,
    HealthSample,
    IHealthService,
    MeasurementType,
    BloodPressureValue,
} from 'types/health';

// NOTE ask for exactly what the import reads — weight, glucose and both halves of
// blood pressure. HeartRate and StepCount used to be requested here while nothing
// ever fetched them, which put unused rows in the system Health sheet and invites
// questions during App Review. Steps come from CMPedometer (`pedometer.service`),
// not from HealthKit.
const PERMISSIONS = {
    permissions: {
        read: [
            AppleHealthKit.Constants.Permissions.Weight,
            AppleHealthKit.Constants.Permissions.BloodGlucose,
            AppleHealthKit.Constants.Permissions.BloodPressureSystolic,
            AppleHealthKit.Constants.Permissions.BloodPressureDiastolic,
        ],
        write: [], // No write permissions needed for now
    },
};

// NOTE HealthKit hands glucose over in whichever unit we ask for, and the value is
// meaningless without knowing which one that was. Pin it here and map it to the
// matching backend unit id in `resolveImportUnitIds` — relying on the library
// default left the previous code claiming mmol/L with no way to verify it.
export const APPLE_HEALTH_GLUCOSE_UNIT = 'mgPerdL';

type HealthCallback = (error: unknown, results: any) => void;

interface NativeHealthKit {
    isAvailable: (onResult: HealthCallback) => void;
    initHealthKit: (permissions: unknown, onResult: HealthCallback) => void;
    getWeightSamples: (options: unknown, onResult: HealthCallback) => void;
    getBloodGlucoseSamples: (options: unknown, onResult: HealthCallback) => void;
    getBloodPressureSamples: (options: unknown, onResult: HealthCallback) => void;
}

/**
 * The native module, resolved at call time rather than at import time.
 *
 * NOTE `react-native-health` snapshots it on import:
 * `Object.assign({}, NativeModules.AppleHealthKit, { Constants })`. Under the new
 * architecture `NativeModules.X` is a lazy proxy into the TurboModule interop registry, so a
 * snapshot taken while that registry is still warming up keeps only `Constants` — every
 * method silently disappears and the app reports "HealthKit not available" on a device that
 * has it. Looking the module up per call costs nothing and survives the ordering. `Constants`
 * still comes from the library import, since the native module does not expose it.
 */
const getNative = (): NativeHealthKit => {
    const snapshot = AppleHealthKit as unknown as NativeHealthKit;
    if (typeof snapshot?.isAvailable === 'function') { return snapshot; }
    const live = (NativeModules as Record<string, unknown>).AppleHealthKit as NativeHealthKit | undefined;
    return live ?? snapshot;
};

/**
 * Check if HealthKit is available on this device
 */
const isAvailable = (): Promise<boolean> => {
    return new Promise(resolve => {
        try {
            // NOTE availability must stay side-effect free: it runs when the settings screen
            // opens, and the `initHealthKit` fallback this replaced meant that merely asking
            // "is HealthKit here?" could put the permission sheet on screen.
            const native = getNative();

            if (typeof native?.isAvailable !== 'function') {
                // A missing method does NOT mean the device lacks HealthKit — it means the
                // native module never reached JS. Keep the two apart: an absent live module
                // is a build problem (`npm run ios:pods`, which sets
                // `RCT_REMOVE_LEGACY_ARCH=0` to keep the legacy bridge symbols), while a
                // present live module with an empty snapshot is the import-ordering issue
                // `getNative` works around.
                console.warn('[AppleHealth] native module methods missing', {
                    snapshotKeys: Object.keys(AppleHealthKit).length,
                    liveModuleAvailable: Boolean((NativeModules as Record<string, unknown>).AppleHealthKit),
                });
                resolve(false);
                return;
            }

            native.isAvailable((error: unknown, available: boolean) => {
                if (error) {
                    console.warn('[AppleHealth] isAvailable failed', error);
                    resolve(false);
                    return;
                }
                if (!available) {
                    console.warn('[AppleHealth] HealthKit reports itself unavailable on this device');
                }
                resolve(Boolean(available));
            });
        } catch (error) {
            console.warn('[AppleHealth] isAvailable threw', error);
            resolve(false);
        }
    });
};

/**
 * Request HealthKit permissions
 */
const requestPermissions = (): Promise<boolean> => {
    return new Promise(resolve => {
        try {
            getNative().initHealthKit(PERMISSIONS, (error: unknown) => {
                if (error) {
                    console.warn('[AppleHealth] Permission request failed', error);
                    resolve(false);
                    return;
                }
                resolve(true);
            });
        } catch (error) {
            console.warn('[AppleHealth] initHealthKit threw', error);
            resolve(false);
        }
    });
};

/**
 * Fetch weight samples
 */
const fetchWeightSamples = (options: { startDate: string; endDate: string }): Promise<HealthSample[]> => {
    return new Promise((resolve, reject) => {
        getNative().getWeightSamples(
            { ...options, unit: 'pound' },
            (error: unknown, results: any) => {
                if (error) {
                    reject(error);
                } else {
                    const samples: HealthSample[] = (results || []).map((item: any) => ({
                        value: item.value,
                        endDate: item.endDate,
                        startDate: item.startDate,
                        source: 'APPLE_HEALTH' as const,
                    }));
                    resolve(samples);
                }
            }
        );
    });
};

/**
 * Fetch blood pressure samples
 */
const fetchBloodPressureSamples = (options: { startDate: string; endDate: string }): Promise<HealthSample[]> => {
    return new Promise((resolve, reject) => {
        getNative().getBloodPressureSamples(
            { ...options, unit: 'mmhg' },
            (error: unknown, results: any) => {
                if (error) {
                    reject(error);
                } else {
                    const samples: HealthSample[] = (results || []).map((item: any) => ({
                        value: {
                            systolic: item.bloodPressureSystolicValue,
                            diastolic: item.bloodPressureDiastolicValue,
                        } as BloodPressureValue,
                        endDate: item.endDate,
                        startDate: item.startDate,
                        source: 'APPLE_HEALTH' as const,
                    }));
                    resolve(samples);
                }
            }
        );
    });
};

/**
 * Fetch blood glucose samples, in mg/dL — see `APPLE_HEALTH_GLUCOSE_UNIT`
 */
const fetchBloodGlucoseSamples = (options: { startDate: string; endDate: string }): Promise<HealthSample[]> => {
    return new Promise((resolve, reject) => {
        getNative().getBloodGlucoseSamples(
            { ...options, unit: APPLE_HEALTH_GLUCOSE_UNIT },
            (error: unknown, results: any) => {
                if (error) {
                    reject(error);
                } else {
                    const samples: HealthSample[] = (results || []).map((item: any) => ({
                        value: item.value,
                        endDate: item.endDate,
                        startDate: item.startDate,
                        source: 'APPLE_HEALTH' as const,
                    }));
                    resolve(samples);
                }
            }
        );
    });
};

/**
 * Fetch samples for a specific measurement type
 *
 * NOTE only the three imported types are handled. Steps used to be here, but they are read
 * from CMPedometer (`pedometer.service`) and written as activities, so importing them as
 * measurements would file the same walk twice under different sources.
 */
const fetchSamples = async (
    type: MeasurementType,
    dateRange: DateRange
): Promise<HealthSample[]> => {
    const options = {
        startDate: formatAppleHealthDate(dateRange.startDate),
        endDate: formatAppleHealthDate(dateRange.endDate),
    };

    switch (type) {
        case 'WEIGHT':
            return fetchWeightSamples(options);
        case 'BLOOD_PRESSURE':
            return fetchBloodPressureSamples(options);
        case 'BLOOD_GLUCOSE':
            return fetchBloodGlucoseSamples(options);
        default:
            console.warn(`[AppleHealth] Unsupported type: ${type}`);
            return [];
    }
};

/**
 * Apple Health Service (functional API)
 */
const AppleHealthService: IHealthService = {
    isAvailable,
    fetchSamples,
    requestPermissions,
};

export default AppleHealthService;
