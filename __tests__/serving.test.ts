import { splitAmountToServings, getServingState, isServingEnabled, isServingDone, applyServingToggle } from '../src/components/AnytimeMenu/serving';

describe('serving helpers', () => {
    test('splitAmountToServings for 3.25', () => {
        const servings = splitAmountToServings(3.25);
        expect(servings).toHaveLength(4);
        expect(servings[0].amount).toBe(1);
        expect(servings[3].amount).toBeCloseTo(0.25);
    });

    test('getServingState computes integers and decimals', () => {
        const s1 = getServingState(0);
        expect(s1).toEqual({ integerConsumed: 0, decimalConsumed: 0 });
        const s2 = getServingState(2.5);
        expect(s2.integerConsumed).toBe(2);
        expect(s2.decimalConsumed).toBeCloseTo(0.5);
    });

    test('sequential enabling mirrors legacy rule', () => {
        const state = getServingState(1);
        // index 0 (first 1) enabled and done
        expect(isServingEnabled(0, 1, state)).toBe(true);
        expect(isServingDone(0, 1, state)).toBe(true);
        // index 1 enabled (can consume second), but not done
        expect(isServingEnabled(1, 1, state)).toBe(true);
        expect(isServingDone(1, 1, state)).toBe(false);
        // index 2 disabled
        expect(isServingEnabled(2, 1, state)).toBe(false);
    });

    test('fractional serving is independently toggleable', () => {
        const state = getServingState(3);
        // fraction 0.25 is enabled
        expect(isServingEnabled(3, 0.25, state)).toBe(true);
        // not done until decimalConsumed equals unit amount
        expect(isServingDone(3, 0.25, state)).toBe(false);
    });

    test('applyServingToggle clamps within [0, max] and toggles correctly', () => {
        // toggle on
        const next1 = applyServingToggle(1, 1, 3.25, false);
        expect(next1).toBe(2);
        // toggle off
        const next2 = applyServingToggle(2, 1, 3.25, true);
        expect(next2).toBe(1);
        // clamp to max
        const next3 = applyServingToggle(3.2, 0.5, 3.25, false);
        expect(next3).toBeCloseTo(3.25);
        // clamp to 0
        const next4 = applyServingToggle(0, 1, 3.25, true);
        expect(next4).toBe(0);
    });
});


