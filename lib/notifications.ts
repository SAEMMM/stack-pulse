import * as Notifications from "expo-notifications";
import { Issue, LanguageMode } from "../types/app";
import { getDisplayTitle, getPrimaryKeyLine } from "./format";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type NotificationPermissionState = "granted" | "denied" | "undetermined";

export async function getNotificationPermissionState(): Promise<NotificationPermissionState> {
  const settings = await Notifications.getPermissionsAsync();
  return settings.status;
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  const settings = await Notifications.requestPermissionsAsync();
  return settings.status;
}

export async function scheduleTestNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "StackPulse",
      body: "Important developer issue ready for review.",
      data: {
        type: "test-alert",
      },
    },
    trigger: null,
  });
}

export async function scheduleIssueNotification(issue: Issue, mode: LanguageMode) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: getDisplayTitle(issue, mode),
      body: getPrimaryKeyLine(issue, mode),
      data: {
        type: "issue-alert",
        issueId: issue.id,
      },
    },
    trigger: null,
  });
}
