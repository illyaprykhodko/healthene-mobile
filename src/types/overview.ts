import { EntityType } from 'constants/spec';
import { CoverImage } from './common/interfaces';
import { AlgorithmSetting, CookingMethod, CookingMethodType, InitialStateTag, PlantType, RescueTag, ShoppingCartCategory, StateTag, Tag } from './meal';

enum Status {
    DONE = 'DONE',
    PENDING = 'PENDING',
    INCOMPLETE = 'INCOMPLETE',
    DID_NOT_EAT = 'DID_NOT_EAT',
}
// DayOverviewRecipeItem

export interface DayOverviewMeal extends Meal {
    // base Meal: id, name, order
    coverImage: CoverImage | null;
    type: 'MEAL';
    status: Status;
    peopleEatingNumber: number;
  }
  
export interface Phase {
    id: number;
    order: number;
    meal: DayOverviewMeal;
    items: PhaseItem[];
  }

export type AddPhaseItemData = {
    activityCount: number,
    activityCountUnit: 'STEP' | string,
    amount: number,
    food: {
      id: number
    },
    initialAmount: number,
    measurement: {
      id: number
    },
    physicalActivity: {
      id: number
    },
    question: {
      id: number
    },
    rating: number,
    recipe: {
      id: number
    },
    section: string,
    status: 'DID_NOT_EAT' | 'DONE' | 'INCOMPLETE' | 'PENDING',
    substanceType: 'DRINK' | 'FOOD',
    supplement: {
      id: number
    },
    type:
    'ATTACHMENT'
    | 'MEAL'
    | 'ANYTIME'
    | 'FOOD'
    | 'ITEMS_CATEGORY'
    |'ADDED_BY_PATIENT'
    | 'MEASUREMENT'
    | 'MEDICATION'
    | 'PHYSICAL_ACTIVITY'
    | 'QUESTION'
    | 'RECIPE'
    | 'RECIPE_TEMPLATE'
    | 'RESPONSE'
    | 'SUPPLEMENT'
    | 'CUSTOM_RECIPE'
    | 'TEXT',
    weight: {
      id: number
    },
    medication: {
        id: number
      },
      modified: boolean,
      order: number,
      phase: {
        id: number
      },
  }
export type PhaseType =
  | 'MEAL'
  | 'ANYTIME'
  | 'QUESTION'
  | 'SUPPLEMENT'
  | 'MEDICATION'
  | 'MEASUREMENT'
  | 'ADDED_BY_PATIENT'
  | 'PHYSICAL_ACTIVITY';
export interface PhaseItem {
    food?: any;
    type: AddPhaseItemData['type'];
    sortKey?: number;
    title: string;
    amount?: number;
    rating: number | null;
    phaseId?: string | number;
    measurement?: any;
    medication?: any;
    supplement?: any;
    physicalActivity?: any;
    initialAmount?: number;
    substanceType?: string;
    weight?: {
        unit: {
            name: string;
        };
    };
    useServing?: boolean;
    id: number | string;
    order: number;
    status: AddPhaseItemData['status'];
    section: string | null; // "Cold Beverage"

    phase: {
        id: number | string;
    };
    serving: ServingInfo | null;

    recipe: {
        id: number;
        name: string;
        ingredients: Ingredient[];
        steps: Step[];
        serving: ServingInfo;
        coverImage: CoverImage;
        tags: Tag[];
        states: StateTag[];
        initialStates: InitialStateTag[];
        rescueTags: RescueTag[];
        surrogateRecipe: boolean;
    } | null;

    patientFoodCategoryAttachment: PatientFoodCategoryAttachment | null;
    patientFoodCategoryQuestion: PatientFoodCategoryQuestion | null;

    peopleEatingNumber: number;
    modified: boolean;
    recipeOilyFishProteinReplaced: boolean;
}

/** phase */
// export interface PhaseInfo {
//     id: number;
// }

// export interface Phase {
//     type: string;
//     name?: string;
//     items?: any[];
//     order?: number;
//     status?: string;
//     id: number | string;
//     meal?: { name: string };
//     measurement?: { measurement: { name: string } };
// }

export interface ServingInfo {
    id: number | null;
    name: string | null;          // "cup (8 fl oz)"
    singularName: string | null;  // "cup (8 oz)"
    pluralName: string | null;    // "cups (8 oz)"
    order: number | null;
    useServing: boolean;
    activityCount: number | null;
}

export interface Step {
    id: number;
    name:null | string;
    order: number;
    content: string;
    unparsedContent: string;
}

