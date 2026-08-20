import Foundation

public enum IntakeType: Equatable {
    case tiles
    case textarea
    case list
    case slider
    case birthForm
}

public struct IntakeOption: Equatable {
    public let value: String
    public let label: String
    public let reflection: String
}

public struct IntakeQuestion: Identifiable, Equatable {
    public let id: String
    public let session: Int
    public let sessionTitle: String
    public let question: String
    public let hint: String?
    public let type: IntakeType
    public let cols: Int
    public let options: [IntakeOption]
    public let placeholder: String?
    public let reflection: String?
    public let optional: Bool
    public let field: String
    public let maxItems: Int
    public let sliderMin: Int
    public let sliderMax: Int
    public let sliderLabels: [String]
    public let sliderDefault: Int

    init(id: String, session: Int, sessionTitle: String, question: String,
         hint: String? = nil, type: IntakeType, cols: Int = 1,
         options: [IntakeOption] = [], placeholder: String? = nil,
         reflection: String? = nil, optional: Bool = false, field: String,
         maxItems: Int = 3, sliderMin: Int = 1, sliderMax: Int = 10,
         sliderLabels: [String] = [], sliderDefault: Int = 5) {
        self.id = id
        self.session = session
        self.sessionTitle = sessionTitle
        self.question = question
        self.hint = hint
        self.type = type
        self.cols = cols
        self.options = options
        self.placeholder = placeholder
        self.reflection = reflection
        self.optional = optional
        self.field = field
        self.maxItems = maxItems
        self.sliderMin = sliderMin
        self.sliderMax = sliderMax
        self.sliderLabels = sliderLabels
        self.sliderDefault = sliderDefault
    }
}

