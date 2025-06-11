// outsource dependencies
import {
    FetchArgs,
    BaseQueryApi,
    fetchBaseQuery,
    FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// local dependencies
import { Session } from './types';
import { config } from '../../constants';
import { addInterceptor, applyInterceptors } from './interceptors';

//   // Добавление перехватчика запросов
// addInterceptor.request(async (args, api) => {
//     // Добавляем заголовки
//     args.headers = {
//       ...args.headers,
//       'Cache-Control': 'no-cache',
//       'Content-Type': 'application/json',
//       'user-platform': Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
//     };
//     return args;
//   });
  
// Добавление перехватчика ответов
addInterceptor.response(async (response, args, api) => {
    // Логирование в режиме отладки
    if (config.DEBUG) {
        console.info('%c RESPONSE ', 'background: green; color: #fff;', response);
    }
    return response;
});
  
// Добавление перехватчика ошибок
addInterceptor.error(async (error, args, api) => {
    // Обработка ошибок
    if (error.status === 401) {
        // Логика обновления токена
    }
    return error;
});
  type RefreshError = FetchBaseQueryError & {
    status: number;
    data?: unknown;
    originalArgs: FetchArgs & {
      wasTryingToRestore?: boolean;
    //   headers?: Record<string, string>;
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
    HEADER: 'authorization',
    REFRESH: 'refreshToken',
} as const;

let isRefreshing = false;
let stuckRequests: Array<StuckRequest> = [];

const BASE_API = `${config.serviceUrl}/${config.apiPath}`;

export const sessionManager = {
    async update (session: Session | null) {
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
                await sessionManager.update(refreshResult.data as Session);
                await Promise.all(
                    stuckRequests.map(({ resolve, reject, args }) =>
                        Promise.resolve(baseQueryRaw(args, api, {}))
                            .then(resolve)
                            .catch(reject)
                    )
                );
                //   await Promise.all(
                //     stuckRequests.map(({ resolve, reject, args }) =>
                //       baseQueryRaw(args, api).then(resolve).catch(reject)
                //     )
                //   );
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
    prepareHeaders: async headers => {
        const session = await sessionManager.get();
        if (session?.[TOKEN_KEYS.ACCESS]) {
            headers.set(TOKEN_KEYS.HEADER, `${TOKEN_KEYS.BEARER}${session[TOKEN_KEYS.ACCESS]}`);
        }
        headers.set('Content-Type', 'application/json');
        headers.set('user-platform', Platform.OS === 'ios' ? 'IOS' : 'ANDROID');
        return headers;
    },
});

export const baseQuery = async (
    args: string | FetchArgs,
    api: BaseQueryApi,
    extraOptions: any
) => {
    const fetchArgs = typeof args === 'string' ? { url: args } : args;
    return applyInterceptors(fetchArgs, api, baseQueryRaw);
};

//   export const baseQuery = async (
//     args: string | FetchArgs,
//     api: any,
//     extraOptions: any
//   ): Promise<
//     | { data: unknown }
//     | { error: FetchBaseQueryError }
//   > => {
//     const result = await baseQueryRaw(args, api, extraOptions);
  
//     if (result.error?.status === 401) {
//       let refreshError: RefreshError;
  
//       if (typeof args === 'string') {
//         const minimalFetchArgs: FetchArgs & { wasTryingToRestore?: boolean; headers?: Record<string, string> } = {
//           url: args,
//           headers: {},
//         //   method: 'GET',
//           wasTryingToRestore: false,
//         };
  
//         refreshError = {
//             data: result.error.data,
//             status: result.error.status,
//           originalArgs: minimalFetchArgs
//         };
//       } else {
//         refreshError = {
//           status: result.error.status,
//           data: result.error.data,
//           originalArgs: {
//             ...args,
//             wasTryingToRestore: false,
//             headers: args.headers ?? {}
//           }
//         };
//       }
//       return handleRefreshToken(refreshError, api);
//     }
//     return result;
//   };

