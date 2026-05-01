/**
 * AlarmActivity — full-screen lock-screen activity launched by AlarmService's
 * full-screen-intent notification (or directly when user taps the system-bar
 * alarm icon scheduled by setAlarmClock).
 *
 * Design rules (per Stream 2 research):
 *   - setShowWhenLocked(true) + setTurnScreenOn(true) PROGRAMMATICALLY in
 *     onCreate. Manifest flags alone are not honored on every OEM.
 *   - Disable back gesture so the alarm can't be dismissed by a stray swipe.
 *   - Host alarm.html in a WebView so the breath-hold dismiss UI lives in the
 *     bundled web layer (consistent with the rest of FRQNCY's screens).
 *   - Expose a single JavaScriptInterface (`FrqncyAlarmBridge`) to the WebView
 *     so the page can call dismiss() / snooze() / openWake() after the gesture.
 *   - This activity is intentionally NOT a BridgeActivity — it doesn't need
 *     the full Capacitor plugin set, and keeping it lean means it boots fast
 *     even when MainActivity has been killed.
 */
package network.frqncy.alarm

import android.annotation.SuppressLint
import android.app.KeyguardManager
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebSettings
import android.webkit.WebView
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import network.frqncy.app.R

class AlarmActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private var alarmId: String? = null
    private var moment: String = "morning"

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        configureWindow()
        setContentView(R.layout.activity_alarm)

        alarmId = intent.getStringExtra(EXTRA_ID)
        moment = intent.getStringExtra(EXTRA_MOMENT) ?: "morning"

        webView = findViewById(R.id.alarm_webview)
        with(webView.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            mediaPlaybackRequiresUserGesture = false
            cacheMode = WebSettings.LOAD_DEFAULT
        }
        webView.setBackgroundColor(android.graphics.Color.BLACK)
        webView.addJavascriptInterface(Bridge(), "FrqncyAlarmBridge")
        val url = "file:///android_asset/public/app/alarm.html?id=${alarmId ?: ""}&moment=$moment"
        webView.loadUrl(url)

        // Disable back navigation while the alarm is active.
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                // No-op — the dismiss gesture in the WebView is the only exit.
            }
        })
    }

    private fun configureWindow() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
            (getSystemService(KEYGUARD_SERVICE) as? KeyguardManager)
                ?.requestDismissKeyguard(this, null)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                    WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
                    WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
                    WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
            )
        }
    }

    override fun onDestroy() {
        runCatching {
            webView.loadUrl("about:blank")
            webView.stopLoading()
            webView.removeAllViews()
            webView.destroy()
        }
        super.onDestroy()
    }

    /**
     * JavaScriptInterface exposed to alarm.html. The web page calls these
     * after the breath-hold gesture completes, the user picks "snooze," or
     * the user opts to continue into the wake flow.
     */
    inner class Bridge {
        @JavascriptInterface
        fun dismiss() {
            stopAlarmService(AlarmService.ACTION_STOP)
            finishAndRemoveTask()
        }

        @JavascriptInterface
        fun snooze(minutes: Int) {
            val intent = Intent(this@AlarmActivity, AlarmService::class.java).apply {
                action = AlarmService.ACTION_SNOOZE
                putExtra(AlarmService.EXTRA_ID, alarmId)
                putExtra(AlarmService.EXTRA_SNOOZE_MINUTES, minutes)
            }
            runCatching { startService(intent) }
            finishAndRemoveTask()
        }

        @JavascriptInterface
        fun openWake() {
            // User dismissed the alarm and wants to continue into the wake flow.
            // Stop the alarm tone, finish the activity, and route MainActivity
            // to /app/wake.html via deep link.
            stopAlarmService(AlarmService.ACTION_STOP)
            val mainIntent = packageManager.getLaunchIntentForPackage(packageName)?.apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                data = android.net.Uri.parse("frqncy://wake")
            }
            mainIntent?.let { startActivity(it) }
            finishAndRemoveTask()
        }
    }

    private fun stopAlarmService(action: String) {
        val intent = Intent(this, AlarmService::class.java).apply {
            this.action = action
            putExtra(AlarmService.EXTRA_ID, alarmId)
        }
        runCatching { startService(intent) }
    }

    companion object {
        const val EXTRA_ID = "id"
        const val EXTRA_MOMENT = "moment"
    }
}
