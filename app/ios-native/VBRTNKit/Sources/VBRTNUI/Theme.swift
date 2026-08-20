import SwiftUI

/// The FRQNCY register, translated to native. Dark-first by commitment:
/// serif italic carries the hero lines, gold is reserved for invitation,
/// acknowledgment, and current state — never decoration.
public enum Theme {
    public static let ground = Color(red: 0.055, green: 0.059, blue: 0.071)      // #0E0F12
    public static let surface = Color(red: 0.090, green: 0.098, blue: 0.125)     // #171920
    public static let surfaceRaised = Color(red: 0.114, green: 0.125, blue: 0.161) // #1D2029
    public static let ink = Color(red: 0.914, green: 0.902, blue: 0.871)         // #E9E6DE
    public static let muted = Color(red: 0.608, green: 0.592, blue: 0.549)       // #9B978C
    public static let gold = Color(red: 0.788, green: 0.635, blue: 0.294)        // #C9A24B
    public static let goldInk = Color(red: 0.894, green: 0.784, blue: 0.494)     // #E4C87E
    public static let hairline = Color(red: 0.165, green: 0.173, blue: 0.200)    // #2A2C33
    public static let danger = Color(red: 0.82, green: 0.36, blue: 0.32)

    /// Cormorant-adjacent without bundling a font file: the system serif in
    /// italic. Swap to bundled Cormorant Garamond when the asset lands.
    public static func serifItalic(_ size: CGFloat) -> Font {
        .system(size: size, design: .serif).italic()
    }

    public static func serif(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        .system(size: size, weight: weight, design: .serif)
    }
}

/// The small pill button used across the surfaces ("chips" on the web).
public struct ChipButtonStyle: ButtonStyle {
    public var dim: Bool
    public var danger: Bool

    public init(dim: Bool = false, danger: Bool = false) {
        self.dim = dim
        self.danger = danger
    }

    public func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 14, weight: .medium))
            .foregroundStyle(danger ? Theme.danger : (dim ? Theme.muted : Theme.gold))
            .padding(.horizontal, 14)
            .padding(.vertical, 8)
            .background(
                Capsule()
                    .stroke(danger ? Theme.danger.opacity(0.6) : (dim ? Theme.hairline : Theme.gold.opacity(0.65)), lineWidth: 1)
            )
            .contentShape(Capsule())
            .opacity(configuration.isPressed ? 0.6 : 1)
    }
}
