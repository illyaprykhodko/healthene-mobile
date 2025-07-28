import { IdName, Url } from './common';

/**
 * Represents a measurement in the system
 * @interface Measurement
 * @property {number} id - Unique identifier of the measurement
 * @property {string} name - Name of the measurement
 * @property {string} description - Detailed description of the measurement
 * @property {IdName} category - Category the measurement belongs to
 * @property {Url} [image] - Optional URL to an image of the measurement
 * @property {Object} unit - Unit information for the measurement
 * @property {string} unit.name - Name of the unit (e.g., kg, cm, ml)
 * @property {string} unit.symbol - Symbol for the unit (e.g., kg, cm, ml)
 * @property {string} [unit.description] - Optional description of the unit
 * @property {Object} [range] - Optional valid range for the measurement
 * @property {number} [range.min] - Minimum valid value
 * @property {number} [range.max] - Maximum valid value
 * @property {string} [range.description] - Optional description of the range
 * @property {boolean} isActive - Whether the measurement is currently active
 * @property {string} createdDate - ISO date string when the measurement was created
 * @property {string} updatedDate - ISO date string when the measurement was last updated
 */
export interface Measurement {
  id: number;
  name: string;
  description: string;
  category: IdName;
  image?: Url;
  unit: {
    name: string;
    symbol: string;
    description?: string;
  };
  range?: {
    min: number;
    max: number;
    description?: string;
  };
  isActive: boolean;
  createdDate: string;
  updatedDate: string;
}

/**
 * Represents a category of measurements
 * @interface MeasurementCategory
 * @property {number} id - Unique identifier of the category
 * @property {string} name - Name of the category
 * @property {string} description - Detailed description of the category
 * @property {IdName} [parent] - Optional parent category
 * @property {Url} [image] - Optional URL to an image representing the category
 * @property {Measurement[]} measurements - List of measurements in this category
 * @property {boolean} isActive - Whether the category is currently active
 * @property {string} createdDate - ISO date string when the category was created
 * @property {string} updatedDate - ISO date string when the category was last updated
 */
export interface MeasurementCategory {
  id: number;
  name: string;
  description: string;
  parent?: IdName;
  image?: Url;
  measurements: Measurement[];
  isActive: boolean;
  createdDate: string;
  updatedDate: string;
}

/**
 * Represents a user's measurement record
 * @interface MeasurementRecord
 * @property {number} id - Unique identifier of the record
 * @property {Measurement} measurement - The measurement being recorded
 * @property {number} value - The recorded value
 * @property {string} [notes] - Optional notes about the measurement
 * @property {Object} [context] - Optional context for the measurement
 * @property {string} [context.timeOfDay] - Time of day when measurement was taken
 * @property {string} [context.conditions] - Conditions during measurement
 * @property {string} createdDate - ISO date string when the record was created
 * @property {string} updatedDate - ISO date string when the record was last updated
 */
export interface MeasurementRecord {
  id: number;
  measurement: Measurement;
  value: number;
  notes?: string;
  context?: {
    timeOfDay?: string;
    conditions?: string;
  };
  createdDate: string;
  updatedDate: string;
}

/**
 * Represents a measurement goal for a user
 * @interface MeasurementGoal
 * @property {number} id - Unique identifier of the goal
 * @property {Measurement} measurement - The measurement this goal is for
 * @property {number} targetValue - The target value to achieve
 * @property {string} [deadline] - Optional deadline for achieving the goal
 * @property {string} [description] - Optional description of the goal
 * @property {Object} [progress] - Optional progress tracking
 * @property {number} [progress.currentValue] - Current value towards the goal
 * @property {number} [progress.percentage] - Percentage of goal achieved
 * @property {string} createdDate - ISO date string when the goal was created
 * @property {string} updatedDate - ISO date string when the goal was last updated
 */
export interface MeasurementGoal {
  id: number;
  measurement: Measurement;
  targetValue: number;
  deadline?: string;
  description?: string;
  progress?: {
    currentValue: number;
    percentage: number;
  };
  createdDate: string;
  updatedDate: string;
}
