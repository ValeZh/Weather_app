import React, { useState, useEffect } from "react";
import { View, Text, Button, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { 
  useGetRegionsQuery, 
  useGetCountriesQuery, 
  useGetCitiesQuery, 
  useSearchLocationIdQuery 
} from "../services/api/locationApi";

const LocationSelector = () => {
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [locationId, setLocationId] = useState<string>("");

  console.log("Rendering LocationSelector component");

  const { data: regions = [] } = useGetRegionsQuery();
  console.log("Fetched regions:", regions);

  const { data: countries = [] } = useGetCountriesQuery(selectedRegion, { skip: !selectedRegion });
  console.log("Fetched countries for region", selectedRegion, ":", countries);

  const { data: cities = [] } = useGetCitiesQuery(selectedCountry, { skip: !selectedCountry });
  console.log("Fetched cities for country", selectedCountry, ":", cities);

  const locationQuery = selectedRegion && selectedCountry && selectedCity ? `${selectedRegion},${selectedCountry},${selectedCity}` : "";
  console.log("Location query:", locationQuery);

  const { data: locationData } = useSearchLocationIdQuery({
    countryCode: selectedCountry,
    cityName: selectedCity,
  });
  console.log("Fetched location ID for city", selectedCity, ":", locationData);

  useEffect(() => {
    if (locationData && locationData.length > 0) {
      console.log("Saving location ID to AsyncStorage:", locationData[0].Key);
      setLocationId(locationData[0].Key);
      AsyncStorage.setItem("locationId", locationData[0].Key)
        .then(() => Alert.alert("Success", "Location ID saved successfully!"))
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
          console.log("Selected region:", value);
          setSelectedRegion(value);
          setSelectedCountry("");
          setSelectedCity("");
        }}>
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
              console.log("Selected country:", value);
              setSelectedCountry(value);
              setSelectedCity("");
            }}>
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
            onValueChange={(value: string) => {
              console.log("Selected city:", value);
              setSelectedCity(value);
            }}>
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
