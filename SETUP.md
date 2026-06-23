# OPERATOR — Echte Google-Integrationen (Gmail, Kalender, Kontakte)

Diese Anleitung schaltet die echte Anbindung frei. Danach kannst du im Tab **Integrationen**
echte Google-Konten verbinden (auch mehrere gleichzeitig); ihre Mails und Termine laufen im
**Empfang** zusammen.

Deine OAuth-Client-ID ist bereits hinterlegt:
`790308596407-3ttkst6rhs25kqjmjv17hhg13r5m1jmq.apps.googleusercontent.com`

---

## 1. Google Cloud Console einrichten

1. Öffne <https://console.cloud.google.com/> und wähle das Projekt, zu dem die Client-ID gehört.
2. **APIs aktivieren** (APIs & Dienste → Bibliothek), jeweils „Aktivieren":
   - Gmail API
   - Google Calendar API
   - People API (Kontakte)
3. **OAuth-Zustimmungsbildschirm** (APIs & Dienste → OAuth consent screen):
   - Nutzertyp: **Extern**
   - Trage dich unter **Testnutzer** mit jeder Gmail-Adresse ein, die du verbinden willst.
   - Im **Testing**-Modus funktionieren die Scopes sofort. (Hinweis: Refresh-Tokens laufen im
     Testing-Modus nach 7 Tagen ab — dann einmal neu verbinden. Für Dauerbetrieb die App von
     Google verifizieren lassen.)
4. **OAuth-Client-ID** (APIs & Dienste → Anmeldedaten → deine Web-Client-ID):
   - **Autorisierte JavaScript-Quellen:**
     `https://operator-platform-three.vercel.app`
   - **Autorisierte Weiterleitungs-URIs:**
     `https://operator-platform-three.vercel.app/api/auth/callback`
   - (Für lokales Testen zusätzlich `http://localhost:3000` bzw. `.../api/auth/callback`.)
   - **Client-Secret** kopieren (kommt in Schritt 3 als Env-Variable — niemals in den Code!).

---

## 2. Token-Speicher (Vercel KV) anlegen

Damit verbundene Konten dauerhaft gespeichert werden:

1. Vercel-Dashboard → dein Projekt → **Storage** → **Create Database** → **KV** (Upstash Redis).
2. Mit dem Projekt **verbinden** („Connect"). Vercel setzt dann automatisch
   `KV_REST_API_URL` und `KV_REST_API_TOKEN`.

> Ohne KV läuft die Seite weiter, aber Verbindungen werden nicht gespeichert (du siehst im
> Tab Integrationen einen Hinweis).

---

## 3. Environment-Variablen in Vercel setzen

Projekt → **Settings → Environment Variables** (Production + Preview):

| Name | Wert |
|------|------|
| `GOOGLE_CLIENT_ID` | `790308596407-3ttkst6rhs25kqjmjv17hhg13r5m1jmq.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | (dein Secret aus der Google Cloud Console) |
| `SESSION_SECRET` | lange Zufallskette, z.B. `openssl rand -hex 32` |
| `KV_REST_API_URL` | (automatisch durch KV-Verbindung) |
| `KV_REST_API_TOKEN` | (automatisch durch KV-Verbindung) |

Danach einmal **neu deployen** (Deployments → Redeploy), damit die Variablen greifen.

---

## 4. Benutzen

1. Auf der Seite: **Integrationen** öffnen → **„+ Google-Konto verbinden"**.
2. Google-Login + Zustimmung → du landest wieder auf der Seite, das Konto erscheint in der Liste.
3. Schritt wiederholen für **weitere Konten** (mehrere gleichzeitig möglich).
4. **Empfang** öffnen → echte Mails (Label „live") und Termine erscheinen, nach Wichtigkeit sortiert.
5. Antworten: „✶ Empfang antworten lassen" erstellt einen **Gmail-Entwurf** (kein Auto-Versand) —
   du prüfst und sendest ihn in Gmail.

---

## Was ist echt — und was nicht

- **Echt:** Gmail (lesen), Google Kalender (lesen), Google Kontakte (lesen), Antwort-Entwürfe (Gmail).
- **Weiterhin simuliert:** WhatsApp Business (braucht Meta-/WhatsApp-Business-API-Genehmigung) und
  Anrufverlauf (kein offenes Web-API). Diese Kanäle bleiben als Demo sichtbar.

## Scopes

`openid email profile`, `gmail.readonly`, `gmail.compose`, `calendar.readonly`, `contacts.readonly`.

## Lokal testen (optional)

```
npm install
npm i -g vercel
vercel dev
```
Dann `.env.example` nach `.env` kopieren und ausfüllen (Redirect-URI auf localhost anpassen).
