/**
 * Represents the activity status of a patient
 * @enum {string}
 * @property {string} ACTIVE - Patient is currently active
 * @property {string} INACTIVE - Patient is currently inactive
 * @property {string} PENDING - Patient's status is pending review
 */
export enum ActivityStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING'
}

/**
 * Represents the onboarding status of a patient
 * @enum {string}
 * @property {string} NOT_STARTED - Patient has not started onboarding
 * @property {string} IN_PROGRESS - Patient is currently in the onboarding process
 * @property {string} COMPLETED - Patient has completed onboarding
 */
export enum OnboardingStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

/**
 * Represents the onboarding step of a patient
 * @enum {string}
 * @property {string} PERSONAL_INFO - Personal information collection step
 * @property {string} MEDICAL_INFO - Medical information collection step
 * @property {string} LIFESTYLE - Lifestyle information collection step
 * @property {string} GOALS - Health goals collection step
 * @property {string} PREFERENCES - User preferences collection step
 */
export enum OnboardingStep {
  PERSONAL_INFO = 'PERSONAL_INFO',
  MEDICAL_INFO = 'MEDICAL_INFO',
  LIFESTYLE = 'LIFESTYLE',
  GOALS = 'GOALS',
  PREFERENCES = 'PREFERENCES'
}

/**
 * Represents the pregnant status of a patient
 * @enum {string}
 * @property {string} LACTATING_0_6_MONTHS - Patient is lactating (0-6 months postpartum)
 * @property {string} LACTATING_7_12_MONTHS - Patient is lactating (7-12 months postpartum)
 * @property {string} NOT_PREGNANT - Patient is not pregnant
 * @property {string} PREGNANT - Patient is pregnant
 */
export enum PregnantStatus {
  LACTATING_0_6_MONTHS = 'LACTATING_0_6_MONTHS',
  LACTATING_7_12_MONTHS = 'LACTATING_7_12_MONTHS',
  NOT_PREGNANT = 'NOT_PREGNANT',
  PREGNANT = 'PREGNANT'
}

/**
 * Represents the algorithm run state
 * @enum {string}
 * @property {string} ERROR - Algorithm run encountered an error
 * @property {string} SUCCESS - Algorithm run completed successfully
 * @property {string} PENDING - Algorithm run is in progress
 */
export enum AlgorithmRunState {
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS',
  PENDING = 'PENDING'
}

// Exercise
export enum ExerciseType {
  AEROBIC = 'EXERCISE_AEROBIC',
  RESISTANCE = 'EXERCISE_RESISTANCE',
  STRETCHING = 'EXERCISE_STRETCHING',
}

export enum ExerciseFieldType {
  REPS = 'reps',
  SETS = 'sets',
  HOURS = 'hours',
  MILES = 'miles',
  STEPS = 'steps',
  WEIGHT = 'weight',
  SECONDS = 'seconds',
  MINUTES = 'minutes',
  DISTANCE = 'distance',
  CALORIES = 'calories',
  VELOCITY = 'velocity',
  INTENSITY = 'intensity',
  ELEVATION = 'elevation',
  HEART_RATE = 'heart_rate',
  RESISTANCE = 'resistance',
}

/**
 * Represents the gender of a patient
 * @enum {string}
 * @property {string} FEMALE - Female gender
 * @property {string} MALE - Male gender
 */
export enum Gender {
  FEMALE = 'FEMALE',
  MALE = 'MALE'
}

/**
 * Represents the status of a patient
 * @enum {string}
 * @property {string} ACTIVE - Patient is currently active
 * @property {string} INACTIVE - Patient is currently inactive
 * @property {string} PENDING - Patient's status is pending review
 */
export enum PatientStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING'
}

/**
 * Represents the type of medical diagnosis
 * @enum {string}
 * @property {string} MEDICAL_PROBLEMS - General medical problems
 * @property {string} ALLERGIES - Allergic conditions
 * @property {string} MEDICATIONS - Medication-related issues
 * @property {string} SURGERIES - Surgical procedures
 * @property {string} FAMILY_HISTORY - Family medical history
 */
