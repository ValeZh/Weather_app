import { useEffect, useState } from "react";
import { getCachedWeather } from "../utils/weatherCache"; // Импорт функции получения данных
import { loadHourlyWeatherData } from "../database/db"; // Импорт функции загрузки данных из базы
import AsyncStorage from "@react-native-async-storage/async-storage";

// Интерфейс для структуры данных о погоде
interface WeatherData {
  daily: any[];   // Здесь можно заменить `any` на точный тип, если есть структура данных
  hourly: any[];
}

export const useWeatherLoader = () => {
  const [weatherData, setWeatherData] = useState<WeatherData>({ daily: [], hourly: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWeather = async () => {
      setLoading(true);
      try {
        // Получаем данные о погоде из кеша или API
        const data = await getCachedWeather();
        console.log("📦 Данные погоды:", data);

        // Если в данных о погоде отсутствуют почасовые данные, пытаемся загрузить их из базы данных
        if (!data.hourly || data.hourly.length === 0) {
          const locationId = await AsyncStorage.getItem("locationId");
          if (locationId) {
            // Если locationId найден, загружаем почасовые данные из базы данных
            const fallbackHourly = await loadHourlyWeatherData(locationId);
            if (fallbackHourly?.length) {
              data.hourly = fallbackHourly;  // Используем данные из базы
            } else {
              setError("Не удалось найти почасовые данные в базе данных");
            }
          } else {
            setError("Не найдено locationId для загрузки данных");
          }
        }

        // Обновляем состояние с полученными данными
        setWeatherData(data);
      } catch (err) {
        setError("Не удалось загрузить данные");
        console.error("useWeatherLoader error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadWeather(); // Запускаем загрузку данных
  }, []); // Пустой массив зависимостей, чтобы эффект сработал один раз при монтировании

  return { weatherData, loading, error };
};
