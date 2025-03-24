/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useGetAllPostsQuery } from './src/services/api/api';
import { Provider } from 'react-redux';
import { store } from './src/store';
import Weather from './src/screens/Weather';



function App(): React.JSX.Element {
  return (
    <Provider store={store}>
      <Weather/>
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
