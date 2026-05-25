// Types for Health Profile feature

import { MedicalTerm } from './medical';

// export interface Habit {
//     id: number;
//     name: string;
//     group: 'ALL' | 'MALE' | 'FEMALE';
//     record?: {
//         id?: number;
//         entity: { id: number };
//     } | null;
// }

export interface Medication {
    id: number;
    name: string;
}

export interface PatientMedication {
    id: number;
    medication: Medication;
}

// export interface MedicalTerm {
//     id: number;
//     name: string;
// }

export interface VideoAttachment {
    id: number;
    url?: string;
    name?: string;
}

// export interface MedicalProblem {
//     id: number;
//     medicalTerm: MedicalTerm;
//     seenAttachments?: Array<{
//         alreadySeen: boolean;
//         attachment?: VideoAttachment;
//     }>;
//     readyToSeeAttachments?: Array<{
//         id: number;
//         attachment?: VideoAttachment;
//     }>;
// }

export interface MedicationAllergy {
    id: number;
    medicalTerm: MedicalTerm;
    seenAttachments?: Array<{
        alreadySeen: boolean;
        attachment?: VideoAttachment;
    }>;
    readyToSeeAttachments?: Array<{
        id: number;
        attachment?: VideoAttachment;
    }>;
}

// export interface Supplement {
//     id: number;
//     supplement: {
//         id: number;
//         name: string;
//     };
// }

export interface PatientPreferredGender {
    preferredGender: 'MALE' | 'FEMALE' | 'OTHER' | null;
    additionalInfo?: string;
}

export interface UserStats {
    bmi?: number;
    birthday?: string;
    heightFt?: number;
    weightLb?: number;
    heightInches?: number;
    gender?: 'MALE' | 'FEMALE';
    patientPreferredGender?: PatientPreferredGender;
}

export interface StatsFormData {
    heightFt: string;
    weightLb: string;
    heightInches: string;
    gender: 'MALE' | 'FEMALE';
    patientPreferredGender: PatientPreferredGender;
}

export interface FilterParams {
    page?: number;
    size?: number;
    sort?: string;
}

export interface FilteredResponse<T> {
    content: T[];
    pageNumber: number;
    totalPages: number;
    totalElements: number;
}

export interface MedicationFilterRequest {
    name?: string;
    excludeIds?: number[];
}

export interface MedicalTermFilterRequest {
    name?: string;
    excludeIds?: number[];
}
