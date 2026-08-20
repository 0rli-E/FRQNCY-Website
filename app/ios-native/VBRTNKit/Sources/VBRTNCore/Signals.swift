import Foundation

/// Aggregate learning signals — patterns only, never content. The triplet
/// (shape, state, intervention) flows to /api/analytics; the person's words
/// never do.
public enum Signals {
    private static let sessionId: String = {
        UUID().uuidString.replacingOccurrences(of: "-", with: "").lowercased()
    }()

    public static func send(_ kind: String, extra: [String: Any] = [:]) {
        let profile = ProfileStore.shared.load()
        let hd = profile["design"]["hd"]
        var props: [String: Any] = [
            "shape": (hd["_stub"].boolValue != true ? hd["type"].nonEmptyString : nil) ?? "unknown",
            "state": profile["standing"]["recentFeeling"].nonEmptyString ?? NSNull(),
            "intervention": kind,
            "surface": "ios",
        ]
        for (k, v) in extra { props[k] = v }
        let body: [String: Any] = [
            "event_type": "vbrtn_signal",
            "session_id": sessionId,
            "properties": props,
        ]
        var request = URLRequest(url: FRQNCYConfig.apiBase.appendingPathComponent("api/analytics"))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        URLSession.shared.dataTask(with: request).resume() // fire and forget
    }
}
