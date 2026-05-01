/**
 * FrqncyAlarmPlugin — Android Capacitor plugin bridging the JS layer
 * (src/native/frqncy-alarm.ts) to AlarmManager + the supporting Kotlin
 * classes (AlarmReceiver, AlarmService, AlarmActivity, BootReceiver).
 *
 * Architecture per ROADMAP-2026-04-29.md (Stream 2 synthesis):
 *   - schedule()  → persist to AlarmStore → register with AlarmManager.setAlarmClock()
 *   - cancel()    → remove from AlarmStore + cancel pending intent
 *   - list()      → read from AlarmStore
 *   - permissions → Android 14+ USE_EXACT_ALARM auto-grant for alarm-category apps
 *   - oem()       → Build.MANUFACTURER → guidance copy + deep-link intents
 *
 * setAlarmClock() is the single most important call here: it's the only
 * AlarmManager API exempt from Doze + App Standby Buckets, and it puts the
 * tappable alarm icon in the system bar.
 */
package network.frqncy.alarm

import android.Manifest
import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "FrqncyAlarm")
class FrqncyAlarmPlugin : Plugin() {

    private val alarmStore by lazy { AlarmStore(context) }

    @PluginMethod
    fun schedule(call: PluginCall) {
        val id = call.getString("id") ?: return call.reject("id is required")
        val timestamp = call.getLong("timestamp") ?: return call.reject("timestamp is required")
        val moment = call.getString("moment") ?: "morning"
        val audioUrl = call.getString("audioUrl")
        val videoUrl = call.getString("videoUrl")
        val label = call.getString("label") ?: "FRQNCY"
        val repeat = call.getString("repeat") ?: "none"
        val fadeInSeconds = call.getInt("fadeInSeconds") ?: 90

        val record = AlarmRecord(id, timestamp, moment, audioUrl, videoUrl, label, repeat, fadeInSeconds)
        alarmStore.upsert(record)

        try {
            scheduleNative(context, record)
        } catch (e: SecurityException) {
            // Android 12+ without USE_EXACT_ALARM granted — surface to JS
            return call.reject("Exact alarm permission denied. Open Settings → Alarms & reminders.", "EXACT_ALARM_DENIED", e)
        }

        val result = JSObject().apply {
            put("id", id)
            put("nextFire", timestamp)
        }
        call.resolve(result)
    }

    @PluginMethod
    fun cancel(call: PluginCall) {
        val id = call.getString("id") ?: return call.reject("id is required")
        alarmStore.delete(id)
        cancelNative(context, id)
        call.resolve()
    }

    @PluginMethod
    fun list(call: PluginCall) {
        val list = alarmStore.all().map(::alarmToJs)
        val result = JSObject()
        val arr = JSArray()
        list.forEach(arr::put)
        result.put("alarms", arr)
        call.resolve(result)
    }

