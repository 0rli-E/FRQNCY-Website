import Foundation
import SwiftUI
import UserNotifications
import VBRTNCore

public enum FeedRole {
    case user
    case vbrtn
}

/// Everything is a message — the intake, the morning open, the recovery card
/// and the thread all live in one scroll. New server capabilities land as new
/// feed kinds; unknown payloads fall back to plain text.
public struct FeedItem: Identifiable {
    public enum Kind {
        case dayline(String)
        case openline(primary: String, sub: String?)
        case message(role: FeedRole, text: String, thinking: Bool)
        case reflection(String)
        case welcome
        case startButtons
        case continueIntake(label: String)
        case intakeCard(IntakeQuestion, pos: Int)
        case recovery(RecoveryCard)
    }

    public let id: UUID
    public var kind: Kind

    init(_ kind: Kind) {
        self.id = UUID()
        self.kind = kind
    }
}

public struct CloudMemory: Identifiable {
    public let id: Int // index in the stored array
    public let kind: String
    public let content: String
}

/// The companion's client-side brain: boot flow, intake engine, streaming
/// chat, cloud sync, memory transparency, export/erase. A port of the shared
/// web client, so every surface behaves identically.
@MainActor
public final class AppModel: ObservableObject {
    @Published public var feed: [FeedItem] = []
    @Published public var sending = false
    @Published public var composerPlaceholder = "Say what's true right now…"
    @Published public var morningNotificationEnabled: Bool

    public let auth: AuthStore
    let store = ProfileStore.shared

    public init(auth: AuthStore) {
        self.auth = auth
        self.morningNotificationEnabled = ProfileStore.shared.morningNotificationEnabled
        boot(clear: false)
        Task { await hydrateFromCloud() }
        refreshMorningNotification()
    }

    // MARK: - Boot (port of renderBoot)

    public func boot(clear: Bool) {
        feed = []
        let profile = store.load()
        let pos = store.intakePos
        let answered = (profile["_intakeAnswers"].object ?? [:]).count

        if answered == 0 && pos == 0 {
            feed.append(FeedItem(.welcome))
            feed.append(FeedItem(.message(role: .vbrtn, text: "I'm the companion — one agent, walking beside you toward who you already are. Before I can reflect anything true, I need to meet you: about twelve minutes, twenty-five questions, five short sessions you can leave anytime. Everything you tell me stays yours — visible, exportable, erasable.", thinking: false)))
            feed.append(FeedItem(.startButtons))
            return
        }

        let today = Self.dayStamp()
        feed.append(FeedItem(.dayline(Self.dayLabel())))
        if store.morningShown != today || clear {
            store.morningShown = today
            let line = MorningOpen.generate(from: profile)
            feed.append(FeedItem(.openline(primary: line.primary, sub: line.sub)))
        }

        let messages = store.storedThread(profile).suffix(40)
        for m in messages {
            feed.append(FeedItem(.message(role: m.role == "user" ? .user : .vbrtn, text: m.content, thinking: false)))
        }

        if pos < Intake.questions.count {
            feed.append(FeedItem(.continueIntake(label: answered > 0 ? "Continue the intake" : "Begin the intake")))
        } else {
            if messages.isEmpty {
                feed.append(FeedItem(.message(role: .vbrtn, text: IntakeLogic.threadSeed(profile), thinking: false)))
            }
            if let card = Recovery.currentCard(profile: profile) {
                feed.append(FeedItem(.recovery(card)))
                Signals.send("recovery-shown", extra: ["kind": card.kind, "prompt": card.index])
            }
        }
    }

    // MARK: - Intake engine

    public func beginIntake() {
        feed.removeAll { if case .startButtons = $0.kind { return true }; if case .continueIntake = $0.kind { return true }; return false }
        Signals.send("intake-start")
        runIntake()
    }

    public func justTalk() {
        feed.removeAll { if case .startButtons = $0.kind { return true }; return false }
        let profile = store.load()
        feed.append(FeedItem(.message(role: .vbrtn, text: IntakeLogic.threadSeed(profile), thinking: false)))
    }

    private func runIntake() {
        let pos = store.intakePos
        if pos >= Intake.questions.count {
            var profile = store.load()
            if profile["baseline"]["intakeCompletedAt"].isNull {
                profile["baseline"]["intakeCompletedAt"] = .number(Date().timeIntervalSince1970 * 1000)
                store.save(profile)
                feed.append(FeedItem(.message(role: .vbrtn, text: IntakeLogic.threadSeed(profile), thinking: false)))
                Signals.send("intake-complete")
                Task { await pushCloud() }
            }
            return
        }
        let q = Intake.questions[pos]
        let previous = pos > 0 ? Intake.questions[pos - 1] : nil
        if previous == nil || previous!.session != q.session {
            feed.append(FeedItem(.dayline("Session \(q.session) of 5 — \(q.sessionTitle)")))
        }
        feed.append(FeedItem(.intakeCard(q, pos: pos)))
    }

