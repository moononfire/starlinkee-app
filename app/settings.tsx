import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { getAuth, clearAuth } from "../lib/storage";

export default function SettingsScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const auth = await getAuth();
      setPhone(auth?.phone ?? null);
    })();
  }, []);

  async function logout() {
    await clearAuth();
    router.replace("/login/google");
  }

  return (
    <View style={styles.container}>
      {phone && (
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Zalogowano numerem</Text>
          <Text style={styles.rowValue}>{phone}</Text>
        </View>
      )}
      <Pressable style={styles.button} onPress={logout}>
        <Text style={styles.buttonText}>Wyloguj się</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 16, backgroundColor: "#f9fafb" },
  row: { backgroundColor: "#fff", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#e5e7eb", gap: 4 },
  rowLabel: { fontSize: 13, color: "#6b7280" },
  rowValue: { fontSize: 16, color: "#111827", fontWeight: "600" },
  button: { backgroundColor: "#ef4444", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
