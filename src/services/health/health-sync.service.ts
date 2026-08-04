/**
 * Health sync service
 *
 * Imports measurements the patient recorded in Apple Health / Google Fit into their
 * Healthene record. v1 did this on every app wake-up (`src/private-screens/controller.js`)
 * and v2 lost it, so patients upgrading from 1.0.13 stopped seeing their weight and
 * glucose appear on their own.
 *
 * Two things v1 did not have and this does:
 *  - a per-type watermark, so a sample is filed once instead of being re-sent on every
 *    launch (v1 re-sent everything since the start of the day and relied on the backend);
 *  - an explicit on/off flag the patient controls, off until they turn it on — the system
 *    Health sheet is only shown when they do, not silently at login.
 */
// outsource dependencies
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// local dependencies
import dayjs from 'services/date';
import { store } from 'store';
import { dayOverviewApi } from 'store/api/dayOverviewApi';
import { buildHealthAppPayload } from 'utils/measurement/payload-builder';
import type { HealthSample, MeasurementType, MeasurementSource } from 'types/health';
import {
    filterNewSamples,
    getNewestSampleDate,
    resolveImportUnitIds,
    IMPORTED_MEASUREMENT_TYPES,
    type BackendUnit,
} from 'utils/measurement/health-import';
import GoogleFitService from './google-fit.service';
import AppleHealthService from './apple-health.service';

const ENABLED_KEY = '@health_sync_enabled';
const WATERMARKS_KEY = '@health_sync_watermarks';
// NOTE the import runs on every return to the foreground, which is the whole point: the
// patient switches to Health, records a weight, comes back, and it is already there. The
// throttle only exists to absorb rapid app switching, so it has to stay well under the time
// that flow takes — 15 minutes made the feature look broken.
const MIN_INTERVAL_MS = 30 * 1000;

type Watermarks = Partial<Record<MeasurementType, string>>;

interface WindowStart {
    startDate: string;
    origin: 'watermark' | 'backend-record' | 'today';
}

/** What happened to one type in one run — logged so a silent no-op is never ambiguous. */
type ImportOutcome = 'imported' | 'nothing-new' | 'no-matching-unit' | 'failed';

interface ImportReport {
    outcome: ImportOutcome;
    fetched: number;
    fresh: number;
    window: WindowStart;
    /**
     * Only meaningful for `imported`. `false` means the batch went to the backend but no
     * watermark could be derived from it, so the very same samples will be sent again on the
     * next launch — a loop worth noticing rather than discovering from server logs.
     */
    watermarkAdvanced?: boolean;
    availableUnits?: Array<string | undefined>;
}

// NOTE the platform is fixed for the lifetime of the process, so resolve the service and
// the source label once instead of branching on every call.
const healthService = Platform.OS === 'ios' ? AppleHealthService : GoogleFitService;
const SOURCE: Extract<MeasurementSource, 'APPLE_HEALTH' | 'GOOGLE_FIT'>
    = Platform.OS === 'ios' ? 'APPLE_HEALTH' : 'GOOGLE_FIT';

class HealthSyncService {
    private readonly logPrefix = '[HealthSyncService]';

    private lastRunAt: number | null = null;

    private isRunning = false;

    private log (message: string, payload?: unknown): void {
        if (payload !== undefined) {
            // eslint-disable-next-line no-console
            console.log(`${this.logPrefix} ${message}`, payload);
            return;
        }
        // eslint-disable-next-line no-console
        console.log(`${this.logPrefix} ${message}`);
    }

    public async isAvailable (): Promise<boolean> {
        return healthService.isAvailable();
    }

    /**
     * Shows the system permission dialog. On iOS this resolves `true` even when the
     * patient denies read access — HealthKit hides read authorisation on purpose — so the
     * caller must not treat it as proof that data will arrive.
     */
    public async requestPermissions (): Promise<boolean> {
        return healthService.requestPermissions();
    }

