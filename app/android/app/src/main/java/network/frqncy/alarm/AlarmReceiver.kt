/**
 * AlarmReceiver — receives the broadcast fired by AlarmManager.setAlarmClock()
 * and starts AlarmService within the 5-second budget Android 14+ enforces.
 *
 * Hard rules enforced here (per Stream 2 research):
 *   - directBootAware so we can fire after a reboot before the user unlocks.
 *   - exported=false (manifest).
 *   - Acquire a 10-second partial WakeLock defensively (most OEMs grant this
 *     automatically for alarm-clock alarms, but Vivo/Xiaomi sometimes don't).
 *   - Call startForegroundService() and return — do NOT do audio work here.
 *     Receivers have a 10-second ANR budget; audio playback belongs in the
 *     service's onStartCommand.
 *   - Re-schedule the next occurrence of recurring alarms before returning.
 */
package network.frqncy.alarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.PowerManager
import android.util.Log

class AlarmReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != ACTION_FIRE) return
        val id = intent.getStringExtra(EXTRA_ID) ?: return

        val pm = context.getSystemService(Context.POWER_SERVICE) as PowerManager
        val wakeLock = pm.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "FRQNCY:AlarmReceiver"
        )
        wakeLock.setReferenceCounted(false)
        wakeLock.acquire(WAKE_LOCK_TIMEOUT_MS)

        try {
            val store = AlarmStore(context)
            val record = store.get(id)
            if (record == null) {
                Log.w(TAG, "Alarm $id fired but no record in store; dropping")
                return
            }

            // Re-schedule recurring alarms before kicking off the service so
            // the next fire is committed even if AlarmService startup throws.
            rescheduleIfRecurring(context, record, store)

            val serviceIntent = Intent(context, AlarmService::class.java).apply {
                action = AlarmService.ACTION_START
                putExtra(AlarmService.EXTRA_ID, id)
                putExtra(AlarmService.EXTRA_MOMENT, record.moment)
                record.audioUrl?.let { putExtra(AlarmService.EXTRA_AUDIO_URL, it) }
                putExtra(AlarmService.EXTRA_LABEL, record.label)
                putExtra(AlarmService.EXTRA_FADE_IN_SECONDS, record.fadeInSeconds)
            }

            try {
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                    context.startForegroundService(serviceIntent)
                } else {
                    context.startService(serviceIntent)
                }
            } catch (e: IllegalStateException) {
                // Android 14+ ForegroundServiceStartNotAllowedException is a
                // subclass of IllegalStateException. Most common cause: the
                // alarm fired but the system didn't grant the alarm-clock
                // privilege (battery saver, app-standby bucket).
                Log.e(TAG, "Failed to start AlarmService for $id: ${e.message}", e)
                Telemetry.reportAlarmError(context, e)
            } catch (e: SecurityException) {
                // Plugin scheduled successfully but at fire-time the privilege
                // was revoked (rare — usually USE_EXACT_ALARM denial after the
                // fact). Still want to know.
                Log.e(TAG, "SecurityException starting service for $id: ${e.message}", e)
                Telemetry.reportAlarmError(context, e)
            }
        } finally {
            if (wakeLock.isHeld) wakeLock.release()
        }
    }

    private fun rescheduleIfRecurring(context: Context, record: AlarmRecord, store: AlarmStore) {
        val nextTimestamp = nextRecurringTimestamp(record) ?: run {
            store.delete(record.id)
            return
        }
        // Fresh cycle — reset snoozeCount so tomorrow's alarm starts at 0.
        val updated = record.copy(timestamp = nextTimestamp, snoozeCount = 0)
        store.upsert(updated)
        FrqncyAlarmPlugin.scheduleNative(context, updated)
    }

    private fun nextRecurringTimestamp(record: AlarmRecord): Long? {
        val day = 24L * 60L * 60L * 1000L
        return when (record.repeat) {
            "daily" -> record.timestamp + day
            "weekdays" -> {
                var t = record.timestamp + day
                val cal = java.util.Calendar.getInstance().apply { timeInMillis = t }
                while (cal.get(java.util.Calendar.DAY_OF_WEEK) == java.util.Calendar.SATURDAY ||
                    cal.get(java.util.Calendar.DAY_OF_WEEK) == java.util.Calendar.SUNDAY) {
                    t += day
                    cal.timeInMillis = t
                }
                t
            }
            "weekends" -> {
                var t = record.timestamp + day
                val cal = java.util.Calendar.getInstance().apply { timeInMillis = t }
                while (cal.get(java.util.Calendar.DAY_OF_WEEK) != java.util.Calendar.SATURDAY &&
                    cal.get(java.util.Calendar.DAY_OF_WEEK) != java.util.Calendar.SUNDAY) {
                    t += day
                    cal.timeInMillis = t
                }
                t
            }
            else -> null
        }
    }

    companion object {
        const val ACTION_FIRE = "network.frqncy.alarm.ACTION_FIRE"
        const val EXTRA_ID = "id"
        private const val TAG = "FrqncyAlarmReceiver"
        private const val WAKE_LOCK_TIMEOUT_MS = 10_000L
    }
}
