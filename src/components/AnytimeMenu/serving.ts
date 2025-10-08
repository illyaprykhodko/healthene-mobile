// Serving helpers for multi-amount items (foods/drinks)

export interface ServingUnit {
    id: string;
    amount: number; // e.g. 1 or a fraction like 0.25
}

export interface ServingState {
    integerConsumed: number;
    decimalConsumed: number; // 0 if no decimal consumed
}

export const splitAmountToServings = (amount: number): ServingUnit[] => {
    const result: ServingUnit[] = [];
    if (!Number.isFinite(amount) || amount <= 0) { return result; }
    const integer = Math.floor(amount);
    const decimal = amount % 1;
    for (let i = 0; i < integer; i++) {
        result.push({ id: `int-${i}`, amount: 1 });
    }
    if (decimal > 0) {
        result.push({ id: 'dec', amount: decimal });
    }
    return result;
};

export const getServingState = (consumedAmount: number): ServingState => {
    const safe = Math.max(0, consumedAmount || 0);
    return {
        integerConsumed: Math.trunc(safe),
        decimalConsumed: safe % 1,
    };
};

export const isServingEnabled = (index: number, unitAmount: number, state: ServingState): boolean => {
    const isDecimal = unitAmount < 1;
    if (isDecimal) { return true; }
    return index <= state.integerConsumed;
};

export const isServingDone = (index: number, unitAmount: number, state: ServingState): boolean => {
    const isDecimal = unitAmount < 1;
    if (isDecimal) { return state.decimalConsumed === unitAmount; }
    return state.integerConsumed >= index + 1;
};

export const applyServingToggle = (currentConsumed: number, toggleAmount: number, maxAmount: number, isCurrentlyDone: boolean): number => {
    const delta = isCurrentlyDone ? -toggleAmount : toggleAmount;
    return Math.max(0, Math.min(maxAmount, (currentConsumed || 0) + delta));
};
