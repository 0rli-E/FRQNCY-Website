import SwiftUI
import VBRTNCore

/// The scroll — renders every feed kind and keeps the newest item in view.
struct ThreadView: View {
    @EnvironmentObject private var model: AppModel

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 14) {
                    ForEach(model.feed) { item in
                        FeedItemView(item: item)
                            .id(item.id)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 18)
            }
            .scrollDismissesKeyboard(.interactively)
            .onChange(of: model.feed.count) { _, _ in
                if let last = model.feed.last {
                    withAnimation(.easeOut(duration: 0.2)) {
                        proxy.scrollTo(last.id, anchor: .bottom)
                    }
                }
            }
            .onChange(of: lastMessageLength) { _, _ in
                if let last = model.feed.last {
                    proxy.scrollTo(last.id, anchor: .bottom)
                }
            }
        }
    }

    /// Streaming grows the last bubble without changing feed.count.
    private var lastMessageLength: Int {
        if case .message(_, let text, _) = model.feed.last?.kind { return text.count }
        return 0
    }
}

struct FeedItemView: View {
    @EnvironmentObject private var model: AppModel
    let item: FeedItem

    var body: some View {
        switch item.kind {
        case .dayline(let text):
            Text(text)
                .font(.system(size: 11, weight: .medium))
                .tracking(2)
                .textCase(.uppercase)
                .foregroundStyle(Theme.muted)
                .frame(maxWidth: .infinity, alignment: .center)
                .padding(.top, 6)

        case .openline(let primary, let sub):
            VStack(alignment: .leading, spacing: 6) {
                Text(primary)
                    .font(Theme.serifItalic(24))
                    .foregroundStyle(Theme.goldInk)
                    .fixedSize(horizontal: false, vertical: true)
                if let sub = sub {
                    Text(sub)
                        .font(Theme.serifItalic(16))
                        .foregroundStyle(Theme.muted)
                }
            }
            .padding(.vertical, 8)

        case .welcome:
            Text("welcome to vbrtn")
                .font(Theme.serifItalic(28))
                .foregroundStyle(Theme.goldInk)
                .padding(.top, 24)

        case .message(let role, let text, let thinking):
            MessageBubble(role: role, text: text, thinking: thinking)

        case .reflection(let text):
            HStack(alignment: .top, spacing: 10) {
                Rectangle()
                    .fill(Theme.gold)
                    .frame(width: 2)
                Text(text)
                    .font(Theme.serifItalic(17))
                    .foregroundStyle(Theme.goldInk.opacity(0.9))
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(.leading, 4)

        case .startButtons:
            HStack(spacing: 10) {
                Button("Begin the intake") { model.beginIntake() }
                    .buttonStyle(ChipButtonStyle())
                Button("Just talk first") { model.justTalk() }
                    .buttonStyle(ChipButtonStyle(dim: true))
            }
            .padding(.top, 4)

        case .continueIntake(let label):
            Button(label) { model.beginIntake() }
                .buttonStyle(ChipButtonStyle())
                .padding(.top, 4)

        case .intakeCard(let question, let pos):
            IntakeCardView(question: question, pos: pos)

        case .recovery(let card):
            RecoveryCardView(card: card, itemId: item.id)
        }
    }
}

struct MessageBubble: View {
    let role: FeedRole
    let text: String
    let thinking: Bool

    var body: some View {
        HStack {
            if role == .user { Spacer(minLength: 48) }
            Group {
                if thinking && text.isEmpty {
                    ThinkingDots()
                } else {
                    Text(text)
                        .font(.system(size: 16))
                        .foregroundStyle(Theme.ink)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            .padding(.horizontal, role == .user ? 14 : 0)
            .padding(.vertical, role == .user ? 10 : 2)
            .background(
                role == .user
                    ? AnyView(RoundedRectangle(cornerRadius: 16).fill(Theme.surfaceRaised))
                    : AnyView(EmptyView())
            )
            if role == .vbrtn { Spacer(minLength: 24) }
        }
    }
}

struct ThinkingDots: View {
    @State private var phase = 0.0

    var body: some View {
        HStack(spacing: 4) {
            ForEach(0..<3, id: \.self) { i in
                Circle()
                    .fill(Theme.muted)
                    .frame(width: 6, height: 6)
                    .opacity(phase == Double(i) ? 1 : 0.35)
            }
        }
        .padding(.vertical, 6)
        .onAppear {
            withAnimation(.easeInOut(duration: 0.9).repeatForever(autoreverses: false)) {
                phase = 2
            }
        }
        .accessibilityLabel("VBRTN is thinking")
    }
}

struct RecoveryCardView: View {
    @EnvironmentObject private var model: AppModel
    let card: RecoveryCard
    let itemId: UUID

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("a question that opens")
                .font(.system(size: 11, weight: .medium))
                .tracking(2)
                .textCase(.uppercase)
                .foregroundStyle(Theme.gold)
            Text("\u{201C}\(card.sentence)\u{201D}")
                .font(Theme.serifItalic(18))
                .foregroundStyle(Theme.ink)
                .fixedSize(horizontal: false, vertical: true)
            Text(card.prompt)
                .font(.system(size: 16, weight: .medium))
                .foregroundStyle(Theme.goldInk)
            Text(card.frame)
                .font(.system(size: 13))
                .foregroundStyle(Theme.muted)
            HStack(spacing: 10) {
                Button("Answer it") { model.recoveryAnswer(card) }
                    .buttonStyle(ChipButtonStyle())
                Button("Ask me differently") { model.recoveryRotate(card, itemId: itemId) }
                    .buttonStyle(ChipButtonStyle(dim: true))
            }
            .padding(.top, 2)
        }
        .padding(16)
        .background(RoundedRectangle(cornerRadius: 14).fill(Theme.surface))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Theme.hairline, lineWidth: 1))
    }
}

struct ComposerView: View {
    @EnvironmentObject private var model: AppModel
    @State private var text = ""
    @FocusState private var focused: Bool

    var body: some View {
        HStack(alignment: .bottom, spacing: 10) {
            TextField(model.composerPlaceholder, text: $text, axis: .vertical)
                .lineLimit(1...5)
                .font(.system(size: 16))
                .foregroundStyle(Theme.ink)
                .focused($focused)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(RoundedRectangle(cornerRadius: 20).fill(Theme.surface))
                .overlay(RoundedRectangle(cornerRadius: 20).stroke(Theme.hairline, lineWidth: 1))
                .onSubmit { submit() }

            Button {
                submit()
            } label: {
                Image(systemName: "arrow.up")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(canSend ? Theme.ground : Theme.muted)
                    .frame(width: 36, height: 36)
                    .background(Circle().fill(canSend ? Theme.gold : Theme.surfaceRaised))
            }
            .disabled(!canSend)
            .accessibilityLabel("Send")
        }
        .padding(.horizontal, 14)
        .padding(.top, 8)
        .padding(.bottom, 10)
        .background(Theme.ground)
    }

    private var canSend: Bool {
        !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && !model.sending
    }

    private func submit() {
        guard canSend else { return }
        let outgoing = text
        text = ""
        model.send(outgoing)
    }
}
