/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect } from 'react';
import {
  StyleSheet,
} from 'react-native';
import { Provider } from 'react-redux';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { NavigationContainer } from '@react-navigation/native';
import { createTables } from './src/database/db'; // путь к твоему db файлу

function App(): React.JSX.Element {

  useEffect(() => {
    createTables(); // вызываем при запуске
  }, []);

  return (
    <Provider store={store}>
      <NavigationContainer> 
        <AppNavigator />
      </NavigationContainer>
    </Provider>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    backgroundColor: 'red',
    alignItems : 'center',
    justifyContent : 'center',
    flex : 1,
  },
});

export default App;