/**
 * Word Illuminator — shared widget
 *
 * Drop-in for the six hand-curated illumination pages
 * (/v2/word-illuminator/{discipline,sanctuary,frequency,practice,discernment,devotion}/).
 *
 * Adds a "Try another word" panel after the curated content. The reader can:
 *   - run the live worker against the page's own word (compare hand-written
 *     vs AI), or
 *   - illuminate a word the shelf hasn't reached yet.
 *
 * The hand-curated illumination above remains canonical. The AI version is
 * always framed as a working draft — experiment, not prescription, per
 * proposals/FRQNCY-VOICE-PLAYBOOK.md.
 *
 * Vanilla JS, no framework, no dependencies. Self-injects styles once.
 *
 * Usage at the bottom of an illumination page:
 *
 *   <script src="/assets/word-illuminator-widget.js" defer></script>
 *
 * The script auto-mounts. To control where it mounts, drop a placeholder:
 *
 *   <div data-word-illuminator-widget data-current-word="discipline"></div>
 *
 * If no placeholder is present, the widget appends itself to <main> (or to
 * the last <section> inside <main>).
 */
(function () {
  'use strict';

  // ── Config ───────────────────────────────────────────────────────
  var ENDPOINT = '/illuminator/word';
  var WORD_RE  = /^[A-Za-z0-9-]{1,30}$/;

  // Member detection — dynamically import the ES module gate, falls back to
  // false if the gate isn't available. Resolves once at boot; widgets that
  // mount later see the resolved value via memberPromise. Per ROADMAP-90D
  // Track 2 Week 2 + frqncy-member-gate.js voice constraints.
  var memberPromise = (function detectMember() {
    if (typeof window === 'undefined') return Promise.resolve(false);
    return import('/assets/frqncy-member-gate.js')
      .then(function (mod) {
        if (mod && typeof mod.isActiveMember === 'function') return mod.isActiveMember();
        return false;
      })
      .catch(function () {
        // Gate module missing OR import disallowed — default to non-member.
        // The "Deeper reading" toggle still gives anyone access to the
        // longer version (rate-limited). No wall.
        return false;
      });
  })();

  // ── Style injection (once) ───────────────────────────────────────
  var STYLE_ID = 'word-illuminator-widget-styles';
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = [
      '.wiw{margin-top:3.5rem;padding-top:2.5rem;border-top:1px solid var(--card-border,rgba(255,255,255,0.08))}',
      '.wiw-label{font-size:0.58rem;letter-spacing:0.32em;text-transform:uppercase;color:var(--gold,#C4973A);margin-bottom:0.75rem;display:block}',
      '.wiw h3{font-family:Cormorant,serif;font-size:1.6rem;font-weight:400;font-style:italic;color:#fff;margin-bottom:0.75rem}',
      '.wiw>p{font-size:0.85rem;color:var(--text-dim,#8FA8CC);line-height:1.6;margin-bottom:1.25rem}',
      '.wiw-form{display:flex;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.75rem}',
      '.wiw-form input{flex:1;min-width:200px;background:var(--navy,#0B1C3D);color:#fff;border:1px solid var(--card-border,rgba(255,255,255,0.08));border-radius:3px;padding:0.65rem 0.85rem;font-family:Cormorant,serif;font-style:italic;font-size:1.05rem;outline:none}',
      '.wiw-form input:focus{border-color:var(--gold,#C4973A)}',
      '.wiw-form button{background:transparent;color:var(--gold,#C4973A);border:1px solid var(--gold,#C4973A);border-radius:3px;padding:0.65rem 1.4rem;font-family:Jost,sans-serif;font-size:0.68rem;letter-spacing:0.18em;text-transform:uppercase;cursor:pointer;transition:all .2s}',
      '.wiw-form button:hover:not(:disabled){background:var(--gold,#C4973A);color:var(--navy,#0B1C3D)}',
      '.wiw-form button:disabled{opacity:0.4;cursor:not-allowed}',
      '.wiw-this{font-size:0.72rem;color:var(--text-dim,#8FA8CC);margin-bottom:0.5rem}',
      '.wiw-this a{color:var(--gold,#C4973A);cursor:pointer;border-bottom:1px dotted currentColor}',
      '.wiw-status{font-size:0.78rem;color:var(--text-dim,#8FA8CC);margin-top:0.25rem;min-height:1.2em}',
      '.wiw-status.error{color:#E89B6B}',
      '.wiw-out{display:none;margin-top:2rem;padding:1.5rem;border:1px dashed var(--card-border,rgba(255,255,255,0.08));border-radius:4px;background:rgba(255,255,255,0.02)}',
      '.wiw-out.visible{display:block}',
      '.wiw-out-tag{font-size:0.6rem;letter-spacing:0.32em;text-transform:uppercase;color:var(--gold,#C4973A);opacity:0.85;margin-bottom:1rem;display:block}',
      '.wiw-out h2{font-family:Cormorant,serif;font-size:clamp(1.8rem,4vw,2.4rem);font-weight:300;font-style:italic;color:#fff;margin:0 0 1.25rem;text-align:center}',
      '.wiw-out h4{font-family:Cormorant,serif;font-size:1rem;font-weight:400;color:var(--gold,#C4973A);font-style:italic;margin:1.25rem 0 0.5rem}',
      '.wiw-out h4:first-of-type{margin-top:0}',
      '.wiw-out ol{padding-left:1.4rem;font-size:0.88rem;color:var(--text,#C8D8F0);line-height:1.65;margin-bottom:0.5rem}',
      '.wiw-out ol li{margin-bottom:0.5rem}',
      '.wiw-ex{font-family:Cormorant,serif;font-style:italic;color:var(--text-dim,#8FA8CC);font-size:0.92rem;display:block;margin-top:0.15rem}',
      '.wiw-ex::before{content:"— ";color:var(--gold,#C4973A);opacity:0.6;font-style:normal}',
      '.wiw-roots{white-space:pre-line;font-size:0.86rem;color:var(--text,#C8D8F0);margin-bottom:0.75rem;line-height:1.65}',
      '.wiw-evo{font-size:0.86rem;color:var(--text,#C8D8F0);line-height:1.65;margin-bottom:0.75rem}',
      '.wiw-essence{padding:0.85rem 1.1rem;background:var(--gold-soft,rgba(196,151,58,0.14));border-left:2px solid var(--gold,#C4973A);font-family:Cormorant,serif;font-style:italic;color:#fff;font-size:0.98rem;line-height:1.55;border-radius:0 4px 4px 0}',
      '.wiw-essence-label{font-family:Jost,sans-serif;font-style:normal;font-size:0.55rem;letter-spacing:0.32em;text-transform:uppercase;color:var(--gold,#C4973A);margin-bottom:0.4rem;display:block}',
      '.wiw-syn{font-size:0.84rem;color:var(--text,#C8D8F0);margin-bottom:0.4rem}',
      '.wiw-syn strong{font-size:0.6rem;letter-spacing:0.18em;text-transform:uppercase;color:var(--gold,#C4973A);font-weight:400;margin-right:0.5rem}',
      '.wiw-deriv{margin-bottom:1rem;padding:0.75rem 0;border-bottom:1px solid rgba(255,255,255,0.04)}',
      '.wiw-deriv:last-child{border-bottom:none}',
      '.wiw-deriv-head{font-family:Cormorant,serif;font-style:italic;color:#fff;font-size:1.1rem}',
      '.wiw-deriv-head .pos{font-family:Jost,sans-serif;font-style:normal;font-size:0.62rem;letter-spacing:0.1em;text-transform:uppercase;color:var(--text-dim,#8FA8CC);margin-left:0.5rem}',
      '.wiw-deriv-row{font-size:0.82rem;color:var(--text,#C8D8F0);margin-top:0.35rem;line-height:1.55}',
      '.wiw-deriv-row strong{color:var(--gold,#C4973A);font-weight:400;font-size:0.6rem;letter-spacing:0.16em;text-transform:uppercase;margin-right:0.4rem}',
      '.wiw-prose{font-family:Cormorant,serif;font-size:1.04rem;color:var(--cream,#F5EBD8);line-height:1.65;margin-bottom:0.85rem}',
      '.wiw-question{padding:0.85rem 1.1rem;background:rgba(255,255,255,0.03);border:1px solid var(--card-border,rgba(255,255,255,0.08));border-radius:4px;font-family:Cormorant,serif;font-style:italic;color:#fff;font-size:1rem;line-height:1.5}',
      // Deeper-reading opt-in toggle for non-members
      '.wiw-deep{display:flex;align-items:center;gap:0.5rem;font-size:0.74rem;color:var(--text-dim,#8FA8CC);margin:0.25rem 0 0.5rem;cursor:pointer;line-height:1.4}',
      '.wiw-deep input[type=checkbox]{accent-color:var(--gold,#C4973A);cursor:pointer}',
      // member_deepening section — additional contemplative block
      '.wiw-md-section{margin-top:2rem;padding-top:1.5rem;border-top:1px solid rgba(196,151,58,0.2)}',
      '.wiw-md-h{font-family:Cormorant,serif;font-size:1.1rem !important;font-style:italic;color:var(--gold,#C4973A) !important;margin:0 0 1rem !important}',
      '.wiw-md-essay{font-family:Cormorant,serif;font-size:1.05rem;color:var(--cream,#F5EBD8);line-height:1.75;margin-bottom:1rem}',
      '.wiw-md-essay:last-of-type{margin-bottom:1.25rem}',
      '.wiw-md-practice{padding:1rem 1.25rem;background:rgba(196,151,58,0.06);border-left:2px solid var(--gold,#C4973A);font-family:Cormorant,serif;color:#fff;font-size:0.98rem;line-height:1.6;border-radius:0 4px 4px 0;margin-bottom:1rem}',
      '.wiw-md-practice-label{display:block;font-family:Jost,sans-serif;font-style:normal;font-size:0.55rem;letter-spacing:0.32em;text-transform:uppercase;color:var(--gold,#C4973A);margin-bottom:0.4rem}',
      '.wiw-md-refs{font-size:0.78rem;color:var(--text-dim,#8FA8CC);padding-top:0.5rem}',
      '.wiw-md-refs-label{display:block;font-family:Jost,sans-serif;font-size:0.55rem;letter-spacing:0.28em;text-transform:uppercase;color:var(--gold,#C4973A);margin-bottom:0.4rem}',
      '.wiw-md-refs a{color:var(--gold,#C4973A);text-decoration:none;border-bottom:1px dotted currentColor;font-style:italic;font-family:Cormorant,serif;font-size:0.95rem}',
      '.wiw-md-refs a:hover{border-bottom-style:solid}',
      '.wiw-question-label{font-family:Jost,sans-serif;font-style:normal;font-size:0.55rem;letter-spacing:0.32em;text-transform:uppercase;color:var(--gold,#C4973A);margin-bottom:0.4rem;display:block}',
      '.wiw-meta{font-size:0.72rem;color:var(--text-dim,#8FA8CC);text-align:center;margin-top:1.25rem;font-style:italic;opacity:0.85}'
    ].join('\n');
    document.head.appendChild(s);
  }

  // ── DOM helpers ──────────────────────────────────────────────────
  function esc(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // Detect the page's word from a few likely sources, in order:
  //   1. data-current-word attribute on the placeholder
  //   2. <body data-illuminator-word>
  //   3. last segment of /v2/word-illuminator/<word>/
  // Returns null if undetected (widget still works for arbitrary input).
  function detectCurrentWord(host) {
    var fromHost = host && host.getAttribute && host.getAttribute('data-current-word');
    if (fromHost) return fromHost.toLowerCase();
    var fromBody = document.body && document.body.getAttribute('data-illuminator-word');
    if (fromBody) return fromBody.toLowerCase();
    var m = location.pathname.match(/\/v2\/word-illuminator\/([A-Za-z0-9-]+)\/?/);
    if (m && m[1] && m[1] !== 'word-illuminator') return m[1].toLowerCase();
    return null;
  }

  // ── Renderer: JSON → DOM (locked 5-section template) ────────────
  function render(out, d) {
    var defs = (d.definitions || []).map(function (x, i) {
      return '<li>' + esc(x.sense)
        + (x.example ? '<span class="wiw-ex">' + esc(x.example) + '</span>' : '')
        + '</li>';
    }).join('');

    var ety = d.etymology || {};
    var sa  = d.synonyms_antonyms || {};
    var derivs = (d.derivatives || []).map(function (x) {
      var syn = (x.synonyms || []).length
        ? '<div class="wiw-deriv-row"><strong>Syn</strong>' + x.synonyms.map(esc).join(', ') + '</div>' : '';
      var ant = (x.antonyms || []).length
        ? '<div class="wiw-deriv-row"><strong>Ant</strong>' + x.antonyms.map(esc).join(', ') + '</div>' : '';
      return '<div class="wiw-deriv">'
        + '<div class="wiw-deriv-head">' + esc(x.word)
        +   (x.part_of_speech ? '<span class="pos">' + esc(x.part_of_speech) + '</span>' : '')
        + '</div>'
        + (x.definition ? '<div class="wiw-deriv-row"><strong>Def</strong>' + esc(x.definition) + '</div>' : '')
        + (x.example ? '<div class="wiw-deriv-row"><strong>Ex</strong><em>' + esc(x.example) + '</em></div>' : '')
        + syn + ant
        + '</div>';
    }).join('');

    var di = d.deeper_illumination || {};

    // Optional member_deepening section (present when ?member=1 was sent
    // and the model returned the additional structure). Renders as a
    // distinct visual block beneath the standard locked schema so it
    // never feels like a wall — the base illumination above is complete
    // on its own; this is additional contemplation for those who want it.
    var md = d.member_deepening;
    var mdHtml = '';
    if (md && (md.contemplative_essay || md.practice_invitation || (md.cross_references && md.cross_references.length))) {
      var essayParas = (md.contemplative_essay || '').split(/\n\n+/).map(function (p) {
        return p.trim() ? '<p class="wiw-md-essay">' + esc(p.trim()) + '</p>' : '';
      }).join('');
      var practice = md.practice_invitation
        ? '<div class="wiw-md-practice"><span class="wiw-md-practice-label">A small experiment</span>' + esc(md.practice_invitation) + '</div>'
        : '';
      var crossRefs = (md.cross_references || []).filter(Boolean);
      var refs = crossRefs.length
        ? '<div class="wiw-md-refs"><span class="wiw-md-refs-label">Related illuminations</span>'
            + crossRefs.map(function (slug) {
                return '<a href="/v2/word-illuminator/' + encodeURIComponent(slug) + '/">' + esc(slug) + '</a>';
              }).join(' · ')
            + '</div>'
        : '';
      mdHtml =
        '<div class="wiw-md-section">'
        +   '<h4 class="wiw-md-h">Sit with this longer</h4>'
        +   essayParas
        +   practice
        +   refs
        + '</div>';
    }

    out.innerHTML =
      '<span class="wiw-out-tag">AI illumination · working draft</span>'
      + '<h2><em>' + esc(d.word) + '</em></h2>'
      + '<h4>Definitions</h4>'
      + (defs ? '<ol>' + defs + '</ol>' : '')
      + '<h4>Etymology</h4>'
      + (ety.roots ? '<div class="wiw-roots">' + esc(ety.roots) + '</div>' : '')
      + (ety.evolution ? '<p class="wiw-evo">' + esc(ety.evolution) + '</p>' : '')
      + (ety.earliest_essence
          ? '<div class="wiw-essence"><span class="wiw-essence-label">Earliest essence</span>' + esc(ety.earliest_essence) + '</div>'
          : '')
      + '<h4>Synonyms &amp; antonyms</h4>'
      + '<div class="wiw-syn"><strong>Synonyms</strong>' + (sa.synonyms || []).map(esc).join(', ') + '</div>'
      + '<div class="wiw-syn"><strong>Antonyms</strong>' + (sa.antonyms || []).map(esc).join(', ') + '</div>'
      + '<h4>Derivatives</h4>'
      + (derivs || '<p class="wiw-evo">—</p>')
      + '<h4>Deeper illumination</h4>'
      + (di.prose ? '<p class="wiw-prose">' + esc(di.prose) + '</p>' : '')
      + (di.reflective_question
          ? '<div class="wiw-question"><span class="wiw-question-label">A question to reflect on</span>' + esc(di.reflective_question) + '</div>'
          : '')
      + mdHtml
      + '<div class="wiw-meta">A working illumination — generated, not curated. The page above is the canonical reference.</div>';
    out.classList.add('visible');
  }

  // ── Mount ────────────────────────────────────────────────────────
  function mount(host) {
    if (host.dataset.wiwMounted === '1') return;
    host.dataset.wiwMounted = '1';

    var currentWord = detectCurrentWord(host);
    var headline = currentWord
      ? 'Illuminate again — or try a different word'
      : 'Try the live Illuminator';
    var blurb = currentWord
      ? 'The illumination above is hand-curated. Run the same word through the live worker for comparison, or try a word the shelf hasn’t reached yet. The curated version remains canonical — the AI version is a working draft, an experiment in synthesis.'
      : 'Type a word. Get a working illumination back. Letters, numbers, and hyphens only — up to 30 characters.';

    host.classList.add('wiw');
    host.innerHTML =
      '<span class="wiw-label">Illuminate</span>'
      + '<h3>' + esc(headline) + '</h3>'
      + '<p>' + blurb + '</p>'
      + (currentWord
          ? '<div class="wiw-this">Illuminate <a data-wiw-self>' + esc(currentWord) + '</a> again, or:</div>'
          : '')
      + '<form class="wiw-form" autocomplete="off">'
      +   '<input type="text" placeholder="e.g. presence, integrity, witness" maxlength="30" pattern="[A-Za-z0-9-]+" required aria-label="Word to illuminate">'
      +   '<button type="submit">Illuminate</button>'
      + '</form>'
      // Deeper-reading toggle. Hidden until member detection resolves so
      // members never see the toggle (the deeper version is the default
      // for them — no friction). Non-members see it so they can opt in.
      // Voice contract: "deeper reading" not "exclusive content"; this is
      // a default for members, available to anyone willing to wait.
      + '<label class="wiw-deep" style="display:none;">'
      +   '<input type="checkbox" data-wiw-deep>'
      +   '<span>Deeper reading — adds a contemplative essay + small practice. Slower.</span>'
      + '</label>'
      + '<div class="wiw-status" aria-live="polite"></div>'
      + '<div class="wiw-out" aria-live="polite"></div>';

    var form     = host.querySelector('form');
    var input    = host.querySelector('input');
    var btn      = host.querySelector('button');
    var status   = host.querySelector('.wiw-status');
    var out      = host.querySelector('.wiw-out');
    var selfLink = host.querySelector('[data-wiw-self]');
    var deepLbl  = host.querySelector('.wiw-deep');
    var deepBox  = host.querySelector('[data-wiw-deep]');

    // Resolve member status once. Members get deep auto-on (no toggle
    // shown). Non-members get the toggle, default-off.
    memberPromise.then(function (isMember) {
      if (isMember) {
        // Member: silently set the flag. No UI surface — the deeper view
        // is just what they get.
        host.dataset.wiwMember = '1';
      } else {
        // Non-member: reveal the opt-in toggle.
        if (deepLbl) deepLbl.style.display = '';
      }
    });

    if (selfLink && currentWord) {
      selfLink.addEventListener('click', function () {
        input.value = currentWord;
        form.dispatchEvent(new Event('submit', { cancelable: true }));
      });
    }

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var word = (input.value || '').trim().toLowerCase();
      status.classList.remove('error');
      if (!WORD_RE.test(word)) {
        status.textContent = 'Letters, numbers, and hyphens only — up to 30 characters.';
        status.classList.add('error');
        return;
      }

      // Decide whether to request the deeper version. Members: always.
      // Non-members: only if they ticked the toggle.
      var wantDeep = host.dataset.wiwMember === '1' || (deepBox && deepBox.checked);
      var qs = '?word=' + encodeURIComponent(word) + (wantDeep ? '&member=1' : '');

      status.textContent = wantDeep ? 'Illuminating — deeper reading takes a little longer…' : 'Illuminating…';
      btn.disabled = true;
      out.classList.remove('visible');

      try {
        var r = await fetch(ENDPOINT + qs);
        var j = await r.json();
        if (!r.ok) throw new Error(j && j.error ? j.error : 'Request failed');
        status.textContent = '';
        render(out, j);
        out.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch (err) {
        status.classList.add('error');
        status.textContent = (err && err.message) || 'The Illuminator is resting — try again in a moment.';
      } finally {
        btn.disabled = false;
      }
    });
  }

  // ── Auto-mount: explicit placeholder, else end of <main> ────────
  function init() {
    injectStyles();
    var hosts = document.querySelectorAll('[data-word-illuminator-widget]');
    if (hosts.length) {
      hosts.forEach(mount);
      return;
    }
    // Fallback: append a host inside <main> (or after the last <section>).
    var main = document.querySelector('main');
    if (!main) return;
    var host = document.createElement('div');
    host.setAttribute('data-word-illuminator-widget', '');
    var lastSection = main.querySelector('section:last-of-type');
    if (lastSection) lastSection.appendChild(host);
    else main.appendChild(host);
    mount(host);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
