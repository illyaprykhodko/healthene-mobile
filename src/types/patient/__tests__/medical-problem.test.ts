import {
    validateMedicalProblemCategory,
    validateMedicalProblem,
    validateMedicalProblemHistory,
    validateMedicalProblems,
    validateMedicalProblemHistoryEntries
} from '../medical-problem.validator';
import { MedicalProblem, MedicalProblemCategory, MedicalProblemHistory } from '../medical-problem';

describe('Medical Problem Category Validation', () => {
    const validCategory: MedicalProblemCategory = {
        id: 1,
        name: 'Cardiovascular',
        description: 'Heart and blood vessel conditions'
    };

    it('should validate a valid category', () => {
        expect(validateMedicalProblemCategory(validCategory)).toBe(true);
    });

    it('should invalidate a category without required fields', () => {
        const invalidCategory = { ...validCategory, name: '' };
        expect(validateMedicalProblemCategory(invalidCategory)).toBe(false);
    });
});

describe('Medical Problem Validation', () => {
    const validProblem: MedicalProblem = {
        id: 1,
        name: 'Hypertension',
        description: 'High blood pressure',
        category: {
            id: 1,
            name: 'Cardiovascular'
        },
        severity: 3,
        isActive: true,
        diagnosedDate: '2023-01-01',
        createdDate: '2023-01-01'
    };

    it('should validate a valid medical problem', () => {
        expect(validateMedicalProblem(validProblem)).toBe(true);
    });

    it('should invalidate a medical problem with invalid severity', () => {
        const invalidProblem = { ...validProblem, severity: 6 };
        expect(validateMedicalProblem(invalidProblem)).toBe(false);
    });

    it('should invalidate a medical problem without required fields', () => {
        const invalidProblem = { ...validProblem, name: '' };
        expect(validateMedicalProblem(invalidProblem)).toBe(false);
    });
});

describe('Medical Problem History Validation', () => {
    const validHistory: MedicalProblemHistory = {
        medicalProblemId: 1,
        createdDate: '2023-01-01',
        previousSeverity: 2,
        newSeverity: 3,
        changeReason: 'Condition worsened'
    };

    it('should validate a valid history entry', () => {
        expect(validateMedicalProblemHistory(validHistory)).toBe(true);
    });

    it('should invalidate a history entry without changes', () => {
        const invalidHistory = {
            medicalProblemId: 1,
            createdDate: '2023-01-01'
        };
        expect(validateMedicalProblemHistory(invalidHistory)).toBe(false);
    });
});

describe('Medical Problems Array Validation', () => {
    const validProblems: MedicalProblem[] = [
        {
            id: 1,
            name: 'Hypertension',
            category: {
                id: 1,
                name: 'Cardiovascular'
            },
            severity: 3,
            isActive: true,
            createdDate: '2023-01-01'
        }
    ];

    it('should validate an array of valid medical problems', () => {
        expect(validateMedicalProblems(validProblems)).toBe(true);
    });

    it('should invalidate an array with invalid medical problems', () => {
        const invalidProblems = [
            ...validProblems,
            { ...validProblems[0], name: '' }
        ];
        expect(validateMedicalProblems(invalidProblems)).toBe(false);
    });
});

describe('Medical Problem History Array Validation', () => {
    const validHistoryEntries: MedicalProblemHistory[] = [
        {
            medicalProblemId: 1,
            createdDate: '2023-01-01',
            previousSeverity: 2,
            newSeverity: 3
        }
    ];

    it('should validate an array of valid history entries', () => {
        expect(validateMedicalProblemHistoryEntries(validHistoryEntries)).toBe(true);
    });

    it('should invalidate an array with invalid history entries', () => {
        const invalidHistoryEntries = [
            ...validHistoryEntries,
            {
                medicalProblemId: 1,
                createdDate: '2023-01-01'
            }
        ];
        expect(validateMedicalProblemHistoryEntries(invalidHistoryEntries)).toBe(false);
    });
});
