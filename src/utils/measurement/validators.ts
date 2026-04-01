/**
 * Yup validation schemas for measurements
 */
// outsource dependencies
import * as yup from 'yup';
// local dependencies
import type { MeasurementType } from 'types/health';
import { getMeasurementConfig, getResolvedMeasurementField } from './measurement-config';

/**
 * Common validation messages
 */
const MESSAGES = {
    number: 'Must be a valid number',
    required: 'This field is required',
    max: (max: number) => `Must be at most ${max}`,
    min: (min: number) => `Must be at least ${min}`,
    decimal: (places: number) => `Maximum ${places} decimal place${places > 1 ? 's' : ''} allowed`,
};

/**
 * Create a decimal validator with max decimal places
 */
const createDecimalValidator = (maxPlaces: number) => {
    const regex = new RegExp(`^\\d+([.,]\\d{1,${maxPlaces}})?$`);
    return yup
        .string()
        .matches(regex, MESSAGES.decimal(maxPlaces))
        .test('is-number', MESSAGES.number, value => {
            if (!value) { return true; } // Let required() handle empty
            const normalized = value.replace(',', '.');
            return !isNaN(parseFloat(normalized));
        });
};

/**
 * Build validation schema for a specific measurement type
 */
export const getMeasurementValidationSchema = (type: MeasurementType, unitName?: string) => {
    const config = getMeasurementConfig(type);
    const schema: Record<string, yup.AnySchema> = {};
    const effectiveUnit = unitName || config.defaultUnit;

    config.fields.forEach(field => {
        const resolvedField = getResolvedMeasurementField(type, field, effectiveUnit);
        if (field.type === 'decimal') {
            let validator = createDecimalValidator(config.maxDecimalPlaces || 1);
      
            // Add min/max validation after converting to number
            validator = validator.test('min-value', MESSAGES.min(resolvedField.min || 0), value => {
                if (!value) { return true; }
                const num = parseFloat(value.replace(',', '.'));
                return resolvedField.min !== undefined ? num >= resolvedField.min : true;
            });

            validator = validator.test('max-value', MESSAGES.max(resolvedField.max || Infinity), value => {
                if (!value) { return true; }
                const num = parseFloat(value.replace(',', '.'));
                return resolvedField.max !== undefined ? num <= resolvedField.max : true;
            });

            schema[field.name] = validator.required(MESSAGES.required);
        } else {
            // number type
            let validator = yup
                .number()
                .typeError(MESSAGES.number);

            if (resolvedField.min !== undefined) {
                validator = validator.min(resolvedField.min, MESSAGES.min(resolvedField.min));
            }
            if (resolvedField.max !== undefined) {
                validator = validator.max(resolvedField.max, MESSAGES.max(resolvedField.max));
            }

            schema[field.name] = validator.required(MESSAGES.required);
        }
    });

    return yup.object().shape(schema);
};

/**
 * Pre-built schemas for common measurement types
 */
export const VALIDATION_SCHEMAS = {
    STEPS: getMeasurementValidationSchema('STEPS'),
    WEIGHT: getMeasurementValidationSchema('WEIGHT'),
    HEART_RATE: getMeasurementValidationSchema('HEART_RATE'),
    TEMPERATURE: getMeasurementValidationSchema('TEMPERATURE'),
    BLOOD_GLUCOSE: getMeasurementValidationSchema('BLOOD_GLUCOSE'),
    BLOOD_PRESSURE: getMeasurementValidationSchema('BLOOD_PRESSURE'),
} as const;
