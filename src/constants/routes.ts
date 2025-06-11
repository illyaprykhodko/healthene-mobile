export const ROUTES = {
    // Public routes
    SIGN_IN: 'SignIn',
    SIGN_UP: 'SignUp',
    FORGOT_PASSWORD: 'ForgotPassword',
  
    // Private routes
    HOME: 'Home',
    PROFILE: 'Profile',
    SETTINGS: 'Settings',
} as const;
export const PUBLIC = 'public';
export const PRIVATE = 'private';
export type Route = typeof ROUTES[keyof typeof ROUTES];

// Route groups
export const PUBLIC_ROUTES = [ROUTES.SIGN_IN, ROUTES.SIGN_UP, ROUTES.FORGOT_PASSWORD] as const;
export const PRIVATE_ROUTES = [ROUTES.HOME, ROUTES.PROFILE, ROUTES.SETTINGS] as const;
