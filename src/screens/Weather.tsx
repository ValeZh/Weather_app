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
import weatherIcons from "../assets/weatherIcons"; // 👈 импорт локальных иконок
import styles from "../styles/WeatherStyles";
import { Animated } from 'react-native';

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
  const fadeAnim = useState(new Animated.Value(0))[0]; // 👈 Состояние анимации прозрачности

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
              weatherIconDay: item.weatherIdDay,
              weatherIconNight: item.weatherIdNight,
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
        // Запуск анимации появления контента
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start();
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

  const getIconSource = (iconNumber: number) => {
    const formattedNumber = iconNumber < 10 ? `0${iconNumber}` : `${iconNumber}`;
    return weatherIcons[formattedNumber] || weatherIcons["01"]; // если нет картинки, использовать "01"
  };

  return (
    <Animated.ScrollView
      contentContainerStyle={styles.container}
      style={{ opacity: fadeAnim }} // 👈 Применяем анимацию прозрачности
    >
      <View style={styles.currentWeatherContainer}>
        <Image
          source={getIconSource(hourlyWeather[0]?.weatherIcon ?? 1)}
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
          <Animated.View
            style={[styles.hourCard, { opacity: fadeAnim }]} // 👈 Анимация для каждой карточки
          >
            <Text style={styles.hourText}>{item.dateTime}</Text>
            <Image
              source={getIconSource(item.weatherIcon)}
              style={styles.weatherIconSmall}
            />
            <Text style={styles.hourTemp}>{item.temperature}</Text>
            <Text style={styles.hourPhrase}>{item.phrase}</Text>
          </Animated.View>
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
            height={290}
            yAxisSuffix="°C"
            verticalLabelRotation={60}
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
        <Animated.View
          key={index}
          style={[styles.card, { opacity: fadeAnim }]} // 👈 Анимация для карточек прогноза
        >
          <Text style={styles.date}>{item.dateTime}</Text>
          <View style={styles.dayNightRow}>
            <View style={styles.dayNightBlock}>
              <Image
                source={getIconSource(item.weatherIconDay)}
                style={styles.weatherIconSmall}
              />
              <Text style={styles.temp}>День: {item.dayTemperature}</Text>
              <Text style={styles.phrase}>{item.dayPhase}</Text>
            </View>
            <View style={styles.dayNightBlock}>
              <Image
                source={getIconSource(item.weatherIconNight)}
                style={styles.weatherIconSmall}
              />
              <Text style={styles.temp}>Ночь: {item.nightTemperature}</Text>
              <Text style={styles.phrase}>{item.nightPhase}</Text>
            </View>
          </View>
        </Animated.View>
      ))}
    </Animated.ScrollView>
  );
};

export default Weather;