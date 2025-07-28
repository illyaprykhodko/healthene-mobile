import { Url } from './common';
import { BaseEntity, NamedEntity, TimestampedEntity } from './common/interfaces';
import { DiagnoseType, MedicalProblemStatus, MedicalProblemSeverity } from './common/enums';

/**
 * Represents a library setting for medical content
 * @interface LibrarySetting
 * @property {number} id - Unique identifier of the setting
 * @property {string} category - Category of the medical content
 * @property {string[]} dayOfWeeks - Days of the week when content should be shown (e.g., ["Monday", "Wednesday"])
 * @property {string} time - Time of day when content should be shown (HH:mm format)
 * @property {boolean} isActive - Whether the setting is currently active
 */
export interface LibrarySetting extends BaseEntity {
  category: string;
  dayOfWeeks: string[];
  time: string;
  isActive: boolean;
}

/**
 * Represents a medical term in the system
 * @interface MedicalTerm
 * @property {number} id - Unique identifier of the term
 * @property {string} name - Name of the medical term
 * @property {string} description - Detailed description of the term
 * @property {Url} coverImage - URL to the cover image for the term
 * @property {number} attachmentsCount - Number of attachments associated with the term
 */
export interface MedicalTerm extends BaseEntity, NamedEntity {
  description: string;
  coverImage: Url;
  attachmentsCount: number;
}

/**
 * Represents a patient's medical problem
 * @interface PatientMedicalProblem
 * @property {number} id - Unique identifier of the problem
 * @property {string} name - Name of the medical problem
 * @property {string} [description] - Optional detailed description of the problem
 * @property {MedicalProblemStatus} status - Current status of the problem
 * @property {MedicalProblemSeverity} severity - Severity level of the problem
 * @property {DiagnoseType} diagnoseType - Type of diagnosis for the problem
 * @property {string} startDate - ISO date string when the problem was first diagnosed
 * @property {string} [endDate] - Optional ISO date string when the problem was resolved
 * @property {boolean} isActive - Whether the problem is currently active
 * @property {string} createdDate - ISO date string when the problem was created
 * @property {string} updatedDate - ISO date string when the problem was last updated
 */
export interface PatientMedicalProblem extends BaseEntity, NamedEntity, TimestampedEntity {
  description?: string;
  status: MedicalProblemStatus;
  severity: MedicalProblemSeverity;
  diagnoseType: DiagnoseType;
  startDate: string;
  endDate?: string;
  isActive: boolean;
}

/**
 * Represents a medical problem with additional details
 * @interface MedicalProblem
 * @extends PatientMedicalProblem
 * @property {string} category - Category of the medical problem
 * @property {string[]} symptoms - List of symptoms associated with the problem
 * @property {string[]} treatments - List of possible treatments
 * @property {string[]} riskFactors - List of risk factors
 * @property {string[]} complications - List of possible complications
 * @property {string[]} prevention - List of prevention measures
 * @property {string[]} references - List of medical references
 */
export interface MedicalProblem extends PatientMedicalProblem {
  category: string;
  symptoms: string[];
  treatments: string[];
  riskFactors: string[];
  complications: string[];
  prevention: string[];
  references: string[];
}

/**
 * Represents a file attachment in the system
 * @interface FileAttachment
 * @property {number} id - Unique identifier of the attachment
 * @property {string} name - Name of the file
 * @property {Url} url - URL to access the file
 * @property {string} type - MIME type of the file (e.g., "application/pdf", "image/jpeg")
 * @property {number} size - Size of the file in bytes
 * @property {string} createdDate - ISO date string when the file was uploaded
 */
export interface FileAttachment extends BaseEntity, NamedEntity, TimestampedEntity {
  url: Url;
  type: string;
  size: number;
}
