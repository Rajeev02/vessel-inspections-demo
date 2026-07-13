import { useState } from "react";
import { Alert, Linking } from "react-native";
import * as Location from "expo-location";

export interface LocationData {
  latitude: number;
  longitude: number;
}

export function useLocation() {
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const fetchLocation = async (): Promise<LocationData | null> => {
    setIsFetchingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location Access Required",
          "You must allow location access to geo-tag your inspection report.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ]
        );
        return null;
      }

      const locationPromise = Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const timeoutPromise = new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), 5000)
      );

      const location = await Promise.race([locationPromise, timeoutPromise]);

      if (location) {
        return {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
      } else {
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown) {
          return {
            latitude: lastKnown.coords.latitude,
            longitude: lastKnown.coords.longitude,
          };
        }
        return null;
      }
    } catch (error) {
      console.warn("Location error:", error);
      return null;
    } finally {
      setIsFetchingLocation(false);
    }
  };

  return { fetchLocation, isFetchingLocation };
}
