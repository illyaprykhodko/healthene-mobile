// local dependencies
import { MEDICAL_TERM_TYPES } from 'constants/index.ts';

// interfaces
export interface Stats {
    heightFt: number;
    weightLb: number;
    heightInches: number;
    additionalInfo: string;
    gender: string | undefined;
    patientPreferredGender: string;
}

export interface Habit {
    id: number;
    name: string;
    icon: { url: string };
    group: 'ALL' | 'FEMALE';
}

export interface PatientHabit {
    id: number;
    habit: Habit;
}

export interface MedicalTermItem {
  id: number;
  name: string;
}

export interface MedicalEntity {
    id: number;
    medicalTerm: MedicalTermItem;
}

export type MedicalTermType = typeof MEDICAL_TERM_TYPES[number];
