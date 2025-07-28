import {
    Medication,
    MedicationUnit,
    MedicationForm,
    MedicationHistory,
    MedicationCategory,
    MedicationFrequency,
} from './medication';

/**
 * Validates a medication category
 * @param category - The category to validate
 * @returns {boolean} - Whether the category is valid
 */
export function validateMedicationCategory (category: MedicationCategory): boolean {
    if (!category) { return false; }
    if (!category.id) { return false; }
    if (!category.name) { return false; }
    return true;
}

/**
 * Validates a medication form
 * @param form - The form to validate
 * @returns {boolean} - Whether the form is valid
 */
export function validateMedicationForm (form: MedicationForm): boolean {
    if (!form) { return false; }
    if (!form.id) { return false; }
    if (!form.name) { return false; }
    return true;
}

/**
 * Validates a medication unit
 * @param unit - The unit to validate
 * @returns {boolean} - Whether the unit is valid
 */
export function validateMedicationUnit (unit: MedicationUnit): boolean {
    if (!unit) { return false; }
    if (!unit.id) { return false; }
    if (!unit.name) { return false; }
    if (!unit.symbol) { return false; }
    return true;
}

/**
 * Validates a medication frequency
 * @param frequency - The frequency to validate
 * @returns {boolean} - Whether the frequency is valid
 */
export function validateMedicationFrequency (frequency: MedicationFrequency): boolean {
    if (!frequency) { return false; }
    if (!frequency.id) { return false; }
    if (!frequency.name) { return false; }
    if (typeof frequency.timesPerDay !== 'number' || frequency.timesPerDay < 1) { return false; }
    return true;
}

/**
 * Validates a medication
 * @param medication - The medication to validate
 * @returns {boolean} - Whether the medication is valid
 */
export function validateMedication (medication: Medication): boolean {
    if (!medication) { return false; }
    if (!medication.id) { return false; }
    if (!medication.name) { return false; }
    if (!medication.category) { return false; }
    if (!validateMedicationCategory(medication.category)) { return false; }
    if (!medication.form) { return false; }
    if (!validateMedicationForm(medication.form)) { return false; }
    if (!medication.unit) { return false; }
    if (!validateMedicationUnit(medication.unit)) { return false; }
    if (!medication.frequency) { return false; }
    if (!validateMedicationFrequency(medication.frequency)) { return false; }
    if (typeof medication.isActive !== 'boolean') { return false; }
    if (!medication.startDate) { return false; }
    if (typeof medication.dosage !== 'number' || medication.dosage <= 0) { return false; }
    if (typeof medication.isPrescribed !== 'boolean') { return false; }
    if (typeof medication.isOverTheCounter !== 'boolean') { return false; }
    return true;
}

/**
 * Validates a medication history entry
 * @param history - The history entry to validate
 * @returns {boolean} - Whether the history entry is valid
 */
export function validateMedicationHistory (history: MedicationHistory): boolean {
    if (!history) { return false; }
    if (!history.medicationId) { return false; }
    if (!history.createdDate) { return false; }

    // Validate that at least one field has changed
    const hasDosageChange = history.previousDosage !== undefined && history.newDosage !== undefined;
    const hasFrequencyChange = history.previousFrequency !== undefined && history.newFrequency !== undefined;
    const hasActiveChange = history.previousIsActive !== undefined && history.newIsActive !== undefined;
    const hasNotesChange = history.previousNotes !== undefined && history.newNotes !== undefined;

    if (!hasDosageChange && !hasFrequencyChange && !hasActiveChange && !hasNotesChange) { return false; }

    return true;
}

/**
 * Validates an array of medications
 * @param medications - The medications to validate
 * @returns {boolean} - Whether all medications are valid
 */
export function validateMedications (medications: Medication[]): boolean {
    if (!Array.isArray(medications)) { return false; }
    return medications.every(validateMedication);
}

/**
 * Validates an array of medication history entries
 * @param history - The history entries to validate
 * @returns {boolean} - Whether all history entries are valid
 */
export function validateMedicationHistoryEntries (history: MedicationHistory[]): boolean {
    if (!Array.isArray(history)) { return false; }
    return history.every(validateMedicationHistory);
}
