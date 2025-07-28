import { AlgorithmRunState } from './common/enums';
import { BaseEntity, NamedEntity, TimestampedEntity } from './common/interfaces';

/**
 * Represents an algorithm in the system
 * @interface Algorithm
 * @property {number} id - Unique identifier of the algorithm
 * @property {string} name - Name of the algorithm
 * @property {string} description - Detailed description of what the algorithm does
 * @property {string} version - Version number of the algorithm (e.g., "1.0.0")
 * @property {boolean} isActive - Whether the algorithm is currently active
 * @property {string} createdDate - ISO date string when the algorithm was created
 * @property {string} updatedDate - ISO date string when the algorithm was last updated
 */
export interface Algorithm extends BaseEntity, NamedEntity, TimestampedEntity {
  description: string;
  version: string;
  isActive: boolean;
}

/**
 * Represents a single run of an algorithm
 * @interface AlgorithmRun
 * @property {number} id - Unique identifier of the algorithm run
 * @property {Algorithm} algorithm - The algorithm that was run
 * @property {AlgorithmRunState} state - Current state of the algorithm run
 * @property {string} [message] - Optional message about the run (e.g., error message)
 * @property {string} startDate - ISO date string when the run started
 * @property {string} [endDate] - ISO date string when the run ended (if completed)
 * @property {Record<string, any>} input - Input parameters for the algorithm
 * @property {Record<string, any>} [output] - Output results from the algorithm (if completed)
 * @property {string} createdDate - ISO date string when the run was created
 * @property {string} updatedDate - ISO date string when the run was last updated
 */
export interface AlgorithmRun extends BaseEntity, TimestampedEntity {
  algorithm: Algorithm;
  state: AlgorithmRunState;
  message?: string;
  startDate: string;
  endDate?: string;
  input: Record<string, any>;
  output?: Record<string, any>;
}

/**
 * Represents a result from an algorithm run
 * @interface AlgorithmResult
 * @property {number} id - Unique identifier of the result
 * @property {AlgorithmRun} algorithmRun - The algorithm run that produced this result
 * @property {string} category - Category of the result (e.g., "nutrition", "exercise", "sleep")
 * @property {number} score - Numerical score or rating of the result (typically 0-100)
 * @property {string[]} recommendations - List of recommendations based on the result
 * @property {string} createdDate - ISO date string when the result was created
 * @property {string} updatedDate - ISO date string when the result was last updated
 */
export interface AlgorithmResult extends BaseEntity, TimestampedEntity {
  algorithmRun: AlgorithmRun;
  category: string;
  score: number;
  recommendations: string[];
}

/**
 * Represents a specific recommendation from an algorithm result
 * @interface AlgorithmRecommendation
 * @property {number} id - Unique identifier of the recommendation
 * @property {AlgorithmResult} algorithmResult - The algorithm result this recommendation is based on
 * @property {string} type - Type of recommendation (e.g., "nutrition", "exercise", "lifestyle")
 * @property {number} priority - Priority level of the recommendation (1-5, where 5 is highest)
 * @property {string} title - Short title of the recommendation
 * @property {string} description - Detailed description of the recommendation
 * @property {string[]} actionItems - List of specific actions to take
 * @property {string} createdDate - ISO date string when the recommendation was created
 * @property {string} updatedDate - ISO date string when the recommendation was last updated
 */
export interface AlgorithmRecommendation extends BaseEntity, TimestampedEntity {
  algorithmResult: AlgorithmResult;
  type: string;
  priority: number;
  title: string;
  description: string;
  actionItems: string[];
}
