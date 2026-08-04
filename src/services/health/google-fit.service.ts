/**
 * Google Fit Service
 * Modern functional wrapper around react-native-google-fit
 */
// outsource dependencies
import dayjs from 'services/date';
import RNGoogleFit, { Scopes } from 'react-native-google-fit';
// local dependencies
import type {
    DateRange,
    HealthSample,
    IHealthService,
    MeasurementType,
    BloodPressureValue,
} from 'types/health';
import { filters } from 'services/filter';

const SCOPES = {
    scopes: [
        Scopes.FITNESS_BODY_READ,
        Scopes.FITNESS_BODY_WRITE,
        Scopes.FITNESS_BLOOD_PRESSURE_READ,
        Scopes.FITNESS_BLOOD_PRESSURE_WRITE,
        Scopes.FITNESS_BLOOD_GLUCOSE_READ,
        Scopes.FITNESS_BLOOD_GLUCOSE_WRITE,
        Scopes.FITNESS_ACTIVITY_READ,
    ],
};

/**
 * Check if Google Fit is available on this device
 */
const isAvailable = (): Promise<boolean> => {
    return new Promise(resolve => {
        RNGoogleFit.isAvailable((msg, result) => {
            // console.log('[GoogleFit] isAvailable:', result);
            resolve(result);
        });
    });
};

/**
 * Request Google Fit authorization
 */
const requestPermissions = async (): Promise<boolean> => {
    try {
        const authResult = await RNGoogleFit.authorize(SCOPES);
        if (authResult.success) {
            // console.log('[GoogleFit] Authorization successful');
            return true;
        }
        // authResult.success === false
        const errorMessage = 'message' in authResult ? authResult.message : 'Authorization failed';
        // console.warn('[GoogleFit] Authorization failed:', errorMessage);
        return false;
    } catch (error) {
        // console.error('[GoogleFit] Authorization error:', error);
        return false;
    }
};

/**
 * Fetch weight samples
 */
const fetchWeightSamples = async (options: {
    startDate: string;
    endDate: string;
}): Promise<HealthSample[]> => {
    try {
        const results = await RNGoogleFit.getWeightSamples(options as any);

        const samples: HealthSample[] = (results || []).map((item: any) => ({
            value: item.value,
            source: 'GOOGLE_FIT' as const,
            endDate: item.endDate || item.day,
            startDate: item.startDate || item.day,
        }));

        return samples;
    } catch (error) {
        // console.error('[GoogleFit] getWeightSamples error:', error);
        return [];
    }
};

/**
 * Fetch blood pressure samples
 */
const fetchBloodPressureSamples = async (options: {
    startDate: string;
    endDate: string;
}): Promise<HealthSample[]> => {
    try {
        const results = await RNGoogleFit.getBloodPressureSamples(options as any);

        const samples: HealthSample[] = (results || []).map((item: any) => ({
            value: {
                systolic: item.systolic,
                diastolic: item.diastolic,
            } as BloodPressureValue,
            source: 'GOOGLE_FIT' as const,
            endDate: item.endDate || dayjs().format(),
            startDate: item.startDate || dayjs().format(),
        }));

        return samples;
    } catch (error) {
        // console.error('[GoogleFit] getBloodPressureSamples error:', error);
        return [];
    }
};

/**
 * Fetch blood glucose samples, normalised to mg/dL
 *
 * NOTE the unit was ambiguous here: the old comment claimed the library returns mg/dL,
 * while `convertBloodGlucose` multiplies by 18.0182, which is mmol/L → mg/dL. Google Fit
 * stores blood glucose in mmol/L (`TYPE_BLOOD_GLUCOSE`), so we now ask for mmol/L
 * explicitly and convert once — that way both the "library honours the unit" and the
 * "library ignores it" case yield mg/dL, matching `MEASUREMENT_UNIT_IDS.MG_DL` and the
 * iOS side. Still worth confirming against a known reading in Google Fit on a device.
 */
const fetchBloodGlucoseSamples = async (options: {
    startDate: string;
    endDate: string;
}): Promise<HealthSample[]> => {
    try {
        const results = await RNGoogleFit.getBloodGlucoseSamples({ ...options, unit: 'mmol/L' } as any);

        const samples: HealthSample[] = (results || []).map((item: any) => ({
            value: filters.convertBloodGlucose(item.value), // mmol/L → mg/dL
            startDate: item.startDate || dayjs().format(),
            endDate: item.endDate || dayjs().format(),
            source: 'GOOGLE_FIT' as const,
        }));

        return samples;
    } catch (error) {
        console.error('[GoogleFit] getBloodGlucoseSamples error:', error);
        return [];
    }
};

/**
 * Fetch step count samples
 */
const fetchStepCountSamples = async (options: {
    startDate: string;
    endDate: string;
}): Promise<HealthSample[]> => {
    try {
        const results = await RNGoogleFit.getDailyStepCountSamples(options as any);

        // GoogleFit returns multiple sources, filter for Google Fit source
        const googleFitSource = (results || []).find(
            (source: any) => source.source === 'com.google.android.gms:estimated_steps'
        );

        if (!googleFitSource || !googleFitSource.steps?.length) {
            return [];
        }

        // Sum all steps for the period
        const totalSteps = googleFitSource.steps.reduce(
            (sum: number, step: any) => sum + (step.value || 0),
            0
        );

        return [
            {
                value: totalSteps,
                endDate: options.endDate,
                startDate: options.startDate,
                source: 'GOOGLE_FIT' as const,
            },
        ];
    } catch (error) {
        console.error('[GoogleFit] getStepCount error:', error);
        return [];
    }
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
            console.warn(`[GoogleFit] Unsupported type: ${type}`);
            return [];
    }
};

/**
 * Google Fit Service (functional API)
 */
const GoogleFitService: IHealthService = {
    isAvailable,
    fetchSamples,
    requestPermissions,
};

export default GoogleFitService;
