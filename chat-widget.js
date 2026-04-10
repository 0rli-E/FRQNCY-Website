/**
 * FRQNCY Chat Widget
 * Self-contained — no external dependencies
 * Inject via: <script src="/chat-widget.js" defer></script>
 */

(function () {
  'use strict';

  // ── CONFIG ───────────────────────────────────────────────────────
  const API_ENDPOINT  = '/api/chat';
  const BOT_NAME      = 'FRQNCY Navigator';
  const BOT_TAGLINE   = 'Your guide to conscious living';
  const WELCOME       = `Welcome to **FRQNCY**. I know every topic, domain, and curated resource on this site.\n\nAsk me anything — a topic you're curious about, a book recommendation, or where to start.`;
  const SUGGESTIONS   = [
    'What is FRQNCY?',
    'Where do I start?',
    'Tell me about manifestation',
    'What are the 6 pillars?',
    'Recommend something on consciousness',
    'What crypto projects are here?',
  ];

  // ── PALETTE ──────────────────────────────────────────────────────
  const C = {
    navy:    '#0D1B3E',
    navyD:   '#081026',
    navyL:   '#152950',
    gold:    '#C4973A',
    goldL:   '#E8B84B',
    white:   '#FFFFFF',
    dim:     'rgba(255,255,255,0.55)',
    dimmer:  'rgba(255,255,255,0.25)',
    user_bg: '#1A2F5E',
    bot_bg:  '#0F2347',
    border:  'rgba(196,151,58,0.25)',
    shadow:  '0 24px 60px rgba(0,0,0,0.45)',
  };

  // ── STATE ────────────────────────────────────────────────────────
  let open     = false;
  let messages = [];   // { role, content }
  let loading  = false;

  // ── INJECT STYLES ────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
  #frqncy-chat-btn {
    position:fixed; bottom:24px; right:24px; z-index:9998;
    width:56px; height:56px; border-radius:50%;
    background:${C.gold}; border:none; cursor:pointer;
    box-shadow:0 4px 20px rgba(196,151,58,0.45);
    display:flex; align-items:center; justify-content:center;
    transition:transform .2s, box-shadow .2s;
  }
  #frqncy-chat-btn:hover { transform:scale(1.08); box-shadow:0 6px 28px rgba(196,151,58,0.6); }
  #frqncy-chat-btn svg   { width:26px; height:26px; fill:${C.navy}; }

  #frqncy-chat-panel {
    position:fixed; bottom:90px; right:24px; z-index:9999;
    width:390px; max-width:calc(100vw - 32px);
    height:560px; max-height:calc(100vh - 110px);
    background:${C.navy}; border:1px solid ${C.border};
    border-radius:16px; overflow:hidden;
    box-shadow:${C.shadow};
    display:flex; flex-direction:column;
    transition:opacity .22s, transform .22s;
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;
  }
  #frqncy-chat-panel.hidden { opacity:0; transform:translateY(16px) scale(0.97); pointer-events:none; }

  /* Header */
  #frqncy-chat-head {
    display:flex; align-items:center; gap:10px;
    padding:14px 16px 12px;
    background:${C.navyD};
    border-bottom:1px solid ${C.border};
    flex-shrink:0;
  }
  #frqncy-chat-head .avatar {
    width:36px; height:36px; border-radius:50%;
    background:${C.gold};
    display:flex; align-items:center; justify-content:center;
    font-size:18px; flex-shrink:0;
  }
  #frqncy-chat-head .info { flex:1; }
  #frqncy-chat-head .name  { font-size:.85rem; font-weight:700; color:${C.white}; }
  #frqncy-chat-head .tag   { font-size:.72rem; color:${C.dim}; }
  #frqncy-chat-head .close-btn {
    background:none; border:none; cursor:pointer;
    color:${C.dim}; font-size:20px; line-height:1;
    padding:4px; border-radius:6px; transition:color .15s;
  }
  #frqncy-chat-head .close-btn:hover { color:${C.white}; }

  /* Messages */
  #frqncy-chat-msgs {
    flex:1; overflow-y:auto; padding:16px 14px;
    display:flex; flex-direction:column; gap:10px;
    scrollbar-width:thin; scrollbar-color:${C.border} transparent;
  }
  #frqncy-chat-msgs::-webkit-scrollbar { width:4px; }
  #frqncy-chat-msgs::-webkit-scrollbar-thumb { background:${C.border}; border-radius:4px; }

  .fc-msg {
    max-width:88%; padding:10px 13px; border-radius:12px;
    font-size:.84rem; line-height:1.55; color:${C.white};
    word-break:break-word;
  }
  .fc-msg.user { align-self:flex-end; background:${C.user_bg}; border-bottom-right-radius:4px; }
  .fc-msg.bot  { align-self:flex-start; background:${C.bot_bg}; border-bottom-left-radius:4px; border:1px solid ${C.border}; }
  .fc-msg.bot strong { color:${C.gold}; font-weight:600; }
  .fc-msg.bot a { color:${C.goldL}; text-decoration:underline; text-underline-offset:2px; }
  .fc-msg.bot ul, .fc-msg.bot ol { padding-left:1.2em; margin:.4em 0; }
  .fc-msg.bot li { margin:.2em 0; }
  .fc-msg.bot code { background:rgba(255,255,255,.08); padding:1px 5px; border-radius:4px; font-size:.82em; }

  /* Typing indicator */
  .fc-typing { display:flex; gap:5px; padding:12px 13px; align-self:flex-start; }
  .fc-typing span {
    width:7px; height:7px; border-radius:50%;
    background:${C.gold}; opacity:.4;
    animation:fc-bounce .9s ease-in-out infinite;
  }
  .fc-typing span:nth-child(2) { animation-delay:.15s; }
  .fc-typing span:nth-child(3) { animation-delay:.3s; }
  @keyframes fc-bounce { 0%,80%,100%{transform:translateY(0);opacity:.4} 40%{transform:translateY(-6px);opacity:1} }

  /* Suggestions */
  #frqncy-suggestions {
    display:flex; flex-wrap:wrap; gap:6px;
    padding:0 14px 10px; flex-shrink:0;
  }
  .fc-sug {
    font-size:.73rem; color:${C.gold};
    border:1px solid ${C.border}; border-radius:20px;
    padding:4px 11px; background:transparent;
    cursor:pointer; transition:background .15s, color .15s;
  }
  .fc-sug:hover { background:rgba(196,151,58,.12); color:${C.goldL}; }

  /* Input bar */
  #frqncy-chat-bar {
    display:flex; gap:8px; align-items:flex-end;
    padding:12px 14px; border-top:1px solid ${C.border};
    background:${C.navyD}; flex-shrink:0;
  }
  #frqncy-chat-input {
    flex:1; background:${C.navyL}; border:1px solid ${C.border};
    border-radius:10px; padding:9px 13px;
    font-size:.84rem; color:${C.white}; resize:none;
    outline:none; font-family:inherit; line-height:1.4;
    max-height:120px; overflow-y:auto;
    scrollbar-width:thin;
  }
  #frqncy-chat-input::placeholder { color:${C.dim}; }
  #frqncy-chat-input:focus { border-color:rgba(196,151,58,.55); }
  #frqncy-send-btn {
    width:38px; height:38px; border-radius:10px;
    background:${C.gold}; border:none; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    flex-shrink:0; transition:background .15s;
  }
  #frqncy-send-btn:hover { background:${C.goldL}; }
  #frqncy-send-btn:disabled { opacity:.4; cursor:default; }
  #frqncy-send-btn svg { width:18px; height:18px; fill:${C.navy}; }

  /* Mobile */
  @media (max-width: 460px) {
    #frqncy-chat-panel { right:8px; left:8px; width:auto; bottom:80px; }
    #frqncy-chat-btn   { bottom:16px; right:16px; }
  }
  `;
  document.head.appendChild(style);

  // ── DOM ──────────────────────────────────────────────────────────
  // Floating button
  const btn = document.createElement('button');
  btn.id = 'frqncy-chat-btn';
  btn.setAttribute('aria-label', 'Open FRQNCY chat');
  btn.innerHTML = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
  </svg>`;

  // Panel
  const panel = document.createElement('div');
  panel.id = 'frqncy-chat-panel';
  panel.className = 'hidden';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'FRQNCY Navigator chat');

  panel.innerHTML = `
  <div id="frqncy-chat-head">
    <div class="avatar">✦</div>
    <div class="info">
      <div class="name">${BOT_NAME}</div>
      <div class="tag">${BOT_TAGLINE}</div>
    </div>
    <button class="close-btn" id="frqncy-close-btn" aria-label="Close chat">✕</button>
  </div>
  <div id="frqncy-chat-msgs"></div>
  <div id="frqncy-suggestions"></div>
  <div id="frqncy-chat-bar">
    <textarea id="frqncy-chat-input" rows="1" placeholder="Ask about any topic…" aria-label="Chat input"></textarea>
    <button id="frqncy-send-btn" aria-label="Send message">
      <svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>
    </button>
  </div>`;

  document.body.appendChild(btn);
  document.body.appendChild(panel);

  const msgsEl  = panel.querySelector('#frqncy-chat-msgs');
  const inputEl = panel.querySelector('#frqncy-chat-input');
  const sendBtn = panel.querySelector('#frqncy-send-btn');
  const sugsEl  = panel.querySelector('#frqncy-suggestions');

  // ── SUGGESTIONS ──────────────────────────────────────────────────
  function renderSuggestions() {
    sugsEl.innerHTML = '';
    if (messages.length > 0) return; // hide after first message
    SUGGESTIONS.forEach(s => {
      const b = document.createElement('button');
      b.className = 'fc-sug';
      b.textContent = s;
      b.addEventListener('click', () => sendMessage(s));
      sugsEl.appendChild(b);
    });
  }

  // ── MARKDOWN (minimal) ──────────────────────────────────────────
  function md(text) {
    // 1. Escape HTML entities first so our injected tags aren't re-escaped
    let out = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 2. Inline: links before bold/italic so URLs with * aren't mangled
    out = out
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g,     '<em>$1</em>')
      .replace(/`(.+?)`/g,       '<code>$1</code>')
      .replace(/^#{1,3}\s+(.+)$/gm, '<strong>$1</strong>');

    // 3. List items: collect consecutive bullet/numbered lines into <ul>/<ol>
    out = out.replace(/((?:^[-•]\s+.+\n?)+)/gm, block => {
      const items = block.trim().split('\n').map(l => `<li>${l.replace(/^[-•]\s+/, '')}</li>`).join('');
      return `<ul>${items}</ul>`;
    });
    out = out.replace(/((?:^\d+\.\s+.+\n?)+)/gm, block => {
      const items = block.trim().split('\n').map(l => `<li>${l.replace(/^\d+\.\s+/, '')}</li>`).join('');
      return `<ol>${items}</ol>`;
    });

    // 4. Paragraphs
    out = out
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');

    return `<p>${out}</p>`;
  }

  // ── RENDER MESSAGES ──────────────────────────────────────────────
  function addMessage(role, content, streaming = false) {
    const el = document.createElement('div');
    el.className = `fc-msg ${role}`;
    if (role === 'bot') {
      el.innerHTML = md(content);
    } else {
      el.textContent = content;
    }
    if (streaming) el.dataset.streaming = '1';
    msgsEl.appendChild(el);
    msgsEl.scrollTop = msgsEl.scrollHeight;
    return el;
  }

  function showTyping() {
    const t = document.createElement('div');
    t.className = 'fc-typing';
    t.id = 'fc-typing';
    t.innerHTML = '<span></span><span></span><span></span>';
    msgsEl.appendChild(t);
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }

  function hideTyping() {
    const t = document.getElementById('fc-typing');
    if (t) t.remove();
  }

  // ── SEND ─────────────────────────────────────────────────────────
  async function sendMessage(text) {
    text = (text || inputEl.value).trim();
    if (!text || loading) return;

    inputEl.value = '';
    inputEl.style.height = 'auto';
    sugsEl.innerHTML = ''; // hide suggestions

    loading = true;
    sendBtn.disabled = true;

    messages.push({ role: 'user', content: text });
    addMessage('user', text);
    showTyping();

    try {
      const res = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });

      hideTyping();

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        const msg = res.status === 429
          ? `You've sent a lot of messages — give it a minute and try again.`
          : `Sorry, something went wrong: ${err.error || res.statusText}`;
        addMessage('bot', msg);
        loading = false;
        sendBtn.disabled = false;
        return;
      }

      // Stream the response
      const botEl = addMessage('bot', '', true);
      let accumulated = '';
      let buf = '';

      const decoder = new TextDecoder();
      const streamReader = res.body.getReader();

      try {
        while (true) {
          const { done, value } = await streamReader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });

          const lines = buf.split('\n');
          buf = lines.pop(); // retain any incomplete trailing line

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const payload = line.slice(6).trim();
            if (payload === '[DONE]') continue;
            try {
              const evt = JSON.parse(payload);
              if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
                accumulated += evt.delta.text;
                botEl.innerHTML = md(accumulated);
                msgsEl.scrollTop = msgsEl.scrollHeight;
              }
            } catch { /* skip malformed SSE frame */ }
          }
        }
      } finally {
        streamReader.releaseLock();
      }

      delete botEl.dataset.streaming;
      if (accumulated) messages.push({ role: 'assistant', content: accumulated });

    } catch (err) {
      hideTyping();
      const isLocal = location.protocol === 'file:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
      const msg = isLocal
        ? `The chat API only runs on the live Cloudflare Pages site. Open frqncy.network to use the chatbot, or run \`wrangler pages dev .\` locally.`
        : `Connection error — please try again. (${err.message})`;
      addMessage('bot', msg);
    }

    loading = false;
    sendBtn.disabled = false;
    inputEl.focus();
  }

  // ── OPEN / CLOSE ─────────────────────────────────────────────────
  function openChat() {
    open = true;
    panel.classList.remove('hidden');
    btn.setAttribute('aria-expanded', 'true');
    inputEl.focus();

    if (messages.length === 0) {
      addMessage('bot', WELCOME);
      renderSuggestions();
    }
  }

  function closeChat() {
    open = false;
    panel.classList.add('hidden');
    btn.setAttribute('aria-expanded', 'false');
  }

  // ── AUTO-RESIZE TEXTAREA ─────────────────────────────────────────
  inputEl.addEventListener('input', () => {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';
  });

  // ── EVENTS ───────────────────────────────────────────────────────
  btn.addEventListener('click', () => open ? closeChat() : openChat());
  panel.querySelector('#frqncy-close-btn').addEventListener('click', closeChat);
  sendBtn.addEventListener('click', () => sendMessage());

  inputEl.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Close on outside click
  document.addEventListener('click', e => {
    if (open && !panel.contains(e.target) && e.target !== btn) {
      closeChat();
    }
  });

  // Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && open) closeChat();
  });

})();
