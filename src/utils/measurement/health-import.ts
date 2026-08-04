/**
 * Pure helpers for importing measurements from Apple Health / Google Fit.
 *
 * Kept free of native modules on purpose: `react-native-health` and
 * `react-native-google-fit` are not mocked in the Jest setup, so anything importing
 * the health services cannot be unit-tested. These functions carry the parts worth
 * testing — unit mapping and the de-duplication filter.
 */
// outsource dependencies
import dayjs from 'services/date';
// local dependencies
import type { HealthSample, MeasurementType } from 'types/health';

/**
 * The measurement types the login-time import covers — the same three v1 imported.
 * Steps and heart rate are deliberately absent: see `measurement-config.ts`.
 */
export const IMPORTED_MEASUREMENT_TYPES: MeasurementType[] = [
    'WEIGHT',
    'BLOOD_GLUCOSE',
    'BLOOD_PRESSURE',
];

interface ImportUnitIds {
    defaultUnitId?: number;
    systolicUnitId?: number;
    diastolicUnitId?: number;
}

export interface BackendUnit {
    id?: number;
    name?: string;
    unitType?: string;
}

/**
 * Names the backend may use for the unit each health app reports a type in. The services pin
 * the unit, so the value's meaning is fixed: `fetchWeightSamples` asks for pounds, and glucose
 * is normalised to mg/dL on both platforms (see `APPLE_HEALTH_GLUCOSE_UNIT` and the Google Fit
 * conversion note).
 *
 * NOTE several spellings per unit because the backend's labels are display strings, not
 * identifiers — it publishes weight as `lbs.`, with the full stop. Matching is done on a
 * normalised form, so punctuation and case do not matter, but the alias list stays explicit:
 * an unrecognised unit must skip the import rather than fall back to whatever is at hand.
 * Filing pounds under a kilogram unit would turn a 180 lb patient into a 180 kg one.
 */
const HEALTH_APP_UNIT_ALIASES: Partial<Record<MeasurementType, string[]>> = {
    WEIGHT: ['lbs', 'lb', 'pound', 'pounds'],
    BLOOD_GLUCOSE: ['mgdl', 'mgperdl'],
};

/** Lowercase, strip anything that is not a letter or digit: `lbs.` and `mg/dL` → `lbs`, `mgdl`. */
const normalizeUnitName = (name?: string): string => String(name || '').toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Unit ids for a background import, taken from the units the backend published for the type.
 *
 * NOTE these ids must come from the backend, not from `MEASUREMENT_UNIT_IDS`. That constant is
 * a local guess — sending its `POUNDS` for weight is rejected with
 * `MEASUREMENT_IS_NOT_CORRECT: Measurement type WEIGHT cannot be created with such units`.
 * `useMeasurementSubmit` has always read them off `item.measurement.units`, and v1 did the
 * same (`payload?.units?.[0]?.id`); a background import has no phase item, so it reads the
 * same list from `measurement/types`.
 *
 * Returns null when the unit cannot be identified: filing a measurement under a wrong unit
 * would put a wrong number in a patient's record, so skipping is the safer outcome.
 */
export const resolveImportUnitIds = (
    type: MeasurementType,
    units: BackendUnit[],
): ImportUnitIds | null => {
    if (type === 'BLOOD_PRESSURE') {
        const systolicUnitId = units.find(unit => unit.unitType === 'SYSTOLIC')?.id;
        const diastolicUnitId = units.find(unit => unit.unitType === 'DIASTOLIC')?.id;
        if (!systolicUnitId || !diastolicUnitId) { return null; }
        return {
            systolicUnitId,
            diastolicUnitId,
        };
    }

    const aliases = HEALTH_APP_UNIT_ALIASES[type];
    if (!aliases) { return null; }

    const defaultUnitId = units.find(unit => aliases.includes(normalizeUnitName(unit.name)))?.id;
    if (!defaultUnitId) { return null; }

    return { defaultUnitId };
};

/**
 * Format a date the way `react-native-health`'s native side insists on.
 *
 * NOTE it parses with a single fixed `NSDateFormatter` pattern,
 * `yyyy-MM-dd'T'HH:mm:ss.SSSZ` (`RCTAppleHealthKit+Utils.m:67`). Anything that does not match
 * parses to `nil`, and the module then reports the misleading "startDate is required in
 * options" even though a value was passed — which is exactly what a backend timestamp like
 * `2026-08-04T06:00:00` (no milliseconds, no offset) triggers. `ZZ` is dayjs's offset without
 * a colon (`+0300`), which is what the pattern's single `Z` means (RFC 822).
 */
export const formatAppleHealthDate = (value: string): string => (
    dayjs(value).format('YYYY-MM-DDTHH:mm:ss.SSSZZ')
);

/**
 * Drop samples that were already imported.
 *
 * The watermark is the `endDate` of the newest sample sent for this type, so anything at
 * or before it has been filed already. v1 had no such filter — it re-sent every sample
 * since the start of the day on each app wake-up and left de-duplication to the backend.
 * Samples with an unparseable date are dropped: a measurement with no usable timestamp
 * cannot be placed in the patient's record.
 */
export const filterNewSamples = (samples: HealthSample[], watermark?: string | null): HealthSample[] => {
    const boundary = watermark ? dayjs(watermark) : null;

    return samples.filter(sample => {
        const sampleDate = dayjs(sample.endDate);
        if (!sampleDate.isValid()) { return false; }
        if (!boundary || !boundary.isValid()) { return true; }
        return sampleDate.isAfter(boundary);
    });
};

/**
 * The newest `endDate` in a batch — the value to store as the next watermark.
 * Returns null when nothing in the batch carries a usable date.
 */
export const getNewestSampleDate = (samples: HealthSample[]): string | null => {
    return samples.reduce<string | null>((newest, sample) => {
        const sampleDate = dayjs(sample.endDate);
        if (!sampleDate.isValid()) { return newest; }
        if (!newest || sampleDate.isAfter(dayjs(newest))) { return sample.endDate; }
        return newest;
    }, null);
};
