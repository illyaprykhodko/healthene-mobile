import {baseQueryPub} from "store/api/baseApi.ts";
import {BUSINESS_PROPERTIES} from "types";
import {createApi} from "@reduxjs/toolkit/query/react";


export const publicApi = createApi({
  reducerPath: 'publicApi',
  baseQuery: baseQueryPub,
  endpoints: builder => ({
    getTerms: builder.query<{ value: string }, BUSINESS_PROPERTIES>({
      query: (property) => ({
        method: 'GET',
        url: `patient-service/public/business-properties/key/${property}`
      }),
    }),
  }),
});

export const {
  useGetTermsQuery
} = publicApi;
