import { useLocalSearchParams } from "expo-router";

import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";

import { Spacing } from "@/constants/theme";
import { InspectionStatus } from "@/features/inspections/constants";

import { inspectionsActions, selectInspections } from "@/features/inspections/slice";
import { generateInspectionPdf } from "@/utils/pdf";
import AppLayout from "@/components/AppLayout";
import ImagePickerField from "@/components/ImagePickerField";
import { useLocation } from "@/hooks/useLocation";
import { Inspection } from "@/features/inspections/types";

function InspectionForm({
  id,
  inspection,
}: {
  id: string;
  inspection: Inspection;
}) {
  const dispatch = useDispatch();
  const [status, setStatus] = useState<InspectionStatus>(inspection.status);
  const [comments, setComments] = useState(inspection.comments || "");
  const [photoUris, setPhotoUris] = useState<string[]>(
    inspection.photos || [],
  );
  const [isSaving, setIsSaving] = useState(false);
  
  const { fetchLocation, isFetchingLocation } = useLocation();

  const handleSave = async () => {
    setIsSaving(true);
    const location = await fetchLocation();
    const mappedLocation = location ? { lat: location.latitude, lng: location.longitude } : null;

    dispatch(
      inspectionsActions.saveRequested({
        id,
        status,
        comments,
        photos: photoUris,
        location: mappedLocation,
      }),
    );
    setIsSaving(false);
  };

  const generatePdf = async () => {
    await generateInspectionPdf(inspection, { status, comments, photos: photoUris });
  };

  return (
    <AppLayout title={inspection.vesselName} showBackButton>
      <Text style={styles.label}>Status</Text>
        <View style={styles.statusRow}>
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
                  styles.statusButtonText,
                  status === s && styles.statusButtonTextActive,
                ]}
              >
                {s}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Comments</Text>
        <TextInput
          style={styles.textInput}
          multiline
          numberOfLines={4}
          value={comments}
          onChangeText={setComments}
          placeholder="Add comments..."
          maxLength={2500}
        />
        <Text style={styles.charCounter}>
          {comments.length}/2500 characters
        </Text>

        <View style={styles.section}>
          <Text style={styles.label}>Photos</Text>
          <ImagePickerField value={photoUris} onChange={setPhotoUris} />
        </View>

        <View style={styles.actionButtonsRow}>
          <Pressable 
            style={[styles.saveButton, (isSaving || isFetchingLocation) && { opacity: 0.7 }]} 
            onPress={handleSave}
            disabled={isSaving || isFetchingLocation}
          >
            <Text style={styles.saveButtonText}>
              {isSaving || isFetchingLocation ? "Saving..." : "Save Changes"}
            </Text>
          </Pressable>

          <Pressable 
            style={styles.pdfButton} 
            onPress={generatePdf}
          >
            <Text style={styles.pdfButtonText}>PDF Report</Text>
          </Pressable>
        </View>
    </AppLayout>
  );
}

export default function InspectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const inspections = useSelector(selectInspections);
  const inspection = inspections.find((i) => String(i.id) === String(id));

  if (!inspection) {
    return (
      <View style={styles.center}>
        <Text>Inspection not found</Text>
      </View>
    );
  }

  return <InspectionForm id={id} inspection={inspection} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  section: {
    marginTop: Spacing.four,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginTop: Spacing.two,
  },
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
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
  statusButtonText: {
    fontSize: 14,
    color: "#4B5563",
  },
  statusButtonTextActive: {
    color: "#2563EB",
    fontWeight: "600",
  },
  textInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: Spacing.three,
    minHeight: 100,
    textAlignVertical: "top",
  },
  charCounter: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "right",
    marginTop: Spacing.one,
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: Spacing.three,
    marginTop: Spacing.four,
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#2563EB",
    paddingVertical: Spacing.three,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  pdfButton: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#4B5563",
    paddingVertical: Spacing.three,
    borderRadius: 8,
    alignItems: "center",
  },
  pdfButtonText: {
    color: "#4B5563",
    fontSize: 15,
    fontWeight: "600",
  },
});
