import {
    validateMedicationCategory,
    validateMedicationForm,
    validateMedicationUnit,
    validateMedicationFrequency,
    validateMedication,
    validateMedicationHistory,
    validateMedications,
    validateMedicationHistoryEntries
} from '../medication.validator';
import {
    Medication,
    MedicationCategory,
    MedicationForm,
    MedicationUnit,
    MedicationFrequency,
    MedicationHistory
} from '../medication';

describe('Medication Category Validation', () => {
    const validCategory: MedicationCategory = {
        id: 1,
        name: 'Antibiotics',
        description: 'Antibacterial medications'
    };

    it('should validate a valid category', () => {
        expect(validateMedicationCategory(validCategory)).toBe(true);
    });

    it('should invalidate a category without required fields', () => {
        const invalidCategory = { ...validCategory, name: '' };
        expect(validateMedicationCategory(invalidCategory)).toBe(false);
    });
});

describe('Medication Form Validation', () => {
    const validForm: MedicationForm = {
        id: 1,
        name: 'Tablet',
        description: 'Oral tablet'
    };

    it('should validate a valid form', () => {
        expect(validateMedicationForm(validForm)).toBe(true);
    });

    it('should invalidate a form without required fields', () => {
        const invalidForm = { ...validForm, name: '' };
        expect(validateMedicationForm(invalidForm)).toBe(false);
    });
});

describe('Medication Unit Validation', () => {
    const validUnit: MedicationUnit = {
        id: 1,
        name: 'Milligram',
        symbol: 'mg',
        description: 'Unit of mass'
    };

    it('should validate a valid unit', () => {
        expect(validateMedicationUnit(validUnit)).toBe(true);
    });

    it('should invalidate a unit without required fields', () => {
        const invalidUnit = { ...validUnit, symbol: '' };
        expect(validateMedicationUnit(invalidUnit)).toBe(false);
    });
});

describe('Medication Frequency Validation', () => {
    const validFrequency: MedicationFrequency = {
        id: 1,
        name: 'Twice daily',
        timesPerDay: 2,
        description: 'Take every 12 hours'
    };

    it('should validate a valid frequency', () => {
        expect(validateMedicationFrequency(validFrequency)).toBe(true);
    });

    it('should invalidate a frequency with invalid times per day', () => {
        const invalidFrequency = { ...validFrequency, timesPerDay: 0 };
        expect(validateMedicationFrequency(invalidFrequency)).toBe(false);
    });
});

describe('Medication Validation', () => {
    const validMedication: Medication = {
        id: 1,
        name: 'Amoxicillin',
        description: 'Antibiotic',
        category: {
            id: 1,
            name: 'Antibiotics'
        },
        form: {
            id: 1,
            name: 'Tablet'
        },
        unit: {
            id: 1,
            name: 'Milligram',
            symbol: 'mg'
        },
        frequency: {
            id: 1,
            name: 'Twice daily',
            timesPerDay: 2
        },
        isActive: true,
        startDate: '2023-01-01',
        dosage: 500,
        isPrescribed: true,
        isOverTheCounter: false,
        createdDate: '2023-01-01'
    };

    it('should validate a valid medication', () => {
        expect(validateMedication(validMedication)).toBe(true);
    });

    it('should invalidate a medication with invalid dosage', () => {
        const invalidMedication = { ...validMedication, dosage: 0 };
        expect(validateMedication(invalidMedication)).toBe(false);
    });

    it('should invalidate a medication without required fields', () => {
        const invalidMedication = { ...validMedication, name: '' };
        expect(validateMedication(invalidMedication)).toBe(false);
    });
});

describe('Medication History Validation', () => {
    const validHistory: MedicationHistory = {
        medicationId: 1,
        createdDate: '2023-01-01',
        previousDosage: 250,
        newDosage: 500,
        changeReason: 'Dosage increased'
    };

    it('should validate a valid history entry', () => {
        expect(validateMedicationHistory(validHistory)).toBe(true);
    });

    it('should invalidate a history entry without changes', () => {
        const invalidHistory = {
            medicationId: 1,
            createdDate: '2023-01-01'
        };
        expect(validateMedicationHistory(invalidHistory)).toBe(false);
    });
});

describe('Medications Array Validation', () => {
    const validMedications: Medication[] = [
        {
            id: 1,
            name: 'Amoxicillin',
            category: {
                id: 1,
                name: 'Antibiotics'
            },
            form: {
                id: 1,
                name: 'Tablet'
            },
            unit: {
                id: 1,
                name: 'Milligram',
                symbol: 'mg'
            },
            frequency: {
                id: 1,
                name: 'Twice daily',
                timesPerDay: 2
            },
            isActive: true,
            startDate: '2023-01-01',
            dosage: 500,
            isPrescribed: true,
            isOverTheCounter: false,
            createdDate: '2023-01-01'
        }
    ];

    it('should validate an array of valid medications', () => {
        expect(validateMedications(validMedications)).toBe(true);
    });

    it('should invalidate an array with invalid medications', () => {
        const invalidMedications = [
            ...validMedications,
            { ...validMedications[0], name: '' }
        ];
        expect(validateMedications(invalidMedications)).toBe(false);
    });
});

describe('Medication History Array Validation', () => {
    const validHistoryEntries: MedicationHistory[] = [
        {
            medicationId: 1,
            createdDate: '2023-01-01',
            previousDosage: 250,
            newDosage: 500
        }
    ];

    it('should validate an array of valid history entries', () => {
        expect(validateMedicationHistoryEntries(validHistoryEntries)).toBe(true);
    });

    it('should invalidate an array with invalid history entries', () => {
        const invalidHistoryEntries = [
            ...validHistoryEntries,
            {
                medicationId: 1,
                createdDate: '2023-01-01'
            }
        ];
        expect(validateMedicationHistoryEntries(invalidHistoryEntries)).toBe(false);
    });
});
