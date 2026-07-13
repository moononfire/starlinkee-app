import { useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { getGoogleEmail } from "../../lib/api";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setLoading(true);
    setError(null);
    const redirectUrl = Linking.createURL("login/callback");
    const authUrl = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUrl)}`;
    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

    if (result.type !== "success") {
      setLoading(false);
      setError("Logowanie zostało przerwane. Spróbuj ponownie.");
      return;
    }

    const accessToken = extractAccessToken(result.url);
    const emailRes = accessToken ? await getGoogleEmail(accessToken) : null;
    setLoading(false);

    router.push({
      pathname: "/login/phone",
      params: { returnTo: returnTo ?? "", email: emailRes?.data.email ?? "" },
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Witaj w Starlinkee</Text>
      <Text style={styles.label}>Zaloguj się przez Google, żeby założyć konto w aplikacji.</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={signIn} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Zaloguj się przez Google</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 16, backgroundColor: "#f9fafb", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "700", color: "#111827", textAlign: "center" },
  label: { fontSize: 15, color: "#374151", textAlign: "center" },
  error: { color: "#ef4444", fontSize: 14, textAlign: "center" },
  button: { backgroundColor: "#111827", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
