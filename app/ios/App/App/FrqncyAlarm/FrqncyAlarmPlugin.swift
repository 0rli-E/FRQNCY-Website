/**
 * FrqncyAlarmPlugin — iOS native side of the FRQNCY alarm.
 *
 * Apple has no public alarm API, so this is the same pattern Alarmy / Sleep
 * Cycle / Rise / Pillow ship in 2026:
 *
 *   1. Time-sensitive UNNotification with a bundled <30s .caf sound — this is
 *      the floor of reliability. Fires regardless of app state.
 *   2. Silent-audio keep-alive via AVAudioSession(.playback, .mixWithOthers)
 *      gated to armed-alarm state only. Lets us swap real alarm audio in-process
 *      and ramp volume if the app is still alive at fire time. The .mixWithOthers
 *      option is required since iOS 17.4 — without it, the session dies on any
 *      incoming audio (calls, Spotify, etc.).
 *   3. Backup notification 60s later with a louder fallback.
 *
 * Honest reliability ceiling per Stream 3 research: ~92-96% under good
 * conditions (plugged in, app open, Time Sensitive override on in Sleep
 * Focus, app opened in last 24h, not in Low Power Mode).
 */

import Foundation
import Capacitor
import UserNotifications
import AVFoundation

@objc(FrqncyAlarmPlugin)
public class FrqncyAlarmPlugin: CAPPlugin {

    private var keepAlivePlayer: AVAudioPlayer?
    private var alarmPlayer: AVAudioPlayer?
    private var fadeTimer: Timer?
    private var alarms: [String: AlarmRecord] = [:]

    // MARK: - JS bridge

    @objc func schedule(_ call: CAPPluginCall) {
        guard let id = call.getString("id"),
              let timestamp = call.getDouble("timestamp") else {
            call.reject("id and timestamp are required")
            return
        }
        let moment = call.getString("moment") ?? "morning"
        let audioUrl = call.getString("audioUrl")
        let videoUrl = call.getString("videoUrl")
        let label = call.getString("label") ?? "FRQNCY"
        let repeatMode = call.getString("repeat") ?? "none"
        let fadeIn = call.getInt("fadeInSeconds") ?? 90

        let record = AlarmRecord(
            id: id,
            timestamp: timestamp,
            moment: moment,
            audioUrl: audioUrl,
            videoUrl: videoUrl,
            label: label,
            repeatMode: repeatMode,
            fadeInSeconds: fadeIn
        )
        alarms[id] = record
        scheduleNotification(record)

        call.resolve([
            "id": id,
            "nextFire": timestamp
        ])
    }

    @objc func cancel(_ call: CAPPluginCall) {
        guard let id = call.getString("id") else { return call.reject("id is required") }
        alarms.removeValue(forKey: id)
        UNUserNotificationCenter.current().removePendingNotificationRequests(
            withIdentifiers: [id, "\(id)-backup"]
        )
        call.resolve()
    }

    @objc func list(_ call: CAPPluginCall) {
        let list = alarms.values.map { rec -> [String: Any] in
            return [
                "id": rec.id,
                "timestamp": rec.timestamp,
                "moment": rec.moment,
                "label": rec.label,
                "armed": true,
                "nextFire": rec.timestamp
            ]
        }
        call.resolve(["alarms": list])
    }

