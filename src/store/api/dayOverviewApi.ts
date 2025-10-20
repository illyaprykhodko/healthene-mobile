// outsource dependencies
import { createApi } from '@reduxjs/toolkit/query/react';
// local dependencies
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
    anytimePhaseId?: number | string;
    currentWeekIncompleteDays?: Array<{ date: string }>;
}

export interface Question {
    questions: any[];
    id: string | number;
}

export interface PhaseItem {
    food?: any;
    type: string;
    recipe?: any;
    order?: number;
    status?: string;
    amount?: number;
    section?: string;
    measurement?: any;
    id: string | number;
    initialAmount?: number;
    modified?: boolean;
    weight?: {
        unit: {
            name: string;
        };
    };
    serving?: any;
    useServing?: boolean;
    patientFoodCategoryAttachment?: any;
    patientFoodCategoryQuestion?: any;
}

// Exercise
export type ExerciseStepsUpdate = ExerciseDataResponse[];
// export interface ExerciseStepsUpdate {
//     steps: any[];
// }

export interface ExerciseDataResponse {
    id: number | string;
    type: string; // ExerciseType
    image?: { url?: string };
    video?: any;
    instruction?: string;
    steps: any[];
}

export interface AvailableItem {
    name: string;
    type: string;
    image?: string;
    id: string | number;
    description?: string;
    coverImage?: {
        url?: string;
    };
}

export interface ReplaceItemRequest {
    itemId: number | string;
    phaseId: number | string;
    replacementItem: {
        id: number | string;
        type: string;
        name: string;
    };
}

// Filter interfaces based on swagger.json
export interface CategoryNodeFilter {
    name?: string;
    parentId?: number | null;
    systemTag?: 'PATIENT_DRINK' | 'PATIENT_FOOD';
    treeTypeViewLabel?: 'PATIENT_NAVIGATION';
    parentDoesNotHaveSystemTag?: 'PATIENT_DRINK' | 'PATIENT_FOOD';
    excludeIds?: number[];
    includeIds?: number[];
    hasParent?: boolean;
    defaultForImportCategory?: boolean;
    prefixName?: string;
    treeTypeId?: number;
}

export interface RecipePrototypeCatalogFilter {
    name?: string;
    parentId?: number;
    restaurantCatalog?: boolean;
    hasParent?: boolean;
    excludeIds?: number[];
    includeIds?: number[];
    prefixName?: string;
}

export interface RecipePrototypeFilter {
    name?: string;
    catalogNodeId?: number;
    excludeIds?: number[];
    includeIds?: number[];
    prefixName?: string;
}

export interface FoodFilter {
    name?: string;
    nameFragment?: string;
    categoryNodeId?: number;
    isEnabled?: boolean;
    excludeIds?: number[];
    includeIds?: number[];
    prefixName?: string;
    tagIds?: number[];
    treeTypeId?: number;
    treeTypeViewLabel?: 'PATIENT_NAVIGATION';
    upc?: string;
    onlyNodeId?: number;
    foodPatientPlanFilter?: any;
    foodPlanFilter?: any;
}

