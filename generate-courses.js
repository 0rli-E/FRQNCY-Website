#!/usr/bin/env node
// generate-courses.js — builds v2/courses/{slug}/index.html for each course in courses.json
// Run: node generate-courses.js

const fs   = require('fs');
const path = require('path');

const ROOT      = __dirname;
const courses   = JSON.parse(fs.readFileSync(path.join(ROOT, 'courses.json'),   'utf8'));
const PROVIDERS = JSON.parse(fs.readFileSync(path.join(ROOT, 'providers.json'), 'utf8'));

// ── Provider helpers ─────────────────────────────────────────────
const providerMap = new Map(PROVIDERS.map(p => [p.id, p]));
function getProvider(l) { return providerMap.get(l.provider || 'youtube') || providerMap.get('youtube'); }
function lessonVideoId(l) { return l.video_id || l.youtube_id || ''; }
function lessonEmbedUrl(l) {
  const p = getProvider(l);
  if (!p.embeddable || !p.embed_url) return '';
  return p.embed_url.replace('{id}', lessonVideoId(l));
}

const DOMAIN_LABELS = {
  'd-wellbeing':'Wellbeing','d-sciences':'Sciences','d-lifestyle':'Lifestyle',
  'd-consciousness':'Consciousness','d-society':'Society','d-creativity':'Creativity'
};

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Validate accent is a hex colour — otherwise a malformed value would break
// the inline <style>  :root{--accent:...} declaration for the whole page.
const DEFAULT_COURSE_ACCENT = '#C4973A';
function safeAccent(hex) {
  return (typeof hex === 'string' && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) ? hex : DEFAULT_COURSE_ACCENT;
}

// Convert "5 min" / "10 min" / "2 hours" / "1.5 hours" to ISO-8601 duration (PT5M, PT2H, PT1H30M).
function durationToISO(s) {
  if (!s) return 'PT0M';
  const m = String(s).match(/(\d+(?:\.\d+)?)\s*(hour|hr|h|min|m)/i);
  if (!m) return 'PT0M';
  const n = parseFloat(m[1]);
  const unit = m[2].toLowerCase();
  if (unit.startsWith('h')) {
    const hours = Math.floor(n);
    const mins  = Math.round((n - hours) * 60);
    return 'PT' + hours + 'H' + (mins ? mins + 'M' : '');
  }
  return 'PT' + Math.round(n) + 'M';
}

