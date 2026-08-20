/**
 * _hd-gates.js — per-user gate keynotes for the companion's context. Not a
 * route (underscore). The chart engine hands the companion gate NUMBERS; this
 * file gives it something true to say about each one — one grounded sentence
 * per gate about what that energy is like to live with, in the same practical
 * register as _hd-meanings.js. No jargon walls: these lines land inside the
 * system prompt.
 *
 * COPYRIGHT RULE (hard, for every future editor): the standard keyword names
 * (Self-Expression, Power, Insight...) and the gate→center mapping are shared
 * Human Design vocabulary and fine to use. The keynote PROSE is original to
 * this file and must stay that way — do NOT paste in sentences or distinctive
 * phrasings from Ra Uru Hu's Rave I Ching, the Line Companion, or any Human
 * Design book or site. Rewrite in your own words or don't add it.
 */

export const GATES = {
  1:  { name: 'Self-Expression',       keynote: 'a creative drive with its own timing — the work comes through when they stop performing and let what is uniquely theirs out' },
  2:  { name: 'Direction of the Self', keynote: 'an inner compass others orient by — they cannot explain where the path leads, but they feel immediately when it is off' },
  3:  { name: 'Ordering',              keynote: 'the energy for making something new workable — the chaos at the beginning is raw material, not a sign of failure' },
  4:  { name: 'Formulization',         keynote: 'a mind that generates answers and formulas on demand — useful as possibilities to test, corrosive when treated as verdicts about their life' },
  5:  { name: 'Fixed Rhythms',         keynote: 'a body that runs on its own rhythms and rituals — keep the pattern and energy holds; break it and everything wobbles' },
  6:  { name: 'Friction',              keynote: 'the emotional membrane deciding who gets close and when — friction here is how both intimacy and conflict begin, so pacing matters' },
  7:  { name: 'The Role of the Self',  keynote: 'a natural feel for where a group should head — direction that lands when others ask for it and grates when self-appointed' },
  8:  { name: 'Contribution',          keynote: 'the urge to add something genuinely individual to the collective — their lived example recruits people far better than their arguments do' },
  9:  { name: 'Focus',                 keynote: 'energy that pours into small details — power comes from choosing the right small thing, not from trying to do everything' },
  10: { name: 'Behavior of the Self',  keynote: 'self-love as behavior rather than affirmation — how they carry themselves is the teaching, and any self-betrayal shows immediately' },
  11: { name: 'Ideas',                 keynote: 'a steady stream of ideas meant to stimulate and be shared — not every idea they have is theirs to build' },
  12: { name: 'Caution',               keynote: 'expression tied to mood and moment — when the timing is right the words carry; forced out early, they fall flat' },
  13: { name: 'The Listener',          keynote: 'a natural confessor people bring their stories to — they end up holding the record of what happened and what it meant' },
  14: { name: 'Power Skills',          keynote: 'fuel and resources that multiply when the work itself is loved — abundance here follows response, never chasing' },
  15: { name: 'Extremes',              keynote: 'a rhythm that swings between extremes with no fixed routine — that range is exactly what lets them accept everyone else\'s' },
  16: { name: 'Skills',                keynote: 'enthusiasm that wants to repeat a craft until skill becomes art — depth of practice, not raw talent, is the real secret' },
  17: { name: 'Opinions',              keynote: 'structured opinions about how things should work — offered when asked they organize people; delivered unasked they just start arguments' },
  18: { name: 'Correction',            keynote: 'an instinct for spotting what is broken and could be better — aimed at patterns it heals, aimed at people it wounds' },
  19: { name: 'Wanting',               keynote: 'fine-tuned sensitivity to what people and community need — the pressure is to approach, to bond, to make sure everyone has enough' },
  20: { name: 'The Now',               keynote: 'awareness that exists only in the present — they speak and act in the moment, or the clarity simply is not there' },
  21: { name: 'Control',               keynote: 'the will to manage resources, territory, and terms — it needs domains of its own; trying to control other people backfires' },
  22: { name: 'Openness',              keynote: 'emotional grace in social flow — in the right mood they open a whole room; in the wrong one, charm should not be forced' },
  23: { name: 'Assimilation',          keynote: 'the knack for translating strange insight into plain language — timing decides whether they sound like a genius or just odd' },
  24: { name: 'Rationalization',       keynote: 'a mind that circles back to the same question until it resolves — the looping is how knowing ripens, not indecision' },
  25: { name: 'The Spirit of the Self', keynote: 'an innocence that meets everyone and everything the same way — impersonal love, tested by life\'s shocks and restored by spirit' },
  26: { name: 'The Egoist',            keynote: 'the knack for transmitting value — selling, persuading, packaging truth so it lands; clean as long as the claims are true' },
  27: { name: 'Caring',                keynote: 'the energy to nourish and protect — care that sustains when it responds to real need, and smothers when handed out wholesale' },
  28: { name: 'The Game Player',       keynote: 'wrestling with what is actually worth living for — risk and struggle are how they find meaning, and purposelessness frightens them most' },
  29: { name: 'Perseverance',          keynote: 'the power of the committed yes — once the gut agrees they can persist through anything; saying yes to everything is the trap' },
  30: { name: 'Feelings',              keynote: 'desire that burns until an experience has been fully felt — feelings clarify by being lived through, not by being managed' },
  31: { name: 'Influence',             keynote: 'a voice built for leading — it carries when the group has asked them to speak for it, and echoes emptily when it hasn\'t' },
  32: { name: 'Continuity',            keynote: 'an instinct for what will last — conservative by design, it senses which ambitions are viable and which will quietly fail' },
  33: { name: 'Privacy',               keynote: 'the need to retreat and turn experience into story — what happened only becomes wisdom after time alone with it' },
  34: { name: 'Power',                 keynote: 'raw sustainable power that works cleanly only in response — forced, it exhausts itself and everyone near it' },
  35: { name: 'Change',                keynote: 'hunger for the new experience over the repeated one — been-there wisdom that needs the next thing, not the same thing again' },
  36: { name: 'Crisis',                keynote: 'emotional appetite for the not-yet-experienced — depth gets made through crisis here; waiting for clarity turns the chaos into story' },
  37: { name: 'Friendship',            keynote: 'the warmth that holds families and teams together — loyalty runs on bargains, and they need agreements explicit and honored' },
  38: { name: 'The Fighter',           keynote: 'stubborn energy for fighting the fights that matter — purpose shows up as opposition, and the skill is choosing which battles' },
  39: { name: 'Provocation',           keynote: 'energy that pokes until spirit responds — they provoke moods in others just by being there; aimed well, it sets people free' },
  40: { name: 'Aloneness',             keynote: 'willpower that delivers for its people and then needs solitude — rest and appreciation are the working contract, not luxuries' },
  41: { name: 'Contraction',           keynote: 'the pressure of imagination starting things — a fantasy engine where one dream at a time gets to become real experience' },
  42: { name: 'Growth',                keynote: 'energy for completing cycles — growth comes from closing what was started, and half-finished chapters drain them quietly' },
  43: { name: 'Insight',               keynote: 'inner knowing that arrives whole, without steps — it needs the right invitation to land, or it sounds like noise to others' },
  44: { name: 'Alertness',             keynote: 'an instinctive memory for patterns and people — they can smell who fits which role and which past mistake is about to repeat' },
  45: { name: 'The Gatherer',          keynote: 'the natural steward of a group\'s resources — leadership as gathering and distributing; hoarding is the same gift gone possessive' },
  46: { name: 'Determination',         keynote: 'love of the body and its timing — being fully in the physical experience is what puts them in the right place' },
  47: { name: 'Realization',           keynote: 'a mind that makes sense of the past on its own schedule — pressure to figure it out right now only deepens the fog' },
  48: { name: 'Depth',                 keynote: 'a deep well of ready wisdom — the fear of not being enough is false; the depth is real and surfaces when tapped' },
  49: { name: 'Principles',            keynote: 'the principles that decide who is in and who is out — revolutions start here, and so does needless rejection' },
  50: { name: 'Values',                keynote: 'the guardian instinct for the rules that keep people well — they feel responsible for the tribe\'s values, sometimes far too responsible' },
  51: { name: 'Shock',                 keynote: 'competitive, initiating courage — the one who leaps first and survives the shock; their jolts are what wake other people up' },
  52: { name: 'Stillness',             keynote: 'the capacity to sit still under pressure — concentration that holds one point; restlessness usually means the focus is on the wrong thing' },
  53: { name: 'Beginnings',            keynote: 'pressure to start new things — a beginner\'s engine that is not obliged to finish; others often carry what it launches' },
  54: { name: 'Ambition',              keynote: 'the drive to rise and transform circumstances — ambition that works through allies and recognition rather than lone pushing' },
  55: { name: 'Spirit',                keynote: 'a moody, musical emotional depth — spirit rises and falls like a tide, and no mood needs fixing to be valid' },
  56: { name: 'Stimulation',           keynote: 'the storyteller\'s hunger for stimulation — experience gets collected in order to be told, and the tale teaches better than the lecture' },
  57: { name: 'Intuitive Clarity',     keynote: 'a body that hears what is healthy right now — the quietest, clearest alarm in the chart, and only ever present-tense' },
  58: { name: 'Vitality',              keynote: 'a bubbling drive to improve what is loved — joy plus dissatisfaction, critique aimed at making life better rather than tearing it down' },
  59: { name: 'Sexuality',             keynote: 'the power to dissolve the walls between people — intimacy, bonding, and making things fertile in every sense of the word' },
  60: { name: 'Acceptance',            keynote: 'energy that mutates within limits — accepting the constraint is the doorway, and fighting it stalls the new thing entirely' },
  61: { name: 'Mystery',               keynote: 'pressure to know the unknowable — inspiration that visits in silence; the big questions are fuel, not homework that is due' },
  62: { name: 'Detail',                keynote: 'the gift of naming and precision — details are what turn a vision into something buildable, and the right name unlocks the room' },
  63: { name: 'Doubt',                 keynote: 'a questioning pressure that tests every pattern — doubt aimed at ideas is quality control; turned inward, it quietly corrodes' },
  64: { name: 'Confusion',             keynote: 'a mind flooded with images of the past — the sense-making completes on its own schedule, and confusion is a phase, not a fault' },
};

