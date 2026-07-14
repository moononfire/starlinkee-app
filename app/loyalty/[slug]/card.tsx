import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { collectStamp, claimReward, getCard } from "../../../lib/api";
import { getAuth } from "../../../lib/storage";
import { Colors, Radius, brandShadow } from "../../../constants/theme";

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
  const [loadingMessage, setLoadingMessage] = useState("Ładuję kartę...");
  const [error, setError] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState<number | null>(null);

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

        // A code was already generated (app relaunched/refreshed mid-window)
        // — resume the countdown screen instead of showing "odbierz" again.
        if (cardRes.data.redeem) {
          router.replace({
            pathname: "/loyalty/[slug]/redeem",
            params: { slug, code: cardRes.data.redeem.code, expiresAt: cardRes.data.redeem.expires_at },
          });
          return;
        }
      }

      if (scanToken) {
        setLoadingMessage("Zbieram pieczątkę...");
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
    setLoadingMessage("Odbieram nagrodę...");
    setLoading(true);
    const res = await claimReward(token, slug);
    setLoading(false);
    if (!res.ok || !res.data.code || !res.data.expires_at) return;
    router.push({
      pathname: "/loyalty/[slug]/redeem",
      params: { slug, code: res.data.code, expiresAt: res.data.expires_at },
    });
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.brand600} />
        <Text style={styles.statusText}>{loadingMessage}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
  container: { flex: 1, padding: 24, gap: 20, backgroundColor: Colors.background, alignItems: "center", justifyContent: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "center", maxWidth: 320 },
  stamp: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: Colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  stampFilled: { backgroundColor: Colors.brand600, borderColor: Colors.brand600 },
  stampText: { fontSize: 18, color: "transparent" },
  stampTextFilled: { color: "#fff" },
  count: { fontSize: 15, color: Colors.textSecondary },
  button: { borderRadius: Radius.xl, paddingVertical: 14, paddingHorizontal: 32, alignItems: "center" },
  buttonReward: { backgroundColor: Colors.success },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  cooldown: { color: Colors.warning, fontSize: 14 },
  error: { color: Colors.error, fontSize: 14, textAlign: "center" },
  statusText: { fontSize: 14, color: Colors.textMuted },
});
