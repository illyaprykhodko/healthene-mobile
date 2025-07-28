import { IdName, Url } from './common';
import { Flavonoid } from './flavonoid';

/**
 * Represents a food item in the system
 * @interface Food
 * @property {number} id - Unique identifier of the food
 * @property {string} name - Name of the food
 * @property {string} description - Detailed description of the food
 * @property {IdName} category - Category the food belongs to
 * @property {Url} [image] - Optional URL to an image of the food
 * @property {Object} nutrition - Nutritional information
 * @property {Object} nutrition.macronutrients - Macronutrient content
 * @property {number} nutrition.macronutrients.protein - Protein content in grams
 * @property {number} nutrition.macronutrients.carbohydrates - Carbohydrate content in grams
 * @property {number} nutrition.macronutrients.fat - Fat content in grams
 * @property {Object} [nutrition.micronutrients] - Optional micronutrient content
 * @property {Object} [nutrition.vitamins] - Optional vitamin content
 * @property {Object} [nutrition.minerals] - Optional mineral content
 * @property {number} nutrition.calories - Total calories per serving
 * @property {string} nutrition.servingSize - Standard serving size
 * @property {string} nutrition.servingUnit - Unit of measurement for serving size
 * @property {Object[]} [flavonoids] - Optional list of flavonoids present
 * @property {Flavonoid} flavonoids.flavonoid - The flavonoid present
 * @property {number} flavonoids.concentration - Concentration of the flavonoid
 * @property {string} flavonoids.unit - Unit of measurement for concentration
 * @property {string[]} [allergens] - Optional list of allergens
 * @property {string[]} [ingredients] - Optional list of ingredients
 * @property {Object} [storage] - Optional storage information
 * @property {string} [storage.temperature] - Recommended storage temperature
 * @property {string} [storage.conditions] - Storage conditions
 * @property {string} [storage.shelfLife] - Shelf life information
 * @property {boolean} isActive - Whether the food is currently active
 * @property {string} createdDate - ISO date string when the food was created
 * @property {string} updatedDate - ISO date string when the food was last updated
 */
export interface Food {
  id: number;
  name: string;
  description: string;
  category: IdName;
  image?: Url;
  nutrition: {
    macronutrients: {
      protein: number;
      carbohydrates: number;
      fat: number;
    };
    micronutrients?: {
      [key: string]: number;
    };
    vitamins?: {
      [key: string]: number;
    };
    minerals?: {
      [key: string]: number;
    };
    calories: number;
    servingSize: string;
    servingUnit: string;
  };
  flavonoids?: {
    flavonoid: Flavonoid;
    concentration: number;
    unit: string;
  }[];
  allergens?: string[];
  ingredients?: string[];
  storage?: {
    temperature: string;
    conditions: string;
    shelfLife: string;
  };
  isActive: boolean;
  createdDate: string;
  updatedDate: string;
}

/**
 * Represents a category of foods
 * @interface FoodCategory
 * @property {number} id - Unique identifier of the category
 * @property {string} name - Name of the category
 * @property {string} description - Detailed description of the category
 * @property {IdName} [parent] - Optional parent category
 * @property {Url} [image] - Optional URL to an image representing the category
 * @property {Food[]} foods - List of foods in this category
 * @property {boolean} isActive - Whether the category is currently active
 * @property {string} createdDate - ISO date string when the category was created
 * @property {string} updatedDate - ISO date string when the category was last updated
 */
export interface FoodCategory {
  id: number;
  name: string;
  description: string;
  parent?: IdName;
  image?: Url;
  foods: Food[];
  isActive: boolean;
  createdDate: string;
  updatedDate: string;
}

/**
 * Represents a food recipe
 * @interface FoodRecipe
 * @property {number} id - Unique identifier of the recipe
 * @property {string} name - Name of the recipe
 * @property {string} description - Detailed description of the recipe
 * @property {Food[]} ingredients - List of ingredients
 * @property {Object[]} steps - Preparation steps
 * @property {number} steps.order - Order of the step
 * @property {string} steps.instruction - Instruction for the step
 * @property {string} [steps.tip] - Optional tip for the step
 * @property {Object} [nutrition] - Optional nutritional information for the recipe
 * @property {number} [nutrition.servings] - Number of servings
 * @property {number} [nutrition.caloriesPerServing] - Calories per serving
 * @property {string} [difficulty] - Optional difficulty level
 * @property {string} [preparationTime] - Optional preparation time
 * @property {string} [cookingTime] - Optional cooking time
 * @property {Url} [image] - Optional URL to an image of the recipe
 * @property {boolean} isActive - Whether the recipe is currently active
 * @property {string} createdDate - ISO date string when the recipe was created
 * @property {string} updatedDate - ISO date string when the recipe was last updated
 */
export interface FoodRecipe {
  id: number;
  name: string;
  description: string;
  ingredients: Food[];
  steps: {
    order: number;
    instruction: string;
    tip?: string;
  }[];
  nutrition?: {
    servings: number;
    caloriesPerServing: number;
  };
  difficulty?: string;
  preparationTime?: string;
  cookingTime?: string;
  image?: Url;
  isActive: boolean;
  createdDate: string;
  updatedDate: string;
}

/**
 * Represents a specific property of a food
 * @interface FoodProperty
 * @property {number} id - Unique identifier of the property
 * @property {Food} food - The food this property belongs to
 * @property {string} name - Name of the property
 * @property {string|number} value - Value of the property
 * @property {string} [unit] - Optional unit of measurement for the value
 * @property {boolean} isActive - Whether the property is currently active
 * @property {string} createdDate - ISO date string when the property was created
 * @property {string} updatedDate - ISO date string when the property was last updated
 */
export interface FoodProperty {
  id: number;
  food: Food;
  name: string;
  value: string | number;
  unit?: string;
  isActive: boolean;
  createdDate: string;
  updatedDate: string;
}

/**
 * Represents an effect that a food can have
 * @interface FoodEffect
 * @property {number} id - Unique identifier of the effect
 * @property {Food} food - The food that causes this effect
 * @property {string} name - Name of the effect
 * @property {string} description - Detailed description of the effect
 * @property {string} mechanism - Explanation of how the effect occurs
 * @property {string[]} references - List of scientific references supporting the effect
 * @property {boolean} isActive - Whether the effect is currently active
 * @property {string} createdDate - ISO date string when the effect was created
 * @property {string} updatedDate - ISO date string when the effect was last updated
 */
export interface FoodEffect {
  id: number;
  food: Food;
  name: string;
  description: string;
  mechanism: string;
  references: string[];
  isActive: boolean;
  createdDate: string;
  updatedDate: string;
}