function lessonTypeIcon(type) {
  if (type === 'video')      return `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>`;
  if (type === 'reflection') return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4z"/></svg>`;
  if (type === 'reading')    return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>`;
  return '';
}

function lessonTypeLabel(type) {
  return { video: 'Video', reflection: 'Reflection', reading: 'Reading' }[type] || type;
}

/* ── Sidebar lesson button ── */
function sidebarItem(l, i, prefix) {
  prefix = prefix || 'nav';
  var chkPrefix = prefix === 'nav' ? 'chk' : 'm-chk';
  return `
    <button class="lesson-btn" data-idx="${i}" id="${prefix}-${i}">
      <span class="lbtn-icon">${lessonTypeIcon(l.type)}</span>
      <span class="lbtn-body">
        <span class="lbtn-title">${esc(l.title)}</span>
        <span class="lbtn-meta">${lessonTypeLabel(l.type)}${l.duration ? ' · ' + esc(l.duration) : ''}</span>
      </span>
      <span class="lbtn-check" id="${chkPrefix}-${i}" aria-hidden="true">✓</span>
    </button>`;
}

/* ── Content panel for a single lesson ── */
function lessonContent(l) {
  if (l.type === 'video') {
    const provider = getProvider(l);
    const videoId  = lessonVideoId(l);
    const embedSrc = lessonEmbedUrl(l);
    // Empty/missing video id — render a "coming soon" placeholder instead of a broken embed
    if (!videoId) {
      return `<div class="video-wrap video-wrap-ext">
        <div class="ext-video-link" aria-disabled="true">
          <span class="ext-video-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </span>
          <span class="ext-video-label">Video coming soon</span>
          <span class="ext-video-url">This walkthrough is being recorded — check back shortly.</span>
        </div>
      </div>`;
    }
    // Facade: show the YouTube thumbnail + play button. JS swaps to a real iframe on click.
    // This loads instantly, looks identical to the watch page, and only pulls the video player
    // once the viewer actually clicks play.
    if (provider.embeddable && embedSrc) {
      // YouTube hosts thumbs at multiple sizes; maxresdefault (1280x720) isn't always generated
      // for very fresh uploads, so fall back to hqdefault (480x360) on error.
      const thumbMax = 'https://img.youtube.com/vi/' + videoId + '/maxresdefault.jpg';
      const thumbHq  = 'https://img.youtube.com/vi/' + videoId + '/hqdefault.jpg';
      const autoplayEmbed = (provider.embed_autoplay || provider.embed_url || '').replace('{id}', videoId);
      return `<div class="video-wrap video-facade"
        data-embed="${esc(autoplayEmbed)}"
        data-title="${esc(l.title)}"
        data-thumb-fallback="${esc(thumbHq)}"
        onclick="playVideo(this)"
        role="button" tabindex="0"
        aria-label="Play video: ${esc(l.title)}">
        <img class="video-facade-thumb" src="${esc(thumbMax)}"
             onerror="this.onerror=null;this.src=this.parentElement.dataset.thumbFallback"
             alt="" loading="lazy" decoding="async" />
        <button class="video-play-btn" aria-label="Play" type="button" onclick="event.stopPropagation();playVideo(this.parentElement)">
          <svg viewBox="0 0 68 48" width="68" height="48" aria-hidden="true">
            <path d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55c-2.93.78-4.63 3.26-5.42 6.19C.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z" fill="#f00"/>
            <path d="M45 24 27 14v20" fill="#fff"/>
          </svg>
        </button>
      </div>`;
    }
    // Non-embeddable provider (e.g. Gaia) — render as a link card
    const watchSrc = (provider.watch_url || '').replace('{id}', lessonVideoId(l));
    return `<div class="video-wrap video-wrap-ext">
      <a class="ext-video-link" href="${esc(watchSrc)}" target="_blank" rel="noopener noreferrer">
        <span class="ext-video-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        </span>
        <span class="ext-video-label">Watch on ${esc(provider.name)}</span>
        <span class="ext-video-url">${esc(watchSrc)}</span>
      </a>
    </div>`;
  }
  if (l.type === 'reflection') {
    return `<div class="reflection-box">
      <div class="reflection-label">
        ${lessonTypeIcon('reflection')} Reflection Prompt
      </div>
      <p class="reflection-prompt">${esc(l.content)}</p>
      <div class="reflection-write">
        <textarea placeholder="Write your reflection here… (saved in your browser)" aria-label="Your reflection" id="reflect-${esc(l.id || '')}"></textarea>
        <div class="reflect-actions">
          <span class="reflect-saved" id="saved-${esc(l.id || '')}"></span>
          <button class="reflect-clear" onclick="clearReflect('${esc(l.id || '')}')">Clear</button>
        </div>
      </div>
    </div>`;
  }
  if (l.type === 'reading') {
    const isExternal = (l.url || '').startsWith('http');
    return `<a class="reading-card" href="${esc(l.url)}" ${isExternal ? 'target="_blank" rel="noopener"' : ''}>
      <span class="reading-icon">${lessonTypeIcon('reading')}</span>
      <span class="reading-body">
        <span class="reading-title">${esc(l.desc || l.title)}</span>
        <span class="reading-domain">${esc(l.url || '')}</span>
        ${l.duration ? `<span class="reading-dur">${esc(l.duration)} read</span>` : ''}
      </span>
      <span class="reading-arrow">→</span>
    </a>`;
  }
  return '';
}

/* ── Optional community CTA banner ── */
function communityBanner(cm) {
  if (!cm || !cm.url) return '';
  const label = cm.label || 'Community';
  const blurb = cm.blurb || '';
  const cta   = cm.cta   || 'Join';
  return `
    <a class="community-cta" href="${esc(cm.url)}" target="_blank" rel="noopener">
      <div class="community-cta-body">
        <span class="community-cta-label">${esc(label)}</span>
        ${blurb ? `<span class="community-cta-blurb">${esc(blurb)}</span>` : ''}
      </div>
      <span class="community-cta-btn">${esc(cta)} →</span>
    </a>`;
}

/* ── Per-lesson discuss panel — points at YouTube comments + community ── */
function discussPanel(l, cm) {
  const ytLink = l.type === 'video' && lessonVideoId(l)
    ? (getProvider(l).watch_url || '').replace('{id}', lessonVideoId(l))
    : '';
  const cmUrl  = cm && cm.url ? cm.url : '';
  const cmLabel = (cm && cm.label) || 'the community';
  // Nothing to show if neither link exists
  if (!ytLink && !cmUrl) return '';

  const links = [];
  if (ytLink) {
    links.push(`<a class="discuss-link discuss-link-primary" href="${esc(ytLink)}" target="_blank" rel="noopener">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21.6 6.2a3 3 0 00-2.1-2.1C17.5 3.5 12 3.5 12 3.5s-5.5 0-7.5.6A3 3 0 002.4 6.2C1.8 8.2 1.8 12 1.8 12s0 3.8.6 5.8a3 3 0 002.1 2.1c2 .6 7.5.6 7.5.6s5.5 0 7.5-.6a3 3 0 002.1-2.1c.6-2 .6-5.8.6-5.8s0-3.8-.6-5.8zM10 15.5v-7l5.5 3.5L10 15.5z"/></svg>
      <span class="discuss-link-body">
        <span class="discuss-link-title">Comment on YouTube</span>
        <span class="discuss-link-sub">Join the conversation under the video</span>
      </span>
      <span class="discuss-link-arrow">→</span>
    </a>`);
  }
  if (cmUrl) {
    links.push(`<a class="discuss-link" href="${esc(cmUrl)}" target="_blank" rel="noopener">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.4 8.4 0 01-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.4 8.4 0 013.8-.9h.5a8.5 8.5 0 018 8v.5z"/></svg>
      <span class="discuss-link-body">
        <span class="discuss-link-title">Ask questions in ${esc(cmLabel)}</span>
        <span class="discuss-link-sub">Live channel — updates, Q&A, new lessons land first</span>
      </span>
      <span class="discuss-link-arrow">→</span>
    </a>`);
  }

  return `
  <div class="discuss-panel">
    <div class="discuss-panel-header">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
      <span>Discuss this lesson</span>
    </div>
    <div class="discuss-panel-links">
      ${links.join('')}
    </div>
  </div>`;
}

/* ── Full lesson panel ── */
function lessonPanel(l, i, total, community) {
  const isFirst = i === 0;
  const isLast  = i === total - 1;
  return `
  <div class="lesson-panel" id="panel-${i}" role="tabpanel" aria-labelledby="nav-${i}">
    <div class="lesson-header">
      <div class="lesson-eyebrow">${lessonTypeIcon(l.type)} ${lessonTypeLabel(l.type)}${l.duration ? `<span class="lesson-dur">${esc(l.duration)}</span>` : ''}</div>
      <h1 class="lesson-h1">${esc(l.title)}</h1>
      ${l.desc ? `<p class="lesson-subdesc">${esc(l.desc)}</p>` : ''}
    </div>
    ${lessonContent(l)}
    ${discussPanel(l, community)}
    <div class="lesson-actions">
      <button class="btn-complete" id="btn-complete-${i}" onclick="markComplete(${i})">Mark Complete</button>
      <div class="lesson-nav-btns">
        <button class="btn-nav" id="btn-prev-${i}" onclick="showLesson(${i - 1})"${isFirst ? ' disabled' : ''} aria-label="Previous lesson">← Prev</button>
        <button class="btn-nav btn-next" id="btn-next-${i}" onclick="showLesson(${i + 1})"${isLast ? ' disabled' : ''} aria-label="Next lesson">Next →</button>
      </div>
    </div>
  </div>`;
}

/* ── Full page ── */
function buildPage(c) {
  const domainLabel  = DOMAIN_LABELS[c.domain] || c.domain;
  const lessonsJSON  = JSON.stringify(c.lessons);
  const reflectIds   = c.lessons.filter(l => l.type === 'reflection').map(l => l.id || '').filter(Boolean);
  const reflectJSON  = JSON.stringify(reflectIds);
  const total        = c.lessons.length;
  const courseUrl    = 'https://frqncy.network/v2/courses/' + c.slug + '/';
  const uploadDate   = new Date().toISOString().slice(0, 10);

  // Per-lesson VideoObject schemas (only for videos with an actual id)
  const videoSchemas = c.lessons
    .filter(l => l.type === 'video' && lessonVideoId(l))
    .map(l => {
      const vid = lessonVideoId(l);
      return {
        '@type': 'VideoObject',
        'name': l.title,
        'description': l.desc || c.desc,
        'thumbnailUrl': ['https://img.youtube.com/vi/' + vid + '/maxresdefault.jpg'],
        'uploadDate': uploadDate,
        'embedUrl': lessonEmbedUrl(l),
        'contentUrl': (getProvider(l).watch_url || '').replace('{id}', vid),
        'duration': durationToISO(l.duration),
        'inLanguage': 'en',
        'isFamilyFriendly': true,
        'publisher': { '@type': 'Organization', 'name': 'FRQNCY Network', 'url': 'https://frqncy.network' }
      };
    });

  const courseSchema = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    'name': c.title,
    'description': c.desc,
    'url': courseUrl,
    'provider': { '@type': 'Organization', 'name': 'FRQNCY Network', 'url': 'https://frqncy.network' },
    'educationalLevel': (c.level || '').toLowerCase(),
    'inLanguage': 'en',
    'isAccessibleForFree': !c.pricing || c.pricing.model === 'free',
    'numberOfLessons': total,
    'timeRequired': durationToISO(c.duration),
    'hasPart': videoSchemas
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'FRQNCY',  'item': 'https://frqncy.network/' },
      { '@type': 'ListItem', 'position': 2, 'name': 'Courses', 'item': 'https://frqncy.network/v2/courses/' },
      { '@type': 'ListItem', 'position': 3, 'name': c.title,   'item': courseUrl }
    ]
  };

  const schemaJson = JSON.stringify(courseSchema) + '</script>\n<script type="application/ld+json">' + JSON.stringify(breadcrumbSchema);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(c.title)} — FRQNCY Courses</title>
<meta name="description" content="${esc(c.desc)}">
<meta name="theme-color" content="#0B1C3D">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(c.title)} — FRQNCY Courses">
<meta property="og:description" content="${esc(c.desc)}">
<meta property="og:url" content="https://frqncy.network/v2/courses/${esc(c.slug)}/">
<meta property="og:image" content="https://frqncy.network/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:site_name" content="FRQNCY">
<link rel="icon" type="image/svg+xml" href="../../../favicon.svg">
<link rel="manifest" href="../../../manifest.json">
<link rel="canonical" href="https://frqncy.network/v2/courses/${esc(c.slug)}/">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://www.youtube-nocookie.com">
<link rel="preconnect" href="https://www.youtube.com">
<link rel="dns-prefetch" href="https://i.ytimg.com">
<link rel="dns-prefetch" href="https://img.youtube.com">
<link rel="dns-prefetch" href="https://www.googlevideo.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,300;0,400;0,500;1,300&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --navy:#0B1C3D;--navy-dark:#08152e;--gold:#C4973A;--gold-light:#E0C06A;
  --text:#C8D8F0;--text-dim:#7090B8;--card-bg:rgba(255,255,255,0.04);
  --card-border:rgba(255,255,255,0.08);--accent:${safeAccent(c.accent)};--sidebar-w:290px;
}
html,body{background:var(--navy);color:var(--text);font-family:'Jost',sans-serif;font-weight:300;min-height:100vh;line-height:1.6}
a{text-decoration:none;color:var(--accent)}
a:hover{opacity:0.8}
button{cursor:pointer;font-family:'Jost',sans-serif}

/* ── NAV ─────────────────────────────────────── */
nav.snav{
  position:fixed;top:0;left:0;right:0;z-index:100;
  background:rgba(11,28,61,0.97);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
  border-bottom:1px solid rgba(255,255,255,0.06);
  padding:0 clamp(1rem,3vw,2rem);height:56px;
  display:flex;align-items:center;justify-content:space-between;gap:1rem;
}
.snav-left{display:flex;align-items:center;gap:1.5rem;min-width:0;overflow:hidden}
.snav-logo{font-family:'Cormorant',serif;font-size:1.1rem;letter-spacing:0.28em;color:#fff;text-transform:uppercase;text-decoration:none;flex-shrink:0;opacity:0.85;transition:opacity .2s}
.snav-logo:hover{opacity:1}
.breadcrumb{font-size:0.68rem;letter-spacing:0.04em;color:var(--text-dim);display:flex;align-items:center;gap:0.3rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.breadcrumb a{color:var(--text-dim);transition:color .2s}
.breadcrumb a:hover{color:var(--text)}
.breadcrumb .sep{opacity:0.22}
.snav-right{display:flex;align-items:center;gap:1rem;flex-shrink:0}
.snav-progress{font-size:0.62rem;letter-spacing:0.06em;color:var(--text-dim);display:flex;align-items:center;gap:0.55rem}
.snav-pbar{width:72px;height:2px;background:rgba(255,255,255,0.1);border-radius:1px;overflow:hidden}
.snav-pfill{height:100%;background:var(--accent);border-radius:1px;transition:width .4s ease}

/* ── LAYOUT ──────────────────────────────────── */
.layout{margin-top:56px;display:flex;min-height:calc(100vh - 56px)}

/* ── SIDEBAR ─────────────────────────────────── */
.sidebar{
  width:var(--sidebar-w);flex-shrink:0;
  border-right:1px solid rgba(255,255,255,0.06);
  background:rgba(8,21,46,0.8);
  display:flex;flex-direction:column;
  position:sticky;top:56px;height:calc(100vh - 56px);overflow-y:auto;
  scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.1) transparent;
}
.sidebar-head{
  padding:1.25rem 1.25rem 0.9rem;
  border-bottom:1px solid rgba(255,255,255,0.06);
  position:sticky;top:0;background:rgba(8,21,46,0.96);z-index:1;
}
.sidebar-accent-bar{height:3px;background:var(--accent);border-radius:2px;margin-bottom:1rem;opacity:0.7}
.sidebar-course{font-size:0.53rem;letter-spacing:0.22em;text-transform:uppercase;color:var(--accent);margin-bottom:0.35rem}
.sidebar-title{font-family:'Cormorant',serif;font-size:1.05rem;font-weight:400;color:#fff;line-height:1.2}
.sidebar-meta{font-size:0.63rem;color:var(--text-dim);margin-top:0.3rem}

/* Overall progress bar in sidebar */
.sidebar-progress{padding:0.8rem 1.25rem;border-bottom:1px solid rgba(255,255,255,0.04)}
.sp-label{display:flex;justify-content:space-between;font-size:0.6rem;letter-spacing:0.06em;color:var(--text-dim);margin-bottom:5px}
.sp-bar{height:3px;background:rgba(255,255,255,0.08);border-radius:2px;overflow:hidden}
.sp-fill{height:100%;background:var(--accent);border-radius:2px;transition:width .4s ease}

.lesson-list{padding:0.4rem 0;flex:1}

.lesson-btn{
  width:100%;display:flex;align-items:center;gap:0.7rem;
  padding:0.7rem 1.1rem 0.7rem 1rem;
  border:none;background:none;color:var(--text);
  text-align:left;transition:background .15s;
  border-left:2px solid transparent;
  position:relative;
}
.lesson-btn:hover{background:rgba(255,255,255,0.04)}
.lesson-btn.active{background:rgba(255,255,255,0.06);border-left-color:var(--accent)}
.lesson-btn.done{background:rgba(255,255,255,0.02)}
.lbtn-icon{color:var(--accent);opacity:0.5;flex-shrink:0;width:16px;display:flex;align-items:center;justify-content:center}
.lesson-btn.active .lbtn-icon{opacity:0.9}
.lbtn-body{flex:1;min-width:0}
.lbtn-title{display:block;font-size:0.8rem;color:#fff;line-height:1.3;margin-bottom:0.1rem}
.lesson-btn.done .lbtn-title{opacity:0.45;text-decoration:line-through;text-decoration-color:rgba(255,255,255,0.2)}
.lbtn-meta{font-size:0.6rem;color:var(--text-dim);letter-spacing:0.04em}
.lbtn-check{font-size:0.65rem;color:var(--accent);opacity:0;flex-shrink:0;transition:opacity .25s;font-weight:500}
.lesson-btn.done .lbtn-check{opacity:1}

/* ── MAIN CONTENT ────────────────────────────── */
.main-content{flex:1;min-width:0;padding:2.5rem clamp(1.25rem,4vw,2.5rem) 6rem;max-width:900px}

/* ── LESSON PANEL ────────────────────────────── */
.lesson-panel{display:none}
.lesson-panel.active{display:block;animation:fadeUp .25s ease}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}

.lesson-header{margin-bottom:2rem}
.lesson-eyebrow{
  display:inline-flex;align-items:center;gap:0.45rem;
  font-size:0.56rem;letter-spacing:0.22em;text-transform:uppercase;
  color:var(--accent);margin-bottom:0.8rem;
}
.lesson-dur{
  margin-left:0.5rem;padding-left:0.6rem;
  border-left:1px solid rgba(255,255,255,0.15);
  color:var(--text-dim);
}
.lesson-h1{
  font-family:'Cormorant',serif;font-size:clamp(1.9rem,4vw,2.9rem);
  font-weight:300;color:#fff;line-height:1.08;
}
.lesson-subdesc{margin-top:0.8rem;font-size:0.86rem;color:var(--text-dim);line-height:1.7;max-width:600px}

/* ── VIDEO ───────────────────────────────────── */
.video-wrap{
  width:100%;max-width:820px;aspect-ratio:16/9;
  background:#000;border-radius:4px;overflow:hidden;
  margin-bottom:2rem;border:1px solid rgba(255,255,255,0.08);
  position:relative;
}
.video-wrap iframe{width:100%;height:100%;border:none;display:block}
/* Facade — shows YouTube thumbnail + play button until clicked */
.video-facade{cursor:pointer;background-color:#000}
.video-facade-thumb{
  position:absolute;inset:0;width:100%;height:100%;
  object-fit:cover;display:block;
  user-select:none;-webkit-user-drag:none;pointer-events:none;
}
.video-facade::after{
  content:'';position:absolute;inset:0;
  background:linear-gradient(180deg,transparent 0%,rgba(0,0,0,0.18) 65%,rgba(0,0,0,0.55) 100%);
  pointer-events:none;transition:opacity .25s;
}
.video-facade:hover::after{opacity:0.6}
.video-play-btn{
  position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
  background:none;border:none;padding:0;cursor:pointer;
  filter:drop-shadow(0 4px 14px rgba(0,0,0,0.5));
  transition:transform .2s ease, filter .2s ease;
  z-index:2;
}
.video-facade:hover .video-play-btn,
.video-facade:focus-visible .video-play-btn{transform:translate(-50%,-50%) scale(1.08);filter:drop-shadow(0 6px 18px rgba(0,0,0,0.55)) brightness(1.05)}
.video-facade:focus-visible{outline:2px solid var(--accent);outline-offset:4px}
/* External provider link (non-embeddable, e.g. Gaia) */
.video-wrap-ext{aspect-ratio:unset;height:auto;min-height:120px;display:flex;align-items:center;justify-content:center;padding:2rem}
.video-wrap-ext::before{display:none}
.ext-video-link{display:flex;flex-direction:column;align-items:center;gap:0.75rem;text-decoration:none;color:var(--text);text-align:center;transition:opacity .2s}
.ext-video-link:hover{opacity:0.75}
.ext-video-icon{width:64px;height:64px;border-radius:50%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);display:flex;align-items:center;justify-content:center;color:var(--text-dim)}
.ext-video-label{font-family:'Cormorant',serif;font-size:1.1rem;font-weight:400;color:#fff}
.ext-video-url{font-size:0.65rem;letter-spacing:0.06em;color:var(--text-dim)}

/* ── REFLECTION ──────────────────────────────── */
.reflection-box{
  max-width:680px;
  background:rgba(255,255,255,0.03);
  border:1px solid rgba(255,255,255,0.08);
  border-radius:6px;padding:1.6rem 1.8rem;margin-bottom:2rem;
  border-left:3px solid var(--accent);
}
.reflection-label{
  display:flex;align-items:center;gap:0.4rem;
  font-size:0.54rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--accent);
  margin-bottom:0.9rem;
}
.reflection-prompt{font-size:0.9rem;color:var(--text);line-height:1.85;margin-bottom:1.4rem}
.reflection-write{margin-top:1.2rem;border-top:1px solid rgba(255,255,255,0.06);padding-top:1.2rem}
.reflection-write label{display:block;font-size:0.56rem;letter-spacing:0.16em;text-transform:uppercase;color:var(--text-dim);margin-bottom:0.6rem}
.reflection-write textarea{
  width:100%;min-height:120px;resize:vertical;
  background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:4px;
  padding:0.9rem 1rem;color:var(--text);
  font-family:'Jost',sans-serif;font-size:0.84rem;font-weight:300;line-height:1.65;
  outline:none;transition:border-color .2s;
}
.reflection-write textarea::placeholder{color:rgba(255,255,255,0.22)}
.reflection-write textarea:focus{border-color:rgba(255,255,255,0.22)}
.reflect-actions{display:flex;align-items:center;justify-content:space-between;margin-top:0.5rem}
.reflect-saved{font-size:0.64rem;color:var(--accent);letter-spacing:0.06em;opacity:0;transition:opacity .3s}
.reflect-saved.show{opacity:1}
.reflect-clear{background:none;border:none;font-size:0.62rem;letter-spacing:0.1em;color:var(--text-dim);cursor:pointer;transition:color .2s;padding:0}
.reflect-clear:hover{color:var(--text)}

/* ── READING ─────────────────────────────────── */
.reading-card{
  max-width:620px;display:flex;align-items:center;gap:1.2rem;
  background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);
  border-radius:6px;padding:1.4rem 1.6rem;margin-bottom:2rem;
  color:var(--text);transition:background .2s,border-color .2s;
}
.reading-card:hover{background:rgba(255,255,255,0.07);border-color:rgba(255,255,255,0.16);opacity:1}
.reading-icon{color:var(--accent);opacity:0.65;flex-shrink:0}
.reading-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:0.25rem}
.reading-title{font-size:0.88rem;color:#fff;line-height:1.35}
.reading-domain{font-size:0.66rem;color:var(--text-dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.reading-dur{font-size:0.62rem;color:var(--accent);letter-spacing:0.06em}
.reading-arrow{color:var(--accent);font-size:1.1rem;flex-shrink:0;transition:transform .2s}
.reading-card:hover .reading-arrow{transform:translateX(3px)}

/* ── LESSON ACTIONS ──────────────────────────── */
.lesson-actions{
  display:flex;align-items:center;justify-content:space-between;gap:1rem;
  margin-top:2.5rem;padding-top:1.5rem;
  border-top:1px solid rgba(255,255,255,0.06);
  flex-wrap:wrap;
}
.btn-complete{
  padding:10px 26px;border-radius:2px;
  font-size:0.7rem;letter-spacing:0.18em;text-transform:uppercase;border:none;
  background:var(--accent);color:#fff;transition:opacity .2s,background .2s,transform .15s;
}
.btn-complete:hover{opacity:0.88;transform:translateY(-1px)}
.btn-complete:active{transform:translateY(0)}
.btn-complete.done-state{
  background:rgba(255,255,255,0.07);color:var(--text-dim);
  border:1px solid rgba(255,255,255,0.1);
}
.lesson-nav-btns{display:flex;gap:0.6rem}
.btn-nav{
  padding:9px 18px;border-radius:2px;
  font-size:0.66rem;letter-spacing:0.12em;text-transform:uppercase;
  border:1px solid rgba(255,255,255,0.12);background:none;color:var(--text-dim);
  transition:all .2s;
}
.btn-nav:hover:not(:disabled){border-color:rgba(255,255,255,0.28);color:var(--text)}
.btn-nav:disabled{opacity:0.2;cursor:not-allowed}
.btn-nav.btn-next{border-color:rgba(255,255,255,0.18);color:var(--text)}
.btn-nav.btn-next:hover:not(:disabled){border-color:var(--accent);color:var(--accent)}

/* ── COMMUNITY CTA ───────────────────────────── */
.community-cta{
  display:flex;align-items:center;gap:1rem;flex-wrap:wrap;
  background:rgba(255,255,255,0.04);
  border:1px solid rgba(255,255,255,0.10);border-left:3px solid var(--accent);
  border-radius:6px;padding:0.95rem 1.25rem;margin-bottom:2rem;
  text-decoration:none;color:var(--text);
  transition:background .2s,border-color .2s,transform .15s;
}
.community-cta:hover{background:rgba(255,255,255,0.07);border-color:rgba(255,255,255,0.20);transform:translateY(-1px);opacity:1}
.community-cta-body{flex:1;min-width:220px;display:flex;flex-direction:column;gap:0.25rem}
.community-cta-label{font-size:0.62rem;letter-spacing:0.18em;text-transform:uppercase;color:var(--accent)}
.community-cta-blurb{font-size:0.82rem;color:var(--text);line-height:1.5}
.community-cta-btn{
  flex-shrink:0;padding:8px 18px;border-radius:2px;
  font-size:0.66rem;letter-spacing:0.14em;text-transform:uppercase;
  background:var(--accent);color:#fff;white-space:nowrap;
}

/* ── DISCUSS PANEL (per lesson) ───────────────── */
.discuss-panel{
  max-width:820px;margin:2rem 0 0;
  background:rgba(255,255,255,0.025);
  border:1px solid rgba(255,255,255,0.08);
  border-radius:6px;padding:1.2rem 1.4rem 1.3rem;
}
.discuss-panel-header{
  display:flex;align-items:center;gap:0.5rem;
  font-size:0.56rem;letter-spacing:0.22em;text-transform:uppercase;
  color:var(--text-dim);margin-bottom:0.9rem;
}
.discuss-panel-header svg{color:var(--accent);opacity:0.7;flex-shrink:0}
.discuss-panel-links{display:flex;flex-direction:column;gap:0.5rem}
.discuss-link{
  display:flex;align-items:center;gap:0.85rem;
  padding:0.75rem 1rem;border-radius:4px;
  background:rgba(255,255,255,0.03);
  border:1px solid rgba(255,255,255,0.06);
  text-decoration:none;color:var(--text);
  transition:background .15s,border-color .15s,transform .15s;
}
.discuss-link:hover{background:rgba(255,255,255,0.06);border-color:rgba(255,255,255,0.14);opacity:1;transform:translateY(-1px)}
.discuss-link svg{color:var(--text-dim);flex-shrink:0;transition:color .15s}
.discuss-link:hover svg{color:var(--accent)}
.discuss-link-primary{border-color:rgba(255,255,255,0.14)}
.discuss-link-primary svg{color:#FF4040}
.discuss-link-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:0.1rem}
.discuss-link-title{font-size:0.86rem;color:var(--text);line-height:1.3}
.discuss-link-sub{font-size:0.66rem;color:var(--text-dim);letter-spacing:0.02em}
.discuss-link-arrow{color:var(--text-dim);font-size:1rem;flex-shrink:0;transition:color .15s,transform .15s}
.discuss-link:hover .discuss-link-arrow{color:var(--accent);transform:translateX(3px)}

/* ── COMPLETION MODAL ────────────────────────── */
.completion-overlay{
  position:fixed;inset:0;z-index:300;background:rgba(5,12,28,0.94);backdrop-filter:blur(14px);
  display:flex;align-items:center;justify-content:center;padding:1.5rem;
  opacity:0;pointer-events:none;transition:opacity .3s;
}
.completion-overlay.open{opacity:1;pointer-events:all}
.completion-box{
  max-width:440px;width:100%;text-align:center;
  background:#0d1f44;border:1px solid rgba(196,151,58,0.25);border-radius:8px;
  padding:3rem 2.5rem;
  transform:translateY(16px) scale(0.97);transition:transform .3s;
}
.completion-overlay.open .completion-box{transform:translateY(0) scale(1)}
.completion-icon{font-size:2.8rem;margin-bottom:1.2rem;line-height:1;color:var(--gold)}
.completion-title{font-family:'Cormorant',serif;font-size:2rem;font-weight:300;color:#fff;margin-bottom:0.5rem}
.completion-course{font-size:0.84rem;color:var(--text-dim);margin-bottom:1.5rem}
.completion-badge{
  display:inline-flex;align-items:center;gap:0.5rem;
  border:1px solid rgba(196,151,58,0.4);border-radius:4px;
  padding:0.5rem 1.1rem;margin-bottom:1.8rem;
  background:rgba(196,151,58,0.07);
}
.badge-label{font-size:0.58rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--gold)}
.completion-desc{font-size:0.8rem;color:var(--text-dim);line-height:1.7;margin-bottom:2rem}
.completion-btns{display:flex;gap:0.7rem;justify-content:center;flex-wrap:wrap}
.cbtn{padding:10px 22px;border-radius:2px;font-size:0.68rem;letter-spacing:0.14em;text-transform:uppercase;cursor:pointer;transition:all .2s}
.cbtn-primary{background:var(--accent);color:#fff;border:none}
.cbtn-primary:hover{opacity:0.85}
.cbtn-sec{background:none;color:var(--text-dim);border:1px solid rgba(255,255,255,0.12)}
.cbtn-sec:hover{border-color:rgba(255,255,255,0.28);color:var(--text)}

/* ── MOBILE ──────────────────────────────────── */
.mobile-overlay{display:none;position:fixed;inset:0;z-index:49;background:rgba(0,0,0,0.5)}
.mobile-overlay.open{display:block}
.mobile-bar{
  display:none;position:fixed;bottom:0;left:0;right:0;z-index:50;
  background:rgba(11,28,61,0.98);border-top:1px solid rgba(255,255,255,0.08);
  padding:0.7rem 1.25rem;gap:0.75rem;align-items:center;
}
.mobile-lesson-title{flex:1;min-width:0;font-size:0.78rem;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mobile-lessons-btn{
  background:var(--accent);color:#fff;border:none;
  padding:7px 14px;border-radius:2px;font-size:0.62rem;letter-spacing:0.14em;text-transform:uppercase;
  flex-shrink:0;white-space:nowrap;
}
.mobile-sidebar{
  display:none;position:fixed;bottom:0;left:0;right:0;z-index:60;
  background:#0c1e42;border-top:1px solid rgba(255,255,255,0.1);
  max-height:60vh;overflow-y:auto;
  transform:translateY(100%);transition:transform .3s ease;
}
.mobile-sidebar.open{transform:translateY(0)}
.mobile-sidebar-head{
  padding:1rem 1.25rem 0.75rem;display:flex;align-items:center;justify-content:space-between;
  border-bottom:1px solid rgba(255,255,255,0.06);
  position:sticky;top:0;background:#0c1e42;
}
.mobile-sidebar-head span{font-size:0.62rem;letter-spacing:0.18em;text-transform:uppercase;color:var(--text-dim)}
.mobile-sidebar-close{background:none;border:none;color:var(--text-dim);font-size:1.2rem;cursor:pointer;line-height:1;padding:2px}

@media(max-width:768px){
  .sidebar{display:none}
  .main-content{padding:1.5rem 1.25rem 7rem}
  .mobile-bar{display:flex}
  .lesson-actions{flex-direction:column;align-items:flex-start}
  .lesson-nav-btns{width:100%;justify-content:space-between}
  .btn-complete{width:100%;text-align:center}
  .snav-pbar{width:50px}
  .breadcrumb{max-width:120px}
  .video-wrap{max-width:100%}
  .reflection-box,.reading-card{max-width:100%}
}
</style>
<script src="../../../mobile-nav.js" defer></script>
<script src="../../../chat-widget.js" defer></script>
<link rel="stylesheet" href="../../../nav-dropdown.css">
<link rel="manifest" href="../../../manifest.json">
<script>if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js'));}</script>
<script type="application/ld+json">${schemaJson}</script>
</head>
<body>

<nav class="snav">
  <div class="snav-left">
    <a href="../../../" class="snav-logo">FRQNCY</a>
    <div class="breadcrumb">
      <a href="../../">Courses</a>
      <span class="sep">›</span>
      <span>${esc(c.title)}</span>
    </div>
  </div>
  <div class="snav-right">
    <div class="snav-progress" aria-label="Course progress">
      <span id="nav-progress-text">0/${total}</span>
      <div class="snav-pbar"><div class="snav-pfill" id="nav-pfill" style="width:0%"></div></div>
    </div>
  </div>
</nav>

<div class="layout">
  <!-- SIDEBAR -->
  <aside class="sidebar" id="sidebar" aria-label="Course lessons">
    <div class="sidebar-head">
      <div class="sidebar-accent-bar"></div>
      <div class="sidebar-course">${esc(domainLabel)} · ${esc(c.level)}</div>
      <div class="sidebar-title">${esc(c.title)}</div>
      <div class="sidebar-meta">${total} lessons · ${esc(c.duration)}</div>
    </div>
    <div class="sidebar-progress">
      <div class="sp-label"><span>Progress</span><span id="sp-text">0 / ${total}</span></div>
      <div class="sp-bar"><div class="sp-fill" id="sp-fill" style="width:0%"></div></div>
    </div>
    <div class="lesson-list" id="lesson-list" role="tablist">
      ${c.lessons.map((l, i) => sidebarItem(l, i)).join('')}
    </div>
  </aside>

  <!-- MAIN -->
  <div class="main-content" id="main-content">
    ${communityBanner(c.community)}
    ${c.lessons.map((l, i) => lessonPanel(l, i, total, c.community)).join('')}
  </div>
</div>

<!-- MOBILE BOTTOM BAR -->
<div class="mobile-overlay" id="mobile-overlay" onclick="closeMobileSidebar()"></div>
<div class="mobile-bar" id="mobile-bar">
  <span class="mobile-lesson-title" id="mobile-lesson-title">Lesson 1</span>
  <button class="mobile-lessons-btn" onclick="openMobileSidebar()">All Lessons</button>
</div>
<div class="mobile-sidebar" id="mobile-sidebar" aria-label="Lessons menu">
  <div class="mobile-sidebar-head">
    <span>Lessons</span>
    <button class="mobile-sidebar-close" onclick="closeMobileSidebar()" aria-label="Close">✕</button>
  </div>
  <div class="lesson-list" id="mobile-lesson-list">
    ${c.lessons.map((l, i) => sidebarItem(l, i, 'm-nav')).join('')}
  </div>
</div>

<!-- COMPLETION MODAL -->
<div class="completion-overlay" id="completion" role="dialog" aria-modal="true" aria-labelledby="completion-title">
  <div class="completion-box">
    <div class="completion-icon">✦</div>
    <div class="completion-title" id="completion-title">Course Complete</div>
    <div class="completion-course">${esc(c.title)}</div>
    <div class="completion-badge">
      <span class="badge-label">✓ ${esc(c.level)} · FRQNCY Certificate</span>
    </div>
    <div class="completion-desc">You've completed all ${total} lessons. The ideas are yours — carry them into practice.</div>
    <div class="completion-btns">
      <button class="cbtn cbtn-primary" onclick="closeCompletion()">Keep Exploring</button>
      <a href="../../" class="cbtn cbtn-sec">All Courses</a>
    </div>
  </div>
</div>

<script>
const SLUG      = '${c.slug}';
const LESSONS   = ${lessonsJSON};
const TOTAL     = LESSONS.length;
const STORE_KEY = 'frqncy-course-' + SLUG;
const REFLECT_IDS = ${reflectJSON};

let current   = 0;
/* localStorage is unavailable in Safari private mode (and sometimes in
 * embedded webviews). Wrapping every access in try/catch keeps the
 * course page interactive in those environments — progress just won't
 * persist across reloads. */
function _ls(op, key, val) {
  try {
    if (op === 'get')    return localStorage.getItem(key);
    if (op === 'set')    return localStorage.setItem(key, val);
    if (op === 'remove') return localStorage.removeItem(key);
  } catch (_) { return null; }
}
let completed = (() => {
  try { return new Set(JSON.parse(_ls('get', STORE_KEY) || '[]')); }
  catch (_) { return new Set(); }
})();

/* ── Persistence ── */
function save() { _ls('set', STORE_KEY, JSON.stringify([...completed])); }

function saveReflection(id, text) {
  _ls('set', 'frqncy-reflect-' + id, text);
}
function loadReflection(id) {
  return _ls('get', 'frqncy-reflect-' + id) || '';
}
function clearReflect(id) {
  _ls('remove', 'frqncy-reflect-' + id);
  const ta = document.getElementById('reflect-' + id);
  if (ta) ta.value = '';
}

/* ── Progress UI ── */
function updateProgress() {
  const done = completed.size;
  const pct  = TOTAL ? Math.round((done / TOTAL) * 100) : 0;
  document.getElementById('nav-progress-text').textContent = done + '/' + TOTAL;
  document.getElementById('nav-pfill').style.width = pct + '%';
  document.getElementById('sp-text').textContent = done + ' / ' + TOTAL;
  document.getElementById('sp-fill').style.width = pct + '%';
}

/* ── Sidebar state ── */
function updateSidebar() {
  document.querySelectorAll('.lesson-btn').forEach((btn, i) => {
    btn.classList.toggle('active', i === current);
    btn.classList.toggle('done', completed.has(i));
  });
  // Mobile lesson title
  const mlt = document.getElementById('mobile-lesson-title');
  if (mlt && LESSONS[current]) mlt.textContent = (current + 1) + '. ' + LESSONS[current].title;
}

/* ── Facade ↔ iframe swap (per-video) ── */
function playVideo(wrap) {
  if (!wrap || !wrap.classList.contains('video-facade')) return;
  const embed = wrap.dataset.embed;
  const title = wrap.dataset.title || 'Video';
  if (!embed) return;
  // Remember the thumbnail src so we can restore on lesson switch (image may have fallen back to hq)
  const currentThumb = wrap.querySelector('.video-facade-thumb');
  if (currentThumb) wrap.dataset.facadeThumb = currentThumb.src;
  wrap.innerHTML = '';
  const iframe = document.createElement('iframe');
  iframe.src = embed;
  iframe.title = title;
  iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
  iframe.allowFullscreen = true;
  iframe.setAttribute('data-played', '1');
  wrap.appendChild(iframe);
  wrap.classList.remove('video-facade');
  wrap.classList.add('loaded');
  wrap.removeAttribute('onclick');
  wrap.removeAttribute('role');
  wrap.removeAttribute('tabindex');
}
function restoreFacade(wrap) {
  if (!wrap || !wrap.dataset || !wrap.dataset.embed) return;
  const title = wrap.dataset.title || 'Video';
  const thumb = wrap.dataset.facadeThumb || wrap.dataset.thumbFallback || '';
  wrap.innerHTML = '<img class="video-facade-thumb" src="' + thumb + '" alt="" loading="lazy" decoding="async" onerror="this.onerror=null;this.src=this.parentElement.dataset.thumbFallback"/>'
    + '<button class="video-play-btn" aria-label="Play" type="button" onclick="event.stopPropagation();playVideo(this.parentElement)">'
    + '<svg viewBox="0 0 68 48" width="68" height="48" aria-hidden="true">'
    + '<path d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55c-2.93.78-4.63 3.26-5.42 6.19C.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z" fill="#f00"/>'
    + '<path d="M45 24 27 14v20" fill="#fff"/>'
    + '</svg></button>';
  wrap.classList.add('video-facade');
  wrap.classList.remove('loaded');
  wrap.setAttribute('onclick', 'playVideo(this)');
  wrap.setAttribute('role', 'button');
  wrap.setAttribute('tabindex', '0');
  wrap.setAttribute('aria-label', 'Play video: ' + title);
}
// Keyboard support — Enter/Space on a focused facade plays the video
document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('video-facade')) {
    e.preventDefault();
    playVideo(e.target);
  }
});

/* ── Lesson switching ── */
function showLesson(idx) {
  if (idx < 0 || idx >= TOTAL) return;

  // Stop the leaving lesson's video (if any) — restore facade so audio stops
  const leavingPanel = document.getElementById('panel-' + current);
  if (leavingPanel) {
    const playingIframe = leavingPanel.querySelector('.video-wrap > iframe[data-played]');
    if (playingIframe) restoreFacade(playingIframe.parentElement);
  }

  // Activate new panel
  document.querySelectorAll('.lesson-panel').forEach((p, i) => p.classList.toggle('active', i === idx));
  current = idx;

  // Lesson activation — facade is already rendered, video loads on click
  const panel = document.getElementById('panel-' + idx);
  if (panel) {
    // Load reflection text
    const lesson = LESSONS[idx];
    if (lesson && lesson.type === 'reflection' && lesson.id) {
      const ta = document.getElementById('reflect-' + lesson.id);
      if (ta && !ta._wired) {
        ta.value = loadReflection(lesson.id);
        ta._wired = true;
        let saveTimer;
        ta.addEventListener('input', () => {
          clearTimeout(saveTimer);
          saveTimer = setTimeout(() => {
            saveReflection(lesson.id, ta.value);
            const savedEl = document.getElementById('saved-' + lesson.id);
            if (savedEl) { savedEl.textContent = '✓ Saved'; savedEl.classList.add('show'); setTimeout(() => savedEl.classList.remove('show'), 2000); }
          }, 800);
        });
      }
    }
  }

  updateSidebar();
  updateCompleteBtn();
  window.scrollTo({ top: 56, behavior: 'smooth' });
  closeMobileSidebar();
}

/* ── Complete button ── */
function updateCompleteBtn() {
  const btn = document.getElementById('btn-complete-' + current);
  if (!btn) return;
  const done = completed.has(current);
  btn.textContent = done ? '✓ Completed' : 'Mark Complete';
  btn.classList.toggle('done-state', done);

  const prev = document.getElementById('btn-prev-' + current);
  const next = document.getElementById('btn-next-' + current);
  if (prev) prev.disabled = current === 0;
  if (next) next.disabled = current === TOTAL - 1;
}

function markComplete(idx) {
  if (completed.has(idx)) {
    completed.delete(idx);
    save();
    updateProgress();
    updateCompleteBtn();
    updateSidebar();
  } else {
    completed.add(idx);
    save();
    updateProgress();
    updateCompleteBtn();
    updateSidebar();

    // Auto-advance to next lesson after a beat
    if (idx < TOTAL - 1) {
      setTimeout(() => showLesson(idx + 1), 800);
    } else if (completed.size === TOTAL) {
      setTimeout(() => document.getElementById('completion').classList.add('open'), 600);
    }
  }
}

/* ── Mobile sidebar ── */
function openMobileSidebar() {
  document.getElementById('mobile-sidebar').classList.add('open');
  document.getElementById('mobile-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeMobileSidebar() {
  document.getElementById('mobile-sidebar').classList.remove('open');
  document.getElementById('mobile-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

/* ── Completion modal ── */
function closeCompletion() {
  document.getElementById('completion').classList.remove('open');
}
document.getElementById('completion').addEventListener('click', e => {
  if (e.target === document.getElementById('completion')) closeCompletion();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeCompletion();
});

/* ── Keyboard nav ── */
document.addEventListener('keydown', e => {
  if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
  if (e.altKey && e.key === 'ArrowRight') showLesson(current + 1);
  if (e.altKey && e.key === 'ArrowLeft')  showLesson(current - 1);
});

/* ── Wire sidebar buttons ── */
document.querySelectorAll('.lesson-btn').forEach((btn, i) => {
  btn.addEventListener('click', () => showLesson(i));
});

/* ── Init ── */
updateProgress();
updateSidebar();
const firstIncomplete = [...Array(TOTAL).keys()].find(i => !completed.has(i));
showLesson(firstIncomplete !== undefined ? firstIncomplete : 0);
</script>
</body>
</html>`;
}

