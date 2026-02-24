// outsource dependencies
import { useCallback, useState } from 'react';
// local dependencies
import type { PhaseItem } from 'types/overview';
import { MessageService } from 'services/messages/service';
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

export interface MeasurementItem {
    id: number | string;
    type: string;
    status: string;
    phaseId?: number | string;
    measurement: {
        id: number;
        name: string;
        description?: string;
        coverImage?: { url?: string };
        category?: {
            id: number;
            name: string;
            editable: boolean;
        };
        type?: string;
        units?: Array<{
            id: number;
            name: string;
            unitType?: string;
            symbol?: string;
        }>;
        numeric?: boolean;
        applicableTo?: ['FEMALE', 'MALE'];
        order?: number;
        status?: string;
        video?: {
            id: number | string;
            embedUrl?: string;
            status?: string;
            user?: {
                id: number;
            };
            category?: null | object;
            title?: null | string;
            subject?: null | string;
            description?: null | string;
            mimeType?: string;
            fileName?: null | string;
            contentLength?: null | number;
            timestamp?: string;
            medicalTerm?: null | object;
            foodCategory?: null | object;
        };
    };
}

export const useMeasurementSubmit = (
    item: MeasurementItem,
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
                const units = item.measurement?.units || [];
                const selectedUnit = units.find(unit => unit.name === unitName);
                const defaultUnitId = selectedUnit?.id || units[0]?.id;

                const systolicUnitId = units.find(unit => unit.unitType === 'SYSTOLIC')?.id;
                const diastolicUnitId = units.find(unit => unit.unitType === 'DIASTOLIC')?.id;

                if (!measurementType) {
                    throw new Error('Measurement type is required');
                }
                const payload = buildMeasurementPayload(
                    measurementType,
                    values,
                    source,
                    {
                        defaultUnitId,
                        systolicUnitId,
                        diastolicUnitId,
                    },
                );
                await addMeasurementRecord({
                    type: measurementType,
                    payload,
                }).unwrap();
                await updatePhaseItem({
                    id: item.id,
                    phaseId: item.phaseId ?? 0,
                    data: {
                        ...item,
                        status: 'DONE',
                    } as Partial<PhaseItem>,
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
