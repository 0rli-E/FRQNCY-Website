/**
 * /api/alarm-error — Best-effort telemetry sink for FRQNCY alarm failures.
 *
 * POST { manufacturer, sdk_int, error, app_version }
 *
 * Called by AlarmReceiver.kt on Android when `startForegroundService` throws
 * `ForegroundServiceStartNotAllowedException` (or any other startup failure).
 * Stream 2 flagged this as the most common silent-failure mode on Android
 * 14+ — wiring this from day one means we see the failure rate before users
 * complain.
 *
 * Privacy posture (per CLAUDE.md / FRQNCY editorial values):
 *   - No user IDs, no device IDs, no fingerprints. Just manufacturer + SDK
 *     level + the exception message + the app version.
 *   - No DB, no KV, no IP logging. Output goes to the Cloudflare Pages
 *     request log only (visible via `wrangler pages tail`).
 *   - Field length capped to prevent log spam.
 *   - Returns 204 unconditionally so a malicious client can't enumerate
 *     accepted vs rejected payloads.
 *
 * Rate limit: not implemented for v1. The endpoint costs ~0 (no DB write,
 * no external call), and the only legitimate caller is AlarmReceiver firing
 * once per failed alarm. If abuse appears in the request log, add the same
 * IP-bucketed rate limiter pattern used in /api/export.
 */

const STR_MAX = 200;

function clip(value, max) {
  if (value == null) return '';
  const s = String(value);
  return s.length > max ? s.slice(0, max) : s;
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const safe = {
      ts: new Date().toISOString(),
      manufacturer: clip(body.manufacturer, 64),
      sdk_int: Number.isInteger(body.sdk_int) ? body.sdk_int : 0,
      error: clip(body.error, STR_MAX),
      app_version: clip(body.app_version, 32),
    };
    // Single-line JSON so log aggregators can parse it.
    console.log('[alarm-error] ' + JSON.stringify(safe));
  } catch (err) {
    // Swallow JSON parse errors etc — best-effort sink, no client feedback.
    console.warn('[alarm-error] bad payload: ' + (err && err.message));
  }
  return new Response(null, { status: 204 });
}

// CORS preflight allow — though AlarmReceiver doesn't set custom headers, a
// browser test from frqncy.network would.
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
