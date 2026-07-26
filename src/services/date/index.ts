/**
 * Centralized date/time service.
 *
 * All app date logic goes through this single configured `dayjs` instance so that
 * plugin registration and (future) time-zone policy live in one place instead of being
 * scattered across screens. Replaces the previously used `moment` (maintenance mode).
 *
 * Time-zone note (US, multiple zones): behaviour is intentionally unchanged from the
 * moment implementation — dates are handled in the device's local zone. The `utc` and
 * `timezone` plugins are pre-registered here so an explicit time-zone policy (device /
 * clinic / profile zone) can later be introduced in this module without touching call sites.
 *
 * Author: Viktor
 */
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';
import updateLocale from 'dayjs/plugin/updateLocale';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import customParseFormat from 'dayjs/plugin/customParseFormat';

// utc must be extended before timezone (timezone depends on it).
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.extend(advancedFormat);
dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);
dayjs.extend(updateLocale);

// Weeks start on Monday across the app (previously set ad-hoc via moment.updateLocale in
// the Day Overview screen; centralized here so week math is consistent regardless of which
// screen mounts first).
dayjs.updateLocale('en', { weekStart: 1 });

export default dayjs;
