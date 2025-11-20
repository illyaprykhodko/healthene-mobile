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

export { groupBy, isEmpty, size, sortBy };
