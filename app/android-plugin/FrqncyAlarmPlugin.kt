/**
 * FrqncyAlarmPlugin.kt — Android native side of the FRQNCY alarm feature.
 *
 * This file is a SKELETON. After running `npx cap add android`, copy it to:
 *   android/app/src/main/java/network/frqncy/alarm/FrqncyAlarmPlugin.kt
 *
 * Supporting classes in this directory (to be created alongside):
 *   - AlarmReceiver.kt     (BroadcastReceiver triggered by AlarmManager)
 *   - AlarmService.kt      (foreground service, mediaPlayback type)
 *   - AlarmActivity.kt     (full-screen lock-screen UI)
 *   - BootReceiver.kt      (rehydrates alarms after reboot)
 *
 * Design notes:
 *   - Uses AlarmManager.setAlarmClock() — the only API that survives Doze and
 *     App Standby. Shows the system-bar alarm icon. Exempt from battery
 *     optimization on stock Android.
 *   - Alarms persist in a local Room database so BootReceiver can rehydrate
 *     after reboot (AlarmManager does NOT survive reboots).
 *   - OEMs (Xiaomi, Samsung, Oppo, OnePlus, Huawei) aggressively kill apps.
 *     getOemGuidance() returns deep-link intents to the right settings page.
 */

package network.frqncy.alarm

import android.Manifest
import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.provider.Settings
import androidx.core.content.ContextCompat
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
        scheduleNative(record)

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
        cancelNative(id)
        call.resolve()
    }

    @PluginMethod
    fun list(call: PluginCall) {
        val alarms = alarmStore.all().map(::alarmToJs)
        val result = JSObject()
        result.put("alarms", alarms)
        call.resolve(result)
    }

    @PluginMethod
    fun requestPermissions(call: PluginCall) {
        call.resolve(checkPermissionsInternal())
        // NOTE: for USE_EXACT_ALARM on Android 12+, route user to
        // Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM if denied.
    }

    @PluginMethod
    fun checkPermissions(call: PluginCall) {
        call.resolve(checkPermissionsInternal())
    }

    @PluginMethod
    fun armKeepAlive(call: PluginCall) {
        // iOS-only. On Android, foreground service handles keep-alive when alarm fires.
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
                "On Xiaomi devices, enable Autostart for FRQNCY and lock the app in recents. Disable Battery Saver for this app.",
                "miui.intent.action.APP_PERM_EDITOR"
            )
            "samsung" in mfr -> Triple(
                true,
                "On Samsung, add FRQNCY to Unmonitored apps and disable 'Put app to sleep' for FRQNCY in Device care.",
                null
            )
            "huawei" in mfr || "honor" in mfr -> Triple(
                true,
                "On Huawei, add FRQNCY to Protected Apps so it can run in the background.",
                null
            )
            "oppo" in mfr || "realme" in mfr || "oneplus" in mfr -> Triple(
                true,
                "Enable 'Allow Auto-launch' and 'Allow Background Activity' for FRQNCY in App management.",
                null
            )
            "vivo" in mfr -> Triple(
                true,
                "Enable 'High background power consumption' for FRQNCY in Battery settings.",
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

    private fun scheduleNative(rec: AlarmRecord) {
        val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

        val alarmIntent = Intent(context, AlarmReceiver::class.java).apply {
            putExtra("id", rec.id)
            putExtra("moment", rec.moment)
            putExtra("audioUrl", rec.audioUrl)
            putExtra("videoUrl", rec.videoUrl)
            putExtra("label", rec.label)
            putExtra("fadeInSeconds", rec.fadeInSeconds)
        }
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            rec.id.hashCode(),
            alarmIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Tappable icon in status bar — opens the bedside screen.
        val showIntent = Intent(context, AlarmActivity::class.java).apply {
            putExtra("id", rec.id)
            putExtra("moment", rec.moment)
        }
        val showPending = PendingIntent.getActivity(
            context,
            rec.id.hashCode(),
            showIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // THE critical call: setAlarmClock() bypasses Doze/App Standby.
        val info = AlarmManager.AlarmClockInfo(rec.timestamp, showPending)
        am.setAlarmClock(info, pendingIntent)
    }

    private fun cancelNative(id: String) {
        val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val alarmIntent = Intent(context, AlarmReceiver::class.java)
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            id.hashCode(),
            alarmIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        am.cancel(pendingIntent)
    }

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
            // Requires checking NotificationManager.canUseFullScreenIntent()
            "granted"  // TODO: wire real check
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
        put("audioUrl", a.audioUrl)
        put("videoUrl", a.videoUrl)
        put("label", a.label)
        put("repeat", a.repeat)
        put("fadeInSeconds", a.fadeInSeconds)
        put("armed", true)
        put("nextFire", a.timestamp)
    }
}

// -------------------------------------------------------------------
// Supporting types (simplified — real implementation uses Room database)

data class AlarmRecord(
    val id: String,
    val timestamp: Long,
    val moment: String,
    val audioUrl: String?,
    val videoUrl: String?,
    val label: String,
    val repeat: String,
    val fadeInSeconds: Int,
)

class AlarmStore(private val context: Context) {
    // TODO: replace with Room DAO backed by SQLite.
    private val cache = mutableMapOf<String, AlarmRecord>()
    fun upsert(rec: AlarmRecord) { cache[rec.id] = rec }
    fun delete(id: String) { cache.remove(id) }
    fun all(): List<AlarmRecord> = cache.values.toList()
}
