import { Recipe } from './recipe';
import { Url } from './common';
import { Supplement } from './supplement';
import { BaseEntity, NamedEntity, TimestampedEntity } from './common/interfaces';

/**
 * Represents a plan in the system
 * @interface Plan
 * @property {number} id - Unique identifier of the plan
 * @property {string} name - Name of the plan
 * @property {string} description - Detailed description of the plan
 * @property {IdName} category - Category the plan belongs to
 * @property {Url} [image] - Optional URL to an image of the plan
 * @property {Object} duration - Duration information for the plan
 * @property {number} duration.weeks - Number of weeks the plan lasts
 * @property {string} [duration.description] - Optional description of the duration
 * @property {Object} goals - Goals of the plan
 * @property {string[]} goals.primary - Primary goals of the plan
 * @property {string[]} [goals.secondary] - Optional secondary goals
 * @property {Object[]} meals - Meal schedule for the plan
 * @property {string} meals.day - Day of the week
 * @property {string} meals.mealType - Type of meal (breakfast, lunch, dinner, etc.)
 * @property {Recipe} meals.recipe - The recipe for this meal
 * @property {Object[]} [supplements] - Optional supplements to take during the plan
 * @property {Supplement} supplements.supplement - The supplement to take
 * @property {string} supplements.timing - When to take the supplement
 * @property {string} [supplements.notes] - Optional notes about taking the supplement
 * @property {string[]} [tags] - Optional list of tags for the plan
 * @property {boolean} isActive - Whether the plan is currently active
 * @property {string} createdDate - ISO date string when the plan was created
 * @property {string} updatedDate - ISO date string when the plan was last updated
 */
export interface Plan extends BaseEntity, NamedEntity, TimestampedEntity {
  description: string;
  category: PlanCategory;
  image?: Url;
  duration: {
    weeks: number;
    description?: string;
  };
  goals: {
    primary: string[];
    secondary?: string[];
  };
  meals: {
    day: string;
    mealType: string;
    recipe: Recipe;
  }[];
  supplements?: {
    supplement: Supplement;
    timing: string;
    notes?: string;
  }[];
  tags?: string[];
  isActive: boolean;
}

/**
 * Represents a category of plans
 * @interface PlanCategory
 * @property {number} id - Unique identifier of the category
 * @property {string} name - Name of the category
 * @property {string} description - Detailed description of the category
 * @property {IdName} [parent] - Optional parent category
 * @property {Url} [image] - Optional URL to an image representing the category
 * @property {Plan[]} plans - List of plans in this category
 * @property {boolean} isActive - Whether the category is currently active
 * @property {string} createdDate - ISO date string when the category was created
 * @property {string} updatedDate - ISO date string when the category was last updated
 */
export interface PlanCategory extends BaseEntity, NamedEntity, TimestampedEntity {
  description: string;
  parent?: PlanCategory;
  image?: Url;
  plans: Plan[];
  isActive: boolean;
}

export interface PlanStep extends BaseEntity, NamedEntity, TimestampedEntity {
  plan: Plan;
  description: string;
  order: number;
  duration: number;
  durationUnit: string;
  isActive: boolean;
}

/**
 * Represents a user's progress on a plan
 * @interface PlanProgress
 * @property {number} id - Unique identifier of the progress
 * @property {Plan} plan - The plan being followed
 * @property {number} currentWeek - Current week in the plan
 * @property {number} currentDay - Current day in the week
 * @property {Object} completion - Completion status of the plan
 * @property {number} completion.percentage - Overall completion percentage
 * @property {string[]} completion.completedMeals - List of completed meals
 * @property {string[]} [completion.notes] - Optional notes about progress
 * @property {string} createdDate - ISO date string when the progress was created
 * @property {string} updatedDate - ISO date string when the progress was last updated
 */
export interface PlanProgress extends BaseEntity, TimestampedEntity {
  plan: Plan;
  currentWeek: number;
  currentDay: number;
  completion: {
    percentage: number;
    completedMeals: string[];
    notes?: string;
  };
}

export type DescriptionReference = {
  id: number;
  url: string;
  name: string;
  order: number;
  description: string;
};

export type PlanInfo = {
  id: number;
  name: string;
  goal: string;
  descriptionForPatient: string;
  descriptionReferences: DescriptionReference[];
  allowUserToChangeCaloriesDistribution: boolean | null;
}