/* ── Hub page (v2/courses/index.html) ── */
function buildHubPage(courses) {
  const DOMAIN_LABELS = {
    'd-wellbeing':'Wellbeing','d-sciences':'Sciences','d-lifestyle':'Lifestyle',
    'd-consciousness':'Consciousness','d-society':'Society','d-creativity':'Creativity'
  };

  // Inline courses data — no fetch() needed, works on file:// protocol
  const coursesJson = JSON.stringify(courses.map(c => ({
    slug:     c.slug,
    title:    c.title,
    subtitle: c.subtitle || '',
    desc:     c.desc || '',
    level:    c.level,
    domain:   c.domain,
    duration: c.duration,
    accent:   safeAccent(c.accent),
    lessons:  c.lessons.map(l => ({ id: l.id, title: l.title, type: l.type }))
  })));

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Courses — FRQNCY Network</title>
<meta name="description" content="Structured learning paths across consciousness, science, and wellbeing. The FRQNCY Course Library.">
<meta name="theme-color" content="#0B1C3D">
<meta property="og:type" content="website">
<meta property="og:title" content="Courses — FRQNCY Network">
<meta property="og:description" content="Structured learning paths across consciousness, science, and wellbeing.">
<meta property="og:url" content="https://frqncy.network/v2/courses/">
<meta property="og:image" content="https://frqncy.network/og-image.png">
<meta property="og:site_name" content="FRQNCY">
<link rel="icon" type="image/svg+xml" href="../../favicon.svg">
<link rel="manifest" href="../../manifest.json">
<link rel="canonical" href="https://frqncy.network/v2/courses/">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,300;0,400;0,500;1,300&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --navy:#0B1C3D;--navy-mid:#0D2451;--gold:#C4973A;--gold-light:#E0C06A;
  --text:#C8D8F0;--text-dim:#7090B8;--card-bg:rgba(255,255,255,0.04);
  --card-border:rgba(255,255,255,0.08);--accent:#4A7AE8;
}
html,body{background:var(--navy);color:var(--text);font-family:'Jost',sans-serif;font-weight:300;min-height:100vh;line-height:1.6}
a{text-decoration:none}

