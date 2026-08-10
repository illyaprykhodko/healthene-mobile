// outsource dependencies
import { AppState } from 'react-native';
import { useEffect, useRef } from 'react';
// local dependencies
import { RootState, useAppSelector } from 'store';
import healthSyncService from 'services/health/health-sync.service';

/**
 * Runs the Apple Health / Google Fit import once the patient is signed in, and again when
 * the app comes back to the foreground.
 *
 * NOTE the timing mirrors v1, which kicked the import off on entering the private area and
 * on every wake-up (`src/private-screens/controller.js`) — that is what made a fresh
 * weigh-in show up without the patient doing anything. The service itself decides whether
 * there is anything to do: it returns immediately when health sync is switched off (the
 * default), when the platform has no health app, or when it already ran in the last few
 * minutes.
 */
export const useHealthSync = (): void => {
    const isAuthenticated = useAppSelector((state: RootState) => state.app.auth);
    const isAuthenticatedRef = useRef(isAuthenticated);

    isAuthenticatedRef.current = isAuthenticated;

    useEffect(() => {
        if (!isAuthenticated) { return; }

        void healthSyncService.runImport({ force: true });

        const subscription = AppState.addEventListener('change', nextState => {
            // NOTE the listener outlives a logout that happens while it is attached, hence
            // the ref check rather than the captured value.
            if (nextState === 'active' && isAuthenticatedRef.current) {
                void healthSyncService.runImport();
            }
        });

        return () => { subscription.remove(); };
    }, [isAuthenticated]);
};
