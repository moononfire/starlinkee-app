# Starlinkee — aplikacja mobilna (Android)

Natywna aplikacja React Native (Expo) dla klientów końcowych.

## Jak to działa

Logowanie jest **globalne dla całej appki**, nie per lokalizacja: Google
Sign-In (krok tylko w UI, bez wpływu na backend) → numer telefonu → kod SMS
raz, a wynikowa sesja działa potem automatycznie w każdej odwiedzonej
lokalizacji. Numer telefonu (nie konto Google) jest jedynym identyfikatorem
karty lojalnościowej w bazie.

1. Klient stuka telefonem w nadajnik NFC przy kasie — otwiera się strona w
   przeglądarce (`starlinkee.com/plate/...` → karta lojalnościowa pod
   `/l/{slug}/loyalty`, projekt `starlinkee-v2`).
2. Ta strona to już tylko most do appki (`src/components/linktree/LoyaltyCard.tsx`
   w `starlinkee-v2`) — na Androidzie **automatycznie** przekierowuje przez
   `intent://loyalty/{slug}?scanToken=...&maxStamps=...`:
   - appka zainstalowana → otwiera się i sama bije pieczątkę (scanToken jest
     dowodem świeżej wizyty, ważny kilka minut) przez
     `POST /api/mobile/loyalty/collect`;
   - appka niezainstalowana → Chrome przechodzi na
     `starlinkee.com/{lang}/pobierz-aplikacje` (nasza własna strona z plikiem
     `.apk` — appka nie jest jeszcze w Google Play), gdzie trzeba ją pobrać i
     **przyłożyć telefon do nadajnika jeszcze raz** po instalacji (sideload
     nie ma deferred deep linkingu, to wymaga Play Install Referrer API).
   - iOS: bez automatycznego przekierowania (custom scheme bez appki
     pokazuje twardy błąd w Safari) — tylko widoczny przycisk.
3. Appka nie musi sama nic wiedzieć o tagach NFC ani sekretach płytek —
   cała ta walidacja już zaszła na serwerze. Appka dostaje gotowy `scanToken`
   i tylko go zużywa.

Backend (API, baza danych, logika 12h/OTP, tabela `loyalty_cards` kluczowana
numerem telefonu) to istniejący projekt `starlinkee-v2` — ta appka jest
tylko klientem wołającym jego endpointy pod `/api/mobile/loyalty/*`.

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

## Aktualizacje OTA (EAS Update) — bez ponownej instalacji appki

Zmiany czysto w kodzie JS/TS (bez nowych zależności natywnych, bez zmian w
`app.json`) można wypchnąć na telefony, które już mają appkę zainstalowaną,
bez budowania nowego `.apk`/`.aab` i bez reinstalacji:

```
npx eas-cli@latest update --channel preview --environment preview --message "opis zmiany"
```

Kilka rzeczy, które trzeba rozumieć, żeby to zadziałało:

- **`eas update` zawsze publikuje do chmury Expo** — nieważne, czy sama
  appka na telefonie została zbudowana lokalnie (`gradlew`/`expo run:android`)
  czy przez `eas build`. To dwie niezależne rzeczy: **jak appka powstała**
  (build) i **skąd bierze nowe wersje JS** (update).
- Żeby appka w ogóle wiedziała, na jakim kanale ma sprawdzać aktualizacje,
  musi mieć to zaszyte w natywnym manifeście (`expo-channel-name`). `eas
  build` robi to automatycznie na podstawie pola `channel` w `eas.json` dla
  danego profilu. **Bare `expo prebuild` + `gradlew`/Android Studio (bez
  `eas build`) tego nie robi samo z siebie** — dlatego w `app.json` jest na
  stałe wpisane:
  ```json
  "updates": {
    "requestHeaders": { "expo-channel-name": "preview" }
  }
  ```
  Dzięki temu **każdy** build (lokalny i przez EAS) dostaje ten sam kanał
  zaszyty przy `expo prebuild`. Jeśli kiedyś dojdzie profil `production` z
  innym kanałem, trzeba to tu zaktualizować (albo usunąć na stałe wpisany
  nagłówek i polegać wyłącznie na `eas build`, które ustawia go samo).
- Build zrobiony **zanim** ten wpis w `app.json` się pojawił (albo w ogóle
  bez `expo-updates` w zależnościach) **nie odbierze żadnej aktualizacji
  OTA** — nie ma czego sprawdzić. Jedyny sposób, żeby taki egzemplarz dostał
  nowszy kod, to zbudować i zainstalować go ponownie.
- Sprawdzić, czy dany `.apk`/`.aab` ma poprawnie zaszyty kanał, można przez:
  ```
  grep expo-channel-name android/app/src/main/AndroidManifest.xml
  ```
  (po `expo prebuild`, przed spakowaniem do `.apk`).

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

`eas-cli` celowo **nie jest** zależnością projektu (`package.json`) —
dodanie go tam wciąga zależności kolidujące z `expo-router` i psuje
`npm ci`, którego używa serwer budujący EAS. Uruchamiaj go zawsze przez
`npx eas-cli@latest <komenda>` (npx pobiera go doraźnie, nic nie zapisuje w
projekcie). Sam `npx eas ...` (bez `-cli`) zwróci błąd
`npm error could not determine executable to run` — npx szuka wtedy pakietu
o nazwie dokładnie "eas", którego nie ma; właściwy pakiet nazywa się
`eas-cli`.

```
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile production
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
npx eas-cli@latest submit --platform android --profile production
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
npx eas-cli@latest build --platform android --profile preview
```

## Struktura

```
app/
  index.tsx                      — ekran startowy: numer telefonu +
                                    lista odwiedzonych lokalizacji z
                                    liczbą pieczątek (GET .../cards)
  settings.tsx                   — numer telefonu, wylogowanie
  login/google.tsx               — logowanie: Google Sign-In (krok UI,
                                    email tylko zapisywany, nie wymuszany)
  login/phone.tsx                — logowanie: numer telefonu
  login/otp.tsx                  — logowanie: kod SMS, zapisuje globalną
                                    sesję (nie per lokalizacja)
  loyalty/[slug]/index.tsx       — cel deep linku z NFC; decyduje
                                    login vs. prosto do karty
  loyalty/[slug]/card.tsx        — karta lojalnościowa, bicie pieczątki,
                                    odbiór nagrody
lib/api.ts                       — klient API (fetch + Bearer token)
lib/storage.ts                   — SecureStore, jedna globalna sesja
                                    (token + telefon) dla całej appki
```

## Co dalej (poza obecnym zakresem)

- Powiadomienia push o promocjach — fundament pod to jest gotowy (Expo),
  wystarczy dodać `expo-notifications` i endpoint rejestracji tokenu.
- Wersja iOS — ten sam kod źródłowy, potrzebny Mac do buildu
  (`npx expo run:ios` / `eas build -p ios`) oraz analogiczny do Androida
  przycisk z fallbackiem do App Store (Universal Links dla `starlinkee://`
  albo prościej: sam link do App Store, skoro na iOS i tak nie ma NFC
  automatycznego otwierania appki spoza App Clips).
