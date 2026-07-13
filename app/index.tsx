import { View, Text, StyleSheet } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Starlinkee</Text>
      <Text style={styles.subtitle}>
        Zbliż telefon do nadajnika NFC przy kasie, żeby zebrać pieczątkę na karcie lojalnościowej.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#f9fafb" },
  title: { fontSize: 28, fontWeight: "700", color: "#111827", marginBottom: 12 },
  subtitle: { fontSize: 16, color: "#4b5563", textAlign: "center", lineHeight: 22 },
});
