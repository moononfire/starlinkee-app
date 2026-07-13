import { useEffect, useRef } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getAuth } from "../../../lib/storage";

// Entry point for the "Otwórz w aplikacji" button on the web loyalty page —
// reached via the starlinkee://loyalty/{slug}?scanToken=...&maxStamps=...
// deep link. The web page already validated the NFC tap and minted the
// scanToken, so this screen only needs to route to login (app-wide, not
// tied to this location) or straight to the card, which auto-collects the
// stamp using that scanToken.
export default function LoyaltyEntryScreen() {
  const { slug, scanToken, maxStamps } = useLocalSearchParams<{
    slug: string;
    scanToken?: string;
    maxStamps?: string;
  }>();
  const router = useRouter();
  const ranOnce = useRef(false);

  useEffect(() => {
    if (ranOnce.current || !slug) return;
    ranOnce.current = true;

    (async () => {
      const auth = await getAuth();
      const cardParams = { slug, scanToken: scanToken ?? "", maxStamps: maxStamps ?? "10" };
      if (auth) {
        router.replace({ pathname: "/loyalty/[slug]/card", params: cardParams });
      } else {
        const returnTo = `/loyalty/${slug}/card?scanToken=${encodeURIComponent(scanToken ?? "")}&maxStamps=${encodeURIComponent(maxStamps ?? "10")}`;
        router.replace({ pathname: "/login/google", params: { returnTo } });
      }
    })();
  }, [slug, scanToken, maxStamps, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#111827" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f9fafb" },
});
