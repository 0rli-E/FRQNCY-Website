#!/usr/bin/env python3
"""One-shot: move the Golden Circle WHY/HOW/WHAT chapters above the existing
/about page (2026-06-11 blue-lens homepage pivot). The chapters left the home
page when it became the search-first perception hero; they now sit above the
existing vision/manifesto content on about.html.

- The self-contained Golden Circle CSS (`<style data-frqncy-v2>…</style>`) is
  extracted verbatim from index.html (which still carries it) and injected into
  about.html's head.
- The chapters HTML is embedded below (reveal classes stripped — about.html has
  no reveal observer, so they'd be inert). The D3 map + marquee are intentionally
  omitted; about links to /explore for the full map.
- Idempotent: re-running is a no-op.
"""
import re, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
index_html = (ROOT / "index.html").read_text(encoding="utf-8")
about_path = ROOT / "about.html"
about = about_path.read_text(encoding="utf-8")

if "data-frqncy-v2" in about or 'id="ch-why"' in about:
    print("about.html already contains the Golden Circle block — no-op.")
    sys.exit(0)

# 1. Extract the Golden Circle CSS block from index.html
m = re.search(r"<style data-frqncy-v2>.*?</style>", index_html, re.DOTALL)
if not m:
    print("ERROR: could not find <style data-frqncy-v2> in index.html", file=sys.stderr)
    sys.exit(1)
css_block = m.group(0)

