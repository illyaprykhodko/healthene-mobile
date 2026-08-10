// outsource dependencies
import { AppState } from 'react-native';
import { useEffect, useRef } from 'react';
// local dependencies
import { messengerApi } from 'store/api/messengerApi';
import { RootState, useAppDispatch, useAppSelector } from 'store';

/**
 * Marks the messenger caches stale whenever the app comes back to the foreground.
 *
 * NOTE push notifications alone cannot keep the messenger fresh. Our code only runs on arrival
 * while the app is in the foreground (`onMessage`); a backgrounded app is woken only if the
 * payload carries `content-available`, and iOS throttles those, drops them after a force-quit
 * and suppresses them in Low Power Mode. On top of that a message can appear without any push
 * at all — notifications denied, delivery lost, or the patient reading it in the web app.
 *
 * Refreshing on foreground covers every one of those cases and needs nothing from the backend.
 * It is deliberately scoped to the messenger rather than enabling RTK Query's global
 * `refetchOnFocus`, which would refetch every active query in the app on each return.
 *
 * Invalidation is cheap when nobody is looking: a request goes out only if a messenger screen
 * is currently subscribed, otherwise the entry simply refetches the next time one mounts.
 */
export const useMessengerFreshness = (): void => {
    const dispatch = useAppDispatch();
    const isAuthenticated = useAppSelector((state: RootState) => state.app.auth);
    const isAuthenticatedRef = useRef(isAuthenticated);

    isAuthenticatedRef.current = isAuthenticated;

    useEffect(() => {
        if (!isAuthenticated) { return; }

        const subscription = AppState.addEventListener('change', nextState => {
            // NOTE the listener outlives a logout that happens while it is attached, hence the
            // ref check rather than the captured value.
            if (nextState === 'active' && isAuthenticatedRef.current) {
                dispatch(messengerApi.util.invalidateTags(['ListOfChain', 'ChanMessages']));
            }
        });

        return () => { subscription.remove(); };
    }, [isAuthenticated, dispatch]);
};
