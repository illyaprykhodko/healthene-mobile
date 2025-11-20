import { decimalsToFractions } from 'services/filter';

interface PrepareIngredientOptions {
    withoutAmount?: boolean;
    withoutName?: boolean;
}

interface PrepareIngredientParams {
    serving?: any;
    amount?: number;
    ingredient?: any;
    useServing?: boolean;
    peopleEatingNumber?: number;
}

/**
 * @description prepare ingredient name with unit
 * @example prepareIngredientNameWithUnit({ ingredient, amount: 1 }, { withoutAmount: false })
 * @param params - Ingredient parameters
 * @param options - Formatting options
 * @returns Formatted string
 */
export function prepareIngredientNameWithUnit (
    params: PrepareIngredientParams,
    options: PrepareIngredientOptions = {}
): string {
    const {
        serving,
        amount = 1,
        ingredient,
        useServing = false,
        peopleEatingNumber = 1,
    } = params;

    const { withoutAmount = false, withoutName = false } = options;

    let unitSingularName: string;
    let unitPluralName: string;

    if (useServing) {
        // use recipe serving
        unitSingularName = serving?.singularName || 'serving';
        unitPluralName = serving?.pluralName || 'servings';
    } else {
        // use ingredient serving
        unitSingularName = ingredient?.weight?.unit?.singularName || 'serving';
        unitPluralName = ingredient?.weight?.unit?.pluralName || 'servings';
    }

    const unit = amount > 1 ? unitPluralName : unitSingularName;

    let resultString: string;
    if (withoutName) {
        const excludeWord = /\s(of)\b/gi;
        if (excludeWord.test(unit)) {
            resultString = unit.replace(excludeWord, '');
        } else {
            resultString = unit;
        }
    } else {
        const name
            = amount > 1
                ? ingredient?.entity?.pluralName || ''
                : ingredient?.entity?.singularName || '';
        resultString = `${unit} ${name}`;
    }

    if (!withoutAmount) {
        const calculateAmount = peopleEatingNumber > 1 ? amount * peopleEatingNumber : amount;
        resultString = `${decimalsToFractions(calculateAmount)} ${resultString}`;
    }

    return resultString;
}
