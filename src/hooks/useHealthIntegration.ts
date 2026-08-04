/**
 * useHealthIntegration Hook
 * Platform-aware hook for Apple Health / Google Fit integration
 */
// outsource dependencies
import dayjs from 'services/date';
import { Platform } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
// local dependencies
import { AppleHealthService, GoogleFitService } from 'services/health';
import type { MeasurementType, HealthSample, DateRange } from 'types/health';

export interface UseHealthIntegrationReturn {
  isLoading: boolean;
  isAvailable: boolean;
  error: string | null;
  hasPermissions: boolean;
  requestPermissions: () => Promise<boolean>;
  fetchTodaySamples: (type: MeasurementType) => Promise<HealthSample[]>;
  fetchLatestSample: (type: MeasurementType) => Promise<HealthSample | null>;
}

/**
 * Hook for health app integration (iOS HealthKit / Android Google Fit)
 */
export const useHealthIntegration = (): UseHealthIntegrationReturn => {
    const [isAvailable, setIsAvailable] = useState(false);
    const [hasPermissions, setHasPermissions] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Get the appropriate service based on platform
    const service = Platform.OS === 'ios' ? AppleHealthService : GoogleFitService;
    const serviceName = Platform.OS === 'ios' ? 'Apple Health' : 'Google Fit';

    /**
   * Initialize: check availability only.
   *
   * NOTE deliberately does NOT request permissions. It used to, "silently", but
   * `initHealthKit` puts the system Health sheet on screen — so merely mounting this hook
   * prompted the patient out of nowhere. Permissions are asked for through the returned
   * `requestPermissions`, i.e. only when the patient turns health sync on.
   */
    useEffect(() => {
        const initialize = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const available = await service.isAvailable();
                setIsAvailable(available);
            } catch (error) {
                console.error(`[useHealthIntegration] ${serviceName} init error:`, error);
                setError(`Failed to initialize ${serviceName}`);
            } finally {
                setIsLoading(false);
            }
        };

        initialize();
    }, []);

    /**
   * Request permissions explicitly (user-triggered)
   */
    const requestPermissions = useCallback(async (): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            const granted = await service.requestPermissions();
            setHasPermissions(granted);
            return granted;
        } catch (error) {
            console.error(`[useHealthIntegration] ${serviceName} permission error:`, error);
            setError(`Failed to get ${serviceName} permissions`);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
   * Fetch latest sample for a measurement type (today's data)
   */
    const fetchLatestSample = useCallback(
        async (type: MeasurementType): Promise<HealthSample | null> => {
            if (!isAvailable || !hasPermissions) {
                console.warn(`[useHealthIntegration] ${serviceName} not available or permissions denied`);
                return null;
            }

            setIsLoading(true);
            setError(null);

            try {
                const today = dayjs();
                const dateRange: DateRange = {
                    startDate: today.startOf('day').toISOString(),
                    endDate: today.endOf('day').toISOString(),
                };

                const samples = await service.fetchSamples(type, dateRange);

                // Return most recent sample
                if (samples.length > 0) {
                    return samples[samples.length - 1];
                }

                return null;
            } catch (error) {
                console.error('[useHealthIntegration] fetchLatestSample error:', error);
                setError(`Failed to fetch ${type} from ${serviceName}`);
                return null;
            } finally {
                setIsLoading(false);
            }
        },
        [isAvailable, hasPermissions]
    );

    /**
   * Fetch all samples for today
   */
    const fetchTodaySamples = useCallback(
        async (type: MeasurementType): Promise<HealthSample[]> => {
            if (!isAvailable || !hasPermissions) {
                console.warn(`[useHealthIntegration] ${serviceName} not available or permissions denied`);
                return [];
            }

            setIsLoading(true);
            setError(null);

            try {
                const today = dayjs();
                const dateRange: DateRange = {
                    startDate: today.startOf('day').toISOString(),
                    endDate: today.endOf('day').toISOString(),
                };

                const samples = await service.fetchSamples(type, dateRange);
                return samples;
            } catch (error) {
                console.error('[useHealthIntegration] fetchTodaySamples error:', error);
                setError(`Failed to fetch ${type} from ${serviceName}`);
                return [];
            } finally {
                setIsLoading(false);
            }
        },
        [isAvailable, hasPermissions]
    );

    return {
        error,
        isLoading,
        isAvailable,
        hasPermissions,
        fetchLatestSample,
        fetchTodaySamples,
        requestPermissions,
    };
};
