// outsource dependencies
import { useMemo } from 'react';
// local dependencies
import { useAppSelector } from '../store';
import { useGetPhaseItemsQuery } from '../store/api/dayOverviewApi';
import { selectOverviewForDate } from '../store/slices/dayOverviewSlice';
import type {
    AnytimeData,
    AnytimeItem,
    AnytimeFoodItem,
    AnytimeDrinkItem,
    AnytimeSupplementItem,
    AnytimeMeasurementItem,
    AnytimePhysicalActivityItem
} from '../types/anytime';

export const useAnytimeData = (date?: string) => {
    const dayOverviewState = useAppSelector(state => state.dayOverview);
    const currentDate = date || dayOverviewState.date;
    const overviewData = useAppSelector(state => selectOverviewForDate(state, currentDate));
  
    // Get anytime phase ID from overview data
    const anytimePhaseId = overviewData?.anytimePhaseId;
  
    // Fetch anytime items if we have phase ID
    const {
        error,
        refetch,
        isLoading,
        data: anytimeItems,
    } = useGetPhaseItemsQuery(anytimePhaseId!, {
        skip: !anytimePhaseId,
        refetchOnMountOrArgChange: true,
    });

    const processedData: AnytimeData = useMemo(() => {
        if (!anytimeItems) {
            return {
                foods: [],
                drinks: [],
                supplements: [],
                measurements: [],
                physicalActivities: [],
            };
        }

        const foods: AnytimeFoodItem[] = [];
        const drinks: AnytimeDrinkItem[] = [];
        const supplements: AnytimeSupplementItem[] = [];
        const measurements: AnytimeMeasurementItem[] = [];
        const physicalActivities: AnytimePhysicalActivityItem[] = [];

        // Process different types of items
        const flatItems = Object.values(anytimeItems).flat();
        
        flatItems.forEach((item: any) => {
            const baseItem = {
                id: item.id,
                order: item.order,
                amount: item.amount,
                phaseId: anytimePhaseId,
                status: item.status || 'PENDING',
            };

            switch (item.type) {
                case 'FOOD':
                    if (item.substanceType === 'DRINK'
              || (item.food && item.substanceType === 'DRINK')) {
                        drinks.push({
                            ...baseItem,
                            type: 'DRINK',
                            food: item.food,
                            weight: item.weight,
                            substanceType: 'DRINK',
                        } as AnytimeDrinkItem);
                    } else {
                        foods.push({
                            ...baseItem,
                            type: 'FOOD',
                            food: item.food,
                            weight: item.weight,
                            substanceType: item.substanceType || 'FOOD',
                        } as AnytimeFoodItem);
                    }
                    break;
          
                case 'SUPPLEMENT':
                    supplements.push({
                        ...baseItem,
                        type: 'SUPPLEMENT',
                        supplement: item.supplement,
                    } as AnytimeSupplementItem);
                    break;
          
                case 'MEASUREMENT':
                    measurements.push({
                        ...baseItem,
                        type: 'MEASUREMENT',
                        measurement: item.measurement,
                    } as AnytimeMeasurementItem);
                    break;
          
                case 'PHYSICAL_ACTIVITY':
                    physicalActivities.push({
                        ...baseItem,
                        type: 'PHYSICAL_ACTIVITY',
                        physicalActivity: item.physicalActivity,
                    } as AnytimePhysicalActivityItem);
                    break;
                default:
                    // Skip unknown item types
                    break;
            }
        });

        const result = {
            foods: foods.sort((a, b) => (a.order || 0) - (b.order || 0)),
            drinks: drinks.sort((a, b) => (a.order || 0) - (b.order || 0)),
            supplements: supplements.sort((a, b) => (a.order || 0) - (b.order || 0)),
            measurements: measurements.sort((a, b) => (a.order || 0) - (b.order || 0)),
            physicalActivities: physicalActivities.sort((a, b) => (a.order || 0) - (b.order || 0)),
        };
        
        return result;
    }, [anytimeItems, anytimePhaseId]);

    const getPendingCount = (items: AnytimeItem[]) =>
        items.filter(item => item.status === 'PENDING').length;

    const counts = useMemo(() => ({
        foods: getPendingCount(processedData.foods),
        drinks: getPendingCount(processedData.drinks),
        supplements: getPendingCount(processedData.supplements),
        measurements: getPendingCount(processedData.measurements),
        physicalActivities: getPendingCount(processedData.physicalActivities),
    }), [processedData]);

    return {
        error,
        counts,
        refetch,
        isLoading,
        data: processedData,
        hasAnytimePhase: Boolean(anytimePhaseId),
    };
};
