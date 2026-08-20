import Foundation

public struct MorningLine: Equatable {
    public let primary: String
    public let sub: String?
}

/// The morning open — one design-aware line, once per local day.
/// Port of the web surface's generator, including the stable per-day hash so
/// the same person sees the same line all day.
public enum MorningOpen {

    public static func generate(from p: JSONValue) -> MorningLine {
        let hd = p["design"]["hd"]
        let feeling = p["standing"]["recentFeeling"].nonEmptyString
        let desire = p["standing"]["dominantDesire"].nonEmptyString
        let texture = p["standing"]["texture"].nonEmptyString

        if let type = hd["type"].nonEmptyString {
            let designPrompts: [String: [String]] = [
                "Generator": [
                    "What are you responding to today?",
                    "Notice what your body says yes to before noon. Follow that.",
                    "You are designed to wait, then move. What just arrived in front of you?",
                ],
                "Manifesting Generator": [
                    "What are you responding to — and who needs to know your next move?",
                    "Two engines today. Respond first, then inform.",
                    "You will want to skip steps. The skipped step is where you go back for resistance.",
                ],
                "Projector": [
                    "Who saw you yesterday? That is the room to be in today.",
                    "Wait for the invitation. The invitation is closer than it looks.",
                    "You see the others; today, let one of them see you back.",
                ],
                "Manifestor": [
                    "What needs to be initiated this morning?",
                    "Inform the people who will be affected. Then move.",
                    "Your anger is information. Read it before you act on it.",
                ],
                "Reflector": [
                    "What does the room feel like today? You are the room's instrument.",
                    "No decisions today that cannot wait twenty-eight days.",
                    "Watch the moon. Watch yourself in it.",
                ],
            ]
            let arr = designPrompts[type] ?? designPrompts["Generator"]!
            let idx = simpleHash(dateString() + type) % arr.count
            return MorningLine(primary: arr[idx], sub: subForState(feeling: feeling, desire: desire))
        }

        if feeling != nil || desire != nil {
            let primary: String
            if let f = feeling {
                primary = feelingLine(f)
            } else {
                primary = "You are reaching for more \(desire ?? ""). The first move today is a small one in that direction."
            }
            let sub = (desire != nil && feeling != nil) ? "And: more \(desire!)." : nil
            return MorningLine(primary: primary, sub: sub)
        }

        if let t = texture {
            return MorningLine(primary: textureLine(t), sub: nil)
        }
        return MorningLine(primary: "Begin where you are. Not where you should be.", sub: nil)
    }

    static func subForState(feeling: String?, desire: String?) -> String? {
        if let f = feeling, let d = desire { return "Carrying \(f). Reaching for \(d)." }
        if let f = feeling { return "Today you are carrying \(f). Notice it; do not argue with it." }
        if let d = desire { return "Reaching for more \(d)." }
        return nil
    }

    static func feelingLine(_ f: String) -> String {
        let lines: [String: String] = [
            "tired": "Tired is data. Today, the first move is to rest something you are not consciously carrying.",
            "stressed": "Stress is the body running ahead of itself. Slow the body first. The mind follows.",
            "anxious": "Anxiety is the body knowing something the mind has not yet named. Name one thing today.",
            "overwhelmed": "Overwhelm means inputs outran capacity. Cut one input today. That is the entire move.",
            "sad": "Sadness is grief that has not been formally introduced. Today, introduce it.",
            "lonely": "Loneliness is the body asking for a specific kind of contact. Notice which kind, before deciding what to do.",
            "frustrated": "Frustration is the body saying something is asking to be responded to, not initiated. What are you trying to start that needs you to wait?",
            "angry": "Anger is power that has not yet found its direction. Today, find the direction.",
            "numb": "Numb is the body saying \"too much, too fast.\" Slow down. Today is small.",
            "restless": "Restless is asking. What is it asking for?",
            "hopeful": "Hope is unfinished — by design. What is the next finished thing?",
            "curious": "Curiosity pulls without pushing. Follow it for one move today.",
            "excited": "Excitement is desire that has not been disciplined. Both halves matter today.",
            "grateful": "Gratitude is the first frequency above survival. Notice you arrived there.",
            "content": "Content is rare. Stay in it longer than your mind wants to.",
            "peaceful": "Peace is rarely loud. The fact that you notice it is the proof.",
            "alive": "Alive is the baseline. What follows has to live up to it.",
        ]
        return lines[f] ?? "You are carrying something. The first move is to name it."
    }

    static func textureLine(_ t: String) -> String {
        let lines: [String: String] = [
            "stride": "You are in stride. Do not over-control it.",
            "building": "Slow building is the real kind. Today is one brick.",
            "holding": "You are holding it together. That is the work. Notice it.",
            "surviving": "Just getting through is its own strength. Today is small. That is enough.",
            "catching-breath": "Today is for breath. The work asks for nothing.",
            "restart": "Starting over is choosing the form again. What are you choosing?",
            "searching": "Looking means you have not given up. Today, look in one specific place.",
            "returning": "Coming back is the one motion the door does not lock against.",
        ]
        return lines[t] ?? "Begin where you are."
    }

    /// JS toDateString-shaped stamp ("Wed Aug 20 2026") — keeps the daily
    /// rotation aligned with the other surfaces.
    static func dateString(_ date: Date = Date()) -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "EEE MMM dd yyyy"
        return formatter.string(from: date)
    }

    /// Port of the JS simpleHash — 32-bit overflow arithmetic over UTF-16 units.
    static func simpleHash(_ s: String) -> Int {
        var h: Int32 = 0
        for unit in s.utf16 {
            h = (h &<< 5) &- h &+ Int32(unit)
        }
        return Int(h.magnitude)
    }
}
