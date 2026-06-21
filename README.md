# Urban Bulk SMS

Two things in one deploy:

- **`/`** — the marketing website (loud, dark). Its hero runs the real app live, and every "Open the app" button links to `/app`.
- **`/app`** — the app itself (the phone UI). Self-contained.
- **`/api/translate`** — serverless function that translates Swahili → English via NVIDIA. The key is read from an env var only, never shipped to the browser. If it's unavailable, the app falls back to a built-in offline phrasebook.

## Folder structure

```
index.html          → marketing website  (served at /)
app/index.html      → the app            (served at /app)
api/translate.js    → translation function (served at /api/translate)
vercel.json         → function config
.env.example        → shows the env var NAME (never the real key)
```

## Deploy on Vercel (from GitHub)

1. **Push this folder's contents to a GitHub repo** (so `index.html` sits at the repo root).
2. **vercel.com → Add New → Project → Import** your repo → **Deploy** (zero config).
3. **Add your key:** Vercel → Project → **Settings → Environment Variables**
   - Name: `NVIDIA_API_KEY`
   - Value: your real `nvapi-...` key
   - Tick **Production** (and Preview) → Save.
4. **Redeploy** so the env var is picked up.
5. Visit your site → **Open the app** → Inbox → **Translate all** uses real AI.

## Run locally (optional)

```bash
npm i -g vercel
echo "NVIDIA_API_KEY=your-real-key" > .env   # gitignored
vercel dev
```

## Security

- The key lives **only** in Vercel env vars (or a local, gitignored `.env`). It is **never** in any committed file — front-end code is public.
- If a key ever lands in committed code, a screenshot, or a chat, **rotate it** immediately.

## About the actual SMS sending

Sending through your own SIM one-by-one needs an **Android gateway app** (e.g. textbee / sms-gate) that holds the SIM and pulls the send queue. This repo is the **website + control UI + translation backend** — pair it with that gateway to send for real. iOS can't send through a SIM; Android only.
