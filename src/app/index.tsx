import { Link, router } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { useEffect, useCallback, memo } from "react";
import { Pressable, StyleSheet, Text, View, Alert, Linking } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import * as Notifications from "expo-notifications";
import AppLayout from "@/components/AppLayout";

import { Spacing } from "@/constants/theme";
import {
  inspectionsActions,
  selectInspections,
  selectInspectionsStatus,
  selectSyncSummary,
} from "@/features/inspections/slice";
import { Inspection } from "@/features/inspections/types";

const InspectionListItem = memo(({ item }: { item: Inspection }) => {
  type StatusKey =
    "status_Pending" | "status_InProgress" | "status_Completed";
  const statusKey = `status_${item.status.replace(" ", "")}` as StatusKey;

  return (
    <Link href={`/${item.id}`} asChild>
      <Pressable style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.vesselName}>{item.vesselName}</Text>
          <View style={[styles.statusBadge, styles[statusKey]]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.syncRow}>
          <Text style={styles.syncText}>Sync: {item.syncState}</Text>
        </View>
      </Pressable>
    </Link>
  );
});
InspectionListItem.displayName = "InspectionListItem";

export default function HomeScreen() {
  const dispatch = useDispatch();
  const inspections = useSelector(selectInspections);
  const inspectionsStatus = useSelector(selectInspectionsStatus);
  const syncSummary = useSelector(selectSyncSummary);

  useEffect(() => {
    dispatch(inspectionsActions.loadRequested());
    
    (async () => {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        Alert.alert(
          "Notifications Disabled",
          "You won't receive sync completion alerts. Enable notifications in settings to stay updated.",
          [
            { text: "Dismiss", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ]
        );
      }
    })();
  }, [dispatch]);

  const renderItem = useCallback(({ item }: { item: Inspection }) => {
    return <InspectionListItem item={item} />;
  }, []);

  const TypedFlashList = FlashList as any;

  return (
    <AppLayout
      title="Inspections"
      scrollable={false}
      headerBottom={
        <View style={styles.syncStatusContainer}>
          <Text style={styles.syncSummaryText}>
            {syncSummary.isOnline ? "Online" : "Offline"}
            {syncSummary.isSyncing && " • Syncing..."}
          </Text>
          {(syncSummary.pending > 0 || syncSummary.failed > 0) && (
            <Text style={styles.syncSummaryText}>
              Pending: {syncSummary.pending} | Failed: {syncSummary.failed}
            </Text>
          )}
        </View>
      }
    >

      <View style={{ flex: 1, minHeight: 200 }}>
        {/* @ts-ignore FlashList types mismatch with React 19 / Expo */}
        <TypedFlashList
          data={inspections}
          keyExtractor={(item: Inspection) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          estimatedItemSize={100}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {inspectionsStatus.error ??
                  (inspectionsStatus.isLoading
                    ? "Loading inspections..."
                    : "No inspections found.")}
              </Text>
            </View>
          }
        />
      </View>

      <Pressable 
        style={styles.fab} 
        onPress={() => router.push("/new")}
      >
        <Text style={styles.fabIcon}>+</Text>
      </Pressable>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  syncStatusContainer: {
    marginTop: 0,
  },
  syncSummaryText: {
    fontSize: 12,
    color: "#6B7280",
  },
  listContent: {
    padding: Spacing.four,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: Spacing.four,
    marginBottom: Spacing.three,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.two,
  },
  vesselName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  statusBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
  },
  status_Pending: {
    backgroundColor: "#FEF3C7",
  },
  status_InProgress: {
    backgroundColor: "#DBEAFE",
  },
  status_Completed: {
    backgroundColor: "#D1FAE5",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#374151",
  },
  syncRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  syncText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  emptyContainer: {
    padding: Spacing.four,
    alignItems: "center",
  },
  emptyText: {
    color: "#111827",
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    bottom: Spacing.six,
    right: Spacing.six,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabIcon: {
    color: "#FFFFFF",
    fontSize: 32,
    lineHeight: 36,
  },
});
