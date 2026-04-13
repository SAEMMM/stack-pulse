import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../constants/theme";
import { AppTab } from "../types/app";

const tabs: { key: AppTab; label: string }[] = [
  { key: "feed", label: "Feed" },
  { key: "saved", label: "Saved" },
  { key: "notifications", label: "Alerts" },
  { key: "settings", label: "Settings" },
];

export function TabBar({
  currentTab,
  onChange,
}: {
  currentTab: AppTab;
  onChange: (tab: AppTab) => void;
}) {
  return (
    <View style={styles.wrap}>
      {tabs.map((tab) => {
        const active = currentTab === tab.key;
        return (
          <Pressable
            key={tab.key}
            style={[styles.tab, active && styles.tabActive]}
            onPress={() => onChange(tab.key)}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    bottom: 24,
    flexDirection: "row",
    left: 16,
    padding: 6,
    position: "absolute",
    right: 16,
  },
  tab: {
    alignItems: "center",
    borderRadius: 999,
    flex: 1,
    paddingVertical: 12,
  },
  tabActive: {
    backgroundColor: colors.text,
  },
  label: {
    color: colors.subtext,
    fontSize: 13,
    fontWeight: "800",
  },
  labelActive: {
    color: "#ffffff",
  },
});
