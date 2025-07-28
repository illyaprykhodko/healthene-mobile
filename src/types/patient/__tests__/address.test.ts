import { validateAddress, validateAddresses, validateAdditionalContacts, validatePhoneNumber, validateEmail } from '../address.validator';
import { Address, AdditionalContacts } from '../address';

describe('Address Validation', () => {
    const validAddress: Address = {
        id: 1,
        address1: '123 Main St',
        city: 'New York',
        country: {
            id: 1,
            code: 'US',
            name: 'United States'
        },
        state: {
            id: 1,
            code: 'NY',
            name: 'New York',
            country: {
                id: 1
            }
        },
        zipCode: '10001'
    };

    it('should validate a valid address', () => {
        expect(validateAddress(validAddress)).toBe(true);
    });

    it('should invalidate an address without required fields', () => {
        const invalidAddress = { ...validAddress, address1: '' };
        expect(validateAddress(invalidAddress)).toBe(false);
    });

    it('should validate an array of valid addresses', () => {
        expect(validateAddresses([validAddress])).toBe(true);
    });

    it('should invalidate an array with invalid addresses', () => {
        const invalidAddress = { ...validAddress, address1: '' };
        expect(validateAddresses([validAddress, invalidAddress])).toBe(false);
    });
});

describe('Additional Contacts Validation', () => {
    const validContacts: AdditionalContacts = {
        cellPhones: ['+1234567890'],
        emails: ['test@example.com'],
        homePhones: ['+1234567890'],
        workPhones: ['+1234567890']
    };

    it('should validate valid contacts', () => {
        expect(validateAdditionalContacts(validContacts)).toBe(true);
    });

    it('should invalidate contacts with invalid arrays', () => {
        const invalidContacts = { ...validContacts, cellPhones: null };
        expect(validateAdditionalContacts(invalidContacts)).toBe(false);
    });
});

describe('Phone Number Validation', () => {
    it('should validate valid phone numbers', () => {
        expect(validatePhoneNumber('+1234567890')).toBe(true);
        expect(validatePhoneNumber('(123) 456-7890')).toBe(true);
        expect(validatePhoneNumber('123-456-7890')).toBe(true);
    });

    it('should invalidate invalid phone numbers', () => {
        expect(validatePhoneNumber('')).toBe(false);
        expect(validatePhoneNumber('123')).toBe(false);
        expect(validatePhoneNumber('abc')).toBe(false);
    });
});

describe('Email Validation', () => {
    it('should validate valid email addresses', () => {
        expect(validateEmail('test@example.com')).toBe(true);
        expect(validateEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should invalidate invalid email addresses', () => {
        expect(validateEmail('')).toBe(false);
        expect(validateEmail('test@')).toBe(false);
        expect(validateEmail('@example.com')).toBe(false);
        expect(validateEmail('test@example')).toBe(false);
    });
});
