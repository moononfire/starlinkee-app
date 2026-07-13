import * as SecureStore from "expo-secure-store";

// Loyalty sessions are stored per-location because a single customer can
// hold cards at many different venues that all use this one app.
interface LocationAuth {
  token: string;
  phone: string;
}

type AuthMap = Record<string, LocationAuth>;

const STORAGE_KEY = "starlinkee_loyalty_auth";

async function readAll(): Promise<AuthMap> {
  const raw = await SecureStore.getItemAsync(STORAGE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as AuthMap;
  } catch {
    return {};
  }
}

async function writeAll(map: AuthMap): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(map));
}

export async function getLocationAuth(slug: string): Promise<LocationAuth | null> {
  const map = await readAll();
  return map[slug] ?? null;
}

export async function setLocationAuth(slug: string, auth: LocationAuth): Promise<void> {
  const map = await readAll();
  map[slug] = auth;
  await writeAll(map);
}

export async function clearLocationAuth(slug: string): Promise<void> {
  const map = await readAll();
  delete map[slug];
  await writeAll(map);
}
