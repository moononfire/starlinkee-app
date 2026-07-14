import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { getAuth, clearAuth } from "../lib/storage";
import { Colors, Radius } from "../constants/theme";

export default function SettingsScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState<string | null>(null);
  const [loadingPhone, setLoadingPhone] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    (async () => {
      const auth = await getAuth();
      setPhone(auth?.phone ?? null);
      setLoadingPhone(false);
    })();
  }, []);

  async function logout() {
    setLoggingOut(true);
    await clearAuth();
    router.replace("/login/google");
  }

  return (
    <View style={styles.container}>
      {loadingPhone ? (
        <ActivityIndicator color={Colors.brand600} />
      ) : (
        phone && (
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Zalogowano numerem</Text>
            <Text style={styles.rowValue}>{phone}</Text>
          </View>
        )
      )}
      <Pressable style={[styles.button, loggingOut && styles.buttonDisabled]} onPress={logout} disabled={loggingOut}>
        {loggingOut ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Wyloguj się</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 16, backgroundColor: Colors.background },
  row: { backgroundColor: Colors.white, borderRadius: Radius.xxl, padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 4 },
  rowLabel: { fontSize: 13, color: Colors.textMuted },
  rowValue: { fontSize: 16, color: Colors.textPrimary, fontWeight: "600" },
  button: { backgroundColor: Colors.error, borderRadius: Radius.xl, paddingVertical: 14, alignItems: "center" },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
