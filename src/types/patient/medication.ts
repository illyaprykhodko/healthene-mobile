import { BaseEntity, NamedEntity, TimestampedEntity } from '../common/interfaces';

/**
 * Represents a medication category
 * @interface MedicationCategory
 * @property {number} id - Unique identifier of the category
 * @property {string} name - Name of the category
 * @property {string} [description] - Optional detailed description of the category
 * @property {boolean} isActive - Whether the category is currently active
 */
export interface MedicationCategory extends BaseEntity, NamedEntity {
  /** Description of the category */
  description?: string;
  isActive: boolean;
}

/**
 * Represents a medication form (e.g., tablet, liquid, injection)
 * @interface MedicationForm
 * @property {number} id - Unique identifier of the form
 * @property {string} name - Name of the form (e.g., "Tablet", "Liquid", "Injection")
 * @property {string} [description] - Optional detailed description of the form
 * @property {boolean} isActive - Whether the form is currently active
 */
export interface MedicationForm extends BaseEntity, NamedEntity {
  /** Description of the form */
  description?: string;
  isActive: boolean;
}

/**
 * Represents a medication unit (e.g., mg, ml, units)
 * @interface MedicationUnit
 * @property {number} id - Unique identifier of the unit
 * @property {string} name - Name of the unit (e.g., "Milligram", "Milliliter")
 * @property {string} symbol - Symbol of the unit (e.g., "mg", "ml")
 * @property {string} [description] - Optional detailed description of the unit
 * @property {boolean} isActive - Whether the unit is currently active
 */
export interface MedicationUnit extends BaseEntity, NamedEntity {
  /** Symbol of the unit */
  symbol: string;
  /** Description of the unit */
  description?: string;
  isActive: boolean;
}

/**
 * Represents a medication frequency
 * @interface MedicationFrequency
 * @property {number} id - Unique identifier of the frequency
 * @property {string} name - Name of the frequency (e.g., "Once daily", "Twice daily")
 * @property {number} timesPerDay - Number of times per day the medication should be taken
 * @property {string} [description] - Optional detailed description of the frequency
 * @property {boolean} isActive - Whether the frequency is currently active
 */
export interface MedicationFrequency extends BaseEntity, NamedEntity {
  /** Number of times per day */
  timesPerDay: number;
  /** Description of the frequency */
  description?: string;
  isActive: boolean;
}

/**
 * Represents a medication
 * @interface Medication
 * @property {number} id - Unique identifier of the medication
 * @property {string} name - Name of the medication
 * @property {string} [description] - Optional detailed description of the medication
 * @property {MedicationCategory} category - Category the medication belongs to
 * @property {MedicationForm} form - Form of the medication (e.g., tablet, liquid)
 * @property {MedicationUnit} unit - Unit of measurement for the medication
 * @property {number} dosage - Amount of medication to be taken
 * @property {MedicationFrequency} frequency - How often the medication should be taken
 * @property {string} startDate - ISO date string when the medication was started
 * @property {string} [endDate] - Optional ISO date string when the medication should end
 * @property {string} [notes] - Optional additional notes about the medication
 * @property {boolean} isActive - Whether the medication is currently active
 * @property {boolean} isPrescribed - Whether the medication requires a prescription
 * @property {boolean} isOverTheCounter - Whether the medication is available over the counter
 * @property {string} createdDate - ISO date string when the medication was created
 * @property {string} updatedDate - ISO date string when the medication was last updated
 */
export interface Medication extends BaseEntity, NamedEntity, TimestampedEntity {
  /** Name of the medication */
  name: string;
  /** Description of the medication */
  description?: string;
  /** Category of the medication */
  category: MedicationCategory;
  /** Form of the medication */
  form: MedicationForm;
  /** Unit of the medication */
  unit: MedicationUnit;
  /** Dosage of the medication */
  dosage: number;
  /** Frequency of the medication */
  frequency: MedicationFrequency;
  /** Start date of the medication */
  startDate: string;
  /** End date of the medication (if applicable) */
  endDate?: string;
  /** Additional notes about the medication */
  notes?: string;
  /** Whether the medication is active */
  isActive: boolean;
  /** Whether the medication is prescribed */
  isPrescribed: boolean;
  /** Whether the medication is over the counter */
  isOverTheCounter: boolean;
}

/**
 * Represents a medication with its history
 * @interface MedicationWithHistory
 * @property {Medication} - All properties from Medication interface
 * @property {MedicationHistory[]} history - History of changes to the medication
 */
export interface MedicationWithHistory extends Medication {
  /** History of changes to the medication */
  history: MedicationHistory[];
}

/**
 * Represents a history entry for a medication
 * @interface MedicationHistory
 * @property {number} medicationId - ID of the medication
 * @property {number} [previousDosage] - Previous dosage amount
 * @property {number} [newDosage] - New dosage amount
 * @property {Object} [previousFrequency] - Previous frequency information
 * @property {number} previousFrequency.id - ID of the previous frequency
 * @property {Object} [newFrequency] - New frequency information
 * @property {number} newFrequency.id - ID of the new frequency
 * @property {boolean} [previousIsActive] - Previous active status
 * @property {boolean} [newIsActive] - New active status
 * @property {string} [previousNotes] - Previous notes
 * @property {string} [newNotes] - New notes
 * @property {string} [changeReason] - Reason for the change
 * @property {string} createdDate - ISO date string when the history entry was created
 * @property {string} updatedDate - ISO date string when the history entry was last updated
 */
export interface MedicationHistory extends TimestampedEntity {
  /** ID of the medication */
  medicationId: number;
  /** Previous dosage */
  previousDosage?: number;
  /** New dosage */
  newDosage?: number;
  /** Previous frequency */
  previousFrequency?: {
    id: number;
  };
  /** New frequency */
  newFrequency?: {
    id: number;
  };
  /** Previous active status */
  previousIsActive?: boolean;
  /** New active status */
  newIsActive?: boolean;
  /** Previous notes */
  previousNotes?: string;
  /** New notes */
  newNotes?: string;
  /** Reason for the change */
  changeReason?: string;
}
