/**
 * Health Connect Service
 *
 * The Android counterpart of `apple-health.service`. Replaces the Google Fit integration,
 * which never worked here — `google-services.json` carries no Android OAuth client, so
 * `authorize()` could not succeed — and which Google is turning down in favour of Health
 * Connect anyway.
 *
 * Two things are genuinely better than on iOS:
 *  - units are explicit when reading (`inPounds`, `inMilligramsPerDeciliter`), so a value's
 *    meaning cannot be guessed wrong the way it was with HealthKit's library defaults;
 *  - granted permissions are readable, so "no access" and "no data" are distinguishable —
 *    HealthKit hides that on purpose.
 */
// outsource dependencies
import {
    readRecords,
    initialize,
    getSdkStatus,
    requestPermission,
    getGrantedPermissions,
    SdkAvailabilityStatus,
} from 'react-native-health-connect';
// local dependencies
import type {
    DateRange,
    HealthSample,
    IHealthService,
    MeasurementType,
} from 'types/health';
import {
    mapHealthConnectRecord,
    type HealthConnectRecord,
    HEALTH_CONNECT_RECORD_TYPE,
    IMPORTED_MEASUREMENT_TYPES,
} from 'utils/measurement/health-import';

type RecordType = 'Weight' | 'BloodGlucose' | 'BloodPressure';

/**
 * Availability is three-valued, and the third value matters: Health Connect may be installed
 * but too old to talk to. That is "ask the patient to update it", not "your device cannot do
 * this", so the settings screen needs to tell them apart.
 */
export type HealthConnectAvailability = 'available' | 'update-required' | 'unavailable';

const READ_PERMISSIONS = IMPORTED_MEASUREMENT_TYPES
    .map(type => HEALTH_CONNECT_RECORD_TYPE[type])
    .filter((recordType): recordType is RecordType => Boolean(recordType))
    .map(recordType => ({
        recordType,
        accessType: 'read' as const,
    }));

const logPrefix = '[HealthConnect]';

/**
 * `initialize()` has to run before anything else touches the client, and calling it twice is
 * harmless — so it is done lazily here rather than at import time, where a failure would be
 * invisible.
 */
let isInitialized = false;

const ensureInitialized = async (): Promise<boolean> => {
    if (isInitialized) { return true; }
    try {
        isInitialized = await initialize();
        return isInitialized;
    } catch (error) {
        console.warn(`${logPrefix} initialize failed`, error);
        return false;
    }
};

export const getAvailability = async (): Promise<HealthConnectAvailability> => {
    try {
        const status = await getSdkStatus();
        if (status === SdkAvailabilityStatus.SDK_AVAILABLE) { return 'available'; }
        if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) {
            return 'update-required';
        }
        return 'unavailable';
    } catch (error) {
        console.warn(`${logPrefix} getSdkStatus failed`, error);
        return 'unavailable';
    }
};

const isAvailable = async (): Promise<boolean> => {
    // NOTE only `available` counts as usable, but the caller that needs to offer "install or
    // update Health Connect" reads `getAvailability` instead of this boolean.
    return (await getAvailability()) === 'available';
};

/**
 * The measurement types the patient actually granted read access to.
 *
 * NOTE this is what makes the Android side honest: the import can skip a type instead of
 * querying it pointlessly, and the settings screen can name what is missing. On iOS the same
 * question is unanswerable, which is why that screen can only hint.
 */
export const getGrantedTypes = async (): Promise<MeasurementType[]> => {
    if (!(await ensureInitialized())) { return []; }

    try {
        const granted = await getGrantedPermissions();
        const grantedRecordTypes = new Set(
            granted
                .filter(permission => permission.accessType === 'read')
                .map(permission => permission.recordType)
        );

        return IMPORTED_MEASUREMENT_TYPES.filter(type => {
            const recordType = HEALTH_CONNECT_RECORD_TYPE[type];
            return Boolean(recordType) && grantedRecordTypes.has(recordType as RecordType);
        });
    } catch (error) {
        console.warn(`${logPrefix} getGrantedPermissions failed`, error);
        return [];
    }
};

const requestPermissions = async (): Promise<boolean> => {
    if (!(await ensureInitialized())) { return false; }

    try {
        await requestPermission(READ_PERMISSIONS);
        // NOTE the request itself resolves even when the patient granted nothing, so the
        // answer comes from what is actually granted afterwards — not from the call.
        const grantedTypes = await getGrantedTypes();
        return grantedTypes.length > 0;
    } catch (error) {
        console.warn(`${logPrefix} requestPermission failed`, error);
        return false;
    }
};

const fetchSamples = async (
    type: MeasurementType,
    dateRange: DateRange
): Promise<HealthSample[]> => {
    const recordType = HEALTH_CONNECT_RECORD_TYPE[type];
    if (!recordType) {
        console.warn(`${logPrefix} Unsupported type: ${type}`);
        return [];
    }

    if (!(await ensureInitialized())) { return []; }

    const { records } = await readRecords(recordType, {
        timeRangeFilter: {
            operator: 'between',
            endTime: dateRange.endDate,
            startTime: dateRange.startDate,
        },
    });

    return (records as HealthConnectRecord[])
        .map(record => mapHealthConnectRecord(type, record))
        .filter((sample): sample is HealthSample => sample !== null);
};

const HealthConnectService: IHealthService = {
    isAvailable,
    fetchSamples,
    requestPermissions,
};

export default HealthConnectService;
