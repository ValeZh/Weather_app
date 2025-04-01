import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { CitySearchDataMinimal,CityData,CountryData, RegionData } from "././types";

export const locationApi = createApi({
  reducerPath: "locationApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://dataservice.accuweather.com" }),
  endpoints: (builder) => ({
    getRegions: builder.query<RegionData, void>({
      query: () => `/locations/v1/regions?apikey=6XpRpAFnCiKespheTuuJnev2ovVsP1GV`,
    }),
    getCountries: builder.query<CountryData, string>({
        query: (regionCode) => `/locations/v1/countries/${regionCode}?apikey=6XpRpAFnCiKespheTuuJnev2ovVsP1GV`,
    }),
    getCities: builder.query<CityData, string>({
        query: (countryCode) => `/locations/v1/adminareas/${countryCode}?apikey=6XpRpAFnCiKespheTuuJnev2ovVsP1GV`,
    }),
    SearchLocationId: builder.query<CitySearchDataMinimal, { countryCode: string; cityName: string }>({
      query: ({ countryCode, cityName }) => `locations/v1/cities/${countryCode}/search?apikey=6XpRpAFnCiKespheTuuJnev2ovVsP1GV&q=${encodeURIComponent(cityName)}`,
    }),
  }),
});

export const { 
  useGetRegionsQuery,
  useGetCountriesQuery,
  useGetCitiesQuery,
  useSearchLocationIdQuery,
} = locationApi;
