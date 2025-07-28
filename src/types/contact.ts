import { BaseEntity, NamedEntity, TimestampedEntity } from './common/interfaces';
import { Url } from './common';

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
 * @property {string} street - Street address
 * @property {string} [unit] - Optional unit/apartment number
 * @property {string} city - City name
 * @property {string} state - State/province name
 * @property {string} postalCode - Postal/ZIP code
 * @property {string} country - Country name
 * @property {Object} [coordinates] - Optional geographical coordinates
 * @property {number} coordinates.latitude - Latitude value
 * @property {number} coordinates.longitude - Longitude value
 * @property {string} [notes] - Optional additional address notes
 * @property {boolean} isActive - Whether the address is currently active
 * @property {string} createdDate - ISO date string when the address was created
 * @property {string} updatedDate - ISO date string when the address was last updated
 */
export interface Address extends BaseEntity, TimestampedEntity {
  street: string;
  unit?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  notes?: string;
  isActive: boolean;
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
