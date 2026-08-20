/**
 * _iching.js — the I Ching layer under the Human Design gates. Not a route
 * (underscore). HD gates map 1:1 to the 64 hexagrams of the I Ching in the
 * standard King Wen sequence — gate N = hexagram N — so this file lets the
 * companion deepen any per-gate context with the older layer underneath it:
 * one hexagram name plus one lived-guidance sentence per number, in the same
 * practical register as _hd-gates.js.
 *
 * SOURCE NOTE: names are the standard common English hexagram names of the
 * King Wen sequence; essences are OUR OWN modern distillations of each
 * hexagram's judgment + image, grounded in the public-domain James Legge
 * translation (Sacred Books of the East vol. 16, 1899).
 *
 * COPYRIGHT RULE (hard, for every future editor): do NOT paste in sentences
 * or distinctive phrasings from copyrighted translations (Wilhelm/Baynes is
 * NOT public domain) or from Human Design / Gene Keys books. Legge 1899 is
 * public domain, but prefer plain modern rewording grounded in it — verbatim
 * Legge is legally fine yet archaic. Rewrite in your own words or don't add it.
 */

export const HEXAGRAMS = {
  1:  { name: 'The Creative',                  essence: 'the origin of creative energy works without pause — like heaven\'s steady turning, real strength renews itself through persistence and finishes what it sets in motion' },
  2:  { name: 'The Receptive',                 essence: 'receptive strength carries everything the way the earth does — by yielding, supporting, and following the lead of the moment rather than forcing one' },
  3:  { name: 'Difficulty at the Beginning',   essence: 'beginnings are tangled by nature — the growth is real under the confusion, so gather help, set things in order, and do not push ahead alone' },
  4:  { name: 'Youthful Folly',                essence: 'inexperience is workable when it genuinely wants to learn — ask sincerely, accept the first clear answer, and let steady practice build the character' },
  5:  { name: 'Waiting',                       essence: 'when the obstacle cannot yet be crossed, waiting with confidence is strength — eat, rest, and hold steady until the right moment carries you over' },
  6:  { name: 'Conflict',                      essence: 'in a dispute, being right is not enough — meet halfway, consult someone impartial, and drop the fight before winning it costs more than losing' },
  7:  { name: 'The Army',                      essence: 'collective force succeeds under a seasoned, trusted leader — discipline and a just cause turn many people into one strength instead of a mob' },
  8:  { name: 'Holding Together',              essence: 'union holds when people gather around a steady center — examine whether you can be that center, and join what matters before it is too late' },
  9:  { name: 'The Taming Power of the Small', essence: 'when only small means are available, restrain and refine rather than force — dense clouds before rain are preparation, not failure' },
  10: { name: 'Treading',                      essence: 'careful conduct lets you walk even on a tiger\'s tail — know your place, keep your manner simple and sincere, and dangerous ground becomes passable' },
  11: { name: 'Peace',                         essence: 'when the low and the high communicate freely, everything flourishes — good times are for connecting, distributing, and helping the flow along, not hoarding' },
  12: { name: 'Standstill',                    essence: 'when communication breaks down and small people hold sway, withdraw rather than compromise — keep your worth quiet and wait out the obstruction' },
  13: { name: 'Fellowship',                    essence: 'fellowship works in the open — shared aims declared in daylight can cross great rivers, while private cliques and hidden agendas cannot' },
  14: { name: 'Possession in Great Measure',   essence: 'great possession stays great through modesty and clear judgment — curb what is bad, encourage what is good, and abundance does not corrupt' },
  15: { name: 'Modesty',                       essence: 'modesty is the one virtue that succeeds everywhere — it levels the ground, taking from where there is too much and adding where there is too little' },
  16: { name: 'Enthusiasm',                    essence: 'genuine enthusiasm moves people the way music does — work with the natural momentum of things and even great undertakings feel light' },
  17: { name: 'Following',                     essence: 'to be followed, first learn to follow — adapt to the demands of the time, and take real rest when the day\'s work ends' },
  18: { name: 'Work on What Has Been Spoiled', essence: 'what has decayed through neglect can be repaired — study how the spoiling happened, work deliberately, and guard the repair so it does not rot again' },
  19: { name: 'Approach',                      essence: 'influence is rising and people draw near — advance generously while the season favors you, remembering that every such season eventually turns' },
  20: { name: 'Contemplation',                 essence: 'there are moments for watching rather than acting — contemplate what is really happening, and let your considered attention itself become an example others trust' },
  21: { name: 'Biting Through',                essence: 'when an obstacle blocks union, bite through it — name the wrong clearly and apply the penalty cleanly, because tolerating obstruction only feeds it' },
  22: { name: 'Grace',                         essence: 'form and beauty adorn life but do not govern it — let grace polish the small things while substance decides the big ones' },
  23: { name: 'Splitting Apart',               essence: 'when things are collapsing from underneath, do not act — stay generous to what supports you, keep quiet, and wait for the turn' },
  24: { name: 'Return',                        essence: 'after every decline the light turns back on its own — welcome the small returning impulse gently and give the new beginning rest, not pressure' },
  25: { name: 'Innocence',                     essence: 'act from simple, unpremeditated correctness and heaven backs the movement — scheming for advantage is exactly what breaks this luck' },
  26: { name: 'The Taming Power of the Great', essence: 'great energy held under discipline becomes great capacity — study the wisdom of the past daily, and stored strength will carry major undertakings' },
  27: { name: 'Nourishment',                   essence: 'watch what you feed and what feeds you — in food, words, and company, nourishment is a practice of discrimination, not appetite' },
  28: { name: 'Preponderance of the Great',    essence: 'when the load bends the beam, extraordinary times call for extraordinary action — move decisively, gently, and without fear of standing alone' },
  29: { name: 'The Abysmal',                   essence: 'danger repeated is mastered the way water masters a gorge — stay true to your center, keep moving, and fill each hollow before advancing' },
  30: { name: 'The Clinging',                  essence: 'light must cling to something to burn — accept what you depend on, tend it with care, and brightness doubles instead of consuming itself' },
  31: { name: 'Influence',                     essence: 'real influence is mutual attraction, not persuasion — stay open and empty enough to be moved, and others open in return' },
  32: { name: 'Duration',                      essence: 'what endures is not what never changes but what renews itself in place — keep your direction constant while the forms keep moving' },
  33: { name: 'Retreat',                       essence: 'withdrawing at the right moment is strength, not defeat — step back in good order, keep small pressures at a firm distance, and preserve what matters' },
  34: { name: 'The Power of the Great',        essence: 'great strength holds itself back from any step that is not right — power stays great only while it moves with, not against, what is correct' },
  35: { name: 'Progress',                      essence: 'advancement comes like sunrise — steady, visible, dependent on a clear relationship with those above, and best used to brighten your own virtue' },
  36: { name: 'Darkening of the Light',        essence: 'when darkness rules, keep your light alive but veiled — outward yielding with inner clarity outlasts times when brilliance would be punished' },
  37: { name: 'The Family',                    essence: 'a household works when words have substance and conduct has consistency — everyone holding their own role well is what makes the whole warm' },
  38: { name: 'Opposition',                    essence: 'when views are estranged, don\'t force agreement — keep your individuality while looking for the small common ground, and work only on small things' },
  39: { name: 'Obstruction',                   essence: 'when the way is blocked, the move is not to push but to turn inward, correct yourself, and seek allies from a better direction' },
  40: { name: 'Deliverance',                   essence: 'when the tension breaks, resolve things quickly and then stop — forgive mistakes, drop grudges, and return to ordinary life without milking the drama' },
  41: { name: 'Decrease',                      essence: 'loss sincerely accepted becomes gain — simplify, curb anger and desire, and even two small bowls are enough when the offering is genuine' },
  42: { name: 'Increase',                      essence: 'in a season of increase, act on the big plans — and grow yourself the same way, copying what is good and correcting faults immediately' },
  43: { name: 'Breakthrough',                  essence: 'expose what is corrupt openly and by name, but win without weapons — resolution succeeds through truth declared, not through force or hatred' },
  44: { name: 'Coming to Meet',                essence: 'when a seductive influence arrives small, meet it early — what seems harmless now grows by welcome, so be courteous but do not commit' },
  45: { name: 'Gathering Together',            essence: 'when people mass together, gather them around something worth revering — and prepare for the frictions of the crowd before they arrive' },
  46: { name: 'Pushing Upward',                essence: 'growth here is vertical and unforced, like a tree in the earth — small consistent efforts accumulate into height nobody saw being built' },
  47: { name: 'Oppression',                    essence: 'in exhaustion, words stop working — do not argue your way out; stay cheerful at the core, conserve strength, and let conduct speak instead' },
  48: { name: 'The Well',                      essence: 'the town changes but the well stays — the human sources of nourishment are constant; keep yours dredged, and lower the rope all the way' },
  49: { name: 'Revolution',                    essence: 'real change is believed only after it visibly works — transform only what the time truly demands, and only when the old has plainly failed' },
  50: { name: 'The Cauldron',                  essence: 'transformation needs a vessel — give the new spirit a stable form, feed it properly, and refined culture turns raw material into nourishment' },
  51: { name: 'The Arousing',                  essence: 'shock frightens for a hundred miles, yet the practiced heart does not spill the ritual wine — let the jolt teach composure, then laughter returns' },
  52: { name: 'Keeping Still',                 essence: 'stillness is an action — rest when it is time to rest, move when it is time to move, and thoughts stop chasing themselves' },
  53: { name: 'Gradual Progress',              essence: 'lasting progress moves like a tree on a mountain — slow, rooted, in the proper order of steps, visible to all without hurrying' },
  54: { name: 'The Marrying Maiden',           essence: 'entering a situation on someone else\'s terms calls for tact and long views — know your standing, expect little formally, and keep the end in sight' },
  55: { name: 'Abundance',                     essence: 'at the peak, be the sun at noon — shine fully without mourning that noon passes, and settle pending matters while the light is greatest' },
  56: { name: 'The Wanderer',                  essence: 'in transit and on foreign ground, travel light — be courteous, modest in claims, careful in disputes, and do not settle where you cannot stay' },
  57: { name: 'The Gentle',                    essence: 'gentle, repeated influence penetrates where force cannot — like wind through everything, small consistent pressure toward a clear aim reshapes what walls resist' },
  58: { name: 'The Joyous',                    essence: 'joy that rests on inner steadiness spreads to everyone — like two lakes feeding each other, shared learning among friends keeps gladness from going stale' },
  59: { name: 'Dispersion',                    essence: 'when hardness and separation have set in, dissolve them — warmth, shared reverence, and generous scattering break up what egotism froze' },
  60: { name: 'Limitation',                    essence: 'limits give life form the way banks give a river force — set them clearly, but not so harshly that they gall and get abandoned' },
  61: { name: 'Inner Truth',                   essence: 'sincerity that starts in the center reaches even the hardest to reach — inner truth persuades where argument and position cannot' },
  62: { name: 'Preponderance of the Small',    essence: 'in small-scale times, keep to small things done exceptionally well — like the bird that should fly low, modesty and detail succeed where ambition fails' },
  63: { name: 'After Completion',              essence: 'just after everything is finally in order is the moment of greatest risk — keep tending details, because completion left alone slides toward disorder' },
  64: { name: 'Before Completion',             essence: 'on the verge of completion, care matters most — like the young fox nearly across the ice, one careless step wets the tail and undoes the crossing' },
};

/** "Hexagram 34 — The Power of the Great: great strength holds itself back from..." or null. */
export function hexagramLine(n) {
  const h = Number(n);
  if (!Number.isInteger(h) || h < 1 || h > 64) return null;
  const entry = HEXAGRAMS[h];
  if (!entry) return null;
  return `Hexagram ${h} — ${entry.name}: ${entry.essence}`;
}
