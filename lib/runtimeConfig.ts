const repoBaseUrl = "https://github.com/SAEMMM/stack-pulse/blob/main";

export const runtimeConfig = {
  supportEmail: process.env.EXPO_PUBLIC_STACK_PULSE_SUPPORT_EMAIL || "saem030@naver.com",
  privacyPolicyUrl:
    process.env.EXPO_PUBLIC_STACK_PULSE_PRIVACY_URL || `${repoBaseUrl}/docs/privacy-policy.md`,
  termsUrl:
    process.env.EXPO_PUBLIC_STACK_PULSE_TERMS_URL || `${repoBaseUrl}/docs/terms-of-service.md`,
  adsEnabled: process.env.EXPO_PUBLIC_STACK_PULSE_ADS_ENABLED === "true",
};
