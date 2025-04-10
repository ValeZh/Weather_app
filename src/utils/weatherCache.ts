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
    console.error("Ошибка: locationId не найден в AsyncStorage.");
    return null;  // Возвращаем null, если locationId не найден
  }

  console.log("🚀 locationId:", locationId);

  await createTables(); // Создаем таблицы, если они еще не созданы

  const lastFetch = await checkLastFetchTime(locationId);
  const now = Date.now();

  console.log("lastFetch:", lastFetch, "Текущее время:", now, "Прошло времени:", now - lastFetch);

  // Если прошло больше 12 часов с последнего запроса или таблица пуста, обновляем данные
  if (!lastFetch || now - lastFetch >= TWELVE_HOURS) {
    console.log("Отправка запроса для получения прогноза для локации:", locationId);

    try {
      // Делаем запрос к API
      const result = await store.dispatch(weatherApi.endpoints.getDailyForecast.initiate(locationId));

      console.log("Результат запроса к API:", result);

      // Проверка успешного получения данных
      if (result && "data" in result && result.data) {
        const dailyForecasts = result.data.DailyForecasts;
        
        // Сохраняем данные в базе данных
        await saveWeatherData(locationId, dailyForecasts);
        await updateLastFetchTime(locationId);

        console.log("Данные успешно обновлены и сохранены.");
        return dailyForecasts;
      } else {
        console.error("Ошибка получения данных с API:", result?.error ?? "Неизвестная ошибка");
        return null;  // Возвращаем null при ошибке
      }
    } catch (error) {
      console.error("Ошибка при запросе к API:", error);
      return null;  // Возвращаем null при ошибке запроса
    }
  } else {
    // Если данные не старые или уже есть данные в базе, загружаем их из локальной базы данных
    console.log("Загружаем данные из кэша...");
    const localData = await loadWeatherData(locationId);

    if (localData && localData.length > 0) {
      console.log("Загруженные данные из базы:", localData);
      return localData;
    } else {
      // Если данных нет, запросим их из API
      console.log("Данных нет в базе, делаем запрос...");
      const result = await store.dispatch(weatherApi.endpoints.getDailyForecast.initiate(locationId));

      if (result && "data" in result && result.data) {
        const dailyForecasts = result.data.DailyForecasts;
        
        // Сохраняем данные в базе данных
        await saveWeatherData(locationId, dailyForecasts);
        await updateLastFetchTime(locationId);

        console.log("Данные успешно обновлены и сохранены.");
        return dailyForecasts;
      } else {
        console.error("Ошибка получения данных с API:", result?.error ?? "Неизвестная ошибка");
        return null;  // Возвращаем null при ошибке
      }
    }
  }
};
