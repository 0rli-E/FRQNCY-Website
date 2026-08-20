// swift-tools-version:5.9
// VBRTNKit — the composable core of the native VBRTN app.
//   VBRTNCore  — logic only: profile, auth, companion API, chart engine (JSCore),
//                intake bank, morning open, recovery. No UI imports.
//   VBRTNUI    — every SwiftUI surface: thread, intake cards, design drawer,
//                memory screen, menu, auth sheet.
import PackageDescription

let package = Package(
    name: "VBRTNKit",
    platforms: [.iOS(.v17)],
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
    ]
)
