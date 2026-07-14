import { Platform } from "react-native";
import { requireNativeModule } from "expo-modules-core";

interface PhoneNumberHintNativeModule {
  getPhoneNumberHint(): Promise<string | null>;
}

const NativeModule: PhoneNumberHintNativeModule | null =
  Platform.OS === "android" ? requireNativeModule("PhoneNumberHint") : null;

/**
 * Opens Android's on-device Phone Number Hint picker (Google Play Services)
 * and resolves with the number the user selected — no SMS is sent, and the
 * number is not verified as belonging to the current user. Resolves to
 * `null` if the user dismisses the picker, no hint is available (e.g. no
 * SIM, outdated Play Services), or the platform isn't Android.
 */
export async function getPhoneNumberHint(): Promise<string | null> {
  if (!NativeModule) return null;
  try {
    return await NativeModule.getPhoneNumberHint();
  } catch {
    return null;
  }
}
