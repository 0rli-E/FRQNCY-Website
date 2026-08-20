import SwiftUI
import VBRTNCore

/// The home screen IS the thread — no tab bar. The design drawer, memory
/// screen and menu hang off the toolbar.
public struct RootView: View {
    @EnvironmentObject private var model: AppModel
    @EnvironmentObject private var auth: AuthStore
    @State private var showDesign = false
    @State private var showMemory = false
    @State private var showMenu = false
    @Environment(\.scenePhase) private var scenePhase

    public init() {}

    public var body: some View {
        NavigationStack {
            ZStack {
                Theme.ground.ignoresSafeArea()
                VStack(spacing: 0) {
                    ThreadView()
                    ComposerView()
                }
            }
            .navigationTitle("VBRTN")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(Theme.ground, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    Text("VBRTN")
                        .font(.system(size: 15, weight: .semibold))
                        .tracking(4)
                        .foregroundStyle(Theme.gold)
                }
                ToolbarItemGroup(placement: .topBarTrailing) {
                    Button { showDesign = true } label: {
                        Image(systemName: "circle.hexagongrid")
                    }
                    .accessibilityLabel("Your design")
                    Button { showMemory = true } label: {
                        Image(systemName: "book.closed")
                    }
                    .accessibilityLabel("What VBRTN knows")
                    Button { showMenu = true } label: {
                        Image(systemName: "line.3.horizontal")
                    }
                    .accessibilityLabel("Menu")
                }
            }
            .tint(Theme.muted)
        }
        .sheet(isPresented: $showDesign) { DesignSheet() }
        .sheet(isPresented: $showMemory) { MemorySheet() }
        .sheet(isPresented: $showMenu) { MenuSheet() }
        .onChange(of: scenePhase) { _, phase in
            if phase == .active {
                model.refreshMorningNotification()
            }
        }
    }
}
