import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { extname, resolve, sep } from "node:path";

const execFileAsync = promisify(execFile);
const PORT = Number(process.env.PORT || process.env.API_PORT || 8787);
const HOST = process.argv.includes("--api-only") ? "127.0.0.1" : "0.0.0.0";
const API_ONLY = process.argv.includes("--api-only");
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT?.trim();
const VOICE_NAME = "pa-IN-Standard-A";
const MAX_TEXT_BYTES = 5000;
const MAX_BODY_BYTES = 12_000;
const CACHE_LIMIT = 64;
const CACHE_TTL_MS = 5 * 60 * 1000;
const audioCache = new Map();

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

function sendJson(response, status, code, message) {
  const body = JSON.stringify({ error: { code, message } });
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(body),
  });
  response.end(body);
}

function allowSameOrigin(request) {
  const origin = request.headers.origin;
  if (!origin) return true;
  try {
    return new URL(origin).host === request.headers.host;
  } catch {
    return false;
  }
}

async function readJsonBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw Object.assign(new Error("body too large"), { status: 413 });
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw Object.assign(new Error("invalid json"), { status: 400 });
  }
}

async function getAccessToken() {
  if (process.env.K_SERVICE) {
    const metadataResponse = await fetch(
      "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
      { headers: { "Metadata-Flavor": "Google" }, signal: AbortSignal.timeout(3000) },
    );
    if (!metadataResponse.ok) throw Object.assign(new Error("metadata token unavailable"), { code: "credentials_unavailable" });
    const metadata = await metadataResponse.json();
    if (!metadata.access_token) throw Object.assign(new Error("metadata token missing"), { code: "credentials_unavailable" });
    return metadata.access_token;
  }

  try {
    const { stdout } = await execFileAsync("gcloud", ["auth", "application-default", "print-access-token"], {
      timeout: 5000,
      maxBuffer: 4096,
    });
    const token = stdout.trim();
    if (!token) throw new Error("empty ADC token");
    return token;
  } catch {
    throw Object.assign(new Error("local application credentials unavailable"), { code: "credentials_unavailable" });
  }
}

function getCachedAudio(cacheKey) {
  const cached = audioCache.get(cacheKey);
  if (!cached) return undefined;
  if (Date.now() - cached.createdAt > CACHE_TTL_MS) {
    audioCache.delete(cacheKey);
    return undefined;
  }
  audioCache.delete(cacheKey);
  audioCache.set(cacheKey, cached);
  return cached.audio;
}

function cacheAudio(cacheKey, audio) {
  audioCache.set(cacheKey, { audio, createdAt: Date.now() });
  while (audioCache.size > CACHE_LIMIT) audioCache.delete(audioCache.keys().next().value);
}

function classifyGoogleError(status, message = "") {
  const lower = message.toLowerCase();
  if (status === 429 || lower.includes("quota") || lower.includes("rate limit")) return "quota_exceeded";
  if (lower.includes("voice") && (status === 400 || lower.includes("not found") || lower.includes("unsupported"))) return "unsupported_voice";
  if (status === 401 || status === 403) return "permission_denied";
  if (status >= 500) return "provider_unavailable";
  return "request_failed";
}

async function synthesizePunjabi(text) {
  if (!PROJECT_ID) throw Object.assign(new Error("GOOGLE_CLOUD_PROJECT is missing"), { code: "configuration_missing" });

  const cacheKey = createHash("sha256").update(`${VOICE_NAME}\0${text}`).digest("hex");
  const cached = getCachedAudio(cacheKey);
  if (cached) return cached;

  const accessToken = await getAccessToken();
  const response = await fetch("https://texttospeech.googleapis.com/v1/text:synthesize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "x-goog-user-project": PROJECT_ID,
    },
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: "pa-IN", name: VOICE_NAME },
      audioConfig: { audioEncoding: "MP3" },
    }),
    signal: AbortSignal.timeout(30_000),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const providerMessage = result?.error?.message || "Google Cloud Text-to-Speech request failed";
    throw Object.assign(new Error(providerMessage), {
      code: classifyGoogleError(response.status, providerMessage),
      status: response.status === 429 ? 429 : response.status === 400 ? 422 : response.status === 403 ? 403 : 502,
    });
  }
  if (typeof result.audioContent !== "string" || !result.audioContent) {
    throw Object.assign(new Error("Google returned no audio"), { code: "invalid_audio", status: 502 });
  }

  const audio = Buffer.from(result.audioContent, "base64");
  cacheAudio(cacheKey, audio);
  return audio;
}

