// outsource dependencies
import React, { createContext, useCallback, useContext, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
// local dependencies
import { RewardStarOverlay } from './RewardStarOverlay';

export interface RewardStarController {
    /** Window coordinates of checkbox center (from measureInWindow). */
    scheduleRewardFromCheckboxCenter: (cx: number, cy: number) => void;
}

const RewardStarContext = createContext<RewardStarController | null>(null);

export function useRewardStar (): RewardStarController | null {
    return useContext(RewardStarContext);
}

export function RewardStarProvider ({ children }: { children: React.ReactNode }) {
    const flightHandlerRef = useRef<((cx: number, cy: number) => void) | null>(null);

    const scheduleRewardFromCheckboxCenter = useCallback((cx: number, cy: number) => {
        flightHandlerRef.current?.(cx, cy);
    }, []);

    const value: RewardStarController = { scheduleRewardFromCheckboxCenter };

    return (
        <RewardStarContext.Provider value={value}>
            <View style={styles.flex}>
                {children}
                <RewardStarOverlay flightHandlerRef={flightHandlerRef} />
            </View>
        </RewardStarContext.Provider>
    );
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
});
