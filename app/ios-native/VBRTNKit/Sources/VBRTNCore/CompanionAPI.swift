import Foundation

public struct ChatMsg: Equatable {
    public let role: String // "user" | "assistant"
    public let content: String
    public init(role: String, content: String) {
        self.role = role
        self.content = content
    }
}

public struct ThreadInfo: Identifiable, Equatable {
    public let id: String
    public let title: String
    public let updatedAt: String
}

public struct StoredMessage: Equatable {
    public let role: String
    public let content: String
    public let createdAt: String
}

public enum CompanionEvent {
    case delta(String)
    case done(via: String?, threadId: String?)
}

public struct CompanionError: LocalizedError {
    public let message: String
    public var errorDescription: String? { message }
}

/// The client of /api/companion v2 and /api/vbrtn-data — the shared runtime
/// every VBRTN surface speaks to. Signed-in calls run thin-client: newest
/// message + threadId, the server fills history from its own memory.
public enum CompanionAPI {

    // MARK: - Chat (SSE streaming)

    public static func stream(
        profile: JSONValue?,
        messages: [ChatMsg],
        threadId: String?,
        token: String?
    ) -> AsyncThrowingStream<CompanionEvent, Error> {
        AsyncThrowingStream { continuation in
            let task = Task {
                do {
                    var request = URLRequest(url: FRQNCYConfig.apiBase.appendingPathComponent("api/companion"))
                    request.httpMethod = "POST"
                    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
                    if let token = token {
                        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
                    }
                    var body: [String: Any] = [
                        "messages": messages.map { ["role": $0.role, "content": $0.content] },
                        "stream": true,
                    ]
                    if let profile = profile { body["profile"] = profile.anyValue }
                    if let threadId = threadId { body["threadId"] = threadId }
                    request.httpBody = try JSONSerialization.data(withJSONObject: body)

                    let (bytes, response) = try await URLSession.shared.bytes(for: request)
                    guard let http = response as? HTTPURLResponse else {
                        throw CompanionError(message: "No response")
                    }
                    let contentType = http.value(forHTTPHeaderField: "Content-Type") ?? ""

                    if http.statusCode >= 400 || !contentType.contains("text/event-stream") {
                        // JSON lane (error or non-stream fallback): collect and decode.
                        var data = Data()
                        for try await byte in bytes { data.append(byte) }
                        let json = JSONValue.decode(data)
                        if let err = json["error"].nonEmptyString {
                            throw CompanionError(message: err)
                        }
                        if http.statusCode >= 400 {
                            throw CompanionError(message: "The companion is unreachable (\(http.statusCode)).")
                        }
                        if let text = json["response"].nonEmptyString {
                            continuation.yield(.delta(text))
                        }
                        continuation.yield(.done(via: json["via"].string, threadId: json["threadId"].string))
                        continuation.finish()
                        return
                    }

                    var sawContent = false
                    for try await line in bytes.lines {
                        let trimmed = line.trimmingCharacters(in: .whitespaces)
                        guard trimmed.hasPrefix("data:") else { continue }
                        let payload = String(trimmed.dropFirst(5)).trimmingCharacters(in: .whitespaces)
                        guard !payload.isEmpty, payload != "[DONE]" else { continue }
                        let ev = JSONValue.decode(Data(payload.utf8))
                        if let delta = ev["delta"].string, !delta.isEmpty {
                            sawContent = true
                            continuation.yield(.delta(delta))
                        }
                        if ev["done"].boolValue == true {
                            continuation.yield(.done(via: ev["via"].string, threadId: ev["threadId"].string))
                        }
                        if let err = ev["error"].nonEmptyString, !sawContent {
                            throw CompanionError(message: err)
                        }
                    }
                    continuation.finish()
                } catch {
                    continuation.finish(throwing: error)
                }
            }
            continuation.onTermination = { _ in task.cancel() }
        }
    }

    // MARK: - Threads (authed)

    public static func threads(token: String) async throws -> [ThreadInfo] {
        let json = try await getJSON(path: "api/companion", query: "threads=1", token: token)
        return (json["threads"].array ?? []).compactMap { t in
            guard let id = t["id"].string else { return nil }
            return ThreadInfo(
                id: id,
                title: t["title"].nonEmptyString ?? "Untitled",
                updatedAt: t["updated_at"].string ?? ""
            )
        }
    }

