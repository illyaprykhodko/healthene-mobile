export interface UpdatePolicy {
    title?: string;
    message: string;
    storeUrl: string;
    forceTitle?: string;
    forceMessage: string;
    recommendedVersion: string;
    minSupportedVersion: string;
}

export interface MobileUpdateConfig {
    ios: UpdatePolicy;
    updatedAt?: string;
    android: UpdatePolicy;
}
