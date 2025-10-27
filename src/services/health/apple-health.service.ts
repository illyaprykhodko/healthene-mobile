/**
 * Apple HealthKit Service
 * Modern functional wrapper around react-native-health
 */
// outsource dependencies
import AppleHealthKit from 'react-native-health';
// local dependencies
import type {
    DateRange,
    HealthSample,
    IHealthService,
    MeasurementType,
    BloodPressureValue,
} from 'types/health';

const PERMISSIONS = {
    permissions: {
        read: [
            AppleHealthKit.Constants.Permissions.Weight,
            AppleHealthKit.Constants.Permissions.BloodGlucose,
            AppleHealthKit.Constants.Permissions.BloodPressureSystolic,
            AppleHealthKit.Constants.Permissions.BloodPressureDiastolic,
            AppleHealthKit.Constants.Permissions.HeartRate,
            AppleHealthKit.Constants.Permissions.StepCount,
        ],
        write: [], // No write permissions needed for now
    },
};

/**
 * Check if HealthKit is available on this device
 */
const isAvailable = (): Promise<boolean> => {
    return new Promise(resolve => {
        try {
            // Check if the method exists before calling it
            if (typeof AppleHealthKit.isAvailable === 'function') {
                AppleHealthKit.isAvailable((error, available) => {
                    if (error) {
                        // console.warn('[AppleHealth] isAvailable error:', error);
                        resolve(false);
                    } else {
                        resolve(available);
                    }
                });
            } else {
                // Fallback: try to initialize to check if HealthKit works
                // console.warn('[AppleHealth] isAvailable method not found, trying initHealthKit as fallback');
                AppleHealthKit.initHealthKit(PERMISSIONS, (error, results) => {
                    resolve(!error);
                });
            }
        } catch (error) {
            // console.warn('[AppleHealth] HealthKit not available:', error);
            resolve(false);
        }
    });
};

/**
 * Request HealthKit permissions
 */
const requestPermissions = (): Promise<boolean> => {
    return new Promise(resolve => {
        AppleHealthKit.initHealthKit(PERMISSIONS, (error, results) => {
            if (error) {
                // console.warn('[AppleHealth] Permission request failed:', error);
                resolve(false);
            } else {
                // console.log('[AppleHealth] Permissions granted:', results);
                resolve(true);
            }
        });
    });
};

/**
 * Fetch weight samples
 */
const fetchWeightSamples = (options: { startDate: string; endDate: string }): Promise<HealthSample[]> => {
    return new Promise((resolve, reject) => {
        AppleHealthKit.getWeightSamples(
            { ...options, unit: 'pound' as any },
            (error, results) => {
                if (error) {
                    // console.error('[AppleHealth] getWeightSamples error:', error);
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
        AppleHealthKit.getBloodPressureSamples(
            { ...options, unit: 'mmhg' as any },
            (error, results) => {
                if (error) {
                    // console.error('[AppleHealth] getBloodPressureSamples error:', error);
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
 * Fetch blood glucose samples
 */
const fetchBloodGlucoseSamples = (options: { startDate: string; endDate: string }): Promise<HealthSample[]> => {
    return new Promise((resolve, reject) => {
        AppleHealthKit.getBloodGlucoseSamples(options as any, (error, results) => {
            if (error) {
                // console.error('[AppleHealth] getBloodGlucoseSamples error:', error);
                reject(error);
            } else {
                const samples: HealthSample[] = (results || []).map((item: any) => ({
                    value: item.value, // already in mmol/L
                    endDate: item.endDate,
                    startDate: item.startDate,
                    source: 'APPLE_HEALTH' as const,
                }));
                resolve(samples);
            }
        });
    });
};

/**
 * Fetch step count samples
 */
const fetchStepCountSamples = (options: { startDate: string; endDate: string }): Promise<HealthSample[]> => {
    return new Promise((resolve, reject) => {
        AppleHealthKit.getStepCount(options as any, (error, result: any) => {
            if (error) {
                // console.error('[AppleHealth] getStepCount error:', error);
                reject(error);
            } else {
                const sample: HealthSample = {
                    value: result.value || 0,
                    endDate: options.endDate,
                    startDate: options.startDate,
                    source: 'APPLE_HEALTH' as const,
                };
                resolve([sample]);
            }
        });
    });
};

/**
 * Fetch samples for a specific measurement type
 */
const fetchSamples = async (
    type: MeasurementType,
    dateRange: DateRange
): Promise<HealthSample[]> => {
    const options = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
    };

    switch (type) {
        case 'WEIGHT':
            return fetchWeightSamples(options);
        case 'BLOOD_PRESSURE':
            return fetchBloodPressureSamples(options);
        case 'BLOOD_GLUCOSE':
            return fetchBloodGlucoseSamples(options);
        case 'STEPS':
            return fetchStepCountSamples(options);
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
