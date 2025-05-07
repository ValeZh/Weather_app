import AsyncStorage from "@react-native-async-storage/async-storage";
import { store } from "../store";
import { weatherApi } from "../services/api/weatherApi";
import {
  checkLastFetchTime,
  saveWeatherData,
  saveHourlyWeatherData,
  loadWeatherData,
  loadHourlyWeatherData,
  updateLastFetchTime,
  createTables,
} from "../database/db";

// Time interval: 12 hours in milliseconds
const TWELVE_HOURS = 12 * 60 * 60 * 1000;

export const getCachedWeather = async () => {
  // Get locationId saved in AsyncStorage (set by user earlier)
  const locationId = await AsyncStorage.getItem("locationId");

  if (!locationId) {
    console.error("❌ Error: locationId not found in AsyncStorage.");
    return { daily: [], hourly: [] };
  }

  await createTables(); // Ensure database tables exist

  // Check when weather data was last fetched
  const lastFetch = await checkLastFetchTime(locationId);
  const now = Date.now();

  // Helper function: fetch data from API and store it to local SQLite DB
  const fetchAndStoreToDb = async () => {
    const dailyResult = await store.dispatch(
      weatherApi.endpoints.getFiveDayForecast.initiate(locationId)
    );
    const hourlyResult = await store.dispatch(
      weatherApi.endpoints.getTwelveHourForecast.initiate(locationId)
    );

    if (
      dailyResult && "data" in dailyResult && dailyResult.data &&
      hourlyResult && "data" in hourlyResult && hourlyResult.data
    ) {
      // Save fetched data to local database
      await saveWeatherData(locationId, dailyResult.data.DailyForecasts);
      await saveHourlyWeatherData(locationId, hourlyResult.data);
      await updateLastFetchTime(locationId);
    } else {
      console.error("❌ Error fetching data from API");
    }
  };

  // If first time or data is older than 12 hours, fetch new data
  if (!lastFetch || now - lastFetch >= TWELVE_HOURS) {
    await fetchAndStoreToDb();
  }

  // Load weather data from local database
  const localDaily = await loadWeatherData(locationId);
  const localHourly = await loadHourlyWeatherData(locationId);
  const result = { daily: localDaily, hourly: localHourly };

  // If data exists, return it; otherwise warn
  if ((localDaily?.length ?? 0) > 0 && (localHourly?.length ?? 0) > 0) {
    console.log("💾 Loaded from local DB:", JSON.stringify(result, null, 2));
    return result;
  } else {
    console.warn("⚠️ No weather data found in local DB even after fetch.");
    return { daily: [], hourly: [] };
  }
};
