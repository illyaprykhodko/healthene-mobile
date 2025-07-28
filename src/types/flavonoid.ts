import { IdName, Url } from './common';
import { Food } from './food';
import { Supplement } from './supplement';

/**
 * Represents a flavonoid in the system
 * @interface Flavonoid
 * @property {number} id - Unique identifier of the flavonoid
 * @property {string} name - Name of the flavonoid
 * @property {string} description - Detailed description of the flavonoid
 * @property {IdName} category - Category the flavonoid belongs to
 * @property {Url} [image] - Optional URL to an image of the flavonoid
 * @property {Object} properties - Chemical and biological properties
 * @property {string} properties.molecularFormula - Molecular formula
 * @property {number} properties.molecularWeight - Molecular weight in g/mol
 * @property {string[]} properties.solubility - Solubility characteristics
 * @property {Object} [properties.stability] - Optional stability information
 * @property {string} [properties.stability.conditions] - Conditions affecting stability
 * @property {string} [properties.stability.degradation] - Degradation factors
 * @property {Object} effects - Biological effects
 * @property {string[]} effects.primary - Primary biological effects
 * @property {string[]} [effects.secondary] - Optional secondary effects
 * @property {string[]} [effects.mechanisms] - Optional mechanisms of action
 * @property {Object[]} sources - Natural sources of the flavonoid
 * @property {Food|Supplement} sources.item - Food or supplement containing the flavonoid
 * @property {number} sources.concentration - Concentration in the source
 * @property {string} sources.unit - Unit of concentration
 * @property {string[]} [references] - Optional scientific references
 * @property {boolean} isActive - Whether the flavonoid is currently active
 * @property {string} createdDate - ISO date string when the flavonoid was created
 * @property {string} updatedDate - ISO date string when the flavonoid was last updated
 */
export interface Flavonoid {
  id: number;
  name: string;
  description: string;
  category: IdName;
  image?: Url;
  properties: {
    molecularFormula: string;
    molecularWeight: number;
    solubility: string[];
    stability?: {
      conditions: string;
      degradation: string;
    };
  };
  effects: {
    primary: string[];
    secondary?: string[];
    mechanisms?: string[];
  };
  sources: {
    item: Food | Supplement;
    concentration: number;
    unit: string;
  }[];
  references?: string[];
  isActive: boolean;
  createdDate: string;
  updatedDate: string;
}

/**
 * Represents a category of flavonoids
 * @interface FlavonoidCategory
 * @property {number} id - Unique identifier of the category
 * @property {string} name - Name of the category
 * @property {string} description - Detailed description of the category
 * @property {IdName} [parent] - Optional parent category
 * @property {Url} [image] - Optional URL to an image representing the category
 * @property {Flavonoid[]} flavonoids - List of flavonoids in this category
 * @property {boolean} isActive - Whether the category is currently active
 * @property {string} createdDate - ISO date string when the category was created
 * @property {string} updatedDate - ISO date string when the category was last updated
 */
export interface FlavonoidCategory {
  id: number;
  name: string;
  description: string;
  parent?: IdName;
  image?: Url;
  flavonoids: Flavonoid[];
  isActive: boolean;
  createdDate: string;
  updatedDate: string;
}

/**
 * Represents a specific property of a flavonoid
 * @interface FlavonoidProperty
 * @property {number} id - Unique identifier of the property
 * @property {Flavonoid} flavonoid - The flavonoid this property belongs to
 * @property {string} name - Name of the property
 * @property {string|number} value - Value of the property
 * @property {string} [unit] - Optional unit of measurement for the value
 * @property {string} [description] - Optional description of the property
 * @property {boolean} isActive - Whether the property is currently active
 * @property {string} createdDate - ISO date string when the property was created
 * @property {string} updatedDate - ISO date string when the property was last updated
 */
export interface FlavonoidProperty {
  id: number;
  flavonoid: Flavonoid;
  name: string;
  value: string | number;
  unit?: string;
  description?: string;
  isActive: boolean;
  createdDate: string;
  updatedDate: string;
}

/**
 * Represents an interaction between flavonoids
 * @interface FlavonoidInteraction
 * @property {number} id - Unique identifier of the interaction
 * @property {Flavonoid} flavonoid1 - First flavonoid in the interaction
 * @property {Flavonoid} flavonoid2 - Second flavonoid in the interaction
 * @property {string} type - Type of interaction (synergistic, antagonistic, etc.)
 * @property {string} description - Detailed description of the interaction
 * @property {string} [mechanism] - Optional mechanism of interaction
 * @property {string[]} [references] - Optional scientific references
 * @property {boolean} isActive - Whether the interaction is currently active
 * @property {string} createdDate - ISO date string when the interaction was created
 * @property {string} updatedDate - ISO date string when the interaction was last updated
 */
export interface FlavonoidInteraction {
  id: number;
  flavonoid1: Flavonoid;
  flavonoid2: Flavonoid;
  type: string;
  description: string;
  mechanism?: string;
  references?: string[];
  isActive: boolean;
  createdDate: string;
  updatedDate: string;
}
