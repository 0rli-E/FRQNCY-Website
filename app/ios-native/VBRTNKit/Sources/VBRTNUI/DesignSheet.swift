import SwiftUI
import VBRTNCore

/// The design drawer — the chart the person came in with, read-only over L0.
struct DesignSheet: View {
    @EnvironmentObject private var model: AppModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        let profile = ProfileStore.shared.load()
        let hd = profile["design"]["hd"]
        let astro = profile["design"]["astro"]
        let resolved = ChartEngine.shared.resolveGeneKeys(profile["design"]["gk"])

        NavigationStack {
            ZStack {
                Theme.ground.ignoresSafeArea()
                ScrollView {
                    VStack(alignment: .leading, spacing: 18) {
                        if let type = hd["type"].nonEmptyString {
                            VStack(alignment: .leading, spacing: 10) {
                                designRow("Type", type)
                                if let s = hd["strategy"].nonEmptyString { designRow("Strategy", s) }
                                if let a = hd["authority"].nonEmptyString { designRow("Authority", a) }
                                if let p = hd["profile"].nonEmptyString { designRow("Profile", p) }
                                if let sun = astro["sun"].nonEmptyString {
                                    designRow("Sun · Moon · Rising",
                                              "\(sun) · \(astro["moon"].nonEmptyString ?? "—") · \(astro["rising"].nonEmptyString ?? "—")")
                                }
                            }

                            if let resolved = resolved {
                                Text("Gene Keys — your spectrum")
                                    .font(.system(size: 11, weight: .medium))
                                    .tracking(2)
                                    .textCase(.uppercase)
                                    .foregroundStyle(Theme.gold)
                                    .padding(.top, 8)
                                ForEach(ChartEngine.shared.spheres, id: \.key) { sphere in
                                    let key = resolved[sphere.key]
                                    if let shadow = key["shadow"].nonEmptyString {
                                        VStack(alignment: .leading, spacing: 3) {
                                            Text("\(sphere.label) \(key["gate"].int.map(String.init) ?? "")")
                                                .font(.system(size: 14, weight: .semibold))
                                                .foregroundStyle(Theme.ink)
                                            Text("\(shadow) → \(key["gift"].nonEmptyString ?? "") → \(key["siddhi"].nonEmptyString ?? "")")
                                                .font(Theme.serifItalic(15))
                                                .foregroundStyle(Theme.goldInk)
                                            Text(sphere.of)
                                                .font(.system(size: 12))
                                                .foregroundStyle(Theme.muted)
                                        }
                                        .padding(.bottom, 6)
                                    }
                                }
                            }
                        } else {
                            Text("Your chart is not drawn yet. It comes from your birth data — date, time, timezone — in the intake. The companion works without it; it works sharper with it.")
                                .font(.system(size: 15))
                                .foregroundStyle(Theme.muted)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }
                    .padding(18)
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
            .navigationTitle("Your design")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }.tint(Theme.gold)
                }
            }
        }
        .presentationDetents([.large])
    }

    private func designRow(_ label: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label)
                .font(.system(size: 11, weight: .medium))
                .tracking(1.5)
                .textCase(.uppercase)
                .foregroundStyle(Theme.muted)
            Text(value)
                .font(.system(size: 16, weight: .medium))
                .foregroundStyle(Theme.ink)
        }
    }
}