CHAPTERS = """  <!-- ============================================================
       GOLDEN CIRCLE — moved here from the homepage 2026-06-11 when index
       became the search-first blue-lens perception hero. WHY / HOW / WHAT
       sit above the existing vision/manifesto content. Map + marquee omitted
       (see /explore); preserved in full in index-v2.html.
  ============================================================ -->
  <section id="ch-why" class="ch" aria-label="Why FRQNCY exists">
    <div class="ch-inner">
      <p class="ch-eyebrow">01 &middot; Why</p>
      <h2 class="ch-headline">
        A network of people,<br>building their dream life.
      </h2>
      <p class="ch-lede">
        You're here because the default scripts aren't quite working. The career you were told to want. The metrics you were told to chase. The version of yourself you were sold.
      </p>
      <p class="ch-lede">
        FRQNCY is for the moment after you notice that. When you know there's another way to live, but no one has handed you the map.
      </p>
      <p class="ch-lede">
        The belief is simple. A person who knows who they are &mdash; what their body wants, how their mind is shaped, what they're actually for &mdash; builds differently. They start work that doesn't burn them out. They love without performing. They make things that don't lie. A new earth begins there.
      </p>
      <p class="ch-lede" style="font-style:italic;color:#E0C06A;font-size:clamp(18px,1.6vw,22px);margin-top:8px;">
        We invite you to find yourself.
      </p>
      <div class="ch-cta" style="margin-top:36px;">
        <a href="/my-frqncy" class="quote-cta-btn">Tell us where you're at &#10022;</a>
      </div>
      <blockquote class="ch-quote">
        <p>"If you want to understand the universe, think in terms of energy, vibration and frequency."</p>
        <cite>&mdash; Nikola Tesla</cite>
      </blockquote>
    </div>
  </section>

  <section id="ch-how" class="ch" aria-label="How it works">
    <div class="ch-inner">
      <p class="ch-eyebrow">02 &middot; How</p>
      <h2 class="ch-headline">How it actually works.</h2>
      <p class="ch-lede">
        You spend about ten minutes telling a private companion where you are right now. It asks the questions a good friend or a good therapist would &mdash; what you keep returning to, what you keep avoiding, what your body says, what your chart says.
      </p>
      <p class="ch-lede">
        It builds a profile that lives with you. Then it walks you through three stages, at your pace. The whole arc is designed for the day you no longer need it.
      </p>
      <div class="how-stages">
        <article class="how-stage">
          <span class="how-num">01 &middot; Find &middot; in VBRTN</span>
          <h3>Find yourself</h3>
          <p><strong style="color:#E0C06A;font-weight:500;">You do:</strong> answer a short intake. Bring your Human Design chart, your Gene Keys, your story &mdash; or none of those, and just speak in your own words.</p>
          <p><strong style="color:#E0C06A;font-weight:500;">You leave with:</strong> a clearer picture of how you actually decide, what energises you, what drains you. Lenses you chose, held lightly. No diagnosis.</p>
        </article>
        <article class="how-stage">
          <span class="how-num">02 &middot; Create &middot; in NRG Social</span>
          <h3>Create from that</h3>
          <p><strong style="color:#E0C06A;font-weight:500;">You do:</strong> bring an idea you care about. A business, a piece of work, a relationship, a project you keep restarting.</p>
          <p><strong style="color:#E0C06A;font-weight:500;">You leave with:</strong> the idea shaped around who you now know yourself to be. Real coaches, collaborators, and a marketplace one click away.</p>
        </article>
        <article class="how-stage">
          <span class="how-num">03 &middot; Live &middot; out in the world</span>
          <h3>Step into the world</h3>
          <p><strong style="color:#E0C06A;font-weight:500;">You do:</strong> stop checking the app. Run the habits on your own. Show up in the community because you want to.</p>
          <p><strong style="color:#E0C06A;font-weight:500;">You leave with:</strong> a life you actually live. We meet you in physical spaces &mdash; townhalls, coworking, land. The whole point.</p>
        </article>
      </div>
      <p class="ch-lede" style="margin-top:8px;font-size:14px;color:#8A9AB8;border-top:1px solid rgba(255,255,255,0.06);padding-top:24px;">
        <strong style="color:#C4973A;letter-spacing:0.12em;text-transform:uppercase;font-size:11px;font-weight:500;">A few promises</strong><br>
        Your intake is private to you. Nothing is sold, ranked, or paywalled. The companion suggests, never prescribes. You can leave with your data at any time.
      </p>
      <div class="how-pillars-intro" style="border-top:1px solid rgba(255,255,255,0.06);padding-top:48px;margin-top:8px;">
        <p class="ch-eyebrow" style="margin-bottom:14px;">How the network keeps itself honest</p>
        <p style="font-family:'Jost',sans-serif;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.78);max-width:720px;margin:0 0 18px;">
          Underneath the user journey, FRQNCY operates on eight pillars: <strong style="color:rgba(255,255,255,0.92);font-weight:500;">Curate, Educate, Research, Broadcast, Sell, Fund, Build, Settle.</strong> No ads. No paid placement. No paywalled thesis. The free public layer is load-bearing.
        </p>
        <a href="/platform" style="font-family:'Jost',sans-serif;font-size:10.5px;letter-spacing:0.22em;text-transform:uppercase;color:#E0C06A;text-decoration:none;border-bottom:1px solid rgba(196,151,58,0.4);padding-bottom:3px;">See the platform in detail &#8599;</a>
      </div>
    </div>
  </section>

  <section id="ch-what" class="ch" aria-label="What FRQNCY is">
    <div class="ch-inner">
      <p class="ch-eyebrow">03 &middot; What</p>
      <h2 class="ch-headline">Three things that actually exist.</h2>
      <p class="ch-lede">
        Energy, vibration and frequency &mdash; Tesla's three. We gave each one a name, a place to live, and a job to do. All three ship today.
      </p>
      <div class="triangle-diagram">
        <div class="triangle-node">
          <span class="triangle-greek">Vibration &middot; the pocket app</span>
          <h3>VBRTN</h3>
          <p>Your private companion. Chat with it. Get your chart read back to you. Build habits that stick. Lives inside My FRQNCY.</p>
          <a href="/my-frqncy" class="triangle-link">Open VBRTN &#8599;</a>
        </div>
        <div class="triangle-node">
          <span class="triangle-greek">Energy &middot; the social layer</span>
          <h3>NRG&nbsp;Social</h3>
          <p>Where the people are. Post your work, find collaborators, book a real coach. The marketplace of the network.</p>
          <a href="/social/" class="triangle-link">Open NRG Social &#8599;</a>
        </div>
        <div class="triangle-node">
          <span class="triangle-greek">Frequency &middot; the network</span>
          <h3>FRQNCY</h3>
          <p>146 maps of every area of life. 766 vetted books, people, places, podcasts. The library of what's worth your attention.</p>
          <a href="/explore" class="triangle-link">Open the map &#8599;</a>
        </div>
      </div>
      <p class="what-subhead" style="margin-top:48px">
        <a href="/explore" style="font-family:'Jost',sans-serif;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#E0C06A;text-decoration:none;border-bottom:1px solid rgba(196,151,58,0.4);padding-bottom:3px;">Explore the full topic map &#8599;</a>
      </p>
    </div>
  </section>

"""

# 2. Inject CSS before the plausible analytics script in the head
PLAUSIBLE = '  <script defer data-domain="frqncy.network" src="https://plausible.io/js/script.js"></script>'
if PLAUSIBLE not in about:
    print("ERROR: plausible script anchor not found in about.html", file=sys.stderr)
    sys.exit(1)
about = about.replace(PLAUSIBLE, css_block + "\n" + PLAUSIBLE, 1)

# 3. Inject chapters right after <main id="main-content">
MAIN = '  <main id="main-content">'
if MAIN not in about:
    print("ERROR: <main id=\"main-content\"> anchor not found in about.html", file=sys.stderr)
    sys.exit(1)
about = about.replace(MAIN, MAIN + "\n" + CHAPTERS, 1)

about_path.write_text(about, encoding="utf-8")
print("OK: injected Golden Circle CSS + chapters into about.html")
print("  css block chars:", len(css_block))
