import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#111827" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "600" },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Starlinkee" }} />
      <Stack.Screen name="settings" options={{ title: "Ustawienia" }} />
      <Stack.Screen name="login/google" options={{ title: "Logowanie", headerShown: false }} />
      <Stack.Screen name="login/phone" options={{ title: "Twój numer" }} />
      <Stack.Screen name="login/otp" options={{ title: "Kod SMS" }} />
      <Stack.Screen name="loyalty/[slug]/index" options={{ title: "Karta lojalnościowa" }} />
      <Stack.Screen name="loyalty/[slug]/card" options={{ title: "Karta lojalnościowa" }} />
    </Stack>
  );
}
