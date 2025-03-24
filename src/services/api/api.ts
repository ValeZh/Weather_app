// Need to use the React-specific entry point to import createApi
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { WeatherData } from './types';

// Define a service using a base URL and expected endpoints
export const weatherApi = createApi({
    reducerPath: 'weatherApi',
    baseQuery: fetchBaseQuery({ baseUrl: 'http://dataservice.accuweather.com' }),
    endpoints: builder => ({
        getAllPosts: builder.query<WeatherData, string>({
            query: (locationId) => `/forecasts/v1/daily/1day/${locationId}?apikey=6XpRpAFnCiKespheTuuJnev2ovVsP1GV`,

        }),
    }),
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const { useGetAllPostsQuery } = weatherApi;
