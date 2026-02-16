// outsource dependencies
import { createApi } from '@reduxjs/toolkit/query/react';
// local dependencies
// import { LoginData, SignUpData, User, Session } from '../../types/user';
import { LoginData, User, UserSession } from 'types';
import { baseQuery, sessionManager } from './baseApi';
import { clearSession, setSession, setUser } from 'store/slices/appSlice';

export const authApi = createApi({
    baseQuery,
    tagTypes: ['Auth'],
    reducerPath: 'authApi',
    endpoints: builder => ({
        refreshSession: builder.mutation<UserSession, void>({
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
        restoreSession: builder.query<User, void>({
            query: () => '/patient-service/patients/me',
            async onQueryStarted (_, { queryFulfilled }) {
                // try {
                // } catch (error) {
                // }
            },
            providesTags: ['Auth'],
        }),
        getSelf: builder.query<User, void>({
            query: () => {
                return {
                    method: 'GET',
                    url: '/patient-service/patients/me',
                };
            },
            async onQueryStarted (_, { queryFulfilled }) {
                try {
                    await queryFulfilled;
                } catch {
                    // await sessionManager.update(null);
                }
            },
            transformResponse: (response: User) => {
                return {
                    ...response,
                };
            },
            providesTags: ['Auth'],
            transformErrorResponse: (response: Error) => {
                return response;
            },
        }),
        login: builder.mutation<UserSession, LoginData>({
            query: credentials => ({
                method: 'POST',
                body: credentials,
                url: '/auth/token',
            }),
            async onQueryStarted (_, { dispatch, queryFulfilled }) {
                try {
                    const { data: session } = await queryFulfilled;
                    dispatch(setSession(session));
                    await sessionManager.update(session);
                    await new Promise(resolve => setTimeout(resolve as () => void, 100));

                    const userData = await dispatch(
                        authApi.endpoints.getSelf.initiate()
                    ).unwrap();
                    
                    dispatch(setUser(userData));
                } catch (error) {
                    await sessionManager.update(null);
                    dispatch(setUser(null));
                    throw error;
                }
            },
            invalidatesTags: ['Auth'],
        }),
        registerNotificationToken: builder.mutation<void, { token: string }>({
            query: ({ token }) => ({
                method: 'POST',
                params: { token },
                url: '/auth/users/notification-token',
            }),
        }),
        // signUp: builder.mutation<User, SignUpData>({
        //     query: data => ({
        //         url: '/patient-service/public/patients/sign-up',
        //         method: 'POST',
        //         body: data,
        //     }),
        // }),
        logout: builder.mutation<void, void>({
            query: () => ({
                url: '/auth/logout',
                method: 'POST',
            }),
            async onQueryStarted (_, { queryFulfilled, dispatch }) {
                try {
                    await queryFulfilled;
                } catch (error) {
                    console.error('Logout API error (continuing with local cleanup):', error);
                } finally {
                    await sessionManager.update(null);
                    dispatch(clearSession());
                    dispatch(setUser(null));
                }
            },
            invalidatesTags: ['Auth'],
        }),
        forgotPassword: builder.mutation<void, { email: string }>({
            query: data => ({
                url: '/auth/send-reset-password-token',
                method: 'POST',
                body: data,
            }),
        }),
        checkHealth: builder.query<{ status: string }, void>({
            query: () => '/actuator/health',
        }),
    }),
});

export const {
    useGetSelfQuery,
    useLoginMutation,
    useLogoutMutation,
    useCheckHealthQuery,
    // useSignUpMutation,
    useRestoreSessionQuery,
    useRefreshSessionMutation,
    useForgotPasswordMutation,
    useRegisterNotificationTokenMutation,
} = authApi;
