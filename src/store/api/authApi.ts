// outsource dependencies
import { createApi } from '@reduxjs/toolkit/query/react';
// local dependencies
import { baseQuery, sessionManager } from './baseApi';
import { Session, LoginData, SignUpData, User } from './types';

export const authApi = createApi({
    reducerPath: 'authApi',
    baseQuery,
    tagTypes: ['Auth'],
    endpoints: builder => ({
        refreshSession: builder.mutation<Session, void>({
            query: () => ({
                url: '/auth/token/refresh',
                method: 'POST',
            }),
            async onQueryStarted (_, { queryFulfilled }) {
                try {
                    const { data: session } = await queryFulfilled;
                    await sessionManager.update(session);
                } catch {
                    await sessionManager.update(null);
                }
            },
        }),
        restoreSession: builder.query<Session, void>({
            query: () => '/auth/session',
            async onQueryStarted (_, { queryFulfilled }) {
                try {
                    const { data: session } = await queryFulfilled;
                    await sessionManager.update(session);
                } catch {
                    await sessionManager.update(null);
                }
            },
        }),
        // login: builder.mutation<Session, LoginData>({
        //   query: (credentials) => ({
        //     url: '/auth/token',
        //     method: 'POST',
        //     body: credentials,
        //   }),
        //   invalidatesTags: ['Auth'],
        // }),
        getSelf: builder.query<User, void>({
            query: () => '/patient-service/patients/me',
            transformResponse: (response: User) => {
                return {
                    ...response,
                    // cellPhone: formatPhoneNumber(response.cellPhone),
                    // workPhone: formatPhoneNumber(response.workPhone),
                    // homePhone: formatPhoneNumber(response.homePhone),
                };
            },
            providesTags: ['Auth'],
        }),
        login: builder.mutation<Session, LoginData>({
            query: credentials => ({
                url: '/auth/token',
                method: 'POST',
                body: credentials,
            }),
            async onQueryStarted (_, { dispatch, queryFulfilled }) {
                try {
                    const { data: session } = await queryFulfilled;
                    await sessionManager.update(session);
          
                    const userResult: User = await dispatch(
                        authApi.endpoints.getSelf.initiate()
                    ).unwrap();
                    console.log('userResult', userResult);
                    // return userResult;
                } catch (error) {
                    await sessionManager.update(null);
                    throw error;
                }
            },
            invalidatesTags: ['Auth'],
        }),
        // login: builder.mutation<Session, LoginData>({
        //   query: (credentials) => ({
        //     url: '/auth/token',
        //     method: 'POST',
        //     body: credentials,
        //   }),
        //   async onQueryStarted(_, { queryFulfilled }) {
        //     try {
        //       const { data: session } = await queryFulfilled;
        //       await sessionManager.update(session);
        //       const user = await getSelf().unwrap();
        //       return user;
        //     } catch (error) {
        //       await sessionManager.update(null);
        //       throw error;
        //     }
        //   },
        //   invalidatesTags: ['Auth'],
        // }),
        signUp: builder.mutation<Session, SignUpData>({
            query: data => ({
                url: '/auth/signup',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Auth'],
        }),
        logout: builder.mutation<void, void>({
            query: () => ({
                url: '/auth/logout',
                method: 'POST',
            }),
            invalidatesTags: ['Auth'],
        }),
        getSession: builder.query<Session | null, void>({
            query: () => '/auth/session',
            providesTags: ['Auth'],
        }),
        // getSelf: builder.query<User, void>({
        //   query: () => '/auth/me',
        //   providesTags: ['Auth'],
        // }),
        forgotPassword: builder.mutation<void, { email: string }>({
            query: data => ({
                url: '/auth/forgot-password',
                method: 'POST',
                body: data,
            }),
        }),
        checkHealth: builder.query<boolean, void>({
            query: () => '/actuator/health',
            transformResponse: () => true,
            transformErrorResponse: () => false,
        }),
    }),
});

export const {
    useLoginMutation,
    useSignUpMutation,
    useLogoutMutation,
    useGetSessionQuery,
    useGetSelfQuery,
    useForgotPasswordMutation,
    useCheckHealthQuery,
} = authApi;
