import "dotenv/config";
import type { ExpoConfig } from "expo/config";

const repoBaseUrl = "https://github.com/SAEMMM/stack-pulse/blob/main";

const appName = process.env.STACK_PULSE_APP_NAME || "StackPulse";
const slug = process.env.STACK_PULSE_APP_SLUG || "stack-pulse";
const scheme = process.env.STACK_PULSE_SCHEME || "stackpulse";
const version = process.env.STACK_PULSE_APP_VERSION || "1.0.0";
const iosBundleIdentifier =
  process.env.STACK_PULSE_IOS_BUNDLE_ID || "com.saem.stackpulse";
const androidPackage =
  process.env.STACK_PULSE_ANDROID_PACKAGE || "com.saem.stackpulse";
const apiUrl = process.env.EXPO_PUBLIC_STACK_PULSE_API_URL || "";
const supportEmail = process.env.STACK_PULSE_SUPPORT_EMAIL || "saem030@naver.com";
const privacyPolicyUrl =
  process.env.STACK_PULSE_PRIVACY_URL || `${repoBaseUrl}/docs/privacy-policy.md`;
const termsUrl = process.env.STACK_PULSE_TERMS_URL || `${repoBaseUrl}/docs/terms-of-service.md`;
const adProvider = process.env.STACK_PULSE_AD_PROVIDER || "admob";
const adsEnabled = process.env.EXPO_PUBLIC_STACK_PULSE_ADS_ENABLED === "true";

const config: ExpoConfig = {
  name: appName,
  slug,
  version,
  orientation: "portrait",
  userInterfaceStyle: "light",
  scheme,
  splash: {
    resizeMode: "contain",
    backgroundColor: "#f4efe6",
  },
  assetBundlePatterns: ["**/*"],
  runtimeVersion: {
    policy: "appVersion",
  },
  ios: {
    bundleIdentifier: iosBundleIdentifier,
    supportsTablet: true,
    infoPlist: {
      NSUserNotificationUsageDescription:
        "StackPulse uses notifications to alert you to important developer issues.",
      NSUserTrackingUsageDescription:
        "StackPulse may use device identifiers to measure advertising performance and keep sponsored content relevant.",
    },
  },
  android: {
    package: androidPackage,
    adaptiveIcon: {
      backgroundColor: "#f4efe6",
    },
  },
  web: {
    bundler: "metro",
  },
  extra: {
    stackPulse: {
      apiUrl,
      supportEmail,
      privacyPolicyUrl,
      termsUrl,
      requiresHostedApi: true,
      adProvider,
      adsEnabled,
    },
  },
};

export default config;
