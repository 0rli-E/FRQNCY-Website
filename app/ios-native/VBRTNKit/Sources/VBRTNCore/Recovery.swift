import Foundation

public struct RecoveryPrompt: Equatable {
    public let stem: String
    public let frame: String
}

public struct RecoveryCard: Equatable {
    public let kind: String // "necessity" | "impossibility"
    public let sentence: String
    public let prompt: String
    public let frame: String
    public let index: Int
}

public struct ModalCapture: Equatable {
    public let kind: String // "necessity" | "impossibility"
    public let match: String
}

/// The modal-operator layer — VBRTN's single highest-leverage technique.
/// Detection runs over what the person writes; recovery questions rotate so
/// the same sentence is met from a different angle each time.
public enum Recovery {

    public static let necessity: [RecoveryPrompt] = [
        RecoveryPrompt(stem: "What would happen if you did not?", frame: "Recover the consequence."),
        RecoveryPrompt(stem: "What would you choose if you were not supposed to?", frame: "Shift from necessity to possibility."),
        RecoveryPrompt(stem: "Whose voice is the \"have to\" in?", frame: "Recover the locus of authority."),
    ]

    public static let impossibility: [RecoveryPrompt] = [
        RecoveryPrompt(stem: "What stops you?", frame: "Surface the specific constraint."),
        RecoveryPrompt(stem: "What would happen if you did?", frame: "Surface the feared consequence."),
        RecoveryPrompt(stem: "What would have to be true for you to be able to?", frame: "Open the conditions."),
    ]

    // MARK: - Detection (port of detectModalOperators)

    private static let necessityPatterns = [
        "\\bi\\s+have\\s+to\\s+([^.,!?\\n]+)",
        "\\bi\\s+should\\s+([^.,!?\\n]+)",
        "\\bi\\s+must\\s+([^.,!?\\n]+)",
        "\\bi\\s+need\\s+to\\s+([^.,!?\\n]+)",
        "\\bi\\s+ought\\s+to\\s+([^.,!?\\n]+)",
    ]

    private static let impossibilityPatterns = [
        "\\bi\\s+can'?t\\s+([^.,!?\\n]+)",
        "\\bi\\s+cannot\\s+([^.,!?\\n]+)",
        "\\bi\\s+won'?t\\s+([^.,!?\\n]+)",
        "\\bi\\s+couldn'?t\\s+([^.,!?\\n]+)",
    ]

    public static func detect(in text: String) -> [ModalCapture] {
        var found: [ModalCapture] = []
        let range = NSRange(text.startIndex..., in: text)
        for pattern in necessityPatterns {
            if let match = firstMatch(pattern, text: text, range: range) {
                found.append(ModalCapture(kind: "necessity", match: match))
            }
        }
        for pattern in impossibilityPatterns {
            if let match = firstMatch(pattern, text: text, range: range) {
                found.append(ModalCapture(kind: "impossibility", match: match))
            }
        }
        return found
    }

    private static func firstMatch(_ pattern: String, text: String, range: NSRange) -> String? {
        guard let regex = try? NSRegularExpression(pattern: pattern, options: [.caseInsensitive]),
              let m = regex.firstMatch(in: text, options: [], range: range),
              let r = Range(m.range, in: text) else { return nil }
        return String(text[r]).trimmingCharacters(in: .whitespacesAndNewlines)
    }

    // MARK: - The current card (port of getCurrentRecovery)

    public static func currentCard(profile: JSONValue, store: ProfileStore = .shared) -> RecoveryCard? {
        let nec = asList(profile["meta"]["modalOperators"]["necessity"]).first
        let imp = asList(profile["meta"]["modalOperators"]["impossibility"]).first
        guard nec != nil || imp != nil else { return nil }

        let kind: String
        if nec != nil && imp != nil {
            kind = store.recoveryLastKind == "necessity" ? "impossibility" : "necessity"
        } else if nec != nil {
            kind = "necessity"
        } else {
            kind = "impossibility"
        }
        let prompts = kind == "necessity" ? necessity : impossibility
        let idx = (store.recoveryRotation[kind] ?? 0) % prompts.count
        let sentence = kind == "necessity" ? (nec ?? "") : (imp ?? "")
        return RecoveryCard(kind: kind, sentence: sentence,
                            prompt: prompts[idx].stem, frame: prompts[idx].frame, index: idx)
    }

    public static func rotate(after card: RecoveryCard, store: ProfileStore = .shared) {
        let prompts = card.kind == "necessity" ? necessity : impossibility
        var rotation = store.recoveryRotation
        rotation[card.kind] = (card.index + 1) % prompts.count
        store.recoveryRotation = rotation
        store.recoveryLastKind = card.kind
    }

    /// Record detected captures on the profile, matching the web shape
    /// ({text, at, source} entries appended to the operator list).
    public static func record(_ captures: [ModalCapture], in profile: inout JSONValue) {
        guard !captures.isEmpty else { return }
        let now = Date().timeIntervalSince1970 * 1000
        for capture in captures {
            var list = profile["meta"]["modalOperators"][capture.kind].array ?? []
            // Normalise legacy plain-string entries into capture objects.
            list = list.map { item in
                if let s = item.string { return .object(["text": .string(s)]) }
                return item
            }
            list.append(.object([
                "text": .string(capture.match),
                "at": .number(now),
                "source": .string("companion"),
            ]))
            profile["meta"]["modalOperators"][capture.kind] = .array(list)
        }
    }
}
