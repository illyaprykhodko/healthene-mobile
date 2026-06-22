export const AUTH_ERROR_CODES = {
    BAD_CREDENTIALS: 'BAD_CREDENTIALS',
} as const;

export const isBadCredentialsError = (error: any): boolean =>
    error?.data?.errorCode === AUTH_ERROR_CODES.BAD_CREDENTIALS;

export const isNetworkError = (error: any): boolean =>
    error?.status === 'FETCH_ERROR' || error?.status === 'TIMEOUT_ERROR';
