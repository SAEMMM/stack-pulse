import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { colors, spacing } from "../constants/theme";
import { AppTab, UiLanguage } from "../types/app";

export function TabBar({
  currentTab,
  mode,
  onChange,
}: {
  currentTab: AppTab;
  mode: UiLanguage;
  onChange: (tab: AppTab) => void;
}) {
  const { t } = useTranslation();
  const tabs: { key: AppTab; label: string }[] = [
    { key: "feed", label: t("tabs.feed") },
    { key: "saved", label: t("tabs.saved") },
    { key: "notifications", label: t("tabs.notifications") },
    { key: "settings", label: t("tabs.settings") },
  ];

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
    backgroundColor: colors.panelAlt,
    borderColor: colors.accentStrong,
    borderRadius: 999,
    borderWidth: 1.5,
    bottom: 24,
    flexDirection: "row",
    left: 16,
    padding: 7,
    position: "absolute",
    right: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.48,
    shadowRadius: 26,
    elevation: 12,
  },
  tab: {
    alignItems: "center",
    borderRadius: 999,
    flex: 1,
    paddingVertical: 12,
  },
  tabActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
    borderWidth: 1,
  },
  label: {
    color: colors.subtext,
    fontSize: 13,
    fontWeight: "800",
  },
  labelActive: {
    color: colors.accentStrong,
  },
});
