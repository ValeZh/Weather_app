import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { getCachedWeather } from "../utils/weatherCache";
import AsyncStorage from "@react-native-async-storage/async-storage";

type WeatherItem = {
  dateTime: string;
  dayTemperature: string;
  dayPhase: string;
  nightTemperature: string;
  nightPhase: string;
};

const Weather = () => {
  const [weather, setWeather] = useState<WeatherItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationId, setLocationId] = useState<string | null>(null);

  useEffect(() => {
    const loadWeather = async () => {
      console.log("⏳ Загрузка погоды начата");

      try {
        const savedId = await AsyncStorage.getItem("locationId");
        console.log("📍 Загружен locationId из памяти:", savedId);
        setLocationId(savedId);

        if (!savedId) {
          console.warn("⚠️ Location ID отсутствует. Погода не будет загружена.");
          return;
        }

        const result = await getCachedWeather();
        console.log("📦 Полученные данные из кеша или БД:", result);

        if (result && Array.isArray(result)) {
          const formatted = result.map((item, index) => {
            const { dayTemperature, nightTemperature, dayPhrase, nightPhrase, epochDate } = item;

            if (
              typeof dayTemperature !== "number" ||
              typeof nightTemperature !== "number" ||
              isNaN(dayTemperature) ||
              isNaN(nightTemperature)
            ) {
              return {
                dateTime: "Неизвестная дата",
                dayTemperature: "Неверные данные",
                dayPhase: dayPhrase ?? "Неизвестно",
                nightTemperature: "Неверные данные",
                nightPhase: nightPhrase ?? "Неизвестно",
              };
            }

            const date = new Date(epochDate * 1000).toLocaleDateString();
            const dayC = `${Math.round((dayTemperature - 32) * 5 / 9)}°C`;
            const nightC = `${Math.round((nightTemperature - 32) * 5 / 9)}°C`;

            return {
              dateTime: date,
              dayTemperature: dayC,
              dayPhase: dayPhrase ?? "Неизвестно",
              nightTemperature: nightC,
              nightPhase: nightPhrase ?? "Неизвестно",
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

    loadWeather();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text>Загрузка погоды...</Text>
      </View>
    );
  }

  if (!locationId) {
    return (
      <View style={styles.container}>
        <Text>❌ Location ID не найден. Пожалуйста, выберите местоположение.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {weather.length > 0 ? (
        weather.map((item, index) => (
          <View key={index} style={styles.card}>
            <Text style={styles.date}>{item.dateTime}</Text>
            <Text style={styles.temp}>Дневная температура: {item.dayTemperature}</Text>
            <Text style={styles.phase}>Погода дня: {item.dayPhase}</Text>
            <Text style={styles.temp}>Ночная температура: {item.nightTemperature}</Text>
            <Text style={styles.phase}>Погода ночи: {item.nightPhase}</Text>
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
    alignItems: "flex-start",
  },
  date: {
    fontWeight: "bold",
    marginBottom: 5,
  },
  temp: {
    fontSize: 16,
    marginBottom: 5,
  },
  phase: {
    fontStyle: "italic",
    marginBottom: 5,
  },
});

export default Weather;
