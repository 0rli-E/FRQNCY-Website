/**
 * Telemetry — fire-and-forget POST to /api/alarm-error on Cloudflare Pages.
 *
 * Used exclusively to log alarm-startup failures so we can see the failure
 * rate per OEM in the wild. Never sends user data — just manufacturer +
 * SDK level + the exception message + app version.
 *
 * Privacy posture (per CLAUDE.md / FRQNCY editorial values):
 *   - No user IDs, no device IDs, no IP-based fingerprinting on the server
 *     side (the Cloudflare Function only console.logs; no DB write).
 *   - Runs on a background thread so it never blocks the receiver's 10s
 *     ANR budget.
 *   - 3-second connect/read timeout; failures swallowed silently.
 *   - Fires at most once per receiver invocation (the catch block).
 */
package network.frqncy.alarm

import android.content.Context
import android.os.Build
import android.util.Log
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors
import org.json.JSONObject

object Telemetry {

    private const val ENDPOINT = "https://frqncy.network/api/alarm-error"
    private const val TIMEOUT_MS = 3_000
    private const val TAG = "FrqncyTelemetry"

    private val executor = Executors.newSingleThreadExecutor { runnable ->
        Thread(runnable, "FrqncyTelemetry").apply {
            isDaemon = true
            priority = Thread.MIN_PRIORITY
        }
    }

    fun reportAlarmError(context: Context, throwable: Throwable) {
        val payload = JSONObject().apply {
            put("manufacturer", "${Build.MANUFACTURER} ${Build.MODEL}".take(64))
            put("sdk_int", Build.VERSION.SDK_INT)
            put("error", "${throwable.javaClass.simpleName}: ${throwable.message}".take(200))
            put("app_version", versionName(context))
        }
        executor.submit {
            runCatching { send(payload) }
                .onFailure { Log.d(TAG, "Telemetry POST failed (fine): ${it.message}") }
        }
    }

    private fun versionName(context: Context): String = try {
        val pi = context.packageManager.getPackageInfo(context.packageName, 0)
        pi.versionName ?: "unknown"
    } catch (e: Exception) {
        "unknown"
    }

    private fun send(payload: JSONObject) {
        val conn = (URL(ENDPOINT).openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            connectTimeout = TIMEOUT_MS
            readTimeout = TIMEOUT_MS
            doOutput = true
            setRequestProperty("Content-Type", "application/json")
            setRequestProperty("User-Agent", "FrqncyAlarm/1.0 (Android)")
        }
        try {
            OutputStreamWriter(conn.outputStream, Charsets.UTF_8).use { it.write(payload.toString()) }
            // We don't read the body — Pages Function returns 204.
            val code = conn.responseCode
            if (code !in 200..299) {
                Log.d(TAG, "Telemetry endpoint returned $code")
            }
        } finally {
            conn.disconnect()
        }
    }
}
