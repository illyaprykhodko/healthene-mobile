const parseVersionPart = (part: string): number => {
    const normalizedPart = part.trim();
    const match = normalizedPart.match(/\d+/);
    return match ? Number(match[0]) : 0;
};

const normalizeVersion = (version: string): number[] => {
    return version.split('.').map(parseVersionPart);
};

export const compareVersions = (current: string, target: string): number => {
    const currentParts = normalizeVersion(current);
    const targetParts = normalizeVersion(target);
    const maxLength = Math.max(currentParts.length, targetParts.length);

    for (let index = 0; index < maxLength; index += 1) {
        const currentPart = currentParts[index] ?? 0;
        const targetPart = targetParts[index] ?? 0;

        if (currentPart > targetPart) { return 1; }
        if (currentPart < targetPart) { return -1; }
    }

    return 0;
};
