/**
 * FrqncyAlarmPlugin.swift — iOS native side of the FRQNCY alarm feature.
 *
 * This file is a SKELETON. After running `npx cap add ios`, copy it to:
 *   ios/App/App/FrqncyAlarm/FrqncyAlarmPlugin.swift
 * and register the plugin in ios/App/App/AppDelegate.swift.
 *
 * iOS has no public alarm API. The strategy:
 *   1. Schedule a time-sensitive UNNotification with a bundled <30s .caf sound.
 *   2. When user arms Bedside Mode: start silent-audio keep-alive via
 *      AVAudioSession(.playback) + AVAudioPlayer(numberOfLoops = -1).
 *      This keeps the app process alive so we can swap in the real alarm
 *      audio at fire-time and ramp volume.
 *   3. Backup notification 60 seconds later with louder sound.
 *
 * CRITICAL: silent-audio keep-alive MUST be gated to armed-alarm state only.
 * Running it always gets apps rejected under Apple Guideline 2.5.4.
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

    // MARK: - Public JS methods

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
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [id, "\(id)-backup"])
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
        center.requestAuthorization(options: [.alert, .sound, .badge, .timeSensitive]) { [weak self] granted, _ in
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
                "backgroundAudio": "granted" // Declared in Info.plist UIBackgroundModes
            ])
        }
    }

    /// Start silent-audio keep-alive. ONLY call this when user enters Bedside Mode
    /// with an alarm armed. Running it continuously will fail App Store review.
    @objc func armKeepAlive(_ call: CAPPluginCall) {
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playback, mode: .default, options: [.mixWithOthers])
            try session.setActive(true, options: .notifyOthersOnDeactivation)

            // Bundle a tiny silent.wav file at App/Resources/silent.wav
            guard let url = Bundle.main.url(forResource: "silent", withExtension: "wav") else {
                call.reject("silent.wav not bundled")
                return
            }
            let player = try AVAudioPlayer(contentsOf: url)
            player.numberOfLoops = -1
            player.volume = 0.0  // fully silent; process stays alive
            player.play()
            keepAlivePlayer = player
            call.resolve()
        } catch {
            call.reject("Keep-alive failed: \(error.localizedDescription)")
        }
    }

    @objc func disarmKeepAlive(_ call: CAPPluginCall) {
        keepAlivePlayer?.stop()
        keepAlivePlayer = nil
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
        call.resolve()
    }

    @objc func getOemGuidance(_ call: CAPPluginCall) {
        call.resolve([
            "manufacturer": "Apple",
            "isAggressive": false,
            "settingsDeepLink": NSNull(),
            "instructions": "For the most reliable alarm, plug in your phone, keep FRQNCY open in Bedside Mode, and do not force-quit the app."
        ])
    }

    // MARK: - Internals

    private func scheduleNotification(_ rec: AlarmRecord) {
        let content = UNMutableNotificationContent()
        content.title = rec.label
        content.body = "Good morning. Your session is ready."
        content.sound = UNNotificationSound(named: UNNotificationSoundName("morning.caf"))
        if #available(iOS 15.0, *) {
            content.interruptionLevel = .timeSensitive
        }

        let fireDate = Date(timeIntervalSince1970: rec.timestamp / 1000)
        let components = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute, .second], from: fireDate)
        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)

        let request = UNNotificationRequest(identifier: rec.id, content: content, trigger: trigger)
        UNUserNotificationCenter.current().add(request)

        // Backup notification 60s later with louder sound
        let backupContent = content.mutableCopy() as! UNMutableNotificationContent
        backupContent.sound = UNNotificationSound(named: UNNotificationSoundName("morning-loud.caf"))
        var backupComponents = components
        backupComponents.second = (components.second ?? 0) + 60
        let backupTrigger = UNCalendarNotificationTrigger(dateMatching: backupComponents, repeats: false)
        let backup = UNNotificationRequest(identifier: "\(rec.id)-backup", content: backupContent, trigger: backupTrigger)
        UNUserNotificationCenter.current().add(backup)
    }

    /// Called when keep-alive is running and fire-time hits. Swap silent for real audio and ramp volume.
    func triggerAlarmAudio(for rec: AlarmRecord) {
        guard let audioSource = rec.audioUrl.flatMap({ URL(string: $0) })
              ?? Bundle.main.url(forResource: "default-\(rec.moment)", withExtension: "m4a") else { return }

        do {
            let player = try AVAudioPlayer(contentsOf: audioSource)
            player.volume = 0.0
            player.play()
            alarmPlayer = player

            let steps = 60  // 60 volume increments over fadeInSeconds
            let interval = Double(rec.fadeInSeconds) / Double(steps)
            var step = 0
            fadeTimer = Timer.scheduledTimer(withTimeInterval: interval, repeats: true) { [weak self] t in
                step += 1
                let v = Float(step) / Float(steps)
                self?.alarmPlayer?.volume = min(v * v, 1.0)  // ease-in
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
