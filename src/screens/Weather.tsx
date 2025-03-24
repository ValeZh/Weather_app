import { FC } from "react";
import { useGetAllPostsQuery } from "../services/api/api";
import { StyleSheet, Text, View } from "react-native";

const Weather: FC = () => {
     const {data, error} = useGetAllPostsQuery("324505");

      console.log("Hi sevefws");
      return <View style={styles.mainContainer}> 
        <Text>{data?.DailyForecasts[0].Temperature.Maximum.Value}</Text>
      </View>
}
 export default Weather;

 const styles = StyleSheet.create({
    mainContainer:{
        flex:1,
    }
 })