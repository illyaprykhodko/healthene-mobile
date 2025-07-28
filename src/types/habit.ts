import { IdName, Url } from './common';

/**
 * Represents a habit in the system
 * @interface Habit
 * @property {number} id - Unique identifier of the habit
 * @property {string} name - Name of the habit
 * @property {string} description - Detailed description of the habit
 * @property {IdName} category - Category the habit belongs to
 * @property {Url} [image] - Optional URL to an image of the habit
 * @property {Object} frequency - Frequency information for the habit
 * @property {string} frequency.type - Type of frequency (daily, weekly, monthly)
 * @property {number} frequency.times - Number of times per period
 * @property {string[]} [frequency.days] - Optional specific days for weekly frequency
 * @property {Object} [reminder] - Optional reminder settings
 * @property {string} [reminder.time] - Time of day for the reminder
 * @property {string[]} [reminder.days] - Days of the week for the reminder
 * @property {string[]} [tags] - Optional list of tags for the habit
 * @property {boolean} isActive - Whether the habit is currently active
 * @property {string} createdDate - ISO date string when the habit was created
 * @property {string} updatedDate - ISO date string when the habit was last updated
 */
export interface Habit {
  id: number;
  name: string;
  description: string;
  category: IdName;
  image?: Url;
  frequency: {
    type: 'daily' | 'weekly' | 'monthly';
    times: number;
    days?: string[];
  };
  reminder?: {
    time: string;
    days: string[];
  };
  tags?: string[];
  isActive: boolean;
  createdDate: string;
  updatedDate: string;
}

/**
 * Represents a category of habits
 * @interface HabitCategory
 * @property {number} id - Unique identifier of the category
 * @property {string} name - Name of the category
 * @property {string} description - Detailed description of the category
 * @property {IdName} [parent] - Optional parent category
 * @property {Url} [image] - Optional URL to an image representing the category
 * @property {Habit[]} habits - List of habits in this category
 * @property {boolean} isActive - Whether the category is currently active
 * @property {string} createdDate - ISO date string when the category was created
 * @property {string} updatedDate - ISO date string when the category was last updated
 */
export interface HabitCategory {
  id: number;
  name: string;
  description: string;
  parent?: IdName;
  image?: Url;
  habits: Habit[];
  isActive: boolean;
  createdDate: string;
  updatedDate: string;
}

/**
 * Represents a user's habit tracking record
 * @interface HabitRecord
 * @property {number} id - Unique identifier of the record
 * @property {Habit} habit - The habit being tracked
 * @property {string} date - Date of the record
 * @property {boolean} completed - Whether the habit was completed
 * @property {string} [notes] - Optional notes about the completion
 * @property {Object} [metrics] - Optional metrics for the habit
 * @property {number} [metrics.quantity] - Quantity completed
 * @property {string} [metrics.unit] - Unit of measurement
 * @property {string} createdDate - ISO date string when the record was created
 * @property {string} updatedDate - ISO date string when the record was last updated
 */
export interface HabitRecord {
  id: number;
  habit: Habit;
  date: string;
  completed: boolean;
  notes?: string;
  metrics?: {
    quantity: number;
    unit: string;
  };
  createdDate: string;
  updatedDate: string;
}

/**
 * Represents a user's habit streak
 * @interface HabitStreak
 * @property {number} id - Unique identifier of the streak
 * @property {Habit} habit - The habit this streak is for
 * @property {number} currentStreak - Current number of consecutive completions
 * @property {number} longestStreak - Longest number of consecutive completions
 * @property {string} lastCompletedDate - Date of last completion
 * @property {string} [notes] - Optional notes about the streak
 * @property {string} createdDate - ISO date string when the streak was created
 * @property {string} updatedDate - ISO date string when the streak was last updated
 */
export interface HabitStreak {
  id: number;
  habit: Habit;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string;
  notes?: string;
  createdDate: string;
  updatedDate: string;
}
