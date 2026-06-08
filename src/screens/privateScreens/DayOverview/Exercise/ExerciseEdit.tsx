// outsource dependencies
import { View, StyleSheet } from 'react-native';
import React, { useMemo, useCallback } from 'react';
import { useRoute, useNavigation } from '@react-navigation/native';
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

// Exercise values must be greater than zero, so each wheel starts at 1 (not 0).
const DATA_MAP: Record<string, number[]> = {
    hours: Array.from({ length: 24 }, (_, i) => i + 1),
    reps: Array.from({ length: 1000 }, (_, i) => i + 1),
    miles: Array.from({ length: 1000 }, (_, i) => i + 1),
    weight: Array.from({ length: 500 }, (_, i) => i + 1),
    steps: Array.from({ length: 20000 }, (_, i) => i + 1),
    velocity: Array.from({ length: 500 }, (_, i) => i + 1),
    seconds: Array.from({ length: 1000 }, (_, i) => i + 1),
    minutes: Array.from({ length: 1000 }, (_, i) => i + 1),
    elevation: Array.from({ length: 1000 }, (_, i) => i + 1),
    resistance: Array.from({ length: 500 }, (_, i) => i + 1),
};

const FIELD_LABELS: Record<string, string> = {
    reps: 'Reps', hours: 'Hours', miles: 'Miles', steps: 'Steps', weight: 'Weight', seconds: 'Seconds', minutes: 'Minutes', velocity: 'Velocity', elevation: 'Elevation', resistance: 'Resistance',
};

export default function ExerciseEdit () {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const dispatch = useAppDispatch();
    const theme = useTheme();
    const { steps, originalSteps, disabled } = useAppSelector((state: any) => state.exercise || {});
    const { itemId, onApply, exerciseType, subtype, goalType, viewOnlyExtra = false } = route.params || {};

    const step = useMemo(() => (steps || []).find((s: any) => s.id === itemId) || {}, [steps, itemId]);
    const origStep = useMemo(() => (originalSteps || []).find((s: any) => s.id === itemId) || {}, [originalSteps, itemId]);
    const title = route?.params?.title || 'Exercise';

    const config = exerciseType
        ? EXERCISE_CONFIGS[exerciseType]?.[subtype || 'DEFAULT']?.[goalType || 'DEFAULT']
        : null;

    const goalFields = useMemo(() => (config?.goalFields || []).map((key: string) => ({
        key,
        value: step[key] ?? 0,
        isDecimal: isDecimalField(key),
        label: FIELD_LABELS[key] || key,
        data: isDecimalField(key) ? null : (DATA_MAP[key] || DATA_MAP.reps),
    })), [config, step]);

    const extraFields = useMemo(() => (config?.extraFields || []).map((key: string) => ({
        key,
        value: step[key] ?? 0,
        isDecimal: isDecimalField(key),
        label: FIELD_LABELS[key] || key,
        data: isDecimalField(key) ? null : (DATA_MAP[key] || DATA_MAP.reps),
    })), [config, step]);

    const isDisabled = useMemo(
        () => [...goalFields, ...extraFields].every(f => (step[f.key] ?? 0) === (origStep[f.key] ?? 0)),
        [goalFields, extraFields, step, origStep]
    );

    const handleApply = useCallback((vals: Record<string, unknown>) => {
        const updatedSteps = (steps || []).map((s: any) =>
            (s.id === itemId ? { ...s, ...vals, modified: true } : s));
        dispatch(updateSteps({ steps: updatedSteps, selectedSteps: updatedSteps }));

        onApply?.({ ...step, ...vals, modified: true });
    }, [dispatch, itemId, onApply, step, steps]);

    const handleSave = useCallback(() => {
        handleApply(step);
        navigation.goBack();
    }, [navigation, handleApply, step]);

    if (!exerciseType) {
        return (
            <Screen initialized style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <Text>Unsupported exercise type</Text>
            </Screen>
        );
    }

    if (!config) {
        return (
            <Screen initialized style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <Text>Unsupported exercise config</Text>
            </Screen>
        );
    }

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
                    iconStyle="solid"
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

