// outsource dependencies
import { createApi } from '@reduxjs/toolkit/query/react';
import { CropRect } from 'react-native-image-crop-picker';

// local dependencies
import { baseQuery } from './baseApi';
import { Attachment } from 'types/messenger.ts';

// configure
export const DIR = {
    USER: 'USER',
    FOOD: 'FOOD',
    RECIPE: 'RECIPE',
    DEFAULT: 'DEFAULT'
};

export const s3ServiceApi = createApi({
    baseQuery,
    reducerPath: 's3ServiceApi',
    endpoints: builder => ({
        uploadImage: builder.mutation<{ url: string }, { body: FormData, params: CropRect }>({
            query: ({ body, params }) => ({
                body,
                params,
                method: 'POST',
                url: '/s3-service/images/upload',
            }),
        }),
        uploadAttachment: builder.mutation<Attachment, { body: FormData }>({
            query: ({ body }) => ({
                body,
                method: 'POST',
                url: '/s3-service/attachment/upload',
            }),
        }),
    })
});

export const { useUploadAttachmentMutation } = s3ServiceApi;
export const uploadImageInitiate = s3ServiceApi.endpoints.uploadImage.initiate;
export const uploadAttachmentInitiate = s3ServiceApi.endpoints.uploadAttachment.initiate;
