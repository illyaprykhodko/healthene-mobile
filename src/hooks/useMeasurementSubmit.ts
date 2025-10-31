/**
 * useMeasurementSubmit Hook
 * Handles measurement submission logic:
 * 1. Build payload
 * 2. Submit to backend
 * 3. Update phase item status to DONE
 * 4. Handle optimistic updates and errors
 */
// outsource dependencies
import { useCallback, useState } from 'react';
// local dependencies
import { MessageService } from 'services/messages/service';
import type { AnytimeMeasurementItem } from 'types/anytime';
import { buildMeasurementPayload } from 'utils/measurement';
import type { MeasurementType, MeasurementSource, HealthSample } from 'types/health';
import {
    useAddMeasurementRecordMutation,
    useUpdatePhaseItemMutation,
} from 'store/api/dayOverviewApi';

export interface UseMeasurementSubmitOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export interface UseMeasurementSubmitReturn {
  submit: (
    values: Record<string, any> | HealthSample[],
    source: MeasurementSource,
    unitName?: string
  ) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
}

/**
 * Hook for submitting measurements
 */
export const useMeasurementSubmit = (
    item: AnytimeMeasurementItem,
    options?: UseMeasurementSubmitOptions
): UseMeasurementSubmitReturn => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [addMeasurementRecord] = useAddMeasurementRecordMutation();
    const [updatePhaseItem] = useUpdatePhaseItemMutation();

    const submit = useCallback(
        async (
            values: Record<string, any> | HealthSample[],
            source: MeasurementSource,
            unitName?: string
        ) => {
            setIsSubmitting(true);
            setError(null);

            try {
                const measurementType = item.measurement?.type as MeasurementType;

                if (!measurementType) {
                    throw new Error('Measurement type is required');
                }

                // Step 1: Build payload
                const payload = buildMeasurementPayload(
                    measurementType,
                    values,
                    source,
                    unitName
                );
                // Step 2: Submit measurement to backend
                await addMeasurementRecord({
                    type: measurementType,
                    payload,
                }).unwrap();
                // Step 3: Update phase item status to DONE
                await updatePhaseItem({
                    id: item.id,
                    phaseId: item.phaseId!,
                    data: {
                        ...item,
                        status: 'DONE',
                    },
                }).unwrap();
                // Show success message
                MessageService.toastSuccess('Measurement successfully saved');

                // Success callback
                if (options?.onSuccess) {
                    options.onSuccess();
                }
            } catch (error: any) {
                const errorMessage = error?.message || 'Failed to submit measurement';
                console.error('[useMeasurementSubmit] Error:', error);
                setError(errorMessage);

                // Show error message
                MessageService.error({
                    message: errorMessage,
                    title: 'Measurement Error',
                    uid: 'measurement-submit-error',
                });

                // Error callback
                if (options?.onError) {
                    options.onError(error);
                }

                throw error; // Re-throw for Formik error handling
            } finally {
                setIsSubmitting(false);
            }
        },
        [item, addMeasurementRecord, updatePhaseItem, options]
    );

    return {
        error,
        submit,
        isSubmitting,
    };
};