export const dayOverviewApi = createApi({
  reducerPath: 'dayOverviewApi',
  baseQuery,
  tagTypes: ['DayOverview', 'Questions', 'Anytime', 'PhaseItems', 'PhaseItem', 'AvailableItems'],
  endpoints: builder => ({
    getQuestions: builder.query<Question, string>({
      query: date => `/patient-service/patient/me/disease-questions/${date}`,
      providesTags: ['Questions'],
    }),

    getDayOverview: builder.query<DayOverviewResponse, string>({
      query: date => `/patient-service/patients/me/day-overview/${date}`,
      providesTags: (result, error, date) => [{ type: 'DayOverview', id: date }],
      transformResponse: (success: any): DayOverviewResponse => {
        const anytimePhase = (success?.phases || []).find((i: Phase) => i.type === 'ANYTIME');
        return {
          ...success,
          phases: (success?.phases || [])
            .filter((item: Phase) =>
              [
                'MEAL',
                'ANYTIME',
                'QUESTION',
                'MEDICATION',
                'SUPPLEMENT',
                'MEASUREMENT',
                'ADDED_BY_PATIENT',
                'PHYSICAL_ACTIVITY',
              ].includes(item.type)
            )
            .sort((a: Phase, b: Phase) => (a.order ?? 0) - (b.order ?? 0)),
          anytime: anytimePhase,
          patient: (success?.phases || []).find((i: Phase) => i.type === 'ADDED_BY_PATIENT'),
          anytimePhaseId: anytimePhase?.id,
        };
      },
    }),

    getPhaseItems: builder.query<Record<string, any[]>, number | string>({
      query: id => `/patient-service/patients/day-overview/phase/${id}/items`,
      providesTags: (result, error, phaseId) => [
        { type: 'PhaseItems', id: phaseId },
        ...(result
          ? Object.values(result).flat().map((i: any) => ({ type: 'PhaseItem' as const, id: i.id }))
          : []),
      ],
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

    getCategoryTreeNodes: builder.query<any, { filter: CategoryNodeFilter; page?: number; size?: number; sort?: string }>({
      query: ({ filter, page = 0, size = 10, sort = 'name,ASC' }) => ({
        url: '/patient-service/category-tree/nodes/filter',
        method: 'POST',
        body: filter,
        params: { page, size /* sort */ },
      }),
      providesTags: ['AvailableItems'],
    }),

    getCatalogPrototypeTreeNodes: builder.query<any, { filter: RecipePrototypeCatalogFilter; page?: number; size?: number; sort?: string }>({
      query: ({ filter, page = 0, size = 10, sort = 'name,ASC' }) => ({
        url: '/patient-service/catalog-prototype-tree/nodes/filter',
        method: 'POST',
        body: filter,
        params: { page, size, sort },
      }),
      providesTags: ['AvailableItems'],
    }),

    getRecipePrototypes: builder.query<any, { filter: RecipePrototypeFilter; page?: number; size?: number; sort?: string }>({
      query: ({ filter, page = 0, size = 10, sort = 'name,ASC' }) => ({
        url: '/patient-service/recipe-prototypes/filter',
        method: 'POST',
        body: filter,
        params: { page, size, sort },
      }),
      providesTags: ['AvailableItems'],
    }),

    getFoods: builder.query<any, { filter: FoodFilter; page?: number; size?: number; sort?: string }>({
      query: ({ filter, page = 0, size = 10, sort = 'name,ASC' }) => ({
        url: '/patient-service/foods/filter',
        method: 'POST',
        body: filter,
        params: { page, size, sort },
      }),
      providesTags: ['AvailableItems'],
    }),

    getPhaseItem: builder.query<PhaseItem, number | string>({
      query: id => `/patient-service/patients/day-overview/phase/item/${id}`,
      providesTags: (result, error, id) => [{ type: 'PhaseItem', id }],
    }),

    updatePhaseItem: builder.mutation<
        PhaseItem,
        { id: number | string; phaseId: number | string; data: Partial<PhaseItem>; date?: string }
      >({
        query: ({ id, data }) => ({
          url: `/patient-service/patients/day-overview/phase/item/${id}`,
          method: 'PUT',
          body: data,
        }),
        invalidatesTags: (result, error, { id, phaseId }) => [
          { type: 'PhaseItem', id },
          { type: 'PhaseItems', id: phaseId },
          'DayOverview',
        ],
        async onQueryStarted ({ id, phaseId, data, date }, { dispatch, queryFulfilled }) {
          const patch = dispatch(
            dayOverviewApi.util.updateQueryData('getPhaseItems', phaseId, (draft: Record<string, any[]>) => {
              for (const arr of Object.values(draft) as any[][]) {
                const found = arr.find(x => x.id === id);
                if (found) {
                  Object.assign(found, data);
                  arr.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
                  break;
                }
              }
            })
          );

          // Optimistically update DayOverview cache if we know the date
          let dayOverviewPatched: any | null = null;
          if (date) {
            try {
              dayOverviewPatched = dispatch(
                dayOverviewApi.util.updateQueryData('getDayOverview', date, (draft: any) => {
                  if (!draft?.phases) { return; }
                  for (const phase of draft.phases) {
                    if (Array.isArray(phase.items)) {
                      const item = (phase.items as any[]).find(x => x.id === id);
                      if (item) {
                        Object.assign(item, data);
                        break;
                      }
                    }
                  }
                })
              );
            } catch {
              /* ignore */
            }
          }
          try {
            await queryFulfilled;
          } catch {
            patch.undo();
            if (dayOverviewPatched) { dayOverviewPatched.undo(); }
          }
        },
      }),

    deletePhaseItem: builder.mutation<void, { id: number | string; phaseId: number | string }>({
      query: ({ id }) => ({
        url: `/patient-service/patients/day-overview/phase/item/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { id, phaseId }) => [
        { type: 'PhaseItem', id },
        { type: 'PhaseItems', id: phaseId },
      ],
      async onQueryStarted ({ id, phaseId }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          dayOverviewApi.util.updateQueryData('getPhaseItems', phaseId, (draft: Record<string, any[]>) => {
            for (const key of Object.keys(draft)) {
              const arr = draft[key];
              const idx = arr.findIndex(x => x.id === id);
              if (idx >= 0) {
                arr.splice(idx, 1);
                break;
              }
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),
    addPhaseItem: builder.mutation<PhaseItem, { phaseId: number | string; data: any }>({
      query: ({ phaseId, data }) => ({
        url: `/patient-service/patients/day-overview/phase/${phaseId}/items`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { phaseId }) => [{ type: 'PhaseItems', id: phaseId }],
      async onQueryStarted ({ phaseId }, { dispatch, queryFulfilled }) {
        try {
          const { data: created } = await queryFulfilled;
          dispatch(
            dayOverviewApi.util.updateQueryData('getPhaseItems', phaseId, (draft: Record<string, any[]>) => {
              const key = created?.type || 'UNKNOWN';
              if (!draft[key]) { draft[key] = []; }
              draft[key].push(created);
              draft[key].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            })
          );
        } catch (error) {
          console.error('error', error);
        }
      },
    }),
    replacePhaseItem: builder.mutation<PhaseItem, ReplaceItemRequest>({
      query: ({ itemId, replacementItem }) => ({
        url: `/patient-service/patients/day-overview/phase/item/${itemId}/replace`,
        method: 'PUT',
        body: replacementItem,
      }),
      invalidatesTags: (result, error, { itemId, phaseId }) => [
        { type: 'PhaseItem', id: itemId },
        { type: 'PhaseItems', id: phaseId },
      ],
      async onQueryStarted ({ itemId, phaseId }, { dispatch, queryFulfilled }) {
        try {
          const { data: replaced } = await queryFulfilled;
          dispatch(
            dayOverviewApi.util.updateQueryData('getPhaseItems', phaseId, (draft: Record<string, any[]>) => {
              let oldTypeKey: string | undefined;
              for (const key of Object.keys(draft)) {
                const arr = draft[key];
                const idx = arr.findIndex(x => x.id === itemId);
                if (idx >= 0) {
                  arr.splice(idx, 1);
                  oldTypeKey = key;
                  break;
                }
              }
              const newKey = replaced?.type || oldTypeKey || 'UNKNOWN';
              if (!draft[newKey]) { draft[newKey] = []; }
              draft[newKey].push(replaced);
              draft[newKey].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            })
          );
        } catch {
          /* ignore */
        }
      },
    }),

    updatePhase: builder.mutation<Phase, { id: number | string; data: any }>({
      query: ({ id, data }) => ({
        url: `/patient-service/patients/day-overview/phase/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'PhaseItems', id },
        'DayOverview',
      ],
    }),

    // Physical Activity detail for a phase item
    getPhysicalActivityItem: builder.query<any, number | string>({
      query: id => `/patient-service/patients/day-overview/phase/item/${id}`,
    }),

    // Exercise data by type
    getStretchingExercise: builder.query<ExerciseDataResponse, number | string>({
      query: id => `/patient-service/day-overview-stretching-exercises/${id}`,
    }),
    updateStretchingSteps: builder.mutation<any, ExerciseStepsUpdate>({
      query: body => ({ url: '/patient-service/day-overview-stretching-exercises/steps', method: 'PUT', body }),
    }),
    getAerobicExercise: builder.query<ExerciseDataResponse, number | string>({
      query: id => `/patient-service/day-overview-aerobic-exercises/${id}`,
    }),
    updateAerobicSteps: builder.mutation<any, ExerciseStepsUpdate>({
      query: body => ({ url: '/patient-service/day-overview-aerobic-exercises/steps', method: 'PUT', body }),
    }),
    getResistanceExercise: builder.query<ExerciseDataResponse, number | string>({
      query: id => `/patient-service/day-overview-resistance-exercises/${id}`,
    }),
    updateResistanceSteps: builder.mutation<any, ExerciseStepsUpdate>({
      query: body => ({ url: '/patient-service/day-overview-resistance-exercises/steps', method: 'PUT', body }),
    }),
  }),
});

// export const dayOverviewApi = createApi({
//     reducerPath: 'dayOverviewApi',
//     baseQuery,
//     tagTypes: ['DayOverview', 'Questions', 'Anytime', 'PhaseItems', 'AvailableItems'],
//     endpoints: builder => ({
//         getQuestions: builder.query<Question, string>({
//             query: date => `/patient-service/patient/me/disease-questions/${date}`,
//             providesTags: ['Questions'],
//         }),
//         getDayOverview: builder.query<DayOverviewResponse, string>({
//             query: date => `/patient-service/patients/me/day-overview/${date}`,
//             providesTags: (result, error, date) => [{ type: 'DayOverview', id: date }],
//             transformResponse: (success: any): DayOverviewResponse => ({
//                 ...success,
//                 phases: (success?.phases || [])
//                     .filter((item: Phase) => [
//                         'MEAL',
//                         'ANYTIME',
//                         'QUESTION',
//                         'MEDICATION',
//                         'SUPPLEMENT',
//                         'MEASUREMENT',
//                         'ADDED_BY_PATIENT',
//                         'PHYSICAL_ACTIVITY',
//                     ].includes(item.type))
//                     .sort((a: Phase, b: Phase) => (a.order ?? 0) - (b.order ?? 0)),
//                 anytime: (success?.phases || []).find((i: Phase) => i.type === 'ANYTIME'),
//                 patient: (success?.phases || []).find((i: Phase) => i.type === 'ADDED_BY_PATIENT'),
//             }),
//         }),
//         getPhaseItems: builder.query<Record<string, any[]>, number | string>({
//             query: id => `/patient-service/patients/day-overview/phase/${id}/items`,
//             providesTags: (result, error, id) => [{ type: 'PhaseItems', id }],
//             transformResponse: (success: any[]) => {
//                 const grouped: Record<string, any[]> = {};
//                 (success || []).forEach(item => {
//                     const key = item.type || 'UNKNOWN';
//                     if (!grouped[key]) { grouped[key] = []; }
//                     grouped[key].push(item);
//                 });
//                 return grouped;
//             },
//         }),
//         // Category tree nodes filter (for Food/Drink navigation)
//         getCategoryTreeNodes: builder.query<any, {
//             filter: CategoryNodeFilter;
//             page?: number;
//             size?: number;
//             sort?: string;
//         }>({
//             query: ({ filter, page = 0, size = 10, sort = 'name,ASC' }) => ({
//                 url: '/patient-service/category-tree/nodes/filter',
//                 method: 'POST',
//                 body: filter,
//                 params: {
//                     page,
//                     size,
//                     //   sort
//                 },
//             }),
//             providesTags: ['PhaseItems'],
//             // providesTags: ['AvailableItems'],
//         }),
//         // Catalog prototype tree nodes filter (for Recipes/Restaurants navigation)
//         getCatalogPrototypeTreeNodes: builder.query<any, {
//             filter: RecipePrototypeCatalogFilter;
//             page?: number;
//             size?: number;
//             sort?: string;
//         }>({
//             query: ({ filter, page = 0, size = 10, sort = 'name,ASC' }) => ({
//                 url: '/patient-service/catalog-prototype-tree/nodes/filter',
//                 method: 'POST',
//                 body: filter,
//                 params: { page, size, sort },
//             }),
//             providesTags: ['PhaseItems'],
//             // providesTags: ['AvailableItems'],
//         }),
//         // Recipe prototypes filter
//         getRecipePrototypes: builder.query<any, {
//             filter: RecipePrototypeFilter;
//             page?: number;
//             size?: number;
//             sort?: string;
//         }>({
//             query: ({ filter, page = 0, size = 10, sort = 'name,ASC' }) => ({
//                 // url: '/patient-service/catalog-prototype-tree/nodes/filter',
//                 url: '/patient-service/recipe-prototypes/filter',
//                 method: 'POST',
//                 body: filter,
//                 params: { page, size, sort },
//             }),
//             providesTags: ['PhaseItems'],
//             // providesTags: ['AvailableItems'],
//         }),
//         // Foods filter
//         getFoods: builder.query<any, {
//             filter: FoodFilter;
//             page?: number;
//             size?: number;
//             sort?: string;
//         }>({
//             query: ({ filter, page = 0, size = 10, sort = 'name,ASC' }) => ({
//                 url: '/patient-service/foods/filter',
//                 method: 'POST',
//                 body: filter,
//                 params: { page, size, sort },
//             }),
//             providesTags: ['PhaseItems'],
//             // providesTags: ['AvailableItems'],
//         }),
//         // getAvailableItems: builder.query<AvailableItem[], {
//         //     excludeIds?: string[];
//         //     entityType: string;
//         //     name?: string;
//         //     page?: number;
//         //     size?: number;
//         //     sort?: string;
//         //     categoryNodeId?: number;
//         //     catalogNodeId?: number;
//         //     restaurantCatalog?: boolean;
//         //     systemTag?: string;
//         //     treeTypeViewLabel?: string;
//         // }>({
//         //     query: ({
//         //         entityType,
//         //         excludeIds = [],
//         //         name,
//         //         page = 0,
//         //         size = 20,
//         //         sort = 'name,ASC',
//         //         categoryNodeId,
//         //         catalogNodeId,
//         //         restaurantCatalog,
//         //         systemTag,
//         //         treeTypeViewLabel
//         //     }) => {
//         //         const baseParams = { page, size, sort };

//         //         switch (entityType) {
//         //             case 'MEDICATION':
//         //                 return {
//         //                     url: '/patient-service/medications/filter',
//         //                     body: { name, excludeIds },
//         //                     params: baseParams,
//         //                     method: 'POST',
//         //                 };
//         //             case 'MEASUREMENT':
//         //                 return {
//         //                     url: '/patient-service/measurements/filter',
//         //                     body: { name, excludeIds },
//         //                     params: baseParams,
//         //                     method: 'POST',
//         //                 };
//         //             case 'SUPPLEMENT':
//         //                 return {
//         //                     url: '/patient-service/supplements/filter',
//         //                     body: { name, excludeIds },
//         //                     params: baseParams,
//         //                     method: 'POST',
//         //                 };
//         //             case 'PHYSICAL_ACTIVITY':
//         //                 return {
//         //                     url: '/patient-service/physical-activities/filter',
//         //                     body: { name, excludeIds },
//         //                     params: baseParams,
//         //                     method: 'POST',
//         //                 };
//         //             case 'INGREDIENT':
//         //                 return {
//         //                     url: '/patient-service/patient/day-overview/rescue/ingredient/list',
//         //                     body: { excludeIds, name, rescueIngredientId: null },
//         //                     method: 'POST',
//         //                 };
//         //             case 'FOOD':
//         //             case 'MEAL':
//         //                 return {
//         //                     url: '/patient-service/foods/filter',
//         //                     body: {
//         //                         name,
//         //                         nameFragment: name,
//         //                         excludeIds,
//         //                         categoryNodeId,
//         //                         isEnabled: true,
//         //                         treeTypeViewLabel: treeTypeViewLabel || 'PATIENT_NAVIGATION'
//         //                     },
//         //                     params: baseParams,
//         //                     method: 'POST',
//         //                 };
//         //             case 'RECIPE':
//         //                 return {
//         //                     url: '/patient-service/recipe-prototypes/filter',
//         //                     body: {
//         //                         name,
//         //                         excludeIds,
//         //                         catalogNodeId
//         //                     },
//         //                     params: baseParams,
//         //                     method: 'POST',
//         //                 };
//         //             case 'RESTAURANT':
//         //                 return {
//         //                     url: '/patient-service/recipe-prototypes/filter',
//         //                     body: {
//         //                         name,
//         //                         excludeIds,
//         //                         catalogNodeId,
//         //                         restaurantCatalog: true
//         //                     },
//         //                     params: baseParams,
//         //                     method: 'POST',
//         //                 };
//         //             default:
//         //                 return {
//         //                     url: '/patient-service/items/filter',
//         //                     body: { name, excludeIds },
//         //                     params: baseParams,
//         //                     method: 'POST',
//         //                 };
//         //         }
//         //     },
//         //     providesTags: ['AvailableItems'],
//         //     transformResponse: (success: any): AvailableItem[] => {
//         //         const items = success?.content || success || [];
//         //         return items.map((item: any) => ({
//         //             id: item.id,
//         //             name: item.name || item.nameWithUnit || 'Unknown',
//         //             type: item.type || item.entityType || 'UNKNOWN',
//         //             image: item.image || item.coverImage?.url || item.entity?.coverImage?.url,
//         //             description: item.description,
//         //             coverImage: item.coverImage || item.entity?.coverImage,
//         //         }));
//         //     },
//         // }),
//         getPhaseItem: builder.query<PhaseItem, number | string>({
//             query: id => `/patient-service/patients/day-overview/phase/item/${id}`,
//             providesTags: (result, error, id) => [{ type: 'PhaseItems', id }],
//         }),
//         updatePhaseItem: builder.mutation<PhaseItem, { id: number | string; data: any }>({
//             query: ({ id, data }) => ({
//                 url: `/patient-service/patients/day-overview/phase/item/${id}`,
//                 method: 'PUT',
//                 body: data,
//             }),
//             invalidatesTags: (result, error, { id }) => [
//                 { type: 'PhaseItems', id },
//                 'DayOverview',
//             ],
//         }),
//         deletePhaseItem: builder.mutation<void, number | string>({
//             query: id => ({
//                 url: `/patient-service/patients/day-overview/phase/item/${id}`,
//                 method: 'DELETE',
//             }),
//             invalidatesTags: (result, error, id) => [
//                 { type: 'PhaseItems', id },
//                 'DayOverview',
//             ],
//         }),
//         addPhaseItem: builder.mutation<PhaseItem, { phaseId: number | string; data: any }>({
//             query: ({ phaseId, data }) => ({
//                 url: `/patient-service/patients/day-overview/phase/${phaseId}/items`,
//                 method: 'POST',
//                 body: data,
//             }),
//             invalidatesTags: (result, error, { phaseId }) => [
//                 { type: 'PhaseItems', id: phaseId },
//                 'DayOverview',
//             ],
//         }),
//         replacePhaseItem: builder.mutation<PhaseItem, ReplaceItemRequest>({
//             query: ({ itemId, replacementItem }) => ({
//                 url: `/patient-service/patients/day-overview/phase/item/${itemId}/replace`,
//                 method: 'PUT',
//                 body: replacementItem,
//             }),
//             invalidatesTags: (result, error, { itemId }) => [
//                 { type: 'PhaseItems', id: itemId },
//                 'DayOverview',
//             ],
//         }),
//         updatePhase: builder.mutation<Phase, { id: number | string; data: any }>({
//             query: ({ id, data }) => ({
//                 url: `/patient-service/patients/day-overview/phase/${id}`,
//                 method: 'PUT',
//                 body: data,
//             }),
//             invalidatesTags: (result, error, { id }) => [
//                 { type: 'PhaseItems', id },
//                 'DayOverview',
//             ],
//         }),
//     }),
// });

export const {
  useGetPhaseItemQuery,
  useGetQuestionsQuery,
  useGetPhaseItemsQuery,
  useGetDayOverviewQuery,
  useUpdatePhaseMutation,
  useAddPhaseItemMutation,
  // useGetAvailableItemsQuery,
  useUpdatePhaseItemMutation,
  useDeletePhaseItemMutation,
  useReplacePhaseItemMutation,
  useGetCategoryTreeNodesQuery,
  useGetCatalogPrototypeTreeNodesQuery,
  useGetRecipePrototypesQuery,
  useGetFoodsQuery,
  useGetPhysicalActivityItemQuery,
  useGetStretchingExerciseQuery,
  useUpdateStretchingStepsMutation,
  useGetAerobicExerciseQuery,
  useUpdateAerobicStepsMutation,
  useGetResistanceExerciseQuery,
  useUpdateResistanceStepsMutation,
} = dayOverviewApi;
