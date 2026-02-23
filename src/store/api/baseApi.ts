// outsource dependencies
import {
    FetchArgs,
    BaseQueryApi,
    fetchBaseQuery,
    FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { Platform } from 'react-native';
import * as Sentry from '@sentry/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// local dependencies
import { RootState } from 'store';
import { config } from 'constants';
import { UserSession } from 'types';
import { addInterceptor, applyInterceptors } from './interceptors';

// add response interceptor
addInterceptor.response(async response => {
    // log response in debug mode
    if (config.DEBUG) {
        console.info('%c RESPONSE ', 'background: green; color: #fff;', response);
    }
    return response;
});

// add error interceptor
addInterceptor.error(async (error, args, api) => {
    const refreshError: RefreshError = {
        data: error.data,
        originalArgs: args,
        status: error.status as number,
    };

    // Log only MUST log statuses: 500+ and 404
    const status = error.status as number | string;

    if (
        (typeof status === 'number' && status >= 500)
      || status === 404
    ) {
        Sentry.captureException(
            new Error(
                `API Error ${(args as FetchArgs)?.url}: ${JSON.stringify(error)}`
            )
        );
    }

    if (error.status === 401) {
        return handleRefreshToken(refreshError, api);
    }

    return error;
});

  type RefreshError = FetchBaseQueryError & {

    status: number;
    data?: unknown;
    originalArgs: FetchArgs & {
        wasTryingToRestore?: boolean;
    };
  };

  type StuckRequest = {
    resolve: (value: unknown) => void;
    reject: (error: unknown) => void;
    args: FetchArgs;
  };

export const TOKEN_KEYS = {
    STORE: 'sAuth',
    BEARER: 'Bearer ',
    ACCESS: 'accessToken',
    HEADER: 'Authorization',
    REFRESH: 'refreshToken',
} as const;

let isRefreshing = false;
let stuckRequests: Array<StuckRequest> = [];

const BASE_API = `${config.serviceUrl}/${config.apiPath}`;

export const sessionManager = {
    async update (session: UserSession | null) {
        if (session) {
            await AsyncStorage.setItem(TOKEN_KEYS.STORE, JSON.stringify({
                [TOKEN_KEYS.ACCESS]: session[TOKEN_KEYS.ACCESS],
                [TOKEN_KEYS.REFRESH]: session[TOKEN_KEYS.REFRESH]
            }));
        } else {
            await AsyncStorage.removeItem(TOKEN_KEYS.STORE);
        }
    },

    async get () {
        try {
            const session = await AsyncStorage.getItem(TOKEN_KEYS.STORE);
            return session ? JSON.parse(session) : null;
        } catch {
            return null;
        }
    },

    async isLoggedIn (): Promise<boolean> {
        const session = await this.get();
        return !!(session?.accessToken && session?.refreshToken);
    }
};


const handleRefreshToken = async (
    error: RefreshError,
    api: BaseQueryApi
): Promise<any> => {
    if (!isRefreshing) {
        isRefreshing = true;

        try {
            const session = await sessionManager.get();
            if (!session?.[TOKEN_KEYS.REFRESH]) {
                throw new Error('No refresh token available');
            }

            const refreshResult = await baseQueryRaw(
                {
                    url: '/auth/token/refresh',
                    method: 'POST',
                    body: { refreshToken: session[TOKEN_KEYS.REFRESH] }
                },
                api, {}
            );

            if (refreshResult.data
            && typeof refreshResult.data === 'object'
             && (TOKEN_KEYS.ACCESS in refreshResult.data)) {
                await sessionManager.update(refreshResult.data as UserSession);
                await Promise.all(
                    stuckRequests.map(({ resolve, reject, args }) =>
                        Promise.resolve(baseQueryRaw(args, api, {}))
                            .then(resolve)
                            .catch(reject)
                    )
                );
            } else {
                throw new Error('Invalid refresh response');
            }
        } catch (refreshError) {
            stuckRequests.forEach(({ reject }) =>
                reject(refreshError)
            );
            await sessionManager.update(null);
        } finally {
            stuckRequests = [];
            isRefreshing = false;
        }
    }

    if (!error.originalArgs.wasTryingToRestore) {
        return new Promise((resolve, reject) => {
            error.originalArgs.wasTryingToRestore = true;
            stuckRequests.push({
                resolve,
                reject,
                args: error.originalArgs
            });
        });
    }

    return error;
};

const baseQueryRaw = fetchBaseQuery({
    baseUrl: BASE_API,
    prepareHeaders: async (headers, { getState, endpoint }) => {
        const session = await sessionManager.get();
        const token = (getState() as RootState).app.accessToken;
        const actualToken = session?.[TOKEN_KEYS.ACCESS] || token;
        if (actualToken) {
            headers.set(TOKEN_KEYS.HEADER, `${TOKEN_KEYS.BEARER}${actualToken}`);
        } else {
            console.log('No access token found in session');
        }

        if (endpoint !== 'uploadImage' && endpoint !== 'uploadAttachment') {
            headers.set('Content-Type', 'application/json');
        }
        headers.set('user-platform', Platform.OS === 'ios' ? 'IOS' : 'ANDROID');
        return headers;
    }
});

export const baseQuery = async (
    args: string | FetchArgs,
    api: BaseQueryApi,
) => {
    const fetchArgs = typeof args === 'string' ? { url: args } : args;
    return applyInterceptors(fetchArgs, api, baseQueryRaw);
};

// Public baseQueryRawPub and baseQueryPub (no auth, like instancePub)
const baseQueryRawPub = fetchBaseQuery({
    baseUrl: BASE_API,
    prepareHeaders: async headers => {
        headers.set('Content-Type', 'application/json');
        headers.set('user-platform', Platform.OS === 'ios' ? 'IOS' : 'ANDROID');
        return headers;
    },
});

export const baseQueryPub = async (
    args: string | FetchArgs,
    api: BaseQueryApi,
) => {
    const fetchArgs = typeof args === 'string' ? { url: args } : args;
    return applyInterceptors(fetchArgs, api, baseQueryRawPub);
};
