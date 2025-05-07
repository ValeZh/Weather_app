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
  Button,
  SafeAreaView,
  Animated,
} from "react-native";
import { getCachedWeather } from "../utils/weatherCache";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LineChart } from "react-native-chart-kit";
import weatherIcons from "../assets/weatherIcons";
import styles from "../styles/WeatherStyles";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";

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
  hourLabel: string; 
  temperature: string;
  phrase: string;
  weatherIcon: number;
};

const Weather = () => {
  const [weather, setWeather] = useState<WeatherItem[]>([]);
  const [hourlyWeather, setHourlyWeather] = useState<HourlyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationId, setLocationId] = useState<string | null>(null);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    const loadWeather = async () => {
      setLoading(true);
      console.log("⏳ Weather loading started");

      try {
        const savedId = await AsyncStorage.getItem("locationId");
        console.log("📍 Loaded locationId from storage:", savedId);
        setLocationId(savedId);

        if (!savedId) {
          console.warn("⚠️ Location ID is missing. Weather won't be loaded.");
          return;
        }

        const result = await getCachedWeather();
        console.log("📦 Fetched data from cache or DB:", result);

        if (result?.daily && Array.isArray(result.daily)) {
          const formatted = result.daily.map((item) => {
            const date = new Date(item.epochDate * 1000).toLocaleDateString();
            const dayC = `${Math.round((item.dayTemperature - 32) * 5 / 9)}°C`;
            const nightC = `${Math.round((item.nightTemperature - 32) * 5 / 9)}°C`;

            return {
              dateTime: date,
              dayTemperature: dayC,
              dayPhase: item.dayPhrase ?? "Unknown",
              nightTemperature: nightC,
              nightPhase: item.nightPhrase ?? "Unknown",
              weatherIconDay: item.weatherIdDay,
              weatherIconNight: item.weatherIdNight,
            };
          });

          console.log("✅ Formatted daily data:", formatted);
          setWeather(formatted);
        }

        if (result?.hourly && Array.isArray(result.hourly)) {
          const hourlyFormatted = result.hourly.map((item) => {
            const date = new Date(item.epochDateTime * 1000);
            const hour = date.getHours().toString().padStart(2, "0") + ":00";
            const tempC = `${Math.round((item.temperatureValue - 32) * 5 / 9)}°C`;

            return {
              hourLabel: hour,
              temperature: tempC,
              phrase: item.iconPhrase,
              weatherIcon: item.weatherIcon,
            };
          });

          console.log("✅ Formatted hourly data:", hourlyFormatted);
          setHourlyWeather(hourlyFormatted);
        }

      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error("❌ Weather loading error:", error.stack);
        } else {
          console.error("❌ Weather loading error:", error);
        }
      } finally {
        setLoading(false);
        console.log("✅ Weather loading finished");
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start();
      }
    };

    loadWeather();
  }, []);

  const handleChangeLocation = async () => {
    await AsyncStorage.removeItem("locationId");
    navigation.reset({
      index: 0,
      routes: [{ name: "LocationSelector" }],
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!locationId) {
    return (
      <View style={styles.container}>
        <Text>❌ Location ID not found. Please select a location.</Text>
      </View>
    );
  }

  const getIconSource = (iconNumber: number) => {
    const formattedNumber = iconNumber < 10 ? `0${iconNumber}` : `${iconNumber}`;
    return weatherIcons[formattedNumber] || weatherIcons["01"];
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.ScrollView
        contentContainerStyle={styles.container}
        style={{ opacity: fadeAnim }}
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

        <Text style={styles.sectionTitle}>⏰ 12-Hour Forecast</Text>
        <FlatList
          data={hourlyWeather}
          horizontal
          keyExtractor={(_, i) => i.toString()}
          contentContainerStyle={styles.hourlyScroll}
          renderItem={({ item }) => (
            <Animated.View style={[styles.hourCard, { opacity: fadeAnim }]}>
              <Text style={styles.hourText}>{item.hourLabel}</Text>
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
            <Text style={styles.sectionTitle}>📈 Hourly Temperature</Text>
            <LineChart
              data={{
                labels: hourlyWeather.map((item) => item.hourLabel),
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
                style: { borderRadius: 16 },
                propsForDots: {
                  r: "4",
                  strokeWidth: "2",
                  stroke: "#1976d2",
                },
              }}
              bezier
              style={{ marginVertical: 16, borderRadius: 16 }}
            />
          </>
        )}

        <Text style={styles.sectionTitle}>🌤 5-Day Forecast</Text>
        {weather.map((item, index) => (
          <Animated.View key={index} style={[styles.card, { opacity: fadeAnim }]}>
            <Text style={styles.date}>{item.dateTime}</Text>
            <View style={styles.dayNightRow}>
              <View style={styles.dayNightBlock}>
                <Image
                  source={getIconSource(item.weatherIconDay)}
                  style={styles.weatherIconSmall}
                />
                <Text style={styles.temp}>Day: {item.dayTemperature}</Text>
                <Text style={styles.phrase}>{item.dayPhase}</Text>
              </View>
              <View style={styles.dayNightBlock}>
                <Image
                  source={getIconSource(item.weatherIconNight)}
                  style={styles.weatherIconSmall}
                />
                <Text style={styles.temp}>Night: {item.nightTemperature}</Text>
                <Text style={styles.phrase}>{item.nightPhase}</Text>
              </View>
            </View>
          </Animated.View>
        ))}

        <View style={{ marginTop: 24, marginBottom: 40 }}>
          <Button title="Change Location" onPress={handleChangeLocation} />
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

export default Weather;