export enum DiagnoseType {
  MEDICAL_PROBLEMS = 'MEDICAL_PROBLEMS',
  ALLERGIES = 'ALLERGIES',
  MEDICATIONS = 'MEDICATIONS',
  SURGERIES = 'SURGERIES',
  FAMILY_HISTORY = 'FAMILY_HISTORY'
}

/**
 * Represents the status of a medical problem
 * @enum {string}
 * @property {string} ACTIVE - Medical problem is currently active
 * @property {string} RESOLVED - Medical problem has been resolved
 * @property {string} CHRONIC - Medical problem is chronic
 */
export enum MedicalProblemStatus {
  ACTIVE = 'ACTIVE',
  RESOLVED = 'RESOLVED',
  CHRONIC = 'CHRONIC'
}

/**
 * Represents the severity of a medical problem
 * @enum {string}
 * @property {string} MILD - Mild severity
 * @property {string} MODERATE - Moderate severity
 * @property {string} SEVERE - Severe severity
 */
export enum MedicalProblemSeverity {
  MILD = 'MILD',
  MODERATE = 'MODERATE',
  SEVERE = 'SEVERE'
}

/**
 * Represents the category of a medication
 * @enum {string}
 * @property {string} ANTIBIOTICS - Antibiotic medications
 * @property {string} PAIN_RELIEF - Pain relief medications
 * @property {string} VITAMINS - Vitamin supplements
 * @property {string} SUPPLEMENTS - Other supplements
 * @property {string} OTHER - Other medication categories
 */
export enum MedicationCategory {
  ANTIBIOTICS = 'ANTIBIOTICS',
  PAIN_RELIEF = 'PAIN_RELIEF',
  VITAMINS = 'VITAMINS',
  SUPPLEMENTS = 'SUPPLEMENTS',
  OTHER = 'OTHER'
}

/**
 * Represents the form of a medication
 * @enum {string}
 * @property {string} TABLET - Tablet form
 * @property {string} CAPSULE - Capsule form
 * @property {string} LIQUID - Liquid form
 * @property {string} INJECTION - Injection form
 * @property {string} CREAM - Cream form
 * @property {string} OTHER - Other medication forms
 */
export enum MedicationForm {
  TABLET = 'TABLET',
  CAPSULE = 'CAPSULE',
  LIQUID = 'LIQUID',
  INJECTION = 'INJECTION',
  CREAM = 'CREAM',
  OTHER = 'OTHER'
}

/**
 * Represents the unit of measurement for a medication
 * @enum {string}
 * @property {string} MILLIGRAM - Milligram (mg)
 * @property {string} GRAM - Gram (g)
 * @property {string} MILLILITER - Milliliter (ml)
 * @property {string} UNIT - Unit (U)
 * @property {string} DROP - Drop (dr)
 * @property {string} OTHER - Other units of measurement
 */
export enum MedicationUnit {
  MILLIGRAM = 'MILLIGRAM',
  GRAM = 'GRAM',
  MILLILITER = 'MILLILITER',
  UNIT = 'UNIT',
  DROP = 'DROP',
  OTHER = 'OTHER'
}

/**
 * Represents the frequency of medication administration
 * @enum {string}
 * @property {string} ONCE_DAILY - Once per day
 * @property {string} TWICE_DAILY - Twice per day
 * @property {string} THREE_TIMES_DAILY - Three times per day
 * @property {string} FOUR_TIMES_DAILY - Four times per day
 * @property {string} AS_NEEDED - As needed
 * @property {string} OTHER - Other frequencies
 */
export enum MedicationFrequency {
  ONCE_DAILY = 'ONCE_DAILY',
  TWICE_DAILY = 'TWICE_DAILY',
  THREE_TIMES_DAILY = 'THREE_TIMES_DAILY',
  FOUR_TIMES_DAILY = 'FOUR_TIMES_DAILY',
  AS_NEEDED = 'AS_NEEDED',
  OTHER = 'OTHER'
}
