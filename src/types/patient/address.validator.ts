import { Address, AdditionalContacts } from './address';

/**
 * Validates an address object
 * @param address - The address to validate
 * @returns {boolean} - Whether the address is valid
 */
export function validateAddress (address: Address): boolean {
    if (!address) { return false; }
    if (!address.address1) { return false; }
    if (!address.city) { return false; }
    if (!address.country?.id) { return false; }
    if (!address.state?.id) { return false; }
    if (!address.zipCode) { return false; }
    return true;
}

/**
 * Validates an array of addresses
 * @param addresses - The addresses to validate
 * @returns {boolean} - Whether all addresses are valid
 */
export function validateAddresses (addresses: Address[]): boolean {
    if (!Array.isArray(addresses)) { return false; }
    return addresses.every(validateAddress);
}

/**
 * Validates additional contacts
 * @param contacts - The contacts to validate
 * @returns {boolean} - Whether the contacts are valid
 */
export function validateAdditionalContacts (contacts: AdditionalContacts): boolean {
    if (!contacts) { return false; }
    if (!Array.isArray(contacts.emails)) { return false; }
    if (!Array.isArray(contacts.cellPhones)) { return false; }
    if (!Array.isArray(contacts.homePhones)) { return false; }
    if (!Array.isArray(contacts.workPhones)) { return false; }
    return true;
}

/**
 * Validates a phone number
 * @param phone - The phone number to validate
 * @returns {boolean} - Whether the phone number is valid
 */
export function validatePhoneNumber (phone: string): boolean {
    if (!phone) { return false; }
    // Basic phone number validation
    const phoneRegex = /^\+?[\d\s-()]{10,}$/;
    return phoneRegex.test(phone);
}

/**
 * Validates an email address
 * @param email - The email address to validate
 * @returns {boolean} - Whether the email address is valid
 */
export function validateEmail (email: string): boolean {
    if (!email) { return false; }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
