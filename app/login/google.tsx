import { useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { getGoogleEmail } from "../../lib/api";
import { Colors, Radius, brandShadow } from "../../constants/theme";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;

function extractAccessToken(url: string): string | null {
  const hashIndex = url.indexOf("#");
  if (hashIndex === -1) return null;
  return new URLSearchParams(url.slice(hashIndex + 1)).get("access_token");
}

// Google Sign-In here is a friction step, not a checked identity — the
// phone number verified next is the one thing the backend actually trusts
// as the loyalty account, so a login can't be faked by using multiple
// Google accounts. We do still keep the email on file (linked to the
// phone once it's verified), so it's fetched here via Supabase.
export default function GoogleSignInScreen() {
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "browser" | "finishing">("idle");
  const [error, setError] = useState<string | null>(null);
  const loading = status !== "idle";

  async function signIn() {
    setStatus("browser");
    setError(null);
    const redirectUrl = Linking.createURL("login/callback");
    const authUrl = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUrl)}`;
    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

    if (result.type !== "success") {
      setStatus("idle");
      setError("Logowanie zostało przerwane. Spróbuj ponownie.");
      return;
    }

    setStatus("finishing");
    const accessToken = extractAccessToken(result.url);
    const emailRes = accessToken ? await getGoogleEmail(accessToken) : null;

    router.push({
      pathname: "/login/phone",
      params: { returnTo: returnTo ?? "", email: emailRes?.data.email ?? "" },
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>Starlinkee</Text>
      <Text style={styles.title}>Witaj w Starlinkee</Text>
      <Text style={styles.label}>Zaloguj się przez Google, żeby założyć konto w aplikacji.</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={signIn} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Zaloguj się przez Google</Text>}
      </Pressable>
      {status === "browser" && <Text style={styles.statusText}>Otwieram logowanie Google w przeglądarce...</Text>}
      {status === "finishing" && <Text style={styles.statusText}>Kończę logowanie...</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 16, backgroundColor: Colors.background, justifyContent: "center" },
  brand: { fontSize: 20, fontWeight: "700", color: Colors.brand600, textAlign: "center", marginBottom: 4 },
  title: { fontSize: 22, fontWeight: "700", color: Colors.textPrimary, textAlign: "center" },
  label: { fontSize: 15, color: Colors.textSecondary, textAlign: "center" },
  error: { color: Colors.error, fontSize: 14, textAlign: "center" },
  button: { backgroundColor: Colors.brand600, borderRadius: Radius.xl, paddingVertical: 14, alignItems: "center", ...brandShadow },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  statusText: { fontSize: 14, color: Colors.textMuted, textAlign: "center" },
});
