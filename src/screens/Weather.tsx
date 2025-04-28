import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Dimensions,
  Image,
} from "react-native";
import { getCachedWeather } from "../utils/weatherCache";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LineChart } from "react-native-chart-kit";
import weatherIcons from "../assets/weatherIcons";

type WeatherItem = {
  dateTime: string;
  dayTemperature: string;
  dayPhase: string;
  nightTemperature: string;
  nightPhase: string;
  weatherIconDay: number;
  weatherIconNight: number;
};

type HourlyItem = {
  dateTime: string;
  temperature: string;
  phrase: string;
  weatherIcon: number;
};

const Weather = () => {
  const [weather, setWeather] = useState<WeatherItem[]>([]);
  const [hourlyWeather, setHourlyWeather] = useState<HourlyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationId, setLocationId] = useState<string | null>(null);

  useEffect(() => {
    const loadWeather = async () => {
      setLoading(true);
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
            const date = new Date(item.epochDate * 1000).toLocaleDateString();
            const dayC = `${Math.round((item.dayTemperature - 32) * 5 / 9)}°C`;
            const nightC = `${Math.round((item.nightTemperature - 32) * 5 / 9)}°C`;

            return {
              dateTime: date,
              dayTemperature: dayC,
              dayPhase: item.dayPhrase ?? "Неизвестно",
              nightTemperature: nightC,
              nightPhase: item.nightPhrase ?? "Неизвестно",
              weatherIconDay: item.weatherIdDay,   // сохраняем иконки дня
              weatherIconNight: item.weatherIdNight, // и ночи
            };
          });

          console.log("✅ Отформатированные daily данные:", formatted);
          setWeather(formatted);
        } else {
          console.warn("⚠️ Пустой или неверный daily прогноз");
        }

        if (result?.hourly && Array.isArray(result.hourly)) {
          const offsetMinutes = new Date().getTimezoneOffset();
          const offsetHours = -offsetMinutes / 60;
          
          const hourlyFormatted = result.hourly.map((item) => {
            const date = new Date(item.epochDateTime * 1000);
            date.setHours(date.getHours() + offsetHours);
          
            const hour = date.getHours().toString().padStart(2, "0");
            const hourStr = `${hour}:00`;
            const tempF = item.temperatureValue;
            const tempC = `${Math.round((tempF - 32) * 5 / 9)}°C`;
            return {
              dateTime: hourStr,
              temperature: tempC,
              phrase: item.iconPhrase,
              weatherIcon: item.weatherIcon,
            };
          });
        
          console.log("✅ Отформатированные hourly данные:", hourlyFormatted);
          setHourlyWeather(hourlyFormatted);
        } else {
          console.warn("⚠️ Пустой или неверный hourly прогноз");
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
        <Text>Загрузка...</Text>
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

  const getIconUri = (iconNumber: number) => {
    const formattedNumber = iconNumber < 10 ? `0${iconNumber}` : `${iconNumber}`;
    return `https://developer.accuweather.com/sites/default/files/${formattedNumber}-s.png`;
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
<View style={styles.currentWeatherContainer}>
  <Image
    source={{ uri: getIconUri(hourlyWeather[0]?.weatherIcon ?? 1) }}
    style={styles.currentWeatherIcon}
  />
  <Text style={styles.currentTemp}>
    {hourlyWeather[0]?.temperature ?? "—"}
  </Text>
  <Text style={styles.currentPhrase}>
    {hourlyWeather[0]?.phrase ?? "—"}
  </Text>
</View>

      <Text style={styles.sectionTitle}>⏰ Прогноз на 12 часов</Text>
      <FlatList
        data={hourlyWeather}
        horizontal
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={styles.hourlyScroll}
        renderItem={({ item }) => (
          <View style={styles.hourCard}>
            <Text style={styles.hourText}>{item.dateTime}</Text>
            <Image
              source={{ uri: getIconUri(item.weatherIcon) }}
              style={styles.weatherIconSmall}
            />
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
                    parseInt(item.temperature.replace("°C", "")) || 0
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

      <Text style={styles.sectionTitle}>🌤 Прогноз на 5 дней</Text>
      {weather.map((item, index) => (
        <View key={index} style={styles.card}>
          <Text style={styles.date}>{item.dateTime}</Text>
          <View style={styles.dayNightRow}>
            <View style={styles.dayNightBlock}>
              <Image
                source={{ uri: getIconUri(item.weatherIconDay) }}
                style={styles.weatherIconSmall}
              />
              <Text style={styles.temp}>День: {item.dayTemperature}</Text>
              <Text style={styles.phrase}>{item.dayPhase}</Text>
            </View>
            <View style={styles.dayNightBlock}>
              <Image
                source={{ uri: getIconUri(item.weatherIconNight) }}
                style={styles.weatherIconSmall}
              />
              <Text style={styles.temp}>Ночь: {item.nightTemperature}</Text>
              <Text style={styles.phrase}>{item.nightPhase}</Text>
            </View>
          </View>
        </View>
      ))}
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
    fontSize: 16,
  },
  temp: {
    fontSize: 16,
    marginVertical: 2,
  },
  phrase: {
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
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
  weatherIconSmall: {
    width: 40,
    height: 40,
    marginVertical: 5,
  },
  dayNightRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  dayNightBlock: {
    alignItems: "center",
    flex: 1,
  },

  currentWeatherContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  currentWeatherIcon: {
    width: 120,
    height: 120,
    marginBottom: 10,
  },
  currentTemp: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 5,
  },
  currentPhrase: {
    fontSize: 18,
    fontStyle: "italic",
  },
  
});

export default Weather;
