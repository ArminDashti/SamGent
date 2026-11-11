# SamGent

Operator stack for **owned / consented** Android devices: collect SMS and call logs, send them to a local API, parse useful fields from SMS, and browse results in a WebUI.

## Folders

| Path | Role |
|------|------|
| `api/` | Fastify + SQLite ingest, auth, SMS parsers, query API |
| `webui/` | React + Vite + Tailwind + shadcn operator console |
| `android-app/` | Kotlin client (visible app; not stealth) |

## Quick start (API + WebUI)

```bash
docker compose up --build -d
```

- API: http://localhost:3980/health  
- WebUI: http://localhost:3981  
- Login: `armin` / `dopadopa123`

SQLite lives in the Docker volume `samgent-sqlite` (`/data/samgent.db` in the API container).

## Android

1. Open `android-app/` in Android Studio.
2. In WebUI **Devices**, create a device and copy the one-time API key.
3. On the phone: server URL (LAN IP or emulator `http://10.0.2.2:3980`) + paste API key → Save.
4. Grant SMS / call-log permissions, then sync.

## Consent

Use only on devices you own or where the user has clearly consented. The Android client stays visible with sync status; it is not designed to hide from the user.

## Local API without Docker

```bash
cd api && npm install && npm start
```

Copy `api/.env.example` to `api/.env` if needed.
