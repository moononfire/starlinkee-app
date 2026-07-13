# Starlinkee — aplikacja mobilna (Android)

Natywna aplikacja React Native (Expo) dla klientów końcowych.

## Jak to działa

1. Klient stuka telefonem w nadajnik NFC przy kasie — **tak jak dziś**,
   otwiera się strona w przeglądarce (`starlinkee.com/plate/...` → karta
   lojalnościowa pod `/l/{slug}/loyalty`). To się nie zmienia.
2. Na tej stronie jest przycisk **„Otwórz w aplikacji Starlinkee”**
   (widoczny tylko na Androidzie — `src/components/linktree/LoyaltyCard.tsx`
   w repo `starlinkee-v2`). Kliknięcie:
   - jeśli appka jest zainstalowana → otwiera ją przez custom scheme
     `starlinkee://loyalty/{slug}?scanToken=...&maxStamps=...` i appka sama
     bije pieczątkę (scanToken z web-flow jest dowodem świeżej wizyty,
     ważny 2 minuty);
   - jeśli appka nie jest zainstalowana → Chrome automatycznie przechodzi
     na stronę Google Play (`S.browser_fallback_url` w linku `intent://`).
3. Appka nie musi sama nic wiedzieć o tagach NFC ani sekretach płytek —
   cała ta walidacja już zaszła na serwerze, zanim użytkownik kliknął
   przycisk. Appka dostaje gotowy `scanToken` i tylko go zużywa przez
   `POST /api/mobile/loyalty/collect`.

Backend (API, baza danych, logika 12h/OTP) to istniejący projekt
`starlinkee-v2` — ta appka jest tylko klientem wołającym jego endpointy pod
`/api/mobile/loyalty/*`.

## Wymagania

- Node.js (ta sama wersja co w `starlinkee-v2`)
- Android Studio (z zainstalowanym Android SDK)
- Telefon z Androidem 8.0+, z włączonym "Debugowanie USB"

## Pierwsze uruchomienie na Twoim telefonie

1. `npm install` w tym folderze.
2. Podłącz telefon kablem USB, zatwierdź "Zezwolić na debugowanie USB?".
3. `adb devices` — sprawdź, czy telefon jest widoczny.
4. `npx expo run:android` — buduje i instaluje appkę wprost na telefon.

### Alternatywnie z poziomu Android Studio

Folder `android/` (wygenerowany przez `npx expo prebuild -p android`) to
zwykły natywny projekt Androida — Android Studio → **Open** → wskaż
`starlinkee-app/android` → poczekaj na Gradle → **Run ▶**.

Jeśli zmienisz `app.json` albo dodasz natywny pakiet, uruchom ponownie
`npx expo prebuild -p android`, żeby zsynchronizować `android/` (ten folder
jest w `.gitignore` — generowany na żądanie, `app.json` jest źródłem prawdy).

### Ręczny test deep linku bez fizycznego stukania NFC

```
adb shell am start -a android.intent.action.VIEW \
  -d "starlinkee://loyalty/TWOJ-SLUG?scanToken=test&maxStamps=10" \
  com.starlinkee.app
```

(`scanToken=test` nie przejdzie walidacji na serwerze — to tylko test, czy
appka się otwiera i routing działa; do prawdziwego biletu pieczątki trzeba
kliknąć przycisk na realnej stronie `/l/{slug}/loyalty?scan=...`).

## Zmiana adresu API (np. do testów lokalnych)

Domyślny adres API jest w `.env` (`EXPO_PUBLIC_API_BASE_URL`). Do testów
lokalnego serwera Next.js (np. przez `ngrok`), utwórz `.env.local` z inną
wartością — nadpisuje `.env`, nie trafia do gita.

---

## Publikacja w Google Play

To jedyny sposób, żeby appka instalowała się bez ostrzeżeń Google Play
Protect. Realistyczny czas: **liczony w dniach/tygodniach, nie godzinach** —
głównie przez wymóg testów zamkniętych opisany niżej. Checklist:

### 1. Konto Google Play Console (jednorazowo)

- Załóż konto na https://play.google.com/console — opłata **25 USD
  jednorazowo**.
- Konto **osobiste** weryfikuje się zwykle szybciej (godziny–dni) niż
  **organizacyjne** (może wymagać numeru D-U-N-S, weryfikacji firmy — dni).
  Dla szybszego startu wybierz konto osobiste, jeśli to możliwe.

### 2. Materiały do wpisu w sklepie

- Ikona 512×512 PNG
- Grafika polecana (feature graphic) 1024×500
- Min. 2 zrzuty ekranu z telefonu
- Krótki opis (do 80 znaków) i pełny opis appki
- **Link do polityki prywatności** — już przygotowany:
  `https://starlinkee.com/pl/polityka-prywatnosci` (dopisałem tam sekcję o
  danych zbieranych przez appkę — numer telefonu, adres IP, dane wizyt).
  **Zanim wyślesz appkę do Play Console, uzupełnij w tym pliku placeholdery
  w nawiasach kwadratowych** (`[NAZWA FIRMY / IMIĘ I NAZWISKO]`, `[ADRES
  REJESTROWY]`, `[NIP]`, `[EMAIL KONTAKTOWY]` w
  `starlinkee-www/src/app/[locale]/polityka-prywatnosci/page.tsx`) — Google
  odrzuca polityki z widocznymi placeholderami.