    @PluginMethod
    override fun requestPermissions(call: PluginCall) {
        // For exact alarms on Android 12+ that aren't auto-granted, route the
        // user to Settings → Alarms & reminders. JS handles the user flow.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            if (!am.canScheduleExactAlarms()) {
                val intent = Intent(android.provider.Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM).apply {
                    data = android.net.Uri.parse("package:${context.packageName}")
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                runCatching { context.startActivity(intent) }
            }
        }
        call.resolve(checkPermissionsInternal())
    }

    @PluginMethod
    override fun checkPermissions(call: PluginCall) {
        call.resolve(checkPermissionsInternal())
    }

    @PluginMethod
    fun armKeepAlive(call: PluginCall) {
        // iOS-only. On Android the foreground service handles keep-alive when
        // the alarm fires.
        call.resolve()
    }

    @PluginMethod
    fun disarmKeepAlive(call: PluginCall) {
        call.resolve()
    }

    @PluginMethod
    fun getOemGuidance(call: PluginCall) {
        val mfr = Build.MANUFACTURER.lowercase()
        val (aggressive, instructions, deepLink) = when {
            "xiaomi" in mfr || "redmi" in mfr || "poco" in mfr -> Triple(
                true,
                "On Xiaomi/Redmi/Poco: open Settings → Apps → FRQNCY. Turn on Autostart. " +
                    "Set Battery saver to 'No restrictions'. Lock FRQNCY in the recents screen by " +
                    "swiping down on the card and tapping the lock icon.",
                "miui.intent.action.APP_PERM_EDITOR"
            )
            "samsung" in mfr -> Triple(
                true,
                "On Samsung: open Settings → Battery → Background usage limits → Never sleeping apps. " +
                    "Add FRQNCY. Also: Settings → Apps → FRQNCY → Battery → Unrestricted.",
                null
            )
            "huawei" in mfr || "honor" in mfr -> Triple(
                true,
                "On Huawei/Honor: open Settings → Apps → FRQNCY → App launch. Turn off auto-manage, " +
                    "then enable Auto-launch, Secondary launch, and Run in background.",
                null
            )
            "oppo" in mfr || "realme" in mfr || "oneplus" in mfr -> Triple(
                true,
                "On Oppo/Realme/OnePlus: open Settings → Apps → App management → FRQNCY. " +
                    "Enable Allow auto-launch and Allow background activity.",
                null
            )
            "vivo" in mfr || "iqoo" in mfr -> Triple(
                true,
                "On Vivo/iQOO: open Settings → Battery → Background power consumption manager. " +
                    "Set FRQNCY to 'Allow background high power consumption'. Vivo's battery manager " +
                    "is the most aggressive — pair with a backup alarm if you can't risk a missed wake.",
                null
            )
            else -> Triple(false, "Your device should run FRQNCY alarms reliably by default.", null)
        }

        val result = JSObject().apply {
            put("manufacturer", Build.MANUFACTURER)
            put("isAggressive", aggressive)
            put("settingsDeepLink", deepLink)
            put("instructions", instructions)
        }
        call.resolve(result)
    }

    // --- internals -------------------------------------------------------------

    private fun checkPermissionsInternal(): JSObject {
        val result = JSObject()

        val exactAlarm = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            if (am.canScheduleExactAlarms()) "granted" else "denied"
        } else "not-needed"

        val notifications = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS)
                == PackageManager.PERMISSION_GRANTED) "granted" else "prompt"
        } else "granted"

        val fullScreen = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            // Android 14+: full-screen intent permission is auto-granted to apps
            // Google's heuristic classifies as alarm/calling/clock; otherwise the
            // user must enable it in Settings → Notifications.
            val nm = NotificationManagerCompat.from(context)
            if (nm.canUseFullScreenIntent()) "granted" else "denied"
        } else "granted"

        result.put("exactAlarm", exactAlarm)
        result.put("fullScreen", fullScreen)
        result.put("notifications", notifications)
        result.put("batteryExempt", "not-needed")
        result.put("backgroundAudio", "not-applicable")
        return result
    }

    private fun alarmToJs(a: AlarmRecord): JSObject = JSObject().apply {
        put("id", a.id)
        put("timestamp", a.timestamp)
        put("moment", a.moment)
        a.audioUrl?.let { put("audioUrl", it) }
        a.videoUrl?.let { put("videoUrl", it) }
        put("label", a.label)
        put("repeat", a.repeat)
        put("fadeInSeconds", a.fadeInSeconds)
        put("armed", true)
        put("nextFire", a.timestamp)
    }

    companion object {
        /**
         * Schedule a record with AlarmManager.setAlarmClock(). Exposed via companion
         * so BootReceiver can re-arm without instantiating the plugin.
         */
        @JvmStatic
        fun scheduleNative(context: Context, rec: AlarmRecord) {
            val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

            val alarmIntent = Intent(context, AlarmReceiver::class.java).apply {
                action = AlarmReceiver.ACTION_FIRE
                putExtra(AlarmReceiver.EXTRA_ID, rec.id)
            }
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                rec.id.hashCode(),
                alarmIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            // The PendingIntent shown when the user taps the system-bar alarm icon.
            // Routes them straight into the in-app bedside screen.
            val showIntent = Intent(context, AlarmActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                putExtra(AlarmActivity.EXTRA_ID, rec.id)
                putExtra(AlarmActivity.EXTRA_MOMENT, rec.moment)
            }
            val showPending = PendingIntent.getActivity(
                context,
                rec.id.hashCode(),
                showIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val info = AlarmManager.AlarmClockInfo(rec.timestamp, showPending)
            am.setAlarmClock(info, pendingIntent)
        }

        @JvmStatic
        fun cancelNative(context: Context, id: String) {
            val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val alarmIntent = Intent(context, AlarmReceiver::class.java).apply {
                action = AlarmReceiver.ACTION_FIRE
            }
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                id.hashCode(),
                alarmIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            am.cancel(pendingIntent)
        }
    }
}
