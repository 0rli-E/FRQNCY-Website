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
import android.media.MediaPlayer
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.util.Log
import androidx.core.app.NotificationCompat
import network.frqncy.app.R

class AlarmService : Service() {

    private var mediaPlayer: MediaPlayer? = null
    private var wakeLock: PowerManager.WakeLock? = null
    private val handler = Handler(Looper.getMainLooper())
    private var fadeRunnable: Runnable? = null

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
        val label = intent.getStringExtra(EXTRA_LABEL) ?: "FRQNCY"
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
        playAlarmTone(audioUrl, moment, fadeInSeconds)
    }

    private fun handleStop() {
        stopFade()
        mediaPlayer?.runCatching { stop() }
        mediaPlayer?.release()
        mediaPlayer = null
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

        // Stop current playback, then re-arm the alarm for now + snoozeMinutes.
        val store = AlarmStore(this)
        store.get(id)?.let { existing ->
            val nextTs = System.currentTimeMillis() + snoozeMinutes * 60_000L
            val updated = existing.copy(timestamp = nextTs)
            store.upsert(updated)
            FrqncyAlarmPlugin.scheduleNative(this, updated)
        }
        handleStop()
    }

    private fun playAlarmTone(audioUrl: String?, @Suppress("UNUSED_PARAMETER") moment: String, fadeInSeconds: Int) {
        // moment is reserved for Phase 3: pick the bundled morning vs evening
        // asset based on which @drawable/raw resource matches. For v1 we always
        // play default_morning since there's only one bundled asset.
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
                // Bundled default: a 432Hz + perfect-fifth tone with a 6s breath
                // envelope. Loops cleanly. Lives in res/raw/default_morning.mp3.
                val rawUri = Uri.parse("android.resource://$packageName/${R.raw.default_morning}")
                player.setDataSource(this, rawUri)
            }
            player.setVolume(0f, 0f)
            player.prepare()
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
            description = "Plays your scheduled FRQNCY wake-up."
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
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
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
        mediaPlayer?.runCatching { stop() }
        mediaPlayer?.release()
        mediaPlayer = null
        releaseWakeLock()
        super.onDestroy()
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
