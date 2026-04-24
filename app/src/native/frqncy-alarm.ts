/**
 * FrqncyAlarm — TypeScript interface for the custom native alarm plugin.
 *
 * Native implementations live in:
 *   android: app/src/main/java/network/frqncy/alarm/
 *   ios:     App/FrqncyAlarm/
 *
 * This wraps the platform-specific reality:
 *   - Android: AlarmManager.setAlarmClock() + foreground service + full-screen activity
 *   - iOS:    UNUserNotifications (time-sensitive) + silent-audio keep-alive
 *
 * The JS layer never cares which path is taken — it just calls schedule() and
 * listens for 'alarmFired' events.
 */

import { registerPlugin, type PluginListenerHandle } from '@capacitor/core';

export type Moment = 'morning' | 'evening' | 'stillness' | 'release';

export interface ScheduleOptions {
  /** Stable ID for this alarm (so it can be updated or cancelled). */
  id: string;
  /** Epoch milliseconds for fire time. */
  timestamp: number;
  /** Which wake/sleep flow to launch when the alarm fires. */
  moment: Moment;
  /** Optional URL (HLS or direct) for the audio to play. Falls back to bundled default. */
  audioUrl?: string;
  /** Optional URL for the video. Screen dim / frequency field. */
  videoUrl?: string;
  /** Label shown on lock screen (Android) and in notification. */
  label?: string;
  /** Repeat cadence — daily is the typical value for alarms. */
  repeat?: 'none' | 'daily' | 'weekdays' | 'weekends';
  /** Fade-in duration in seconds (audio ramps 0% → 100% over this). Default 90. */
  fadeInSeconds?: number;
}

export interface AlarmInfo extends ScheduleOptions {
  armed: boolean;
  nextFire: number;
}

export interface AlarmFiredEvent {
  id: string;
  moment: Moment;
  firedAt: number;
}

export interface PermissionStatus {
  /** Can schedule exact alarms (Android USE_EXACT_ALARM / SCHEDULE_EXACT_ALARM). */
  exactAlarm: 'granted' | 'denied' | 'not-needed';
  /** Full-screen intent permission (Android 14+). */
  fullScreen: 'granted' | 'denied' | 'not-needed';
  /** Notification permission. */
  notifications: 'granted' | 'denied' | 'prompt';
  /** Ignore battery optimizations (OEM-specific). */
  batteryExempt: 'granted' | 'denied' | 'not-needed';
  /** iOS only: background audio mode declared. */
  backgroundAudio: 'granted' | 'denied' | 'not-applicable';
}

export interface OemGuidanceResult {
  /** Manufacturer name, e.g., "Xiaomi". */
  manufacturer: string;
  /** Whether this OEM is known to aggressively kill background apps. */
  isAggressive: boolean;
  /** Deep-link intent to open the right settings page, or null if not available. */
  settingsDeepLink: string | null;
  /** Human-readable guidance to show the user. */
  instructions: string;
}

export interface FrqncyAlarmPlugin {
  schedule(options: ScheduleOptions): Promise<{ id: string; nextFire: number }>;
  cancel(options: { id: string }): Promise<void>;
  list(): Promise<{ alarms: AlarmInfo[] }>;
  requestPermissions(): Promise<PermissionStatus>;
  checkPermissions(): Promise<PermissionStatus>;
  /** Start iOS silent-audio keep-alive. No-op on Android. Gated to armed-alarm state. */
  armKeepAlive(): Promise<void>;
  disarmKeepAlive(): Promise<void>;
  /** Returns OEM-specific guidance for the user (Android only). */
  getOemGuidance(): Promise<OemGuidanceResult>;

  addListener(
    eventName: 'alarmFired',
    listener: (event: AlarmFiredEvent) => void,
  ): Promise<PluginListenerHandle>;
  addListener(
    eventName: 'alarmDismissed',
    listener: (event: { id: string; dismissedAt: number }) => void,
  ): Promise<PluginListenerHandle>;
}

export const FrqncyAlarm = registerPlugin<FrqncyAlarmPlugin>('FrqncyAlarm');
