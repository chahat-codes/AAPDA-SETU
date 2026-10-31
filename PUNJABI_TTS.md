# Punjabi voice setup

AapdaSetu is a Vite/Preact frontend. `server.mjs` adds a same-origin Node route for Punjabi audio; the browser never receives Google credentials. Hindi and English continue to use browser SpeechSynthesis.

The current [Google Cloud voice catalog](https://docs.cloud.google.com/text-to-speech/docs/list-voices-and-types) lists Punjabi (India), locale `pa-IN`, with Standard voices (`pa-IN-Standard-A` through `pa-IN-Standard-D`), WaveNet voices (`pa-IN-Wavenet-A` through `pa-IN-Wavenet-D`), and Chirp 3 HD voices. This integration uses the catalog-listed `pa-IN-Standard-A` and MP3 output. Google can change its catalog, so if that voice is rejected, the app reports an unsupported-voice error rather than substituting a different language.

## Google Cloud setup

1. Choose a Google Cloud project, enable the Cloud Text-to-Speech API, and enable billing. TTS usage may incur charges; set a project budget and API quota before making the service public.
2. Set up authentication using Application Default Credentials. For local development install the Google Cloud CLI, run `gcloud init`, then `gcloud auth application-default login`. Grant `roles/serviceusage.serviceUsageConsumer` if the account needs permission to use the quota project.
3. Copy `.env.example` to `.env` and set `GOOGLE_CLOUD_PROJECT` to the project ID. This variable is non-secret and is read only by the Node server. `.env` is git-ignored.
4. Start the API and Vite in separate terminals:

   ```sh
   npm run api:dev
   npm run dev
   ```

   Vite proxies `/api` to the local Node route. The local Node route obtains an access token from `gcloud` ADC. No key file or client-side API key is needed.

## Deploy on Cloud Run

The included Dockerfile builds and serves the existing frontend and the TTS route from one origin. Create a dedicated user-managed service account, grant it only the permissions needed to call the enabled Text-to-Speech API and use the project quota, and attach it as the Cloud Run service identity. Do not create or upload a service-account key. Cloud Run obtains short-lived access tokens from its metadata server.

With Google Cloud CLI configured and the project/API/billing set up:

```sh
gcloud run deploy aapdasetu \
  --source . \
  --region YOUR_REGION \
  --service-account YOUR_TTS_SERVICE_ACCOUNT \
  --set-env-vars GOOGLE_CLOUD_PROJECT=YOUR_PROJECT_ID \
  --allow-unauthenticated
```

Replace all uppercase placeholders. Because the service is public, keep the Cloud Run service at a small maximum instance count, watch the Text-to-Speech quota and billing, and add Cloud Armor or an authenticated gateway if the app needs stronger abuse controls. The route limits each request to 5,000 text bytes and keeps a short, bounded, in-memory audio cache per server instance.

## Browser test

Open the deployed app (or local Vite app with the API server running), select Punjabi, and press **ਪੰਜਾਬੀ ਆਵਾਜ਼ ਜਾਂਚੋ**. The player reports generation status and exposes native audio controls. If automatic playback is blocked, press Play. The first successful request should return an MP3 from the server; repeat the same sample to exercise the in-memory cache. Verify the browser's Network panel shows `POST /api/tts/punjabi` returning `200` with `audio/mpeg` and `X-AapdaSetu-Voice: pa-IN-Standard-A`.

Known UI errors distinguish missing server/project configuration, missing credentials, permission/API setup, unsupported voice, quota, provider, and network failures. Audio is not available until the Google project, billing, API, and server identity are configured. No service account JSON, private key, Google API key, or `VITE_*` secret belongs in this repository or a client bundle.
