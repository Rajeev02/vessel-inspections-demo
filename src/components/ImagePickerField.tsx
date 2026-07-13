import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, Linking } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { copyAsync } from "expo-file-system";
import { Spacing } from "@/constants/theme";

interface ImagePickerFieldProps {
  value: string[];
  onChange: (uris: string[]) => void;
}

export default function ImagePickerField({ value, onChange }: ImagePickerFieldProps) {
  const validUris = value.filter(uri => uri && typeof uri === "string" && uri.trim() !== "");

  const removePhoto = (indexToRemove: number) => {
    onChange(validUris.filter((_, index) => index !== indexToRemove));
  };

  const pickImage = async () => {
    const remainingSlots = 10 - validUris.length;
    if (remainingSlots <= 0) {
      Alert.alert("Limit Reached", "You can only attach up to 10 photos per inspection.");
      return;
    }

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert(
          "Photo Access Required",
          "You must allow access to your photos to attach them to the inspection report.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: remainingSlots,
        quality: 0.5,
      });

      if (!result.canceled && result.assets) {
        const { documentDirectory } = require("expo-file-system");
        const newUris = await Promise.all(
          result.assets.map(async (asset) => {
            const fileName = asset.uri.split('/').pop() || `photo_${Date.now()}.jpg`;
            try {
              if (documentDirectory) {
                const newUri = documentDirectory + fileName;
                await copyAsync({
                  from: asset.uri,
                  to: newUri
                });
                return newUri;
              }
              return asset.uri;
            } catch (error) {
              console.log("Failed to copy image", error);
              return asset.uri;
            }
          })
        );
        onChange([...validUris, ...newUris]);
      }
    } catch (e) {
      console.log("Image picker error", e);
      Alert.alert("Error", "Failed to access the photo library.");
    }
  };

  return (
    <View>
      <Pressable style={styles.photoButton} onPress={pickImage}>
        <Text style={styles.photoButtonText}>Attach Photos</Text>
      </Pressable>
      {validUris.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoList}>
          {validUris.map((uri, index) => (
            <View key={index} style={styles.photoWrapper}>
              <Image source={{ uri }} style={styles.photoPreview} />
              <Pressable 
                style={styles.deletePhotoButton} 
                onPress={() => removePhoto(index)}
              >
                <Text style={styles.deletePhotoText}>×</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  photoButton: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#3B82F6",
    padding: Spacing.three,
    borderRadius: 8,
    alignItems: "center",
  },
  photoButtonText: {
    color: "#2563EB",
    fontWeight: "600",
  },
  photoList: {
    flexDirection: "row",
    marginTop: Spacing.two,
  },
  photoWrapper: {
    position: "relative",
    marginRight: Spacing.two,
  },
  photoPreview: {
    width: 200,
    height: 150,
    borderRadius: 8,
  },
  deletePhotoButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  deletePhotoText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    lineHeight: 20,
  },
});
