// outsource dependencies
import dayjs from 'services/date';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
// local dependencies
import { RootState } from '..';

// export type DayOverviewPhase = any; // TODO: type properly

export interface DayOverviewByDateEntry {
  overview: any | null;
  countPhases: number | null;
  needsRefresh?: boolean | null;
  anytime?: Record<string, any> | null;
  anytimePhaseId?: string | number | null;
}

export interface DayOverviewState {
  date: string; // YYYY-MM-DD
  questions: any[];
  initialized: boolean;
  expectAnswer: boolean;
  showCalendar: boolean;
  isMessageShow: boolean;
  isPastDate: boolean | null;
  isFutureDate: boolean | null;
  isCurrentDate: boolean | null;
  calendarDays: Record<string, any>;
  currentPhase: {
    overview: Record<string, any>;
    phaseId: number | string | null;
  };
  pendingOpenPhaseId: number | string | null;
  byDate: Record<string, DayOverviewByDateEntry>;
  // Track recently completed phases for animation
  recentlyCompletedPhases: (number | string)[];
}

const TODAY = dayjs().format('YYYY-MM-DD');

const initialState: DayOverviewState = {
    date: TODAY,
    questions: [],
    initialized: true,
    isPastDate: false,
    isFutureDate: false,
    isCurrentDate: true,
    expectAnswer: false,
    showCalendar: false,
    isMessageShow: false,
    calendarDays: { [TODAY]: { selected: true } },
    currentPhase: {
        overview: {},
        phaseId: null,
    },
    byDate: {},
    pendingOpenPhaseId: null,
    recentlyCompletedPhases: [],
};

const dayOverviewSlice = createSlice({
    name: 'dayOverview',
    initialState,
    reducers: {
        clear: () => ({ ...initialState }),
        meta: (state, action: PayloadAction<Partial<DayOverviewState>>) => {
            Object.assign(state, action.payload);
        },
        setDateEntry: (
            state,
            action: PayloadAction<{ date: string; entry: Partial<DayOverviewByDateEntry> }>
        ) => {
            const { date, entry } = action.payload;
            const prev = state.byDate[date] || { countPhases: null, overview: null } as DayOverviewByDateEntry;
            state.byDate[date] = { ...prev, ...entry } as DayOverviewByDateEntry;
        },
        addRecentlyCompletedPhase: (state, action: PayloadAction<number | string>) => {
            if (!state.recentlyCompletedPhases.includes(action.payload)) {
                state.recentlyCompletedPhases.push(action.payload);
            }
        },
        removeRecentlyCompletedPhase: (state, action: PayloadAction<number | string>) => {
            state.recentlyCompletedPhases = state.recentlyCompletedPhases.filter(
                id => id !== action.payload
            );
        },
        clearRecentlyCompletedPhases: state => {
            state.recentlyCompletedPhases = [];
        },
    },
});

export const dayOverviewReducer = dayOverviewSlice.reducer;
export const {
    meta,
    clear,
    setDateEntry,
    addRecentlyCompletedPhase,
    removeRecentlyCompletedPhase,
    clearRecentlyCompletedPhases,
} = dayOverviewSlice.actions;

// Selectors
export const selectDayOverview = (state: RootState) => state.dayOverview;
export const selectOverviewForDate = (state: RootState, date?: string) => {
    const d = date || state.dayOverview.date;
    return state.dayOverview.byDate[d];
};
