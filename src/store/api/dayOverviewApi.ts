// outsource dependencies
import { createApi } from '@reduxjs/toolkit/query/react';
// local dependencies
import { baseQuery } from './baseApi';
import { MeasurementType } from 'types';
import {
    PhaseItem, PatientFoodCategoryQuestion, AddPhaseItemData
} from 'types/overview';

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

// export interface Question {
//     questions: any[];
//     id: string | number;
// }

// export interface PhaseItem {
//     food?: any;
//     type: string;
//     recipe?: any;
//     order?: number;
//     status?: string;
//     amount?: number;
//     section?: string;
//     measurement?: any;
//     modified?: boolean;
//     id: string | number;
//     initialAmount?: number;
//     /** Amount that has been consumed so far (client + server contract) */
//     consumedAmount?: number;
//     weight?: {
//         unit: {
//             name: string;
//         };
//     };
//     serving?: any;
//     useServing?: boolean;
//     patientFoodCategoryAttachment?: any;
//     patientFoodCategoryQuestion?: any;
// }

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
    replacementId: number | string;
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
    restaurantCatalog?: boolean;
}

export interface FoodFilter {
    upc?: string;
    name?: string;
    tagIds?: number[];
    isEnabled?: boolean;
    prefixName?: string;
    treeTypeId?: number;
    onlyNodeId?: number;
    foodPlanFilter?: any;
    excludeIds?: number[];
    includeIds?: number[];
    nameFragment?: string;
    categoryNodeId?: number;
    foodPatientPlanFilter?: any;
    treeTypeViewLabel?: 'PATIENT_NAVIGATION';
}

