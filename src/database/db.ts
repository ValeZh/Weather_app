import SQLite from "react-native-sqlite-storage";
import type { HourlyForecast, DailyForecast } from "../services/api/types";

const db = SQLite.openDatabase(
  { name: "weather.db", location: "default" },
  () => console.log("📦 Database opened"),
  (error) => console.error("❌ Database error: ", error)
);

// Create tables
export const createTables = () => {
  db.transaction((tx) => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS weather (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        location_id TEXT,
        fetchTime INTEGER,
        epochDate INTEGER,
        dayTemperature REAL,
        nightTemperature REAL,
        dayPhrase TEXT,
        nightPhrase TEXT,
        weatherIdDay INTEGER,
        weatherIdNight INTEGER,
        hasPrecipitationDay BOOLEAN,
        hasPrecipitationNight BOOLEAN
      )`,
      [],
      () => console.log("✅ Weather table created!"),
      (error) => console.error("❌ Error creating weather table:", error)
    );

    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS last_fetch_time (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        locationId TEXT UNIQUE,
        lastFetchTime INTEGER
      )`,
      [],
      () => console.log("✅ Last fetch time table created!"),
      (error) => console.error("❌ Error creating last fetch time table:", error)
    );

    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS weather_12_hours (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        location_id TEXT NOT NULL,
        fetchTime INTEGER NOT NULL,
        epochDateTime INTEGER NOT NULL,
        weatherIcon INTEGER NOT NULL,
        iconPhrase TEXT NOT NULL,
        hasPrecipitation INTEGER NOT NULL,
        isDaylight INTEGER NOT NULL,
        temperatureValue REAL NOT NULL,
        precipitationProbability INTEGER NOT NULL
      )`,
      [],
      () => console.log("✅ weather_12_hours table created (without dateTime)!"),
      (error) => console.error("❌ Error creating weather_12_hours table:", error)
    );
  });
};

export const saveWeatherData = async (locationId: string, weatherItems: DailyForecast[]) => {
  return new Promise<void>((resolve, reject) => {
    const fetchTime = Date.now();

    db.transaction(
      (tx) => {
        tx.executeSql(
          `DELETE FROM weather WHERE location_id = ?`,
          [locationId],
          () => console.log(`🗑 Old records deleted for location_id = ${locationId}`),
          (_, error) => {
            console.error("❌ Error deleting old weather records:", error);
            return false;
          }
        );

        for (const item of weatherItems) {
          tx.executeSql(
            `INSERT INTO weather (
              location_id, fetchTime, epochDate,
              dayTemperature, nightTemperature,
              dayPhrase, nightPhrase,
              weatherIdDay, weatherIdNight,
              hasPrecipitationDay, hasPrecipitationNight
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              locationId,
              fetchTime,
              item.EpochDate,
              item.Temperature.Maximum.Value,
              item.Temperature.Minimum.Value,
              item.Day.IconPhrase,
              item.Night.IconPhrase,
              item.Day.Icon,
              item.Night.Icon,
              item.Day.HasPrecipitation ? 1 : 0,
              item.Night.HasPrecipitation ? 1 : 0
            ],
            () => console.log("✅ Forecast added:", item.Date),
            (_, error) => {
              console.error("❌ Error inserting forecast:", error);
              return false;
            }
          );
        }
      },
      (error) => {
        console.error("❌ Weather transaction error:", error);
        reject(error);
      },
      () => {
        console.log("✅ All forecasts saved.");
        logWeatherTable();
        resolve();
      }
    );
  });
};

