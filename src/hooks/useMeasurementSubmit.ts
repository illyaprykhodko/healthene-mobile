// outsource dependencies
import { useCallback, useState } from 'react';
// local dependencies
import { MessageService } from 'services/messages/service';
import { buildMeasurementPayload } from 'utils/measurement';
import type { MeasurementType, MeasurementSource, HealthSample } from 'types/health';
import {
    useAddMeasurementRecordMutation,
    useUpdatePhaseItemMutation,
} from 'store/api/dayOverviewApi';
import { PhaseItem } from 'types/overview';

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

export const useMeasurementSubmit = (
    item: PhaseItem,
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
                const unitId = item.measurement?.units?.[0]?.id;
                if (!measurementType) {
                    throw new Error('Measurement type is required');
                }
                const payload = buildMeasurementPayload(
                    measurementType,
                    values,
                    source,
                    unitId,
                );
                await addMeasurementRecord({
                    type: measurementType,
                    payload,
                }).unwrap();
                await updatePhaseItem({
                    id: item.id,
                    phaseId: item.phase.id,
                    data: {
                        ...item,
                        status: 'DONE',
                    },
                }).unwrap();
                MessageService.toastSuccess('Measurement successfully saved');
                if (options?.onSuccess) {
                    options.onSuccess();
                }
            } catch (error: any) {
                const errorMessage = error?.message || 'Failed to submit measurement';
                console.error('[useMeasurementSubmit] Error:', error);
                setError(errorMessage);
                MessageService.error({
                    message: errorMessage,
                    title: 'Measurement Error',
                    uid: 'measurement-submit-error',
                });
                if (options?.onError) {
                    options.onError(error);
                }

                throw error;
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
