import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { getCachedWeather } from "../utils/weatherCache";

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
            const dayPhase = item.dayPhrase ?? "Неизвестно";  // Исправлено
            const nightPhase = item.nightPhrase ?? "Неизвестно";  // Исправлено
            const epochDate = item.epochDate;  // Добавлено поле epochDate

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
                dayTemperature: "Неверные данные",
                dayPhase,
                nightTemperature: "Неверные данные",
                nightPhase,
              };
            }

            // Если epochDate хранится в секундах, умножаем на 1000
            const formattedEpochDate = epochDate * 1000;
            const formattedDate = new Date(formattedEpochDate).toLocaleDateString();

            // Преобразуем Фаренгейты в Цельсии
            const dayTempCelsius = ((dayTemp - 32) * 5) / 9;
            const nightTempCelsius = ((nightTemp - 32) * 5) / 9;

            return {
              dateTime: formattedDate,
              dayTemperature: `${Math.round(dayTempCelsius)}°C`,  // Применен правильный перевод
              dayPhase,
              nightTemperature: `${Math.round(nightTempCelsius)}°C`,  // Применен правильный перевод
              nightPhase,
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
    alignItems: "flex-start", // Выравнивание текста по левому краю
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