    public func answerIntake(_ q: IntakeQuestion, value: JSONValue, skipped: Bool) {
        feed.removeAll { if case .intakeCard = $0.kind { return true }; return false }
        if !skipped {
            var profile = store.load()
            IntakeLogic.commitAnswer(q, value: value, profile: &profile)
            store.save(profile)
            let label = IntakeLogic.answerLabel(q, value: value)
            if !label.isEmpty {
                feed.append(FeedItem(.message(role: .user, text: label, thinking: false)))
            }
            if let reflection = IntakeLogic.reflection(q, value: value) {
                feed.append(FeedItem(.reflection(reflection)))
            }
            if q.id == "birthData" {
                let fresh = store.load()
                if let type = fresh["design"]["hd"]["type"].nonEmptyString {
                    let strategy = (fresh["design"]["hd"]["strategy"].string ?? "").lowercased()
                    feed.append(FeedItem(.reflection("Your chart is drawn — a \(type), \(strategy). It lives under \u{201C}design\u{201D}, above.")))
                }
            }
        } else {
            feed.append(FeedItem(.message(role: .user, text: "Skip for now", thinking: false)))
        }
        store.intakePos += 1
        Signals.send("intake-step", extra: ["step": q.id, "skipped": skipped])
        Task { @MainActor in
            try? await Task.sleep(nanoseconds: 350_000_000)
            self.runIntake()
        }
    }

    // MARK: - Chat (streaming against /api/companion)

    public func send(_ rawText: String) {
        let text = rawText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty, !sending else { return }
        sending = true
        composerPlaceholder = "Say what's true right now…"

        feed.append(FeedItem(.message(role: .user, text: text, thinking: false)))
        store.appendInteraction(kind: "companion-user", text: text)

        var profile = store.load()
        let detected = Recovery.detect(in: text)
        if !detected.isEmpty {
            Recovery.record(detected, in: &profile)
            store.save(profile)
        }

        let prior = Array(store.storedThread(store.load()).suffix(12))
        var payload = prior.isEmpty ? [ChatMsg(role: "user", content: text)] : prior
        if !prior.isEmpty, prior.last?.content != text {
            payload.append(ChatMsg(role: "user", content: text))
        }

        let bubble = FeedItem(.message(role: .vbrtn, text: "", thinking: true))
        feed.append(bubble)
        let bubbleId = bubble.id

        Task { @MainActor in
            var reply = ""
            var via: String?
            do {
                let token = await auth.validToken()
                let slim = ProfileShapes.slimProfile(store.load())
                let stream = CompanionAPI.stream(
                    profile: slim,
                    messages: payload,
                    threadId: store.threadId,
                    token: token
                )
                for try await event in stream {
                    switch event {
                    case .delta(let piece):
                        reply += piece
                        self.updateBubble(bubbleId, text: reply, thinking: false)
                    case .done(let doneVia, let threadId):
                        via = doneVia
                        if let threadId = threadId { self.store.threadId = threadId }
                    }
                }
                reply = reply.trimmingCharacters(in: .whitespacesAndNewlines)
                if reply.isEmpty {
                    self.updateBubble(bubbleId, text: "I went quiet for a moment. Say it once more?", thinking: false)
                } else {
                    self.store.appendInteraction(kind: "companion-vbrtn", text: reply)
                    Signals.send("exchange", extra: ["landed": true, "via": via ?? "unknown"])
                }
            } catch {
                let offline = "I can't reach you from here — the companion needs a connection. Your words are saved."
                let quiet = "I went quiet for a moment. Say it once more?"
                let message = (error is URLError) ? offline : quiet
                if reply.isEmpty {
                    self.updateBubble(bubbleId, text: message, thinking: false)
                } else {
                    self.store.appendInteraction(kind: "companion-vbrtn", text: reply)
                }
            }
            self.sending = false
        }
    }

    private func updateBubble(_ id: UUID, text: String, thinking: Bool) {
        guard let index = feed.firstIndex(where: { $0.id == id }) else { return }
        if case .message(let role, _, _) = feed[index].kind {
            // Models sometimes open with blank lines; the thread never shows them.
            let display = text.trimmingCharacters(in: .whitespacesAndNewlines)
            feed[index].kind = .message(role: role, text: display, thinking: thinking)
        }
    }

    // MARK: - Recovery card actions

    public func recoveryAnswer(_ card: RecoveryCard) {
        composerPlaceholder = card.prompt
    }

    public func recoveryRotate(_ card: RecoveryCard, itemId: UUID) {
        Recovery.rotate(after: card)
        Signals.send("recovery-rotated", extra: ["kind": card.kind, "prompt": card.index, "landed": false])
        feed.removeAll { $0.id == itemId }
        if let fresh = Recovery.currentCard(profile: store.load()) {
            feed.append(FeedItem(.recovery(fresh)))
        }
    }

    // MARK: - Cloud sync (charts row name='VBRTN', RLS)

