// local dependencies
import { Country, Url, State } from './common';
import { BaseEntity, NamedEntity, TimestampedEntity } from './common/interfaces';
/**
 * Represents additional contact information
 * @interface AdditionalContacts
 * @property {string[]} emails - Array of email addresses
 * @property {string[]} cellPhones - Array of cell phone numbers
 * @property {string[]} homePhones - Array of home phone numbers
 * @property {string[]} workPhones - Array of work phone numbers
 * @property {boolean} isActive - Whether the contact information is currently active
 */
export interface AdditionalContacts {
  emails: string[];
  cellPhones: string[];
  homePhones: string[];
  workPhones: string[];
  isActive: boolean;
}

/**
 * Represents a physical address
 * @interface Address
 * @property {number} id - Unique identifier of the address
 * @property {string} city - City name
 * @property {string} state - State/province name (appears only if the selected country is the USA)
 * @property {string} country - Country name
 * @property {string} address1 - The first line of the address
 * @property {string} [address2] - Optional second address line for additional details such as apartment, suite, or building number
 * @property {string} zipCode - Postal code or ZIP code
 * @property {string} description - Description of the address
 */
export interface Address extends BaseEntity {
  city: string;
  state: State;
  zipCode: string;
  address1: string;
  country: Country;
  address2?: string;
  description: string;
}

/**
 * Represents a contact person
 * @interface Contact
 * @property {number} id - Unique identifier of the contact
 * @property {string} firstName - First name of the contact
 * @property {string} lastName - Last name of the contact
 * @property {string} [title] - Optional title (e.g., Dr., Mr., Ms.)
 * @property {string} [role] - Optional role or position
 * @property {Object} contact - Contact information
 * @property {string} contact.email - Primary email address
 * @property {string} [contact.phone] - Optional phone number
 * @property {string} [contact.mobile] - Optional mobile number
 * @property {string} [contact.fax] - Optional fax number
 * @property {Object[]} [addresses] - Optional list of addresses
 * @property {Address} addresses.address - The address
 * @property {string} [addresses.type] - Type of address (e.g., home, work)
 * @property {Object[]} [socialMedia] - Optional social media profiles
 * @property {string} socialMedia.platform - Name of the social media platform
 * @property {string} socialMedia.url - URL to the social media profile
 * @property {Url} [image] - Optional profile image URL
 * @property {string} [notes] - Optional additional notes
 * @property {boolean} isActive - Whether the contact is currently active
 * @property {string} createdDate - ISO date string when the contact was created
 * @property {string} updatedDate - ISO date string when the contact was last updated
 */
export interface Contact extends BaseEntity, TimestampedEntity {
  firstName: string;
  lastName: string;
  title?: string;
  role?: string;
  contact: {
    email: string;
    phone?: string;
    mobile?: string;
    fax?: string;
  };
  addresses?: {
    address: Address;
    type?: string;
  }[];
  socialMedia?: {
    platform: string;
    url: string;
  }[];
  image?: Url;
  notes?: string;
  isActive: boolean;
}

/**
 * Represents a contact group
 * @interface ContactGroup
 * @property {number} id - Unique identifier of the group
 * @property {string} name - Name of the group
 * @property {string} description - Detailed description of the group
 * @property {Contact[]} contacts - List of contacts in the group
 * @property {string} [category] - Optional category of the group
 * @property {string} [notes] - Optional additional notes
 * @property {boolean} isActive - Whether the group is currently active
 * @property {string} createdDate - ISO date string when the group was created
 * @property {string} updatedDate - ISO date string when the group was last updated
 */
export interface ContactGroup extends BaseEntity, NamedEntity, TimestampedEntity {
  description: string;
  contacts: Contact[];
  category?: string;
  notes?: string;
  isActive: boolean;
}