    public static func threadMessages(id: String, token: String) async throws -> [StoredMessage] {
        let json = try await getJSON(path: "api/companion", query: "thread=\(id)", token: token)
        return (json["messages"].array ?? []).compactMap { m in
            guard let role = m["role"].string, let content = m["content"].string else { return nil }
            return StoredMessage(role: role, content: content, createdAt: m["created_at"].string ?? "")
        }
    }

    // MARK: - Export / erase

    public static func exportData(token: String) async throws -> String {
        var request = URLRequest(url: FRQNCYConfig.apiBase.appendingPathComponent("api/vbrtn-data"))
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, http.statusCode < 400 else {
            throw CompanionError(message: "Export is unreachable right now — try again shortly.")
        }
        return String(decoding: data, as: UTF8.self)
    }

    public static func eraseData(token: String) async throws {
        var request = URLRequest(url: FRQNCYConfig.apiBase.appendingPathComponent("api/vbrtn-data"))
        request.httpMethod = "DELETE"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        let (_, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, http.statusCode < 400 else {
            throw CompanionError(message: "Erasure did not complete — try again.")
        }
    }

    // MARK: - Supabase charts row (RLS: the user's own row only)

    public static func pullVbrtnRow(userId: String, token: String) async throws -> JSONValue? {
        let path = "/rest/v1/charts?owner_id=eq.\(userId)&name=eq.VBRTN&select=id,data,updated_at&limit=1"
        let json = try await sbRest(path: path, token: token)
        guard let row = json.array?.first else { return nil }
        return row
    }

    /// Read-modify-write: only the profile layer this device owns is replaced;
    /// the extractor's memories/state are never clobbered.
    public static func pushProfile(_ cloudSafeProfile: JSONValue, userId: String, token: String) async throws {
        let existing = try await pullVbrtnRow(userId: userId, token: token)
        var data = existing?["data"] ?? .null
        if data.object == nil { data = .object([:]) }
        data["profile"] = cloudSafeProfile
        var obj = data.object ?? [:]
        obj.removeValue(forKey: "slim") // the server derives the prompt slice itself
        data = .object(obj)
        let now = ISO8601DateFormatter().string(from: Date())
        data["updatedAt"] = .string(now)

        if let rowId = existing?["id"].queryString {
            let body: [String: Any] = ["data": data.anyValue, "updated_at": now]
            _ = try await sbRest(path: "/rest/v1/charts?id=eq.\(rowId)", token: token,
                                 method: "PATCH", body: body, minimal: true)
        } else {
            let body: [String: Any] = ["owner_id": userId, "name": "VBRTN", "data": data.anyValue, "is_public": false]
            _ = try await sbRest(path: "/rest/v1/charts", token: token,
                                 method: "POST", body: body, minimal: true)
        }
    }

    /// Overwrite the row's data blob (memory deletes use this after editing).
    public static func patchRowData(rowId: String, data: JSONValue, token: String) async throws {
        let body: [String: Any] = ["data": data.anyValue]
        _ = try await sbRest(path: "/rest/v1/charts?id=eq.\(rowId)", token: token,
                             method: "PATCH", body: body, minimal: true)
    }

    private static func sbRest(
        path: String,
        token: String,
        method: String = "GET",
        body: [String: Any]? = nil,
        minimal: Bool = false
    ) async throws -> JSONValue {
        guard let url = URL(string: FRQNCYConfig.supabaseURL.absoluteString + path) else {
            throw CompanionError(message: "Bad storage URL")
        }
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue(FRQNCYConfig.supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if minimal { request.setValue("return=minimal", forHTTPHeaderField: "Prefer") }
        if let body = body {
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
        }
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, http.statusCode < 400 else {
            let code = (response as? HTTPURLResponse)?.statusCode ?? 0
            throw CompanionError(message: "Storage error (\(code)).")
        }
        return data.isEmpty ? .null : JSONValue.decode(data)
    }

    private static func getJSON(path: String, query: String, token: String) async throws -> JSONValue {
        guard let url = URL(string: FRQNCYConfig.apiBase.absoluteString + "/" + path + "?" + query) else {
            throw CompanionError(message: "Bad URL")
        }
        var request = URLRequest(url: url)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, http.statusCode < 400 else {
            throw CompanionError(message: "Unreachable right now.")
        }
        return JSONValue.decode(data)
    }
}
