import { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator, FlatList, Image, RefreshControl } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { getAuth } from "../lib/storage";
import { getMyCards, LoyaltyCardSummary } from "../lib/api";

export default function HomeScreen() {
  const router = useRouter();
  const ranOnce = useRef(false);
  const [checking, setChecking] = useState(true);
  const [phone, setPhone] = useState<string | null>(null);
  const [cards, setCards] = useState<LoyaltyCardSummary[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadCards = useCallback(async (isRefresh = false) => {
    const auth = await getAuth();
    if (!auth) return;
    if (isRefresh) setRefreshing(true);
    else setLoadingCards(true);
    const res = await getMyCards(auth.token);
    if (res.ok) setCards(res.data.cards);
    setLoadingCards(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;

    (async () => {
      const auth = await getAuth();
      if (!auth) {
        router.replace("/login/google");
        return;
      }
      setPhone(auth.phone);
      setChecking(false);
      loadCards();
    })();
  }, [router, loadCards]);

  // Pick up new stamps collected elsewhere (e.g. after an NFC scan) whenever
  // the user comes back to this screen.
  useFocusEffect(
    useCallback(() => {
      if (!checking) loadCards();
    }, [checking, loadCards])
  );

  if (checking) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#111827" />
        <Text style={styles.statusText}>Sprawdzam logowanie...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Starlinkee</Text>
        <Text style={styles.subtitle}>Zalogowano numerem {phone}</Text>
        <Text style={styles.hint}>
          Zbliż telefon do nadajnika NFC przy kasie, żeby zebrać pieczątkę na karcie lojalnościowej.
        </Text>
      </View>

      <View style={styles.listSection}>
        <Text style={styles.listTitle}>Twoje karty lojalnościowe</Text>
        {loadingCards ? (
          <ActivityIndicator color="#111827" style={{ marginTop: 16 }} />
        ) : cards.length === 0 ? (
          <Text style={styles.emptyText}>Nie masz jeszcze żadnej karty. Zbierz pierwszą pieczątkę w lokalu.</Text>
        ) : (
          <FlatList
            data={cards}
            keyExtractor={(item, i) => item.slug ?? String(i)}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadCards(true)} />}
            renderItem={({ item }) => (
              <View style={styles.card}>
                {item.logo_link ? (
                  <Image source={{ uri: item.logo_link }} style={styles.logo} />
                ) : (
                  <View style={[styles.logo, styles.logoPlaceholder]} />
                )}
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{item.location_name}</Text>
                  <Text style={styles.cardStamps}>
                    {item.reward_ready ? "Nagroda gotowa do odbioru! 🎁" : `${item.stamps} / ${item.max_stamps} pieczątek`}
                  </Text>
                </View>
              </View>
            )}
          />
        )}
      </View>

      <Pressable style={styles.settingsButton} onPress={() => router.push("/settings")}>
        <Text style={styles.settingsButtonText}>Ustawienia</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#f9fafb", gap: 12 },
  screen: { flex: 1, backgroundColor: "#f9fafb", padding: 24, gap: 16 },
  header: { gap: 6 },
  title: { fontSize: 28, fontWeight: "700", color: "#111827" },
  subtitle: { fontSize: 15, color: "#111827", fontWeight: "600" },
  hint: { fontSize: 14, color: "#4b5563", lineHeight: 20 },
  statusText: { fontSize: 14, color: "#6b7280" },
  listSection: { flex: 1, gap: 8 },
  listTitle: { fontSize: 16, fontWeight: "600", color: "#111827" },
  emptyText: { fontSize: 14, color: "#6b7280", marginTop: 8 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 12,
    marginBottom: 8,
  },
  logo: { width: 44, height: 44, borderRadius: 10 },
  logoPlaceholder: { backgroundColor: "#e5e7eb" },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: "600", color: "#111827" },
  cardStamps: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  settingsButton: { alignSelf: "center", paddingVertical: 10, paddingHorizontal: 20 },
  settingsButtonText: { fontSize: 15, color: "#6b7280", textDecorationLine: "underline" },
});
