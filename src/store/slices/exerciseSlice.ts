import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ExerciseStep {
    id: string | number;
    order?: number;
    completed?: boolean;
    modified?: boolean;
    image?: { url?: string } | null;
    video?: { id?: number | string; title?: string; description?: string; embedUrl?: string; mimeType?: string } | null;
    instruction?: string | null;
    // Dynamic fields based on exercise type
    reps?: number;
    seconds?: number;
    minutes?: number;
    hours?: number;
    miles?: number;
    steps?: number;
    weight?: number;
    velocity?: number;
    elevation?: number;
    resistance?: number;
    [key: string]: any;
}

export interface ExerciseState {
    // Current exercise data
    id: string | number | null;
    exerciseType: string | null;
    title: string | null;
    subtype: string | null;
    
    // Exercise content
    scientificDescription: string | null;
    scientificVideo: any | null;
    image?: { url?: string } | null;
    video?: any | null;
    instruction?: string | null;
    
    // Steps management
    steps: ExerciseStep[];
    originalSteps: ExerciseStep[];
    selectedSteps: ExerciseStep[];
    
    // UI state
    initialized: boolean;
    disabled: boolean;
    isDirty: boolean;
}

const initialState: ExerciseState = {
    id: null,
    exerciseType: null,
    title: null,
    subtype: null,
    scientificDescription: null,
    scientificVideo: null,
    image: null,
    video: null,
    instruction: null,
    steps: [],
    originalSteps: [],
    selectedSteps: [],
    initialized: false,
    disabled: false,
    isDirty: false,
};

const exerciseSlice = createSlice({
    name: 'exercise',
    initialState,
    reducers: {
        // Initialize exercise with data
        initializeExercise: (state, action: PayloadAction<{
            id: string | number;
            exerciseType: string;
            data?: Partial<ExerciseState>;
        }>) => {
            const { id, exerciseType, data } = action.payload;
            
            // Only initialize if it's a different exercise or not initialized yet
            if (state.id !== id || !state.initialized) {
                state.id = id;
                state.exerciseType = exerciseType;
                state.isDirty = false;
                
                if (data) {
                    Object.assign(state, data);
                    // If we have data, mark as initialized
                    state.initialized = true;
                    state.disabled = false;
                } else {
                    // If no data yet, mark as not initialized
                    state.initialized = false;
                    state.disabled = true;
                }
            }
        },
        
        // Update exercise data (from API response)
        updateExerciseData: (state, action: PayloadAction<Partial<ExerciseState>>) => {
            Object.assign(state, action.payload);
            state.initialized = true;
            state.disabled = false;
        },
        
        // Update specific step
        updateStep: (state, action: PayloadAction<{
            stepId: string | number;
            updates: Partial<ExerciseStep>;
        }>) => {
            const { stepId, updates } = action.payload;
            const stepIndex = state.steps.findIndex(step => step.id === stepId);
            if (stepIndex !== -1) {
                state.steps[stepIndex] = { ...state.steps[stepIndex], ...updates, modified: true };
                state.isDirty = true;
            }
        },
        
        // Toggle step completion
        toggleStepCompletion: (state, action: PayloadAction<string | number>) => {
            const stepId = action.payload;
            const stepIndex = state.steps.findIndex(step => step.id === stepId);
            if (stepIndex !== -1) {
                state.steps[stepIndex].completed = !state.steps[stepIndex].completed;
                state.isDirty = true;
            }
        },
        
        // Update all steps (after API call)
        updateAllSteps: (state, action: PayloadAction<ExerciseStep[]>) => {
            state.steps = action.payload;
            state.isDirty = false;
        },
        
        // Update steps and selectedSteps
        updateSteps: (state, action: PayloadAction<{
            steps: ExerciseStep[];
            selectedSteps: ExerciseStep[];
            isDirty?: boolean;
        }>) => {
            state.steps = action.payload.steps;
            state.selectedSteps = action.payload.selectedSteps;
            if (action.payload.isDirty !== undefined) {
                state.isDirty = action.payload.isDirty;
            } else {
                state.isDirty = true;
            }
        },
        
        // Set loading state
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.disabled = action.payload;
        },
        
        // Clear exercise state
        clearExercise: () => initialState,
    },
});

export const {
    initializeExercise,
    updateExerciseData,
    updateStep,
    toggleStepCompletion,
    updateAllSteps,
    updateSteps,
    setLoading,
    clearExercise,
} = exerciseSlice.actions;

export default exerciseSlice.reducer;

