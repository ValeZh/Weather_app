// ✅ Обновлённый db.ts
import SQLite from "react-native-sqlite-storage";

const db = SQLite.openDatabase(
  { name: "weather.db", location: "default" },
  () => console.log("📦 Database opened"),
  (error) => console.error("❌ Database error: ", error)
);

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
        weatherIdNight INTEGER
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
  });
};

export const saveWeatherData = async (locationId: string, weatherItems: any[]) => {
  return new Promise<void>((resolve, reject) => {
    const fetchTime = Date.now();

    db.transaction(
      (tx) => {
        tx.executeSql(
          `DELETE FROM weather WHERE location_id = ?`,
          [locationId],
          () => console.log(`🗑 Старі записи видалено для location_id = ${locationId}`),
          (_, error) => {
            console.error("❌ Помилка при видаленні старих записів:", error);
            return false;
          }
        );

        for (const item of weatherItems) {
          tx.executeSql(
            `INSERT INTO weather (
              location_id, fetchTime, epochDate,
              dayTemperature, nightTemperature,
              dayPhrase, nightPhrase,
              weatherIdDay, weatherIdNight
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
