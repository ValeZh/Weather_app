import SQLite from "react-native-sqlite-storage";

const db = SQLite.openDatabase(
  { name: 'weather.db', location: 'default' },
  () => console.log("📦 Database opened"),
  (error) => console.error("❌ Database error: ", error)
);

// Створення таблиць
export const createTables = () => {
  db.transaction((tx) => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS weather (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        location_id TEXT,
        fetchTime INTEGER,
        epochDate INTEGER,  -- Нове поле для збереження Epoch дати
        dayTemperature REAL,
        nightTemperature REAL,
        dayPhrase TEXT,
        nightPhrase TEXT
      )`,
      [],
      () => console.log("✅ Weather table created!"),
      (error) => console.error("❌ Error creating weather table:", error)
    );

    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS last_fetch_time (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        locationId TEXT,
        lastFetchTime INTEGER
      )`,
      [],
      () => console.log("✅ Last fetch time table created!"),
      (error) => console.error("❌ Error creating last fetch time table:", error)
    );
  });
};

// Збереження даних про погоду для 5 днів
export const saveWeatherData = (locationId: string, forecasts: any[]) => {
  const fetchTime = Date.now();

  db.transaction((tx) => {
    forecasts.forEach((forecast) => {
      const dayTemp = forecast.Temperature.Maximum.Value;
      const nightTemp = forecast.Temperature.Minimum.Value;
      const dayPhrase = forecast.Day.IconPhrase;
      const nightPhrase = forecast.Night.IconPhrase;
      const epochDate = forecast.EpochDate; // Отримуємо EpochDate із прогнозу

      tx.executeSql(
        `INSERT INTO weather (location_id, fetchTime, epochDate, dayTemperature, nightTemperature, dayPhrase, nightPhrase)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [locationId, fetchTime, epochDate, dayTemp, nightTemp, dayPhrase, nightPhrase],
        () => console.log(`✅ Saved forecast for ${locationId}: ${dayTemp}° / ${nightTemp}°`),
        (error) => console.error("❌ Error saving weather data:", error)
      );
    });
  });
};

// Завантаження погоди з бази
export const loadWeatherData = (locationId: string) => {
  return new Promise<any[]>((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `SELECT * FROM weather WHERE location_id = ?`,
        [locationId],
        (_, results) => {
          const rows = results.rows.raw();
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

// Перевірка останнього часу запиту
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

// Оновлення часу останнього запиту
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
      () => console.log("🔄 Last fetch time updated!"),
      (error) => console.error("❌ Error updating last fetch time:", error)
    );
  });
};
