import React, { ReactNode } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ViewStyle,
  StyleProp,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import CustomHeader from "./CustomHeader";
import { Spacing } from "@/constants/theme";

interface AppLayoutProps {
  title: string;
  showBackButton?: boolean;
  headerBottom?: ReactNode;
  children: ReactNode;
  scrollable?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export default function AppLayout({
  title,
  showBackButton = false,
  headerBottom,
  children,
  scrollable = true,
  contentContainerStyle,
}: AppLayoutProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar style="dark" />
      <CustomHeader title={title} showBack={showBackButton} />
      {headerBottom && <View style={styles.headerBottom}>{headerBottom}</View>}
      
      <KeyboardAvoidingView
        style={styles.contentWrapper}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {scrollable ? (
          <ScrollView
            contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.staticContent, contentContainerStyle]}>
            {children}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  headerBottom: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  staticContent: {
    flex: 1,
  },
});
