import { BaseEntity, NamedEntity, TimestampedEntity } from './common/interfaces';
import { Food } from './food';
import { Store } from './store';

/**
 * Represents an item in a shopping list
 * @interface ShoppingListItem
 * @property {Food} food - The food item to purchase
 * @property {number} amount - Quantity of the food item
 * @property {string} unit - Unit of measurement (e.g., "kg", "pieces", "liters")
 * @property {boolean} isChecked - Whether the item has been purchased
 */
export interface ShoppingListItem {
  food: Food;
  amount: number;
  unit: string;
  isChecked: boolean;
}

/**
 * Represents a shopping list
 * @interface ShoppingList
 * @property {number} id - Unique identifier of the list
 * @property {string} name - Name of the shopping list
 * @property {string} description - Detailed description of the list
 * @property {ShoppingListItem[]} items - List of items to purchase
 * @property {Store} [store] - Optional preferred store for shopping
 * @property {boolean} isActive - Whether the list is currently active
 * @property {string} createdDate - ISO date string when the list was created
 * @property {string} updatedDate - ISO date string when the list was last updated
 */
export interface ShoppingList extends BaseEntity, NamedEntity, TimestampedEntity {
  description: string;
  items: ShoppingListItem[];
  store?: Store;
  isActive: boolean;
}

/**
 * Represents a category of shopping lists
 * @interface ShoppingListCategory
 * @property {number} id - Unique identifier of the category
 * @property {string} name - Name of the category
 * @property {string} description - Detailed description of the category
 * @property {ShoppingList[]} lists - List of shopping lists in this category
 * @property {boolean} isActive - Whether the category is currently active
 * @property {string} createdDate - ISO date string when the category was created
 * @property {string} updatedDate - ISO date string when the category was last updated
 */
export interface ShoppingListCategory extends BaseEntity, NamedEntity, TimestampedEntity {
  description: string;
  lists: ShoppingList[];
  isActive: boolean;
}

/**
 * Represents a shopping history entry
 * @interface ShoppingHistory
 * @property {number} id - Unique identifier of the history entry
 * @property {ShoppingList} list - The shopping list that was purchased
 * @property {string} date - ISO date string when the shopping was done
 * @property {number} totalAmount - Total cost of the shopping
 * @property {string} currency - Currency code (e.g., "USD", "EUR")
 * @property {string} [notes] - Optional notes about the shopping trip
 * @property {string} createdDate - ISO date string when the history entry was created
 * @property {string} updatedDate - ISO date string when the history entry was last updated
 */
export interface ShoppingHistory extends BaseEntity, TimestampedEntity {
  list: ShoppingList;
  date: string;
  totalAmount: number;
  currency: string;
  notes?: string;
}

/**
 * Represents a preferred item in a store
 * @interface ShoppingPreferenceItem
 * @property {Food} food - The preferred food item
 * @property {number} amount - Default quantity to purchase
 * @property {string} unit - Unit of measurement (e.g., "kg", "pieces", "liters")
 */
export interface ShoppingPreferenceItem {
  food: Food;
  amount: number;
  unit: string;
}

/**
 * Represents shopping preferences for a store
 * @interface ShoppingPreference
 * @property {number} id - Unique identifier of the preference
 * @property {Store} store - The store these preferences apply to
 * @property {ShoppingPreferenceItem[]} preferredItems - List of preferred items to purchase
 * @property {boolean} isActive - Whether the preferences are currently active
 * @property {string} createdDate - ISO date string when the preferences were created
 * @property {string} updatedDate - ISO date string when the preferences were last updated
 */
export interface ShoppingPreference extends BaseEntity, TimestampedEntity {
  store: Store;
  preferredItems: ShoppingPreferenceItem[];
  isActive: boolean;
}
