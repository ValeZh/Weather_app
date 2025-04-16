import React, { useState, useEffect } from "react";
import { View, Text, Button, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator"; // путь может отличаться

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

  const { data: regions = [] } = useGetRegionsQuery();
  const { data: countries = [] } = useGetCountriesQuery(selectedRegion, { skip: !selectedRegion });
  const { data: cities = [] } = useGetCitiesQuery(selectedCountry, { skip: !selectedCountry });

  const { data: locationData } = useSearchLocationIdQuery({
    countryCode: selectedCountry,
    cityName: selectedCity,
  });

  useEffect(() => {
    if (locationData && locationData.length > 0) {
      const id = locationData[0].Key;
      setLocationId(id);
      AsyncStorage.setItem("locationId", id)
        .then(() => {
          Alert.alert("Success", "Location ID saved successfully!");
          navigation.navigate("Weather", { locationId: id });
        })
        .catch((err) => {
          console.error("Error saving location ID:", err);
          Alert.alert("Error", "Failed to save location ID");
        });
    }
  }, [locationData]);

  const resetSelection = () => {
    setSelectedRegion("");
    setSelectedCountry("");
    setSelectedCity("");
    setLocationId("");
  };

  return (
    <View>
      <Text>Select Region:</Text>
      <Picker
        selectedValue={selectedRegion}
        onValueChange={(value: string) => {
          setSelectedRegion(value);
          setSelectedCountry("");
          setSelectedCity("");
        }}
      >
        <Picker.Item label="Select a region" value="" />
        {regions.map((region) => (
          <Picker.Item key={region.ID} label={region.LocalizedName} value={region.ID} />
        ))}
      </Picker>

      {selectedRegion && (
        <>
          <Text>Select Country:</Text>
          <Picker
            selectedValue={selectedCountry}
            onValueChange={(value: string) => {
              setSelectedCountry(value);
              setSelectedCity("");
            }}
          >
            <Picker.Item label="Select a country" value="" />
            {countries.map((country) => (
              <Picker.Item key={country.ID} label={country.LocalizedName} value={country.ID} />
            ))}
          </Picker>
        </>
      )}

      {selectedCountry && (
        <>
          <Text>Select City:</Text>
          <Picker
            selectedValue={selectedCity}
            onValueChange={(value: string) => setSelectedCity(value)}
          >
            <Picker.Item label="Select a city" value="" />
            {cities.map((city) => (
              <Picker.Item key={city.ID} label={city.LocalizedName} value={city.EnglishName} />
            ))}
          </Picker>
        </>
      )}

      {locationId && <Text>Location ID: {locationId}</Text>}

      <Button title="Reset Selection" onPress={resetSelection} />
    </View>
  );
};

export default LocationSelector;
