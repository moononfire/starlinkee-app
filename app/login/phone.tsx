import { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { requestOtp, phoneHintLogin } from "../../lib/api";
import { setAuth } from "../../lib/storage";
import { getPhoneNumberHint } from "../../modules/phone-number-hint";
import { Colors, Radius, brandShadow } from "../../constants/theme";

export default function PhoneScreen() {
  const { returnTo, email } = useLocalSearchParams<{ returnTo?: string; email?: string }>();
  const router = useRouter();
  const ranHintOnce = useRef(false);

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Android tries the on-device number picker first (free, no SMS) — while
  // that's in flight we hide the manual form so it doesn't flash on screen.
  const [checkingHint, setCheckingHint] = useState(Platform.OS === "android");

  useEffect(() => {
    if (Platform.OS !== "android" || ranHintOnce.current) return;
    ranHintOnce.current = true;

    (async () => {
      const hinted = await getPhoneNumberHint();
      if (!hinted) {
        setCheckingHint(false);
        return;
      }
      const res = await phoneHintLogin(hinted);
      if (!res.ok || !res.data.token) {
        setCheckingHint(false);
        return;
      }
      await setAuth({ token: res.data.token, phone: hinted });
      router.replace(returnTo && returnTo.length > 0 ? returnTo : "/");
    })();
  }, [returnTo, router]);

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

  if (checkingHint) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.brand600} />
        <Text style={styles.statusText}>Szukam Twojego numeru na urządzeniu...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Podaj numer telefonu, żeby dokończyć logowanie</Text>
      <TextInput
        style={styles.input}
        placeholder="+48 600 000 000"
        placeholderTextColor={Colors.textPlaceholder}
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
  container: { flex: 1, padding: 24, gap: 16, backgroundColor: Colors.background },
  label: { fontSize: 15, color: Colors.textSecondary },
  input: {
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    borderRadius: Radius.xl,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
  },
  error: { color: Colors.error, fontSize: 14 },
  button: { backgroundColor: Colors.brand600, borderRadius: Radius.xl, paddingVertical: 14, alignItems: "center", ...brandShadow },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  statusText: { fontSize: 14, color: Colors.textMuted, textAlign: "center" },
});
