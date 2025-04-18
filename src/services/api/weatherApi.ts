import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { WeatherData, WeatherForecastResponse } from "./types";

export const weatherApi = createApi({
  reducerPath: "weatherApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://dataservice.accuweather.com",
  }),
  endpoints: (builder) => ({
    getDailyForecast: builder.query<WeatherData, string>({
      query: (locationId) =>
        `/forecasts/v1/daily/1day/${locationId}?apikey=6XpRpAFnCiKespheTuuJnev2ovVsP1GV`,
    }),
    getFiveDayForecast: builder.query<WeatherForecastResponse, string>({
      query: (locationId) =>
        `/forecasts/v1/daily/5day/${locationId}?apikey=6XpRpAFnCiKespheTuuJnev2ovVsP1GV`,
    }),
  }),
});

export const { useGetDailyForecastQuery, useGetFiveDayForecastQuery } = weatherApi;