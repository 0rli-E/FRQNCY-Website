/**
 * FRQNCY Human Design AI Reading — Cloudflare Worker
 *
 * Deploy: wrangler deploy --name frqncy-hd-reading
 *
 * Uses Cloudflare Workers AI (runs on Cloudflare's edge, no external API key needed)
 * Model: @cf/qwen/qwen1.5-14b-chat-awq (token-efficient, fast, good at structured explanation)
 *
 * Alternative models (swap in env.AI.run call):
 *   @cf/meta/llama-3.1-8b-instruct    — Meta, very fast
 *   @cf/qwen/qwen1.5-7b-chat-awq      — Smaller Qwen, cheaper
 *   @hf/thebloke/mistral-7b-instruct   — Mistral, balanced
 *
 * Setup:
 *   1. wrangler init frqncy-hd-reading
 *   2. Copy this file as src/index.js
 *   3. Add to wrangler.toml:
 *        [ai]
 *        binding = "AI"
 *   4. wrangler deploy
 *   5. Update WORKER_URL in chart.html
 */

// ── Compressed HD reference (saves tokens vs. sending full system each time) ──
const HD_TYPES = {
  manifestor: {
    name: 'Manifestor',
    strategy: 'Inform before you act',
    notSelf: 'Anger',
    signature: 'Peace',
    aura: 'Closed and repelling — protective, initiating',
    description: 'Manifestors are the initiators. They have a closed, protective aura and are designed to act independently. Their life theme is impact. When operating correctly they inform others before acting, which creates peace. When not, they experience anger from being controlled or slowed down.'
  },
  generator: {
    name: 'Generator',
    strategy: 'Wait to respond',
    notSelf: 'Frustration',
    signature: 'Satisfaction',
    aura: 'Open and enveloping — drawing life to them',
    description: 'Generators are the life force of the planet. They have an open, enveloping aura that draws opportunities to them. Designed to wait for something to respond to — not initiate. When responding to what lights up their sacral, they find deep satisfaction. When initiating or doing what doesn\'t excite them, they hit frustration.'
  },
  manifesting_generator: {
    name: 'Manifesting Generator',
    strategy: 'Wait to respond, then inform before acting',
    notSelf: 'Frustration and anger',
    signature: 'Satisfaction and peace',
    aura: 'Open and enveloping — fast-moving, multi-passionate',
    description: 'Manifesting Generators combine the sacral life force of a Generator with the initiating motor of a Manifestor. They\'re designed to respond first, then move fast. Non-linear, multi-passionate, they often skip steps and circle back. Their path looks messy but is deeply efficient. They need to respond AND inform.'
  },
  projector: {
    name: 'Projector',
    strategy: 'Wait for the invitation',
    notSelf: 'Bitterness',
    signature: 'Success',
    aura: 'Focused and absorbing — penetrating into others',
    description: 'Projectors are the guides. They have a focused, penetrating aura that sees deeply into others. Designed to wait for recognition and invitation before sharing their gifts — especially for big life decisions (career, love, where to live). When recognised, they experience success. Without invitation, bitterness.'
  },
  reflector: {
    name: 'Reflector',
    strategy: 'Wait a full lunar cycle (28 days) for major decisions',
    notSelf: 'Disappointment',
    signature: 'Surprise',
    aura: 'Resistant and sampling — reflecting the environment',
    description: 'Reflectors are the rarest type (~1%). All nine centers are open, making them deeply sensitive mirrors of their environment. Designed to wait a full lunar cycle before major decisions, letting the moon activate different gates. Their signature is surprise — at how life unfolds when they honour their timing.'
  }
};

const AUTHORITIES = {
  emotional: 'Emotional (Solar Plexus) — Never make decisions in the moment. Wait through the full emotional wave. Clarity comes over time, never in the peak or valley of emotion.',
  sacral: 'Sacral — Listen to your gut response: the uh-huh (yes) or unh-uh (no). It\'s a bodily sound, not a mental decision. Ask yourself yes/no questions.',
  splenic: 'Splenic — Your intuition speaks once, quietly, in the moment. It\'s a survival instinct — instant knowing. If you miss it, it doesn\'t repeat.',
  ego: 'Ego/Heart — Your willpower and commitment guide decisions. If your heart isn\'t in it, don\'t force it. You need to ask: "Do I have the will for this?"',
  self: 'Self-Projected (G Center) — Speak your truth out loud to trusted people. Hear yourself talk — your direction becomes clear through your own voice, not your mind.',
  mental: 'Mental/Environment — You need to talk things through with others and be in the right environment. The answer comes through your surroundings, not inner authority.',
  lunar: 'Lunar (Reflectors only) — Wait through a complete 28-day lunar cycle before major decisions. Each day brings a different perspective as the moon transits your open centers.'
};

// ── Worker handler ──────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': 'https://frqncy.network',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        }
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const { type, authority, profile, definedCenters, gates, channels } = await request.json();

      // Look up compressed reference for this type
      const typeKey = type?.toLowerCase().replace(/[\s-]/g, '_') || 'generator';
      const typeRef = HD_TYPES[typeKey] || HD_TYPES.generator;
      const authRef = AUTHORITIES[authority?.toLowerCase()] || '';

      // Build token-efficient prompt (~800 tokens input)
      const systemPrompt = `You are the FRQNCY Human Design guide. You explain charts with warmth, precision, and practical wisdom. Keep explanations grounded — no fluff. Use "you" language. Be encouraging but honest. Format with clear sections. Keep total response under 600 words.`;

      const userPrompt = `Explain this person's Human Design chart:

Type: ${typeRef.name}
Strategy: ${typeRef.strategy}
Signature: ${typeRef.signature}
Not-Self Theme: ${typeRef.notSelf}
Aura: ${typeRef.aura}
Authority: ${authRef || authority || 'Unknown'}
Profile: ${profile || 'Unknown'}
${definedCenters ? 'Defined Centers: ' + definedCenters.join(', ') : ''}
${gates ? 'Key Gates: ' + gates.slice(0, 8).join(', ') : ''}
${channels ? 'Active Channels: ' + channels.join(', ') : ''}

Give a personalised reading covering:
1. What their Type means for how they move through life
2. How their Strategy and Authority work together for decisions
3. What their Profile says about their life theme
4. One practical insight they can apply today

Type context: ${typeRef.description}`;

      // Call Workers AI
      const response = await env.AI.run('@cf/qwen/qwen3-30b-a3b-fp8', {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 800,
        temperature: 0.7,
      });

      return new Response(JSON.stringify({
        reading: response.response,
        type: typeRef.name,
        strategy: typeRef.strategy,
        authority: authRef || authority
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': 'https://frqncy.network',
        }
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': 'https://frqncy.network',
        }
      });
    }
  }
};
