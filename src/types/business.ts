import { Address } from './contact';
import { IdName, Url } from './common';

/**
 * Represents a business entity in the system
 * @interface Business
 * @property {number} id - Unique identifier of the business
 * @property {string} name - Name of the business
 * @property {string} description - Detailed description of the business
 * @property {IdName} category - Category the business belongs to
 * @property {Url} [logo] - Optional URL to the business logo
 * @property {Url} [image] - Optional URL to a business image
 * @property {Address} address - Physical address of the business
 * @property {Object} contact - Contact information
 * @property {string} contact.phoneNumber - Primary phone number
 * @property {string} contact.email - Primary email address
 * @property {string} [contact.website] - Optional website URL
 * @property {Object[]} [socialMedia] - Optional social media links
 * @property {string} socialMedia.platform - Name of the social media platform
 * @property {string} socialMedia.url - URL to the social media profile
 * @property {Object} [operatingHours] - Optional operating hours
 * @property {Object[]} operatingHours.schedule - Weekly schedule
 * @property {string} operatingHours.schedule.day - Day of the week
 * @property {string} operatingHours.schedule.open - Opening time in HH:mm format
 * @property {string} operatingHours.schedule.close - Closing time in HH:mm format
 * @property {string[]} [services] - Optional list of services offered
 * @property {string[]} [specialties] - Optional list of business specialties
 * @property {boolean} isActive - Whether the business is currently active
 * @property {string} createdDate - ISO date string when the business was created
 * @property {string} updatedDate - ISO date string when the business was last updated
 */
export interface Business {
  id: number;
  name: string;
  description: string;
  category: IdName;
  logo?: Url;
  image?: Url;
  address: Address;
  contact: {
    phoneNumber: string;
    email: string;
    website?: string;
  };
  socialMedia?: {
    platform: string;
    url: string;
  }[];
  operatingHours?: {
    schedule: {
      day: string;
      open: string;
      close: string;
    }[];
  };
  services?: string[];
  specialties?: string[];
  isActive: boolean;
  createdDate: string;
  updatedDate: string;
}

/**
 * Represents a category of businesses
 * @interface BusinessCategory
 * @property {number} id - Unique identifier of the category
 * @property {string} name - Name of the category
 * @property {string} description - Detailed description of the category
 * @property {IdName} [parent] - Optional parent category
 * @property {Url} [image] - Optional URL to an image representing the category
 * @property {Business[]} businesses - List of businesses in this category
 * @property {boolean} isActive - Whether the category is currently active
 * @property {string} createdDate - ISO date string when the category was created
 * @property {string} updatedDate - ISO date string when the category was last updated
 */
export interface BusinessCategory {
  id: number;
  name: string;
  description: string;
  parent?: IdName;
  image?: Url;
  businesses: Business[];
  isActive: boolean;
  createdDate: string;
  updatedDate: string;
}

/**
 * Represents a review for a business
 * @interface BusinessReview
 * @property {number} id - Unique identifier of the review
 * @property {Business} business - The business being reviewed
 * @property {number} rating - Rating given (typically 1-5)
 * @property {string} comment - Detailed review comment
 * @property {string} userName - Name of the user who wrote the review
 * @property {Object} [metrics] - Optional review metrics
 * @property {number} [metrics.service] - Service quality rating
 * @property {number} [metrics.value] - Value for money rating
 * @property {number} [metrics.environment] - Environment rating
 * @property {string} createdDate - ISO date string when the review was created
 * @property {string} updatedDate - ISO date string when the review was last updated
 */
export interface BusinessReview {
  id: number;
  business: Business;
  rating: number;
  comment: string;
  userName: string;
  metrics?: {
    service: number;
    value: number;
    environment: number;
  };
  createdDate: string;
  updatedDate: string;
}

/**
 * Represents a business service
 * @interface BusinessService
 * @property {number} id - Unique identifier of the service
 * @property {Business} business - The business offering this service
 * @property {string} name - Name of the service
 * @property {string} description - Detailed description of the service
 * @property {number} price - Price of the service
 * @property {string} currency - Currency code (e.g., USD, EUR)
 * @property {string} [duration] - Optional duration of the service
 * @property {string[]} [features] - Optional list of service features
 * @property {boolean} isAvailable - Whether the service is currently available
 * @property {boolean} isActive - Whether the service is currently active
 * @property {string} createdDate - ISO date string when the service was created
 * @property {string} updatedDate - ISO date string when the service was last updated
 */
export interface BusinessService {
  id: number;
  business: Business;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration?: string;
  features?: string[];
  isAvailable: boolean;
  isActive: boolean;
  createdDate: string;
  updatedDate: string;
}
