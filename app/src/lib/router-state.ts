/**
 * Router state helpers — small, side-effect-light utilities the shell router
 * uses to harden rapid-tap and async-load edge cases. Kept isolated from
 * main.ts so the state machine in main.ts stays readable.
 *
 * Responsibilities:
 *   - Track the most-recent navigation "generation" so async callbacks
 *     (iframe load, smart-resume routing, timeouts) can detect they've been
 *     superseded and self-cancel.
 *   - Record `alarmFired` events so deep-link routes that should only be
 *     reachable when the alarm fired (frqncy://wake) can gate-check before
 *     navigating. Without this, a malicious or stale deep link could
 *     short-circuit users into the post-alarm reflection flow.
 *   - Detect whether `Capacitor.isNativePlatform()` actually exists and is a
 *     real function — Capacitor's web shim sometimes leaves the global
 *     present-but-broken.
 */

/** Monotonic counter that bumps on every shell-level navigation. Async
 *  callbacks read it at the start of their work and compare at the end to
 *  decide whether to apply state. */
let navGeneration = 0;

export function bumpNavGeneration(): number {
  navGeneration = (navGeneration + 1) | 0;
  return navGeneration;
}

export function currentNavGeneration(): number {
  return navGeneration;
}

/** Last-alarm-fired timestamp, populated by FrqncyAlarm.addListener and
 *  persisted to localStorage so it survives the WebView destroy/restore
 *  that Android does when the alarm activity launches. */
const ALARM_FIRED_KEY = 'frqncy.alarm.last_fired_ts';
const ALARM_FIRED_WINDOW_MS = 10 * 60 * 1000; // 10 min after fire counts

export function recordAlarmFired(ts: number = Date.now()): void {
  try {
    localStorage.setItem(ALARM_FIRED_KEY, String(ts));
  } catch {
    /* private-mode storage denied — alarm flow still works, gate just
       falls back to "trust the deep link" in this single session. */
  }
}

/** Was an alarm fired in the last 10 minutes? Used to gate frqncy://wake
 *  deep links so they can't be spoofed to skip into the reflection flow. */
export function alarmFiredRecently(): boolean {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(ALARM_FIRED_KEY);
  } catch {
    return false;
  }
  if (!raw) return false;
  const ts = parseInt(raw, 10);
  if (!Number.isFinite(ts)) return false;
  const age = Date.now() - ts;
  return age >= 0 && age <= ALARM_FIRED_WINDOW_MS;
}

/** Stricter platform check than `(window as any).Capacitor?.isNativePlatform?.()`.
 *  Catches the case where the global is present but the function throws or
 *  returns a non-boolean (older versions, web shim quirks). */
export function isNativeRuntime(): boolean {
  try {
    const cap = (window as { Capacitor?: { isNativePlatform?: unknown } }).Capacitor;
    if (!cap || typeof cap.isNativePlatform !== 'function') return false;
    const v = (cap.isNativePlatform as () => unknown)();
    return v === true;
  } catch {
    return false;
  }
}

/** Resolves true if the given timestamp is within `windowMs` of *now* and is
 *  not in the future by more than `skewMs`. Used by smart-resume to reject
 *  corrupt or clock-skewed `last_arm_ts` values. */
export function isWithinPastWindow(
  ts: number,
  windowMs: number,
  skewMs: number = 5 * 60 * 1000,
): boolean {
  if (!Number.isFinite(ts)) return false;
  const ageMs = Date.now() - ts;
  // Reject hard-future timestamps (clock skew or corruption) beyond skewMs.
  if (ageMs < -skewMs) return false;
  return ageMs <= windowMs;
}
