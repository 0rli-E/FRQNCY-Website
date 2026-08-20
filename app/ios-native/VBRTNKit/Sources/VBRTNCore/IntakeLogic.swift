import Foundation

/// The answer-commit rules — a faithful port of the shared client logic, so
/// every surface writes the identical profile shape.
public enum IntakeLogic {

    /// Apply one answered question to the profile (mutating), including the
    /// derived fields: chart from birth data, Teachability Index, baselines.
    public static func commitAnswer(_ q: IntakeQuestion, value: JSONValue, profile: inout JSONValue) {
        let now = Date().timeIntervalSince1970 * 1000

        switch q.field {
        case "meta.modalOperators.necessity":
            if let text = value.nonEmptyString {
                profile["meta"]["modalOperators"]["necessity"] =
                    .array([.object(["text": .string(text), "at": .number(now)])])
            }
        case "meta.modalOperators.impossibility":
            if let text = value.nonEmptyString {
                profile["meta"]["modalOperators"]["impossibility"] =
                    .array([.object(["text": .string(text), "at": .number(now)])])
            }
        case "meta.convincer":
            profile["meta"]["convincer"] = .object(["mode": value, "count": .null])
        case "design.birth":
            if value.object != nil {
                profile["design"]["birth"] = value
                if let design = ChartEngine.shared.computeDesign(birth: value) {
                    profile["design"]["hd"] = design["hd"]
                    profile["design"]["gk"] = design["gk"]
                    profile["design"]["astro"] = design["astro"]
                }
            }
        default:
            if !value.isNull, value.string != "" {
                profile.set(path: q.field, to: value)
            }
        }

        if q.field == "standing.recentFeeling" {
            profile["baseline"]["recentFeelingAtIntake"] = value
        }
        if q.field == "baseline.desireToLearn" || q.field == "baseline.willingnessToChange" {
            if let d = profile["baseline"]["desireToLearn"].int,
               let w = profile["baseline"]["willingnessToChange"].int {
                let ti = d * w
                profile["baseline"]["teachabilityIndex"] = .number(Double(ti))
                profile["state"]["ti"] = .object([
                    "current": .number(Double(ti)),
                    "history": .array([.object(["at": .number(now), "value": .number(Double(ti))])]),
                ])
            }
        }
        if q.field == "baseline.chiefAimDistance" {
            profile["state"]["chiefAimDistance"] = .object([
                "current": value,
                "history": .array([.object(["at": .number(now), "value": value])]),
            ])
        }

        profile["_intakeAnswers"][q.id] = .object(["value": value, "at": .number(now)])
    }

    /// The line echoed into the thread as the person's message.
    public static func answerLabel(_ q: IntakeQuestion, value: JSONValue) -> String {
        switch q.type {
        case .tiles:
            if let v = value.string, let option = q.options.first(where: { $0.value == v }) {
                return option.label
            }
            return value.string ?? ""
        case .list:
            return asList(value).joined(separator: "\n")
        case .birthForm:
            guard let date = value["date"].nonEmptyString else { return "" }
            var label = "Born \(date)"
            if let time = value["time"].nonEmptyString { label += " at \(time)" }
            if let city = value["city"].nonEmptyString { label += " — \(city)" }
            return label
        case .slider:
            if let n = value.int { return String(n) }
            return ""
        case .textarea:
            return value.string ?? ""
        }
    }

    /// The Cormorant reflection under the answer — per-option for tiles,
    /// per-question otherwise.
    public static func reflection(_ q: IntakeQuestion, value: JSONValue) -> String? {
        if q.type == .tiles, let v = value.string,
           let option = q.options.first(where: { $0.value == v }) {
            return option.reflection
        }
        return q.reflection
    }

    /// The thread seed once intake is complete (port of threadSeed).
    public static func threadSeed(_ profile: JSONValue) -> String {
        let remember = (profile["rememberOne"].string ?? "")
            .trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmed = remember.trimmingCharacters(in: CharacterSet(charactersIn: ".,;:!? "))
        if !trimmed.isEmpty {
            return "You asked to be remembered as \u{201C}\(trimmed)\u{201D}. I'm here. What's moving in you right now?"
        }
        if let feeling = profile["standing"]["recentFeeling"].nonEmptyString {
            return "You've been carrying \(feeling). I'm here, and I'm listening. Where do you want to begin?"
        }
        return "I'm here. Say what's true right now — one line, or many."
    }
}
