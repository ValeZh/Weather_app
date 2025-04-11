import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { getCachedWeather } from "../utils/weatherCache";

type WeatherItem = {
  dateTime: string;
  temperature: string;
  phrase: string;
};

const Weather = () => {
  const [weather, setWeather] = useState<WeatherItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      console.log("⏳ Загрузка погоды начата");
      try {
        const result = await getCachedWeather();
        console.log("📦 Полученные данные из кеша или БД:", result);

        if (result && Array.isArray(result)) {
          const formatted = result.map((item, index) => {
            console.log(`📋 Элемент ${index}:`, item);

            const dayTemp = item.dayTemperature;
            const nightTemp = item.nightTemperature;
            const phrase = item.dayPhrase ?? "Неизвестно";
            const fetchTime = item.fetchTime;

            // Проверка на существование и валидность чисел
            if (
              typeof dayTemp !== "number" ||
              typeof nightTemp !== "number" ||
              isNaN(dayTemp) ||
              isNaN(nightTemp)
            ) {
              console.warn(`⚠️ Неверные температуры для item ${index}:`, item);
              return {
                dateTime: "Неизвестная дата",
                temperature: "Неверные данные",
                phrase,
              };
            }

            return {
              dateTime: new Date(fetchTime).toLocaleDateString(),
              temperature: `${Math.round(nightTemp-32)}°C ~ ${Math.round(dayTemp-32)}°C`,
              phrase,
            };
          });

          setWeather(formatted);
        } else {
          console.warn("⚠️ Данные не массив или отсутствуют:", result);
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
    <ScrollView contentContainerStyle={styles.container}>
      {loading ? (
        <Text>Загрузка погоды...</Text>
      ) : weather.length > 0 ? (
        weather.map((item, index) => (
          <View key={index} style={styles.card}>
            <Text style={styles.date}>{item.dateTime}</Text>
            <Text style={styles.phrase}>{item.phrase}</Text>
            <Text style={styles.temp}>{item.temperature}</Text>
          </View>
        ))
      ) : (
        <Text>Нет данных о погоде</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f2f2f2",
  },
  card: {
    marginBottom: 15,
    padding: 15,
    borderWidth: 1,
    borderRadius: 10,
    width: "100%",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  date: {
    fontWeight: "bold",
    marginBottom: 5,
  },
  phrase: {
    fontStyle: "italic",
    marginBottom: 5,
  },
  temp: {
    fontSize: 18,
  },
});

export default Weather;
