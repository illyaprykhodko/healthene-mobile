import { Url, IdName, Country, State } from './common';
import { AdditionalContacts, Address } from './contact';
import { FileAttachment, PatientMedicalProblem } from './medical';
import { Gender, OnboardingStatus, OnboardingStep } from './common/enums';

export interface ActiveVisit { id: number; }
export interface UserAlgorithmRun {
  id: number;
  message?: string;
  algorithmRunState: 'ERROR' | 'SUCCESS';
}

export interface Clinic extends IdName {}
export interface ContactMethod {
    additionalInfo?: string;
    preferredContactMethod: string; // enum PreferredContactMethod
}

export interface Ethnicity {
  feature: string;    // enum EthnicityFeature
  additionalInfo?: string;
}

export interface RejectionReason {
  id: number;
  reason: string;     // enum RejectionReasonCode
  message: string;
}

export interface Physician {
  id: number;
  name: string;
  username: string;
  enabled: boolean;
  coverImage: Url;
  roles: IdName[];
  clinicRole: string;   // enum ClinicRole
  createdDate: string;
  permissions: IdName[];
  hasDrChronoToken: boolean;
}

export interface UserPlan {
  id: number;
  name: string;
  goal?: string;
  descriptionForPatient?: string;
  descriptionReferences: PlanReference[];
  references: PlanReference[];
  allowUserToChangeCaloriesDistribution: boolean;
}

export interface PlanReference {
  id: number;
  name: string;
  url?: string;
  order?: number;
  description?: string;
}

/**
 * Authentication data for login
 */
export interface LoginData {
  username: string;
  password: string;
}

/**
 * Authentication data for sign up
 */
// export interface SignUpData {
//   email: string;
//   password: string;
//   firstName: string;
//   lastName: string;
//   phone?: string;
// }

/**
 * User session with authentication tokens
 */
// export interface Session {
//   accessToken: string;
//   refreshToken: string;
//   user: User;
// }

/**
 * Represents a user in the system
 * @interface User
 * @property {number} id - Unique identifier of the user
 * @property {string} email - User's email address
 * @property {string} [phone] - Optional phone number
 * @property {string} firstName - User's first name
 * @property {string} lastName - User's last name
 * @property {string} [title] - Optional title (e.g., Dr., Mr., Ms.)
 * @property {Url} [avatar] - Optional URL to user's avatar image
 * @property {Object} [preferences] - Optional user preferences
 * @property {string} [preferences.language] - Preferred language code
 * @property {string} [preferences.timezone] - Preferred timezone
 * @property {string} [preferences.currency] - Preferred currency code
 * @property {Object} [preferences.notifications] - Notification preferences
 * @property {boolean} [preferences.notifications.email] - Whether to receive email notifications
 * @property {boolean} [preferences.notifications.push] - Whether to receive push notifications
 * @property {boolean} [preferences.notifications.sms] - Whether to receive SMS notifications
 * @property {Object} [preferences.privacy] - Privacy preferences
 * @property {boolean} [preferences.privacy.profileVisible] - Whether profile is visible to others
 * @property {boolean} [preferences.privacy.activityVisible] - Whether activity is visible to others
 * @property {Address} [address] - Optional physical address
 * @property {Object} [health] - Optional health information
 * @property {string} [health.bloodType] - Blood type
 * @property {string[]} [health.allergies] - List of allergies
 * @property {string[]} [health.conditions] - List of medical conditions
 * @property {string[]} [health.medications] - List of medications
 * @property {Object} [emergencyContact] - Optional emergency contact
 * @property {string} emergencyContact.name - Name of emergency contact
 * @property {string} emergencyContact.relationship - Relationship to user
 * @property {string} emergencyContact.phone - Phone number
 * @property {string} [emergencyContact.email] - Optional email address
 * @property {string} [emergencyContact.address] - Optional address
 * @property {string} role - User's role in the system
 * @property {boolean} isActive - Whether the user is currently active
 * @property {string} createdDate - ISO date string when the user was created
 * @property {string} updatedDate - ISO date string when the user was last updated
 */
export interface User {
  id: number;
  email: string;
  phone?: string;
  firstName: string;
  middleName: string;
  lastName: string;
  birthday: Date;
  prefix: string;
  suffix: string;
  gender: string;
  title?: string;
  avatar?: Url;
  coverImage: {
    url: string;
  },
  preferences?: {
    language?: string;
    timezone?: string;
    currency?: string;
    notifications?: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    privacy?: {
      profileVisible: boolean;
      activityVisible: boolean;
    };
  };
  address?: Address;
  health?: {
    bloodType?: string;
    allergies?: string[];
    conditions?: string[];
    medications?: string[];
  };
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
    address?: string;
  };
  role: string;
  isActive: boolean;
  createdDate: string;
  updatedDate: string;
  preferenceTemplatesExist: boolean;
}

