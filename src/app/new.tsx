import { router } from "expo-router";
import React, { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useDispatch } from "react-redux";

import { Spacing } from "@/constants/theme";
import { InspectionStatus } from "@/features/inspections/constants";
import { inspectionsActions } from "@/features/inspections/slice";
import AppLayout from "@/components/AppLayout";
import ImagePickerField from "@/components/ImagePickerField";

export default function NewInspectionScreen() {
  const dispatch = useDispatch();

  const [vesselName, setVesselName] = useState("");
  const [status, setStatus] = useState<InspectionStatus>(InspectionStatus.PENDING);
  const [comments, setComments] = useState("");
  const [photoUris, setPhotoUris] = useState<string[]>([]);

  const handleSave = () => {
    if (!vesselName.trim()) {
      return;
    }
    
    dispatch(
      inspectionsActions.createRequested({
        vesselName: vesselName.trim(),
        status,
        comments: comments.trim(),
        photos: photoUris,
        location: null,
      })
    );
    router.back();
  };

  return (
    <AppLayout title="New Inspection" showBackButton>
      <View>
        <Text style={styles.label}>Vessel Name *</Text>
        <TextInput
          style={styles.input}
          value={vesselName}
          onChangeText={setVesselName}
          placeholder="e.g. MV Cargo One"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View>
        <Text style={styles.label}>Status</Text>
        <View style={styles.statusContainer}>
          {Object.values(InspectionStatus).map((s) => (
            <Pressable
              key={s}
              style={[
                styles.statusButton,
                status === s && styles.statusButtonActive,
              ]}
              onPress={() => setStatus(s)}
            >
              <Text
                style={[
                  styles.statusText,
                  status === s && styles.statusTextActive,
                ]}
              >
                {s}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View>
        <Text style={styles.label}>Comments</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={comments}
          onChangeText={setComments}
          placeholder="Add initial notes..."
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={2500}
        />
        <Text style={styles.charCounter}>
          {comments.length}/2500 characters
        </Text>
      </View>

      <View>
        <Text style={styles.label}>Photos</Text>
        <ImagePickerField value={photoUris} onChange={setPhotoUris} />
      </View>

      <View style={styles.footer}>
        <Pressable 
          style={[styles.createButton, !vesselName.trim() && styles.createButtonDisabled]} 
          onPress={handleSave}
          disabled={!vesselName.trim()}
        >
          <Text style={styles.createButtonText}>Create Inspection</Text>
        </Pressable>
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: Spacing.two,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: Spacing.three,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    color: "#111827",
  },
  textArea: {
    height: 120,
  },
  charCounter: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "right",
    marginTop: Spacing.one,
  },
  statusContainer: {
    flexDirection: "row",
    gap: Spacing.two,
    flexWrap: "wrap",
  },
  statusButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 8,
    backgroundColor: "#E5E7EB",
    borderWidth: 1,
    borderColor: "transparent",
  },
  statusButtonActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#3B82F6",
  },
  statusText: {
    fontSize: 14,
    color: "#4B5563",
  },
  statusTextActive: {
    color: "#2563EB",
    fontWeight: "600",
  },
  footer: {
    marginTop: Spacing.four,
  },
  createButton: {
    backgroundColor: "#2563EB",
    paddingVertical: Spacing.three,
    borderRadius: 8,
    alignItems: "center",
  },
  createButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