/* NAV */
nav.snav{position:fixed;top:0;left:0;right:0;z-index:100;background:rgba(11,28,61,0.97);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:1px solid rgba(255,255,255,0.06);padding:0 clamp(1.25rem,4vw,2.5rem);height:56px;display:flex;align-items:center;justify-content:space-between;gap:1rem}
.snav-left{display:flex;align-items:center;gap:1.75rem;min-width:0;overflow:hidden}
.snav-logo{font-family:'Cormorant',serif;font-size:1.1rem;letter-spacing:0.28em;color:#fff;text-transform:uppercase;text-decoration:none;flex-shrink:0;opacity:0.85;transition:opacity .2s}
.snav-logo:hover{opacity:1}
.breadcrumb{font-size:0.7rem;letter-spacing:0.06em;color:var(--text-dim);display:flex;align-items:center;gap:0.35rem;white-space:nowrap}
.breadcrumb a{color:var(--text-dim);transition:color .2s}
.breadcrumb a:hover{color:var(--text)}
.breadcrumb .sep{opacity:0.25}
.snav-right{display:flex;align-items:center;gap:1rem;flex-shrink:0}
.snav-link{font-size:0.64rem;letter-spacing:0.14em;text-transform:uppercase;color:var(--text-dim);transition:color .2s;white-space:nowrap}
.snav-link:hover{color:var(--text)}
.snav-back{font-size:0.68rem;letter-spacing:0.1em;color:var(--text-dim);border:1px solid rgba(255,255,255,0.1);padding:5px 14px;border-radius:2px;transition:all .2s;text-decoration:none;flex-shrink:0;white-space:nowrap}
.snav-back:hover{color:var(--text);border-color:rgba(255,255,255,0.28)}

/* HERO */
.hero{margin-top:56px;padding:clamp(3rem,7vw,5rem) clamp(1.25rem,5vw,2.5rem) clamp(2rem,4vw,3.5rem);text-align:center;position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% -10%,rgba(196,151,58,0.1) 0%,transparent 65%);pointer-events:none}
.hero-eyebrow{display:inline-flex;align-items:center;gap:0.5rem;font-size:0.6rem;letter-spacing:0.32em;text-transform:uppercase;color:var(--gold);margin-bottom:1.25rem}
.hero-eyebrow::before,.hero-eyebrow::after{content:'';display:block;width:20px;height:1px;background:currentColor;opacity:0.4}
.hero h1{font-family:'Cormorant',serif;font-size:clamp(2.4rem,6vw,4.5rem);font-weight:300;color:#fff;line-height:1.08;margin-bottom:1.2rem}
.hero-desc{max-width:520px;margin:0 auto;font-size:0.88rem;color:var(--text-dim);font-weight:300;line-height:1.75}

/* GRID */
main{max-width:1080px;margin:0 auto;padding:0 clamp(1.25rem,5vw,2.5rem) 7rem}
.courses-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:1.5rem}

