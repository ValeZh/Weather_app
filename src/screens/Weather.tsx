import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from "react-native";
import { getCachedWeather } from "../utils/weatherCache";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LineChart } from "react-native-chart-kit";

type WeatherItem = {
  dateTime: string;
  dayTemperature: string;
  dayPhase: string;
  nightTemperature: string;
  nightPhase: string;
};

type HourlyItem = {
  dateTime: string;
  temperature: string;
  phrase: string;
};

const Weather = () => {
  const [weather, setWeather] = useState<WeatherItem[]>([]);
  const [hourlyWeather, setHourlyWeather] = useState<HourlyItem[]>([]);
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

        if (result?.daily && Array.isArray(result.daily)) {
          const formatted = result.daily.map((item) => {
            const {
              dayTemperature,
              nightTemperature,
              dayPhrase,
              nightPhrase,
              epochDate,
            } = item;

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
        }

        if (result?.hourly && Array.isArray(result.hourly)) {
          const hourlyFormatted = result.hourly.map((item) => {
            const date = new Date(item.epochDateTime * 1000);
            const hourStr = `${date.getHours()}:00`;
            const tempF = item.temperatureValue ?? item.temperature;
            const tempC = `${Math.round((tempF - 32) * 5 / 9)}°C`;

            return {
              dateTime: hourStr,
              temperature: tempC,
              phrase: item.iconPhrase ?? "Нет данных",
            };
          });

          setHourlyWeather(hourlyFormatted);
        }

      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error("❌ Ошибка загрузки погоды:", error.stack);
        } else {
          console.error("❌ Ошибка загрузки погоды:", error);
        }
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
      <Text style={styles.sectionTitle}>🌤 Прогноз на 5 дней</Text>
      {weather.map((item, index) => (
        <View key={index} style={styles.card}>
          <Text style={styles.date}>{item.dateTime}</Text>
          <Text style={styles.temp}>День: {item.dayTemperature} — {item.dayPhase}</Text>
          <Text style={styles.temp}>Ночь: {item.nightTemperature} — {item.nightPhase}</Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>⏰ Прогноз на 12 часов</Text>
      <FlatList
        data={hourlyWeather}
        horizontal
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={styles.hourlyScroll}
        renderItem={({ item }) => (
          <View style={styles.hourCard}>
            <Text style={styles.hourText}>{item.dateTime}</Text>
            <Text style={styles.hourTemp}>{item.temperature}</Text>
            <Text style={styles.hourPhrase}>{item.phrase}</Text>
          </View>
        )}
      />

      {hourlyWeather.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>📈 Температура по часам</Text>
          <LineChart
            data={{
              labels: hourlyWeather.map((item) => item.dateTime),
              datasets: [
                {
                  data: hourlyWeather.map((item) =>
                    parseInt(item.temperature.replace("°C", ""))
                  ),
                },
              ],
            }}
            width={Dimensions.get("window").width - 40}
            height={220}
            yAxisSuffix="°C"
            chartConfig={{
              backgroundColor: "#e3f2fd",
              backgroundGradientFrom: "#e3f2fd",
              backgroundGradientTo: "#bbdefb",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: "4",
                strokeWidth: "2",
                stroke: "#1976d2",
              },
            }}
            bezier
            style={{
              marginVertical: 16,
              borderRadius: 16,
            }}
          />
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f2f2f2",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  card: {
    marginBottom: 10,
    padding: 15,
    borderWidth: 1,
    borderRadius: 10,
    width: "100%",
    backgroundColor: "#fff",
  },
  date: {
    fontWeight: "bold",
    marginBottom: 5,
  },
  temp: {
    fontSize: 16,
    marginBottom: 5,
  },
  hourlyScroll: {
    paddingVertical: 10,
  },
  hourCard: {
    backgroundColor: "#fff",
    padding: 10,
    marginRight: 10,
    borderRadius: 8,
    alignItems: "center",
    width: 100,
    borderWidth: 1,
  },
  hourText: {
    fontWeight: "bold",
  },
  hourTemp: {
    fontSize: 16,
    marginVertical: 5,
  },
  hourPhrase: {
    fontStyle: "italic",
    textAlign: "center",
  },
});

export default Weather;
