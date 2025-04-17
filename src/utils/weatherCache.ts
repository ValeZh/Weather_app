import AsyncStorage from "@react-native-async-storage/async-storage";
import { store } from "../store";
import { weatherApi } from "../services/api/weatherApi";
import {
  checkLastFetchTime,
  saveWeatherData,
  loadWeatherData,
  updateLastFetchTime,
  createTables
} from "../database/db";

const TWELVE_HOURS = 12 * 60 * 60 * 1000;

// Получение прогноза с проверкой на кэш
export const getCachedWeather = async () => {
  const locationId = await AsyncStorage.getItem("locationId");

  if (!locationId) {
    console.error("❌ Ошибка: locationId не найден в AsyncStorage.");
    return null;
  }

  console.log("📍 locationId:", locationId);

  await createTables();

  const lastFetch = await checkLastFetchTime(locationId);
  const now = Date.now();

  console.log("🕒 lastFetch:", lastFetch, "| Текущее время:", now, "| Прошло времени:", now - lastFetch);

  const fetchAndFormat = async () => {
    const result = await store.dispatch(
      weatherApi.endpoints.getFiveDayForecast.initiate(locationId)
    );

    console.log("📡 Результат запроса к API:", result);

    if (result && "data" in result && result.data) {
      const dailyForecasts = result.data.DailyForecasts;

      const formatted = dailyForecasts.map((day: any) => ({
        epochDate: Math.floor(new Date(day.Date).getTime() / 1000),
        dayTemperature: day.Temperature.Maximum.Value,
        nightTemperature: day.Temperature.Minimum.Value,
        dayPhrase: day.Day.IconPhrase,
        nightPhrase: day.Night.IconPhrase,
      }));

      await saveWeatherData(locationId, formatted);
      await updateLastFetchTime(locationId);

      console.log("📦 Сформатированный прогноз:", formatted);
      console.log("📤 Источник данных: API → SQLite");

      return formatted;
    } else {
      console.error("❌ Ошибка получения данных с API:", result?.error ?? "Неизвестная ошибка");
      return null;
    }
  };

  if (!lastFetch || now - lastFetch >= TWELVE_HOURS) {
    console.log("🌐 Кэш устарел или отсутствует — отправляем запрос к API...");
    return await fetchAndFormat();
  } else {
    console.log("💾 Загружаем данные из SQLite (кэш)...");

    const localData = await loadWeatherData(locationId);

    if (localData && localData.length > 0) {
      console.log("📦 Загруженные данные из SQLite:", localData);
      console.log("📤 Источник данных: SQLite (из кэша)");
      return localData;
    } else {
      console.log("⚠️ Нет данных в БД — делаем запрос к API...");
      return await fetchAndFormat();
    }
  }
};
