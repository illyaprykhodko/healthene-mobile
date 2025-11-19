/****
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
 */
export interface Country {
    id: number,
    name: string,
    code: string,
}

/**
 * Represents a state or province
 * @interface State
 * @property {number} id - Unique identifier of the state or province
 * @property {string} name - Name of the state or province
 * @property {string} code - Short code of the state (e.g., 'CA' for California)
 * @property {{id: number}} country - Reference to the country this state belongs to
 */
export interface State {
    id: number;
    name: string;
    code: string;
    country: {id: number};
}
