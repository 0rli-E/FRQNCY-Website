import SwiftUI
import VBRTNCore

/// One intake question, asked inside the thread. Five input shapes:
/// tiles, free text, short list, slider, and the birth form that draws the
/// chart on-device.
struct IntakeCardView: View {
    @EnvironmentObject private var model: AppModel
    let question: IntakeQuestion
    let pos: Int

    @State private var freeText = ""
    @State private var listValues: [String] = ["", "", ""]
    @State private var sliderValue = 5.0
    // Birth form state
    @State private var birthDate = Date(timeIntervalSince1970: 631_152_000) // 1990-01-01
    @State private var birthTime = Date()
    @State private var timeUnknown = false
    @State private var birthCity = ""
    @State private var tzOffsetMinutes: Int = TimeZone.current.secondsFromGMT() / 60

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("\(pos + 1) of \(Intake.questions.count)")
                .font(.system(size: 11, weight: .medium))
                .tracking(2)
                .foregroundStyle(Theme.muted)
            Text(question.question)
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(Theme.ink)
                .fixedSize(horizontal: false, vertical: true)
            if let hint = question.hint {
                Text(hint)
                    .font(.system(size: 13))
                    .foregroundStyle(Theme.muted)
                    .fixedSize(horizontal: false, vertical: true)
            }

            switch question.type {
            case .tiles: tilesBody
            case .textarea: textareaBody
            case .list: listBody
            case .slider: sliderBody
            case .birthForm: birthBody
            }