/// The 24-question intake, ported verbatim from the shared bank
/// (my-frqncy/intake → app companion.html). Same ids, same field paths,
/// same reflections — a profile begun on any surface continues here.
public enum Intake {
    public static let questions: [IntakeQuestion] = [
        IntakeQuestion(
            id: "texture", session: 1, sessionTitle: "Where you stand",
            question: "Which of these best describes where you are in your life right now?",
            hint: "Pick the one that comes first. The body knows before the mind catches up.",
            type: .tiles, cols: 2,
            options: [
                IntakeOption(value: "stride", label: "Hitting my stride", reflection: "Stride is its own gravity. Notice it; do not over-control it."),
                IntakeOption(value: "building", label: "Slowly building", reflection: "Slow building is the real kind. The fast kind collapses."),
                IntakeOption(value: "holding", label: "Holding it together", reflection: "Holding it together is heavier than moving. The fact that you are still holding is the work."),
                IntakeOption(value: "surviving", label: "Just getting through", reflection: "Just getting through is its own strength. Naming it changes the load."),
                IntakeOption(value: "catching-breath", label: "Catching my breath", reflection: "Breath is the part of the work that asks for nothing."),
                IntakeOption(value: "restart", label: "Starting over", reflection: "Starting over is choosing the form again. Most people never get the chance."),
                IntakeOption(value: "searching", label: "Looking for what is next", reflection: "Looking means you have not given up. That alone is more than most."),
                IntakeOption(value: "returning", label: "Coming back to myself", reflection: "Coming back is the one motion the door does not lock against."),
            ],
            field: "standing.texture"
        ),
        IntakeQuestion(
            id: "recentFeeling", session: 1, sessionTitle: "Where you stand",
            question: "In the last thirty days, which feeling has shown up most?",
            hint: "There is no wrong answer. The honest one is the useful one.",
            type: .tiles, cols: 2,
            options: [
                IntakeOption(value: "tired", label: "Tired", reflection: "Tired is data. What has been carried that does not need to be carried?"),
                IntakeOption(value: "stressed", label: "Stressed", reflection: "Stress is the body running ahead of itself. The first move is slowing the body down."),
                IntakeOption(value: "anxious", label: "Anxious", reflection: "Anxiety is the body knowing something the mind has not yet named."),
                IntakeOption(value: "overwhelmed", label: "Overwhelmed", reflection: "Overwhelm means the inputs outran the capacity. Cut inputs, do not add strength."),
                IntakeOption(value: "sad", label: "Sad", reflection: "Sadness is grief that has not been formally introduced. It deserves the introduction."),
                IntakeOption(value: "lonely", label: "Lonely", reflection: "Loneliness is the body asking for a particular kind of contact. Notice which kind."),
                IntakeOption(value: "frustrated", label: "Frustrated", reflection: "Frustration is Generator language. Something is asking to be responded to, not initiated."),
                IntakeOption(value: "angry", label: "Angry", reflection: "Anger is power that has not yet found its direction."),
                IntakeOption(value: "numb", label: "Numb", reflection: "Numb is the body saying \"too much, too fast.\" Not a verdict."),
                IntakeOption(value: "restless", label: "Restless", reflection: "Restless is asking. The question is what it is asking for."),
                IntakeOption(value: "hopeful", label: "Hopeful", reflection: "Hope is unfinished. That is the design."),
                IntakeOption(value: "curious", label: "Curious", reflection: "Curiosity pulls without pushing. The most underrated state."),
                IntakeOption(value: "excited", label: "Excited", reflection: "Excitement is desire that has not yet been disciplined. Both halves are useful."),
                IntakeOption(value: "grateful", label: "Grateful", reflection: "Gratitude is the first frequency above survival. Notice you arrived there."),
                IntakeOption(value: "content", label: "Content", reflection: "Content is rare. Most people skip it on the way to wanting more."),
                IntakeOption(value: "peaceful", label: "Peaceful", reflection: "Peace is rarely loud. The fact that you notice it is the proof."),
                IntakeOption(value: "alive", label: "Alive", reflection: "Alive is the baseline. What follows has to live up to it."),
            ],
            field: "standing.recentFeeling"
        ),
        IntakeQuestion(
            id: "dominantDesire", session: 1, sessionTitle: "Where you stand",
            question: "What do you want more of right now? Pick the closest.",
            hint: "You will refine the specifics later. This is just the direction.",
            type: .tiles, cols: 2,
            options: [
                IntakeOption(value: "freedom", label: "Freedom", reflection: "Freedom is worth specifying. The companion will come back to ask what kind."),
                IntakeOption(value: "peace", label: "Peace", reflection: "Peace is rarer than people admit. Picking it is a real choice."),
                IntakeOption(value: "purpose", label: "Purpose", reflection: "Purpose is the question the second half of life asks louder than the first."),
                IntakeOption(value: "love", label: "Love", reflection: "Love is the only frequency that does not ration itself when it grows."),
                IntakeOption(value: "health", label: "Health", reflection: "Health is the body asking for attention. The companion will help name which kind."),
                IntakeOption(value: "time", label: "Time", reflection: "Time is the only resource you cannot make more of. Choosing what it is for is the practice."),
                IntakeOption(value: "money", label: "Money", reflection: "Money is energy held in waiting. The question is always what for."),
                IntakeOption(value: "creativity", label: "Creativity", reflection: "Creativity is the channel through which something not-yet enters the room."),
                IntakeOption(value: "growth", label: "Growth", reflection: "Growth is the orientation, not the destination. The companion will keep that in mind."),
                IntakeOption(value: "impact", label: "Impact", reflection: "Impact is the externalisation of internal work. Both halves count."),
                IntakeOption(value: "adventure", label: "Adventure", reflection: "Adventure is the body wanting to be larger than the room. We can build the room around that."),
                IntakeOption(value: "stability", label: "Stability", reflection: "Stability is the ground that lets the rest of the work happen. Naming it is not small."),
            ],
            field: "standing.dominantDesire"
        ),
        IntakeQuestion(
            id: "avoiding", session: 1, sessionTitle: "Where you stand",
            question: "What's the thing you keep postponing — the one you know you'll have to face?",
            hint: "Optional. Skip if it is not ready to be named.",
            type: .textarea, placeholder: "The thing that keeps moving to next week…",
            reflection: "Naming it is most of the work. Notice — the room did not change. You did.",
            optional: true, field: "standing.avoiding"
        ),
        IntakeQuestion(
            id: "pull", session: 1, sessionTitle: "Where you stand",
            question: "What pulls you?",
            hint: "A person, a place, a topic, a feeling. Whatever surfaces first.",
            type: .textarea, placeholder: "What pulls…",
            reflection: "Whatever pulls is the direction. Trust the pull — it knows things the plan does not.",
            field: "standing.pull"
        ),
        IntakeQuestion(
            id: "birthData", session: 2, sessionTitle: "The map you came in with",
            question: "Your birth — date, place, and time if you have it.",
            hint: "This generates your Human Design chart, your Gene Keys, and your natal astrology. Time unknown still works — just less precise. You can skip and come back later.",
            type: .birthForm,
            reflection: "Your chart is one of about eight billion configurations. The one you got is the one that fits the work you came here to do.",
            optional: true, field: "design.birth"
        ),
        IntakeQuestion(
            id: "priorFamiliarity", session: 2, sessionTitle: "The map you came in with",
            question: "Have you read or worked with Human Design, Gene Keys, or astrology before?",
            type: .tiles, cols: 2,
            options: [
                IntakeOption(value: "none", label: "None of it", reflection: "Then we start fresh. The system reveals itself in its own time."),
                IntakeOption(value: "little", label: "A little", reflection: "A little is plenty for now. The deeper material waits for the right question."),
                IntakeOption(value: "lot", label: "A lot", reflection: "Then the companion will not over-translate. We will speak the actual language."),
                IntakeOption(value: "teach", label: "I teach it", reflection: "Then the companion will sometimes ask you to teach it back. The mirror works both ways."),
            ],
            field: "design.priorFamiliarity"
        ),
        IntakeQuestion(
            id: "cannotChange", session: 2, sessionTitle: "The map you came in with",
            question: "What's a pattern about you that keeps coming back, no matter what you try?",
            hint: "A habit, a feeling, a kind of relationship — whatever returns every few years.",
            type: .textarea, placeholder: "The pattern that returns…",
            reflection: "That pattern is probably not a flaw. It is likely the shape of how you are supposed to move.",
            field: "design.cannotChange"
        ),
        IntakeQuestion(
            id: "toward_away", session: 3, sessionTitle: "How your mind moves",
            question: "When you set out, are you moving toward something you want, or away from something you don't?",
            type: .tiles, cols: 1,
            options: [
                IntakeOption(value: "toward", label: "Toward what I want", reflection: "Toward types lead with vision. The companion will speak in what you are reaching for."),
                IntakeOption(value: "away", label: "Away from what I don't", reflection: "Away From types lead with relief. The companion will speak in what you are moving past."),
                IntakeOption(value: "both", label: "Both, depending", reflection: "The rarer configuration. The companion will pace between the two."),
            ],
            field: "meta.toward_away"
        ),
        IntakeQuestion(
            id: "internal_external", session: 3, sessionTitle: "How your mind moves",
            question: "How do you know you've done good work?",
            type: .tiles, cols: 1,
            options: [
                IntakeOption(value: "internal", label: "I feel it inside", reflection: "Internal frame. The companion mirrors what you already know, never verifies it."),
                IntakeOption(value: "external", label: "Someone tells me", reflection: "External frame. The companion names the work back to you so you can hear it."),
                IntakeOption(value: "mixed", label: "Both, but one weighs more", reflection: "Mixed. The companion holds both and leans to the heavier side as it learns you."),
            ],
            field: "meta.internal_external"
        ),
        IntakeQuestion(
            id: "options_procedures", session: 3, sessionTitle: "How your mind moves",
            question: "Step-by-step, or a few possibilities you choose between?",
            type: .tiles, cols: 1,
            options: [
                IntakeOption(value: "procedures", label: "Step-by-step", reflection: "Procedures. The companion sequences your moves."),
                IntakeOption(value: "options", label: "A few possibilities", reflection: "Options. The companion hands you doors instead of paths."),
                IntakeOption(value: "depends", label: "Depends", reflection: "Then we match the context."),
            ],
            field: "meta.options_procedures"
        ),
        IntakeQuestion(
            id: "general_specific", session: 3, sessionTitle: "How your mind moves",
            question: "When someone explains something to you, what do you want first — the overview, or the steps?",
            type: .tiles, cols: 1,
            options: [
                IntakeOption(value: "general", label: "The overview first", reflection: "General sort. The companion opens with the frame."),
                IntakeOption(value: "specific", label: "The steps first", reflection: "Specific sort. The companion opens with the part."),
                IntakeOption(value: "both", label: "Overview, then steps", reflection: "The companion leads with the frame and follows with the part."),
            ],
            field: "meta.general_specific"
        ),
        IntakeQuestion(
            id: "sameness_difference", session: 3, sessionTitle: "How your mind moves",
            question: "When something new shows up in your life, what hits first — what's familiar about it, or what's different?",
            type: .tiles, cols: 1,
            options: [
                IntakeOption(value: "sameness", label: "What is familiar about it", reflection: "Sameness sort. Change reads as discontinuity — the companion frames new moves as continuations."),
                IntakeOption(value: "difference", label: "What is different about it", reflection: "Difference sort. You sort for what is new. The companion offers unopened doors."),
                IntakeOption(value: "both", label: "Both, roughly equally", reflection: "Then we match the context."),
            ],
            field: "meta.sameness_difference"
        ),
        IntakeQuestion(
            id: "convincer", session: 3, sessionTitle: "How your mind moves",
            question: "How many times do you need to experience something to trust it?",
            type: .tiles, cols: 2,
            options: [
                IntakeOption(value: "once", label: "Once", reflection: "Automatic convincer. The first instance lands. The companion writes for the first read."),
                IntakeOption(value: "few", label: "A few times", reflection: "Number-of-examples. The companion returns to the same insight from different angles."),
                IntakeOption(value: "many", label: "Many times", reflection: "Consistent. The companion knows nothing is settled — it keeps being said."),
                IntakeOption(value: "reconvinced", label: "Always reconvinced", reflection: "Then the relationship is the practice, not the conclusion."),
            ],
            field: "meta.convincer"
        ),
        IntakeQuestion(
            id: "haveToSentence", session: 3, sessionTitle: "How your mind moves",
            question: "And one in your own voice — what sentence do you catch yourself saying that starts with \"I have to\"?",
            hint: "Stay in your own words. Whatever first surfaces.",
            type: .textarea, placeholder: "I have to…",
            reflection: "That sentence has a voice in it. Whose? The \"have to\" is rarely yours alone.",
            field: "meta.modalOperators.necessity"
        ),
        IntakeQuestion(
            id: "cantSentence", session: 3, sessionTitle: "How your mind moves",
            question: "And the other side — what do you catch yourself saying you \"can't\" do?",
            hint: "The closed door you keep walking past. One sentence.",
            type: .textarea, placeholder: "I can't…",
            reflection: "\"Can't\" is a closed door. Sometimes it is not locked — just heavier than it looks.",
            field: "meta.modalOperators.impossibility"
        ),
        IntakeQuestion(
            id: "negativeTriggers", session: 4, sessionTitle: "Your doors",
            question: "What reliably ruins your day in under sixty seconds?",
            hint: "Up to three, one per line. These stay on this device — they are never sent anywhere, and the companion never names them back.",
            type: .list, placeholder: "Something that pulls you down fast…",
            reflection: "Not weaknesses. Locators. Each one points at something asking to be met.",
            field: "triggers.negative", maxItems: 3
        ),
        IntakeQuestion(
            id: "positiveTriggers", session: 4, sessionTitle: "Your doors",
            question: "What reliably brings you back?",
            hint: "Up to three. Doors the companion can hand you when you are far from yourself.",
            type: .list, placeholder: "Something that returns you to yourself…",
            reflection: "Hold these. When you are far from yourself, these are the doors back.",
            field: "triggers.positive", maxItems: 3
        ),
        IntakeQuestion(
            id: "music", session: 4, sessionTitle: "Your doors",
            question: "What music does to you what nothing else can?",
            hint: "A song, an artist, a frequency. Optional.",
            type: .textarea, placeholder: "The sound that works on you…",
            reflection: "Music bypasses the mind. The companion holds this for the Mindmovie that is coming.",
            optional: true, field: "triggers.music"
        ),
        IntakeQuestion(
            id: "place", session: 4, sessionTitle: "Your doors",
            question: "Where do you feel most yourself?",
            hint: "A kitchen at 7am. A trail you walk alone. Wherever you become more you.",
            type: .textarea, placeholder: "Where, when, with whom…",
            reflection: "That place is a state. Once you know what it is made of, you can build it anywhere.",
            field: "triggers.place"
        ),
        IntakeQuestion(
            id: "witnessedTruth", session: 4, sessionTitle: "Your doors",
            question: "What's the last thing someone said about you that landed as true?",
            hint: "A friend, a partner, a stranger. The sentence the body knew before the mind agreed.",
            type: .textarea, placeholder: "They said…",
            reflection: "People rarely tell us the true things. When they do, the body knows.",
            field: "triggers.witnessedTruth"
        ),
        IntakeQuestion(
            id: "rememberOne", session: 5, sessionTitle: "What to remember",
            question: "If VBRTN could remember one thing about you forever, what would you want it to be?",
            hint: "One line. This becomes the companion's opening line in every session.",
            type: .textarea, placeholder: "The one thing…",
            reflection: "That is the seed. The companion will speak to that part of you, first, every time.",
            field: "rememberOne"
        ),
        IntakeQuestion(
            id: "desireToLearn", session: 5, sessionTitle: "What to remember",
            question: "How strong is your hunger to learn right now?",
            hint: "Honest read. It shifts week to week — the truth right now is the useful one.",
            type: .slider,
            reflection: "Even a low score is information. Desire shifts, and the companion learns the shape of yours.",
            field: "baseline.desireToLearn", sliderLabels: ["Low", "High"]
        ),
        IntakeQuestion(
            id: "willingnessToChange", session: 5, sessionTitle: "What to remember",
            question: "What is your willingness to change today?",
            hint: "Willingness is harder to move than desire — it touches identity.",
            type: .slider,
            reflection: "Willingness is harder than desire — it touches identity. The companion notices when it shifts.",
            field: "baseline.willingnessToChange", sliderLabels: ["Low", "High"]
        ),
        IntakeQuestion(
            id: "chiefAimDistance", session: 5, sessionTitle: "What to remember",
            question: "And how far do you feel from the life you want?",
            hint: "1 = already there. 10 = impossibly far. Asked again every thirty days; the trend is the work.",
            type: .slider,
            reflection: "This is the baseline. Not the verdict. The number changes. The trend is the work.",
            field: "baseline.chiefAimDistance", sliderLabels: ["Already there", "Impossibly far"]
        ),
    ]
}
