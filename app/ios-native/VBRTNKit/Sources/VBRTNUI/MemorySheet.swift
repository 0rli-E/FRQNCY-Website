import SwiftUI
import VBRTNCore

/// "What VBRTN knows about you" — visible, yours, deletable. A FRQNCY-values
/// feature, not a settings afterthought. Local layer plus the account's
/// extractor-grown memories, each forgettable with one tap.
struct MemorySheet: View {
    @EnvironmentObject private var model: AppModel
    @Environment(\.dismiss) private var dismiss

    @State private var cloudMemories: [CloudMemory]?
    @State private var cloudNote = "…"

    var body: some View {
        let profile = ProfileStore.shared.load()
        let necessity = asList(profile["meta"]["modalOperators"]["necessity"])
        let impossibility = asList(profile["meta"]["modalOperators"]["impossibility"])
        let rememberOne = profile["rememberOne"].nonEmptyString

        NavigationStack {
            ZStack {
                Theme.ground.ignoresSafeArea()
                ScrollView {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Everything VBRTN knows about you sits here — visible, yours, deletable. Nothing on this screen is ever used to rank you.")
                            .font(.system(size: 14))
                            .foregroundStyle(Theme.muted)
                            .fixedSize(horizontal: false, vertical: true)

                        if let rememberOne = rememberOne {
                            memoryRow(kind: "forever", content: rememberOne, deletable: false, index: nil)
                        }
                        ForEach(necessity, id: \.self) { line in
                            memoryRow(kind: "have-to", content: line, deletable: false, index: nil)
                        }
                        ForEach(impossibility, id: \.self) { line in
                            memoryRow(kind: "can't", content: line, deletable: false, index: nil)
                        }

                        if let memories = cloudMemories {
                            ForEach(memories) { memory in
                                memoryRow(kind: memory.kind, content: memory.content,
                                          deletable: true, index: memory.id)
                            }
                            if memories.isEmpty {
                                Text("Across conversations: nothing noted yet. It grows as you speak.")
                                    .font(.system(size: 13))
                                    .foregroundStyle(Theme.muted)
                            }
                        } else {
                            Text(cloudNote)
                                .font(.system(size: 13))
                                .foregroundStyle(Theme.muted)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }
                    .padding(18)
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
            .navigationTitle("What VBRTN knows")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }.tint(Theme.gold)
                }
            }
        }
        .task { await loadCloud() }
    }

    private func loadCloud() async {
        guard model.auth.isSignedIn else {
            cloudNote = "Sign in and the companion also keeps what it notices across conversations — synced to your account, readable right here."
            return
        }
        if let memories = await model.fetchCloudMemories() {
            cloudMemories = memories
        } else {
            cloudNote = "The account memory is unreachable right now."
        }
    }

    private func memoryRow(kind: String, content: String, deletable: Bool, index: Int?) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Text(kind)
                .font(.system(size: 10, weight: .semibold))
                .tracking(1)
                .textCase(.uppercase)
                .foregroundStyle(Theme.gold)
                .padding(.horizontal, 8)
                .padding(.vertical, 3)
                .background(Capsule().stroke(Theme.gold.opacity(0.5), lineWidth: 1))
            Text(content)
                .font(.system(size: 14))
                .foregroundStyle(Theme.ink)
                .fixedSize(horizontal: false, vertical: true)
            Spacer()
            if deletable, let index = index {
                Button {
                    Task {
                        if await model.deleteCloudMemory(at: index) {
                            await loadCloud()
                        }
                    }
                } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(Theme.muted)
                }
                .accessibilityLabel("Forget this")
            }
        }
        .padding(12)
        .background(RoundedRectangle(cornerRadius: 10).fill(Theme.surface))
    }
}
