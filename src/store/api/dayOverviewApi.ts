import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from './baseApi';

export interface Phase {
    type: string;
    name?: string;
    items?: any[];
    order?: number;
    status?: string;
    id: number | string;
    meal?: { name: string };
    measurement?: { measurement: { name: string } };
}

export interface DayOverviewResponse {
    date: string;
    phases: Phase[];
    anytime?: Phase;
    patient?: Phase;
    id: number | string;
    currentWeekIncompleteDays?: Array<{ date: string }>;
}

export interface Question {
    questions: any[];
    id: string | number;
}

export const dayOverviewApi = createApi({
    reducerPath: 'dayOverviewApi',
    baseQuery,
    tagTypes: ['DayOverview', 'Questions', 'Anytime'],
    endpoints: builder => ({
        getQuestions: builder.query<Question, string>({
            query: date => `/patient-service/patient/me/disease-questions/${date}`,
            providesTags: ['Questions'],
        }),
        getDayOverview: builder.query<DayOverviewResponse, string>({
            query: date => `/patient-service/patients/me/day-overview/${date}`,
            providesTags: (result, error, date) => [{ type: 'DayOverview', id: date }],
            transformResponse: (success: any): DayOverviewResponse => ({
                ...success,
                phases: (success?.phases || [])
                    .filter((item: Phase) => [
                        'MEAL', 'MEDICATION', 'SUPPLEMENT', 'MEASUREMENT', 'ADDED_BY_PATIENT', 'PHYSICAL_ACTIVITY',
                    ].includes(item.type))
                    .sort((a: Phase, b: Phase) => (a.order ?? 0) - (b.order ?? 0)),
                anytime: (success?.phases || []).find((i: Phase) => i.type === 'ANYTIME'),
                patient: (success?.phases || []).find((i: Phase) => i.type === 'ADDED_BY_PATIENT'),
            }),
        }),
        getPhaseItems: builder.query<Record<string, any[]>, number | string>({
            query: id => `/patient-service/patients/day-overview/phase/${id}/items`,
            providesTags: (result, error, id) => [{ type: 'Anytime', id }],
            transformResponse: (success: any[]) => {
                const grouped: Record<string, any[]> = {};
                (success || []).forEach(item => {
                    const key = item.type || 'UNKNOWN';
                    if (!grouped[key]) { grouped[key] = []; }
                    grouped[key].push(item);
                });
                return grouped;
            },
        }),
    }),
});

export const {
    useGetDayOverviewQuery,
    useGetQuestionsQuery,
    useGetPhaseItemsQuery,
} = dayOverviewApi;
