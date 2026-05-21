/**
 * AlarmService — typed `mediaPlayback` foreground service that plays the alarm
 * tone, holds a wake lock, and posts the full-screen-intent notification that
 * launches AlarmActivity.
 *
 * Design rules (per Stream 2 research):
 *   - Call startForeground() within 5 seconds of receiver fire (Android 14+
 *     enforcement). Built notification first, then startForeground, then audio.
 *   - foregroundServiceType = FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK (manifest).
 *   - Audio attributes use USAGE_ALARM so the tone bypasses Do Not Disturb if
 *     the user allowed alarms through DND.
 *   - Register a MediaSessionCompat and set it active for Android 16 readiness:
 *     Stream 2 flagged that API 36 may require an active media session to keep
 *     the mediaPlayback FGS type valid.
 *   - Volume fade-in via ExoPlayer-style polling — for v1 we use MediaPlayer's
 *     volume() with a coroutine tick (AudioAttributes-aware). Switch to
 *     mediagrid's native fade APIs once that plugin is integrated.
 *   - Stop on dismiss/snooze intents.
 */
package network.frqncy.alarm

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.media.MediaPlayer
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log
import androidx.core.app.NotificationCompat
import network.frqncy.app.R

class AlarmService : Service() {

    private var mediaPlayer: MediaPlayer? = null
    private var wakeLock: PowerManager.WakeLock? = null
    private val handler = Handler(Looper.getMainLooper())
    private var fadeRunnable: Runnable? = null
    private var hapticRunnable: Runnable? = null
    private var vibrator: Vibrator? = null

    // Audio focus state
    private var audioManager: AudioManager? = null
    private var focusRequest: AudioFocusRequest? = null
    private var pausedByFocusLoss = false

    private val audioFocusListener = AudioManager.OnAudioFocusChangeListener { focusChange ->
        when (focusChange) {
            AudioManager.AUDIOFOCUS_LOSS -> {
                // Permanent loss — another app took focus durably (e.g. user
                // hit play on Spotify mid-alarm). Stop entirely.
                Log.d(TAG, "AUDIOFOCUS_LOSS — stopping alarm")
                handleStop()
            }
            AudioManager.AUDIOFOCUS_LOSS_TRANSIENT,
            AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK -> {
                // Phone call, brief notification — pause and remember.
                Log.d(TAG, "AUDIOFOCUS_LOSS_TRANSIENT — pausing")
                mediaPlayer?.runCatching { if (isPlaying) pause() }
                pausedByFocusLoss = true
            }
            AudioManager.AUDIOFOCUS_GAIN -> {
                // Call ended, transient interrupter done — resume.
                if (pausedByFocusLoss) {
                    Log.d(TAG, "AUDIOFOCUS_GAIN — resuming")
                    mediaPlayer?.runCatching { if (!isPlaying) start() }
                    pausedByFocusLoss = false
                }
            }
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        ensureChannel()
        // TODO Phase 1.5: register a MediaSessionCompat (or Media3 MediaSession)
        // for Android 16 readiness. Stream 2 flagged that API 36 may require
        // an active media session to keep the mediaPlayback FGS type valid.
        // Deferred until Android 16 final docs land — wiring it now requires
        // either Jetifier (off in this project) or a Media3 dep bump.
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action
        when (action) {
            ACTION_START -> handleStart(intent)
            ACTION_STOP -> handleStop()
            ACTION_SNOOZE -> handleSnooze(intent)
            else -> stopSelf()
        }
        return START_NOT_STICKY
    }

    private fun handleStart(intent: Intent) {
        val id = intent.getStringExtra(EXTRA_ID) ?: run { stopSelf(); return }
        val moment = intent.getStringExtra(EXTRA_MOMENT) ?: "morning"
        val audioUrl = intent.getStringExtra(EXTRA_AUDIO_URL)
        val label = intent.getStringExtra(EXTRA_LABEL) ?: "VBRTN"
        val fadeInSeconds = intent.getIntExtra(EXTRA_FADE_IN_SECONDS, 90)

        val notification = buildNotification(id, moment, label)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
            )
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }

        acquireWakeLock()

