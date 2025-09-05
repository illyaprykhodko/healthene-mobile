import { ExerciseFieldType, ExerciseType } from 'types';
import { formatDecimalValue } from './decimal-utils';

export interface ExerciseStep {
    id: number | string;
    order?: number;
    completed?: boolean;
    modified?: boolean;
    image?: { url?: string } | null;
    video?: { id?: number | string; title?: string; description?: string; embedUrl?: string; mimeType?: string } | null;
    instruction?: string | null;
    // optional fields used per exercise type
    reps?: number; seconds?: number; minutes?: number; hours?: number;
    miles?: number; steps?: number; weight?: number; velocity?: number;
    elevation?: number; resistance?: number;
    [k: string]: any;
}

export interface ExerciseConfig {
    apiEndpoint: string;
    [subtype: string]: any;
}

export const EXERCISE_CONFIGS: Record<string, any> = {
    [ExerciseType.STRETCHING]: {
        apiEndpoint: '/patient-service/day-overview-stretching-exercises',
        DEFAULT: {
            DEFAULT: {
                goalFields: [ExerciseFieldType.REPS, ExerciseFieldType.SECONDS],
                extraFields: [],
                renderGoal: (item: ExerciseStep) => `${item.reps ?? 0} Reps x ${item.seconds ?? 0} Seconds`,
                renderExtra: () => [],
            },
        },
    },
    [ExerciseType.AEROBIC]: {
        apiEndpoint: '/patient-service/day-overview-aerobic-exercises',
        CYCLING: {
            TIME: {
                goalFields: [ExerciseFieldType.HOURS, ExerciseFieldType.MINUTES],
                extraFields: [],
                renderGoal: (item: ExerciseStep) => `${item.hours ?? 0} hrs x ${item.minutes ?? 0} min`,
                renderExtra: () => [],
            },
            DISTANCE: {
                goalFields: [ExerciseFieldType.MILES],
                extraFields: [],
                renderGoal: (item: ExerciseStep) => `${item.miles ?? 0} miles`,
                renderExtra: () => [],
            },
        },
        RUNNING: {
            TIME: {
                goalFields: [ExerciseFieldType.HOURS, ExerciseFieldType.MINUTES],
                extraFields: [],
                renderGoal: (item: ExerciseStep) => `${item.hours ?? 0} hrs x ${item.minutes ?? 0} min`,
                renderExtra: () => [],
            },
            DISTANCE: {
                goalFields: [ExerciseFieldType.MILES],
                extraFields: [],
                renderGoal: (item: ExerciseStep) => `${item.miles ?? 0} miles`,
                renderExtra: () => [],
            },
        },
        WALKING: {
            STEPS: {
                goalFields: [ExerciseFieldType.STEPS],
                extraFields: [],
                renderGoal: (item: ExerciseStep) => `${item.steps ?? 0} steps`,
                renderExtra: () => [],
            },
            TIME: {
                goalFields: [ExerciseFieldType.HOURS, ExerciseFieldType.MINUTES],
                extraFields: [],
                renderGoal: (item: ExerciseStep) => `${item.hours ?? 0} hrs x ${item.minutes ?? 0} min`,
                renderExtra: () => [],
            },
            DISTANCE: {
                goalFields: [ExerciseFieldType.MILES],
                extraFields: [],
                renderGoal: (item: ExerciseStep) => `${item.miles ?? 0} miles`,
                renderExtra: () => [],
            },
        },
        TREADMILL: {
            TIME: {
                goalFields: [ExerciseFieldType.HOURS, ExerciseFieldType.MINUTES],
                extraFields: [ExerciseFieldType.VELOCITY, ExerciseFieldType.ELEVATION],
                renderGoal: (item: ExerciseStep) => `${item.hours ?? 0} hrs x ${item.minutes ?? 0} min`,
                renderExtra: (item: ExerciseStep) => [
                    item.velocity ? `Velocity = ${formatDecimalValue(item.velocity)}` : null,
                    item.elevation ? `Elevation = ${formatDecimalValue(item.elevation)}` : null,
                ].filter(Boolean),
            },
            DISTANCE: {
                goalFields: [ExerciseFieldType.MILES],
                extraFields: [ExerciseFieldType.VELOCITY, ExerciseFieldType.ELEVATION],
                renderGoal: (item: ExerciseStep) => `${item.miles ?? 0} miles`,
                renderExtra: (item: ExerciseStep) => [
                    item.velocity ? `Velocity = ${formatDecimalValue(item.velocity)}` : null,
                    item.elevation ? `Elevation = ${formatDecimalValue(item.elevation)}` : null,
                ].filter(Boolean),
            },
        },
        BIKING: {
            TIME: {
                goalFields: [ExerciseFieldType.HOURS, ExerciseFieldType.MINUTES],
                extraFields: [ExerciseFieldType.RESISTANCE],
                renderGoal: (item: ExerciseStep) => `${item.hours ?? 0} hrs x ${item.minutes ?? 0} min`,
                renderExtra: (item: ExerciseStep) => [item.resistance ? `Resistance = ${formatDecimalValue(item.resistance)}` : null].filter(Boolean),
            },
            DISTANCE: {
                goalFields: [ExerciseFieldType.MILES],
                extraFields: [ExerciseFieldType.RESISTANCE],
                renderGoal: (item: ExerciseStep) => `${item.miles ?? 0} miles`,
                renderExtra: (item: ExerciseStep) => [item.resistance ? `Resistance = ${formatDecimalValue(item.resistance)}` : null].filter(Boolean),
            },
        },
    },
    [ExerciseType.RESISTANCE]: {
        apiEndpoint: '/patient-service/day-overview-resistance-exercises',
        DEFAULT: {
            DEFAULT: {
                goalFields: [ExerciseFieldType.REPS, ExerciseFieldType.WEIGHT],
                extraFields: [],
                renderGoal: (item: ExerciseStep) => (item?.weight ? `${item.reps ?? 0} Reps x ${item.weight ?? 0} lbs` : `${item.reps ?? 0} Reps`),
                renderExtra: () => [],
            },
        },
    },
};

export const createExerciseAPI = (exerciseType: ExerciseType) => {
    const config = EXERCISE_CONFIGS[exerciseType];
    if (!config) { throw new Error(`Unsupported exercise type: ${exerciseType}`); }
    return {
        getData: (id: number | string) => ({ method: 'GET', url: `${config.apiEndpoint}/${id}` }),
        updateSteps: (data: any) => ({ method: 'PUT', url: `${config.apiEndpoint}/steps`, data }),
        config,
    };
};

