import { BaseEntity, NamedEntity, TimestampedEntity } from './common/interfaces';
import { Url } from './common';

/**
 * Represents a tag in the system
 * @interface Tag
 * @property {number} id - Unique identifier of the tag
 * @property {string} name - Name of the tag
 * @property {string} description - Detailed description of the tag
 * @property {string} category - Category the tag belongs to (e.g., "diet", "exercise", "health")
 * @property {string} [color] - Optional color code for the tag (e.g., "#FF0000")
 * @property {Url} [icon] - Optional URL to an icon for the tag
 * @property {boolean} isActive - Whether the tag is currently active
 * @property {string} createdDate - ISO date string when the tag was created
 * @property {string} updatedDate - ISO date string when the tag was last updated
 */
export interface Tag extends BaseEntity, NamedEntity, TimestampedEntity {
  description: string;
  category: string;
  color?: string;
  icon?: Url;
  isActive: boolean;
}

/**
 * Represents a category of tags
 * @interface TagCategory
 * @property {number} id - Unique identifier of the category
 * @property {string} name - Name of the category
 * @property {string} description - Detailed description of the category
 * @property {Tag[]} tags - List of tags in this category
 * @property {boolean} isActive - Whether the category is currently active
 * @property {string} createdDate - ISO date string when the category was created
 * @property {string} updatedDate - ISO date string when the category was last updated
 */
export interface TagCategory extends BaseEntity, NamedEntity, TimestampedEntity {
  description: string;
  tags: Tag[];
  isActive: boolean;
}

/**
 * Represents a mapping between a tag and an item
 * @interface TaggedItem
 * @property {number} id - Unique identifier of the mapping
 * @property {Tag} tag - The tag being applied
 * @property {string} itemType - Type of the item being tagged (e.g., "food", "recipe", "article")
 * @property {number} itemId - Unique identifier of the item being tagged
 * @property {string} createdDate - ISO date string when the tag was applied
 * @property {string} updatedDate - ISO date string when the tag was last updated
 */
export interface TaggedItem extends BaseEntity, TimestampedEntity {
  tag: Tag;
  itemType: string;
  itemId: number;
}

/**
 * Represents a group of related tags
 * @interface TagGroup
 * @property {number} id - Unique identifier of the group
 * @property {string} name - Name of the tag group
 * @property {string} description - Detailed description of the group
 * @property {Tag[]} tags - List of tags in this group
 * @property {boolean} isActive - Whether the group is currently active
 * @property {string} createdDate - ISO date string when the group was created
 * @property {string} updatedDate - ISO date string when the group was last updated
 */
export interface TagGroup extends BaseEntity, NamedEntity, TimestampedEntity {
  description: string;
  tags: Tag[];
  isActive: boolean;
}
