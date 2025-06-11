import { BaseQueryApi, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { Platform } from 'react-native';
import { config } from '../../constants';

type RequestInterceptor = (args: FetchArgs, api: BaseQueryApi) => FetchArgs;
type ResponseInterceptor = (response: any, args: FetchArgs, api: BaseQueryApi) => any;
type ErrorInterceptor = (error: FetchBaseQueryError, args: FetchArgs, api: BaseQueryApi) => any;

export const interceptors = {
    error: [] as ErrorInterceptor[],
    request: [] as RequestInterceptor[],
    response: [] as ResponseInterceptor[],
};

export const addInterceptor = {
    request: (interceptor: RequestInterceptor) => {
        interceptors.request.push(interceptor);
    },
    response: (interceptor: ResponseInterceptor) => {
        interceptors.response.push(interceptor);
    },
    error: (interceptor: ErrorInterceptor) => {
        interceptors.error.push(interceptor);
    },
};
// Promise<FetchArgs>
export const applyInterceptors = async (
    args: FetchArgs,
    api: BaseQueryApi,
    baseQuery: (args: FetchArgs, api: BaseQueryApi, extraOptions: any) => any
) => {
    let modifiedArgs = args;
    for (const interceptor of interceptors.request) {
        modifiedArgs = await interceptor(modifiedArgs, api);
    }

    try {
        let result = await baseQuery(modifiedArgs, api, {});

        for (const interceptor of interceptors.response) {
            result = await interceptor(result, modifiedArgs, api);
        }

        return result;
    } catch (error: any) {
        for (const interceptor of interceptors.error) {
            error = await interceptor(error, modifiedArgs, api);
        }
        throw error;
    }
};
