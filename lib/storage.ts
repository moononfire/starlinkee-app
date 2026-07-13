import * as SecureStore from "expo-secure-store";

// Login (Google, then phone/SMS OTP) is one-time and app-wide — the phone
// number is the account, not a per-location card registration. The same
// session works for every location's loyalty card.
export interface Auth {
  token: string;
  phone: string;
}

const STORAGE_KEY = "starlinkee_auth";

export async function getAuth(): Promise<Auth | null> {
  const raw = await SecureStore.getItemAsync(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Auth;
  } catch {
    return null;
  }
}

export async function setAuth(auth: Auth): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(auth));
}

export async function clearAuth(): Promise<void> {
  await SecureStore.deleteItemAsync(STORAGE_KEY);
}