async function handleTts(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, "method_not_allowed", "Use POST for Punjabi speech.");
  }
  if (!allowSameOrigin(request)) return sendJson(response, 403, "origin_not_allowed", "Cross-origin requests are not allowed.");
  if (!request.headers["content-type"]?.includes("application/json")) {
    return sendJson(response, 415, "unsupported_content_type", "Send a JSON request.");
  }

  let body;
  try {
    body = await readJsonBody(request);
  } catch (error) {
    return sendJson(response, error.status || 400, "invalid_request", error.status === 413 ? "Request is too large." : "Request body must be valid JSON.");
  }

  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text) return sendJson(response, 400, "invalid_request", "Punjabi text is required.");
  if (Buffer.byteLength(text, "utf8") > MAX_TEXT_BYTES) {
    return sendJson(response, 413, "text_too_long", "Text must be 5,000 bytes or fewer.");
  }

  try {
    const audio = await synthesizePunjabi(text);
    response.writeHead(200, {
      "Content-Type": "audio/mpeg",
      "Content-Length": audio.length,
      "Cache-Control": "private, no-store",
      "X-AapdaSetu-Voice": VOICE_NAME,
    });
    response.end(audio);
  } catch (error) {
    const code = error.code || (error.name === "TimeoutError" ? "provider_unavailable" : "provider_unavailable");
    const status = error.status || (code === "configuration_missing" || code === "credentials_unavailable" ? 503 : 502);
    if (code !== "credentials_unavailable") console.error(`Punjabi TTS failed (${code}${error.status ? `, upstream ${error.status}` : ""}).`);
    const messages = {
      configuration_missing: "Punjabi voice service is not configured on this server.",
      credentials_unavailable: "Server credentials are unavailable. Configure Google Application Default Credentials.",
      quota_exceeded: "Punjabi voice service quota is exhausted. Try again later.",
      permission_denied: "The server is not permitted to use Google Cloud Text-to-Speech. Check API and service-account permissions.",
      unsupported_voice: "The configured Punjabi voice is not supported. Update the server voice setting.",
      provider_unavailable: "Punjabi voice service is temporarily unavailable.",
      invalid_audio: "Punjabi voice service returned no audio.",
      request_failed: "Punjabi speech could not be generated. Check the server configuration.",
    };
    sendJson(response, status, code, messages[code] || messages.provider_unavailable);
  }
}

async function serveStatic(request, response) {
  const distRoot = resolve("dist");
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname); }
  catch { return sendJson(response, 400, "invalid_path", "Invalid request path."); }
  let filePath = resolve(distRoot, `.${pathname}`);
  if (filePath !== distRoot && !filePath.startsWith(`${distRoot}${sep}`)) {
    return sendJson(response, 403, "invalid_path", "Invalid request path.");
  }
  try {
    if ((await stat(filePath)).isDirectory()) filePath = resolve(filePath, "index.html");
    const contents = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": MIME_TYPES[extname(filePath)] || "application/octet-stream",
      "Cache-Control": extname(filePath) === ".html" ? "no-cache" : "public, max-age=31536000, immutable",
      "Content-Length": contents.length,
    });
    response.end(contents);
  } catch {
    try {
      const index = await readFile(resolve(distRoot, "index.html"));
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" });
      response.end(index);
    } catch {
      sendJson(response, 503, "frontend_not_built", "Build the frontend before starting the production server.");
    }
  }
}

const server = createServer(async (request, response) => {
  const pathname = new URL(request.url, "http://localhost").pathname;
  if (pathname === "/api/tts/punjabi") return handleTts(request, response);
  if (pathname === "/api/health") {
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    return response.end(JSON.stringify({ ok: true }));
  }
  if (!API_ONLY && request.method === "GET") return serveStatic(request, response);
  sendJson(response, 404, "not_found", "API route not found.");
});

server.listen(PORT, HOST, () => console.log(`AapdaSetu ${API_ONLY ? "TTS API" : "server"} listening on ${HOST}:${PORT}`));
