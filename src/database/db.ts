import SQLite from "react-native-sqlite-storage";

const db = SQLite.openDatabase(
  { name: 'weather.db', location: 'default' },
  () => { console.log("Database opened"); },
  (error) => { console.error("Database error: ", error); }
);

// Создание таблиц
export const createTables = () => {
  db.transaction((tx) => {
    tx.executeSql(
      'CREATE TABLE IF NOT EXISTS weather (id INTEGER PRIMARY KEY AUTOINCREMENT, locationId TEXT, dateTime TEXT, temperature REAL, iconPhrase TEXT)',
      [],
      () => { console.log("Weather table created!"); },
      (error) => { console.log("Error creating weather table: ", error); }
    );

    tx.executeSql(
      'CREATE TABLE IF NOT EXISTS last_fetch_time (id INTEGER PRIMARY KEY AUTOINCREMENT, locationId TEXT, lastFetchTime INTEGER)',
      [],
      () => { console.log("Last fetch time table created!"); },
      (error) => { console.log("Error creating last fetch time table: ", error); }
    );
  });
};

// Проверка времени последнего запроса
export const checkLastFetchTime = (locationId: string) => {
  return new Promise<number>((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT lastFetchTime FROM last_fetch_time WHERE locationId = ?',
        [locationId],
        (tx, results) => {
          const rows = results.rows.raw();
          if (rows.length > 0) {
            resolve(rows[0].lastFetchTime);
          } else {
            resolve(0); // Если данных нет, возвращаем 0
          }
        },
        (error) => { 
          console.log("Error checking last fetch time: ", error); 
          reject(error);
        }
      );
    });
  });
};

// Сохранение данных о погоде
export const saveWeatherData = (locationId: string, data: any) => {
  db.transaction((tx) => {
    data.forEach((forecast: any) => {
      const { DateTime, Temperature, IconPhrase } = forecast;
      const tempValue = Temperature.Value;
      tx.executeSql(
        'INSERT INTO weather (locationId, dateTime, temperature, iconPhrase) VALUES (?, ?, ?, ?)',
        [locationId, DateTime, tempValue, IconPhrase],
        () => { console.log("Weather data saved!"); },
        (error) => { console.log("Error saving data: ", error); }
      );
    });
  });
};

// Загрузка данных из базы данных
export const loadWeatherData = (locationId: string) => {
  return new Promise<any>((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT * FROM weather WHERE locationId = ?',
        [locationId],
        (tx, results) => {
          const rows = results.rows.raw();
          if (rows.length > 0) {
            resolve(rows);
          } else {
            resolve(null); // Если данных нет
          }
        },
        (error) => { 
          console.log("Error loading data: ", error); 
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
      () => console.log("Last fetch time updated!"),
      (error) => console.log("Error updating last fetch time: ", error)
    );
  });
};