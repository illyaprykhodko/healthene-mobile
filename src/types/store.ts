import { BaseEntity, NamedEntity, TimestampedEntity } from './common/interfaces';
import { Url } from './common';
import { Address } from './contact';

/**
 * Represents a store's opening hours for a specific day
 * @interface StoreOpeningHours
 * @property {string} day - Day of the week (e.g., "Monday", "Tuesday")
 * @property {string} open - Opening time in HH:mm format (e.g., "09:00")
 * @property {string} close - Closing time in HH:mm format (e.g., "17:00")
 */
export interface StoreOpeningHours {
  day: string;
  open: string;
  close: string;
}

/**
 * Represents a store in the system
 * @interface Store
 * @property {number} id - Unique identifier of the store
 * @property {string} name - Name of the store
 * @property {string} description - Detailed description of the store
 * @property {Address} address - Physical address of the store
 * @property {string} phoneNumber - Contact phone number in international format
 * @property {string} email - Contact email address
 * @property {string} [website] - Optional website URL
 * @property {Url} [image] - Optional URL to an image of the store
 * @property {StoreOpeningHours[]} openingHours - Store's opening hours for each day
 * @property {boolean} isActive - Whether the store is currently active
 * @property {string} createdDate - ISO date string when the store was created
 * @property {string} updatedDate - ISO date string when the store was last updated
 */
export interface Store extends BaseEntity, NamedEntity, TimestampedEntity {
  description: string;
  address: Address;
  phoneNumber: string;
  email: string;
  website?: string;
  image?: Url;
  openingHours: StoreOpeningHours[];
  isActive: boolean;
}

/**
 * Represents a category of stores
 * @interface StoreCategory
 * @property {number} id - Unique identifier of the category
 * @property {string} name - Name of the category
 * @property {string} description - Detailed description of the category
 * @property {Store[]} stores - List of stores in this category
 * @property {boolean} isActive - Whether the category is currently active
 * @property {string} createdDate - ISO date string when the category was created
 * @property {string} updatedDate - ISO date string when the category was last updated
 */
export interface StoreCategory extends BaseEntity, NamedEntity, TimestampedEntity {
  description: string;
  stores: Store[];
  isActive: boolean;
}

/**
 * Represents a product available in a store
 * @interface StoreProduct
 * @property {number} id - Unique identifier of the product
 * @property {Store} store - The store where this product is available
 * @property {string} name - Name of the product
 * @property {string} description - Detailed description of the product
 * @property {number} price - Price of the product in the specified currency
 * @property {string} currency - Currency code (e.g., "USD", "EUR")
 * @property {Url} [image] - Optional URL to an image of the product
 * @property {string} category - Category the product belongs to (e.g., "Groceries", "Health")
 * @property {boolean} isAvailable - Whether the product is currently in stock
 * @property {boolean} isActive - Whether the product is currently active
 * @property {string} createdDate - ISO date string when the product was created
 * @property {string} updatedDate - ISO date string when the product was last updated
 */
export interface StoreProduct extends BaseEntity, NamedEntity, TimestampedEntity {
  store: Store;
  description: string;
  price: number;
  currency: string;
  image?: Url;
  category: string;
  isAvailable: boolean;
  isActive: boolean;
}

/**
 * Represents a review for a store
 * @interface StoreReview
 * @property {number} id - Unique identifier of the review
 * @property {Store} store - The store being reviewed
 * @property {number} rating - Rating given (1-5 stars)
 * @property {string} comment - Detailed review comment
 * @property {string} userName - Name of the user who wrote the review
 * @property {string} createdDate - ISO date string when the review was created
 * @property {string} updatedDate - ISO date string when the review was last updated
 */
export interface StoreReview extends BaseEntity, TimestampedEntity {
  store: Store;
  rating: number;
  comment: string;
  userName: string;
}