export const dayOverviewApi = createApi({
    reducerPath: 'dayOverviewApi',
    baseQuery,
    tagTypes: [
        'Anytime',
        'Questions',
        'PhaseItem',
        'PhaseItems',
        'DayOverview',
        'AvailableItems'
    ],
    endpoints: builder => ({
        // Create measurement record (manual or third-party)
        addMeasurementRecord: builder.mutation<any, {
            type: MeasurementType;
            payload: any;
        }>({
            query: ({ payload }) => ({
                body: payload,
                method: 'POST',
                url: '/patient-service/patients/me/measurement/third-party',
            }),
            invalidatesTags: (result, error, { type }) => [
                'DayOverview',
                { type: 'PhaseItems', id: `measurement-${type}` },
                { type: 'PhaseItems', id: `measurement-last-${type}` },
            ],
        }),
        getQuestions: builder.query<PatientFoodCategoryQuestion, string>({
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
                            ].includes(item.type))
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
                body: filter,
                method: 'POST',
                params: { page, size /* sort */ },
                url: '/patient-service/category-tree/nodes/filter',
            }),
            providesTags: ['AvailableItems'],
        }),
  
        getCatalogPrototypeTreeNodes: builder.query<any, { filter: RecipePrototypeCatalogFilter; page?: number; size?: number; sort?: string }>({
            query: ({ filter, page = 0, size = 10, sort = 'name,ASC' }) => ({
                body: filter,
                method: 'POST',
                params: { page, size, sort },
                url: '/patient-service/catalog-prototype-tree/nodes/filter',
            }),
            providesTags: ['AvailableItems'],
        }),
  
        getRecipePrototypes: builder.query<any, { filter: RecipePrototypeFilter; page?: number; size?: number; sort?: string }>({
            query: ({ filter, page = 0, size = 10, sort = 'name,ASC' }) => ({
                url: '/patient-service/recipe-prototypes/filter',
                params: { page, size, sort },
                method: 'POST',
                body: filter,
            }),
            providesTags: ['AvailableItems'],
        }),
  
        getRecipePrototype: builder.query<any, number | string>({
            query: id => ({
                url: `/patient-service/recipe-prototypes/${id}`,
                method: 'GET',
            }),
        }),
  
        recalculateRecipeSteps: builder.mutation<any, { ingredients: any[]; steps: any[] }>({
            query: data => ({
                url: '/patient-service/recipe-prototypes/steps',
                method: 'POST',
                body: data,
            }),
        }),

        getIngredientsBySibling: builder.query<any[], { id: number | string; useInPrototypes?: boolean }>({
            query: ({ id, useInPrototypes = false }) => ({
                method: 'GET',
                params: { useInPrototypes },
                url: `/patient-service/recipe-prototypes/ingredients-by-sibling/${id}`,
            }),
        }),
  
        getFoods: builder.query<any, { filter: FoodFilter; page?: number; size?: number; sort?: string }>({
            query: ({ filter, page = 0, size = 10, sort = 'name,ASC' }) => ({
                url: '/patient-service/foods/filter',
                params: { page, size, sort },
                method: 'POST',
                body: filter,
            }),
            providesTags: ['AvailableItems'],
        }),

        getAiFoods: builder.query<any[], { name: string }>({
            query: ({ name }) => ({
                url: '/patient-service/ai/foods',
                params: { name },
                method: 'GET',
            }),
        }),

        getAiFoodData: builder.mutation<any, { name: string }>({
            query: body => ({
                url: '/patient-service/ai/foods',
                method: 'POST',
                body,
            }),
        }),

        filterFoodToCreate: builder.mutation<any, { upc: string }>({
            query: body => ({
                url: '/patient-service/food-to-create/filter',
                method: 'POST',
                body,
            }),
        }),

        filterBFPDFoods: builder.mutation<any, { upc: string }>({
            query: body => ({
                url: '/patient-service/usda-foods/BFPD/filter',
                method: 'POST',
                body,
            }),
        }),

        importFoodDefault: builder.mutation<any, { originId: string | number }>({
            query: body => ({
                url: '/patient-service/foods/import/default',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['AvailableItems'],
        }),

        createFoodToCreate: builder.mutation<any, { upc: string; name: string; images: any[] }>({
            query: body => ({
                url: '/patient-service/food-to-create',
                method: 'POST',
                body,
            }),
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
          //   invalidatesTags: (result, error, { id, phaseId }) => [
          //       { type: 'PhaseItem', id },
          //       { type: 'PhaseItems', id: phaseId },
          //       'DayOverview',
          //   ],
          async onQueryStarted ({ id, phaseId, data, date }, { dispatch, queryFulfilled }) {
              // Optimistic update - apply immediately
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
              const singleItemPatch = dispatch(
                  dayOverviewApi.util.updateQueryData('getPhaseItem', id, (draft: any) => {
                      if (draft) {
                          Object.assign(draft, data);
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
                  const { data: serverItem } = await queryFulfilled;
                  dispatch(
                      dayOverviewApi.util.updateQueryData('getPhaseItem', id, (draft: any) => {
                          if (!draft) { return; }
                          const mergedServerItem = { ...serverItem } as any;
                          if (mergedServerItem?.patientFoodCategoryQuestion == null && draft?.patientFoodCategoryQuestion) {
                              mergedServerItem.patientFoodCategoryQuestion = draft.patientFoodCategoryQuestion;
                          }
                          if (mergedServerItem?.patientFoodCategoryAttachment == null && draft?.patientFoodCategoryAttachment) {
                              mergedServerItem.patientFoodCategoryAttachment = draft.patientFoodCategoryAttachment;
                          }
                          Object.assign(draft, mergedServerItem);
                      })
                  );
                  dispatch(
                      dayOverviewApi.util.updateQueryData('getPhaseItems', phaseId, (draft: Record<string, any[]>) => {
                          for (const arr of Object.values(draft) as any[][]) {
                              const found = arr.find(x => x.id === id);
                              if (found) {
                                  const mergedServerItem = { ...serverItem } as any;
                                  // Some responses omit question/video attachment fields after status-only updates.
                                  // Preserve already loaded nested objects to avoid UI flicker/disappearance.
                                  if (mergedServerItem?.patientFoodCategoryQuestion == null && found?.patientFoodCategoryQuestion) {
                                      mergedServerItem.patientFoodCategoryQuestion = found.patientFoodCategoryQuestion;
                                  }
                                  if (mergedServerItem?.patientFoodCategoryAttachment == null && found?.patientFoodCategoryAttachment) {
                                      mergedServerItem.patientFoodCategoryAttachment = found.patientFoodCategoryAttachment;
                                  }
                                  Object.assign(found, mergedServerItem);
                                  arr.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
                                  break;
                              }
                          }
                      })
                  );
              } catch {
                  // Revert optimistic updates on error
                  patch.undo();
                  singleItemPatch.undo();
                  if (dayOverviewPatched) { dayOverviewPatched.undo(); }
              }
          },
      }),

        deletePhaseItem: builder.mutation<void, { id: number | string; phaseId: number | string }>({
            query: ({ id }) => ({
                url: `/patient-service/patients/day-overview/phase/item/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, { id, phaseId }) => [{ type: 'PhaseItem', id }, { type: 'PhaseItems', id: phaseId },],
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
        // addPhaseItem: builder.mutation<PhaseItem, { phaseId: number | string; data: any }>({
        //     query: ({ phaseId, data }) => ({
        //         url: `/patient-service/patients/day-overview/phase/${phaseId}/items`,
        //         method: 'POST',
        //         body: data,
        //     }),
        //     invalidatesTags: (result, error, { phaseId }) => [{ type: 'PhaseItems', id: phaseId }],
        //     async onQueryStarted ({ phaseId }, { dispatch, queryFulfilled }) {
        //         try {
        //             const { data: created } = await queryFulfilled;
        //             dispatch(
        //                 dayOverviewApi.util.updateQueryData('getPhaseItems', phaseId, (draft: Record<string, any[]>) => {
        //                     const key = created?.type || 'UNKNOWN';
        //                     if (!draft[key]) { draft[key] = []; }
        //                     draft[key].push(created);
        //                     draft[key].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        //                 })
        //             );
        //         } catch (error) {
        //             // console.error('error', error);
        //         }
        //     },
        // }),
        // Add recipe from library (not modified)
        addPhaseRecipe: builder.mutation<PhaseItem, { phaseId: number | string; data: any }>({
            query: ({ phaseId, data }) => ({
                url: `/patient-service/patients/day-overview/phase/${phaseId}/previous-recipe`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: (result, error, { phaseId }) => [{ type: 'PhaseItems', id: phaseId }, 'DayOverview',],
        }),
        // Add custom recipe (with modified ingredients)
        addPhaseCustomRecipe: builder.mutation<PhaseItem, { phaseId: number | string; data: any }>({
            query: ({ phaseId, data }) => ({
                url: `/patient-service/patients/day-overview/phase/${phaseId}/recipe`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: (result, error, { phaseId }) => [{ type: 'PhaseItems', id: phaseId }, 'DayOverview',],
        }),
        addPhaseMealItem: builder.mutation<PhaseItem, { phaseId: number | string; data: AddPhaseItemData }>({
            query: ({ phaseId, data }) => ({
                url: '/patient-service/patients/day-overview/phase/items',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: (result, error, { phaseId }) => [{ type: 'PhaseItems', id: phaseId }],
        }),
        addPhaseItem: builder.mutation<PhaseItem, { phaseId: number | string; data: any }>({
            query: ({ phaseId, data }) => ({
                url: '/patient-service/patients/day-overview/phase',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: (result, error, { phaseId }) => [{ type: 'PhaseItems', id: phaseId }],
        }),
        // Create new patient phase (ADDED_BY_PATIENT) with items
        createPatientPhase: builder.mutation<Phase, {
            dayOverviewId: number | string;
            data: {
                items: any[];
                type: string;
                order: number;
                status: string;
                dayOverview: { id: number | string };
            };
        }>({
            query: ({ data }) => ({
                url: '/patient-service/patients/day-overview/phase',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['DayOverview', 'PhaseItems'],
        }),
        // Create patient phase with custom recipe payload
        createPatientPhaseWithCustomRecipe: builder.mutation<Phase, {
            dayOverviewId: number | string;
            data: any;
        }>({
            query: ({ dayOverviewId, data }) => ({
                url: `/patient-service/patients/day-overview/${dayOverviewId}/phase/recipe`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['DayOverview', 'PhaseItems'],
        }),
        // Update patient phase (add items to existing ADDED_BY_PATIENT phase)
        updatePatientPhase: builder.mutation<Phase, {
            phaseId: number | string;
            data: {
                items?: any[];
                type?: string;
                order?: number;
                status?: string;
                dayOverview?: { id: number | string };
            };
        }>({
            query: ({ phaseId, data }) => ({
                url: `/patient-service/patients/day-overview/phase/${phaseId}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['DayOverview', 'PhaseItems'],
        }),
        replacePhaseItem: builder.mutation<PhaseItem, ReplaceItemRequest>({
            query: ({ itemId, replacementId }) => ({
                url: `/patient-service/patient/day-overview/rescue/phase-item/${itemId}/recipe-replacement`,
                method: 'POST',
                body: {
                    id: itemId,
                    replacement: { id: replacementId },
                },
            }),
            invalidatesTags: (result, error, { itemId, phaseId }) => [{ type: 'PhaseItem', id: itemId }, { type: 'PhaseItems', id: phaseId },],
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
            invalidatesTags: (result, error, { id }) => [{ type: 'PhaseItems', id }, 'DayOverview',],
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

        // Measurement Chart Data
        getAggregateMeasurementData: builder.query<any, {
            type: string; // WEIGHT, BLOOD_GLUCOSE, BLOOD_PRESSURE, etc.
            date: string; // YYYY-MM-DD
            period: string; // 1-day, 1-week, 1-month, 6-month, 1-year
            offset: number; // timezone offset in hours
        }>({
            query: ({ type, period, date, offset }) => ({
                url: `/patient-service/patients/me/measurement/aggregate-fixed/${type}/${period}/${date}`,
                params: { offset },
            }),
            providesTags: (result, error, { type }) => [{ type: 'PhaseItems', id: `measurement-${type}` }],
        }),

        getLoggedMeasurementData: builder.mutation<any, {
            type: string;
            page?: number;
            size?: number;
            sort?: string;
        }>({
            query: ({ type, page = 0, size = 15, sort = 'timestamp,DESC' }) => ({
                method: 'POST',
                body: { type },
                params: { page, size, sort },
                url: '/patient-service/patients/me/measurement/logged',
            }),
        }),

        getMeasurementTypes: builder.query<any, {
            dateTime: string;
            period: string;
        }>({
            query: ({ dateTime, period }) => ({
                url: '/patient-service/patients/me/measurement/types',
                params: { dateTime, period },
            }),
            transformResponse: (response: any) => {
                return response;
            },
            providesTags: (result, error, { dateTime, period }) => [{ type: 'PhaseItems', id: `measurement-types-${dateTime}-${period}` }],
        }),

        getLastMeasurement: builder.query<any, string>({
            query: type => `/patient-service/patients/me/measurement/${type}/last`,
            providesTags: (result, error, type) => [{ type: 'PhaseItems', id: `measurement-last-${type}` }],
        }),

        deleteMeasurements: builder.mutation<void, number[]>({
            query: measurementIds => ({
                method: 'DELETE',
                body: measurementIds,
                url: '/patient-service/patients/me/measurement',
            }),
            invalidatesTags: ['DayOverview', 'PhaseItems'],
        }),

        // Change Meal - Rescue Foods Setting
        updateIncludeRescueFoods: builder.mutation<void, { includeRescueFoodsInShoppingList: boolean }>({
            query: body => ({
                url: '/patient-service/patients/me/include-rescue-foods-in-shopping-list',
                method: 'PUT',
                body,
            }),
            invalidatesTags: ['DayOverview'],
        }),

        // Replace Phase with Rescue Food
        replacePhase: builder.mutation<any, number | string>({
            query: phaseId => ({
                url: `/patient-service/patient/day-overview/rescue/phase/${phaseId}/replacement`,
                method: 'POST',
            }),
            invalidatesTags: ['DayOverview', 'PhaseItems'],
        }),

        // Swap today's meal with a future date's meal ("Eat Today")
        interchangeMeals: builder.mutation<void, { phaseId: number | string; futurePhaseId: number | string }>({
            query: body => ({
                url: '/patient-service/day-overview-phases/day-overviews/replace',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['DayOverview', 'PhaseItems'],
        }),

        // Get rescue shopping items videos
        getRescueVideos: builder.query<any[], void>({
            query: () => '/patient-service/patients/me/rescue-shopping-items-videos',
        }),

        // Get rescue catalog list (categories)
        getRescueCatalog: builder.query<any, number | string>({
            query: phaseId => `/patient-service/patient/day-overview/rescue/phase/${phaseId}/rescue-catalog`,
        }),

        // Get restaurant rescue catalog
        getRestaurantCatalog: builder.query<any, number | string>({
            query: phaseId => `/patient-service/patient/day-overview/rescue/restaurant/phase/${phaseId}/rescue-catalog`,
        }),

        // Get meals for specific catalog
        getRescueMeals: builder.query<any, { phaseId: number | string; catalogId: number | string; isRestaurant?: boolean }>({
            query: ({ phaseId, catalogId, isRestaurant }) => (
                isRestaurant
                    ? `/patient-service/patient/day-overview/rescue/restaurant/phase/${phaseId}/rescue-catalog/${catalogId}`
                    : `/patient-service/patient/day-overview/rescue/phase/${phaseId}/rescue-catalog/${catalogId}`
            ),
        }),

        // Update phase with selected rescue items
        updatePhaseWithRescue: builder.mutation<any, { phaseId: number | string; items: any[] }>({
            query: ({ phaseId, items }) => ({
                url: `/patient-service/patient/day-overview/rescue/phase/${phaseId}`,
                method: 'PUT',
                body: items,
            }),
            invalidatesTags: ['DayOverview', 'PhaseItems'],
        }),

        // Get recipe category tree for replacement
        getRecipeCategoryTree: builder.query<any, number | string>({
            query: recipeId => `/patient-service/patient/day-overview/rescue/recipe/${recipeId}/category-tree`,
        }),

        // Get items in a specific category for recipe replacement
        getRecipeCategoryItems: builder.query<any, { recipeId: number | string; categoryId: number | string }>({
            query: ({ recipeId, categoryId }) => `/patient-service/patient/day-overview/rescue/recipe/${recipeId}/category/${categoryId}`,
        }),

        // Replace recipe item
        replaceRecipeItem: builder.mutation<any, { phaseItemId: number | string; data: { id: number | string; replacement: { id: number | string } } }>({
            query: ({ phaseItemId, data }) => ({
                url: `/patient-service/patient/day-overview/rescue/phase-item/${phaseItemId}/recipe-replacement`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['DayOverview', 'PhaseItems'],
        }),
        // revert phase item (debug only)
        revertPhaseItem: builder.mutation<any, { phaseItemId: number | string; }>({
            query: ({ phaseItemId }) => ({
                url: `/patient-service/day-overview-phase-item/${phaseItemId}/initial-recipe`,
                method: 'PUT',
                data: []
            }),
            invalidatesTags: ['DayOverview', 'PhaseItems'],
        }),

        // Menu badges - incomplete questions/videos count for daily plan
        getIncompleteQuestionsVideos: builder.query<number, string>({
            query: date => `/patient-service/patients/me/day-overview/${date}/questions-videos`,
            providesTags: (result, error, date) => [{ type: 'DayOverview', id: `menu-badges-${date}` }],
        }),

        // Menu badges - untracked measurements count for daily plan
        getUntrackedMeasurements: builder.query<number, string>({
            query: date => `/patient-service/patients/me/day-overview/${date}/untracked-measurements`,
            providesTags: (result, error, date) => [{ type: 'DayOverview', id: `menu-badges-${date}` }],
        }),

        // Menu badges - library items with total count
        getLibraryItemsTotalTree: builder.query<any[], void>({
            query: () => '/patient-service/patients/me/items-from-library-destination/total-tree',
        }),

        // Menu badges - medical problems for health profile
        getMedicalProblems: builder.query<any[], void>({
            query: () => '/patient-service/patients/me/medical-problems',
        }),

        // Menu badges - medication allergies for health profile
        getMedicationAllergies: builder.query<any[], void>({
            query: () => '/patient-service/patients/me/medication-allergies',
        }),

        // Walking / Step Counter activity tracking
        startWalkingActivity: builder.mutation<any, {
            // EXERCISE_AEROBIC items have no physical_activity entity, so activity.id is null;
            // the record is linked to the plan via dayOverviewPhaseItem and identified by its own id.
            start: string;
            status: string;
            distance?: number;
            stepCount?: number;
            activity?: { id: number | string | null };
            dayOverviewPhaseItem: { id: number | string };
        }>({
            query: body => ({
                url: '/patient-service/patients/day-overview/activity',
                method: 'POST',
                body,
            }),
            // No cache invalidation: the WalkingActivity screen propagates the phase-item status to the
            // parent list via handleChangeStatus (date-scoped optimistic updatePhaseItem) and refreshCurrentList.
            // Invalidating the broad 'DayOverview' tag would refetch getDayOverview + the menu-badge queries.
        }),

        updateWalkingActivity: builder.mutation<any, {
            pause?: string;
            status: string;
            distance?: number;
            stepCount?: number;
            id: number | string;
            activity?: { id: number | string };
        }>({
            query: body => ({
                body,
                method: 'PUT',
                url: '/patient-service/patients/day-overview/activity',
            }),
            // See startWalkingActivity: status changes reach the parent list locally, so the broad
            // 'DayOverview' invalidation (which also refetched the menu-badge queries) is intentionally omitted.
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
    useAddPhaseRecipeMutation,
    useAddPhaseMealItemMutation,
    useAddPhaseCustomRecipeMutation,
    // useGetAvailableItemsQuery,
    useGetFoodsQuery,
    useLazyGetAiFoodsQuery,
    useGetAiFoodDataMutation,
    useFilterFoodToCreateMutation,
    useFilterBFPDFoodsMutation,
    useImportFoodDefaultMutation,
    useCreateFoodToCreateMutation,
    useUpdatePhaseItemMutation,
    useDeletePhaseItemMutation,
    useGetRecipePrototypeQuery,
    useGetAerobicExerciseQuery,
    useReplacePhaseItemMutation,
    useGetRecipePrototypesQuery,
    useGetCategoryTreeNodesQuery,
    useGetStretchingExerciseQuery,
    useUpdateAerobicStepsMutation,
    useGetResistanceExerciseQuery,
    useAddMeasurementRecordMutation,
    useGetIngredientsBySiblingQuery,
    useGetPhysicalActivityItemQuery,
    useUpdateStretchingStepsMutation,
    useUpdateResistanceStepsMutation,
    useRecalculateRecipeStepsMutation,
    useGetCatalogPrototypeTreeNodesQuery,
    // Measurement Chart
    useGetRescueMealsQuery,
    useReplacePhaseMutation,
    useGetRescueVideosQuery,
    useGetRescueCatalogQuery,
    useRevertPhaseItemMutation,
    useGetLastMeasurementQuery,
    useGetMeasurementTypesQuery,
    useInterchangeMealsMutation,
    useGetRestaurantCatalogQuery,
    useDeleteMeasurementsMutation,
    useUpdatePhaseWithRescueMutation,
    useUpdateIncludeRescueFoodsMutation,
    useGetAggregateMeasurementDataQuery,
    useGetLoggedMeasurementDataMutation,
    // Recipe replacement
    useReplaceRecipeItemMutation,
    useGetRecipeCategoryTreeQuery,
    useGetRecipeCategoryItemsQuery,
    // Create patient phase (ADDED_BY_PATIENT)
    useCreatePatientPhaseMutation,
    useUpdatePatientPhaseMutation,
    useCreatePatientPhaseWithCustomRecipeMutation,
    // Menu badges
    useGetMedicalProblemsQuery,
    useGetMedicationAllergiesQuery,
    useGetLibraryItemsTotalTreeQuery,
    useGetUntrackedMeasurementsQuery,
    useGetIncompleteQuestionsVideosQuery,
    // Walking
    useStartWalkingActivityMutation,
    useUpdateWalkingActivityMutation,
} = dayOverviewApi;
