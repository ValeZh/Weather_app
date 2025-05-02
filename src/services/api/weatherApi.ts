import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  WeatherData,
  WeatherForecastResponse,
  HourlyWeatherResponse
} from "./types";

const API_KEY = "6XpRpAFnCiKespheTuuJnev2ovVsP1GV";

export const weatherApi = createApi({
  reducerPath: "weatherApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://dataservice.accuweather.com",
  }),
  endpoints: (builder) => ({
    getDailyForecast: builder.query<WeatherData, string>({
      query: (locationId) =>
        `/forecasts/v1/daily/1day/${locationId}?apikey=${API_KEY}`,
    }),
    getFiveDayForecast: builder.query<WeatherForecastResponse, string>({
      query: (locationId) =>
        `/forecasts/v1/daily/5day/${locationId}?apikey=${API_KEY}`,
    }),
    getTwelveHourForecast: builder.query<HourlyWeatherResponse, string>({
      query: (locationId) =>
        `/forecasts/v1/hourly/12hour/${locationId}?apikey=${API_KEY}`, // Check if this endpoint is correct
    }),
  }),
});

export const {
  useGetDailyForecastQuery,
  useGetFiveDayForecastQuery,
  useGetTwelveHourForecastQuery,
} = weatherApi;