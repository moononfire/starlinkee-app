import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { collectStamp, claimReward, getCard } from "../../../lib/api";
import { getAuth } from "../../../lib/storage";

function formatRemaining(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function CardScreen() {
  const { slug, scanToken, maxStamps: maxStampsParam } = useLocalSearchParams<{
    slug: string;
    scanToken?: string;
    maxStamps?: string;
  }>();
  const router = useRouter();
  const ranOnce = useRef(false);

  const [token, setToken] = useState<string | null>(null);
  const [stamps, setStamps] = useState(0);
  const [maxStamps, setMaxStamps] = useState(Number(maxStampsParam ?? 10));
  const [rewardReady, setRewardReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState<number | null>(null);
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;

    (async () => {
      if (!slug) return;
      const auth = await getAuth();
      if (!auth) {
        const returnTo = `/loyalty/${slug}/card?scanToken=${encodeURIComponent(scanToken ?? "")}&maxStamps=${encodeURIComponent(maxStampsParam ?? "10")}`;
        router.replace({ pathname: "/login/google", params: { returnTo } });
        return;
      }
      setToken(auth.token);

      const cardRes = await getCard(auth.token, slug);
      if (cardRes.ok) {
        setStamps(cardRes.data.stamps);
        setRewardReady(cardRes.data.reward_ready);
        setMaxStamps(cardRes.data.max_stamps);
      }

      if (scanToken) {
        const res = await collectStamp(auth.token, slug, scanToken);
        if (res.status === 429 && res.data.error === "cooldown") {
          setCooldownSeconds(res.data.remaining_seconds ?? null);
        } else if (res.status === 403) {
          setError("Ta wizyta wygasła. Zbliż telefon do nadajnika jeszcze raz.");
        } else if (res.ok) {
          setStamps(res.data.stamps ?? 0);
          setRewardReady(res.data.reward_ready ?? false);
        }
      }

      setLoading(false);
    })();
  }, [slug, scanToken, maxStampsParam, router]);

  async function onClaim() {
    if (!token || !slug) return;
    setLoading(true);
    const res = await claimReward(token, slug);
    setLoading(false);
    if (!res.ok) return;
    setClaimed(true);
    setStamps(0);
    setRewardReady(false);
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {claimed && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>Nagroda odebrana! 🎉</Text>
        </View>
      )}

      <View style={styles.grid}>
        {Array.from({ length: maxStamps }, (_, i) => (
          <View key={i} style={[styles.stamp, i < stamps && styles.stampFilled]}>
            <Text style={[styles.stampText, i < stamps && styles.stampTextFilled]}>★</Text>
          </View>
        ))}
      </View>

      <Text style={styles.count}>
        {stamps} / {maxStamps} pieczątek
      </Text>

      {rewardReady ? (
        <Pressable style={[styles.button, styles.buttonReward]} onPress={onClaim}>
          <Text style={styles.buttonText}>Odbierz nagrodę 🎁</Text>
        </Pressable>
      ) : cooldownSeconds ? (
        <Text style={styles.cooldown}>
          Kolejna pieczątka za {formatRemaining(cooldownSeconds)}
        </Text>
      ) : null}

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 20, backgroundColor: "#f9fafb", alignItems: "center", justifyContent: "center" },
  banner: { backgroundColor: "#dcfce7", borderRadius: 12, padding: 16, width: "100%" },
  bannerText: { color: "#166534", fontSize: 15, textAlign: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "center", maxWidth: 320 },
  stamp: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  stampFilled: { backgroundColor: "#111827", borderColor: "#111827" },
  stampText: { fontSize: 18, color: "transparent" },
  stampTextFilled: { color: "#fff" },
  count: { fontSize: 15, color: "#4b5563" },
  button: { borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, alignItems: "center" },
  buttonReward: { backgroundColor: "#16a34a" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  cooldown: { color: "#d97706", fontSize: 14 },
  error: { color: "#ef4444", fontSize: 14, textAlign: "center" },
});
