// outsource dependencies
import { View, StyleSheet } from 'react-native';
import React, { useMemo, useCallback } from 'react';
// local dependencies
import Text from 'components/Text';
import Screen from 'components/Screen';
import { useTheme } from 'hooks/useTheme';
import { OFFSET } from 'constants/offset';
import { Button } from 'components/Button';
import { isDecimalField } from './decimal-utils';
import { IconButton } from 'components/IconButton';
import { EXERCISE_CONFIGS } from './exerciseFactory';
import { useAppSelector, useAppDispatch } from 'store';
import { updateSteps } from 'store/slices/exerciseSlice';
import MultiWheelPicker from './components/MultiWheelPicker';

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
    const theme = useTheme();
    const { steps, originalSteps, disabled } = useAppSelector((state: any) => state.exercise || {});
    const { itemId, onApply, exerciseType, subtype, goalType, viewOnlyExtra = false } = route.params || {};
    
    const step = useMemo(() => (steps || []).find((s: any) => s.id === itemId) || {}, [steps, itemId]);
    const origStep = useMemo(() => (originalSteps || []).find((s: any) => s.id === itemId) || {}, [originalSteps, itemId]);
    const title = route?.params?.title || 'Exercise';

    if (exerciseType) {
        const config = EXERCISE_CONFIGS[exerciseType]?.[subtype || 'DEFAULT']?.[goalType || 'DEFAULT'];
        if (!config) {
            return (
                <Screen initialized style={[styles.container, { backgroundColor: theme.colors.background }]}>
                    <Text>Unsupported exercise config</Text>
                </Screen>
            );
        }

        const goalFields = config.goalFields.map((key: string) => ({
            key,
            value: step[key] ?? 0,
            isDecimal: isDecimalField(key),
            label: FIELD_LABELS[key] || key,
            data: isDecimalField(key) ? null : (DATA_MAP[key] || DATA_MAP.reps),
        }));

        const extraFields = (config.extraFields || []).map((key: string) => ({
            key,
            value: step[key] ?? 0,
            isDecimal: isDecimalField(key),
            label: FIELD_LABELS[key] || key,
            data: isDecimalField(key) ? null : (DATA_MAP[key] || DATA_MAP.reps),
        }));

        const isDisabled = [...goalFields, ...extraFields].every(f => (step[f.key] ?? 0) === (origStep[f.key] ?? 0));

        const handleApply = useCallback((vals: Record<string, unknown>) => {
            const updatedSteps = steps.map((s: any) =>
                (s.id === itemId ? { ...s, ...vals, modified: true } : s)
            );
            dispatch(updateSteps({ steps: updatedSteps, selectedSteps: updatedSteps }));
            
            // call onApply if provided - this actually saves the changes
            onApply?.({ ...step, ...vals, modified: true });
        }, [dispatch, itemId, onApply, step, steps]);

        const handleSave = useCallback(() => {
            handleApply(step);
            navigation.goBack();
        }, [navigation, handleApply, step]);

        return (
            <Screen initialized style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <View style={[styles.headerBanner, { backgroundColor: theme.colors.surfaceAlt || theme.colors.surface }]}>
                    <View style={styles.row} />
                    <Text
                        variant="h3"
                        textAlign="center"
                        style={[styles.name, { color: theme.colors.text }]}
                    >
                        {title}
                    </Text>
                    <IconButton
                        size={24}
                        icon="times"
                        disabled={false}
                        style={{ width: 20 }}
                        color={theme.colors.text}
                        onPress={navigation.goBack}
                    />
                </View>
                <MultiWheelPicker
                    step={step}
                    onApply={handleApply}
                    fields={viewOnlyExtra ? extraFields : goalFields}
                />
                <View style={styles.space} />
                <Button
                    title="SAVE"
                    variant="primary"
                    onPress={handleSave}
                    style={styles.submitBtn}
                    disabled={disabled || isDisabled}
                    textStyle={{ fontSize: 20, fontWeight: '500', paddingVertical: 3 }}
                />
            </Screen>
        );
    }

    // fallback
    return (
        <Screen initialized style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Text>Unsupported exercise type</Text>
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    submitBtn: {
        width: '90%',
        alignSelf: 'center',
        // backgroundColor: '#96E072',
        marginBottom: OFFSET.VERTICAL,
        borderColor: 'transparent',
        borderRadius: 30,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: {
        fontWeight: 'bold',
        fontSize: 18,
        marginTop: OFFSET.VERTICAL,
        marginBottom: OFFSET.POINT * 2.5,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    headerBanner: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: OFFSET.VERTICAL,
        paddingHorizontal: OFFSET.HORIZONTAL + 8,
        backgroundColor: '#E0EBF7',
        paddingVertical: OFFSET.VERTICAL
    },
    name: {
        marginLeft: OFFSET.HORIZONTAL,
        fontWeight: '500',
        marginBottom: 0,
        fontSize: 20,
    },
    space: {
        marginVertical: OFFSET.VERTICAL * 2.4,
    },
});

