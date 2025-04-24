import { useEffect, useState } from "react";
import { getCachedWeather } from "../utils/weatherCache";

type WeatherData = {
  daily: any[];
  hourly: any[];
};

export const useWeatherLoader = () => {
  const [loading, setLoading] = useState(true);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getCachedWeather();

        if (data && data.daily && data.hourly) {
          setWeatherData(data);
        } else {
          throw new Error("Невозможно загрузить погодные данные.");
        }
      } catch (e) {
        setError((e as Error).message || "Неизвестная ошибка");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return { loading, weatherData, error };
};
