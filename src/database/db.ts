import SQLite from "react-native-sqlite-storage";
import type { HourlyForecast } from "../services/api/types";

const db = SQLite.openDatabase(
  { name: "weather.db", location: "default" },
  () => console.log("📦 Database opened"),
  (error) => console.error("❌ Database error: ", error)
);

// Создание таблиц
export const createTables = () => {
  db.transaction((tx) => {
    // Таблица для прогноза погоды
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
        HasPrecipitationDay BOOLEAN,
        HasPrecipitationNight BOOLEAN
      )`,
      [],
      () => console.log("✅ Weather table created!"),
      (error) => console.error("❌ Error creating weather table:", error)
    );

    // Таблица для времени последнего запроса
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

    // Обновленная структура таблицы для 12-часового прогноза
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS weather_12_hours (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        location_id TEXT NOT NULL,
        fetchTime INTEGER NOT NULL,
        dateTime TEXT NOT NULL,
        epochDateTime INTEGER NOT NULL,
        weatherIcon INTEGER NOT NULL,
        iconPhrase TEXT NOT NULL,
        hasPrecipitation INTEGER NOT NULL,
        isDaylight INTEGER NOT NULL,
        temperatureValue REAL NOT NULL,
        precipitationProbability INTEGER NOT NULL
      )`,
      [],
      () => console.log("✅ Таблица weather_12_hours создана!"),
      (error) => console.error("❌ Ошибка при создании weather_12_hours:", error)
    );
  });
};

// Сохранение данных о погоде
export const saveWeatherData = async (locationId: string, weatherItems: any[]) => {
  return new Promise<void>((resolve, reject) => {
    const fetchTime = Date.now();

    db.transaction(
      (tx) => {
        // Удаление старых записей
        tx.executeSql(
          `DELETE FROM weather WHERE location_id = ?`,
          [locationId],
          () => console.log(`🗑 Старі записи видалено для location_id = ${locationId}`),
          (_, error) => {
            console.error("❌ Помилка при видаленні старих записів:", error);
            return false;
          }
        );

        // Добавление новых данных
        for (const item of weatherItems) {
          tx.executeSql(
            `INSERT INTO weather (
              location_id, fetchTime, epochDate,
              dayTemperature, nightTemperature,
              dayPhrase, nightPhrase,
              weatherIdDay, weatherIdNight,
              HasPrecipitationDay, HasPrecipitationNight
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              locationId,
              fetchTime,
              item.epochDate,
              item.dayTemperature,
              item.nightTemperature,
              item.dayPhrase,
              item.nightPhrase,
              item.weatherIdDay,
              item.weatherIdNight,
              item.HasPrecipitationDay,
              item.HasPrecipitationNight
            ],
            () => console.log("✅ Додано прогноз:", item),
            (_, error) => {
              console.error("❌ Помилка при додаванні прогнозу:", error);
              return false;
            }
          );
        }
      },
      (error) => {
        console.error("❌ Помилка транзакції збереження:", error);
        reject(error);
      },
      () => {
        console.log("✅ Усі прогнози збережені.");
        logWeatherTable();
        resolve();
      }
    );
  });
};

// Сохранение данных о 12-часовом прогнозе
export const saveHourlyWeatherData = async (locationId: string, hourlyData: HourlyForecast[]) => {
  return new Promise<void>((resolve, reject) => {
    const fetchTime = Date.now();

    db.transaction(
      (tx) => {
        // Удаление старых записей
        tx.executeSql(
          `DELETE FROM weather_12_hours WHERE location_id = ?`,
          [locationId],
          () => console.log(`🗑 Старі записи (12 год) видалено для location_id = ${locationId}`),
          (_, error) => {
            console.error("❌ Ошибка при удалении данных 12-часового прогноза:", error);
            return false;
          }
        );

        // Добавление новых данных
        for (const item of hourlyData) {
          tx.executeSql(
            `INSERT INTO weather_12_hours (
              location_id, fetchTime, dateTime, epochDateTime, weatherIcon, iconPhrase,
              hasPrecipitation, isDaylight, temperatureValue, precipitationProbability
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              locationId,
              fetchTime,
              item.DateTime,
              item.EpochDateTime,
              item.WeatherIcon,
              item.IconPhrase,
              item.HasPrecipitation ? 1 : 0, // Преобразуем boolean в 1 или 0
              item.IsDaylight ? 1 : 0, // Преобразуем boolean в 1 или 0
              item.Temperature.Value,
              item.PrecipitationProbability
            ],
            () => console.log("✅ Додано погодинний прогноз:", item.DateTime),
            (_, error) => {
              console.error("❌ Помилка при додаванні погодинного прогнозу:", error);
              return false;
            }
          );
        }
      },
      (error) => {
        console.error("❌ Помилка транзакції погодинного збереження:", error);
        reject(error);
      },
      () => {
        console.log("✅ Усі 12-годинні прогнози збережені.");
        logWeather12HoursTable();
        resolve();
      }
    );
  });
};

// Загрузка данных о погоде
export const loadWeatherData = (locationId: string) => {
  return new Promise<any[]>((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `SELECT * FROM weather WHERE location_id = ?`,
        [locationId],
        (_, results) => {
          const rows = results.rows.raw();
          console.log("📤 Дані з SQLite:", rows);
          resolve(rows);
        },
        (error) => {
          console.error("❌ Помилка при завантаженні погоди:", error);
          reject(error);
        }
      );
    });
  });
};

// Загрузка данных о 12-часовом прогнозе
export const loadHourlyWeatherData = (locationId: string) => {
  return new Promise<any[]>((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `SELECT * FROM weather_12_hours WHERE location_id = ?`,
        [locationId],
        (_, results) => {
          const rows = results.rows.raw();
          console.log("📤 Дані з weather_12_hours:", rows);
          resolve(rows);
        },
        (error) => {
          console.error("❌ Помилка при завантаженні 12-годинного прогнозу:", error);
          reject(error);
        }
      );
    });
  });
};

// Проверка времени последнего запроса
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
          console.error("❌ Помилка перевірки часу останнього запиту:", error);
          reject(error);
        }
      );
    });
  });
};

// Обновление времени последнего запроса
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
      (error) => console.error("❌ Помилка оновлення часу останнього запиту:", error)
    );
  });
};

// Логирование таблицы weather
const logWeatherTable = () => {
  db.transaction((tx) => {
    tx.executeSql(
      `SELECT * FROM weather`,
      [],
      (_, results) => {
        const rows = results.rows.raw();
        console.log("📋 Содержимое таблицы weather:", rows);
      },
      (error) => {
        console.error("❌ Ошибка при логировании таблицы weather:", error);
      }
    );
  });
};

// Логирование таблицы weather_12_hours
const logWeather12HoursTable = () => {
  db.transaction((tx) => {
    tx.executeSql(
      `SELECT * FROM weather_12_hours`,
      [],
      (_, results) => {
        const rows = results.rows.raw();
        console.log("📋 Содержимое таблицы weather_12_hours:", rows);
      },
      (error) => {
        console.error("❌ Ошибка при логировании таблицы weather_12_hours:", error);
      }
    );
  });
};

// Логирование таблицы last_fetch_time
const logLastFetchTable = () => {
  db.transaction((tx) => {
    tx.executeSql(
      `SELECT * FROM last_fetch_time`,
      [],
      (_, results) => {
        const rows = results.rows.raw();
        console.log("📋 Содержимое таблицы last_fetch_time:", rows);
      },
      (error) => {
        console.error("❌ Ошибка при логировании таблицы last_fetch_time:", error);
      }
    );
  });
};
