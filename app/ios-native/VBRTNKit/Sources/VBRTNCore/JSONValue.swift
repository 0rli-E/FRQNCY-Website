import Foundation

/// The profile and every server payload are handled as untyped JSON with
/// path helpers — the same posture as the web client. The canonical profile
/// shape lives in the strategy docs; this type never enforces it, so schema
/// drift on any surface can't crash another.
public enum JSONValue: Equatable {
    case null
    case bool(Bool)
    case number(Double)
    case string(String)
    case array([JSONValue])
    case object([String: JSONValue])

    // MARK: - Typed accessors

    public var string: String? {
        if case .string(let s) = self { return s }
        return nil
    }

    public var double: Double? {
        if case .number(let n) = self { return n }
        return nil
    }

    public var int: Int? {
        if case .number(let n) = self { return Int(n) }
        return nil
    }

    public var boolValue: Bool? {
        if case .bool(let b) = self { return b }
        return nil
    }

    public var array: [JSONValue]? {
        if case .array(let a) = self { return a }
        return nil
    }

    public var object: [String: JSONValue]? {
        if case .object(let o) = self { return o }
        return nil
    }

    public var isNull: Bool {
        if case .null = self { return true }
        return false
    }

    /// A non-empty string, or nil — the common "present and usable" check.
    public var nonEmptyString: String? {
        guard let s = string?.trimmingCharacters(in: .whitespacesAndNewlines), !s.isEmpty else { return nil }
        return s
    }

    /// Stable representation for URL query filters (charts row ids arrive as
    /// numbers or uuid strings depending on the column).
    public var queryString: String? {
        switch self {
        case .string(let s): return s
        case .number(let n):
            if n == n.rounded() { return String(Int(n)) }
            return String(n)
        default: return nil
        }
    }

    // MARK: - Subscripts and paths

    public subscript(key: String) -> JSONValue {
        get {
            if case .object(let o) = self, let v = o[key] { return v }
            return .null
        }
        set {
            var o = object ?? [:]
            o[key] = newValue
            self = .object(o)
        }
    }

    public subscript(index: Int) -> JSONValue {
        if case .array(let a) = self, index >= 0, index < a.count { return a[index] }
        return .null
    }

    /// Dot-path read, mirroring the web client's field paths
    /// (e.g. "meta.modalOperators.necessity").
    public func value(at path: String) -> JSONValue {
        var current = self
        for part in path.split(separator: ".") {
            current = current[String(part)]
        }
        return current
    }

    /// Dot-path write, creating intermediate objects — the port of setField().
    public mutating func set(path: String, to newValue: JSONValue) {
        let parts = path.split(separator: ".").map(String.init)
        guard !parts.isEmpty else { return }
        self = JSONValue.settingPath(self, parts: parts, newValue: newValue)
    }

    private static func settingPath(_ value: JSONValue, parts: [String], newValue: JSONValue) -> JSONValue {
        guard let head = parts.first else { return newValue }
        var obj = value.object ?? [:]
        if parts.count == 1 {
            obj[head] = newValue
        } else {
            let child = obj[head] ?? .null
            obj[head] = settingPath(child, parts: Array(parts.dropFirst()), newValue: newValue)
        }
        return .object(obj)
    }

    // MARK: - Bridging (JSONSerialization / JavaScriptCore)

    public static func fromAny(_ any: Any?) -> JSONValue {
        guard let any = any else { return .null }
        switch any {
        case is NSNull: return .null
        case let n as NSNumber:
            // Bool bridges to NSNumber; CFBoolean check separates true booleans.
            if CFGetTypeID(n) == CFBooleanGetTypeID() { return .bool(n.boolValue) }
            return .number(n.doubleValue)
        case let s as String: return .string(s)
        case let a as [Any]: return .array(a.map { fromAny($0) })
        case let d as [String: Any]:
            var out: [String: JSONValue] = [:]
            for (k, v) in d { out[k] = fromAny(v) }
            return .object(out)
        default: return .null
        }
    }

    public var anyValue: Any {
        switch self {
        case .null: return NSNull()
        case .bool(let b): return b
        case .number(let n):
            if n == n.rounded() && abs(n) < 1e15 { return Int(n) }
            return n
        case .string(let s): return s
        case .array(let a): return a.map { $0.anyValue }
        case .object(let o):
            var out: [String: Any] = [:]
            for (k, v) in o { out[k] = v.anyValue }
            return out
        }
    }

    public func encoded(pretty: Bool = false) -> Data {
        let options: JSONSerialization.WritingOptions = pretty ? [.prettyPrinted, .sortedKeys] : []
        return (try? JSONSerialization.data(withJSONObject: anyValue, options: options)) ?? Data("null".utf8)
    }

    public static func decode(_ data: Data) -> JSONValue {
        guard let any = try? JSONSerialization.jsonObject(with: data, options: [.fragmentsAllowed]) else { return .null }
        return fromAny(any)
    }
}

/// Port of the web client's asList(): tolerate strings, arrays of strings,
/// and arrays of {text, at} capture objects.
public func asList(_ v: JSONValue) -> [String] {
    switch v {
    case .array(let items):
        return items.compactMap { item -> String? in
            if let s = item.string { return s }
            if let t = item["text"].string { return t }
            return nil
        }
        .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
        .filter { !$0.isEmpty }
    case .string(let s):
        let t = s.trimmingCharacters(in: .whitespacesAndNewlines)
        return t.isEmpty ? [] : [t]
    default:
        return []
    }
}
