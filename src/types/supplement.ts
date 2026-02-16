import { Url } from './common';
import { Flavonoid } from './flavonoid';
import { BaseEntity, NamedEntity, TimestampedEntity } from './common/interfaces';

/**
 * Represents a dietary supplement in the system
 * @interface Supplement
 * @property {number} id - Unique identifier of the supplement
 * @property {string} name - Name of the supplement
 * @property {string} description - Detailed description of the supplement
 * @property {SupplementCategory} category - Category the supplement belongs to
 * @property {Url} [image] - Optional URL to an image of the supplement
 * @property {Object} composition - Composition information
 * @property {Object[]} composition.ingredients - List of active ingredients
 * @property {string} composition.ingredients.name - Name of the ingredient
 * @property {number} composition.ingredients.amount - Amount of the ingredient
 * @property {string} composition.ingredients.unit - Unit of measurement
 * @property {string} [composition.ingredients.source] - Optional source of the ingredient
 * @property {Object[]} [flavonoids] - Optional list of flavonoids present
 * @property {Flavonoid} flavonoids.flavonoid - The flavonoid present
 * @property {number} flavonoids.concentration - Concentration of the flavonoid
 * @property {string} flavonoids.unit - Unit of measurement for concentration
 * @property {Object} dosage - Dosage information
 * @property {string} dosage.recommended - Recommended dosage
 * @property {string} [dosage.maximum] - Optional maximum safe dosage
 * @property {string} [dosage.frequency] - Optional frequency of intake
 * @property {string} [dosage.timing] - Optional timing of intake
 * @property {Object} [safety] - Optional safety information
 * @property {string[]} [safety.warnings] - List of safety warnings
 * @property {string[]} [safety.contraindications] - List of contraindications
 * @property {string[]} [safety.interactions] - List of known interactions
 * @property {Object} [storage] - Optional storage information
 * @property {string} [storage.temperature] - Recommended storage temperature
 * @property {string} [storage.conditions] - Storage conditions
 * @property {string} [storage.shelfLife] - Shelf life information
 * @property {string} [manufacturer] - Optional manufacturer information
 * @property {string} [certification] - Optional certification information
 * @property {boolean} isActive - Whether the supplement is currently active
 * @property {string} createdDate - ISO date string when the supplement was created
 * @property {string} updatedDate - ISO date string when the supplement was last updated
 */
export interface Supplement extends BaseEntity, NamedEntity, TimestampedEntity {
  description: string;
  category: SupplementCategory;
  image?: Url;
  composition: {
    ingredients: {
      name: string;
      amount: number;
      unit: string;
      source?: string;
    }[];
  };
  flavonoids?: {
    flavonoid: Flavonoid;
    concentration: number;
    unit: string;
  }[];
  dosage: {
    recommended: string;
    maximum?: string;
    frequency?: string;
    timing?: string;
  };
  safety?: {
    warnings: string[];
    contraindications: string[];
    interactions: string[];
  };
  storage?: {
    temperature: string;
    conditions: string;
    shelfLife: string;
  };
  manufacturer?: string;
  certification?: string;
  isActive: boolean;
  supplement: {
    id: number;
    name: string;
};
}
// export interface Supplement {
//   id: number;
//   supplement: {
//       id: number;
//       name: string;
//   };
// }
/**
 * Represents a category of supplements
 * @interface SupplementCategory
 * @property {number} id - Unique identifier of the category
 * @property {string} name - Name of the category
 * @property {string} description - Detailed description of the category
 * @property {SupplementCategory} [parent] - Optional parent category
 * @property {Url} [image] - Optional URL to an image representing the category
 * @property {Supplement[]} supplements - List of supplements in this category
 * @property {boolean} isActive - Whether the category is currently active
 * @property {string} createdDate - ISO date string when the category was created
 * @property {string} updatedDate - ISO date string when the category was last updated
 */
export interface SupplementCategory extends BaseEntity, NamedEntity, TimestampedEntity {
  description: string;
  parent?: SupplementCategory;
  image?: Url;
  supplements: Supplement[];
  isActive: boolean;
}

