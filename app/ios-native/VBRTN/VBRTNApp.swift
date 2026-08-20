import SwiftUI
import VBRTNCore
import VBRTNUI

@main
struct VBRTNApp: App {
    @StateObject private var auth: AuthStore
    @StateObject private var model: AppModel

    init() {
        let auth = AuthStore()
        _auth = StateObject(wrappedValue: auth)
        _model = StateObject(wrappedValue: AppModel(auth: auth))
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(auth)
                .environmentObject(model)
                .preferredColorScheme(.dark)
        }
    }
}
