// local dependencies
// Pure helpers for the walking step-counter session (shared by the screen and the app-level controller).

/**
 * Format elapsed wall-clock time as HH:MM.SS, derived from the session start/end timestamps minus
 * any paused duration. Computing from timestamps (not a tick counter) keeps the value correct even
 * if no interval ran for a while (e.g. the screen was closed).
 */
export function stopwatchFunction (start: string, end = new Date().toISOString(), pauseDuration = 0): string {
    const diffMs = Math.max(0, new Date(end).getTime() - new Date(start).getTime() - pauseDuration);
    const totalSec = Math.floor(diffMs / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}.${String(s).padStart(2, '0')}`;
}

/** Approximate miles walked from a step count (avg stride 0.762 m). */
export function stepsToMiles (steps: number): string {
    const miles = (steps * 0.762) / 1609.34;
    return miles.toFixed(2);
}

/** Approximate distance in metres from a step count (matches the value persisted to the backend). */
export function stepsToMeters (steps: number): number {
    return Math.round(steps * 0.762);
}
