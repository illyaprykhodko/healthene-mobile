declare module 'react-native-config' {
    export interface NativeConfig {
        API_PATH: string;
        APP_DEBUG: boolean;
        GAME_SLOTS: string;
        LANDING_UR: string;
        ENVIRONMENT: string;
        WEBSITE_URL: string;
        SERVICE_URL: string;
        APP_DISPLAY_NAME: string;
        SENDER_FIREBASE_ID: number;
        GOOGLE_FIT_DATA_URL: string;
    }
    
    export const Config: NativeConfig
    export default Config
  }
