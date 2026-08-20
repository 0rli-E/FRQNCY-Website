import SwiftUI
import VBRTNCore

/// The menu: account, conversations, the morning open, and the person's data
/// — export and erase are rights, so they live one tap deep, not buried.
struct MenuSheet: View {
    @EnvironmentObject private var model: AppModel
    @EnvironmentObject private var auth: AuthStore
    @Environment(\.dismiss) private var dismiss

    @State private var showAuth = false
    @State private var threads: [ThreadInfo]?
    @State private var threadsNote = "…"
    @State private var exportText: String?
    @State private var exporting = false
    @State private var confirmErase = false
    @State private var morningOn = false

    var body: some View {
        NavigationStack {
            ZStack {
                Theme.ground.ignoresSafeArea()
                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        accountSection
                        conversationSection
                        morningSection
                        if auth.isSignedIn { dataSection }
                    }
                    .padding(18)
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
            .navigationTitle("Menu")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }.tint(Theme.gold)
                }
            }
        }
        .sheet(isPresented: $showAuth) { AuthSheet() }
        .task {
            morningOn = model.morningNotificationEnabled
            await loadThreads()
        }
        .confirmationDialog(
            "Erase everything VBRTN holds about you — profile, memory, every conversation — on this device and on your account? This cannot be undone.",
            isPresented: $confirmErase, titleVisibility: .visible
        ) {
            Button("Erase everything", role: .destructive) {
                Task {
                    await model.eraseEverything()
                    dismiss()
                }
            }
            Button("Keep it", role: .cancel) {}
        }
    }

    // MARK: - Sections

    private var accountSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionLabel("Account")
            if let user = auth.user {
                Text("Signed in as \(user.email ?? "you") — one account, every surface.")
                    .font(.system(size: 14))
                    .foregroundStyle(Theme.muted)
                Button("Sign out") {
                    Task {
                        await auth.signOut()
                        threads = nil
                        threadsNote = "Sign in to see your conversations."
                    }
                }
                .buttonStyle(ChipButtonStyle(dim: true))
            } else {
                Text("Not signed in. Sign in and your intake, memory and conversations follow you to every device.")
                    .font(.system(size: 14))
                    .foregroundStyle(Theme.muted)
                    .fixedSize(horizontal: false, vertical: true)
                Button("Sign in") { showAuth = true }
                    .buttonStyle(ChipButtonStyle())
            }
        }
    }

    private var conversationSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionLabel("Conversations")
            Button("Begin a new conversation") {
                model.newConversation()
                dismiss()
            }
            .buttonStyle(ChipButtonStyle(dim: true))

            if auth.isSignedIn {
                if let threads = threads {
                    if threads.isEmpty {
                        Text("No conversations on the account yet.")
                            .font(.system(size: 13))
                            .foregroundStyle(Theme.muted)
                    }
                    ForEach(threads) { thread in
                        Button {
                            Task {
                                await model.openThread(thread.id)
                                dismiss()
                            }
                        } label: {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(thread.title)
                                    .font(.system(size: 14, weight: .medium))
                                    .foregroundStyle(Theme.ink)
                                    .lineLimit(1)
                                Text(Self.dateLabel(thread.updatedAt))
                                    .font(.system(size: 11))
                                    .foregroundStyle(Theme.muted)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(10)
                            .background(RoundedRectangle(cornerRadius: 10).fill(Theme.surface))
                        }
                    }
                } else {
                    Text(threadsNote)
                        .font(.system(size: 13))
                        .foregroundStyle(Theme.muted)
                }
            }
        }
    }

    private var morningSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionLabel("The morning open")
            Toggle(isOn: $morningOn) {
                Text("One line, each morning at eight")
                    .font(.system(size: 14))
                    .foregroundStyle(Theme.ink)
            }
            .tint(Theme.gold)
            .onChange(of: morningOn) { _, newValue in
                guard newValue != model.morningNotificationEnabled else { return }
                Task {
                    await model.setMorningNotification(newValue)
                    morningOn = model.morningNotificationEnabled
                }
            }
            Text("Drawn from your design and your recent state. Local for now; it deepens as the companion grows.")
                .font(.system(size: 12))
                .foregroundStyle(Theme.muted)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private var dataSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionLabel("Your data")
            HStack(spacing: 10) {
                if let exportText = exportText {
                    ShareLink(item: exportText, preview: SharePreview("vbrtn-export.json")) {
                        Text("Share the export")
                    }
                    .buttonStyle(ChipButtonStyle())
                } else {
                    Button(exporting ? "Gathering…" : "Export everything") {
                        exporting = true
                        Task {
                            exportText = await model.exportEverything()
                            exporting = false
                        }
                    }
                    .buttonStyle(ChipButtonStyle(dim: true))
                    .disabled(exporting)
                }
                Button("Erase everything") { confirmErase = true }
                    .buttonStyle(ChipButtonStyle(danger: true))
            }
            Text("The export is everything — profile, memories, every conversation. It is yours; you can take it all and leave at any time.")
                .font(.system(size: 12))
                .foregroundStyle(Theme.muted)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private func sectionLabel(_ text: String) -> some View {
        Text(text)
            .font(.system(size: 11, weight: .medium))
            .tracking(2)
            .textCase(.uppercase)
            .foregroundStyle(Theme.gold)
    }

    private func loadThreads() async {
        guard auth.isSignedIn else {
            threadsNote = "Sign in to see your conversations."
            return
        }
        if let list = await model.loadThreads() {
            threads = list
        } else {
            threadsNote = "Unreachable right now."
        }
    }

    private static func dateLabel(_ iso: String) -> String {
        let parser = ISO8601DateFormatter()
        parser.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let date = parser.date(from: iso) ?? ISO8601DateFormatter().date(from: iso)
        guard let date = date else { return iso }
        return date.formatted(date: .abbreviated, time: .omitted)
    }
}
