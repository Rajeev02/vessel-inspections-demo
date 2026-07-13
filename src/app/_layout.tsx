import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Provider } from "react-redux";
import * as BackgroundTask from "expo-background-task";
import * as TaskManager from "expo-task-manager";
import * as Notifications from "expo-notifications";
import "react-native-reanimated";

import { store } from "@/store";
import { inspectionsActions } from "@/features/inspections/slice";

const LEGACY_BACKGROUND_FETCH_TASK = "BACKGROUND_SYNC_TASK";
const BACKGROUND_SYNC_TASK = "BACKGROUND_PROCESSING_SYNC_TASK";

TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    store.dispatch(inspectionsActions.syncRequested());
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

SplashScreen.preventAutoHideAsync();

async function unregisterLegacyBackgroundFetchTask() {
  try {
    await TaskManager.unregisterTaskAsync(LEGACY_BACKGROUND_FETCH_TASK);
  } catch {
  }
}

export default function RootLayout() {
  const [loaded] = useFonts({});

  useEffect(() => {
    async function setupBackgroundSync() {
      try {
        await unregisterLegacyBackgroundFetchTask();

        const backgroundTaskStatus = await BackgroundTask.getStatusAsync();
        if (
          backgroundTaskStatus !== BackgroundTask.BackgroundTaskStatus.Available
        ) {
          return;
        }

        await BackgroundTask.registerTaskAsync(BACKGROUND_SYNC_TASK, {
          minimumInterval: 15,
        });
        await Notifications.requestPermissionsAsync();
      } catch (error) {
        console.warn("Background sync registration failed", error);
      }
    }
    setupBackgroundSync();
  }, []);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  return (
    <Provider store={store}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ title: "Vessel Inspections" }} />
        <Stack.Screen name="[id]" options={{ title: "Inspection Details" }} />
      </Stack>
    </Provider>
  );
}
