// local dependencies
import type { HealthSample, MeasurementType } from '../../src/types/health';
import {
    filterNewSamples,
    getNewestSampleDate,
    resolveImportUnitIds,
    formatAppleHealthDate,
    mapHealthConnectRecord,
    IMPORTED_MEASUREMENT_TYPES,
    HEALTH_CONNECT_RECORD_TYPE,
} from '../../src/utils/measurement/health-import';

const sample = (endDate: string, value: number = 180): HealthSample => ({
    value,
    endDate,
    startDate: endDate,
    source: 'APPLE_HEALTH',
});

describe('resolveImportUnitIds', () => {
    // Shaped like what `measurement/types` publishes. The ids are the backend's, not the
    // local MEASUREMENT_UNIT_IDS constant — posting that one for weight is rejected with
    // MEASUREMENT_IS_NOT_CORRECT.
    // The real backend publishes weight as `lbs.` — with the full stop — and only that one
    // unit, which is why matching normalises punctuation and case.
    const WEIGHT_UNITS = [
        { id: 7, name: 'lbs.' },
        { id: 8, name: 'kg' },
    ];
    const GLUCOSE_UNITS = [
        { id: 11, name: 'mmol/L' },
        { id: 12, name: 'mg/dL' },
    ];
    const BP_UNITS = [
        { id: 1, name: 'mmHg', unitType: 'SYSTOLIC' },
        { id: 2, name: 'mmHg', unitType: 'DIASTOLIC' },
    ];

    it('picks the pounds unit for weight, since that is what the health apps return', () => {
        expect(resolveImportUnitIds('WEIGHT', WEIGHT_UNITS)).toEqual({ defaultUnitId: 7 });
    });

    it('picks the mg/dL unit for blood glucose', () => {
        expect(resolveImportUnitIds('BLOOD_GLUCOSE', GLUCOSE_UNITS)).toEqual({ defaultUnitId: 12 });
    });

    it('matches blood pressure units by unitType, like useMeasurementSubmit does', () => {
        expect(resolveImportUnitIds('BLOOD_PRESSURE', BP_UNITS)).toEqual({
            systolicUnitId: 1,
            diastolicUnitId: 2,
        });
    });

    it('tolerates punctuation and case in the backend label', () => {
        expect(resolveImportUnitIds('WEIGHT', [{ id: 7, name: 'Lbs.' }])).toEqual({ defaultUnitId: 7 });
        expect(resolveImportUnitIds('BLOOD_GLUCOSE', [{ id: 12, name: 'MG/DL' }])).toEqual({ defaultUnitId: 12 });
    });

    it('returns null rather than guessing when the expected unit is absent', () => {
        // The dangerous case: pounds filed under a kilogram unit would turn a 180 lb patient
        // into a 180 kg one, so a single unrecognised unit must never be used as a fallback.
        expect(resolveImportUnitIds('WEIGHT', [{ id: 8, name: 'kg' }])).toBeNull();
        expect(resolveImportUnitIds('BLOOD_GLUCOSE', [{ id: 11, name: 'mmol/L' }])).toBeNull();
    });

    it('returns null when blood pressure is missing either half', () => {
        expect(resolveImportUnitIds('BLOOD_PRESSURE', [BP_UNITS[0]])).toBeNull();
    });

    it('returns null for an empty unit list, so nothing is filed under unit id 0', () => {
        IMPORTED_MEASUREMENT_TYPES.forEach(type => {
            expect(resolveImportUnitIds(type, [])).toBeNull();
        });
    });

    it('returns null for a type the import does not cover', () => {
        expect(resolveImportUnitIds('STEPS' as MeasurementType, [{ id: 1, name: 'steps' }])).toBeNull();
    });
});

describe('IMPORTED_MEASUREMENT_TYPES', () => {
    it('covers the three types v1 imported and nothing else', () => {
        expect(IMPORTED_MEASUREMENT_TYPES).toEqual(['WEIGHT', 'BLOOD_GLUCOSE', 'BLOOD_PRESSURE']);
    });
});

describe('formatAppleHealthDate', () => {
    // The native module parses with one fixed pattern, `yyyy-MM-dd'T'HH:mm:ss.SSSZ`, and
    // answers "startDate is required in options" for anything else — including a backend
    // timestamp with no milliseconds and no offset, which is what broke the first import.
    const PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}[+-]\d{4}$/;

    it('adds milliseconds and a numeric offset to a bare backend timestamp', () => {
        expect(formatAppleHealthDate('2026-08-04T06:00:00')).toMatch(PATTERN);
    });

    it('rewrites a UTC "Z" suffix into the numeric offset the parser expects', () => {
        const formatted = formatAppleHealthDate('2026-08-04T07:56:30.808Z');
        expect(formatted).toMatch(PATTERN);
        expect(formatted).not.toContain('Z');
    });

    it('accepts a date-only string', () => {
        expect(formatAppleHealthDate('2026-08-04')).toMatch(PATTERN);
    });

    it('keeps the instant intact, only the representation changes', () => {
        const iso = '2026-08-04T07:56:30.808Z';
        expect(new Date(formatAppleHealthDate(iso)).getTime()).toBe(new Date(iso).getTime());
    });
});

