// outsource dependencies
import { Linking, Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// local dependencies
import { config } from 'constants';
import { useAppState } from 'hooks/useAppState';
import { compareVersions } from 'utils/version';
import { MobileUpdateConfig, UpdatePolicy } from 'types';
import { useGetUpdatePolicyQuery } from 'store/api/publicApi';

type UpdateMode = 'none' | 'soft' | 'force';

const SOFT_UPDATE_STATE_KEY = 'soft_update_prompt_state';

interface SoftUpdatePromptState {
    version: string;
    dismissedAt: number;
}

const mockUpdatePolicy: MobileUpdateConfig = {
    ios: {
        minSupportedVersion: '1.0',
        title: 'Update Available',
        recommendedVersion: '1.0.8',
        storeUrl: config.iosStoreUrl,
        forceTitle: 'Update Required',
        message: 'A new version of the app is available.',
        forceMessage: 'Please update the app to continue.',
    },
    android: {
        title: 'Update Available',
        recommendedVersion: '0.0.1',
        minSupportedVersion: '0.0.1',
        forceTitle: 'Update Required',
        storeUrl: config.androidStoreUrl,
        message: 'A new version of the app is available.',
        forceMessage: 'Please update the app to continue.',
    },
};

const getPolicyByPlatform = (policy: MobileUpdateConfig): UpdatePolicy => {
    return Platform.OS === 'ios' ? policy.ios : policy.android;
};

export const useAppUpdateGate = () => {
    const appState = useAppState();
    const [promptState, setPromptState] = useState<SoftUpdatePromptState | null>(null);
    const [isPromptStateLoading, setIsPromptStateLoading] = useState(true);
    const [isSoftVisible, setIsSoftVisible] = useState(false);
    const isLaunchEvaluationPendingRef = useRef(true);
    const currentVersion = DeviceInfo.getVersion();
    const isUsingMockPolicy = config.updatePolicyMockEnabled;

    const {
        refetch,
        data: backendPolicy,
        isLoading: isBackendPolicyLoading,
        isFetching: isBackendPolicyFetching,
    } = useGetUpdatePolicyQuery(undefined, { skip: isUsingMockPolicy });

    useEffect(() => {
        const restorePromptState = async () => {
            try {
                const rawState = await AsyncStorage.getItem(SOFT_UPDATE_STATE_KEY);
                if (!rawState) {
                    setPromptState(null);
                    return;
                }

                const parsed = JSON.parse(rawState) as Partial<SoftUpdatePromptState>;
                if (
                    typeof parsed.version === 'string'
                    && typeof parsed.dismissedAt === 'number'
                ) {
                    setPromptState(parsed as SoftUpdatePromptState);
                    return;
                }

                setPromptState(null);
            } catch {
                setPromptState(null);
            } finally {
                setIsPromptStateLoading(false);
            }
        };

        restorePromptState();
    }, []);

    useEffect(() => {
        if (!isUsingMockPolicy && appState === 'active') {
            refetch();
        }
    }, [appState, isUsingMockPolicy, refetch]);

    const selectedPolicy = useMemo(() => {
        const sourcePolicy = isUsingMockPolicy ? mockUpdatePolicy : backendPolicy;
        if (!sourcePolicy) { return null; }
        return getPolicyByPlatform(sourcePolicy);
    }, [backendPolicy, isUsingMockPolicy]);

    const mode = useMemo<UpdateMode>(() => {
        if (!selectedPolicy) { return 'none'; }

        if (compareVersions(currentVersion, selectedPolicy.minSupportedVersion) < 0) {
            return 'force';
        }

        if (compareVersions(currentVersion, selectedPolicy.recommendedVersion) < 0) {
            return 'soft';
        }

        return 'none';
    }, [currentVersion, selectedPolicy]);

    useEffect(() => {
        if (mode === 'force') {
            setIsSoftVisible(false);
            isLaunchEvaluationPendingRef.current = false;
            return;
        }

        if (!selectedPolicy || isPromptStateLoading || mode !== 'soft') {
            setIsSoftVisible(false);
            return;
        }

        // if (isPromptStateLoading) {
        //     return;
        // }

        // if (mode !== 'soft') {
        //     setIsSoftVisible(false);
        //     return;
        // }

        const currentTime = Date.now();
        const cooldownMs = Math.max(config.softUpdateCooldownHours, 0) * 60 * 60 * 1000;
        const wasDismissedForThisVersion = promptState?.version === selectedPolicy.recommendedVersion;
        const isCooldownExpired = wasDismissedForThisVersion
            ? (currentTime - (promptState?.dismissedAt ?? 0)) >= cooldownMs
            : true;
        const shouldShowOnLaunch = config.softUpdateShowOnLaunch
            && isLaunchEvaluationPendingRef.current;
        isLaunchEvaluationPendingRef.current = false;

        if (shouldShowOnLaunch || isCooldownExpired) {
            setIsSoftVisible(true);
            return;
        }

    }, [isPromptStateLoading, isSoftVisible, mode, promptState, selectedPolicy]);

    const onSoftCancel = useCallback(async () => {
        if (!selectedPolicy) { return; }

        const nextPromptState: SoftUpdatePromptState = {
            version: selectedPolicy.recommendedVersion,
            dismissedAt: Date.now(),
        };

        await AsyncStorage.setItem(SOFT_UPDATE_STATE_KEY, JSON.stringify(nextPromptState));
        setPromptState(nextPromptState);
        setIsSoftVisible(false);
    }, [selectedPolicy]);

    const openStore = useCallback(async () => {
        if (!selectedPolicy?.storeUrl) { return; }
        await Linking.openURL(selectedPolicy.storeUrl);
    }, [selectedPolicy]);

    return {
        openStore,
        onSoftCancel,
        isSoftVisible,
        softPolicy: mode === 'soft' ? selectedPolicy : null,
        forcePolicy: mode === 'force' ? selectedPolicy : null,
        isCheckingPolicy: isPromptStateLoading || isBackendPolicyLoading || isBackendPolicyFetching,
    };
};
