import { BaseEntity, NamedEntity, TimestampedEntity } from './common/interfaces';

/**
 * Represents a taxonomy term in the system
 * @interface Taxonomy
 * @property {number} id - Unique identifier of the taxonomy term
 * @property {string} name - Name of the taxonomy term
 * @property {string} description - Detailed description of the term
 * @property {Taxonomy} [parent] - Optional parent taxonomy term
 * @property {number} level - Hierarchical level in the taxonomy tree (0 for root)
 * @property {string} path - Full path from root to this term (e.g., "root/parent/child")
 * @property {boolean} isActive - Whether the term is currently active
 * @property {string} createdDate - ISO date string when the term was created
 * @property {string} updatedDate - ISO date string when the term was last updated
 */
export interface Taxonomy extends BaseEntity, NamedEntity, TimestampedEntity {
  description: string;
  parent?: Taxonomy;
  level: number;
  path: string;
  isActive: boolean;
}

/**
 * Represents a category of taxonomy terms
 * @interface TaxonomyCategory
 * @property {number} id - Unique identifier of the category
 * @property {string} name - Name of the category
 * @property {string} description - Detailed description of the category
 * @property {Taxonomy[]} taxonomies - List of taxonomy terms in this category
 * @property {boolean} isActive - Whether the category is currently active
 * @property {string} createdDate - ISO date string when the category was created
 * @property {string} updatedDate - ISO date string when the category was last updated
 */
export interface TaxonomyCategory extends BaseEntity, NamedEntity, TimestampedEntity {
  description: string;
  taxonomies: Taxonomy[];
  isActive: boolean;
}

/**
 * Represents a mapping between a taxonomy term and an item
 * @interface TaxonomyMapping
 * @property {number} id - Unique identifier of the mapping
 * @property {Taxonomy} taxonomy - The taxonomy term being mapped
 * @property {string} itemType - Type of the item being mapped (e.g., "food", "recipe", "article")
 * @property {number} itemId - Unique identifier of the item being mapped
 * @property {string} createdDate - ISO date string when the mapping was created
 * @property {string} updatedDate - ISO date string when the mapping was last updated
 */
export interface TaxonomyMapping extends BaseEntity, TimestampedEntity {
  taxonomy: Taxonomy;
  itemType: string;
  itemId: number;
}

/**
 * Represents a taxonomy tree structure
 * @interface TaxonomyTree
 * @property {number} id - Unique identifier of the tree
 * @property {string} name - Name of the taxonomy tree
 * @property {string} description - Detailed description of the tree
 * @property {Taxonomy} root - Root taxonomy term of the tree
 * @property {boolean} isActive - Whether the tree is currently active
 * @property {string} createdDate - ISO date string when the tree was created
 * @property {string} updatedDate - ISO date string when the tree was last updated
 */
export interface TaxonomyTree extends BaseEntity, NamedEntity, TimestampedEntity {
  description: string;
  root: Taxonomy;
  isActive: boolean;
}
