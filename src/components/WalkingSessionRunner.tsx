// local dependencies
import { useWalkingSession } from 'hooks/useWalkingSession';

/**
 * Headless component that keeps the walking step-counter session (stopwatch + pedometer) running
 * app-wide while it is IN_PROGRESS, independent of the WalkingActivity screen being mounted.
 * Mounted once near the app root.
 */
export function WalkingSessionRunner (): null {
    useWalkingSession();
    return null;
}
