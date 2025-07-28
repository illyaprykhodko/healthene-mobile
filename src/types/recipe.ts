import { BaseEntity, NamedEntity, TimestampedEntity } from './common/interfaces';
import { Url } from './common';
import { Food } from './food';

/**
 * Represents a recipe in the system
 * @interface Recipe
 * @property {number} id - Unique identifier of the recipe
 * @property {string} name - Name of the recipe
 * @property {string} description - Detailed description of the recipe
 * @property {RecipeCategory} category - Category the recipe belongs to
 * @property {Url} [image] - Optional URL to an image of the recipe
 * @property {Object} nutritionalInfo - Nutritional information about the recipe
 * @property {number} nutritionalInfo.calories - Number of calories per serving
 * @property {number} nutritionalInfo.protein - Amount of protein in grams per serving
 * @property {number} nutritionalInfo.fat - Amount of fat in grams per serving
 * @property {number} nutritionalInfo.carbohydrates - Amount of carbohydrates in grams per serving
 * @property {number} nutritionalInfo.fiber - Amount of fiber in grams per serving
 * @property {number} nutritionalInfo.sugar - Amount of sugar in grams per serving
 * @property {number} nutritionalInfo.sodium - Amount of sodium in milligrams per serving
 * @property {Object[]} ingredients - List of ingredients needed for the recipe
 * @property {Food} ingredients.food - The food item
 * @property {number} ingredients.amount - Amount needed
 * @property {string} ingredients.unit - Unit of measurement
 * @property {string[]} instructions - Step-by-step cooking instructions
 * @property {number} prepTime - Preparation time in minutes
 * @property {number} cookTime - Cooking time in minutes
 * @property {number} servings - Number of servings the recipe makes
 * @property {string[]} [tags] - Optional list of tags for the recipe
 * @property {boolean} isActive - Whether the recipe is currently active
 * @property {string} createdDate - ISO date string when the recipe was created
 * @property {string} updatedDate - ISO date string when the recipe was last updated
 */
export interface Recipe extends BaseEntity, NamedEntity, TimestampedEntity {
  description: string;
  category: RecipeCategory;
  image?: Url;
  nutritionalInfo: {
    calories: number;
    protein: number;
    fat: number;
    carbohydrates: number;
    fiber: number;
    sugar: number;
    sodium: number;
  };
  ingredients: {
    food: Food;
    amount: number;
    unit: string;
  }[];
  instructions: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
  tags?: string[];
  isActive: boolean;
}

/**
 * Represents a category of recipes
 * @interface RecipeCategory
 * @property {number} id - Unique identifier of the category
 * @property {string} name - Name of the category
 * @property {string} description - Detailed description of the category
 * @property {RecipeCategory} [parent] - Optional parent category
 * @property {Url} [image] - Optional URL to an image representing the category
 * @property {Recipe[]} recipes - List of recipes in this category
 * @property {boolean} isActive - Whether the category is currently active
 * @property {string} createdDate - ISO date string when the category was created
 * @property {string} updatedDate - ISO date string when the category was last updated
 */
export interface RecipeCategory extends BaseEntity, NamedEntity, TimestampedEntity {
  description: string;
  parent?: RecipeCategory;
  image?: Url;
  recipes: Recipe[];
  isActive: boolean;
}

/**
 * Represents a review for a recipe
 * @interface RecipeReview
 * @property {number} id - Unique identifier of the review
 * @property {Recipe} recipe - The recipe being reviewed
 * @property {number} rating - Rating given (typically 1-5)
 * @property {string} comment - Detailed review comment
 * @property {string} userName - Name of the user who wrote the review
 * @property {string} createdDate - ISO date string when the review was created
 * @property {string} updatedDate - ISO date string when the review was last updated
 */
export interface RecipeReview extends BaseEntity, TimestampedEntity {
  recipe: Recipe;
  rating: number;
  comment: string;
  userName: string;
}

/**
 * Represents a favorite recipe for a user
 * @interface RecipeFavorite
 * @property {number} id - Unique identifier of the favorite
 * @property {Recipe} recipe - The recipe that was favorited
 * @property {string} [notes] - Optional personal notes about the recipe
 * @property {string} createdDate - ISO date string when the favorite was created
 * @property {string} updatedDate - ISO date string when the favorite was last updated
 */
export interface RecipeFavorite extends BaseEntity, TimestampedEntity {
  recipe: Recipe;
  notes?: string;
}
