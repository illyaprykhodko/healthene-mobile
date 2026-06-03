// outsource dependencies
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

interface ReviewAlertContextValue {
    sessionId: number;
    markShown: () => void;
    hasShown: () => boolean;
    resetSession: () => void;
}

const ReviewAlertContext = createContext<ReviewAlertContextValue | null>(null);

export const ReviewAlertProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const [sessionId, setSessionId] = useState(0);
    const shownRef = useRef(false);

    const resetSession = useCallback(() => {
        shownRef.current = false;
        setSessionId(id => id + 1);
    }, []);

    const value = useMemo<ReviewAlertContextValue>(() => ({
        sessionId,
        hasShown: () => shownRef.current,
        markShown: () => { shownRef.current = true; },
        resetSession,
    }), [sessionId, resetSession]);

    return (
        <ReviewAlertContext.Provider value={value}>
            {children}
        </ReviewAlertContext.Provider>
    );
};

export const useReviewAlert = (): ReviewAlertContextValue => {
    const ctx = useContext(ReviewAlertContext);
    if (!ctx) {
        throw new Error('useReviewAlert must be used within ReviewAlertProvider');
    }
    return ctx;
};
