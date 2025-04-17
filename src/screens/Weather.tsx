import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { getCachedWeather } from "../utils/weatherCache";
import AsyncStorage from "@react-native-async-storage/async-storage";

type WeatherItem = {
  dateTime: string;
  dayTemperature: string;
  dayPhrase: string;
  nightTemperature: string;
  nightPhrase: string;
};

const Weather = () => {
  const [weather, setWeather] = useState<WeatherItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationId, setLocationId] = useState<string | null>(null);

  useEffect(() => {
    const loadWeather = async () => {
      setLoading(true);
      try {
        const savedId = await AsyncStorage.getItem("locationId");
        if (!savedId) {
          console.warn("⚠️ Location ID отсутствует.");
          return;
        }
        setLocationId(savedId);
        console.log("📍 Загружен locationId из памяти:", savedId);

        const result = await getCachedWeather();
        if (!result) {
          console.warn("⚠️ Не удалось получить прогноз");
          setWeather([]);
          return;
        }

        const formatted = result.map(item => {
          const {
            epochDate,
            dayTemperature,
            nightTemperature,
            dayPhrase,
            nightPhrase
          } = item;

          const date = new Date(epochDate * 1000)
            .toLocaleDateString("uk-UA");

          return {
            dateTime: date,
            dayTemperature: `${Math.round((dayTemperature - 32) * 5 / 9)}°C`,
            dayPhrase: dayPhrase ?? "Неизвестно",
            nightTemperature: `${Math.round((nightTemperature - 32) * 5 / 9)}°C`,
            nightPhrase: nightPhrase ?? "Неизвестно",
          };
        });

        setWeather(formatted);
      } catch (e) {
        console.error("❌ Ошибка загрузки погоды:", e);
      } finally {
        setLoading(false);
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
        weather.map(item => (
          <View key={item.dateTime} style={styles.card}>
            <Text style={styles.date}>{item.dateTime}</Text>
            <Text style={styles.temp}>Дневная температура: {item.dayTemperature}</Text>
            <Text style={styles.phase}>Погода дня: {item.dayPhrase}</Text>
            <Text style={styles.temp}>Ночная температура: {item.nightTemperature}</Text>
            <Text style={styles.phase}>Погода ночи: {item.nightPhrase}</Text>
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
