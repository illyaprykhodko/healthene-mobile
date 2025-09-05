import React, { useMemo, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import Screen from 'components/Screen';
import Text from 'components/Text';
import { ExerciseFieldType } from 'types';
import MultiWheelPicker, { FieldDef } from './components/MultiWheelPicker';
import { useAppSelector, useAppDispatch } from 'store';
import { updateStep } from 'store/slices/exerciseSlice';
import { Button } from 'components/Button';

const DATA_MAP: Record<string, number[]> = {
    hours: Array.from({ length: 25 }, (_, i) => i),
    reps: Array.from({ length: 1001 }, (_, i) => i),
    miles: Array.from({ length: 1001 }, (_, i) => i),
    weight: Array.from({ length: 501 }, (_, i) => i),
    steps: Array.from({ length: 20001 }, (_, i) => i),
    velocity: Array.from({ length: 501 }, (_, i) => i),
    seconds: Array.from({ length: 1001 }, (_, i) => i),
    minutes: Array.from({ length: 1001 }, (_, i) => i),
    elevation: Array.from({ length: 1001 }, (_, i) => i),
    resistance: Array.from({ length: 501 }, (_, i) => i),
};

const FIELD_LABELS: Record<string, string> = {
    reps: 'Reps', hours: 'Hours', miles: 'Miles', steps: 'Steps', weight: 'Weight', seconds: 'Seconds', minutes: 'Minutes', velocity: 'Velocity', elevation: 'Elevation', resistance: 'Resistance',
};

export default function ExerciseEdit ({ route, navigation }: any) {
    const dispatch = useAppDispatch();
    const { steps, originalSteps, disabled } = useAppSelector((state: any) => state.exercise || {});
    const { itemId, onApply, viewOnlyExtra = false } = route.params || {};

    const step = useMemo(() => (steps || []).find((s: any) => s.id === itemId) || {}, [steps, itemId]);
    const origStep = useMemo(() => (originalSteps || []).find((s: any) => s.id === itemId) || {}, [originalSteps, itemId]);
    const title = route?.params?.title || 'Exercise';

    // Map fields based on goal/extra provided by caller
    const goalFields = (route.params?.goalFields || []) as string[];
    const extraFields = (route.params?.extraFields || []) as string[];

    const toFieldDef = (key: string): FieldDef => ({
        label: FIELD_LABELS[key] || key,
        data: [ExerciseFieldType.SECONDS,
            ExerciseFieldType.MINUTES,
            ExerciseFieldType.HOURS].includes(key as any) ? DATA_MAP[key] : DATA_MAP[key] || DATA_MAP.reps,
        value: step[key] ?? 0,
        key,
    });

    const fields: FieldDef[] = (viewOnlyExtra ? extraFields : goalFields).map(toFieldDef);

    const handleApply = useCallback((vals: Record<string, number>) => {
        // Update the step in Redux state
        dispatch(updateStep({ stepId: itemId, updates: vals }));
        
        // Also call the original onApply if provided
        onApply?.({ ...step, ...vals });
    }, [dispatch, itemId, onApply, step]);

    const isDisabled = useMemo(() => fields.every(f => (step[f.key] ?? 0) === (origStep[f.key] ?? 0)), [fields, step, origStep]);

    return (
        <Screen initialized style={styles.container}>
            <View style={styles.headerBanner}>
                <View style={styles.row} />
                <Text variant="h3" style={styles.name}>{title}</Text>
                <View style={{ width: 20 }} />
            </View>
            <MultiWheelPicker step={step} fields={fields} onApply={handleApply} />
            <View style={styles.space} />
            <Button
                // pill
                title="SAVE"
                variant="success"
                onPress={() => navigation.goBack()}
                // style={[styles.submitBtn, isDisabled && { backgroundColor: '#EEEEEE' }]}
                disabled={disabled || isDisabled}
                textStyle={{ fontSize: 20, fontWeight: '500', color: isDisabled ? '#888888' : '#4E733C', paddingVertical: 3 }}
            />
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, justifyContent: 'space-between', alignItems: 'center', paddingRight: -20, paddingLeft: -20 },
    submitBtn: { width: '90%', alignSelf: 'center', backgroundColor: '#96E072', marginBottom: 16, borderColor: 'transparent', borderRadius: 30 },
    row: { flexDirection: 'row', alignItems: 'center' },
    headerBanner: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', marginVertical: 16, paddingHorizontal: 24, backgroundColor: '#E0EBF7', paddingVertical: 16 },
    name: { marginLeft: 16, fontWeight: '500', marginBottom: 0, fontSize: 20 },
    space: { marginVertical: 48 },
});

