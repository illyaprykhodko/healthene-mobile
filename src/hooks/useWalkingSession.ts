/**
 * useWalkingSession
 * App-level controller for the walking step-counter session. Mounted once (see WalkingSessionRunner),
 * it owns the stopwatch tick and the real-time pedometer subscription so a started session keeps
 * counting time and steps even after the WalkingActivity screen/modal is closed (in-app background).
 * The screen itself is a pure view over the same Redux state.
 */
// outsource dependencies
import { useCallback, useEffect, useRef } from 'react';
// local dependencies
import { PedometerService } from 'services/health';
import { useAppDispatch, useAppSelector } from 'store';
import { stopwatchFunction, stepsToMeters } from 'utils/walking';
import { WALKING_TYPE, PHASE_ITEM_STATUS } from 'constants/spec';
import { setWalkingMeta, type WalkingActivityState } from 'store/slices/walkingActivitySlice';
import { useUpdateWalkingActivityMutation, useUpdatePhaseItemMutation } from 'store/api/dayOverviewApi';

export function useWalkingSession (): void {
    const dispatch = useAppDispatch();
    const {
        start,
        status,
        activityId,
        sessionItem,
        sessionDate,
        pauseDuration,
        activityCount,
        sessionPhaseId,
        accumulatedSteps,
    } = useAppSelector((state: any) => state.walkingActivity as WalkingActivityState);

    const [updateActivity] = useUpdateWalkingActivityMutation();
    const [updatePhaseItem] = useUpdatePhaseItemMutation();

    // Refs let the long-lived pedometer callback read fresh values without re-subscribing.
    const accumulatedRef = useRef(accumulatedSteps);
    const activityCountRef = useRef(activityCount);
    const activityIdRef = useRef(activityId);
    const sessionItemRef = useRef(sessionItem);
    const sessionPhaseIdRef = useRef(sessionPhaseId);
    const sessionDateRef = useRef(sessionDate);
    const segmentBaseRef = useRef<number | null>(null);
    const goalReachedRef = useRef(false);

    useEffect(() => { accumulatedRef.current = accumulatedSteps; }, [accumulatedSteps]);
    useEffect(() => { activityCountRef.current = activityCount; }, [activityCount]);
    useEffect(() => { activityIdRef.current = activityId; }, [activityId]);
    useEffect(() => { sessionItemRef.current = sessionItem; }, [sessionItem]);
    useEffect(() => { sessionPhaseIdRef.current = sessionPhaseId; }, [sessionPhaseId]);
    useEffect(() => { sessionDateRef.current = sessionDate; }, [sessionDate]);

    // A new activity record means a fresh session: reset the goal latch and segment baseline.
    useEffect(() => {
        goalReachedRef.current = false;
        segmentBaseRef.current = null;
    }, [activityId]);

    // Stopwatch tick — derived from the start timestamp, so it stays correct across screen open/close.
    useEffect(() => {
        if (status !== WALKING_TYPE.IN_PROGRESS || !start) { return; }
        const id = setInterval(() => {
            const now = new Date().toISOString();
            dispatch(setWalkingMeta({ stopwatch: stopwatchFunction(start, now, pauseDuration), pause: now }));
        }, 1000);
        return () => clearInterval(id);
    }, [status, start, pauseDuration, dispatch]);

    // Mark the activity (and its phase item) done when the step goal is reached, even off-screen.
    const completeOnGoal = useCallback(async (finalSteps: number) => {
        PedometerService.stop();
        const id = activityIdRef.current;
        const now = new Date().toISOString();
        if (id) {
            try {
                await updateActivity({
                    id,
                    pause: now,
                    stepCount: finalSteps,
                    status: WALKING_TYPE.DONE,
                    distance: stepsToMeters(finalSteps),
                }).unwrap();
            } catch {
                // keep the local DONE state even if the persist fails
            }
        }
        const item = sessionItemRef.current;
        const phaseId = sessionPhaseIdRef.current;
        if (item && phaseId) {
            try {
                await updatePhaseItem({
                    phaseId,
                    id: item.id,
                    date: sessionDateRef.current || undefined,
                    data: { status: PHASE_ITEM_STATUS.DONE, id: item.id, type: item.type, title: item.title } as any,
                }).unwrap();
            } catch {
                // optimistic cache update is best-effort; the list resyncs from the server later
            }
        }
        dispatch(setWalkingMeta({ status: WALKING_TYPE.DONE, stepCount: finalSteps, accumulatedSteps: finalSteps }));
    }, [updateActivity, updatePhaseItem, dispatch]);

    // Translate a raw sensor reading into the session step count: baseline the first reading of the
    // segment, add committed steps from prior segments, update progress, finish on goal.
    const onStep = useCallback((steps: number) => {
        if (segmentBaseRef.current === null) { segmentBaseRef.current = steps; }
        const segmentSteps = Math.max(0, steps - segmentBaseRef.current);
        const total = accumulatedRef.current + segmentSteps;
        const goal = activityCountRef.current || 0;
        const reached = goal > 0 && total >= goal;
        const shownSteps = reached ? goal : total;
        const progress = goal > 0 ? Math.min(100, Math.round((total * 100) / goal)) : 0;

        dispatch(setWalkingMeta({
            stepCount: shownSteps,
            goalProgress: progress,
            distance: stepsToMeters(shownSteps),
        }));

        if (reached && !goalReachedRef.current) {
            goalReachedRef.current = true;
            completeOnGoal(shownSteps);
        }
    }, [dispatch, completeOnGoal]);

    const onStepRef = useRef(onStep);
    useEffect(() => { onStepRef.current = onStep; }, [onStep]);

    // Live step counting: one pedometer subscription per in-progress segment, owned here (not the
    // screen) so it survives navigation away from the step counter.
    useEffect(() => {
        if (status !== WALKING_TYPE.IN_PROGRESS || !start) { return; }

        let cancelled = false;
        segmentBaseRef.current = null;

        (async () => {
            const granted = await PedometerService.requestPermission();
            if (cancelled) { return; }
            if (!granted) {
                dispatch(setWalkingMeta({ stepError: 'Step access is off — we\'ll keep timing your walk.' }));
                return;
            }
            dispatch(setWalkingMeta({ stepError: null }));
            PedometerService.start(({ steps }) => {
                if (!cancelled) { onStepRef.current(steps); }
            });
        })();

        return () => {
            cancelled = true;
            PedometerService.stop();
        };
    }, [status, start, dispatch]);
}
