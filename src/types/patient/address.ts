import { BaseEntity, NamedEntity, TimestampedEntity, ActiveEntity, EntityReference } from '../common/interfaces';

/**
 * Represents a country
 * @interface Country
 * @property {number} id - Unique identifier of the country
 * @property {string} name - Name of the country
 * @property {string} code - ISO 3166-1 alpha-2 country code (e.g., "US", "GB")
 * @property {boolean} isActive - Whether the country is currently active
 */
export interface Country extends BaseEntity, NamedEntity, ActiveEntity {
  /** ISO 3166-1 alpha-2 country code (e.g., "US", "GB") */
  code: string;
}

/**
 * Represents a state/province/region
 * @interface State
 * @property {number} id - Unique identifier of the state
 * @property {string} name - Name of the state/province/region
 * @property {string} code - State/province code (e.g., "CA" for California)
 * @property {EntityReference} country - Reference to the country this state belongs to
 * @property {boolean} isActive - Whether the state is currently active
 */
export interface State extends BaseEntity, NamedEntity, ActiveEntity {
  /** State/province code (e.g., "CA" for California) */
  code: string;
  /** Reference to the country */
  country: EntityReference;
}

/**
 * Represents a patient's address
 * @interface Address
 * @property {number} id - Unique identifier of the address
 * @property {string} address1 - First line of the address (street address)
 * @property {string} [address2] - Optional second line of the address (apartment, suite, etc.)
 * @property {string} city - City name
 * @property {Country} country - Country information
 * @property {State} state - State/province/region information
 * @property {string} [description] - Optional description or label for the address (e.g., "Home", "Work")
 * @property {string} zipCode - ZIP/Postal code
 * @property {boolean} isActive - Whether the address is currently active
 * @property {string} createdDate - ISO date string when the address was created
 * @property {string} updatedDate - ISO date string when the address was last updated
 */
export interface Address extends BaseEntity, TimestampedEntity, ActiveEntity {
  /** First line of the address (street address) */
  address1: string;
  /** Optional second line of the address (apartment, suite, etc.) */
  address2?: string;
  /** City name */
  city: string;
  /** Country information */
  country: Country;
  /** State/province/region information */
  state: State;
  /** Optional description or label for the address (e.g., "Home", "Work") */
  description?: string;
  /** ZIP/Postal code */
  zipCode: string;
}

/**
 * Represents additional contact information
 * @interface AdditionalContacts
 * @property {number} id - Unique identifier of the contact information
 * @property {string[]} cellPhones - Array of cell phone numbers
 * @property {string[]} emails - Array of email addresses
 * @property {string[]} homePhones - Array of home phone numbers
 * @property {string[]} workPhones - Array of work phone numbers
 * @property {boolean} isActive - Whether the contact information is currently active
 */
export interface AdditionalContacts extends BaseEntity, ActiveEntity {
  /** Array of cell phone numbers */
  cellPhones: string[];
  /** Array of email addresses */
  emails: string[];
  /** Array of home phone numbers */
  homePhones: string[];
  /** Array of work phone numbers */
  workPhones: string[];
}