### 3. Formularz "Data safety" w Play Console

Zgodnie z tym, co appka faktycznie zbiera:
- **Numer telefonu** — zbierany, cel: uwierzytelnienie/funkcjonalność
  appki (logowanie kodem SMS), udostępniany dostawcy SMS (httpsms.com).
- **Adres IP** — zbierany serwerowo do rate-limitingu.
- Zaznacz "dane szyfrowane w transferze" (HTTPS) i podaj link do polityki
  prywatności z punktu 2.

### 4. Budowanie i podpisywanie (EAS — już skonfigurowane w `eas.json`)

```
npx eas login
npx eas build --platform android --profile production
```

To zbuduje plik `.aab` (wymagany przez Play, nie `.apk`) w chmurze Expo i
automatycznie skonfiguruje **Play App Signing** (Google przechowuje klucz
podpisujący appkę — zalecane, nie musisz sam zarządzać keystore).

### 5. Wysyłka do Play Console

Ręcznie: pobierz `.aab` z linku, który poda `eas build`, i wgraj go w Play
Console → **Testing → Internal testing** → **Create release**.

Albo automatycznie przez `eas submit` (wymaga service account JSON z
Google Cloud Console — Play Console → Setup → API access → utwórz
service account z rolą "Release manager", pobierz plik JSON, zapisz jako
`google-play-service-account.json` w tym folderze — jest w `.gitignore`,
nigdy nie commituj tego pliku):

```
npx eas submit --platform android --profile production
```

### 6. Wymóg testów zamkniętych (nowe konta deweloperskie)

Google wymaga od **nowych** kont osobistych/organizacyjnych przeprowadzenia
testu na ścieżce **Closed testing** (minimalna liczba testerów i minimalny
czas trwania testu — sprawdź aktualne wartości w Play Console →
**Testing → Closed testing**, Google zmieniał te progi kilka razy, więc
podaje je bezpośrednio w interfejsie przy zakładaniu testu). W praktyce:

1. Utwórz ścieżkę **Closed testing**, dodaj testerów (wystarczą adresy
   e-mail znajomych/zespołu — muszą kliknąć link z zaproszenia i
   zainstalować appkę ze strony testowej Play).
2. Poczekaj wymagany czas (appka musi być aktywnie używana przez
   testerów, nie tylko zainstalowana).
3. Gdy licznik w Play Console pokaże spełnione warunki, odblokuje się
   możliwość złożenia wniosku o **dostęp produkcyjny** (Production
   access) — to osobny formularz do wypełnienia w konsoli.
4. Po zatwierdzeniu — promuj release ze ścieżki testowej do **Production**
   i wyślij appkę do standardowej weryfikacji Google (zwykle kilka dni
   przy pierwszej appce danego dewelopera).

### 7. Formularz weryfikacji treści / grupy docelowej

Play Console poprosi też o wypełnienie kwestionariusza oceny wieku
(content rating) i deklarację grupy docelowej — appka nie jest kierowana
do dzieci, więc odpowiedzi są proste (brak reklam, brak zakupów w appce na
tym etapie, standardowa ocena wiekowa).

### W międzyczasie (dystrybucja tymczasowa)

Zanim Play Store zatwierdzi appkę, możesz przekazać `.apk` bezpośrednio
testerom (nie klientom końcowym — tylko do wewnętrznych testów), pamiętając
że pojawi się ostrzeżenie Play Protect przy instalacji spoza sklepu:

```
npx eas build --platform android --profile preview
```

## Struktura

```
app/
  index.tsx                      — ekran startowy appki
  loyalty/[slug]/index.tsx       — cel deep linku z przycisku na stronie
                                    web; decyduje phone vs. card
  loyalty/[slug]/phone.tsx       — logowanie: numer telefonu
  loyalty/[slug]/otp.tsx         — logowanie: kod SMS
  loyalty/[slug]/card.tsx        — karta lojalnościowa, bicie pieczątki,
                                    odbiór nagrody
lib/api.ts                       — klient API (fetch + Bearer token)
lib/storage.ts                   — SecureStore, token/telefon per lokal
                                    (jedna appka obsługuje wiele lokali)
```

## Co dalej (poza obecnym zakresem)

- Powiadomienia push o promocjach — fundament pod to jest gotowy (Expo),
  wystarczy dodać `expo-notifications` i endpoint rejestracji tokenu.
- Wersja iOS — ten sam kod źródłowy, potrzebny Mac do buildu
  (`npx expo run:ios` / `eas build -p ios`) oraz analogiczny do Androida
  przycisk z fallbackiem do App Store (Universal Links dla `starlinkee://`
  albo prościej: sam link do App Store, skoro na iOS i tak nie ma NFC
  automatycznego otwierania appki spoza App Clips).