    public async isEnabled (): Promise<boolean> {
        try {
            const enabled = await AsyncStorage.getItem(ENABLED_KEY);
            return enabled === 'true';
        } catch {
            return false;
        }
    }

    public async enable (): Promise<void> {
        await AsyncStorage.setItem(ENABLED_KEY, 'true');
    }

    public async disable (): Promise<void> {
        await AsyncStorage.setItem(ENABLED_KEY, 'false');
    }

    /**
     * Read the stored watermarks defensively: a malformed or half-written entry must look
     * like "no watermark" rather than break the import (same approach as the soft-update
     * state in `useAppUpdateGate`).
     */
    private async getWatermarks (): Promise<Watermarks> {
        try {
            const raw = await AsyncStorage.getItem(WATERMARKS_KEY);
            if (!raw) { return {}; }
            const parsed = JSON.parse(raw) as Record<string, unknown>;
            if (!parsed || typeof parsed !== 'object') { return {}; }

            return Object.entries(parsed).reduce<Watermarks>((acc, [type, value]) => {
                if (typeof value === 'string' && dayjs(value).isValid()) {
                    acc[type as MeasurementType] = value;
                }
                return acc;
            }, {});
        } catch {
            return {};
        }
    }

    private async setWatermark (type: MeasurementType, endDate: string): Promise<void> {
        const watermarks = await this.getWatermarks();
        await AsyncStorage.setItem(WATERMARKS_KEY, JSON.stringify({
            ...watermarks,
            [type]: endDate,
        }));
    }

    /**
     * Where to start reading for a type: after the last sample we filed, else after the
     * newest measurement the backend already holds (so a reinstall does not re-import the
     * patient's history), else today.
     */
    private async resolveWindowStart (type: MeasurementType, watermark?: string): Promise<WindowStart> {
        if (watermark) { return { startDate: watermark, origin: 'watermark' }; }

        const request = store.dispatch(
            dayOverviewApi.endpoints.getLastMeasurement.initiate(type)
        );

        try {
            const last = await request.unwrap();
            const timestamp = (last as { timestamp?: string })?.timestamp;
            if (typeof timestamp === 'string' && dayjs(timestamp).isValid()) {
                return { startDate: timestamp, origin: 'backend-record' };
            }
        } catch (error) {
            this.log(`No stored measurement to start from for ${type}`, error);
        } finally {
            request.unsubscribe();
        }

        return { startDate: dayjs().startOf('day').toISOString(), origin: 'today' };
    }

    /**
     * The units the backend publishes per measurement type, keyed by type.
     *
     * NOTE the unit ids must come from here rather than from the local `MEASUREMENT_UNIT_IDS`
     * constant, which turned out not to match the database: posting its `POUNDS` for weight is
     * rejected with `MEASUREMENT_IS_NOT_CORRECT`. Fetched once per import run and reused for
     * every type.
     */
    private async fetchBackendUnits (): Promise<Record<string, BackendUnit[]>> {
        // NOTE `dateTime` is deliberately the start of the day, not `now`: RTK Query keys its
        // cache on the arguments, so a per-second timestamp would miss the cache on every
        // foreground and refetch the same unit list each time.
        const request = store.dispatch(
            dayOverviewApi.endpoints.getMeasurementTypes.initiate({
                period: '1-year',
                dateTime: dayjs().startOf('day').format(),
            })
        );

        try {
            const response = await request.unwrap();
            const entries = Array.isArray(response) ? response : [];
            return entries.reduce<Record<string, BackendUnit[]>>((acc, entry) => {
                const measurement = (entry as { measurement?: { type?: string; units?: BackendUnit[] } })?.measurement;
                if (measurement?.type && Array.isArray(measurement.units)) {
                    acc[measurement.type] = measurement.units;
                }
                return acc;
            }, {});
        } catch (error) {
            this.log('Could not read measurement units from the backend', error);
            return {};
        } finally {
            // NOTE `initiate` opens a subscription that keeps the cache entry alive forever
            // unless it is released. This runs outside React, so nothing else will do it.
            request.unsubscribe();
        }
    }

