function groupBy<T, K extends keyof T> (array: T[], key: K): Record<string, T[]> {
    return array.reduce((acc, item) => {
        const group = String(item[key] ?? 'undefined');
        (acc[group] ||= []).push(item);
        return acc;
    }, {} as Record<string, T[]>);
}

function isEmpty (value: any): boolean {
    if (value == null) { return true; }
    if (typeof value === 'string') { return value.length === 0; }
    if (Array.isArray(value)) { return value.length === 0; }
    if (typeof value === 'object') { return Object.keys(value).length === 0; }
    return false;
}

function size<T> (value: T): number {
    if (value == null) { return 0; }

    if (Array.isArray(value) || typeof value === 'string') {
        return value.length;
    }

    if (typeof value === 'object') {
        return Object.keys(value).length;
    }

    return 0;
}

function sortBy<T> (array: T[] | undefined | null, key: keyof T): T[] {
    if (!array) { return []; }

    return [...array].sort((a, b) => {
        const av = a[key];
        const bv = b[key];

        if (av == null && bv == null) { return 0; }
        if (av == null) { return 1; }
        if (bv == null) { return -1; }

        if (av < bv) { return -1; }
        if (av > bv) { return 1; }
        return 0;
    });
}

// --------------------
// get
// --------------------
type PathSegment = string | number;

function toPath (path: string | PathSegment[]): PathSegment[] {
    if (Array.isArray(path)) { return path; }

    return path
        .replace(/\[(\d+)\]/g, '.$1') // convert [0] to .0
        .split('.')
        .filter(Boolean)
        .map(seg => (Number.isFinite(Number(seg)) ? Number(seg) : seg));
}

function get<T, R = unknown> (
    obj: T,
    path: string | PathSegment[],
    defaultValue?: R,
): R | undefined {
    if (obj == null) { return defaultValue; }

    const segments = toPath(path);
    let current: any = obj;

    for (const key of segments) {
        if (current == null) { return defaultValue; }
        current = current[key as keyof typeof current];
    }

    return (current === undefined ? defaultValue : current) as R | undefined;
}

function uniqBy<T, K extends keyof T> (array: T[], key: K): T[] {
    const seen = new Set<unknown>();
    const result: T[] = [];

    for (const item of array) {
        const value = item[key];
        if (!seen.has(value)) {
            seen.add(value);
            result.push(item);
        }
    }

    return result;
}

function flatten<T> (array: T[][]): T[] {
    const result: T[] = [];
    for (const inner of array) {
        result.push(...inner);
    }
    return result;
}

function chunk<T> (array: T[], size: number): T[][] {
    if (size <= 0) { return [[]]; }

    const result: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
    }
    return result;
}

export interface DebounceOptions {
    leading?: boolean;
    trailing?: boolean;
    maxWait?: number;
}

function debounce<F extends (...args: any[]) => any>(
    func: F,
    wait = 0,
    options: DebounceOptions = {}
) {
    let lastArgs: any;
    let lastThis: any;
    let result: any;
    let timerId: ReturnType<typeof setTimeout> | null = null;
    let lastCallTime: number | null = null;
    let lastInvokeTime = 0;

    const { leading = false, trailing = true, maxWait } = options;

    function invokeFunc (time: number) {
        lastInvokeTime = time;
        const args = lastArgs;
        const thisArg = lastThis;

        lastArgs = lastThis = null;
        result = func.apply(thisArg, args);
        return result;
    }

    function startTimer (timerCallback: () => void, ms: number) {
        return setTimeout(timerCallback, ms);
    }

    function remainingWait (time: number) {
        const timeSinceLastCall = time - (lastCallTime ?? 0);
        const timeSinceLastInvoke = time - lastInvokeTime;
        const timeWaiting = wait - timeSinceLastCall;

        return maxWait !== undefined
            ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
            : timeWaiting;
    }

    function shouldInvoke (time: number) {
        if (lastCallTime === null) { return true; }
        const timeSinceLastCall = time - lastCallTime;
        const timeSinceLastInvoke = time - lastInvokeTime;

        return (
            timeSinceLastCall >= wait
            || timeSinceLastCall < 0
            || (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
        );
    }

    function timerExpired () {
        const time = Date.now();
        if (shouldInvoke(time)) {
            return trailingEdge(time);
        }
        timerId = startTimer(timerExpired, remainingWait(time));
    }

    function trailingEdge (time: number) {
        timerId = null;

        if (trailing && lastArgs) {
            return invokeFunc(time);
        }

        lastArgs = lastThis = null;
        return result;
    }

    function debounced (this: any, ...args: any[]) {
        const time = Date.now();
        const isInvoking = shouldInvoke(time);

        lastArgs = args;
        lastThis = this;
        lastCallTime = time;

        if (isInvoking) {
            if (timerId === null) {
                if (leading) {
                    return invokeFunc(lastCallTime);
                }
                timerId = startTimer(timerExpired, wait);
            } else if (maxWait !== undefined) {
                // Handle maxWait
                timerId = startTimer(timerExpired, wait);
                return invokeFunc(time);
            }
        }

        if (timerId === null) {
            timerId = startTimer(timerExpired, wait);
        }

        return result;
    }

    debounced.cancel = () => {
        if (timerId) {
            clearTimeout(timerId);
        }
        lastInvokeTime = 0;
        lastArgs = lastCallTime = lastThis = timerId = null;
    };

    debounced.flush = () => {
        if (timerId === null) { return result; }
        return trailingEdge(Date.now());
    };

    return debounced as F & {
        cancel: () => void;
        flush: () => void;
    };
}

function throttle<F extends (...args: any[]) => void>(
    fn: F,
    wait: number,
    options?: { leading?: boolean; trailing?: boolean },
) {
    let lastCallTime = 0;
    let timeout: ReturnType<typeof setTimeout> | null = null;
    let lastArgs: Parameters<F> | null = null;

    const leading = options?.leading ?? true;
    const trailing = options?.trailing ?? true;

    const invoke = (time: number, args: Parameters<F>) => {
        lastCallTime = time;
        fn(...args);
    };

    const throttled = (...args: Parameters<F>) => {
        const now = Date.now();

        if (!lastCallTime && !leading) {
            lastCallTime = now;
        }

        const remaining = wait - (now - lastCallTime);
        lastArgs = args;

        if (remaining <= 0 || remaining > wait) {
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
            invoke(now, args);
        } else if (!timeout && trailing) {
            timeout = setTimeout(() => {
                timeout = null;
                if (!leading) {
                    lastCallTime = 0;
                } else {
                    lastCallTime = Date.now();
                }
                if (lastArgs) {
                    invoke(Date.now(), lastArgs);
                    lastArgs = null;
                }
            }, remaining);
        }
    };

    throttled.cancel = () => {
        if (timeout) { clearTimeout(timeout); }
        timeout = null;
        lastArgs = null;
        lastCallTime = 0;
    };

    return throttled as F & { cancel: () => void };
}

export { groupBy, isEmpty, size, sortBy, get, uniqBy, flatten, chunk, debounce, throttle };
