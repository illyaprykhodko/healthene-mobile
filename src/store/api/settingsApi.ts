// outsource dependencies
import { createApi } from '@reduxjs/toolkit/query/react';

// local dependencies
import { baseQuery } from 'store/api/baseApi.ts';
import { Country, User, State, ChangePassword } from 'types';

export interface NotificationSetting {
    id: number;
    enabled: boolean;
    notificationType: string;
}

export const settingsApi = createApi({
    baseQuery,
    reducerPath: 'settingsApi',
    tagTypes: ['NotificationSettings'],
    endpoints: builder => ({
        updateUserData: builder.mutation<User, Partial<User>>({
            query: body => ({
                body,
                method: 'PUT',
                url: '/patient-service/patients/me',
            }),
        }),
        filterCountry: builder.mutation<Country[], void >({
            query: body => {
                return {
                    body,
                    method: 'POST',
                    url: '/patient-service/country/filter',
                };
            },
        }),
        filterState: builder.mutation<State[], {country: number} >({
            query: body => {
                return {
                    body,
                    method: 'POST',
                    url: '/patient-service/country/state/filter',
                };
            },
        }),
        changePassword: builder.mutation<void, Omit<ChangePassword, 'checkPassword'>>({
            query: body => ({
                body,
                method: 'PUT',
                url: '/patient-service/user/account/password',
            }),
        }),
        changeEmailRequest: builder.mutation<void, { newEmail: string; verificationUrl: string }>({
            query: body => ({
                body,
                method: 'POST',
                url: '/patient-service/patients/me/email/change-request',
            }),
        }),
        getNotificationSettings: builder.query<NotificationSetting[], void>({
            query: () => ({
                method: 'GET',
                url: '/patient-service/patients/me/notification-setting',
            }),
            providesTags: ['NotificationSettings'],
        }),
        updateNotificationSettings: builder.mutation<NotificationSetting[], NotificationSetting[]>({
            query: body => ({
                body,
                method: 'PUT',
                url: '/patient-service/patients/me/notification-setting',
            }),
            invalidatesTags: ['NotificationSettings'],
        }),
    })
});

export const {
    useFilterStateMutation,
    useFilterCountryMutation,
    useUpdateUserDataMutation,
    useChangePasswordMutation,
    useChangeEmailRequestMutation,
    useGetNotificationSettingsQuery,
    useUpdateNotificationSettingsMutation,
} = settingsApi;
