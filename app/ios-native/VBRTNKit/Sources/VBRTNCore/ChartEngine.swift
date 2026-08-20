import Foundation
import JavaScriptCore

/// The chart engine — Human Design + Gene Keys + astrology from birth data.
///
/// Runs the exact same dependency-free JS engine as the web and Android
/// surfaces (bundled hd-engine.js + gene-keys.js) inside JavaScriptCore, so a
/// chart computed on any device is identical. Hand-porting the Meeus
/// astronomy to Swift would risk exactly the wrong-chart failure this
/// audience would never forgive; single source of truth instead.
public final class ChartEngine {
    public static let shared = ChartEngine()

    public struct Sphere {
        public let key: String
        public let label: String
        public let of: String
    }

    /// Same order as gene-keys.js SPHERES.
    public let spheres: [Sphere] = [
        Sphere(key: "lifesWork", label: "Life's Work", of: "how you work in the world"),
        Sphere(key: "evolution", label: "Evolution", of: "the relational challenge that grows you"),
        Sphere(key: "radiance", label: "Radiance", of: "how your vitality shows"),
        Sphere(key: "purpose", label: "Purpose", of: "what it is all in service of"),
    ]

    private var context: JSContext?
    private var loadAttempted = false

    private init() {}

    private func ensureContext() -> JSContext? {
        if let ctx = context { return ctx }
        guard !loadAttempted else { return nil }
        loadAttempted = true
        guard let ctx = JSContext() else { return nil }
        ctx.exceptionHandler = { _, _ in /* a failed chart stays null — honest absence */ }
        guard let vsopSrc = loadResource("vsop87-data"),
              let geneKeysSrc = loadResource("gene-keys"),
              let engineSrc = loadResource("hd-engine") else { return nil }
        // The files are ES modules; JSCore evaluates classic scripts. Their only
        // module syntax is `export ` prefixes plus hd-engine's VSOP import —
        // strip both and load in dependency order (verified against Node vm,
        // the same classic-script mode, 2026-08-20).
        let script = stripModuleSyntax(vsopSrc) + "\n" + stripModuleSyntax(geneKeysSrc) + "\n" + stripModuleSyntax(engineSrc)
        ctx.evaluateScript(script)
        guard ctx.objectForKeyedSubscript("computeChart")?.isUndefined == false else { return nil }
        context = ctx
        return ctx
    }

    private func loadResource(_ name: String) -> String? {
        guard let url = Bundle.module.url(forResource: name, withExtension: "js") else { return nil }
        return try? String(contentsOf: url, encoding: .utf8)
    }

    private func stripModuleSyntax(_ src: String) -> String {
        src
            .replacingOccurrences(of: "export function", with: "function")
            .replacingOccurrences(of: "export const", with: "const")
            .split(separator: "\n", omittingEmptySubsequences: false)
            .filter { !$0.trimmingCharacters(in: .whitespaces).hasPrefix("import ") }
            .joined(separator: "\n")
    }

    // MARK: - Design from birth (port of buildDesignFromBirth)

    /// birth: { date: "YYYY-MM-DD", time: "HH:MM", timeUnknown, city, tzOffset }
    /// Returns { hd, gk, astro } or nil — honest absence, never an invented chart.
    public func computeDesign(birth: JSONValue) -> JSONValue? {
        guard let date = birth["date"].nonEmptyString,
              let time = birth["time"].nonEmptyString,
              birth["timeUnknown"].boolValue != true,
              let tzOffset = birth["tzOffset"].int,
              let ctx = ensureContext() else { return nil }
        let dateParts = date.split(separator: "-").compactMap { Int($0) }
        let timeParts = time.split(separator: ":").compactMap { Int($0) }
        guard dateParts.count == 3, timeParts.count >= 2 else { return nil }

        var input: [String: Any] = [
            "year": dateParts[0], "month": dateParts[1], "day": dateParts[2],
            "hour": timeParts[0], "minute": timeParts[1], "second": 0,
            "tzOffsetMinutes": tzOffset,
        ]
        if let lat = birth["lat"].double { input["lat"] = lat }
        if let lon = birth["lon"].double { input["lon"] = lon }

        guard let fn = ctx.objectForKeyedSubscript("computeChart"),
              let result = fn.call(withArguments: [input]),
              !result.isUndefined, !result.isNull,
              let any = result.toObject() else { return nil }
        let r = JSONValue.fromAny(any)
        guard r["hd"]["type"].nonEmptyString != nil else { return nil }

        var design: JSONValue = .object([:])
        design["hd"] = .object([
            "type": r["hd"]["type"],
            "strategy": r["hd"]["strategy"],
            "authority": r["hd"]["authority"],
            "profile": r["hd"]["profile"],
            "centers": .object(["defined": r["hd"]["definedCenters"], "open": r["hd"]["openCenters"]]),
            "incarnationCross": r["hd"]["incarnationCross"],
            "gates": .object(["personality": r["hd"]["personalityGates"], "design": r["hd"]["designGates"]]),
        ])
        design["gk"] = .object([
            "lifesWork": r["gk"]["lifesWork"],
            "evolution": r["gk"]["evolution"],
            "radiance": r["gk"]["radiance"],
            "purpose": r["gk"]["purpose"],
        ])
        design["astro"] = .object([
            "sun": r["astro"]["sun"],
            "moon": r["astro"]["moon"],
            "rising": r["astro"]["rising"],
        ])
        return design
    }

    // MARK: - Gene Keys resolution (port of resolveGeneKeys)

    /// gk gate numbers → { lifesWork: {gate,label,of,shadow,gift,siddhi}, … } or nil.
    public func resolveGeneKeys(_ gk: JSONValue) -> JSONValue? {
        guard gk.object != nil, gk["_stub"].isNull || gk["_stub"].boolValue != true,
              let ctx = ensureContext(),
              let fn = ctx.objectForKeyedSubscript("resolveGeneKeys"),
              let result = fn.call(withArguments: [gk.anyValue]),
              !result.isUndefined, !result.isNull,
              let any = result.toObject() else { return nil }
        let resolved = JSONValue.fromAny(any)
        return resolved.object?.isEmpty == false ? resolved : nil
    }

    /// Fallback shape when the spectrum can't resolve — bare gate numbers,
    /// which the server marks "do NOT name its Shadow or Gift".
    public func resolvedOrBare(_ gk: JSONValue) -> JSONValue? {
        if gk.isNull || gk["_stub"].boolValue == true { return nil }
        if let resolved = resolveGeneKeys(gk) { return resolved }
        guard gk.object != nil else { return nil }
        return .object([
            "lifesWork": gk["lifesWork"],
            "evolution": gk["evolution"],
            "radiance": gk["radiance"],
            "purpose": gk["purpose"],
        ])
    }
}
