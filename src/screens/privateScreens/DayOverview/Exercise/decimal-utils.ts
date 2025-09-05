// Utility functions for handling decimal fields with one decimal place

// Fields that support decimal values (one decimal place)
export const DECIMAL_FIELDS = ['velocity', 'elevation', 'resistance'];

// Split decimal value into whole and decimal parts
export const splitDecimal = (value: number) => {
    const whole = Math.floor(value);
    const decimal = Math.round((value % 1) * 10);
    return { whole, decimal };
};

// Combine whole and decimal parts into decimal value
export const combineDecimal = (whole: number, decimal: number) => whole + (decimal / 10);

// Check if field is a decimal field
export const isDecimalField = (fieldKey: string) => DECIMAL_FIELDS.includes(fieldKey);

// Format decimal value for display
export const formatDecimalValue = (value: number | null | undefined) => {
    if (value === null || value === undefined) { return '0.0'; }
    return parseFloat(String(value)).toFixed(1);
};

// Validate decimal value
export const validateDecimalValue = (value: number, min = 0, max = 50.0) => {
    const numValue = parseFloat(String(value));
    if (Number.isNaN(numValue)) { return false; }
    return numValue >= min && numValue <= max;
};

// Get decimal field configuration
export const getDecimalFieldConfig = (fieldKey: string) => {
    const configs: Record<string, any> = {
        velocity: {
            min: 0,
            max: 50.0,
            step: 0.1,
            label: 'Velocity',
        },
        elevation: {
            min: 0,
            max: 100.0,
            step: 0.1,
            label: 'Elevation',
        },
        resistance: {
            min: 0,
            max: 50.0,
            step: 0.1,
            label: 'Resistance',
        },
    };
    return configs[fieldKey] || null;
};