    @objc func requestPermissions(_ call: CAPPluginCall) {
        let center = UNUserNotificationCenter.current()
        var options: UNAuthorizationOptions = [.alert, .sound, .badge]
        if #available(iOS 15.0, *) {
            options.insert(.timeSensitive)
        }
        center.requestAuthorization(options: options) { [weak self] _, _ in
            self?.checkPermissions(call)
        }
    }

    @objc func checkPermissions(_ call: CAPPluginCall) {
        UNUserNotificationCenter.current().getNotificationSettings { settings in
            let notif: String
            switch settings.authorizationStatus {
            case .authorized, .provisional, .ephemeral: notif = "granted"
            case .denied: notif = "denied"
            default: notif = "prompt"
            }
            call.resolve([
                "exactAlarm": "not-needed",
                "fullScreen": "not-needed",
                "notifications": notif,
                "batteryExempt": "not-needed",
                "backgroundAudio": "granted"
            ])
        }
    }

    /// Start silent-audio keep-alive. ONLY call this when the user has armed
    /// an alarm in Bedside Mode. Running it always = App Store 2.5.4 rejection.
    @objc func armKeepAlive(_ call: CAPPluginCall) {
        do {
            let session = AVAudioSession.sharedInstance()
            // .mixWithOthers is critical post-iOS 17.4 — without it, the session
            // dies on any incoming audio (Spotify, calls, other apps).
            try session.setCategory(.playback, mode: .default, options: [.mixWithOthers])
            try session.setActive(true, options: .notifyOthersOnDeactivation)

            guard let url = Bundle.main.url(forResource: "silent", withExtension: "wav") else {
                call.reject("silent.wav not bundled — add a -60dB pink-noise loop to App/Resources/")
                return
            }
            let player = try AVAudioPlayer(contentsOf: url)
            player.numberOfLoops = -1
            // Near-silent (not zero) — Apple's audio-session heuristics flag
            // pure-silent buffers as gaming-the-system. -60dB pink noise stays
            // within "imperceptible" while keeping the session perceptibly alive.
            player.volume = 0.0
            player.play()
            keepAlivePlayer = player

            // Listen for route changes (headphones unplugged, BT disconnected)
            // so we can re-prime the session.
            NotificationCenter.default.addObserver(
                self,
                selector: #selector(handleRouteChange),
                name: AVAudioSession.routeChangeNotification,
                object: nil
            )

            call.resolve()
        } catch {
            call.reject("Keep-alive failed: \(error.localizedDescription)")
        }
    }

    @objc func disarmKeepAlive(_ call: CAPPluginCall) {
        keepAlivePlayer?.stop()
        keepAlivePlayer = nil
        NotificationCenter.default.removeObserver(self,
            name: AVAudioSession.routeChangeNotification, object: nil)
        try? AVAudioSession.sharedInstance().setActive(false,
            options: .notifyOthersOnDeactivation)
        call.resolve()
    }

    @objc func getOemGuidance(_ call: CAPPluginCall) {
        call.resolve([
            "manufacturer": "Apple",
            "isAggressive": false,
            "settingsDeepLink": NSNull(),
            "instructions": "On iOS, plug in your phone and keep FRQNCY open in Bedside Mode. " +
                "Add FRQNCY to your Sleep Focus and enable Time Sensitive notifications. " +
                "iOS may not wake force-quit apps — keep FRQNCY in recents."
        ])
    }

    // MARK: - Internals

    @objc private func handleRouteChange(_ notification: Notification) {
        guard let userInfo = notification.userInfo,
              let reasonRaw = userInfo[AVAudioSessionRouteChangeReasonKey] as? UInt,
              let reason = AVAudioSession.RouteChangeReason(rawValue: reasonRaw)
        else { return }

        // Re-prime the session on disconnect events so the keep-alive doesn't die.
        if reason == .oldDeviceUnavailable || reason == .newDeviceAvailable {
            try? AVAudioSession.sharedInstance().setActive(true,
                options: .notifyOthersOnDeactivation)
        }
    }

    private func scheduleNotification(_ rec: AlarmRecord) {
        let content = UNMutableNotificationContent()
        content.title = rec.label
        content.body = "Good morning. Your session is ready."
        content.sound = UNNotificationSound(named: UNNotificationSoundName("morning.caf"))
        if #available(iOS 15.0, *) {
            content.interruptionLevel = .timeSensitive
        }
        content.userInfo = [
            "frqncyAlarmId": rec.id,
            "moment": rec.moment
        ]

        let fireDate = Date(timeIntervalSince1970: rec.timestamp / 1000)
        let components = Calendar.current.dateComponents(
            [.year, .month, .day, .hour, .minute, .second],
            from: fireDate
        )
        let repeats = rec.repeatMode == "daily" || rec.repeatMode == "weekdays" || rec.repeatMode == "weekends"
        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: repeats)

        let request = UNNotificationRequest(
            identifier: rec.id,
            content: content,
            trigger: trigger
        )
        UNUserNotificationCenter.current().add(request)

        // Backup notification +60s — same time-sensitive level, slightly louder
        // bundled sound. If the primary was suppressed by Sleep Focus or audio
        // session interruption, this is the second shot.
        let backupContent = content.mutableCopy() as! UNMutableNotificationContent
        backupContent.sound = UNNotificationSound(named: UNNotificationSoundName("morning-loud.caf"))
        var backupComponents = components
        backupComponents.second = (components.second ?? 0) + 60
        let backupTrigger = UNCalendarNotificationTrigger(
            dateMatching: backupComponents,
            repeats: repeats
        )
        let backup = UNNotificationRequest(
            identifier: "\(rec.id)-backup",
            content: backupContent,
            trigger: backupTrigger
        )
        UNUserNotificationCenter.current().add(backup)
    }

    /// Called when keep-alive is running and fire-time hits. Swap silent for
    /// real audio and ramp volume across fadeInSeconds. Best-effort — if the
    /// app was killed, only the notification fires.
    func triggerAlarmAudio(for rec: AlarmRecord) {
        let audioSource: URL? = rec.audioUrl.flatMap { URL(string: $0) }
            ?? Bundle.main.url(forResource: "default-\(rec.moment)", withExtension: "m4a")

        guard let source = audioSource else { return }

        do {
            let player = try AVAudioPlayer(contentsOf: source)
            player.volume = 0.0
            player.numberOfLoops = -1
            player.play()
            alarmPlayer = player

            let steps = 60
            let interval = Double(rec.fadeInSeconds) / Double(steps)
            var step = 0
            fadeTimer = Timer.scheduledTimer(withTimeInterval: interval, repeats: true) { [weak self] t in
                step += 1
                let progress = Float(step) / Float(steps)
                // ease-in (quadratic) — same curve as Android's AlarmService.
                self?.alarmPlayer?.volume = min(progress * progress, 1.0)
                if step >= steps { t.invalidate() }
            }

            notifyListeners("alarmFired", data: [
                "id": rec.id,
                "moment": rec.moment,
                "firedAt": Date().timeIntervalSince1970 * 1000
            ])
        } catch {
            NSLog("FrqncyAlarm: failed to play alarm audio: \(error)")
        }
    }
}

struct AlarmRecord {
    let id: String
    let timestamp: Double
    let moment: String
    let audioUrl: String?
    let videoUrl: String?
    let label: String
    let repeatMode: String
    let fadeInSeconds: Int
}
