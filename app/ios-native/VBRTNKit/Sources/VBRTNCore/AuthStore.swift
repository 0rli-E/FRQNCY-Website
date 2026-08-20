import Foundation

public struct AuthUser: Codable, Equatable {
    public let id: String
    public let email: String?
}

public struct AuthSession: Codable, Equatable {
    public var accessToken: String
    public var refreshToken: String
    public var expiresAt: TimeInterval // epoch seconds
    public var user: AuthUser
}

public struct AuthError: LocalizedError {
    public let message: String
    public var errorDescription: String? { message }
}

/// Supabase email+password auth against the same project as the universal
/// sign-in — one account, every surface. Session lives in the Keychain.
/// (Sign in with Apple joins once the paid developer account exists.)
@MainActor
public final class AuthStore: ObservableObject {
    @Published public private(set) var session: AuthSession?

    private static let keychainAccount = "supabase-session"

    public init() {
        if let data = Keychain.load(account: Self.keychainAccount),
           let stored = try? JSONDecoder().decode(AuthSession.self, from: data) {
            session = stored
        }
    }

    public var user: AuthUser? { session?.user }
    public var isSignedIn: Bool { session != nil }

    // MARK: - Flows

    public func signIn(email: String, password: String) async throws {
        let body: [String: Any] = ["email": email, "password": password]
        let json = try await authRequest(path: "/auth/v1/token?grant_type=password", body: body)
        guard let s = Self.sessionFrom(json) else {
            throw AuthError(message: Self.errorMessage(json) ?? "Sign-in did not complete. Try again.")
        }
        persist(s)
    }

    /// Returns true when a session was established immediately; false when the
    /// project requires email confirmation first.
    public func signUp(email: String, password: String) async throws -> Bool {
        let body: [String: Any] = ["email": email, "password": password]
        let json = try await authRequest(path: "/auth/v1/signup", body: body)
        if let s = Self.sessionFrom(json) {
            persist(s)
            return true
        }
        if let message = Self.errorMessage(json) { throw AuthError(message: message) }
        // User created, confirmation email on its way.
        return false
    }

    public func signOut() async {
        if let token = session?.accessToken {
            var request = URLRequest(url: FRQNCYConfig.supabaseURL.appendingPathComponent("auth/v1/logout"))
            request.httpMethod = "POST"
            request.setValue(FRQNCYConfig.supabaseAnonKey, forHTTPHeaderField: "apikey")
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            _ = try? await URLSession.shared.data(for: request)
        }
        session = nil
        Keychain.delete(account: Self.keychainAccount)
    }

    /// A token that is valid right now — refreshing first when it is about to
    /// expire. Returns nil when signed out or the refresh fails terminally.
    public func validToken() async -> String? {
        guard let current = session else { return nil }
        if current.expiresAt - Date().timeIntervalSince1970 > 60 {
            return current.accessToken
        }
        do {
            let body: [String: Any] = ["refresh_token": current.refreshToken]
            let json = try await authRequest(path: "/auth/v1/token?grant_type=refresh_token", body: body)
            guard let s = Self.sessionFrom(json) else { return nil }
            persist(s)
            return s.accessToken
        } catch {
            // Network trouble: hand back the stale token, the server will 401
            // and the UI degrades to anonymous mode rather than erroring hard.
            return current.accessToken
        }
    }

    // MARK: - Internals

    private func persist(_ s: AuthSession) {
        session = s
        if let data = try? JSONEncoder().encode(s) {
            Keychain.save(data, account: Self.keychainAccount)
        }
    }

    private func authRequest(path: String, body: [String: Any]) async throws -> JSONValue {
        guard let url = URL(string: FRQNCYConfig.supabaseURL.absoluteString + path) else {
            throw AuthError(message: "Bad auth URL")
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(FRQNCYConfig.supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        let (data, response) = try await URLSession.shared.data(for: request)
        let json = JSONValue.decode(data)
        if let http = response as? HTTPURLResponse, http.statusCode >= 400 {
            throw AuthError(message: Self.errorMessage(json) ?? "That didn't work (\(http.statusCode)). Check the details and try again.")
        }
        return json
    }

    private static func sessionFrom(_ json: JSONValue) -> AuthSession? {
        guard let access = json["access_token"].nonEmptyString,
              let refresh = json["refresh_token"].nonEmptyString,
              let userId = json["user"]["id"].nonEmptyString else { return nil }
        let expiresAt = json["expires_at"].double
            ?? (Date().timeIntervalSince1970 + (json["expires_in"].double ?? 3600))
        let user = AuthUser(id: userId, email: json["user"]["email"].nonEmptyString)
        return AuthSession(accessToken: access, refreshToken: refresh, expiresAt: expiresAt, user: user)
    }

    private static func errorMessage(_ json: JSONValue) -> String? {
        json["error_description"].nonEmptyString
            ?? json["msg"].nonEmptyString
            ?? json["message"].nonEmptyString
            ?? json["error"].nonEmptyString
    }
}
