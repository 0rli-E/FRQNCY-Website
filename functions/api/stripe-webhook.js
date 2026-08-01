/**
 * /api/stripe-webhook — Stripe → Supabase membership sync
 * Cloudflare Pages Function
 *
 * Configure in Stripe Dashboard → Developers → Webhooks:
 *   Endpoint:  https://frqncy.network/api/stripe-webhook
 *   Events:    checkout.session.completed,
 *              customer.subscription.updated,
 *              customer.subscription.deleted
 *
 * Required env vars:
 *   STRIPE_WEBHOOK_SECRET           — whsec_... (the signing secret for THIS endpoint)
 *   PUBLIC_SUPABASE_URL             — same as elsewhere
 *   SUPABASE_SERVICE_ROLE_KEY       — bypasses RLS so we can upsert memberships
 *
 * Handlers:
 *   checkout.session.completed
 *     → upsert into `memberships` with stripe_customer_id + stripe_subscription_id;
 *       if a matching ref_signups row exists for client_reference_id, flip
 *       became_member = true.
 *
 *   customer.subscription.updated
 *     → update status + current_period_end on the membership row keyed by
 *       stripe_subscription_id.
 *
 *   customer.subscription.deleted
 *     → set status = 'canceled' on the matching membership row.
 *
 * Stripe signature verification is done with the raw request body (no SDK):
 * the v1 scheme is HMAC-SHA256 of "{timestamp}.{body}" using the webhook
 * secret, compared in constant time to the v1 signature in the
 * Stripe-Signature header.
 */

const TOLERANCE_SEC = 300; // reject events older than 5 minutes (replay defence)

function rawBytesToHex(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i++) {
    s += bytes[i].toString(16).padStart(2, '0');
  }
  return s;
}

function timingSafeEqualHex(a, b) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

async function verifyStripeSignature(rawBody, sigHeader, secret) {
  if (!sigHeader || !secret) return { ok: false, reason: 'missing-signature-or-secret' };
  // Header looks like: t=1614266432,v1=hex,v1=hex,v0=hex
  const parts = Object.fromEntries(
    sigHeader.split(',').map(p => {
      const i = p.indexOf('=');
      return [p.slice(0, i).trim(), p.slice(i + 1).trim()];
    }).filter(([k, v]) => k && v)
  );
  const t = parts.t;
  const v1 = parts.v1;
  if (!t || !v1) return { ok: false, reason: 'no-t-or-v1' };

  // Tolerance check
  const ts = parseInt(t, 10);
  if (!Number.isFinite(ts)) return { ok: false, reason: 'bad-timestamp' };
  const skew = Math.abs(Math.floor(Date.now() / 1000) - ts);
  if (skew > TOLERANCE_SEC) return { ok: false, reason: 'timestamp-out-of-tolerance' };

  // HMAC SHA256 over `${t}.${body}` using the secret
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(`${t}.${rawBody}`));
  const computed = rawBytesToHex(new Uint8Array(sigBuf));
  if (!timingSafeEqualHex(computed, v1)) return { ok: false, reason: 'signature-mismatch' };
  return { ok: true };
}