export interface Meal {
    id: number;
    name: string;
    order: number;
}

export enum DishType {
    DISH = 'DISH',
}

export interface Dish {
    id: number;
    name: string;
    order: number;
    type: DishType | string;
    disabled: boolean;
}

export enum CuisineType {
    CUISINE = 'CUISINE',
}

export interface Cuisine {
    id: number;
    name: string;
    order: number;
    type: CuisineType | string;
    disabled: boolean
}

export enum PreparationTimeType {
    PREPARATION_TIME = 'PREPARATION_TIME',
}

export enum DifficultyType {
    DIFFICULTY = 'DIFFICULTY',
}

export interface PatientRecipe {
    id: number;
name: string;
unparsedName: string;
surrogateRecipe: boolean;
substanceType: string;
attachedItems: unknown[];
tags: Tag[];
videoUrl: null | string;
servingAmount: number;
euclideanDistanceToMainRecipe: number | null;
commonCuisinesExists: boolean | null;
modified: boolean;
dictionaryForName: Record<string, string>;
dictionaryForSteps: Record<string, string>;
steps: Step[];
ingredients: Ingredient[];
meals: Meal[];
dishes: Dish[];
cuisines: Cuisine[];
serving: RecipeServingMeta;
cookMethod: {
    // id:10596
    id: number;
    name: string;
order: number;
type: CookingMethodType | string;
disabled: boolean;
};
preparationTime: {
    id: number;
name: string;
order: number;
type: PreparationTimeType | string;
disabled: boolean;
}
difficulty: {
    // id:9387
    id: number;
name: string;
order: number;
type: DifficultyType | string;
disabled: boolean;
}
coverImage: CoverImage;
}

export interface IngredientWeight {
    id: number;
    unit:{
        id: number;
        name: string;
        singularName: string;
        pluralName: string;
        weightInGrams: number | null;
    }
    amount: number;
    gramWeight: number;
    enabled: boolean;
    isDefault: boolean;
    isShoppingCartDefault: boolean;
    order: number | null;
    usedInRecipes: boolean;
}

export interface Ingredient {
    id: number;
    order: number;

    entity: {
        id: number;
        coverImage: CoverImage;
        weights: IngredientWeight[];
        shoppingCartCategory: ShoppingCartCategory;
        plantType: PlantType;
        algorithmSetting: AlgorithmSetting;
        tags: Tag[];
        states: StateTag[];
        initialStates: InitialStateTag[];
        rescueTags: RescueTag[];
        cookingMethods: CookingMethod[];
        name:string
        srId:number
        status:'ENABLED' | string;
        usdaName:string
        singularName:string
        pluralName:string
        pluralNameForRecipe:string | null
        singularNameForRecipe:string
        shoppingCartRescueLabel:string | null
        navigationName:string
        upc:string | null
        existInPreferenceTree:boolean
        includeInRescueShoppingList:boolean
    };
    textLabel: string;
    weight: IngredientWeight;

    amount: number;
    initialAmount: number;
    amounts:null | number[];
    nameWithUnit: string;
    isShoppingCartVisible: boolean;
    useInPrototypes: boolean;
    modified: boolean;
}

export interface RecipeServingMeta {
    id: number;
    name: string;
    singularName: string;
    pluralName: string;
    order: number;
}


export interface PatientFoodCategoryAttachment {
    id: number | null;
    attachment: unknown | null;
    relatedToDayOverviewItemAttachmentExists: boolean;
}

export interface PatientFoodCategoryQuestion {
    id: number;
    answered: boolean;
    patient: unknown | null;
    answeredTime: string | null; // Date, parsed from string

    question: FoodCategoryQuestion;
    response: QuestionResponse;
    foodCategory: FoodCategory;
}

export interface FoodCategoryQuestion {
    id: number;
    category: string | null;
    title: string;            // "water question"
    question: string;         // "do you like water"
    onCondition: unknown[];   // [] 0 items
    children: unknown[];      // [] 0 items
}

export interface QuestionResponse {
    id: number;
    checked: boolean;
    used: boolean;
    deleted: boolean;
    type: 'TWO_POINTS_SCALE' | string;
    responseItems: unknown[]; // [] 2 items
}

export interface FoodCategory {
    id: number;
    name: string;                         // "Water"
    patientQuestionAnswer: unknown | null;
    relatedToDayOverviewItemQuestionExists: boolean;
    new: boolean;
    peopleEatingNumber: number;
    modified: boolean;
    recipeOilyFishProteinReplaced: boolean;
}