describe('mapHealthConnectRecord', () => {
    // Health Connect hands back explicit unit accessors when reading, so the mapper must pick
    // the one matching the backend and the iOS side: pounds, mg/dL, mmHg. Picking another
    // accessor would silently file a value on a different scale.
    const TIME = '2026-08-04T09:00:00.000Z';

    it('maps weight in pounds, matching the unit the backend publishes', () => {
        const sample = mapHealthConnectRecord('WEIGHT', {
            time: TIME,
            weight: { inPounds: 180.5 },
        });
        expect(sample).toEqual({
            value: 180.5,
            endDate: TIME,
            startDate: TIME,
            source: 'GOOGLE_FIT',
        });
    });

    it('maps blood glucose in mg/dL, the same unit the iOS import sends', () => {
        const sample = mapHealthConnectRecord('BLOOD_GLUCOSE', {
            time: TIME,
            level: { inMilligramsPerDeciliter: 95.5 },
        });
        expect(sample?.value).toBe(95.5);
    });

    it('maps blood pressure into the two-field value shape', () => {
        const sample = mapHealthConnectRecord('BLOOD_PRESSURE', {
            time: TIME,
            systolic: { inMillimetersOfMercury: 120 },
            diastolic: { inMillimetersOfMercury: 80 },
        });
        expect(sample?.value).toEqual({
            systolic: 120,
            diastolic: 80,
        });
    });

    it('returns null when the record carries no timestamp — it could not be placed in the record', () => {
        expect(mapHealthConnectRecord('WEIGHT', { weight: { inPounds: 180 } })).toBeNull();
    });

    it('returns null when the measured value is missing', () => {
        expect(mapHealthConnectRecord('WEIGHT', { time: TIME })).toBeNull();
        expect(mapHealthConnectRecord('BLOOD_GLUCOSE', { time: TIME, level: {} })).toBeNull();
    });

    it('returns null when blood pressure is missing either half', () => {
        expect(mapHealthConnectRecord('BLOOD_PRESSURE', {
            time: TIME,
            systolic: { inMillimetersOfMercury: 120 },
        })).toBeNull();
    });

    it('falls back to interval timestamps for records that have no instant', () => {
        const sample = mapHealthConnectRecord('WEIGHT', {
            startTime: '2026-08-04T08:00:00.000Z',
            endTime: TIME,
            weight: { inPounds: 180 },
        });
        expect(sample?.startDate).toBe('2026-08-04T08:00:00.000Z');
        expect(sample?.endDate).toBe(TIME);
    });

    it('covers every imported type with a Health Connect record type', () => {
        IMPORTED_MEASUREMENT_TYPES.forEach(type => {
            expect(HEALTH_CONNECT_RECORD_TYPE[type]).toBeTruthy();
        });
    });
});

describe('filterNewSamples', () => {
    const older = sample('2026-08-01T10:00:00.000Z');
    const atWatermark = sample('2026-08-02T10:00:00.000Z');
    const newer = sample('2026-08-03T10:00:00.000Z');

    it('keeps everything when there is no watermark yet', () => {
        expect(filterNewSamples([older, newer])).toEqual([older, newer]);
    });

    it('drops samples at or before the watermark so nothing is filed twice', () => {
        const result = filterNewSamples([older, atWatermark, newer], '2026-08-02T10:00:00.000Z');
        expect(result).toEqual([newer]);
    });

    it('returns an empty list when every sample was already imported', () => {
        expect(filterNewSamples([older, atWatermark], '2026-08-02T10:00:00.000Z')).toEqual([]);
    });

    it('ignores an unparseable watermark instead of dropping everything', () => {
        expect(filterNewSamples([older, newer], 'not-a-date')).toEqual([older, newer]);
    });

    it('drops samples without a usable date — they cannot be placed in the record', () => {
        const broken = sample('nonsense');
        expect(filterNewSamples([broken, newer])).toEqual([newer]);
    });

    it('handles blood pressure samples, whose value is an object', () => {
        const bp: HealthSample = {
            value: { systolic: 120, diastolic: 80 },
            startDate: '2026-08-03T10:00:00.000Z',
            endDate: '2026-08-03T10:00:00.000Z',
            source: 'APPLE_HEALTH',
        };
        expect(filterNewSamples([bp], '2026-08-01T00:00:00.000Z')).toEqual([bp]);
    });
});

describe('getNewestSampleDate', () => {
    it('returns the latest endDate regardless of input order', () => {
        const samples = [
            sample('2026-08-03T10:00:00.000Z'),
            sample('2026-08-01T10:00:00.000Z'),
            sample('2026-08-02T10:00:00.000Z'),
        ];
        expect(getNewestSampleDate(samples)).toBe('2026-08-03T10:00:00.000Z');
    });

    it('returns null for an empty batch', () => {
        expect(getNewestSampleDate([])).toBeNull();
    });

    it('skips unparseable dates', () => {
        const samples = [sample('nonsense'), sample('2026-08-02T10:00:00.000Z')];
        expect(getNewestSampleDate(samples)).toBe('2026-08-02T10:00:00.000Z');
    });

    it('returns null when no sample carries a usable date', () => {
        expect(getNewestSampleDate([sample('nonsense')])).toBeNull();
    });
});
