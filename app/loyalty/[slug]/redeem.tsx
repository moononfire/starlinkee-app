import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getCard, API_BASE_URL } from "../../../lib/api";
import { getAuth } from "../../../lib/storage";
import { Colors, Radius, brandShadow } from "../../../constants/theme";

const VERIFY_URL = `${API_BASE_URL.replace(/^https?:\/\//, "")}/verify`;

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function RedeemScreen() {
  const { slug, code: codeParam, expiresAt: expiresAtParam } = useLocalSearchParams<{
    slug: string;
    code?: string;
    expiresAt?: string;
  }>();
  const router = useRouter();
  const ranOnce = useRef(false);

  const [code, setCode] = useState(codeParam ?? null);
  const [expiresAt, setExpiresAt] = useState(expiresAtParam ?? null);
  const [loading, setLoading] = useState(!codeParam);
  const [remaining, setRemaining] = useState<number | null>(null);

  // Deep-links/relaunches land here without params — pull the still-pending
  // code (if any) straight from the server so the countdown stays accurate.
  useEffect(() => {
    if (codeParam || ranOnce.current) return;
    ranOnce.current = true;

    (async () => {
      if (!slug) return;
      const auth = await getAuth();
      if (!auth) {
        router.replace(`/loyalty/${slug}/card`);
        return;
      }
      const res = await getCard(auth.token, slug);
      if (res.ok && res.data.redeem) {
        setCode(res.data.redeem.code);
        setExpiresAt(res.data.redeem.expires_at);
      } else {
        router.replace(`/loyalty/${slug}/card`);
        return;
      }
      setLoading(false);
    })();
  }, [codeParam, slug, router]);

  useEffect(() => {
    if (!expiresAt) return;
    const target = new Date(expiresAt).getTime();
    const tick = () => setRemaining(Math.max(0, Math.round((target - Date.now()) / 1000)));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.brand600} />
      </View>
    );
  }

  const expired = remaining === 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pokaż ten kod pracownikowi</Text>
      <Text style={styles.subtitle}>
        Pracownik wpisze go na stronie {VERIFY_URL}, aby potwierdzić odbiór nagrody.
      </Text>

      <View style={[styles.codeBox, brandShadow, expired && styles.codeBoxExpired]}>
        <Text style={styles.code}>{code}</Text>
      </View>

      {expired ? (
        <Text style={styles.expiredText}>
          Kod wygasł. Wróć do karty i kliknij „Odbierz nagrodę" jeszcze raz, aby wygenerować nowy.
        </Text>
      ) : (
        remaining !== null && (
          <Text style={styles.countdown}>
            Masz jeszcze <Text style={styles.countdownValue}>{formatCountdown(remaining)}</Text> na potwierdzenie
          </Text>
        )
      )}

      <Pressable style={styles.button} onPress={() => router.replace(`/loyalty/${slug}/card`)}>
        <Text style={styles.buttonText}>Wróć do karty</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 16, backgroundColor: Colors.background, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "700", color: Colors.textPrimary, textAlign: "center" },
  subtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: "center" },
  codeBox: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xxl,
    paddingVertical: 24,
    paddingHorizontal: 32,
    borderWidth: 2,
    borderColor: Colors.brand600,
  },
  codeBoxExpired: { borderColor: Colors.borderStrong, opacity: 0.5 },
  code: { fontSize: 36, fontWeight: "800", letterSpacing: 6, color: Colors.brand700 },
  countdown: { fontSize: 15, color: Colors.textSecondary },
  countdownValue: { fontWeight: "700", color: Colors.brand700, fontVariant: ["tabular-nums"] },
  expiredText: { fontSize: 14, color: Colors.warning, textAlign: "center" },
  button: { borderRadius: Radius.xl, paddingVertical: 12, paddingHorizontal: 24, borderWidth: 1, borderColor: Colors.borderStrong },
  buttonText: { fontSize: 14, fontWeight: "600", color: Colors.textPrimary },
});
