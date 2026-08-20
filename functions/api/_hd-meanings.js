/**
 * _hd-meanings.js — compact interpretive material for the companion's design
 * lenses. Not a route (underscore). The chart engine gives us labels (type,
 * authority, profile, centers); this file gives the model something true to
 * SAY about them — the difference between knowing the word "Emotional" and
 * knowing that no feeling in the valley is a verdict.
 *
 * Deliberately practical phrasing, no jargon walls — these lines land inside
 * the system prompt and shape how VBRTN reads the person's state.
 */

export const AUTHORITY_PLAYBOOK = {
  'Emotional': 'Decisions ride an emotional wave — there is NO truth in the now for them. High or low, today\'s feeling is weather, not a verdict: never let them conclude anything big from a peak or a valley, and normalise sleeping on things. The valley can feel like fatigue, heaviness, wanting to withdraw — that is the wave doing its work, not their life failing. Clarity is what remains once the wave has passed through. Under a real deadline, NEVER offer a gut check or in-the-moment hit as the tiebreak — the move is: name the deadline as real, buy the smallest amount of time ("I\'ll confirm in the morning"), and say plainly that a yes given from pressure costs more than a lost slot.',
  'Sacral': 'Their truth is a gut response in the moment — the body lights up (yes) or goes flat (no) when something is put in front of them. Help them ask yes/no questions of themselves; if the body doesn\'t respond, the honest answer is no, however sensible the idea looks on paper.',
  'Splenic': 'Their knowing is a quiet, instant, in-the-moment hit — first instinct, spoken once, never repeated. If they\'re deliberating for days they\'ve already lost the signal; bring them back to what they knew in the first second.',
  'Ego': 'Their compass is honest want and engaged will: "do I actually want this — is my heart in it?" Promises made without the will engaged drain them; help them promise less and mean it more.',
  'Self-Projected': 'Their truth shows up in their own voice — they discover what\'s real by hearing themselves say it. Let them talk it out; reflect their own words back rather than adding yours.',
  'Mental': 'Clarity comes from talking things through with trusted people in environments that feel right, over time. No inner yes/no to force — the process IS the discussion; pressure to "just decide" is the enemy.',
  'Lunar': 'Big decisions need a full lunar cycle — about 28 days of sampling how it feels before committing. Same-day certainty is not available to them, and that is design, not weakness.',
};

export const PROFILE_LINES = {
  '1/3': 'Investigator/Martyr — needs a solid foundation of understanding before moving, and learns through trial and error. Their "failures" are their research method.',
  '1/4': 'Investigator/Opportunist — studies deeply, then shares through their network. Opportunities come through people they already know.',
  '2/4': 'Hermit/Opportunist — natural talent that needs alone time to develop, called out by their network. Protect their solitude; the right invitations find them.',
  '2/5': 'Hermit/Heretic — wants to be left alone yet gets projected on as the one with answers. Needs clear boundaries about what they actually offer.',
  '3/5': 'Martyr/Heretic — learns by bumping into what doesn\'t work, then others expect them to have the fix. Their resilience is the gift; nothing is wasted.',
  '3/6': 'Martyr/Role Model — trial-and-error early, wisdom later. What feels like chaos in the first half of life becomes perspective in the second.',
  '4/6': 'Opportunist/Role Model — everything moves through relationships and being seen living it. Their network is their path.',
  '4/1': 'Opportunist/Investigator — a fixed foundation shared through their people. Stability of knowledge matters more than breadth.',
  '5/1': 'Heretic/Investigator — others project big expectations onto them; solid preparation is their armor. They lead practically when the foundation is real.',
  '5/2': 'Heretic/Hermit — projected on as the savior while wanting to be left alone. Choosing WHICH calls to answer is the discipline.',
  '6/2': 'Role Model/Hermit — has a structural REQUIREMENT for protected solitude; when socially overextended their gifts go quiet until they\'ve been properly alone. Life comes in three phases (experimentation to ~30, retreat on the roof to ~50, embodied example after) — being watched, they lead by living it, not preaching it.',
  '6/3': 'Role Model/Martyr — the wisdom arc of the 6 with the lifelong hands-on discovery of the 3. Their example includes their scars, and that\'s why it lands.',
};

export const CENTER_MEANINGS = {
  defined: {
    'Head': 'consistent inner inspiration and their own questions',
    'Ajna': 'a fixed, reliable way of making sense of things',
    'Throat': 'a consistent voice — expression and action flow when timing is right',
    'G': 'a stable sense of identity and direction from within',
    'Heart': 'consistent willpower — can make and keep promises',
    'Sacral': 'sustainable life-force that renews when doing what the gut said yes to',
    'Solar Plexus': 'their own emotional wave — feelings that need to be ridden out, not solved',
    'Spleen': 'steady in-the-moment intuition about what is healthy and safe',
    'Root': 'a steady drive that doesn\'t need external pressure',
  },
  open: {
    'Head': 'amplifies other people\'s questions — mental pressure to answer things that aren\'t theirs',
    'Ajna': 'a flexible mind under pressure to SEEM certain — they don\'t have to be',
    'Throat': 'pressure to speak and be noticed — let the words come when invited',
    'G': 'takes identity and direction from environment — the right places and people are not optional, they are the steering',
    'Heart': 'pressure to prove themselves and over-promise — they have nothing to prove',
    'Sacral': 'doesn\'t know when enough is enough — burnout comes from borrowing energy',
    'Solar Plexus': 'absorbs and amplifies everyone\'s feelings — half of what they feel in a room isn\'t theirs; avoidance of confrontation is the tell',
    'Spleen': 'holds on to things (and people) past their health — and absorbs fears that aren\'t theirs',
    'Root': 'hurries to discharge pressure — the rush is the conditioning, not the truth',
  },
};

export const SIGN_NOTES = {
  Aries: 'direct, initiating, needs a front line',
  Taurus: 'steady, sensory, builds slowly and keeps it',
  Gemini: 'curious, quick, needs variety and words',
  Cancer: 'protective, feeling-led, home matters',
  Leo: 'warm, expressive, needs to be seen genuinely',
  Virgo: 'precise, improving, serves through craft',
  Libra: 'relational, balancing, decides through comparison',
  Scorpio: 'intense, transformative, all-or-nothing depth',
  Sagittarius: 'expansive, truth-seeking, needs horizon',
  Capricorn: 'structural, enduring, climbs — and moves its own goalposts',
  Aquarius: 'systemic, independent, ahead of the room',
  Pisces: 'porous, imaginal, needs tide-time to itself',
};
