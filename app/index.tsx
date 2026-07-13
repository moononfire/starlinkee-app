import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { getAuth } from "../lib/storage";

export default function HomeScreen() {
  const router = useRouter();
  const ranOnce = useRef(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;

    (async () => {
      const auth = await getAuth();
      if (!auth) {
        router.replace("/login/google");
        return;
      }
      setChecking(false);
    })();
  }, [router]);

  if (checking) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Starlinkee</Text>
      <Text style={styles.subtitle}>
        Zbliż telefon do nadajnika NFC przy kasie, żeby zebrać pieczątkę na karcie lojalnościowej.
      </Text>
      <Pressable style={styles.settingsButton} onPress={() => router.push("/settings")}>
        <Text style={styles.settingsButtonText}>Ustawienia</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#f9fafb", gap: 24 },
  title: { fontSize: 28, fontWeight: "700", color: "#111827" },
  subtitle: { fontSize: 16, color: "#4b5563", textAlign: "center", lineHeight: 22 },
  settingsButton: { paddingVertical: 10, paddingHorizontal: 20 },
  settingsButtonText: { fontSize: 15, color: "#6b7280", textDecorationLine: "underline" },
});
