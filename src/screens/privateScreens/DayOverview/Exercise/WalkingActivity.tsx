// outsource dependencies
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// local dependencies
import Text from 'components/Text';
import Screen from 'components/Screen';
import { useTheme } from 'hooks/useTheme';
import { OFFSET } from 'constants/offset';
import { Button } from 'components/Button';
import { IconButton } from 'components/IconButton';
import { useAppDispatch, useAppSelector } from 'store';
import { AnimatedCount } from 'components/AnimatedCount';
import ConfirmationAlert from 'components/ConfirmationAlert';
import { stopwatchFunction, stepsToMiles } from 'utils/walking';
import { WALKING_TYPE, PHASE_ITEM_STATUS, type WalkingTypeValue } from 'constants/spec';
import { setWalkingMeta, resetWalking, type WalkingActivityState } from 'store/slices/walkingActivitySlice';
import { useGetAerobicExerciseQuery, useGetPhysicalActivityItemQuery, useStartWalkingActivityMutation, useUpdateWalkingActivityMutation } from 'store/api/dayOverviewApi';

export default function WalkingActivity () {
    const theme = useTheme();
    const route = useRoute<any>();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const dispatch = useAppDispatch();

    const {
        date,
        exercise,
        deepPhaseId,
        handleChangeStatus,
        refreshCurrentList,
    } = route.params || {};

    const walking = useAppSelector((state: any) => state.walkingActivity as WalkingActivityState);
    const {
        start,
        pause,
        status,
        distance,
        disabled,
        stepCount,
        stepError,
        stopwatch,
        activityId,
        initialized,
        isCurrentDate,
        pauseDuration,
        activityCount,
        activityCountUnit,
        activityEntityId,
    } = walking;

    const [isPastDateAlertOpen, setIsPastDateAlertOpen] = useState(false);

    // Fetch exercise data to get step goal
    const { data: aerobicData } = useGetAerobicExerciseQuery(exercise?.id?.toString() || '', {
        skip: !exercise?.id,
    });

    // Fetch current activity data for this phase item
    const { data: phaseItemData } = useGetPhysicalActivityItemQuery(exercise?.id?.toString() || '', {
        skip: !exercise?.id,
    });

    const [startActivity] = useStartWalkingActivityMutation();
    const [updateActivity] = useUpdateWalkingActivityMutation();

    // Initialize walking data from API. If a session is already running in Redux (kept alive after the
    // screen was closed mid-walk), don't clobber its live counters — only refresh the static goal.
    useEffect(() => {
        if (!aerobicData || !phaseItemData) { return; }

        const goalSteps = aerobicData?.steps?.[0]?.steps || 0;
        const goalUnit = aerobicData?.steps?.[0]?.type || 'steps';

        const today = new Date().toISOString().split('T')[0];
        const currentDate = (date || today) === today;

        const sessionActive = (status === WALKING_TYPE.IN_PROGRESS || status === WALKING_TYPE.PAUSE) && Boolean(activityId);
        if (sessionActive) {
            dispatch(setWalkingMeta({ activityCount: goalSteps, activityCountUnit: goalUnit, initialized: true }));
            return;
        }

        const dayActivity = phaseItemData?.dayOverviewActivity;
        const existingStatus = currentDate
            ? (dayActivity?.status || phaseItemData?.status || WALKING_TYPE.PENDING)
            : WALKING_TYPE.DONE;

        const existingSteps = dayActivity?.stepCount || 0;
        const existingDistance = dayActivity?.distance || 0;
        const existingStart = dayActivity?.start || null;
        const existingPause = dayActivity?.pause || null;
        const existingPauseDuration = dayActivity?.pauseDuration || 0;
        const existingActivityId = dayActivity?.id || null;
        // activity_id has a FK to the physical_activity table, so the tracking record must reference
        // physicalActivity.id (not exercise.id, which is the aerobic-exercise entity).
        const existingActivityEntityId = phaseItemData?.physicalActivity?.id || null;

        const progress = goalSteps > 0 ? Math.round((existingSteps * 100) / goalSteps) : 0;
        const sw = existingPause && existingStart
            ? stopwatchFunction(existingStart, existingPause, existingPauseDuration)
            : '00:00.00';

        dispatch(setWalkingMeta({
            stopwatch: sw,
            stepError: null,
            start: existingStart,
            pause: existingPause,
            goalProgress: progress,
            stepCount: existingSteps,
            activityCount: goalSteps,
            distance: existingDistance,
            activityCountUnit: goalUnit,
            activityId: existingActivityId,
            accumulatedSteps: existingSteps,
            pauseDuration: existingPauseDuration,
            activityEntityId: existingActivityEntityId,
            status: existingStatus as WalkingTypeValue,
            // Keep the phase-item context so the background controller can finish it on goal off-screen.
            sessionItem: { id: exercise.id, type: exercise.type, title: exercise.title },
            sessionPhaseId: deepPhaseId ?? null,
            isCurrentDate: currentDate,
            sessionDate: date ?? null,
            initialized: true,
            disabled: false,
        }));
    }, [aerobicData, phaseItemData, date, dispatch]);

    // The stopwatch tick and the live pedometer subscription are owned by useWalkingSession
    // (mounted app-wide) so the session keeps counting after this screen is closed.

    const handleStart = useCallback(async () => {
        dispatch(setWalkingMeta({ disabled: true }));
        try {
            const now = new Date().toISOString();
            const data = await startActivity({
                // No physical_activity entity for aerobic items: send a null activity and let the
                // backend link the record via dayOverviewPhaseItem (sending exercise.id here violates the FK).
                start: now,
                distance: 0,
                stepCount: 0,
                status: WALKING_TYPE.IN_PROGRESS,
                dayOverviewPhaseItem: { id: exercise.id },
                activity: { id: activityEntityId || null },
            }).unwrap();
            dispatch(setWalkingMeta({
                ...data,
                accumulatedSteps: 0,
                activityId: data.id,
                start: data.start || now,
                status: WALKING_TYPE.IN_PROGRESS,
                // Context the background controller needs to finish the phase item on goal off-screen.
                sessionItem: { id: exercise.id, type: exercise.type, title: exercise.title },
                sessionPhaseId: deepPhaseId ?? null,
                sessionDate: date ?? null,
                disabled: false,
            }));
            handleChangeStatus?.(exercise, PHASE_ITEM_STATUS.INCOMPLETE);
        } catch {
            dispatch(setWalkingMeta({ disabled: false }));
        }
    }, [activityEntityId, exercise, deepPhaseId, date, startActivity, dispatch, handleChangeStatus]);

    const handlePause = useCallback(async () => {
        if (!activityId) { return; }
        dispatch(setWalkingMeta({ disabled: true }));
        try {
            const now = new Date().toISOString();
            const data = await updateActivity({
                distance,
                stepCount,
                pause: now,
                id: activityId,
                status: WALKING_TYPE.PAUSE,
            }).unwrap();
            // Freeze Active time using the client-accumulated pauseDuration (the server value may be stale).
            const sw = stopwatchFunction(start || data.start || now, now, pauseDuration || 0);
            dispatch(setWalkingMeta({
                ...data,
                pause: now,
                stopwatch: sw,
                status: WALKING_TYPE.PAUSE,
                pauseDuration: pauseDuration || 0,
                // Commit the steps walked so far so the next segment accumulates on top of them.
                accumulatedSteps: stepCount,
                disabled: false,
                stepCount,
            }));
        } catch {
            dispatch(setWalkingMeta({ disabled: false }));
        }
    }, [activityId, stepCount, distance, start, pauseDuration, updateActivity, dispatch]);

    const handleResume = useCallback(async () => {
        if (!activityId) { return; }
        dispatch(setWalkingMeta({ disabled: true }));
        try {
            const now = new Date().toISOString();
            // Active time = elapsed − pauseDuration. Add the time spent paused (now − last pause)
            // so it resumes from where it stopped instead of counting the idle gap.
            const pausedGap = pause ? Math.max(0, new Date(now).getTime() - new Date(pause).getTime()) : 0;
            const newPauseDuration = (pauseDuration || 0) + pausedGap;
            const data = await updateActivity({
                distance,
                stepCount,
                id: activityId,
                status: WALKING_TYPE.IN_PROGRESS,
            }).unwrap();
            dispatch(setWalkingMeta({
                ...data,
                status: WALKING_TYPE.IN_PROGRESS,
                // Override the server value: the client owns the accumulated pause duration for Active time.
                pauseDuration: newPauseDuration,
                disabled: false,
                pause: now,
            }));
            handleChangeStatus?.(exercise, PHASE_ITEM_STATUS.INCOMPLETE);
        } catch {
            dispatch(setWalkingMeta({ disabled: false }));
        }
    }, [activityId, stepCount, distance, pause, pauseDuration, updateActivity, dispatch, handleChangeStatus, exercise]);

    const handleFinish = useCallback(async () => {
        if (!activityId) { return; }
        dispatch(setWalkingMeta({ disabled: true }));
        try {
            const now = new Date().toISOString();
            const data = await updateActivity({
                distance,
                stepCount,
                pause: now,
                id: activityId,
                status: WALKING_TYPE.DONE,
            }).unwrap();
            dispatch(setWalkingMeta({ ...data, status: WALKING_TYPE.DONE, disabled: false }));
            handleChangeStatus?.(exercise, PHASE_ITEM_STATUS.DONE);
            refreshCurrentList?.(exercise.id, 'status', PHASE_ITEM_STATUS.DONE);
            navigation.goBack();
        } catch {
            dispatch(setWalkingMeta({ disabled: false }));
        }
    }, [activityId, stepCount, distance, updateActivity, dispatch, handleChangeStatus, exercise, refreshCurrentList, navigation]);

    const handleClose = useCallback(() => {
        // Keep a running/paused session alive in the background (useWalkingSession keeps counting);
        // only tear it down when there's nothing in progress.
        if (status !== WALKING_TYPE.IN_PROGRESS && status !== WALKING_TYPE.PAUSE) {
            dispatch(resetWalking());
        }
        navigation.goBack();
    }, [status, dispatch, navigation]);

    const renderActionButton = () => {
        switch (status) {
            case WALKING_TYPE.PENDING:
                return (
                    <Button
                        disabled={disabled}
                        title="START WALKING"
                        onPress={handleStart}
                        textStyle={styles.actionBtnText}
                        style={[styles.actionBtn, styles.btnGreen]}
                    />
                );
            case WALKING_TYPE.IN_PROGRESS:
                return (
                    <Button
                        title="PAUSE"
                        disabled={disabled}
                        onPress={handlePause}
                        textStyle={styles.actionBtnText}
                        style={[styles.actionBtn, styles.btnRed]}
                    />
                );
            case WALKING_TYPE.PAUSE:
                return (
                    <View style={styles.doubleButtonRow}>
                        <Button
                            title="FINISH"
                            disabled={disabled}
                            onPress={handleFinish}
                            textStyle={styles.actionBtnText}
                            style={[styles.halfBtn, styles.btnGreen]}
                        />
                        <Button
                            title="RESUME"
                            disabled={disabled}
                            onPress={handleResume}
                            textStyle={styles.actionBtnText}
                            style={[styles.halfBtn, styles.btnGreen]}
                        />
                    </View>
                );
            case WALKING_TYPE.DONE:
                return (
                    <Button
                        title="WALK COMPLETE"
                        onPress={handleClose}
                        style={[styles.actionBtn, styles.btnTransparent]}
                        textStyle={{ ...styles.actionBtnText, color: theme.colors.successAlt }}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <Screen initialized={initialized} style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.headerBanner, { backgroundColor: theme.colors.surfaceAlt, paddingTop: insets.top + OFFSET.VERTICAL }]}>
                <View style={styles.row} />
                <Text
                    variant="h3"
                    numberOfLines={1}
                    textAlign="center"
                    style={[styles.headerTitle, { color: theme.colors.text }]}
                >
                    {exercise?.title || 'Walking Exercise'}
                </Text>
                <IconButton
                    size={24}
                    icon="times"
                    iconStyle="solid"
                    disabled={false}
                    style={{ width: 20 }}
                    onPress={handleClose}
                    color={theme.colors.text}
                />
            </View>

            <View style={styles.main}>
                <View style={[styles.card, { backgroundColor: theme.colors.surfaceAlt }]}>
                    <Text style={[styles.cardTitle, { color: theme.colors.textSecondary }]}>Goal progress</Text>
                    <Text variant="bold" style={[styles.cardInfo, { color: theme.colors.text }]}>
                        {`${(activityCount || 0).toLocaleString('en-US')} ${activityCountUnit || 'Steps'}`}
                    </Text>
                </View>

                <Text style={[styles.unitLabel, { color: theme.colors.textSecondary }]}>Steps</Text>
                <AnimatedCount variant="bold" value={stepCount} style={[styles.stepValue, { color: theme.colors.primary }]} />

                {Boolean(stepError) && (
                    <Text style={[styles.stepErrorText, { color: theme.colors.textSecondary }]}>{stepError}</Text>
                )}

                <View style={styles.statsRow}>
                    <View style={[styles.card, styles.cardPadded, { backgroundColor: theme.colors.surfaceAlt }]}>
                        <Text style={[styles.cardTitle, { color: theme.colors.textSecondary }]}>Active time</Text>
                        <Text variant="bold" style={[styles.cardInfo, { color: theme.colors.text }]}>{stopwatch || '00:00.00'}</Text>
                    </View>
                    <View style={[styles.card, styles.cardPadded, { backgroundColor: theme.colors.surfaceAlt }]}>
                        <Text style={[styles.cardTitle, { color: theme.colors.textSecondary }]}>Distance</Text>
                        <Text variant="bold" style={[styles.cardInfo, { color: theme.colors.text }]}>
                            {stepsToMiles(stepCount)}
                            {' mi'}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.buttonContainer}>
                {isCurrentDate
                    ? renderActionButton()
                    : (
                        <TouchableOpacity style={styles.infoBtn} onPress={() => setIsPastDateAlertOpen(true)}>
                            <Text style={[styles.infoBtnText, { color: theme.colors.primary }]}>ℹ</Text>
                        </TouchableOpacity>
                    )
                }
            </View>

            <ConfirmationAlert
                hideCancelBtn
                applyTxt="Got it!"
                isOpen={isPastDateAlertOpen}
                title="Step Counter Unavailable"
                onClose={() => setIsPastDateAlertOpen(false)}
                onSubmit={() => setIsPastDateAlertOpen(false)}
                message="Please switch to the current day to track your activity."
            />
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'space-between',
    },
    headerBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: OFFSET.VERTICAL,
        paddingHorizontal: OFFSET.HORIZONTAL + 8,
    },
    row: {
        width: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: '500',
        marginHorizontal: OFFSET.HORIZONTAL,
    },
    main: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: OFFSET.VERTICAL * 4,
    },
    card: {
        elevation: 1,
        borderRadius: 3,
        shadowRadius: 1,
        minWidth: '40%',
        shadowOpacity: 0.18,
        alignItems: 'center',
        shadowColor: '#000',
        justifyContent: 'center',
        padding: OFFSET.VERTICAL,
        marginBottom: OFFSET.VERTICAL * 2,
        shadowOffset: { width: 0, height: 1 },
    },
    cardPadded: {
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    cardTitle: {
        fontSize: 12,
        textTransform: 'uppercase',
    },
    cardInfo: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    unitLabel: {
        fontSize: 36,
        fontWeight: '600',
    },
    stepValue: {
        fontSize: 76,
        fontWeight: 'bold',
        marginBottom: OFFSET.VERTICAL * 5,
    },
    stepErrorText: {
        fontSize: 13,
        textAlign: 'center',
        marginTop: -OFFSET.VERTICAL * 3,
        marginBottom: OFFSET.VERTICAL * 2,
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    statsRow: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: OFFSET.VERTICAL * 4,
    },
    buttonContainer: {
        paddingBottom: OFFSET.VERTICAL * 3,
        paddingHorizontal: OFFSET.HORIZONTAL * 2,
    },
    actionBtn: {
        width: '100%',
        borderRadius: 30,
        marginBottom: OFFSET.VERTICAL * 2,
    },
    actionBtnText: {
        fontSize: 20,
        fontWeight: '500',
        paddingVertical: 3,
    },
    halfBtn: {
        flex: 1,
        borderRadius: 30,
        marginHorizontal: 4,
    },
    doubleButtonRow: {
        width: '100%',
        flexDirection: 'row',
        marginBottom: OFFSET.VERTICAL * 2,
    },
    btnGreen: {
        borderColor: 'transparent',
        backgroundColor: '#96E072',
    },
    btnRed: {
        borderColor: 'transparent',
        backgroundColor: '#FF6B6B',
    },
    btnTransparent: {
        borderColor: 'transparent',
        backgroundColor: 'transparent',
    },
    infoBtn: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: OFFSET.VERTICAL,
    },
    infoBtnText: {
        fontSize: 40,
    },
});
