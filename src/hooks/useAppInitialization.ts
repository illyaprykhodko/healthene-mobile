// outsource dependencies
import { useEffect, useState } from 'react';
// local dependencies
import { useCheckHealthQuery } from '../store/api/authApi';
import { RootState, useAppDispatch, useAppSelector } from '../store';
import { setInitialized, setHealth, setAuth } from '../store/slices/appSlice';

export const useAppInitialization = () => {
    const dispatch = useAppDispatch();
    const [isInitializing, setIsInitializing] = useState(true);
    
    const { data: health, error: healthError } = useCheckHealthQuery();
    
    // const { data: user, error: sessionError, isLoading: sessionLoading } = useRestoreSessionQuery();
    const { accessToken: session } = useAppSelector((state: RootState) => state.app);

    useEffect(() => {
        const initializeApp = async () => {
            try {
                // set health status
                dispatch(setHealth(!!health && health.status === 'UP'));
                
                // if user - session restored successfully
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
    }, [health, healthError, dispatch, session]);

    return {
        health,
        healthError,
        isInitializing,
    };
};
