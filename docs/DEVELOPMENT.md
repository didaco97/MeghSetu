# MeghSetu development guide

The root [README](../README.md) describes the complete solution design. This guide covers installing, running and maintaining the source in this repository.

## Requirements

- Node.js 22.12 or newer and npm.
- Network access for weather, geocoding and map tiles.
- Optional server-side Perplexity and Sarvam credentials for assistant and voice requests.

## Install and run

```bash
git clone https://github.com/didaco97/MeghSetu.git
cd MeghSetu
npm ci
```

Copy `.env.example` to `.env.local` using your editor or shell:

```powershell
Copy-Item .env.example .env.local
```

On macOS/Linux, use `cp .env.example .env.local`.

| Variable | Purpose |
| --- | --- |
| `PORT` | Optional local port, default 3074 |
| `PERPLEXITY_API_KEY` | Assistant requests |
| `SARVAM_API_KEY` | Speech transcription and playback |
| `OPENAI_API_KEY` | Optional local artwork generation; not required by the web application |

Keep secrets in server configuration. Do not put them in `VITE_` variables, public assets or committed files. Missing optional provider credentials leave the corresponding assistant/voice service unavailable.

```bash
npm run dev
```

Open [http://localhost:3074](http://localhost:3074). The development server binds to `127.0.0.1`.

For a local production build:

```bash
npm run build
npm start
```

## Deployment

Follow [NETLIFY_DEPLOY.md](NETLIFY_DEPLOY.md) for Git/CLI deployment, Functions secrets, local Netlify verification and troubleshooting. Deploy the complete repository so the API functions are included.

## Commands and checks

```bash
npm test
npm run build
npm run build:netlify
```

The automated tests exercise weather normalization, missing values, advisory rules, streamed responses, shared run storage, expiry, request checks and multipart handling. Paid providers are replaced with test doubles in the automated suite.

To check actual weather requests through the local Netlify runtime, start this command in one terminal:

```bash
npm run dev:netlify -- --offline --no-open
```

Then run in another terminal:

```bash
node tests/netlify-live-smoke.mjs
```

This smoke check uses the weather API but does not make paid assistant or voice calls. `tests/live-smoke.mjs` does call configured paid services. The optional Playwright scripts `tests/browser-smoke.mjs` and `tests/mobile-final.mjs` contain the original development machine's Chromium path; configure their `executablePath` before running on another machine. `tests/private-config-check.mjs` needs `.env.local`, a frontend build and the local server.

## Source layout

| Directory | Contents |
| --- | --- |
| `src/` | Landing page, workspace, maps, charts, chat, interactive concept screens and CSS |
| `server/` | Express routes, weather retrieval, advisory rules, request policies and run-store adapters |
| `netlify/functions/` | Streaming forecast entry point and Express adapter |
| `public/assets/` | Bundled PNG/WebP artwork |
| `tests/` | Automated tests and optional integration/browser scripts |
| `docs/` | Development, deployment and artwork documentation |

## Runtime data behavior

The weather adapter preserves source attribution, retrieval time, returned grid coordinates and missing values. The provider does not supply an issued-model timestamp in this response, so the application leaves it unset. Weather requests use a ten-minute per-instance cache.

Forecast run summaries are valid for one hour. Local development uses memory; Netlify uses a deploy-specific Blobs store so different function instances can retrieve a run. Expired blobs are deleted when accessed; other expired records require store/deploy cleanup. Deployment changes require a fresh forecast run. The application backend does not persist voice recordings or conversations.

Voice recordings stop after 25 seconds and have a 4 MB upload limit. Requests send recordings to Sarvam, questions and selected forecast context to Perplexity, and coordinate queries to Open-Meteo as the corresponding features are used. Request-size limits, timeouts, origin checks and rate limits are implemented; identity and global spending controls require separate operational configuration.

The installed JavaScript application and its automated checks are distinct from the complete research architecture in the README. Software tests do not establish downscaling accuracy. Model training, satellite processing and administrative aggregation require their own datasets, implementations and scientific evaluation.

## Artwork and attribution

- Included OpenAI-generated assets are conceptual artwork, not documentary satellite imagery. Available prompts are in [asset-prompt.txt](asset-prompt.txt) and [artwork/](artwork/).
- The current hero illustration uses `src/HeroVision.jsx` for its accessible SVG diagram. The earlier `src/CloudScene.jsx` remains in source and is not loaded by the landing page.
- Map attribution belongs to [OpenStreetMap contributors](https://www.openstreetmap.org/copyright). Respect the [tile usage policy](https://operations.osmfoundation.org/policies/tiles/).
- Fraunces, DM Sans and the Noto Sans families retain their font licenses. Third-party package versions are recorded in `package-lock.json` and retain their respective licenses.