    public func hydrateFromCloud() async {
        guard let token = await auth.validToken(), let uid = auth.user?.id else { return }
        guard let row = try? await CompanionAPI.pullVbrtnRow(userId: uid, token: token) else { return }
        let data = row["data"]
        guard data.object != nil else { return }

        let local = store.load()
        let localHas = store.intakeDone(local)
        // Canonical rows nest the profile; legacy rows ARE the profile.
        var cloudProfile: JSONValue = .null
        if data["profile"].object != nil {
            cloudProfile = data["profile"]
        } else if data["standing"].object != nil || data["_intakeAnswers"].object != nil {
            cloudProfile = data
        }
        let cloudHas = !(cloudProfile["_intakeAnswers"].object ?? [:]).isEmpty

        if cloudHas && !localHas {
            // A returning person on a fresh device: the account remembers.
            var merged = cloudProfile
            if merged["triggers"]["negative"].array == nil {
                merged["triggers"]["negative"] = .array([])
            }
            store.save(merged)
            store.intakePos = Intake.questions.count
            boot(clear: true)
        } else if localHas {
            await pushCloud()
        }
    }

    public func pushCloud() async {
        guard let token = await auth.validToken(), let uid = auth.user?.id else { return }
        let safe = ProfileShapes.cloudSafeProfile(store.load())
        try? await CompanionAPI.pushProfile(safe, userId: uid, token: token)
        store.cloudSyncedAt = ISO8601DateFormatter().string(from: Date())
    }

    // MARK: - Threads

    public func loadThreads() async -> [ThreadInfo]? {
        guard let token = await auth.validToken() else { return nil }
        return try? await CompanionAPI.threads(token: token)
    }

    public func openThread(_ id: String) async {
        guard let token = await auth.validToken() else { return }
        guard let messages = try? await CompanionAPI.threadMessages(id: id, token: token) else { return }
        store.clearConversation()
        for m in messages {
            store.appendInteraction(kind: m.role == "user" ? "companion-user" : "companion-vbrtn", text: m.content)
        }
        store.threadId = id
        boot(clear: true)
    }

    public func newConversation() {
        store.clearConversation()
        boot(clear: true)
    }

    // MARK: - Memory transparency

    public func fetchCloudMemories() async -> [CloudMemory]? {
        guard let token = await auth.validToken(), let uid = auth.user?.id else { return nil }
        guard let row = try? await CompanionAPI.pullVbrtnRow(userId: uid, token: token) else { return nil }
        let memories = row["data"]["memories"].array ?? []
        return memories.enumerated().compactMap { index, m in
            guard let content = m["content"].nonEmptyString else { return nil }
            return CloudMemory(id: index, kind: m["kind"].nonEmptyString ?? "noted", content: content)
        }
    }

    public func deleteCloudMemory(at index: Int) async -> Bool {
        guard let token = await auth.validToken(), let uid = auth.user?.id else { return false }
        guard let row = try? await CompanionAPI.pullVbrtnRow(userId: uid, token: token),
              let rowId = row["id"].queryString else { return false }
        var data = row["data"]
        var memories = data["memories"].array ?? []
        guard index >= 0, index < memories.count else { return false }
        memories.remove(at: index)
        data["memories"] = .array(memories)
        do {
            try await CompanionAPI.patchRowData(rowId: rowId, data: data, token: token)
            return true
        } catch {
            return false
        }
    }

    // MARK: - Export / erase

    public func exportEverything() async -> String? {
        guard let token = await auth.validToken() else { return nil }
        return try? await CompanionAPI.exportData(token: token)
    }

    public func eraseEverything() async {
        if let token = await auth.validToken() {
            try? await CompanionAPI.eraseData(token: token)
        }
        store.eraseAll()
        boot(clear: true)
    }

    // MARK: - Morning notification (Phase A: local; server push follows in Phase C)

    public func setMorningNotification(_ enabled: Bool) async {
        if enabled {
            let center = UNUserNotificationCenter.current()
            let granted = (try? await center.requestAuthorization(options: [.alert, .sound])) ?? false
            store.morningNotificationEnabled = granted
            morningNotificationEnabled = granted
            if granted { refreshMorningNotification() }
        } else {
            store.morningNotificationEnabled = false
            morningNotificationEnabled = false
            UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: ["vbrtn.morning"])
        }
    }

    public func refreshMorningNotification() {
        guard store.morningNotificationEnabled else { return }
        let line = MorningOpen.generate(from: store.load())
        let content = UNMutableNotificationContent()
        content.title = "VBRTN"
        content.body = line.primary
        content.sound = .default
        var components = DateComponents()
        components.hour = 8
        components.minute = 0
        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: true)
        let request = UNNotificationRequest(identifier: "vbrtn.morning", content: content, trigger: trigger)
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: ["vbrtn.morning"])
        center.add(request)
    }

    // MARK: - Day stamps

    static func dayStamp() -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: Date())
    }

    static func dayLabel() -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEEE, MMMM d"
        return formatter.string(from: Date())
    }
}