async function supabaseRequest(env, path, init = {}) {
  const url = `${env.PUBLIC_SUPABASE_URL}/rest/v1/${path}`;
  const headers = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'content-type': 'application/json',
    ...(init.headers || {}),
  };
  const resp = await fetch(url, { ...init, headers });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Supabase ${resp.status} on ${path}: ${text}`);
  }
  // PATCH/POST may have no body when Prefer: return=minimal
  const ct = resp.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    try { return await resp.json(); } catch { return null; }
  }
  return null;
}

async function handleCheckoutCompleted(env, evt) {
  const s = evt.data.object;

  // ── Goods order (the "additional price on top" reseller flow) ──
  // Guest-friendly: there is no FRQNCY user_id, so this MUST run before the
  // user_id guard below. Records the paid order + shipping address so it can
  // be fulfilled (forwarded to the supplier / dropshipped). See SELL-GOODS.md.
  if (s.metadata?.kind === 'good') {
    const shipping = s.shipping_details || s.collected_information?.shipping_details || null;
    await supabaseRequest(env, 'goods_orders?on_conflict=stripe_session_id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify([{
        stripe_session_id: s.id || null,
        stripe_payment_intent: s.payment_intent || null,
        good_id: s.metadata?.good_id || null,
        good_name: s.metadata?.good_name || null,
        quantity: parseInt(s.metadata?.quantity, 10) || 1,
        unit_amount_cents: parseInt(s.metadata?.unit_amount, 10) || null,
        amount_total_cents: s.amount_total ?? null,
        currency: s.currency || 'usd',
        email: s.customer_details?.email || null,
        ship_name: shipping?.name || s.customer_details?.name || null,
        ship_address: shipping?.address || null,
        status: 'paid',
      }]),
    });
    return;
  }

  // ── Donation ──
  // A gift buys no entitlement, so there is nothing to grant and no row to
  // write: Stripe itself is the ledger for v1 (Dashboard → Payments, filtered
  // on metadata.kind = donation). This branch exists so a donation cannot fall
  // through to the membership upsert below, which would either be dropped by
  // the user_id guard with a misleading warning or, worse, mint a membership
  // nobody paid for. When donations are worth reporting on-site, give them
  // their own table rather than overloading one of these.
  if (s.metadata?.kind === 'donation') {
    console.log(
      `donation received: ${s.amount_total ?? '?'} ${s.currency || 'usd'} session=${s.id || '?'}`,
    );
    return;
  }

  const userId = s.client_reference_id || s.metadata?.user_id;
  if (!userId) {
    console.warn('checkout.session.completed without client_reference_id — ignoring');
    return;
  }

  // Branch on kind. Default = membership (existing path). kind=course = one-time
  // payment for a single course; recorded in course_purchases (migration 014).
  const kind = s.metadata?.kind || (s.mode === 'payment' ? 'course' : 'membership');

  if (kind === 'course') {
    const courseSlug = s.metadata?.course_slug;
    if (!courseSlug) {
      console.warn('course checkout completed without course_slug — ignoring');
      return;
    }
    await supabaseRequest(env, 'course_purchases?on_conflict=user_id,course_slug', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify([{
        user_id: userId,
        course_slug: courseSlug,
        stripe_session_id: s.id || null,
        stripe_payment_intent: s.payment_intent || null,
        amount_cents: s.amount_total ?? null,
        currency: s.currency || 'usd',
        status: 'paid',
      }]),
    });
    return;
  }

  // ── Membership path (subscription) ──
  const customerId = s.customer || null;
  const subscriptionId = s.subscription || null;
  const tier = s.metadata?.tier || 'network_member';

  // Upsert membership row (on_conflict on user_id, since user_id is UNIQUE)
  await supabaseRequest(env, 'memberships?on_conflict=user_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify([{
      user_id: userId,
      tier: tier === 'annual' || tier === 'monthly' ? 'network_member' : tier,
      status: 'active',
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      // current_period_end will be set by the subscription.updated event Stripe
      // fires immediately after; leave null here to avoid a stale value.
      updated_at: new Date().toISOString(),
    }]),
  });

  // If a ref_signup row exists for this user, flip became_member = true.
  // Service role bypasses RLS for this update.
  try {
    await supabaseRequest(
      env,
      `ref_signups?referred_id=eq.${encodeURIComponent(userId)}&became_member=eq.false`,
      {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ became_member: true }),
      },
    );
  } catch (err) {
    // Non-fatal — attribution log update should never fail the whole webhook.
    console.warn('ref_signups update skipped:', err.message);
  }
}

async function handleSubscriptionUpdated(env, evt) {
  const sub = evt.data.object;
  const subscriptionId = sub.id;
  const status = sub.status; // active, past_due, canceled, trialing, etc.
  // Stripe gives current_period_end as a unix seconds int.
  const cpe = sub.current_period_end
    ? new Date(sub.current_period_end * 1000).toISOString()
    : null;

  // Constrain to the four enum values we accept; map anything else to past_due
  // for visibility (incomplete, incomplete_expired, unpaid).
  const allowed = ['active', 'past_due', 'canceled', 'trialing'];
  const mappedStatus = allowed.includes(status) ? status : 'past_due';

  await supabaseRequest(
    env,
    `memberships?stripe_subscription_id=eq.${encodeURIComponent(subscriptionId)}`,
    {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        status: mappedStatus,
        current_period_end: cpe,
        updated_at: new Date().toISOString(),
      }),
    },
  );
}

async function handleSubscriptionDeleted(env, evt) {
  const sub = evt.data.object;
  const subscriptionId = sub.id;
  await supabaseRequest(
    env,
    `memberships?stripe_subscription_id=eq.${encodeURIComponent(subscriptionId)}`,
    {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        status: 'canceled',
        updated_at: new Date().toISOString(),
      }),
    },
  );
}

export async function onRequestPost({ request, env }) {
  // Fail-loud config check
  if (!env.STRIPE_WEBHOOK_SECRET) {
    return new Response(
      JSON.stringify({ error: 'Membership not configured. STRIPE_WEBHOOK_SECRET missing.' }),
      { status: 503, headers: { 'content-type': 'application/json' } },
    );
  }
  if (!env.PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(
      JSON.stringify({ error: 'Supabase service-role config missing.' }),
      { status: 503, headers: { 'content-type': 'application/json' } },
    );
  }

  const sigHeader = request.headers.get('stripe-signature') || '';
  const rawBody = await request.text();

  const verify = await verifyStripeSignature(rawBody, sigHeader, env.STRIPE_WEBHOOK_SECRET);
  if (!verify.ok) {
    console.warn('Stripe signature verification failed:', verify.reason);
    return new Response('Invalid signature', { status: 400 });
  }

  let evt;
  try { evt = JSON.parse(rawBody); }
  catch { return new Response('Invalid JSON', { status: 400 }); }

  try {
    switch (evt.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(env, evt);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(env, evt);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(env, evt);
        break;
      default:
        // Acknowledge unknown event types to keep Stripe quiet.
        break;
    }
  } catch (err) {
    console.error(`Webhook handler error for ${evt.type}:`, err);
    // Return 500 so Stripe retries.
    return new Response('Handler error', { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

export async function onRequest(context) {
  if (context.request.method === 'POST') return onRequestPost(context);
  return new Response('Method not allowed', { status: 405 });
}
