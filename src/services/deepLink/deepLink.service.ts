// NOTE Shared helpers for handling deep links coming either from `Linking`
// (cold start / foreground URL open) or from a push-notification payload
// (`onNotificationOpenedApp` / `getInitialNotification`). Keeping the parsing
// logic in one place avoids subtle mismatches between URL- and push-based
// flows. Mirrors the v1 `deep-link.service.js`.

export const DEEP_LINK_PATH = {
    WEIGHT: '/public/app-redirect/measurements/weight',
    // NOTE No id segment — the API scopes the shopping list to the current
    // patient (`shoppingApi` has no fetch-by-id endpoint), so there is nothing
    // to address in the URL.
    SHOPPING_LIST: '/public/app-redirect/shopping/list',
    // NOTE Prefix for message threads; the actual path also carries a
    // trailing `:id` segment (e.g. `/public/app-redirect/messages/thread/42`).
    MESSAGE_THREAD_PREFIX: '/public/app-redirect/messages/thread',
} as const;

/**
 * Strips scheme + host, query string, trailing slashes and lowercases the
 * result so we can compare URL- and push-payload-derived links uniformly.
 */
export const normalizeDeepLinkPath = (deepLink?: string | null): string => String(deepLink || '')
    .replace(/^[a-z]+:\/\/[^/]+/i, '')
    .replace(/\?.*$/, '')
    .replace(/\/+$/, '')
    .toLowerCase();

export const isWeightDeepLink = (deepLink?: string | null): boolean => (
    Boolean(deepLink) && normalizeDeepLinkPath(deepLink) === DEEP_LINK_PATH.WEIGHT
);

export const isShoppingListDeepLink = (deepLink?: string | null): boolean => (
    Boolean(deepLink) && normalizeDeepLinkPath(deepLink) === DEEP_LINK_PATH.SHOPPING_LIST
);

/**
 * Extract the thread id from a `/messages/thread/:id` deep link.
 * Returns `null` when the link doesn't match the expected shape.
 *
 * Preserves the original id casing — React Navigation's `linking.parse` does
 * the same, so URL- and push-based flows stay consistent.
 */
export const getMessageThreadIdFromDeepLink = (deepLink?: string | null): string | null => {
    if (!deepLink) { return null; }
    const rawPath = String(deepLink)
        .replace(/^[a-z]+:\/\/[^/]+/i, '')
        .replace(/\?.*$/, '')
        .replace(/\/+$/, '');
    const prefix = `${DEEP_LINK_PATH.MESSAGE_THREAD_PREFIX}/`;
    if (rawPath.toLowerCase().indexOf(prefix) !== 0) { return null; }
    const id = rawPath.slice(prefix.length).split('/')[0];
    return id || null;
};

export const isMessageThreadDeepLink = (deepLink?: string | null): boolean => (
    Boolean(getMessageThreadIdFromDeepLink(deepLink))
);

/**
 * Matches the message link with NO thread id attached — plain
 * `/public/app-redirect/messages/thread`.
 *
 * NOTE this is what the backend actually emits for new-message notifications
 * today. There is nothing to open a specific thread with, so callers should land
 * the patient on the message list rather than hand the URL back to the OS (which
 * leaves the app and, without a served AASA, ends up in the App Store).
 */
export const isMessagesSectionDeepLink = (deepLink?: string | null): boolean => (
    Boolean(deepLink) && normalizeDeepLinkPath(deepLink) === DEEP_LINK_PATH.MESSAGE_THREAD_PREFIX
);

// NOTE Push-notification payload shape varies widely between platforms,
// FCM delivery modes (notification / data / mixed) and even between library
// versions. To stay resilient we scan every common container (`data`,
// `userInfo`, `notification`, `aps`) and try to `JSON.parse` string values
// before giving up. Looked-up keys include aliases we have actually seen on
// real payloads: `deepLink`, `deep_link`, `link`, `url`.
const DEEP_LINK_KEYS = [
    'deepLink',
    'deep_link',
    'link',
    'url',
] as const;

const DEEP_LINK_CONTAINERS = [
    'data',
    'userInfo',
    'notification',
    'aps',
] as const;

const pickDeepLink = (source: Record<string, unknown> | null | undefined): string | null => {
    if (!source || typeof source !== 'object') { return null; }
    for (const key of DEEP_LINK_KEYS) {
        const value = (source as Record<string, unknown>)[key];
        if (typeof value === 'string' && value) { return value; }
    }
    return null;
};

const parseMaybeJSON = (value: unknown): Record<string, unknown> | null => {
    if (typeof value !== 'string') { return null; }
    try {
        const parsed = JSON.parse(value);
        return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
    } catch {
        return null;
    }
};

const enqueueChildren = (node: Record<string, unknown>, queue: Array<Record<string, unknown>>): void => {
    DEEP_LINK_CONTAINERS.forEach(key => {
        const child = node[key];
        if (child && typeof child === 'object') { queue.push(child as Record<string, unknown>); }
        // NOTE Some Android payloads deliver `data` as a JSON string.
        const parsed = parseMaybeJSON(child);
        if (parsed) { queue.push(parsed); }
    });
};

/**
 * Walk the notification payload BFS and return the first non-empty deep link
 * string found under any of the known keys/containers.
 */
export const getNotificationDeepLink = (notification: unknown): string | null => {
    if (!notification || typeof notification !== 'object') { return null; }
    const visited = new Set<unknown>();
    const queue: Array<Record<string, unknown>> = [notification as Record<string, unknown>];
    while (queue.length) {
        const node = queue.shift();
        const isTraversable = Boolean(node) && typeof node === 'object' && !visited.has(node);
        if (isTraversable && node) {
            visited.add(node);
            const direct = pickDeepLink(node);
            if (direct) { return direct; }
            enqueueChildren(node, queue);
        }
    }
    return null;
};
