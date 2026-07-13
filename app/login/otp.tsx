import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { verifyOtp } from "../../lib/api";
import { setAuth } from "../../lib/storage";

export default function OtpScreen() {
  const { phone, returnTo, email } = useLocalSearchParams<{ phone: string; returnTo?: string; email?: string }>();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!code || !phone) return;
    setLoading(true);
    setError(null);
    const res = await verifyOtp(phone, code, email);
    setLoading(false);
    if (!res.ok || !res.data.token) {
      setError("Nieprawidłowy lub wygasły kod.");
      return;
    }
    await setAuth({ token: res.data.token, phone });
    router.replace(returnTo && returnTo.length > 0 ? returnTo : "/");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Podaj kod SMS wysłany na numer {phone}</Text>
      <TextInput
        style={styles.input}
        placeholder="1234"
        placeholderTextColor="#9ca3af"
        keyboardType="number-pad"
        maxLength={4}
        value={code}
        onChangeText={(v) => setCode(v.replace(/\D/g, ""))}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable
        style={[styles.button, (code.length < 4 || loading) && styles.buttonDisabled]}
        onPress={submit}
        disabled={code.length < 4 || loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Potwierdź</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 16, backgroundColor: "#f9fafb" },
  label: { fontSize: 15, color: "#374151" },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 22,
    letterSpacing: 8,
    textAlign: "center",
    color: "#111827",
    backgroundColor: "#fff",
  },
  error: { color: "#ef4444", fontSize: 14 },
  button: { backgroundColor: "#111827", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