    private async importType (
        type: MeasurementType,
        watermarks: Watermarks,
        backendUnits: Record<string, BackendUnit[]>,
    ): Promise<ImportReport> {
        const watermark = watermarks[type];
        const window = await this.resolveWindowStart(type, watermark);
        const samples: HealthSample[] = await healthService.fetchSamples(type, {
            startDate: window.startDate,
            endDate: dayjs().toISOString(),
        });

        const fresh = filterNewSamples(samples, watermark);
        if (!fresh.length) {
            return { outcome: 'nothing-new', fetched: samples.length, fresh: 0, window };
        }

        const unitIds = resolveImportUnitIds(type, backendUnits[type] || []);
        if (!unitIds) {
            // NOTE do not guess. A measurement filed under the wrong unit puts a wrong number
            // in the patient's record, which is worse than not importing it — and the
            // watermark stays put, so it will be retried once the units are known.
            return {
                window,
                fresh: fresh.length,
                fetched: samples.length,
                outcome: 'no-matching-unit',
                availableUnits: (backendUnits[type] || []).map(unit => unit.name),
            };
        }

        const payload = buildHealthAppPayload(
            type,
            fresh,
            SOURCE,
            unitIds,
        );

        const request = store.dispatch(
            dayOverviewApi.endpoints.addMeasurementRecord.initiate({ type, payload })
        );

        try {
            await request.unwrap();
        } finally {
            // NOTE mutations started with `initiate` keep their result in the store until
            // released, and there is no component here to do it on unmount.
            request.reset();
        }

        // NOTE only after the POST succeeded — otherwise a failed request would move the
        // watermark past samples that never reached the record.
        // NOTE without a usable date there is no watermark to advance, and the same samples
        // would be re-sent on every launch — which is exactly how the blood-pressure loop was
        // spotted. Report it instead of failing quietly.
        const newest = getNewestSampleDate(fresh);
        if (!newest) {
            return {
                window,
                fresh: fresh.length,
                fetched: samples.length,
                outcome: 'imported',
                watermarkAdvanced: false,
            };
        }

        await this.setWatermark(type, newest);
        return {
            window,
            fresh: fresh.length,
            fetched: samples.length,
            outcome: 'imported',
            watermarkAdvanced: true,
        };
    }

    /**
     * Import every supported type. One type failing must not stop the others, and nothing
     * here is surfaced to the patient: a missed import costs data freshness, not access.
     * Sample values are never logged — they are PHI.
     */
    public async runImport (options?: { force?: boolean }): Promise<void> {
        if (this.isRunning) { return; }

        const now = Date.now();
        const isThrottled = !options?.force
            && this.lastRunAt !== null
            && now - this.lastRunAt < MIN_INTERVAL_MS;
        if (isThrottled) { return; }

        if (!(await this.isEnabled())) { return; }
        if (!(await this.isAvailable())) {
            this.log('Health app not available on this device — skipping import');
            return;
        }

        this.isRunning = true;
        this.lastRunAt = now;

        try {
            const [watermarks, backendUnits] = await Promise.all([
                this.getWatermarks(),
                this.fetchBackendUnits(),
            ]);
            for (const type of IMPORTED_MEASUREMENT_TYPES) {
                // NOTE one line per type, always, with the outcome in it — including failures.
                // Values are never logged (PHI); counts, the window's origin and the outcome are
                // what actually explain a run. A previous version only logged successes, which
                // made a re-sending loop look like normal operation.
                try {
                    const report = await this.importType(type, watermarks, backendUnits);
                    this.log(`Import ${type}`, report);
                } catch (error) {
                    this.log(`Import ${type}`, { outcome: 'failed', error });
                }
            }
        } finally {
            this.isRunning = false;
        }
    }
}

export const healthSyncService = new HealthSyncService();
export default healthSyncService;
