/**
 * Represents a basic entity with an ID and name
 * @interface IdName
 * @property {number} id - Unique identifier
 * @property {string} name - Display name
 */
export interface IdName {
    id: number;
    name: string;
  }
  
/**
 * Represents a URL string
 * @typedef {string} Url
 */
export interface Url {
    url: string;
  }
  
/**
 * Represents a country
 * @interface Country
 * @property {number} id - Unique identifier of the country
 * @property {string} name - Name of the country
 * @property {string} code - ISO country code (e.g., 'US', 'GB')
 * @property {string} [phoneCode] - Optional international phone code
 * @property {string} [currency] - Optional currency code
 * @property {string} [language] - Optional primary language code
 * @property {boolean} isActive - Whether the country is currently active
 * @property {string} createdDate - ISO date string when the country was created
 * @property {string} updatedDate - ISO date string when the country was last updated
 */
export interface Country {
    id: number;
    name: string;
    code: string;
    phoneCode?: string;
    currency?: string;
    language?: string;
    isActive: boolean;
    createdDate: string;
    updatedDate: string;
}
  
/**
 * Represents a state/province
 * @interface State
 * @property {number} id - Unique identifier of the state
 * @property {string} name - Name of the state
 * @property {string} code - State code (e.g., 'CA' for California)
 * @property {Country} country - The country this state belongs to
 * @property {boolean} isActive - Whether the state is currently active
 * @property {string} createdDate - ISO date string when the state was created
 * @property {string} updatedDate - ISO date string when the state was last updated
 */
export interface State {
    id: number;
    name: string;
    code: string;
    country: Country;
    isActive: boolean;
    createdDate: string;
    updatedDate: string;
}