/**
 * Represents a supplement regimen
 * @interface SupplementRegimen
 * @property {number} id - Unique identifier of the regimen
 * @property {string} name - Name of the regimen
 * @property {string} description - Detailed description of the regimen
 * @property {Object[]} supplements - List of supplements in the regimen
 * @property {Supplement} supplements.supplement - The supplement
 * @property {string} supplements.dosage - Dosage for this supplement
 * @property {string} supplements.frequency - Frequency of intake
 * @property {string} [supplements.timing] - Optional timing of intake
 * @property {string} [supplements.notes] - Optional notes about the supplement
 * @property {Object} [schedule] - Optional schedule information
 * @property {string} [schedule.startDate] - Start date of the regimen
 * @property {string} [schedule.endDate] - End date of the regimen
 * @property {string} [schedule.reminder] - Reminder settings
 * @property {boolean} isActive - Whether the regimen is currently active
 * @property {string} createdDate - ISO date string when the regimen was created
 * @property {string} updatedDate - ISO date string when the regimen was last updated
 */
export interface SupplementRegimen extends BaseEntity, NamedEntity, TimestampedEntity {
  description: string;
  supplements: {
    supplement: Supplement;
    dosage: string;
    frequency: string;
    timing?: string;
    notes?: string;
  }[];
  schedule?: {
    startDate: string;
    endDate: string;
    reminder: string;
  };
  isActive: boolean;
}

/**
 * Represents a specific property of a supplement
 * @interface SupplementProperty
 * @property {number} id - Unique identifier of the property
 * @property {Supplement} supplement - The supplement this property belongs to
 * @property {string} name - Name of the property
 * @property {string|number} value - Value of the property
 * @property {string} [unit] - Optional unit of measurement for the value
 * @property {boolean} isActive - Whether the property is currently active
 * @property {string} createdDate - ISO date string when the property was created
 * @property {string} updatedDate - ISO date string when the property was last updated
 */
export interface SupplementProperty extends BaseEntity, TimestampedEntity {
  supplement: Supplement;
  name: string;
  value: string | number;
  unit?: string;
  isActive: boolean;
}

/**
 * Represents an effect that a supplement can have
 * @interface SupplementEffect
 * @property {number} id - Unique identifier of the effect
 * @property {Supplement} supplement - The supplement that causes this effect
 * @property {string} name - Name of the effect
 * @property {string} description - Detailed description of the effect
 * @property {string} mechanism - Explanation of how the effect occurs
 * @property {string[]} references - List of scientific references supporting the effect
 * @property {boolean} isActive - Whether the effect is currently active
 * @property {string} createdDate - ISO date string when the effect was created
 * @property {string} updatedDate - ISO date string when the effect was last updated
 */
export interface SupplementEffect extends BaseEntity, NamedEntity, TimestampedEntity {
  supplement: Supplement;
  description: string;
  mechanism: string;
  references: string[];
  isActive: boolean;
}

/**
 * Represents a user review for a supplement
 * @interface SupplementReview
 * @property {number} id - Unique identifier of the review
 * @property {Supplement} supplement - The supplement being reviewed
 * @property {number} rating - Rating given by the user (1-5)
 * @property {string} comment - User's review comment
 * @property {string} userName - Name of the user who wrote the review
 * @property {string} createdDate - ISO date string when the review was created
 * @property {string} updatedDate - ISO date string when the review was last updated
 */
export interface SupplementReview extends BaseEntity, TimestampedEntity {
  supplement: Supplement;
  rating: number;
  comment: string;
  userName: string;
}

/**
 * Represents a user's favorite supplement
 * @interface SupplementFavorite
 * @property {number} id - Unique identifier of the favorite entry
 * @property {Supplement} supplement - The supplement marked as favorite
 * @property {string} [notes] - Optional notes about why this supplement is a favorite
 * @property {string} createdDate - ISO date string when the favorite was created
 * @property {string} updatedDate - ISO date string when the favorite was last updated
 */
export interface SupplementFavorite extends BaseEntity, TimestampedEntity {
  supplement: Supplement;
  notes?: string;
}
