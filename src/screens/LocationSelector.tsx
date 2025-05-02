import React, { useState, useEffect } from "react";
import { View, Text, Button, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import styles from "../styles/LocationSelectorsStyles";
import {
  useGetRegionsQuery,
  useGetCountriesQuery,
  useGetCitiesQuery,
  useSearchLocationIdQuery,
} from "../services/api/locationApi";

const LocationSelector = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [locationId, setLocationId] = useState<string>("");
  const [cooldown, setCooldown] = useState(false);
  const [canContinue, setCanContinue] = useState(false);
  const [queryParams, setQueryParams] = useState<{ countryCode: string; cityName: string } | null>(null);

  const { data: regions = [] } = useGetRegionsQuery();
  const { data: countries = [] } = useGetCountriesQuery(selectedRegion, { skip: !selectedRegion });
  const { data: cities = [] } = useGetCitiesQuery(selectedCountry, { skip: !selectedCountry });
  const { data: locationData } = useSearchLocationIdQuery(queryParams!, { skip: !queryParams });

  useEffect(() => {
    if (locationData && locationData.length > 0) {
      const id = locationData[0].Key;
      setLocationId(id);
      setCanContinue(true);
      AsyncStorage.setItem("locationId", id).catch((err) => {
        console.error("Error saving location ID:", err);
        Alert.alert("Error", "Failed to save location ID");
      });
    }
  }, [locationData]);

  const handleGetLocationId = () => {
    if (!selectedCountry || !selectedCity) {
      Alert.alert("Ошибка", "Выберите страну и город");
      return;
    }

    setQueryParams({ countryCode: selectedCountry, cityName: selectedCity });
    setCooldown(true);
    setCanContinue(false);
    setTimeout(() => setCooldown(false), 10000); // 10 сек
  };

  const handleReset = () => {
    setSelectedRegion("");
    setSelectedCountry("");
    setSelectedCity("");
    setLocationId("");
    setCanContinue(false);
    setQueryParams(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Регион:</Text>
      <Picker
        selectedValue={selectedRegion}
        onValueChange={(value: string) => {
          setSelectedRegion(value);
          setSelectedCountry("");
          setSelectedCity("");
          setLocationId("");
          setCanContinue(false);
        }}
        style={styles.picker}
      >
        <Picker.Item label="Выберите регион" value="" />
        {regions.map((region) => (
          <Picker.Item key={region.ID} label={region.LocalizedName} value={region.ID} />
        ))}
      </Picker>

      {selectedRegion && (
        <>
          <Text style={styles.label}>Страна:</Text>
          <Picker
            selectedValue={selectedCountry}
            onValueChange={(value: string) => {
              setSelectedCountry(value);
              setSelectedCity("");
              setLocationId("");
              setCanContinue(false);
            }}
            style={styles.picker}
          >
            <Picker.Item label="Выберите страну" value="" />
            {countries.map((country) => (
              <Picker.Item key={country.ID} label={country.LocalizedName} value={country.ID} />
            ))}
          </Picker>
        </>
      )}

      {selectedCountry && (
        <>
          <Text style={styles.label}>Город:</Text>
          <Picker
            selectedValue={selectedCity}
            onValueChange={(value: string) => {
              setSelectedCity(value);
              setLocationId("");
              setCanContinue(false);
            }}
            style={styles.picker}
          >
            <Picker.Item label="Выберите город" value="" />
            {cities.map((city) => (
              <Picker.Item key={city.ID} label={city.LocalizedName} value={city.EnglishName} />
            ))}
          </Picker>
        </>
      )}

      <View style={styles.buttonContainer}>
        <Button
          title={cooldown ? "Подождите..." : "Получить Location ID"}
          onPress={handleGetLocationId}
          disabled={cooldown || !selectedCountry || !selectedCity}
        />
      </View>

      {canContinue && (
        <View style={styles.buttonContainer}>
          <Button
            title="Continue"
            onPress={() => navigation.navigate("Weather", { locationId })}
          />
        </View>
      )}

      {locationId ? (
        <Text style={styles.locationIdText}>🌍 Location ID: {locationId}</Text>
      ) : null}
    </View>
  );
};

export default LocationSelector;