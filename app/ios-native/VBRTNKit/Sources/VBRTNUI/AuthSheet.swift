import SwiftUI
import VBRTNCore

/// The universal sign-in, native: email + password against the same Supabase
/// project as the site. (Sign in with Apple joins once the paid developer
/// account exists — the account model already supports adding it.)
struct AuthSheet: View {
    @EnvironmentObject private var model: AppModel
    @EnvironmentObject private var auth: AuthStore
    @Environment(\.dismiss) private var dismiss

    @State private var email = ""
    @State private var password = ""
    @State private var creating = false
    @State private var working = false
    @State private var note: String?

    var body: some View {
        NavigationStack {
            ZStack {
                Theme.ground.ignoresSafeArea()
                VStack(alignment: .leading, spacing: 16) {
                    Text(creating
                         ? "One account, every surface. Your intake, memory and conversations follow you."
                         : "Sign in and the companion remembers you on every device.")
                        .font(.system(size: 14))
                        .foregroundStyle(Theme.muted)
                        .fixedSize(horizontal: false, vertical: true)

                    field("Email") {
                        TextField("you@example.com", text: $email)
                            .keyboardType(.emailAddress)
                            .textContentType(.emailAddress)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                    }
                    field("Password") {
                        SecureField("••••••••", text: $password)
                            .textContentType(creating ? .newPassword : .password)
                    }

                    if let note = note {
                        Text(note)
                            .font(.system(size: 13))
                            .foregroundStyle(Theme.goldInk)
                            .fixedSize(horizontal: false, vertical: true)
                    }

                    HStack(spacing: 10) {
                        Button(working ? "One moment…" : (creating ? "Create the account" : "Sign in")) {
                            submit()
                        }
                        .buttonStyle(ChipButtonStyle())
                        .disabled(working || email.isEmpty || password.isEmpty)

                        Button(creating ? "I have an account" : "Create an account") {
                            creating.toggle()
                            note = nil
                        }
                        .buttonStyle(ChipButtonStyle(dim: true))
                    }
                    Spacer()
                }
                .padding(18)
            }
            .navigationTitle(creating ? "Join FRQNCY" : "Sign in")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Close") { dismiss() }.tint(Theme.muted)
                }
            }
        }
        .presentationDetents([.medium, .large])
    }

    private func field(_ label: String, @ViewBuilder content: () -> some View) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label)
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(Theme.muted)
            content()
                .font(.system(size: 16))
                .foregroundStyle(Theme.ink)
                .padding(12)
                .background(RoundedRectangle(cornerRadius: 10).fill(Theme.surface))
                .overlay(RoundedRectangle(cornerRadius: 10).stroke(Theme.hairline, lineWidth: 1))
        }
    }

    private func submit() {
        working = true
        note = nil
        Task {
            do {
                if creating {
                    let immediate = try await auth.signUp(email: email, password: password)
                    if immediate {
                        await model.hydrateFromCloud()
                        dismiss()
                    } else {
                        note = "Almost there — confirm the email we just sent, then sign in here."
                        creating = false
                    }
                } else {
                    try await auth.signIn(email: email, password: password)
                    await model.hydrateFromCloud()
                    dismiss()
                }
            } catch {
                note = error.localizedDescription
            }
            working = false
        }
    }
}
