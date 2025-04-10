import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { getCachedWeather } from "../utils/weatherCache";

type WeatherItem = {
  dateTime: string;
  temperature: number;
  iconPhrase: string;
  epochDate: number;
};

const Weather = () => {
  const [weather, setWeather] = useState<WeatherItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      console.log("⏳ Загрузка погоды начата");
      try {
        const data = await getCachedWeather();
        console.log("📦 Данные из кеша или API:", data);

        if (data && Array.isArray(data)) {
          const formatted = data.map((f: any, index: number) => {
            const item = {
              dateTime: f.Date,
              temperature: convertToCelsius(f.Temperature?.Maximum?.Value ?? 0),
              iconPhrase: f.Day?.IconPhrase ?? "Неизвестно",
              epochDate: f.EpochDate ?? index, // fallback для key
            };
            console.log("📅 Прогноз:", item);
            return item;
          });

          setWeather(formatted);
        } else {
          console.warn("⚠️ Неверный формат данных погоды:", data);
        }
      } catch (error) {
        console.error("❌ Ошибка загрузки погоды:", error);
      } finally {
        setLoading(false);
        console.log("✅ Загрузка завершена");
      }
    };

    load();
  }, []);

  return (
    <View style={styles.container}>
      {loading ? (
        <Text>Загрузка погоды...</Text>
      ) : weather.length > 0 ? (
        weather.map((item) => (
          <View key={item.epochDate} style={styles.card}>
            <Text>{item.dateTime}</Text>
            <Text>{item.iconPhrase}</Text>
            <Text>{item.temperature} °C</Text>
          </View>
        ))
      ) : (
        <Text>Нет данных о погоде</Text>
      )}
    </View>
  );
};

const convertToCelsius = (fahrenheit: number) => {
  return Math.round(((fahrenheit - 32) * 5) / 9);
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  card: {
    marginBottom: 15,
    padding: 10,
    borderWidth: 1,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
  },
});

export default Weather;