/* COURSE CARD */
.ccard{
  background:var(--card-bg);border:1px solid var(--card-border);border-radius:6px;
  overflow:hidden;display:flex;flex-direction:column;
  transition:border-color .25s,transform .25s,background .25s;
  text-decoration:none;color:var(--text);
}
.ccard:hover{border-color:rgba(255,255,255,0.18);transform:translateY(-3px);background:rgba(255,255,255,0.06)}
.ccard-top{height:5px;flex-shrink:0}
.ccard-body{padding:1.6rem 1.6rem 1.4rem;flex:1;display:flex;flex-direction:column;gap:0.6rem}
.ccard-meta{display:flex;align-items:center;gap:0.6rem;flex-wrap:wrap}
.clevel{font-size:0.54rem;letter-spacing:0.18em;text-transform:uppercase;padding:3px 9px;border-radius:2px;font-weight:400;border:1px solid currentColor}
.cdomain{font-size:0.54rem;letter-spacing:0.18em;text-transform:uppercase;color:var(--text-dim)}
.ctitle{font-family:'Cormorant',serif;font-size:1.55rem;font-weight:400;color:#fff;line-height:1.15}
.csubtitle{font-size:0.72rem;color:var(--text-dim);font-style:italic;margin-top:-0.2rem}
.cdesc{font-size:0.8rem;color:var(--text-dim);line-height:1.65;margin-top:0.2rem}
.ccard-footer{margin-top:auto;padding-top:1.2rem;display:flex;align-items:center;justify-content:space-between;gap:1rem;border-top:1px solid rgba(255,255,255,0.06)}
.cstats{display:flex;gap:1rem}
.cstat{font-size:0.64rem;letter-spacing:0.06em;color:var(--text-dim)}
.cstat strong{color:var(--text);font-weight:400}
.cprogress-wrap{flex:1;max-width:120px}
.cprogress-bar{height:2px;background:rgba(255,255,255,0.08);border-radius:1px;overflow:hidden;margin-bottom:4px}
.cprogress-fill{height:100%;border-radius:1px;transition:width .3s}
.cprogress-label{font-size:0.56rem;letter-spacing:0.1em;color:var(--text-dim)}
.cstart-btn{font-size:0.64rem;letter-spacing:0.14em;text-transform:uppercase;color:inherit;opacity:0.6;transition:opacity .2s;white-space:nowrap}
.ccard:hover .cstart-btn{opacity:1}
.cbadge{font-size:0.5rem;letter-spacing:0.15em;text-transform:uppercase;background:rgba(196,151,58,0.15);border:1px solid rgba(196,151,58,0.4);color:var(--gold);padding:2px 8px;border-radius:2px}

/* EMPTY */
.empty{text-align:center;padding:5rem 2rem;color:var(--text-dim);font-size:0.86rem}

@media(max-width:600px){.courses-grid{grid-template-columns:1fr}}
</style>
<script src="../../mobile-nav.js" defer></script>
<script src="../../chat-widget.js" defer></script>
<link rel="stylesheet" href="../../nav-dropdown.css">
<link rel="manifest" href="../../manifest.json">
<script>if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js'));}</script>
</head>
<body>

<nav class="snav">
  <div class="snav-left">
    <a href="../../" class="snav-logo">FRQNCY</a>
    <div class="breadcrumb">
      <a href="../explore.html">Network</a>
      <span class="sep">›</span>
      <span>Courses</span>
    </div>
  </div>
  <div class="snav-right">
    <a href="../watch/index.html" class="snav-link">Watch</a>
    <a href="../explore.html" class="snav-back">← Network Map</a>
  </div>
</nav>

<section class="hero">
  <div class="hero-eyebrow">Learning Paths</div>
  <h1>Courses</h1>
  <p class="hero-desc">Structured paths through the ideas, practices, and sciences that matter most. Each course combines video, reflection, and reading.</p>
</section>

<main>
  <div class="courses-grid" id="grid"></div>
</main>

<script>
const DOMAIN_LABELS = ${JSON.stringify(DOMAIN_LABELS)};
// Courses data is inlined at build time — no fetch() needed, works locally too
const COURSES = ${coursesJson};

function getProgress(slug, lessons) {
  try {
    const completed = JSON.parse(localStorage.getItem('frqncy-course-' + slug) || '[]');
    return { done: completed.length, total: lessons.length };
  } catch(e) {
    return { done: 0, total: lessons.length };
  }
}

function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function makeCard(c) {
  const { done, total } = getProgress(c.slug, c.lessons);
  const pct      = total ? Math.round((done / total) * 100) : 0;
  const complete = done === total && total > 0;

  const a = document.createElement('a');
  a.className = 'ccard';
  // Use explicit index.html — works on both file:// and web servers
  a.href = c.slug + '/index.html';
  a.innerHTML = \`
    <div class="ccard-top" style="background:\${c.accent}"></div>
    <div class="ccard-body">
      <div class="ccard-meta">
        <span class="clevel" style="color:\${c.accent};border-color:\${c.accent}40">\${esc(c.level)}</span>
        <span class="cdomain">\${esc(DOMAIN_LABELS[c.domain] || c.domain)}</span>
        \${complete ? '<span class="cbadge">✓ Completed</span>' : ''}
      </div>
      <div class="ctitle">\${esc(c.title)}</div>
      \${c.subtitle ? \`<div class="csubtitle">\${esc(c.subtitle)}</div>\` : ''}
      \${c.desc ? \`<div class="cdesc">\${esc(c.desc)}</div>\` : ''}
      <div class="ccard-footer">
        <div class="cstats">
          <div class="cstat"><strong>\${total}</strong> lessons</div>
          <div class="cstat"><strong>\${esc(c.duration)}</strong></div>
        </div>
        \${pct > 0 ? \`
          <div class="cprogress-wrap">
            <div class="cprogress-bar"><div class="cprogress-fill" style="width:\${pct}%;background:\${c.accent}"></div></div>
            <div class="cprogress-label">\${done}/\${total} complete</div>
          </div>
        \` : \`<span class="cstart-btn">\${done > 0 ? 'Continue →' : 'Start →'}</span>\`}
      </div>
    </div>
  \`;
  return a;
}

const grid = document.getElementById('grid');
if (!COURSES.length) {
  grid.innerHTML = '<div class="empty">No courses available yet.</div>';
} else {
  for (const c of COURSES) grid.appendChild(makeCard(c));
}
</script>
</body>
</html>`;
}

/* ── Build ── */
for (const c of courses) {
  const outDir = path.join(ROOT, 'v2', 'courses', c.slug);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), buildPage(c), 'utf8');
  console.log(`✓  v2/courses/${c.slug}/index.html`);
}

// Hub page — always regenerated, inline data, no fetch() dependency
fs.writeFileSync(path.join(ROOT, 'v2', 'courses', 'index.html'), buildHubPage(courses), 'utf8');
console.log(`✓  v2/courses/index.html (hub)`);
console.log(`\nGenerated ${courses.length} course pages + hub.`);
