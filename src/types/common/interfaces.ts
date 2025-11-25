/**
 * Represents a basic entity with an ID
 * @interface BaseEntity
 * @property {number} id - Unique identifier of the entity
 */
export interface BaseEntity {
  /** Unique identifier of the entity */
  id: number;
}

/**
 * Represents a named entity with an ID and name
 * @interface NamedEntity
 * @extends BaseEntity
 * @property {number} id - Unique identifier of the entity
 * @property {string} name - Name of the entity
 */
export interface NamedEntity extends BaseEntity {
  /** Name of the entity */
  name: string;
}

/**
 * Represents an entity with creation and update timestamps
 * @interface TimestampedEntity
 * @property {string} createdDate - ISO date string when the entity was created
 * @property {string} updatedDate - ISO date string when the entity was last updated
 */
export interface TimestampedEntity {
  /** ISO date string when the entity was created */
  createdDate: string;
  /** ISO date string when the entity was last updated */
  updatedDate: string;
}

/**
 * Represents an entity with an active status
 * @interface ActiveEntity
 * @property {boolean} isActive - Whether the entity is currently active
 */
export interface ActiveEntity {
  /** Whether the entity is currently active */
  isActive: boolean;
}

/**
 * Represents a cover image with URL and optional metadata
 * @interface CoverImage
 * @property {string} url - URL of the cover image
 * @property {string} [alt] - Optional alternative text for the image
 * @property {number} [width] - Optional width of the image in pixels
 * @property {number} [height] - Optional height of the image in pixels
 */
export interface CoverImage {
  /** URL of the cover image */
  url: string;
  /** Optional alternative text for the image */
  alt?: string;
  /** Optional width of the image in pixels */
  width?: number;
  /** Optional height of the image in pixels */
  height?: number;
}

/**
 * Represents a reference to another entity with optional metadata
 * @interface EntityReference
 * @property {number} id - ID of the referenced entity
 * @property {string} [type] - Optional type of the referenced entity
 * @property {string} [name] - Optional name of the referenced entity
 */
export interface EntityReference {
  /** ID of the referenced entity */
  id: number;
  /** Optional type of the referenced entity */
  type?: string;
  /** Optional name of the referenced entity */
  name?: string;
}
/**
 * Represents pagination query parameters
 * @interface PaginatedParams
 * @property {number} page - Page number to request
 * @property {number} [size] - Optional number of items per page
 * @property {string} [sort] - Optional sorting field, e.g. "name,asc"
 */
export interface PaginatedParams {
  page: number;
  size?: number;
  sort?: string;
}
/**
 * Represents a standard paginated API response following Spring-style pagination.
 * @interface PaginatedResponse
 * @template T - Type of items contained in the paginated result.
 *
 * @property {T[]} content - Array of items in the current page.
 * @property {number} totalElements - Total number of items across all pages.
 * @property {number} pageNumber - Current page number (0-based by backend, can be mapped to 1-based in UI).
 * @property {number} size - Number of items per page.
 * @property {number} totalPages - Total number of available pages.
 * @property {number} offset - Numeric offset representing the index of the first item in the current page.
 * @property {boolean} hasPrevious - Whether a previous page exists.
 */
export interface PaginatedResponse<T> {
  /** Array of items in the current page */
  content: T[];
  /** Total number of items across all pages */
  totalElements: number;
  /** Current page number (0-based by backend, can be mapped to 1-based in UI) */
  pageNumber: number;
  /** Number of items per page */
  size: number;
  /** Total number of pages */
  totalPages: number;
  /** Numeric offset representing the index of the first item in the current page */
  offset: number;
  /** Whether a previous page exists */
  hasPrevious: boolean;
}

/**
 * Represents a response with metadata
 * @interface ResponseWithMetadata
 * @template T - Type of the response data
 * @template M - Type of the metadata
 * @property {T} data - Response data
 * @property {M} metadata - Response metadata
 */
export interface ResponseWithMetadata<T, M> {
  /** Response data */
  data: T;
  /** Response metadata */
  metadata: M;
}
