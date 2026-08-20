import Foundation

/// The two outbound shapes, ported from the web client:
///  - slimProfile: the privacy-safe context slice sent with anonymous chat
///    calls (the server derives its own slice for signed-in callers).
///  - cloudSafeProfile: the full profile minus negative-trigger names — the
///    only full shape allowed to leave the device, and only to the user's
///    own RLS'd row.
public enum ProfileShapes {

    public static func slimProfile(_ p: JSONValue) -> JSONValue {
        let hd = p["design"]["hd"]
        let gk = p["design"]["gk"]
        let astro = p["design"]["astro"]
        let mo = p["meta"]["modalOperators"]
        let trig = p["triggers"]

        var slim: JSONValue = .object([:])
        slim["rememberOne"] = p["rememberOne"].nonEmptyString.map { JSONValue.string($0) } ?? .null
        slim["goals"] = .null

        if hd["type"].nonEmptyString != nil, hd["_stub"].boolValue != true {
            slim["hd"] = .object([
                "type": hd["type"], "strategy": hd["strategy"],
                "authority": hd["authority"], "profile": hd["profile"],
            ])
        } else {
            slim["hd"] = .null
        }

        slim["gk"] = ChartEngine.shared.resolvedOrBare(gk) ?? .null

        if astro["sun"].nonEmptyString != nil, astro["_stub"].boolValue != true {
            slim["astro"] = .object(["sun": astro["sun"], "moon": astro["moon"], "rising": astro["rising"]])
        } else {
            slim["astro"] = .null
        }

        slim["standing"] = .object([
            "feeling": p["standing"]["recentFeeling"],
            "texture": p["standing"]["texture"],
            "desire": p["standing"]["dominantDesire"],
            "pull": p["standing"]["pull"],
            "threeYearTrue": p["standing"]["threeYearTrue"],
        ])
        slim["meta"] = .object([
            "toward_away": p["meta"]["toward_away"],
            "internal_external": p["meta"]["internal_external"],
            "options_procedures": p["meta"]["options_procedures"],
            "general_specific": p["meta"]["general_specific"],
            "sameness_difference": p["meta"]["sameness_difference"],
            "convincer": p["meta"]["convincer"],
        ])
        slim["modalOperators"] = .object([
            "necessity": .array(asList(mo["necessity"]).suffix(3).map { JSONValue.string($0) }),
            "impossibility": .array(asList(mo["impossibility"]).suffix(3).map { JSONValue.string($0) }),
        ])
        slim["positiveTriggers"] = .array(asList(trig["positive"]).prefix(5).map { JSONValue.string($0) })
        slim["music"] = .array(asList(trig["music"]).prefix(5).map { JSONValue.string($0) })
        slim["place"] = trig["place"].nonEmptyString.map { JSONValue.string($0) } ?? .null
        slim["negativeTriggerCount"] = .number(Double(asList(trig["negative"]).count))
        slim["baseline"] = .object([
            "teachabilityIndex": p["baseline"]["teachabilityIndex"],
            "chiefAimDistance": p["baseline"]["chiefAimDistance"],
        ])
        return slim
    }

    public static func cloudSafeProfile(_ p: JSONValue) -> JSONValue {
        var out = p
        if out["triggers"].object != nil {
            let negativeCount = asList(out["triggers"]["negative"]).count
            out["triggers"]["negative"] = .array([])
            out["triggers"]["negativeCount"] = .number(Double(negativeCount))
        }
        return out
    }
}
