import { FetchBaseQueryError } from '@reduxjs/toolkit/query';

export interface ApiErrorResponse {
  message: string;
  code?: string;
  details?: unknown;
}

export interface ValidationError {
  field: string;
  message: string;
}

export type ApiError = FetchBaseQueryError & {
  data: ApiErrorResponse;
};

export function isApiError (error: unknown): error is ApiError {
    return (
        typeof error === 'object'
    && error !== null
    && 'data' in error
    && typeof (error as ApiError).data === 'object'
    && (error as ApiError).data !== null
    && 'message' in (error as ApiError).data
    );
}

export function getErrorMessage (error: unknown): string {
    if (error && typeof error === 'object' && 'data' in error) {
        const apiError = error as { data: ApiErrorResponse };
        return apiError.data.message;
    }
    if (error instanceof Error) {
        return error.message;
    }
    return 'An unknown error occurred';
}

// export interface User {
//   id: string;
//   email: string;
//   firstName: string;
//   lastName: string;
//   phone?: string;
// }

// export interface Session {
//   accessToken: string;
//   refreshToken: string;
//   user: User;
// }

// export interface LoginData {
//   username: string;
//   password: string;
// }

// export interface SignUpData {
//   email: string;
//   password: string;
//   firstName: string;
//   lastName: string;
//   phone?: string;
// }