            if question.optional {
                Button("Skip for now") {
                    model.answerIntake(question, value: .null, skipped: true)
                }
                .buttonStyle(ChipButtonStyle(dim: true))
            }
        }
        .padding(16)
        .background(RoundedRectangle(cornerRadius: 14).fill(Theme.surface))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Theme.hairline, lineWidth: 1))
        .onAppear {
            sliderValue = Double(question.sliderDefault)
            listValues = Array(repeating: "", count: max(question.maxItems, 1))
        }
    }

    // MARK: - Tiles

    private var tilesBody: some View {
        let columns = Array(repeating: GridItem(.flexible(), spacing: 8), count: max(question.cols, 1))
        return LazyVGrid(columns: columns, spacing: 8) {
            ForEach(question.options, id: \.value) { option in
                Button {
                    model.answerIntake(question, value: .string(option.value), skipped: false)
                } label: {
                    Text(option.label)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(Theme.ink)
                        .multilineTextAlignment(.center)
                        .frame(maxWidth: .infinity, minHeight: 44)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 6)
                        .background(RoundedRectangle(cornerRadius: 10).fill(Theme.surfaceRaised))
                        .overlay(RoundedRectangle(cornerRadius: 10).stroke(Theme.hairline, lineWidth: 1))
                }
            }
        }
    }

    // MARK: - Free text

    private var textareaBody: some View {
        VStack(alignment: .leading, spacing: 10) {
            TextField(question.placeholder ?? "", text: $freeText, axis: .vertical)
                .lineLimit(2...6)
                .font(.system(size: 15))
                .foregroundStyle(Theme.ink)
                .padding(10)
                .background(RoundedRectangle(cornerRadius: 10).fill(Theme.surfaceRaised))
                .overlay(RoundedRectangle(cornerRadius: 10).stroke(Theme.hairline, lineWidth: 1))
            Button("That's it") {
                let value = freeText.trimmingCharacters(in: .whitespacesAndNewlines)
                if !value.isEmpty {
                    model.answerIntake(question, value: .string(value), skipped: false)
                } else if question.optional {
                    model.answerIntake(question, value: .null, skipped: true)
                }
            }
            .buttonStyle(ChipButtonStyle())
        }
    }

    // MARK: - Short list

    private var listBody: some View {
        VStack(alignment: .leading, spacing: 8) {
            ForEach(0..<max(question.maxItems, 1), id: \.self) { index in
                TextField(question.placeholder ?? "", text: bindingForList(index))
                    .font(.system(size: 15))
                    .foregroundStyle(Theme.ink)
                    .padding(10)
                    .background(RoundedRectangle(cornerRadius: 10).fill(Theme.surfaceRaised))
                    .overlay(RoundedRectangle(cornerRadius: 10).stroke(Theme.hairline, lineWidth: 1))
            }
            Button("That's them") {
                let values = listValues
                    .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
                    .filter { !$0.isEmpty }
                if !values.isEmpty {
                    model.answerIntake(question, value: .array(values.map { .string($0) }), skipped: false)
                } else if question.optional {
                    model.answerIntake(question, value: .null, skipped: true)
                } else {
                    model.answerIntake(question, value: .array([]), skipped: true)
                }
            }
            .buttonStyle(ChipButtonStyle())
        }
    }

    private func bindingForList(_ index: Int) -> Binding<String> {
        Binding(
            get: { index < listValues.count ? listValues[index] : "" },
            set: { newValue in
                while listValues.count <= index { listValues.append("") }
                listValues[index] = newValue
            }
        )
    }

    // MARK: - Slider

    private var sliderBody: some View {
        VStack(alignment: .center, spacing: 8) {
            Text("\(Int(sliderValue))")
                .font(Theme.serif(30, weight: .medium))
                .foregroundStyle(Theme.goldInk)
                .frame(maxWidth: .infinity, alignment: .center)
            Slider(value: $sliderValue,
                   in: Double(question.sliderMin)...Double(question.sliderMax),
                   step: 1)
                .tint(Theme.gold)
            if question.sliderLabels.count == 2 {
                HStack {
                    Text(question.sliderLabels[0])
                    Spacer()
                    Text(question.sliderLabels[1])
                }
                .font(.system(size: 12))
                .foregroundStyle(Theme.muted)
            }
            Button("Set") {
                model.answerIntake(question, value: .number(sliderValue.rounded()), skipped: false)
            }
            .buttonStyle(ChipButtonStyle())
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    // MARK: - Birth form

    private static let tzOffsets: [Int] = [
        -720, -660, -600, -570, -540, -480, -420, -360, -300, -270, -240, -210, -180,
        -120, -60, 0, 60, 120, 180, 210, 240, 270, 300, 330, 345, 360, 390, 420, 480,
        525, 540, 570, 600, 630, 660, 690, 720, 765, 840,
    ]

    private var offsetChoices: [Int] {
        var offsets = Self.tzOffsets
        let device = TimeZone.current.secondsFromGMT() / 60
        if !offsets.contains(device) { offsets.append(device) }
        return offsets.sorted()
    }

    private var birthBody: some View {
        VStack(alignment: .leading, spacing: 12) {
            labeledRow("Date of birth") {
                DatePicker("", selection: $birthDate, displayedComponents: .date)
                    .labelsHidden()
            }
            labeledRow("Time of birth") {
                DatePicker("", selection: $birthTime, displayedComponents: .hourAndMinute)
                    .labelsHidden()
                    .disabled(timeUnknown)
                    .opacity(timeUnknown ? 0.4 : 1)
            }
            Toggle(isOn: $timeUnknown) {
                Text("Time unknown — work without it")
                    .font(.system(size: 13))
                    .foregroundStyle(Theme.muted)
            }
            .tint(Theme.gold)
            labeledRow("City of birth") {
                TextField("City, country", text: $birthCity)
                    .font(.system(size: 15))
                    .foregroundStyle(Theme.ink)
                    .padding(8)
                    .background(RoundedRectangle(cornerRadius: 8).fill(Theme.surfaceRaised))
            }
            labeledRow("Timezone at birth (incl. daylight saving)") {
                Picker("", selection: $tzOffsetMinutes) {
                    ForEach(offsetChoices, id: \.self) { minutes in
                        Text(Self.formatOffset(minutes)).tag(minutes)
                    }
                }
                .pickerStyle(.menu)
                .tint(Theme.goldInk)
            }
            Text("Birth details stay in your profile and are used only to draw your chart — the companion only ever sees the chart they produce.")
                .font(.system(size: 12))
                .foregroundStyle(Theme.muted)
                .fixedSize(horizontal: false, vertical: true)
            Button("Draw my chart") {
                submitBirth()
            }
            .buttonStyle(ChipButtonStyle())
        }
    }

    private func labeledRow(_ label: String, @ViewBuilder content: () -> some View) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label)
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(Theme.muted)
            content()
        }
    }

    private static func formatOffset(_ minutes: Int) -> String {
        let sign = minutes < 0 ? "-" : "+"
        let absolute = abs(minutes)
        return String(format: "UTC%@%02d:%02d", sign, absolute / 60, absolute % 60)
    }

    private func submitBirth() {
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        let timeFormatter = DateFormatter()
        timeFormatter.dateFormat = "HH:mm"

        var value: JSONValue = .object([:])
        value["date"] = .string(dateFormatter.string(from: birthDate))
        value["time"] = timeUnknown ? .string("") : .string(timeFormatter.string(from: birthTime))
        value["timeUnknown"] = .bool(timeUnknown)
        value["city"] = .string(birthCity.trimmingCharacters(in: .whitespacesAndNewlines))
        value["tzOffset"] = .number(Double(tzOffsetMinutes))
        model.answerIntake(question, value: value, skipped: false)
    }
}
