import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { requestOtp } from "../../lib/api";

export default function PhoneScreen() {
  const { returnTo, email } = useLocalSearchParams<{ returnTo?: string; email?: string }>();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!phone) return;
    setLoading(true);
    setError(null);
    const res = await requestOtp(phone);
    setLoading(false);
    if (!res.ok) {
      setError("Nie udało się wysłać kodu SMS. Spróbuj ponownie.");
      return;
    }
    router.push({ pathname: "/login/otp", params: { phone, returnTo: returnTo ?? "", email: email ?? "" } });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Podaj numer telefonu, żeby dokończyć logowanie</Text>
      <TextInput
        style={styles.input}
        placeholder="+48 600 000 000"
        placeholderTextColor="#9ca3af"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable style={[styles.button, (!phone || loading) && styles.buttonDisabled]} onPress={submit} disabled={!phone || loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Wyślij kod SMS</Text>}
      </Pressable>
      {loading && <Text style={styles.statusText}>Wysyłam kod SMS...</Text>}
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
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#fff",
  },
  error: { color: "#ef4444", fontSize: 14 },
  button: { backgroundColor: "#111827", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  statusText: { fontSize: 14, color: "#6b7280", textAlign: "center" },
});
