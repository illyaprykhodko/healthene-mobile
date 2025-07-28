import { MedicalProblemStatus, MedicalProblemSeverity } from '../common/enums';
import { BaseEntity, NamedEntity, TimestampedEntity, ActiveEntity, EntityReference } from '../common/interfaces';

/**
 * Represents a medical problem category
 * @interface MedicalProblemCategory
 * @property {number} id - Unique identifier of the category
 * @property {string} name - Name of the category
 * @property {string} [description] - Optional detailed description of the category
 * @property {EntityReference} [parent] - Optional reference to parent category
 * @property {string} [image] - Optional URL to an image representing the category
 * @property {MedicalProblem[]} problems - List of problems in this category
 * @property {boolean} isActive - Whether the category is currently active
 * @property {string} createdDate - ISO date string when the category was created
 * @property {string} updatedDate - ISO date string when the category was last updated
 */
export interface MedicalProblemCategory extends BaseEntity, NamedEntity, TimestampedEntity, ActiveEntity {
  /** Optional detailed description of the category */
  description?: string;
  /** Optional reference to parent category */
  parent?: EntityReference;
  /** Optional URL to an image representing the category */
  image?: string;
  /** List of problems in this category */
  problems: MedicalProblem[];
}

/**
 * Represents a symptom of a medical problem
 * @interface Symptom
 * @property {string} name - Name of the symptom
 * @property {string} [description] - Optional description of the symptom
 * @property {number} severity - Severity level (1-5)
 */
export interface Symptom {
  /** Name of the symptom */
  name: string;
  /** Optional description of the symptom */
  description?: string;
  /** Severity level (1-5) */
  severity: number;
}

/**
 * Represents a medication used for a medical problem
 * @interface Medication
 * @property {string} name - Name of the medication
 * @property {string} [dosage] - Optional dosage information
 * @property {string} [frequency] - Optional frequency of use
 */
export interface Medication {
  /** Name of the medication */
  name: string;
  /** Optional dosage information */
  dosage?: string;
  /** Optional frequency of use */
  frequency?: string;
}

/**
 * Represents a medical problem in the patient's history
 * @interface MedicalProblem
 * @property {number} id - Unique identifier of the medical problem
 * @property {string} name - Name of the medical problem
 * @property {string} [description] - Optional detailed description of the problem
 * @property {EntityReference} category - Reference to the category the problem belongs to
 * @property {string} [diagnosedDate] - Optional date of diagnosis
 * @property {string} [resolvedDate] - Optional date of resolution
 * @property {MedicalProblemStatus} status - Current status of the problem
 * @property {MedicalProblemSeverity} severity - Severity level of the problem
 * @property {Object} [treatment] - Optional treatment information
 * @property {string} [treatment.method] - Treatment method
 * @property {string} [treatment.duration] - Duration of treatment
 * @property {string} [treatment.outcome] - Outcome of treatment
 * @property {Symptom[]} [symptoms] - Optional list of symptoms
 * @property {Medication[]} [medications] - Optional list of medications
 * @property {string} [notes] - Optional additional notes
 * @property {string} [documentation] - Optional URL to medical documentation
 * @property {boolean} isActive - Whether the problem is currently active
 * @property {string} createdDate - ISO date string when the problem was created
 * @property {string} updatedDate - ISO date string when the problem was last updated
 */
export interface MedicalProblem extends BaseEntity, NamedEntity, TimestampedEntity, ActiveEntity {
  /** Optional detailed description of the problem */
  description?: string;
  /** Reference to the category the problem belongs to */
  category: EntityReference;
  /** Optional date of diagnosis */
  diagnosedDate?: string;
  /** Optional date of resolution */
  resolvedDate?: string;
  /** Current status of the problem */
  status: MedicalProblemStatus;
  /** Severity level of the problem */
  severity: MedicalProblemSeverity;
  /** Optional treatment information */
  treatment?: {
    /** Treatment method */
    method: string;
    /** Duration of treatment */
    duration: string;
    /** Outcome of treatment */
    outcome: string;
  };
  /** Optional list of symptoms */
  symptoms?: Symptom[];
  /** Optional list of medications */
  medications?: Medication[];
  /** Optional additional notes */
  notes?: string;
  /** Optional URL to medical documentation */
  documentation?: string;
}

/**
 * Represents a medical problem with its history
 * @interface MedicalProblemWithHistory
 * @property {MedicalProblem} - All properties from MedicalProblem interface
 * @property {MedicalProblemHistory[]} history - History of changes to the medical problem
 */
export interface MedicalProblemWithHistory extends MedicalProblem {
  /** History of changes to the medical problem */
  history: MedicalProblemHistory[];
}

/**
 * Represents a history entry for a medical problem
 * @interface MedicalProblemHistory
 * @property {number} medicalProblemId - ID of the medical problem
 * @property {MedicalProblemSeverity} [previousSeverity] - Previous severity level
 * @property {MedicalProblemSeverity} [newSeverity] - New severity level
 * @property {boolean} [previousIsActive] - Previous active status
 * @property {boolean} [newIsActive] - New active status
 * @property {string} [previousNotes] - Previous notes
 * @property {string} [newNotes] - New notes
 * @property {string} [changeReason] - Reason for the change
 * @property {string} createdDate - ISO date string when the history entry was created
 * @property {string} updatedDate - ISO date string when the history entry was last updated
 */
export interface MedicalProblemHistory extends TimestampedEntity {
  /** ID of the medical problem */
  medicalProblemId: number;
  /** Previous severity level */
  previousSeverity?: MedicalProblemSeverity;
  /** New severity level */
  newSeverity?: MedicalProblemSeverity;
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