/**
 * Represents a user role
 * @interface UserRole
 * @property {number} id - Unique identifier of the role
 * @property {string} name - Name of the role
 * @property {string} description - Detailed description of the role
 * @property {string[]} permissions - List of permissions granted to this role
 * @property {boolean} isActive - Whether the role is currently active
 * @property {string} createdDate - ISO date string when the role was created
 * @property {string} updatedDate - ISO date string when the role was last updated
 */
export interface UserRole {
  id: number;
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
  createdDate: string;
  updatedDate: string;
}

/**
 * Represents a user session
 * @interface UserSession
 * @property {number} id - Unique identifier of the session
 * @property {User} user - The user this session belongs to
 * @property {string} token - Authentication token
 * @property {string} device - Device information
 * @property {string} ipAddress - IP address of the device
 * @property {string} userAgent - User agent string
 * @property {string} lastActivity - ISO date string of last activity
 * @property {boolean} isActive - Whether the session is currently active
 * @property {string} createdDate - ISO date string when the session was created
 * @property {string} updatedDate - ISO date string when the session was last updated
 */
// export interface UserSession {
//   id?: number;
//   user?: User;
//   // token: string;
//   device?: string;
//   ipAddress?: string;
//   userAgent?: string;
//   isActive?: boolean;
//   createdDate?: string;
//   accessToken: string;
//   updatedDate?: string;
//   lastActivity?: string;
//   refreshToken: string;
// }
export interface UserSession {
  scope: string[];
  accessToken: string;
  refreshToken: string;
  authorities: string[];
  resources: typeof resources;
  accessTokenValiditySeconds: number;
  refreshTokenValiditySeconds: number;
}
const resources = [
    'storage_service',
    'patient_web',
    'auth_service',
    'messenger',
    'healthene',
];
export interface Patient extends User {
  activeVisit?: ActiveVisit;
  preferredGender?: {
    id: number;
    preferredGender: Gender;
    additionalInfo?: string;
  };
}

/**
 * Represents a patient's detailed profile
 * @interface PatientProfile
 * @property {Object} medicalHistory - Medical history information
 * @property {PatientMedicalProblem[]} medicalHistory.medicalProblems - List of medical problems
 * @property {PatientMedicalProblem[]} medicalHistory.allergies - List of allergies
 * @property {PatientMedicalProblem[]} medicalHistory.medications - List of medications
 * @property {PatientMedicalProblem[]} medicalHistory.surgeries - List of surgeries
 * @property {PatientMedicalProblem[]} medicalHistory.familyHistory - Family medical history
 * @property {Object} lifestyle - Lifestyle information
 * @property {boolean} lifestyle.smoking - Whether the patient smokes
 * @property {boolean} lifestyle.alcohol - Whether the patient consumes alcohol
 * @property {boolean} lifestyle.exercise - Whether the patient exercises regularly
 * @property {string} lifestyle.diet - Patient's diet type
 * @property {Object} goals - Health goals
 * @property {number} goals.weight - Target weight
 * @property {number} goals.activity - Target activity level
 * @property {number} goals.sleep - Target sleep hours
 * @property {Object} preferences - Patient preferences
 * @property {Object} preferences.notifications - Notification preferences
 * @property {boolean} preferences.notifications.email - Whether to receive email notifications
 * @property {boolean} preferences.notifications.push - Whether to receive push notifications
 * @property {boolean} preferences.notifications.sms - Whether to receive SMS notifications
 * @property {boolean} preferences.reminders - Whether to receive reminders
 * @property {string} preferences.language - Preferred language
 */
export interface PatientProfile extends Patient {
  medicalHistory: {
    medicalProblems: PatientMedicalProblem[];
    allergies: PatientMedicalProblem[];
    medications: PatientMedicalProblem[];
    surgeries: PatientMedicalProblem[];
    familyHistory: PatientMedicalProblem[];
  };
  lifestyle: {
    smoking: boolean;
    alcohol: boolean;
    exercise: boolean;
    diet: string;
  };
  goals: {
    weight: number;
    activity: number;
    sleep: number;
  };
  preferences: {
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    reminders: boolean;
    language: string;
  };
}
