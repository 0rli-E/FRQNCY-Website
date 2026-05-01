/**
 * BootReceiver — re-arms persisted alarms after device reboot, package
 * replacement, time change, or timezone change. AlarmManager does NOT survive
 * any of these on its own.
 *
 * Listens for (manifest):
 *   - BOOT_COMPLETED — fired after user unlock
 *   - LOCKED_BOOT_COMPLETED — fired before user unlock; combined with
 *     directBootAware=true on this receiver and on AlarmStore (which uses
 *     createDeviceProtectedStorageContext), this lets us re-arm even if the
 *     user hasn't unlocked yet (e.g. they rebooted and went back to sleep).
 *   - MY_PACKAGE_REPLACED — fires after our app is updated; alarms set with
 *     the previous version's PendingIntents are wiped, so re-arm them.
 *   - TIME_SET / TIMEZONE_CHANGED — user changed clock; existing alarms now
 *     point at wrong wall-clock times. Re-arm with the original timestamps
 *     (which are absolute UTC milliseconds — correct after re-arm).
 */
package network.frqncy.alarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class BootReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action ?: return
        if (action !in HANDLED_ACTIONS) return

        val store = AlarmStore(context)
        val alarms = store.all()
        val now = System.currentTimeMillis()

        Log.i(TAG, "Received $action — rehydrating ${alarms.size} alarm(s)")

        alarms.forEach { record ->
            val target = if (record.timestamp <= now && record.repeat == "none") {
                // One-shot alarm whose fire time has already passed (user
                // rebooted past it). Drop it.
                store.delete(record.id)
                return@forEach
            } else if (record.timestamp <= now) {
                // Recurring alarm whose fire time has passed — bump forward.
                advanceToNext(record, now)
            } else {
                record
            }

            store.upsert(target)
            runCatching {
                FrqncyAlarmPlugin.scheduleNative(context, target)
            }.onFailure {
                Log.e(TAG, "Failed to re-arm ${target.id}: ${it.message}", it)
            }
        }
    }

    private fun advanceToNext(record: AlarmRecord, now: Long): AlarmRecord {
        val day = 24L * 60L * 60L * 1000L
        var next = record.timestamp
        while (next <= now) next += day
        return record.copy(timestamp = next)
    }

    companion object {
        private const val TAG = "FrqncyBootReceiver"
        private val HANDLED_ACTIONS = setOf(
            Intent.ACTION_BOOT_COMPLETED,
            Intent.ACTION_LOCKED_BOOT_COMPLETED,
            Intent.ACTION_MY_PACKAGE_REPLACED,
            Intent.ACTION_TIME_CHANGED,
            Intent.ACTION_TIMEZONE_CHANGED,
        )
    }
}