        // Hearing-impaired mode: skip audio, play a slow rising vibration
        // pattern instead. Flag persisted in user settings (see settings.html
        // and AccessibilityPreferences). Stream 6 priority — must always have
        // an alternative to audio for users who can't hear it.
        val hapticOnly = AccessibilityPreferences.isHapticWake(this)
        if (hapticOnly) {
            playHapticAlarm(fadeInSeconds)
        } else {
            playAlarmTone(audioUrl, moment, fadeInSeconds)
        }
    }

    private fun handleStop() {
        stopFade()
        stopHaptic()
        mediaPlayer?.runCatching { stop() }
        mediaPlayer?.release()
        mediaPlayer = null
        abandonAudioFocus()
        releaseWakeLock()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_REMOVE)
        } else {
            @Suppress("DEPRECATION")
            stopForeground(true)
        }
        stopSelf()
    }

    private fun handleSnooze(intent: Intent) {
        val id = intent.getStringExtra(EXTRA_ID) ?: run { handleStop(); return }
        val snoozeMinutes = intent.getIntExtra(EXTRA_SNOOZE_MINUTES, 9)

        // Snooze cap — Stream 6: cap at AlarmRecord.SNOOZE_LIMIT (=2) per
        // alarm cycle. Any further snooze attempt is silently ignored at the
        // service level; the WebView UI surfaces "this is your third return,
        // hold to arrive" copy and disables the snooze button.
        val store = AlarmStore(this)
        store.get(id)?.let { existing ->
            if (existing.snoozeCount >= AlarmRecord.SNOOZE_LIMIT) {
                Log.d(TAG, "Snooze limit reached for $id; stopping alarm without re-arm")
                handleStop()
                return
            }
            val nextTs = System.currentTimeMillis() + snoozeMinutes * 60_000L
            val updated = existing.copy(
                timestamp = nextTs,
                snoozeCount = existing.snoozeCount + 1
            )
            store.upsert(updated)
            FrqncyAlarmPlugin.scheduleNative(this, updated)
        }
        handleStop()
    }

    private fun bundledFallbackForMoment(moment: String): Int = when (moment) {
        "evening" -> R.raw.default_evening
        "stillness" -> R.raw.default_stillness
        "release" -> R.raw.default_release
        else -> R.raw.default_morning  // morning + anything unknown
    }

    private fun playAlarmTone(audioUrl: String?, moment: String, fadeInSeconds: Int) {
        val attrs = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_ALARM)
            .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
            .build()

        val player = MediaPlayer().apply {
            setAudioAttributes(attrs)
            isLooping = true
        }

        try {
            if (audioUrl != null) {
                player.setDataSource(this, Uri.parse(audioUrl))
            } else {
                // Bundled defaults — one tone per moment:
                //   morning   → 432Hz + perfect-fifth, 90s, breath envelope
                //   evening   → 216Hz drone + slow tremolo
                //   stillness → sustained 432Hz, no movement
                //   release   → descending arc 432→324Hz over 60s
                val rawId = bundledFallbackForMoment(moment)
                val rawUri = Uri.parse("android.resource://$packageName/$rawId")
                player.setDataSource(this, rawUri)
            }
            player.setVolume(0f, 0f)
            player.prepare()
            requestAudioFocus(attrs)
            player.start()
            mediaPlayer = player
            startFadeIn(fadeInSeconds)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to play alarm tone, falling back to system default", e)
            player.release()
            // Last-resort fallback: system default alarm tone via a fresh player.
            playSystemFallback(fadeInSeconds)
        }
    }

    private fun playSystemFallback(fadeInSeconds: Int) {
        runCatching {
            val attrs = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                .build()
            val systemUri = android.media.RingtoneManager.getActualDefaultRingtoneUri(
                this,
                android.media.RingtoneManager.TYPE_ALARM
            ) ?: return
            val fallbackPlayer = MediaPlayer().apply {
                setAudioAttributes(attrs)
                isLooping = true
                setDataSource(this@AlarmService, systemUri)
                setVolume(0f, 0f)
                prepare()
                start()
            }
            mediaPlayer = fallbackPlayer
            startFadeIn(fadeInSeconds)
        }.onFailure { Log.e(TAG, "System fallback also failed", it) }
    }

    private fun startFadeIn(fadeInSeconds: Int) {
        val totalSteps = 60
        val intervalMs = (fadeInSeconds.coerceAtLeast(1) * 1000L) / totalSteps
        var step = 0

        fadeRunnable = object : Runnable {
            override fun run() {
                step++
                val t = step.toFloat() / totalSteps
                // ease-in (quadratic) so the perceived ramp feels gentle
                val v = (t * t).coerceAtMost(1f)
                mediaPlayer?.runCatching { setVolume(v, v) }
                if (step < totalSteps) {
                    handler.postDelayed(this, intervalMs)
                }
            }
        }
        handler.postDelayed(fadeRunnable!!, intervalMs)
    }

    private fun stopFade() {
        fadeRunnable?.let { handler.removeCallbacks(it) }
        fadeRunnable = null
    }

    private fun requestAudioFocus(attrs: AudioAttributes) {
        val am = audioManager ?: (getSystemService(Context.AUDIO_SERVICE) as? AudioManager)?.also {
            audioManager = it
        } ?: return
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val req = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                .setAudioAttributes(attrs)
                .setOnAudioFocusChangeListener(audioFocusListener)
                .setWillPauseWhenDucked(false)
                .build()
            focusRequest = req
            am.requestAudioFocus(req)
        } else {
            @Suppress("DEPRECATION")
            am.requestAudioFocus(
                audioFocusListener,
                AudioManager.STREAM_ALARM,
                AudioManager.AUDIOFOCUS_GAIN
            )
        }
    }

    private fun abandonAudioFocus() {
        val am = audioManager ?: return
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            focusRequest?.let { am.abandonAudioFocusRequest(it) }
            focusRequest = null
        } else {
            @Suppress("DEPRECATION")
            am.abandonAudioFocus(audioFocusListener)
        }
    }

    private fun acquireWakeLock() {
        if (wakeLock?.isHeld == true) return
        val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = pm.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "FRQNCY:AlarmService"
        ).apply {
            setReferenceCounted(false)
            acquire(WAKE_LOCK_TIMEOUT_MS)
        }
    }

    private fun releaseWakeLock() {
        wakeLock?.takeIf { it.isHeld }?.release()
        wakeLock = null
    }

    private fun ensureChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val nm = getSystemService(NotificationManager::class.java) ?: return
        if (nm.getNotificationChannel(CHANNEL_ID) != null) return
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Alarms",
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = "Plays your scheduled VBRTN wake-up."
            setBypassDnd(true)
            lockscreenVisibility = Notification.VISIBILITY_PUBLIC
        }
        nm.createNotificationChannel(channel)
    }

    private fun buildNotification(id: String, moment: String, label: String): Notification {
        val fullScreenIntent = Intent(this, AlarmActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            putExtra(AlarmActivity.EXTRA_ID, id)
            putExtra(AlarmActivity.EXTRA_MOMENT, moment)
        }
        val fullScreenPending = PendingIntent.getActivity(
            this,
            id.hashCode(),
            fullScreenIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val stopIntent = Intent(this, AlarmService::class.java).apply {
            action = ACTION_STOP
            putExtra(EXTRA_ID, id)
        }
        val stopPending = PendingIntent.getService(
            this,
            id.hashCode() + 1,
            stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_icon)
            .setColor(0xFFC4973A.toInt()) // FRQNCY gold tint
            .setContentTitle(label)
            .setContentText("Tap to arrive")
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setFullScreenIntent(fullScreenPending, true)
            .setContentIntent(fullScreenPending)
            .addAction(0, "Stop", stopPending)
            .build()
    }

    override fun onDestroy() {
        stopFade()
        stopHaptic()
        mediaPlayer?.runCatching { stop() }
        mediaPlayer?.release()
        mediaPlayer = null
        abandonAudioFocus()
        releaseWakeLock()
        super.onDestroy()
    }

    /**
     * Slow rising 60-second haptic pattern. Replaces audio entirely for users
     * who selected hearing-impaired wake mode. Pattern: short pulses every
     * 4 seconds, increasing in amplitude over the fade-in window. Loops until
     * the user dismisses.
     */
    private fun playHapticAlarm(fadeInSeconds: Int) {
        val v = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            (getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager)
                ?.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        } ?: run {
            Log.w(TAG, "Device has no vibrator; haptic-only alarm cannot fire")
            return
        }
        vibrator = v
        if (!v.hasVibrator()) {
            Log.w(TAG, "Vibrator hardware unavailable")
            return
        }

        val totalSteps = 60 // pulses across fade window
        val intervalMs = (fadeInSeconds.coerceAtLeast(1) * 1000L) / totalSteps
        var step = 0

        hapticRunnable = object : Runnable {
            override fun run() {
                step++
                val t = step.toFloat() / totalSteps
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    val amplitude = (t * t * 255f).toInt().coerceIn(20, 255)
                    val effect = VibrationEffect.createOneShot(180L, amplitude)
                    runCatching { v.vibrate(effect) }
                } else {
                    @Suppress("DEPRECATION")
                    runCatching { v.vibrate(180L) }
                }
                // After the ramp, keep pulsing at full amplitude until dismiss.
                handler.postDelayed(this, if (step < totalSteps) intervalMs else 4000L)
            }
        }
        handler.postDelayed(hapticRunnable!!, 200L)
    }

    private fun stopHaptic() {
        hapticRunnable?.let { handler.removeCallbacks(it) }
        hapticRunnable = null
        vibrator?.runCatching { cancel() }
        vibrator = null
    }

    companion object {
        const val ACTION_START = "network.frqncy.alarm.ACTION_START"
        const val ACTION_STOP = "network.frqncy.alarm.ACTION_STOP"
        const val ACTION_SNOOZE = "network.frqncy.alarm.ACTION_SNOOZE"
        const val EXTRA_ID = "id"
        const val EXTRA_MOMENT = "moment"
        const val EXTRA_AUDIO_URL = "audioUrl"
        const val EXTRA_LABEL = "label"
        const val EXTRA_FADE_IN_SECONDS = "fadeInSeconds"
        const val EXTRA_SNOOZE_MINUTES = "snoozeMinutes"

        private const val CHANNEL_ID = "frqncy_alarms"
        private const val NOTIFICATION_ID = 0xFCA1 // FRQNCY alarm
        private const val TAG = "FrqncyAlarmService"
        private const val WAKE_LOCK_TIMEOUT_MS = 30L * 60L * 1000L // 30 min ceiling
    }
}
