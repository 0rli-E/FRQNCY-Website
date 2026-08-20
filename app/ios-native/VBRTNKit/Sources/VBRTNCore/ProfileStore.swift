import Foundation

/// Local working copy of the person's profile — same shape as the web +
/// Android surfaces, so an account moves between devices without translation.
/// The cloud (Supabase charts row, RLS) is canonical once signed in; this
/// store keeps the thread readable offline.
///
/// Privacy floor: negative-trigger NAMES live only here. cloudSafeProfile()
/// strips them before anything leaves the device.
public final class ProfileStore {
    public static let shared = ProfileStore()

    private let defaults = UserDefaults.standard

    // Mirrors of the web client's localStorage keys.
    private enum Key {
        static let threadId = "vbrtn.threadId"
        static let intakePos = "vbrtn.intakePos"
        static let morningShown = "vbrtn.morningShown"
        static let recoveryRotation = "vbrtn.recoveryRotation"
        static let cloudSyncedAt = "vbrtn.cloudSyncedAt"
        static let morningNotification = "vbrtn.morningNotificationEnabled"
    }

    private var cached: JSONValue?

    private var fileURL: URL {
        let dir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("VBRTN", isDirectory: true)
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir.appendingPathComponent("profile.json")
    }

    private init() {}

    // MARK: - Profile blob

    public func freshProfile() -> JSONValue {
        let now = Date().timeIntervalSince1970 * 1000 // JS epoch millis, shared shape
        return .object([
            "standing": .object(["texture": .null, "recentFeeling": .null, "dominantDesire": .null,
                                 "avoiding": .string(""), "pull": .string("")]),
            "design": .object(["birth": .null, "priorFamiliarity": .null, "cannotChange": .string(""),
                               "hd": .null, "gk": .null, "astro": .null]),
            "meta": .object(["toward_away": .null, "internal_external": .null, "options_procedures": .null,
                             "general_specific": .null, "sameness_difference": .null, "convincer": .null,
                             "modalOperators": .object(["necessity": .array([]), "impossibility": .array([])])]),
            "triggers": .object(["negative": .array([]), "positive": .array([]), "music": .string(""),
                                 "place": .string(""), "witnessedTruth": .string("")]),
            "rememberOne": .string(""),
            "baseline": .object(["intakeStartedAt": .number(now), "intakeCompletedAt": .null,
                                 "desireToLearn": .null, "willingnessToChange": .null,
                                 "teachabilityIndex": .null, "chiefAimDistance": .null,
                                 "recentFeelingAtIntake": .null]),
            "state": .object(["stateOctave": .string(""), "lastSevenJournalTones": .array([]),
                              "ti": .object(["current": .null, "history": .array([])]),
                              "chiefAimDistance": .object(["current": .null, "history": .array([])])]),
            "history": .object(["interactions": .array([]), "lastSeen": .null,
                                "journalEntries": .array([]), "habitShape": .object([:])]),
            "_intakeAnswers": .object([:]),
        ])
    }

    public func load() -> JSONValue {
        if let cached = cached { return cached }
        guard let data = try? Data(contentsOf: fileURL) else {
            let fresh = freshProfile()
            cached = fresh
            return fresh
        }
        let value = JSONValue.decode(data)
        let profile = value.object == nil ? freshProfile() : value
        cached = profile
        return profile
    }

    public func save(_ profile: JSONValue) {
        cached = profile
        try? profile.encoded().write(to: fileURL, options: .atomic)
    }

    public func intakeDone(_ profile: JSONValue) -> Bool {
        !(profile["_intakeAnswers"].object ?? [:]).isEmpty
    }

    // MARK: - Thread history in the profile (offline copy)

    public func storedThread(_ profile: JSONValue) -> [ChatMsg] {
        let interactions = profile["history"]["interactions"].array ?? []
        return interactions.compactMap { it in
            guard let kind = it["kind"].string, let text = it["text"].string else { return nil }
            if kind == "companion-user" { return ChatMsg(role: "user", content: text) }
            if kind == "companion-vbrtn" { return ChatMsg(role: "assistant", content: text) }
            return nil
        }
    }

    public func appendInteraction(kind: String, text: String) {
        var profile = load()
        var interactions = profile["history"]["interactions"].array ?? []
        interactions.append(.object([
            "at": .number(Date().timeIntervalSince1970 * 1000),
            "kind": .string(kind),
            "text": .string(text),
        ]))
        // Bound the offline copy; the account holds the full record.
        if interactions.count > 200 { interactions.removeFirst(interactions.count - 200) }
        profile["history"]["interactions"] = .array(interactions)
        profile["history"]["lastSeen"] = .number(Date().timeIntervalSince1970 * 1000)
        save(profile)
    }

    public func clearConversation() {
        var profile = load()
        let interactions = (profile["history"]["interactions"].array ?? []).filter { it in
            let kind = it["kind"].string
            return kind != "companion-user" && kind != "companion-vbrtn"
        }
        profile["history"]["interactions"] = .array(interactions)
        save(profile)
        threadId = nil
    }

    // MARK: - Small persisted state

    public var threadId: String? {
        get { defaults.string(forKey: Key.threadId) }
        set {
            if let v = newValue { defaults.set(v, forKey: Key.threadId) }
            else { defaults.removeObject(forKey: Key.threadId) }
        }
    }

    public var intakePos: Int {
        get { defaults.integer(forKey: Key.intakePos) }
        set { defaults.set(newValue, forKey: Key.intakePos) }
    }

    public var morningShown: String? {
        get { defaults.string(forKey: Key.morningShown) }
        set { defaults.set(newValue, forKey: Key.morningShown) }
    }

    public var recoveryRotation: [String: Int] {
        get {
            let raw = defaults.dictionary(forKey: Key.recoveryRotation) ?? [:]
            return raw.compactMapValues { $0 as? Int }
        }
        set { defaults.set(newValue, forKey: Key.recoveryRotation) }
    }

    public var recoveryLastKind: String? {
        get { defaults.string(forKey: "vbrtn.recoveryLastKind") }
        set { defaults.set(newValue, forKey: "vbrtn.recoveryLastKind") }
    }

    public var cloudSyncedAt: String? {
        get { defaults.string(forKey: Key.cloudSyncedAt) }
        set { defaults.set(newValue, forKey: Key.cloudSyncedAt) }
    }

    public var morningNotificationEnabled: Bool {
        get { defaults.bool(forKey: Key.morningNotification) }
        set { defaults.set(newValue, forKey: Key.morningNotification) }
    }

    /// Erase everything local — the device half of "erase everything".
    public func eraseAll() {
        cached = nil
        try? FileManager.default.removeItem(at: fileURL)
        [Key.threadId, Key.intakePos, Key.morningShown, Key.recoveryRotation,
         Key.cloudSyncedAt, "vbrtn.recoveryLastKind"].forEach { defaults.removeObject(forKey: $0) }
    }
}
