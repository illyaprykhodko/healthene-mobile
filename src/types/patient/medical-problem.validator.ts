import { MedicalProblem, MedicalProblemCategory, MedicalProblemHistory } from './medical-problem';

/**
 * Validates a medical problem category
 * @param category - The category to validate
 * @returns {boolean} - Whether the category is valid
 */
export function validateMedicalProblemCategory (category: MedicalProblemCategory): boolean {
    if (!category) { return false; }
    if (!category.id) { return false; }
    if (!category.name) { return false; }
    return true;
}

/**
 * Validates a medical problem
 * @param problem - The medical problem to validate
 * @returns {boolean} - Whether the medical problem is valid
 */
export function validateMedicalProblem (problem: MedicalProblem): boolean {
    if (!problem) { return false; }
    if (!problem.id) { return false; }
    if (!problem.name) { return false; }
    if (!problem.category) { return false; }
    if (!validateMedicalProblemCategory(problem.category)) { return false; }
    if (typeof problem.severity !== 'number' || problem.severity < 1 || problem.severity > 5) { return false; }
    if (typeof problem.isActive !== 'boolean') { return false; }
    return true;
}

/**
 * Validates a medical problem history entry
 * @param history - The history entry to validate
 * @returns {boolean} - Whether the history entry is valid
 */
export function validateMedicalProblemHistory (history: MedicalProblemHistory): boolean {
    if (!history) { return false; }
    if (!history.medicalProblemId) { return false; }
    if (!history.createdDate) { return false; }
  
    // Validate that at least one field has changed
    const hasSeverityChange = history.previousSeverity !== undefined && history.newSeverity !== undefined;
    const hasActiveChange = history.previousIsActive !== undefined && history.newIsActive !== undefined;
    const hasNotesChange = history.previousNotes !== undefined && history.newNotes !== undefined;
  
    if (!hasSeverityChange && !hasActiveChange && !hasNotesChange) { return false; }
  
    return true;
}

/**
 * Validates an array of medical problems
 * @param problems - The medical problems to validate
 * @returns {boolean} - Whether all medical problems are valid
 */
export function validateMedicalProblems (problems: MedicalProblem[]): boolean {
    if (!Array.isArray(problems)) { return false; }
    return problems.every(validateMedicalProblem);
}

/**
 * Validates an array of medical problem history entries
 * @param history - The history entries to validate
 * @returns {boolean} - Whether all history entries are valid
 */
export function validateMedicalProblemHistoryEntries (history: MedicalProblemHistory[]): boolean {
    if (!Array.isArray(history)) { return false; }
    return history.every(validateMedicalProblemHistory);
}
