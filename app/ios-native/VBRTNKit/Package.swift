// swift-tools-version:5.9
// VBRTNKit — the composable core of the native VBRTN app.
//   VBRTNCore  — logic only: profile, auth, companion API, chart engine (JSCore),
//                intake bank, morning open, recovery. No UI imports.
//   VBRTNUI    — every SwiftUI surface: thread, intake cards, design drawer,
//                memory screen, menu, auth sheet.
import PackageDescription

let package = Package(
    name: "VBRTNKit",
    // macOS is never shipped — it exists so VBRTNCore can be type-checked and
    // logic-tested on a Mac with CommandLineTools alone (no Xcode needed).
    platforms: [.iOS(.v17), .macOS(.v13)],
    products: [
        .library(name: "VBRTNCore", targets: ["VBRTNCore"]),
        .library(name: "VBRTNUI", targets: ["VBRTNUI"]),
    ],
    targets: [
        .target(
            name: "VBRTNCore",
            resources: [
                .copy("Resources/vsop87-data.js"),
                .copy("Resources/hd-engine.js"),
                .copy("Resources/gene-keys.js"),
            ]
        ),
        .target(
            name: "VBRTNUI",
            dependencies: ["VBRTNCore"]
        ),
        // Logic checks runnable on a bare Mac: `swift run CoreCheck`.
        // Not part of the app; exists because XCTest is unavailable under
        // CommandLineTools and the core deserves executed verification.
        .executableTarget(
            name: "CoreCheck",
            dependencies: ["VBRTNCore"]
        ),
    ]
)