/** Standard gate → center mapping (Head, Ajna, Throat, G, Heart, Sacral, Solar Plexus, Spleen, Root). */
export const GATE_CENTERS = {
  1: 'G', 2: 'G', 3: 'Sacral', 4: 'Ajna', 5: 'Sacral', 6: 'Solar Plexus',
  7: 'G', 8: 'Throat', 9: 'Sacral', 10: 'G', 11: 'Ajna', 12: 'Throat',
  13: 'G', 14: 'Sacral', 15: 'G', 16: 'Throat', 17: 'Ajna', 18: 'Spleen',
  19: 'Root', 20: 'Throat', 21: 'Heart', 22: 'Solar Plexus', 23: 'Throat', 24: 'Ajna',
  25: 'G', 26: 'Heart', 27: 'Sacral', 28: 'Spleen', 29: 'Sacral', 30: 'Solar Plexus',
  31: 'Throat', 32: 'Spleen', 33: 'Throat', 34: 'Sacral', 35: 'Throat', 36: 'Solar Plexus',
  37: 'Solar Plexus', 38: 'Root', 39: 'Root', 40: 'Heart', 41: 'Root', 42: 'Sacral',
  43: 'Ajna', 44: 'Spleen', 45: 'Throat', 46: 'G', 47: 'Ajna', 48: 'Spleen',
  49: 'Solar Plexus', 50: 'Spleen', 51: 'Heart', 52: 'Root', 53: 'Root', 54: 'Root',
  55: 'Solar Plexus', 56: 'Throat', 57: 'Spleen', 58: 'Root', 59: 'Sacral', 60: 'Root',
  61: 'Head', 62: 'Throat', 63: 'Head', 64: 'Head',
};

/** "Gate 34 — Power: raw sustainable power that works cleanly only in response — ..." or null. */
export function gateLine(n) {
  const g = Number(n);
  if (!Number.isInteger(g) || g < 1 || g > 64) return null;
  const entry = GATES[g];
  if (!entry) return null;
  return `Gate ${g} — ${entry.name}: ${entry.keynote}`;
}
