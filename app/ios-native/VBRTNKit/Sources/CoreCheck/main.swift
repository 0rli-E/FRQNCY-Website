import Foundation
import VBRTNCore

// CoreCheck — executed verification of VBRTNCore on macOS (CommandLineTools
// only). Exits non-zero on the first failure. The chart expectations were
// cross-computed with the same JS engine under Node vm on 2026-08-20.

var failures = 0

func check(_ name: String, _ condition: Bool, _ detail: String = "") {
    if condition {
        print("  ok  \(name)")
    } else {
        failures += 1
        print("FAIL  \(name)\(detail.isEmpty ? "" : " — \(detail)")")
    }
}

// ── JSONValue ─────────────────────────────────────────────────────
var j: JSONValue = .object([:])
j.set(path: "meta.modalOperators.necessity", to: .array([.string("I have to test")]))
check("JSONValue set/get dot path",
      asList(j["meta"]["modalOperators"]["necessity"]) == ["I have to test"])
check("asList tolerates capture objects",
      asList(.array([.object(["text": .string("a")]), .string(" b ")])) == ["a", "b"])
check("asList tolerates bare string", asList(.string("solo")) == ["solo"])

let roundTrip = JSONValue.decode(j.encoded())
check("JSONValue encode/decode round-trip", roundTrip == j)

// ── Modal-operator detection ──────────────────────────────────────
let captures = Recovery.detect(in: "I have to finish this but I can't focus today.")
check("detects necessity", captures.contains { $0.kind == "necessity" && $0.match.lowercased().contains("have to finish") })
check("detects impossibility", captures.contains { $0.kind == "impossibility" && $0.match.lowercased().contains("can't focus") })
check("clean text detects nothing", Recovery.detect(in: "The morning is quiet.").isEmpty)

// ── Intake commit: TI = desire × willingness ──────────────────────
var profile = ProfileStore.shared.freshProfile()
let desireQ = Intake.questions.first { $0.id == "desireToLearn" }!
let willQ = Intake.questions.first { $0.id == "willingnessToChange" }!
IntakeLogic.commitAnswer(desireQ, value: .number(7), profile: &profile)
IntakeLogic.commitAnswer(willQ, value: .number(6), profile: &profile)
check("TI computed as product", profile["baseline"]["teachabilityIndex"].int == 42)
check("intake answers recorded", (profile["_intakeAnswers"].object ?? [:]).count == 2)

// ── Slim profile privacy floor ────────────────────────────────────
profile["triggers"]["negative"] = .array([.string("a person"), .string("a place")])
profile["triggers"]["positive"] = .array([.string("the sea")])
let slim = ProfileShapes.slimProfile(profile)
check("slim carries only the negative COUNT", slim["negativeTriggerCount"].int == 2)
check("slim never carries negative names",
      !String(decoding: slim.encoded(), as: UTF8.self).contains("a person"))
let safe = ProfileShapes.cloudSafeProfile(profile)
check("cloud-safe strips negative names", (safe["triggers"]["negative"].array ?? []).isEmpty)
check("cloud-safe keeps the count", safe["triggers"]["negativeCount"].int == 2)

// ── Intake bank shape ─────────────────────────────────────────────
// 25 entries — the shared bank's "24 questions" comment is stale; the
// welcome copy ("twenty-five questions") and the entry count agree on 25.
check("25 questions", Intake.questions.count == 25)
check("5 sessions", Set(Intake.questions.map { $0.session }) == Set([1, 2, 3, 4, 5]))

// ── Morning open ──────────────────────────────────────────────────
var hdProfile = ProfileStore.shared.freshProfile()
hdProfile["design"]["hd"] = .object(["type": .string("Projector")])
let line1 = MorningOpen.generate(from: hdProfile)
let line2 = MorningOpen.generate(from: hdProfile)
check("morning open deterministic per day", line1 == line2)
check("morning open is design-aware", !line1.primary.isEmpty)

// ── Chart engine through JavaScriptCore (the real runtime) ────────
let birth: JSONValue = .object([
    "date": .string("1990-06-15"), "time": .string("14:30"),
    "timeUnknown": .bool(false), "city": .string("Berlin"),
    "tzOffset": .number(120), "lat": .number(52.52), "lon": .number(13.405),
])
if let design = ChartEngine.shared.computeDesign(birth: birth) {
    check("HD type", design["hd"]["type"].string == "Manifesting Generator",
          "got \(design["hd"]["type"].string ?? "nil")")
    check("HD authority", design["hd"]["authority"].string == "Sacral")
    check("HD profile", design["hd"]["profile"].string == "2/4")
    check("astro sun", design["astro"]["sun"].string == "Gemini")
    check("astro moon", design["astro"]["moon"].string == "Pisces")
    check("astro rising", design["astro"]["rising"].string == "Aries")
    check("GK lifesWork gate", design["gk"]["lifesWork"].int == 12)
    check("GK purpose gate", design["gk"]["purpose"].int == 6)
} else {
    check("chart engine computes", false, "computeDesign returned nil")
}

let resolved = ChartEngine.shared.resolveGeneKeys(.object(["lifesWork": .number(43)]))
check("GK 43 resolves to Deafness→Insight→Epiphany",
      resolved?["lifesWork"]["shadow"].string == "Deafness"
      && resolved?["lifesWork"]["gift"].string == "Insight"
      && resolved?["lifesWork"]["siddhi"].string == "Epiphany")

// ── Verdict ───────────────────────────────────────────────────────
if failures == 0 {
    print("\nCoreCheck: all checks passed.")
    exit(0)
} else {
    print("\nCoreCheck: \(failures) FAILURE(S).")
    exit(1)
}
