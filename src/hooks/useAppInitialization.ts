// outsource dependencies
import { useEffect, useRef, useState } from 'react';
// local dependencies
import { RootState, useAppDispatch, useAppSelector } from '../store';
import { setInitialized, setHealth, setAuth, setUser } from '../store/slices/appSlice';
import { authApi, useCheckHealthQuery, useRestoreSessionQuery } from '../store/api/authApi';

export const useAppInitialization = () => {
    const dispatch = useAppDispatch();
    const [isInitializing, setIsInitializing] = useState(true);
    const isHealthy = useAppSelector((state: RootState) => state.app.health);
    
    const {
        data: health,
        error: healthError,
        isLoading: isHealthLoading,
        isFetching: isHealthFetching,
        isUninitialized: isHealthUninitialized,
    } = useCheckHealthQuery();
    const { data: user } = useRestoreSessionQuery();

    // NOTE `resetStore` (logout) wipes the RTK Query slice through the root reducer instead of
    // going through `authApi.util.resetApiState()`, so this hook's subscription bookkeeping is
    // destroyed without the hook being notified: the query drops back to `uninitialized` and
    // never re-issues `/actuator/health` on its own. `refetch()` cannot help here — RTK Query
    // refuses to refetch a query that was never started — so re-initiate it directly.
    // Only react to a *return* to `uninitialized`, otherwise the initial render (which is
    // legitimately uninitialized until the hook's own effect starts the query) would fire a
    // second request on every cold start.
    // TODO drop this once `resetStore` uses `api.util.resetApiState()` for every api slice.
    const wasHealthStarted = useRef(false);
    useEffect(() => {
        if (!isHealthUninitialized) {
            wasHealthStarted.current = true;
            return;
        }
        if (wasHealthStarted.current) {
            wasHealthStarted.current = false;
            dispatch(authApi.endpoints.checkHealth.initiate(undefined, { forceRefetch: true }));
        }
    }, [isHealthUninitialized, dispatch]);

    const { accessToken: session } = useAppSelector((state: RootState) => state.app);
    useEffect(() => {
        const initializeApp = async () => {
            try {
                // set health status
                dispatch(setHealth(!!health && health.status === 'UP'));
                
                // if user - session restored successfully
                if (user) {
                    dispatch(setUser(user));
                    dispatch(setAuth(true));
                }
                if (session) {
                    // dispatch(setUser(user));
                    dispatch(setAuth(true));
                }
                
                // mark app as initialized
                dispatch(setInitialized(true));
                setIsInitializing(false);
                
            } catch (error) {
                console.error('App initialization failed:', error);
                dispatch(setInitialized(true));
                setIsInitializing(false);
            }
        };

        // wait for health check and session restoration to complete
        if (!session && (health !== undefined || healthError)) {
            initializeApp();
        }
    }, [health, healthError, dispatch, session, user]);

    return {
        health,
        isHealthy,
        healthError,
        isInitializing,
        isHealthLoading: isHealthLoading || isHealthFetching,
    };
};
