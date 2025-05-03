import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { CitySearchDataMinimal, CityData, CountryData, RegionData,LocationByCoordsData } from "././types";

// Выносим API ключ и базовый URL в переменные
const API_KEY = "6XpRpAFnCiKespheTuuJnev2ovVsP1GV";
const BASE_URL = "http://dataservice.accuweather.com";

export const locationApi = createApi({
  reducerPath: "locationApi",
  baseQuery: fetchBaseQuery({ baseUrl: BASE_URL }),
  endpoints: (builder) => ({
    getRegions: builder.query<RegionData, void>({
      query: () => `/locations/v1/regions?apikey=${API_KEY}`,
    }),
    getCountries: builder.query<CountryData, string>({
      query: (regionCode) => `/locations/v1/countries/${regionCode}?apikey=${API_KEY}`,
    }),
    getCities: builder.query<CityData, string>({
      query: (countryCode) => `/locations/v1/adminareas/${countryCode}?apikey=${API_KEY}`,
    }),
    SearchLocationId: builder.query<CitySearchDataMinimal, { countryCode: string; cityName: string }>({
      query: ({ countryCode, cityName }) =>
        `/locations/v1/cities/${countryCode}/search?apikey=${API_KEY}&q=${encodeURIComponent(cityName)}`,
    }),
    getLocationByCoords: builder.query<LocationByCoordsData, { lat: number; lon: number }>({
      query: ({ lat, lon }) =>
        `/locations/v1/cities/geoposition/search?apikey=${API_KEY}&q=${lat},${lon}`,
    }),
  }),
});

export const { 
  useGetRegionsQuery,
  useGetCountriesQuery,
  useGetCitiesQuery,
  useSearchLocationIdQuery,
  useGetLocationByCoordsQuery,
} = locationApi;
