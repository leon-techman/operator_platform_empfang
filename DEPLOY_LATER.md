# Deploy & GitHub — später ausführen (wenn ich Bescheid gebe)

> Gespeicherte Anleitung. Erst ausführen, wenn du so weit bist.

## Auf GitHub pushen (von deinem Rechner, im Projektordner)

```
git init
git add .
git commit -m "Empfang: echte Google-Integrationen + Agent-Bubble"
git branch -M main
git remote add origin https://github.com/leon-techman/operator_platform.git
git push -u origin main
```

Ist Vercel mit dem Repo verbunden, deployt es automatisch.

## Danach in Vercel (Details in SETUP.md)

1. Env-Variablen setzen:
   - `GOOGLE_CLIENT_ID` = `790308596407-3ttkst6rhs25kqjmjv17hhg13r5m1jmq.apps.googleusercontent.com`
   - `GOOGLE_CLIENT_SECRET` = (dein Secret aus der Google Cloud Console — nie in den Code)
   - `SESSION_SECRET` = lange Zufallskette (`openssl rand -hex 32`)
2. Vercel KV (Upstash) Store anlegen + verbinden → setzt `KV_REST_API_URL` / `KV_REST_API_TOKEN` automatisch.
3. Google Cloud: Gmail-, Calendar-, People-API aktivieren; Redirect-URI `https://operator-platform-three.vercel.app/api/auth/callback`; Testnutzer eintragen.
4. Neu deployen.

## Was ist der Client-Secret?

Das geheime Gegenstück zur Client-ID. Google Cloud Console → APIs & Dienste → Anmeldedaten →
deine OAuth-Web-Client-ID → „Client secret". Nur als Env-Variable in Vercel eintragen, niemals in Code/Chat.
