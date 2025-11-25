// outsource dependencies
import { Platform } from 'react-native';
import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ReactNativeBiometrics, { BiometryType } from 'react-native-biometrics';

const BIOMETRIC_STORAGE_KEY = '@biometric_enabled';
const KEYCHAIN_SERVICE = 'com.intelliceed.patientapp.biometric';

const rnBiometrics = new ReactNativeBiometrics({
    allowDeviceCredentials: false,
});

export interface BiometricAvailability {
    available: boolean;
    biometryType: BiometryType | null;
    error?: string;
}

export interface BiometricCredentials {
    username: string;
    password: string;
}

class BiometricService {
    async isAvailable (): Promise<BiometricAvailability> {
        try {
            const { available, biometryType } = await rnBiometrics.isSensorAvailable();
            
            return {
                available,
                biometryType: biometryType as BiometryType | null,
            };
        } catch (error) {
            return {
                available: false,
                biometryType: null,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    getBiometricTypeName (biometryType: BiometryType | null): string {
        switch (biometryType) {
            case 'FaceID':
                return 'Face ID';
            case 'TouchID':
                return 'Touch ID';
            case 'Biometrics':
                return 'Biometric';
            default:
                return 'Biometric';
        }
    }

    getBiometricIcon (biometryType: BiometryType | null): string {
        switch (biometryType) {
            case 'FaceID':
                return 'scan';
            case 'TouchID':
                return 'finger-print';
            case 'Biometrics':
                return 'finger-print';
            default:
                return 'lock-closed';
        }
    }

    async isEnabled (): Promise<boolean> {
        try {
            const enabled = await AsyncStorage.getItem(BIOMETRIC_STORAGE_KEY);
            return enabled === 'true';
        } catch {
            return false;
        }
    }

    async enable (): Promise<void> {
        await AsyncStorage.setItem(BIOMETRIC_STORAGE_KEY, 'true');
    }

    async disable (): Promise<void> {
        await AsyncStorage.setItem(BIOMETRIC_STORAGE_KEY, 'false');
        await this.removeCredentials();
    }

    async saveCredentials (username: string, password: string): Promise<boolean> {
        try {
            await Keychain.setGenericPassword(username, password, {
                service: KEYCHAIN_SERVICE,
                accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
                // remove accessControl, to check hasCredentials without biometric
                // check biometric in getCredentials through simplePrompt
            });
            return true;
        } catch (error) {
            console.error('[BiometricService] Failed to save credentials:', error);
            return false;
        }
    }

    async getCredentials (): Promise<BiometricCredentials | null> {
        try {
            const { available } = await this.isAvailable();
            if (!available) {
                throw new Error('Biometric authentication not available');
            }
            const { success } = await rnBiometrics.simplePrompt({
                promptMessage: 'Authenticate to log in',
                cancelButtonText: 'Cancel',
            });

            if (!success) {
                throw new Error('Biometric authentication cancelled or failed');
            }

            const credentials = await Keychain.getGenericPassword({
                service: KEYCHAIN_SERVICE,
            });

            if (credentials && typeof credentials !== 'boolean') {
                return {
                    username: credentials.username,
                    password: credentials.password,
                };
            }

            return null;
        } catch (error) {
            console.error('[BiometricService] Failed to get credentials:', error);
            return null;
        }
    }

    async removeCredentials (): Promise<boolean> {
        try {
            await Keychain.resetGenericPassword({
                service: KEYCHAIN_SERVICE,
            });
            return true;
        } catch (error) {
            console.error('[BiometricService] Failed to remove credentials:', error);
            return false;
        }
    }

    async hasCredentials (): Promise<boolean> {
        try {
            const credentials = await Keychain.getGenericPassword({
                service: KEYCHAIN_SERVICE,
            });
            return credentials !== false;
        } catch (error) {
            console.error('[BiometricService] Failed to check credentials:', error);
            return false;
        }
    }

    /**
     * authenticate user with biometric (without getting credentials)
     */
    async authenticate (reason: string = 'Authenticate to continue'): Promise<boolean> {
        try {
            const { available } = await this.isAvailable();
            if (!available) {
                return false;
            }

            const { success } = await rnBiometrics.simplePrompt({
                promptMessage: reason,
                cancelButtonText: 'Cancel',
            });

            return success;
        } catch (error) {
            console.error('[BiometricService] Authentication failed:', error);
            return false;
        }
    }
}

export const biometricService = new BiometricService();

