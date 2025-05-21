import React, { useState, useEffect } from "react";
import { View, Text, Button, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import styles from "../styles/LocationSelectorsStyles";

// Custom API hooks for fetching region/country/city/location data
import {
  useGetRegionsQuery,
  useGetCountriesQuery,
  useGetCitiesQuery,
  useSearchLocationIdQuery,
} from "../services/api/locationApi";

const LocationSelector = () => {
  // Hook for navigation to other screens
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Local UI state
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [locationId, setLocationId] = useState<string>("");
  const [cooldown, setCooldown] = useState(false);        // Prevents rapid repeated API requests
  const [canContinue, setCanContinue] = useState(false);  // Controls visibility of "Continue" button
  const [queryParams, setQueryParams] = useState<{ countryCode: string; cityName: string } | null>(null);

  // API queries to fetch dropdown data
  const { data: regions = [] } = useGetRegionsQuery(); // All regions
  const { data: countries = [] } = useGetCountriesQuery(selectedRegion, { skip: !selectedRegion }); // Countries in selected region
  const { data: cities = [] } = useGetCitiesQuery(selectedCountry, { skip: !selectedCountry }); // Cities in selected country
  const { data: locationData } = useSearchLocationIdQuery(queryParams!, { skip: !queryParams }); // Location ID for selected country+city

  // When location data is received from the API, save it locally
  useEffect(() => {
    if (locationData && locationData.length > 0) {
      const id = locationData[0].Key;
      setLocationId(id);
      setCanContinue(true); // Enable continue button

      // Store location ID in persistent storage
      AsyncStorage.setItem("locationId", id).catch((err) => {
        console.error("Error saving location ID:", err);
        Alert.alert("Error", "Failed to save location ID");
      });
    }
  }, [locationData]);

  // Called when user taps "Get Location ID"
  const handleGetLocationId = () => {
    if (!selectedCountry || !selectedCity) {
      Alert.alert("Error", "Please select both country and city");
      return;
    }

    setQueryParams({ countryCode: selectedCountry, cityName: selectedCity });
    setCooldown(true);
    setCanContinue(false);

    // Disable button for 10 seconds to prevent spamming
    setTimeout(() => setCooldown(false), 10000);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Region:</Text>
      <Picker
        selectedValue={selectedRegion}
        onValueChange={(value: string) => {
          // Reset values when a region changes
          setSelectedRegion(value);
          setSelectedCountry("");
          setSelectedCity("");
          setLocationId("");
          setCanContinue(false);
        }}
        style={styles.picker}
      >
        <Picker.Item label="Select a region" value="" />
        {regions.map((region) => (
          <Picker.Item key={region.ID} label={region.LocalizedName} value={region.ID} />
        ))}
      </Picker>

      {selectedRegion && (
        <>
          <Text style={styles.label}>Country:</Text>
          <Picker
            selectedValue={selectedCountry}
            onValueChange={(value: string) => {
              // Reset city when country changes
              setSelectedCountry(value);
              setSelectedCity("");
              setLocationId("");
              setCanContinue(false);
            }}
            style={styles.picker}
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
          <Text style={styles.label}>City:</Text>
          <Picker
            selectedValue={selectedCity}
            onValueChange={(value: string) => {
              setSelectedCity(value);
              setLocationId("");
              setCanContinue(false);
            }}
            style={styles.picker}
          >
            <Picker.Item label="Select a city" value="" />
            {cities.map((city) => (
              <Picker.Item key={city.ID} label={city.LocalizedName} value={city.EnglishName} />
            ))}
          </Picker>
        </>
      )}

      {/* Button to get Location ID */}
      <View style={styles.buttonContainer}>
        <Button
          title={cooldown ? "Please wait..." : "Get Location ID"}
          onPress={handleGetLocationId}
          disabled={cooldown || !selectedCountry || !selectedCity}
        />
      </View>

      {/* "Continue" button appears only when ID is available */}
      {canContinue && (
        <View style={styles.buttonContainer}>
          <Button
            title="Continue"
            onPress={() =>
              navigation.reset({
                index: 0,
                routes: [{ name: "Weather", params: { locationId } }],
              })
            }
          />
        </View>
      )}

      {/* Display location ID if available */}
      {locationId ? (
        <Text style={styles.locationIdText}>🌍 Location ID: {locationId}</Text>
      ) : null}
    </View>
  );
};

export default LocationSelector;
