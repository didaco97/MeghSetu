# Deploy MeghSetu on Netlify

This is a full-stack deployment: Vite assets are served from `dist`, and two Netlify Functions serve the existing `/api/*` routes. The landing page, animated phone walkthrough and concept demos are included.

## Build settings

For the [didaco97/MeghSetu](https://github.com/didaco97/MeghSetu) repository, leave Netlify's base directory blank: the application is at the repository root. A local checkout can have a different folder name, such as `meghsetu-prototype`. If deploying a parent repository containing the entire `SmartIndiaHackathon` workspace instead, set its base directory to `meghsetu-prototype`.

| Setting | Value |
| --- | --- |
| Node version | 22 (configured in `.node-version` and `netlify.toml`) |
| Build command | `npm run build` |
| Publish directory | `dist` |
| Functions directory | `netlify/functions` |

The committed `netlify.toml` supplies these settings. Keep `package-lock.json` with the project so dependency installation is reproducible.

## Environment variables

In the site's Netlify environment-variable settings, add these as **secret values available to Functions**, then deploy/redeploy:

| Variable | Purpose |
| --- | --- |
| `PERPLEXITY_API_KEY` | Text assistant |
| `SARVAM_API_KEY` | Speech recognition and voice playback |

Weather forecasts, comparison, crop planning, maps and concept demos do not require these paid-service keys. Missing assistant/voice keys produce a clear unavailable message and leave weather features usable.

`OPENAI_API_KEY` is **not needed on Netlify**: the generated illustrations are already included in `public/assets`. It is only used for local artwork generation. `PORT` is local-only. Do not put secrets in `netlify.toml`, source files, the public directory or `VITE_` variables. `.env.local` is excluded from the source package and Git; it is not a deployment mechanism.

## Deploy from Git

1. Put this project in a Git repository and connect that repository using Netlify's **Add new project → Import an existing project** flow.
2. Confirm the base/build/publish settings above and add the Functions environment variables.
3. Deploy. Open `/api/health` on the deployed domain to verify that weather is enabled and assistant/voice reflect the configured keys.
4. Run a forecast, change a crop/stage, open the comparison, and try the assistant and microphone over the site's HTTPS URL.

## Deploy from your computer

In the extracted project directory:

```powershell
npm ci
npx netlify login
npx netlify sites:create
npx netlify link
```

The create command is only needed for a new site. `link` selects the site that should receive this project. Add the secret variables in Netlify's site settings, then publish the complete app:

```powershell
npx netlify deploy --build --prod
```

Use Git deployment or the CLI for the complete prototype. A manual drag-and-drop upload of **only `dist`** publishes the visuals but does not package the backend functions, so weather/chat/voice would fail.

## Local Netlify verification

```powershell
npm test
npm run build:netlify
npm run dev:netlify -- --offline --no-open
```

The Netlify preview URL is `http://localhost:8888`. This command first builds the production frontend, then serves it through a small static preview server with Netlify's function routing and a local Netlify Blobs store. The preview server normalizes Windows asset-path separators from the Netlify CLI; deployed assets are served directly by Netlify's CDN. Restart the command after frontend edits; use the ordinary `npm run dev` on port 3074 for hot-reload development. The Netlify preview can use your local `.env.local`; the offline flag disables Netlify account/network discovery, not the application's external weather requests.

## Serverless behavior

- `forecast.mjs` serves `/api/forecast` as a native streaming response. The processing view receives the actual forecast steps while the request runs.
- `api.mjs` wraps the shared Express routes for health, search, crop plans, assistant and voice. API route errors return JSON. The frontend uses hash routes, so there is no catch-all HTML rewrite that could mask missing scripts or API routes. Friendly `/workspace/*` and `/mobile-preview` URLs redirect to the equivalent hash routes.
- Forecast summaries are stored in a **deploy-specific Netlify Blobs store**, so a fresh function instance can retrieve the run for crop planning and assistant context. Previews and production are isolated. Runs are valid for one hour; expired records are rejected and removed when accessed. Other expired records remain in that deploy's Blobs store until the store/deploy is cleaned up. No voice recordings or conversations are stored there.
- A new deployment requires visitors to refresh their forecast because sessions belong to the deployment that created them. Open-Meteo's ten-minute cache is per function instance and is only an optimization.
- Same-origin checks accept the actual Netlify, preview or custom-domain origin. Function edge rate limits and per-instance request limits are configured; the app still has no account system or global spending quota.
- Assistant requests stop after 45 seconds, below Netlify's 60-second execution window. Voice uploads are capped at 4 MB to leave room for multipart and binary encoding overhead.
- The `sharp` dependency override keeps the local Netlify CLI image tooling on its patched release. It is a development dependency and is not shipped as a browser feature.
- MapLibre was updated to 6.11.2 with its ES-module import so the deployment uses the patched map dependency.

## Troubleshooting

- **`/api/health` returns HTML:** the functions were not deployed; verify the project base and functions directory, then deploy the complete project.
- **Assistant or voice reports unavailable:** add the corresponding secret with Functions scope, then redeploy.
- **Crop plan requests a refresh:** the run is older than one hour or belongs to a previous deployment.
- **Forecast unavailable:** check the function log and Open-Meteo availability; no fallback weather values are fabricated.
- **Microphone unavailable:** use the HTTPS deployment and grant microphone permission when you choose to record.

References: [Netlify Express integration](https://docs.netlify.com/build/frameworks/framework-setup-guides/express/), [native streaming and function API](https://docs.netlify.com/build/functions/api/), [function limits](https://docs.netlify.com/build/functions/configuration/), [Netlify Blobs](https://docs.netlify.com/build/data-and-storage/netlify-blobs/).
