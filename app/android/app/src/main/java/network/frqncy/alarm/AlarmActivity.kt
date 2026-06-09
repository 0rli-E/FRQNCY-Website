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
 *     bundled web layer (consistent with the rest of VBRTN's screens).
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
import android.graphics.Color
import android.graphics.Typeface
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.TypedValue
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import network.frqncy.app.R

class AlarmActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private var alarmId: String? = null
    private var moment: String = "morning"
    private var webViewLoaded = false
    private val cooldownHandler = Handler(Looper.getMainLooper())

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
        webView.setBackgroundColor(Color.BLACK)
        webView.addJavascriptInterface(Bridge(), "FrqncyAlarmBridge")

        // Cold-start hardening: track whether alarm.html actually finished
        // loading. After a process kill the WebView can launch but fail to
        // render the bundled assets — in that case we fall back to a native
        // dismiss surface so the user is never stuck looking at a black screen.
        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                webViewLoaded = true
            }
        }

        // Surface current snooze count so alarm.html can switch copy past the cap.
        val snoozeCount = alarmId?.let { AlarmStore(this).get(it)?.snoozeCount } ?: 0
        val url = "file:///android_asset/public/app/alarm.html" +
            "?id=${alarmId ?: ""}" +
            "&moment=$moment" +
            "&snoozeCount=$snoozeCount" +
            "&snoozeLimit=${AlarmRecord.SNOOZE_LIMIT}"
        webView.loadUrl(url)

        // 4-second timeout — if the WebView hasn't finished loading by then,
        // overlay a native fallback dismiss surface. Keeps the user out of a
        // black screen even on the worst cold-start path.
        cooldownHandler.postDelayed({
            if (!webViewLoaded) {
                showNativeFallback()
            }
        }, 4_000L)

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
        cooldownHandler.removeCallbacksAndMessages(null)
        runCatching {
            webView.loadUrl("about:blank")
            webView.stopLoading()
            webView.removeAllViews()
            webView.destroy()
        }
        super.onDestroy()
    }

    /**
     * Fallback dismiss surface — used when the WebView fails to load
     * alarm.html within 4s of activity start (process-kill recovery, asset
     * corruption, etc.). Native LinearLayout with the same breath-hold
     * affordance: a centered "hold to arrive" prompt and a "stop alarm"
     * button so the user is never stuck.
     */
    @SuppressLint("ClickableViewAccessibility")
    private fun showNativeFallback() {
        val root = findViewById<FrameLayout>(android.R.id.content)
        val container = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(0xFF0B1C3D.toInt()) // VBRTN brand navy
            setPadding(dp(24), dp(24), dp(24), dp(24))
        }

        val title = TextView(this).apply {
            text = "VBRTN"
            setTextColor(0xFFC4973A.toInt())
            setTypeface(typeface, Typeface.NORMAL)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 14f)
            letterSpacing = 0.25f
            gravity = Gravity.CENTER
        }
        val instr = TextView(this).apply {
            text = "press and hold here to arrive"
            setTextColor(0xCCF5F5F5.toInt())
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 18f)
            gravity = Gravity.CENTER
            setPadding(0, dp(40), 0, dp(40))
        }
        val stopBtn = TextView(this).apply {
            text = "stop alarm"
            setTextColor(0x99F5F5F5.toInt())
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 13f)
            gravity = Gravity.CENTER
            setPadding(dp(24), dp(12), dp(24), dp(12))
        }

        // Hold-for-6s on the instruction text dismisses the alarm.
        var holdStart = 0L
        instr.setOnTouchListener { _, ev ->
            when (ev.action) {
                MotionEvent.ACTION_DOWN -> {
                    holdStart = System.currentTimeMillis()
                    instr.setTextColor(0xFFC4973A.toInt())
                    cooldownHandler.postDelayed({
                        if (System.currentTimeMillis() - holdStart >= 5_900) {
                            stopAlarmService(AlarmService.ACTION_STOP)
                            finishAndRemoveTask()
                        }
                    }, 6_000L)
                    true
                }
                MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                    holdStart = 0L
                    instr.setTextColor(0xCCF5F5F5.toInt())
                    true
                }
                else -> false
            }
        }
        stopBtn.setOnClickListener {
            stopAlarmService(AlarmService.ACTION_STOP)
            finishAndRemoveTask()
        }

        container.addView(title)
        container.addView(instr)
        container.addView(stopBtn)

        val lp = FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT,
        )
        root.addView(container, lp)
        webView.visibility = View.GONE
    }

    private fun dp(value: Int): Int =
        (value * resources.displayMetrics.density + 0.5f).toInt()

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
