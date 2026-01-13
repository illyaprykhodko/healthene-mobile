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
