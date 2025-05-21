import React, { useEffect, useState } from "react";
import {
  View,
  Text,
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
import styles, { fadeInAnimation, chartConfig, chartStyle } from "../styles/WeatherStyles";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { clearAllWeatherDataForLocation } from "../database/db";

// Type definitions for daily and hourly weather items
type DayItem = {
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
  // Local component state
  const [daysWeather, setDayWeather] = useState<DayItem[]>([]);
  const [hourlyWeather, setHourlyWeather] = useState<HourlyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationId, setLocationId] = useState<string | null>(null);
  const fadeAnim = useState(new Animated.Value(0))[0]; // For fade-in animation
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Load weather data when component mounts
  useEffect(() => {
    const loadWeather = async () => {
      setLoading(true);
      console.log("⏳ Weather loading started");

      try {
        // Retrieve locationId from AsyncStorage
        const savedId = await AsyncStorage.getItem("locationId");
        console.log("📍 Loaded locationId from storage:", savedId);
        setLocationId(savedId);

        if (!savedId) {
          console.warn("⚠️ Location ID is missing. Weather won't be loaded.");
          return;
        }

        // Fetch data from local cache (or API fallback)
        const result = await getCachedWeather();
        console.log("📦 Fetched data from cache or DB:", result);

        // Format daily data
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

          setDayWeather(formatted);
        }

        // Format hourly data
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

          setHourlyWeather(hourlyFormatted);
        }
      } catch (error: unknown) {
        // Handle unexpected errors
        if (error instanceof Error) {
          console.error("❌ Weather loading error:", error.stack);
        } else {
          console.error("❌ Weather loading error:", error);
        }
      } finally {
        setLoading(false);
        console.log("✅ Weather loading finished");

        // Start fade-in animation
        fadeInAnimation(fadeAnim).start();
      }
    };

    loadWeather();
  }, []);

  // Clear location and weather data, then navigate to LocationSelector
  const handleChangeLocation = async () => {
    try {
      const currentId = await AsyncStorage.getItem("locationId");

      if (!currentId) {
        console.warn("⚠️ No locationId found in AsyncStorage. Nothing to clear.");
      } else {
        console.log("🔍 Found locationId:", currentId);

        await clearAllWeatherDataForLocation(currentId);
        console.log("🧹 Cleared all weather data for locationId:", currentId);

        await AsyncStorage.removeItem("locationId");
        console.log("🗑 Removed locationId from AsyncStorage");
      }

      const afterClearId = await AsyncStorage.getItem("locationId");
      console.log("📦 locationId after clearing:", afterClearId);

      navigation.reset({
        index: 0,
        routes: [{ name: "LocationSelector" }],
      });
    } catch (error) {
      console.error("❌ Failed to change location:", error);
    }
  };

  // Loading spinner while weather data is loading
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text>Loading...</Text>
      </View>
    );
  }

  // Show message if location is not selected
  if (!locationId) {
    return (
      <View style={styles.container}>
        <Text>❌ Location ID not found. Please select a location.</Text>
      </View>
    );
  }

  // Get correct icon image from weather icon number
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
        {/* Current Weather Section */}
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

        {/* Hourly Forecast Cards */}
        <Text style={styles.sectionTitle}>12-Hour Forecast</Text>
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

        {/* Temperature Line Chart */}
        {hourlyWeather.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Hourly Temperature</Text>
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
              chartConfig={chartConfig}
              bezier
              style={chartStyle}
            />
          </>
        )}

        {/* Daily Forecast */}
        <Text style={styles.sectionTitle}>5-Day Forecast</Text>
        {daysWeather.map((item, index) => (
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

        {/* Change location button */}
        <View style={{ marginTop: 24, marginBottom: 40 }}>
          <Button title="Change Location" onPress={handleChangeLocation} />
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

export default Weather;
