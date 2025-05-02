import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f2f2f2",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  card: {
    marginBottom: 10,
    padding: 15,
    borderWidth: 1,
    borderRadius: 10,
    width: "100%",
    backgroundColor: "#fff",
  },
  date: {
    fontWeight: "bold",
    marginBottom: 5,
    fontSize: 16,
  },
  temp: {
    fontSize: 16,
    marginVertical: 2,
  },
  phrase: {
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
  },
  hourlyScroll: {
    paddingVertical: 10,
  },
  hourCard: {
    backgroundColor: "#fff",
    padding: 10,
    marginRight: 10,
    borderRadius: 8,
    alignItems: "center",
    width: 100,
    borderWidth: 1,
  },
  hourText: {
    fontWeight: "bold",
  },
  hourTemp: {
    fontSize: 16,
    marginVertical: 5,
  },
  hourPhrase: {
    fontStyle: "italic",
    textAlign: "center",
  },
  weatherIconSmall: {
    width: 40,
    height: 40,
    marginVertical: 5,
  },
  dayNightRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  dayNightBlock: {
    alignItems: "center",
    flex: 1,
  },
  currentWeatherContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  currentWeatherIcon: {
    width: 120,
    height: 120,
    marginBottom: 10,
  },
  currentTemp: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 5,
  },
  currentPhrase: {
    fontSize: 18,
    fontStyle: "italic",
  },
});

export default styles;