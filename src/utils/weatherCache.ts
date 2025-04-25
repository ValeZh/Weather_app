import AsyncStorage from "@react-native-async-storage/async-storage";
import { store } from "../store";
import { weatherApi } from "../services/api/weatherApi";
import {
  checkLastFetchTime,
  saveWeatherData,
  saveHourlyWeatherData,
  loadWeatherData,
  loadHourlyWeatherData,
  updateLastFetchTime,
  createTables,
} from "../database/db";
import { HourlyForecast } from "../services/api/types";

const TWELVE_HOURS = 12 * 60 * 60 * 1000;

export const getCachedWeather = async () => {
  const locationId = await AsyncStorage.getItem("locationId");

  if (!locationId) {
    console.error("❌ Ошибка: locationId не найден в AsyncStorage.");
    return { daily: [], hourly: [] };
  }

  await createTables();
  const lastFetch = await checkLastFetchTime(locationId);
  const now = Date.now();

  const fetchAndStoreToDb = async () => {
    const dailyResult = await store.dispatch(
      weatherApi.endpoints.getFiveDayForecast.initiate(locationId)
    );
    const hourlyResult = await store.dispatch(
      weatherApi.endpoints.getTwelveHourForecast.initiate(locationId)
    );

    if (
      dailyResult && "data" in dailyResult && dailyResult.data &&
      hourlyResult && "data" in hourlyResult && hourlyResult.data
    ) {
      const dailyForecasts = dailyResult.data.DailyForecasts;
      const hourlyForecasts = hourlyResult.data;

      const formattedDaily = dailyForecasts.map((day: any) => ({
        epochDate: Math.floor(new Date(day.Date).getTime() / 1000),
        dayTemperature: day.Temperature.Maximum.Value,
        nightTemperature: day.Temperature.Minimum.Value,
        dayPhrase: day.Day.IconPhrase,
        nightPhrase: day.Night.IconPhrase,
        weatherIdDay: day.Day.Icon,
        weatherIdNight: day.Night.Icon,
        hasPrecipitationDay: day.Day.HasPrecipitation ? 1 : 0,
        hasPrecipitationNight: day.Night.HasPrecipitation ? 1 : 0,
      }));

      const formattedHourly = hourlyForecasts.map((hour: any) => ({
        DateTime: hour.DateTime,
        EpochDateTime: Math.floor(new Date(hour.DateTime).getTime() / 1000),
        WeatherIcon: hour.WeatherIcon,
        IconPhrase: hour.IconPhrase,
        HasPrecipitation: hour.HasPrecipitation ? 1 : 0,
        IsDaylight: hour.IsDaylight ? 1 : 0,
        Temperature: {
          Value: hour.Temperature.Value,
        },
        PrecipitationProbability: hour.PrecipitationProbability,
      }));

      await saveWeatherData(locationId, formattedDaily);
      await saveHourlyWeatherData(locationId, formattedHourly);
      await updateLastFetchTime(locationId);
    } else {
      console.error("❌ Ошибка получения данных с API");
    }
  };

  if (!lastFetch || now - lastFetch >= TWELVE_HOURS) {
    await fetchAndStoreToDb();
  }

  const localDaily = await loadWeatherData(locationId);
  const localHourly = await loadHourlyWeatherData(locationId);
  const result = { daily: localDaily, hourly: localHourly };

  if ((localDaily?.length ?? 0) > 0 && (localHourly?.length ?? 0) > 0) {
    console.log("💾 Возвращено из БД:", JSON.stringify(result, null, 2));
    return result;
  } else {
    console.warn("⚠️ Данные в БД не найдены даже после запроса.");
    return { daily: [], hourly: [] };
  }
};