export const saveHourlyWeatherData = async (locationId: string, hourlyData: HourlyForecast[]) => {
  return new Promise<void>((resolve, reject) => {
    const fetchTime = Date.now();

    db.transaction(
      (tx) => {
        tx.executeSql(
          `DELETE FROM weather_12_hours WHERE location_id = ?`,
          [locationId],
          () => console.log(`🗑 Old 12-hour records deleted for location_id = ${locationId}`),
          (_, error) => {
            console.error("❌ Error deleting 12-hour records:", error);
            return false;
          }
        );

        for (const item of hourlyData) {
          tx.executeSql(
            `INSERT INTO weather_12_hours (
              location_id, fetchTime, epochDateTime, weatherIcon, iconPhrase,
              hasPrecipitation, isDaylight, temperatureValue, precipitationProbability
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              locationId,
              fetchTime,
              item.EpochDateTime,
              item.WeatherIcon,
              item.IconPhrase,
              item.HasPrecipitation,
              item.IsDaylight,
              item.Temperature.Value,
              item.PrecipitationProbability
            ],
            () => console.log("✅ Hourly forecast added:", item.EpochDateTime),
            (_, error) => {
              console.error("❌ Error inserting hourly forecast:", error);
              return false;
            }
          );
        }
      },
      (error) => {
        console.error("❌ Hourly forecast transaction error:", error);
        reject(error);
      },
      () => {
        console.log("✅ All 12-hour forecasts saved.");
        logWeather12HoursTable();
        resolve();
      }
    );
  });
};

export const loadWeatherData = (locationId: string) => {
  return new Promise<any[]>((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `SELECT * FROM weather WHERE location_id = ?`,
        [locationId],
        (_, results) => {
          const rows = results.rows.raw();
          console.log("📤 Weather data loaded from SQLite:", rows);
          resolve(rows);
        },
        (error) => {
          console.error("❌ Error loading weather data:", error);
          reject(error);
        }
      );
    });
  });
};

export const loadHourlyWeatherData = (locationId: string) => {
  return new Promise<any[]>((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `SELECT * FROM weather_12_hours WHERE location_id = ?`,
        [locationId],
        (_, results) => {
          const rows = results.rows.raw();
          console.log("📤 12-hour weather data loaded from SQLite:", rows);
          resolve(rows);
        },
        (error) => {
          console.error("❌ Error loading 12-hour forecast:", error);
          reject(error);
        }
      );
    });
  });
};

export const checkLastFetchTime = (locationId: string) => {
  return new Promise<number>((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `SELECT lastFetchTime FROM last_fetch_time WHERE locationId = ?`,
        [locationId],
        (_, results) => {
          const rows = results.rows.raw();
          resolve(rows.length > 0 ? rows[0].lastFetchTime : 0);
        },
        (error) => {
          console.error("❌ Error checking last fetch time:", error);
          reject(error);
        }
      );
    });
  });
};

export const updateLastFetchTime = (locationId: string) => {
  const time = Date.now();
  db.transaction((tx) => {
    tx.executeSql(
      `INSERT OR REPLACE INTO last_fetch_time (id, locationId, lastFetchTime)
       VALUES (
         (SELECT id FROM last_fetch_time WHERE locationId = ?),
         ?, ?
       )`,
      [locationId, locationId, time],
      () => {
        console.log("🔄 Last fetch time updated!");
        logLastFetchTable();
      },
      (error) => console.error("❌ Error updating last fetch time:", error)
    );
  });
};

const logWeatherTable = () => {
  db.transaction((tx) => {
    tx.executeSql(
      `SELECT * FROM weather`,
      [],
      (_, results) => {
        const rows = results.rows.raw();
        console.log("📋 Weather table content:", rows);
      },
      (error) => {
        console.error("❌ Error logging weather table:", error);
      }
    );
  });
};

const logWeather12HoursTable = () => {
  db.transaction((tx) => {
    tx.executeSql(
      `SELECT * FROM weather_12_hours`,
      [],
      (_, results) => {
        const rows = results.rows.raw();
        console.log("📋 weather_12_hours table content:", rows);
      },
      (error) => {
        console.error("❌ Error logging weather_12_hours table:", error);
      }
    );
  });
};

const logLastFetchTable = () => {
  db.transaction((tx) => {
    tx.executeSql(
      `SELECT * FROM last_fetch_time`,
      [],
      (_, results) => {
        const rows = results.rows.raw();
        console.log("📋 last_fetch_time table content:", rows);
      },
      (error) => {
        console.error("❌ Error logging last_fetch_time table:", error);
      }
    );
  });
};

export const clearAllWeatherDataForLocation = (locationId: string) => {
  if (!locationId) {
    console.warn("⚠️ Attempted to clear data for empty locationId.");
    return;
  }

  db.transaction(
    (tx) => {
      tx.executeSql(
        `DELETE FROM weather WHERE location_id = ?`,
        [locationId],
        () => console.log(`🧹 Cleared weather for location_id = ${locationId}`),
        (_, error) => {
          console.error("❌ Error clearing weather table:", error);
          return false;
        }
      );

      tx.executeSql(
        `DELETE FROM weather_12_hours WHERE location_id = ?`,
        [locationId],
        () => console.log(`🧹 Cleared weather_12_hours for location_id = ${locationId}`),
        (_, error) => {
          console.error("❌ Error clearing weather_12_hours table:", error);
          return false;
        }
      );

      tx.executeSql(
        `DELETE FROM last_fetch_time WHERE locationId = ?`,
        [locationId],
        () => console.log(`🧹 Cleared last_fetch_time for location_id = ${locationId}`),
        (_, error) => {
          console.error("❌ Error clearing last_fetch_time table:", error);
          return false;
        }
      );
    },
    (error) => {
      console.error("❌ Transaction error during full data clear:", error);
    },
    () => {
      console.log("✅ All weather-related tables cleared for locationId:", locationId);
    }
  );
};