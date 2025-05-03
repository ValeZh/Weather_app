import React, { useEffect, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

import LocationSelector from "../screens/LocationSelector";
import Weather from "../screens/Weather";

export type RootStackParamList = {
  LocationSelector: undefined;
  Weather: { locationId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);
  const [storedLocationId, setStoredLocationId] = useState<string | null>(null);

  useEffect(() => {
    const checkLocationId = async () => {
      const saved = await AsyncStorage.getItem("locationId");
      if (saved) {
        setStoredLocationId(saved);
        setInitialRoute("Weather");
      } else {
        setInitialRoute("LocationSelector");
      }
    };
    checkLocationId();
  }, []);

  if (!initialRoute) return null; // или лоадер

  return (
    <Stack.Navigator initialRouteName={initialRoute}>
      <Stack.Screen
        name="LocationSelector"
        component={LocationSelector}
        options={{ title: "Выбор локации" }} // хеадер остался
      />
      <Stack.Screen
        name="Weather"
        component={Weather}
        initialParams={{ locationId: storedLocationId! }}
        options={{ headerShown: false }} // хеадер убран
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
