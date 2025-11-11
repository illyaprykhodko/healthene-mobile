export enum SubstanceType {
    DRINK = 'DRINK',
  }
  
export enum Status {
    ENABLED = 'ENABLED',
  }
  
export enum ShoppingCartCategoryType {
    SHOPPING_CART_CATEGORY_TAG = 'SHOPPING_CART_CATEGORY_TAG',
  }
  
export enum PlantTypeType {
    PLANT_TYPE = 'PLANT_TYPE',
  }
  
export enum TagType {
    TAG = 'TAG',
  }
  
export enum StateType {
    STATE = 'STATE',
  }
  
export enum InitialStateType {
    INITIAL_STATE = 'INITIAL_STATE',
  }
  
export enum RescueTagType {
    RESCUE_TAG = 'RESCUE_TAG',
  }
  
export enum CookingMethodType {
    COOKING_METHOD = 'COOKING_METHOD',
  }
  
// ===== Primitives / shared structures =====
export interface Unit {
    id: number;
    name: string;
    singularName: string;
    pluralName: string;
    weightInGrams: number | null;
  }
  
export interface Weight {
    id: number;
    unit: Unit;
    amount: number;
    gramWeight: number;
    enabled: boolean;
    isDefault: boolean;
    isShoppingCartDefault: boolean;
    order: number | null;
    usedInRecipes: boolean;
  }
  
export interface CoverImage {
    url: string;
  }
  
export interface ShoppingCartCategory {
    id: number;
    name: string;
    order: number | null;
    type: ShoppingCartCategoryType;
    disabled: boolean;
  }
  
export interface PlantType {
    id: number;
    name: string;
    order: number;
    type: PlantTypeType;
    disabled: boolean;
  }
  
export interface Tag {
    id: number;
    name: string;
    order: number | null;
    type: TagType;
    disabled: boolean;
  }
  
export interface StateTag {
    id: number;
    name: string;
    order: number | null;
    type: StateType;
    disabled: boolean;
  }
  
export interface InitialStateTag {
    id: number;
    name: string;
    order: number | null;
    type: InitialStateType;
    disabled: boolean;
  }
  
export interface RescueTag {
    id: number;
    name: string;
    order: number | null;
    type: RescueTagType;
    disabled: boolean;
  }
  
export interface CookingMethod {
    id: number;
    name: string;
    order: number;
    type: CookingMethodType;
    disabled: boolean;
  }
  
export interface AlgorithmSetting {
    repetitive: boolean;
    diversity: boolean;
  }
  
// ===== Entity inside Ingredient =====
export interface IngredientEntity {
    id: number;
    name: string;
    coverImage?: CoverImage;
    srId: string;
    status: Status;
    weights: Weight[];
    usdaName: string;
    singularName: string;
    pluralName: string;
    pluralNameForRecipe: string | null;
    singularNameForRecipe: string;
    shoppingCartCategory: ShoppingCartCategory;
    shoppingCartRescueLabel: string | null;
    plantType: PlantType;
    algorithmSetting: AlgorithmSetting;
    tags: Tag[];
    states: StateTag[];
    initialStates: InitialStateTag[];
    rescueTags: RescueTag[];
    cookingMethods: CookingMethod[];
    navigationName: string;
    upc: string | null;
    existInPreferenceTree: boolean;
    includeInRescueShoppingList: boolean;
  }
  
// ===== Ingredient =====
export interface Ingredient {
    id: number;
    order: number;
    entity: IngredientEntity;
    textLabel: string; // e.g. dictionary key like "be0eac6d-..."
    weight: Weight;
    amount: number;
    initialAmount: number;
    amounts: unknown | null; // (null)?
    nameWithUnit: string;
    isShoppingCartVisible: boolean;
    useInPrototypes: boolean;
    modified: boolean;
  }
  
// ===== Recipe =====
export interface Recipe {
    id: number;
    name: string;
    unparsedName: string; // HTML string with mentions
    dictionaryForName: Record<string, string>;
    dictionaryForSteps: unknown | null;
    steps: unknown | null;
    surrogateRecipe: boolean;
    substanceType: SubstanceType;
    ingredients: Ingredient[];
    coverImage?: CoverImage;
  }
  
// ===== Serving =====
export interface Serving {
    id: number;
    name: string;
    singularName: string;
    pluralName: string;
    order: number;
  }
  
export interface ServingData {
    amount: number;
    serving: Serving;
  }
  
// ===== Meal =====
export interface Meal {
    id: number;
    servingData: ServingData;
    recipe: Recipe;
  }
  
export interface MealsResponse {
    meals: Meal[];
  }
