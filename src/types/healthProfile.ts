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
    group: string;
    icon: { url: string };
}
