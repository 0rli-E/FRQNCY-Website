/* empty css                                     */
import { c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_C8GjfOXF.mjs';
import 'piccolore';
import 'html-escaper';
import { u as useAuth, s as supabase, $ as $$SocialLayout } from '../chunks/SocialLayout_BQoA4DU3.mjs';
import { T as TIER_COLORS, F as Feed } from '../chunks/Feed_nRUcC6gF.mjs';
import { useState, useRef, useEffect, useCallback } from 'preact/hooks';
import { jsx, jsxs } from 'preact/jsx-runtime';
export { renderers } from '../renderers.mjs';

let cache = null;
let inflight = null;
async function loadProjects() {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch("/api/crypto/projects");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const projects = Array.isArray(data?.projects) ? data.projects : [];
      cache = projects.filter((p) => p && typeof p.name === "string" && p.name.length > 0);
      return cache;
    } catch (err) {
      console.error("loadProjects failed:", err);
      cache = [];
      return cache;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}
function searchProjects(query, limit = 20) {
  const list = cache ?? [];
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored = [];
  for (const p of list) {
    const name = p.name.toLowerCase();
    const symbol = (p.symbol || "").toLowerCase();
    let score = 0;
    if (symbol === q) score = 100;
    else if (name === q) score = 90;
    else if (symbol.startsWith(q)) score = 80;
    else if (name.startsWith(q)) score = 70;
    else if (symbol.includes(q)) score = 50;
    else if (name.includes(q)) score = 40;
    if (score > 0) {
      const tierBonus = tierWeight(p.tier);
      scored.push({
        project: p,
        score: score + tierBonus
      });
    }
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.project);
}
function tierWeight(tier) {
  switch ((tier || "").toUpperCase()) {
    case "S":
      return 7;
    case "A":
      return 6;
    case "B":
      return 5;
    case "C":
      return 4;
    case "D":
      return 3;
    case "E":
      return 2;
    case "F":
      return 1;
    default:
      return 0;
  }
}

function getTierColor(tier) {
  return TIER_COLORS[tier?.toUpperCase()] ?? TIER_COLORS.D;
}
function ProjectPicker({
  value,
  onChange,
  placeholder = "Tag a project (optional)",
  limit = 20
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const debounceRef = useRef(null);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadProjects().then(() => {
      if (!cancelled) setReady(true);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const item = listRef.current.children[activeIndex];
      item?.scrollIntoView({
        block: "nearest"
      });
    }
  }, [activeIndex]);
  const runSearch = useCallback((q) => {
    if (!q.trim()) {
      setResults([]);
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }
    const matches = searchProjects(q, limit);
    setResults(matches);
    setIsOpen(matches.length > 0);
    setActiveIndex(matches.length > 0 ? 0 : -1);
  }, [limit]);
  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(val), 120);
  };
  const handleSelect = (project) => {
    onChange(project);
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setActiveIndex(-1);
  };
  const handleClear = () => {
    onChange(null);
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 0);
  };
  const handleKeyDown = (e) => {
    if (!isOpen || results.length === 0) {
      if (e.key === "ArrowDown" && query && !isOpen) {
        runSearch(query);
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, results.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && results[activeIndex]) {
          handleSelect(results[activeIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setActiveIndex(-1);
        break;
    }
  };
  if (value) {
    const color = getTierColor(value.tier);
    return jsx("div", {
      class: "flex items-center gap-2",
      children: jsxs("span", {
        class: "inline-flex items-center gap-1.5 text-xs pl-2.5 pr-1.5 py-1 rounded-full",
        style: {
          backgroundColor: `${color}15`,
          border: `1px solid ${color}30`,
          color
        },
        children: [jsx("span", {
          class: "w-1.5 h-1.5 rounded-full shrink-0",
          style: {
            backgroundColor: color
          }
        }), jsx("span", {
          class: "font-medium",
          children: value.name
        }), value.symbol && jsx("span", {
          class: "text-[10px] opacity-70",
          children: value.symbol
        }), jsx("span", {
          class: "text-[10px] font-bold opacity-70 ml-0.5",
          children: value.tier?.toUpperCase() || "NR"
        }), jsx("button", {
          type: "button",
          onClick: handleClear,
          class: "ml-0.5 p-0.5 rounded-full hover:bg-white/10 transition-colors",
          title: "Remove project tag",
          "aria-label": "Remove project tag",
          children: jsx("svg", {
            class: "w-3 h-3",
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24",
            children: jsx("path", {
              "stroke-linecap": "round",
              "stroke-linejoin": "round",
              "stroke-width": "2.5",
              d: "M6 18L18 6M6 6l12 12"
            })
          })
        })]
      })
    });
  }
  return jsxs("div", {
    ref: containerRef,
    class: "relative",
    children: [jsxs("div", {
      class: "relative",
      children: [jsx("div", {
        class: "absolute left-2.5 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none",
        children: jsx("svg", {
          class: "w-3.5 h-3.5",
          fill: "none",
          stroke: "currentColor",
          viewBox: "0 0 24 24",
          children: jsx("path", {
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-width": "1.5",
            d: "M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z"
          })
        })
      }), jsx("input", {
        ref: inputRef,
        type: "text",
        value: query,
        onInput: handleInput,
        onKeyDown: handleKeyDown,
        onFocus: () => {
          if (results.length > 0) setIsOpen(true);
        },
        placeholder: ready ? placeholder : "Loading projects...",
        disabled: !ready && loading,
        class: "w-full bg-navy border border-card-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-text placeholder-text-dim/60 focus:outline-none focus:border-gold/30 transition-colors disabled:opacity-60",
        autocomplete: "off",
        role: "combobox",
        "aria-expanded": isOpen,
        "aria-autocomplete": "list"
      }), loading && !ready && jsx("div", {
        class: "absolute right-2.5 top-1/2 -translate-y-1/2",
        children: jsx("div", {
          class: "w-3 h-3 border border-gold/40 border-t-gold rounded-full animate-spin"
        })
      })]
    }), isOpen && results.length > 0 && jsx("div", {
      ref: listRef,
      class: "absolute z-50 left-0 right-0 mt-1 bg-navy-mid border border-card-border rounded-lg shadow-xl overflow-y-auto",
      style: {
        maxHeight: "240px"
      },
      role: "listbox",
      children: results.map((project, idx) => {
        const color = getTierColor(project.tier);
        const isActive = idx === activeIndex;
        return jsxs("button", {
          type: "button",
          onClick: () => handleSelect(project),
          onMouseEnter: () => setActiveIndex(idx),
          class: `w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${isActive ? "bg-white/5" : "hover:bg-white/[0.03]"}`,
          role: "option",
          "aria-selected": isActive,
          children: [jsx("span", {
            class: "w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0",
            style: {
              backgroundColor: `${color}20`,
              color
            },
            children: project.tier?.toUpperCase() || "–"
          }), jsxs("span", {
            class: "flex-1 min-w-0",
            children: [jsx("span", {
              class: "text-xs font-medium text-text truncate block",
              children: project.name
            }), jsxs("span", {
              class: "text-[10px] text-text-dim",
              children: [project.symbol, project.category ? ` · ${project.category}` : ""]
            })]
          }), project.chapter && jsx("span", {
            class: "text-[10px] text-text-dim/60 shrink-0 truncate max-w-[90px]",
            children: project.chapter
          })]
        }, `${project.symbol}-${project.name}-${idx}`);
      })
    })]
  });
}

const OPTIONS = [{
  key: "bullish",
  label: "Bullish",
  glyph: "▲",
  activeClass: "bg-gold/15 border-gold/40 text-gold",
  inactiveClass: "border-card-border text-text-dim hover:text-gold hover:border-gold/20"
}, {
  key: "neutral",
  label: "Neutral",
  glyph: "▬",
  activeClass: "bg-white/5 border-text-dim/40 text-text",
  inactiveClass: "border-card-border text-text-dim hover:text-text hover:border-text-dim/30"
}, {
  key: "bearish",
  label: "Bearish",
  glyph: "▼",
  activeClass: "bg-white/5 border-text-dim/40 text-text-dim",
  inactiveClass: "border-card-border text-text-dim hover:text-text hover:border-text-dim/30"
}];
function ConvictionToggle({
  value,
  onChange,
  showLabel = true
}) {
  return jsxs("div", {
    class: "flex flex-col gap-1.5",
    children: [showLabel && jsx("span", {
      class: "text-[10px] uppercase tracking-wider text-text-dim/70",
      children: "Your conviction"
    }), jsx("div", {
      class: "flex items-center gap-1.5",
      role: "radiogroup",
      "aria-label": "Conviction",
      children: OPTIONS.map((opt) => {
        const active = value === opt.key;
        return jsxs("button", {
          type: "button",
          role: "radio",
          "aria-checked": active,
          onClick: () => onChange(active ? null : opt.key),
          class: `inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border transition-colors ${active ? opt.activeClass : opt.inactiveClass}`,
          title: active ? `${opt.label} — click to clear` : `Mark as ${opt.label.toLowerCase()}`,
          children: [jsx("span", {
            "aria-hidden": "true",
            class: "text-[10px] leading-none",
            children: opt.glyph
          }), jsx("span", {
            class: "font-medium",
            children: opt.label
          })]
        }, opt.key);
      })
    })]
  });
}

let convictionColumnMissing = false;
function PostComposer({
  onPost
}) {
  const {
    user,
    profile,
    loading
  } = useAuth();
  const [content, setContent] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [project, setProject] = useState(null);
  const [conviction, setConviction] = useState(null);
  const [focused, setFocused] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  if (loading) {
    return jsx("div", {
      class: "rounded-xl bg-card-bg border border-card-border p-5 animate-pulse",
      children: jsxs("div", {
        class: "flex gap-3",
        children: [jsx("div", {
          class: "w-10 h-10 rounded-full bg-navy-mid shrink-0"
        }), jsxs("div", {
          class: "flex-1 space-y-2",
          children: [jsx("div", {
            class: "h-3 bg-navy-mid rounded w-1/3"
          }), jsx("div", {
            class: "h-3 bg-navy-mid rounded w-2/3"
          })]
        })]
      })
    });
  }
  if (!user) {
    return jsxs("div", {
      class: "rounded-xl bg-card-bg border border-card-border p-5 text-center",
      children: [jsx("p", {
        class: "text-sm text-text-dim mb-3",
        children: "Sign in to share your thoughts with the community"
      }), jsx("a", {
        href: "/social/login",
        class: "inline-block px-5 py-2 rounded-full bg-gold text-navy text-sm font-medium hover:bg-gold-light transition-colors",
        children: "Sign in to post"
      })]
    });
  }
  const initials = (profile?.display_name || user.email || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const addTag = () => {
    const tag = tagInput.trim().replace(/^#/, "");
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };
  const removeTag = (tag) => {
    setTags(tags.filter((t) => t !== tag));
  };
  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      const basePayload = {
        author_id: user.id,
        content: content.trim(),
        media_urls: [],
        link_url: null,
        link_preview: null,
        project_tag: project?.name ?? null,
        project_tier: project?.tier ?? null
      };
      const payload = project && conviction && !convictionColumnMissing ? {
        ...basePayload,
        conviction
      } : basePayload;
      let insert = await supabase.from("posts").insert(payload).select("*, author:profiles!posts_author_id_fkey(*)").single();
      if (insert.error && !convictionColumnMissing && /conviction/i.test(insert.error.message || "")) {
        console.warn("[PostComposer] conviction column missing — falling back. Run supabase/migrations/002_conviction.sql to enable it.");
        convictionColumnMissing = true;
        insert = await supabase.from("posts").insert(basePayload).select("*, author:profiles!posts_author_id_fkey(*)").single();
      }
      if (insert.error) throw new Error(insert.error.message);
      const post = insert.data;
      if (!post) throw new Error("Post creation returned null");
      await supabase.rpc("increment_counter", {
        row_id: user.id,
        table_name: "profiles",
        column_name: "post_count",
        amount: 1
      });
      setContent("");
      setTags([]);
      setTagInput("");
      setProject(null);
      setConviction(null);
      onPost?.();
    } catch (err) {
      console.error("Failed to create post:", err?.message || err);
    } finally {
      setSubmitting(false);
    }
  };
  return jsxs("form", {
    onSubmit: handleSubmit,
    class: `rounded-xl bg-card-bg border transition-colors p-5 ${focused ? "border-gold/30" : "border-card-border"}`,
    children: [jsxs("div", {
      class: "flex gap-3",
      children: [profile?.avatar_url ? jsx("img", {
        src: profile.avatar_url,
        alt: profile.display_name,
        class: "w-10 h-10 rounded-full object-cover border border-card-border shrink-0"
      }) : jsx("div", {
        class: "w-10 h-10 rounded-full bg-accent/20 border border-card-border flex items-center justify-center text-accent text-sm font-semibold shrink-0",
        children: initials
      }), jsxs("div", {
        class: "flex-1",
        children: [jsx("textarea", {
          value: content,
          onInput: (e) => setContent(e.target.value),
          onFocus: () => setFocused(true),
          onBlur: () => setFocused(false),
          placeholder: "Share an insight, question, or discovery...",
          rows: focused || content ? 4 : 2,
          class: "w-full bg-transparent text-sm text-text placeholder-text-dim resize-none focus:outline-none transition-all"
        }), (focused || tags.length > 0) && jsx("div", {
          class: "mt-2 pt-2 border-t border-card-border",
          children: jsxs("div", {
            class: "flex flex-wrap gap-1.5 items-center",
            children: [tags.map((tag) => jsxs("span", {
              class: "inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold",
              children: ["#", tag, jsx("button", {
                type: "button",
                onClick: () => removeTag(tag),
                class: "hover:text-gold-light transition-colors",
                children: "x"
              })]
            }, tag)), tags.length < 5 && jsx("input", {
              type: "text",
              value: tagInput,
              onInput: (e) => setTagInput(e.target.value),
              onKeyDown: handleTagKeyDown,
              placeholder: "Add topic tag...",
              class: "bg-transparent text-xs text-text-dim placeholder-text-dim/50 focus:outline-none min-w-[100px] flex-1 py-1"
            })]
          })
        })]
      })]
    }), (focused || project || content) && jsxs("div", {
      class: "mt-3 pl-[52px] space-y-2",
      children: [jsx(ProjectPicker, {
        value: project,
        onChange: (p) => {
          setProject(p);
          if (!p) setConviction(null);
        },
        placeholder: "Tag a project (optional)"
      }), project && jsx(ConvictionToggle, {
        value: conviction,
        onChange: setConviction
      })]
    }), jsxs("div", {
      class: "flex items-center justify-between mt-3 pt-3 border-t border-card-border",
      children: [jsxs("div", {
        class: "flex gap-2",
        children: [jsx("button", {
          type: "button",
          class: "text-text-dim hover:text-gold transition-colors p-1.5 rounded-lg hover:bg-gold/5",
          title: "Attach image",
          children: jsx("svg", {
            class: "w-5 h-5",
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24",
            children: jsx("path", {
              "stroke-linecap": "round",
              "stroke-linejoin": "round",
              "stroke-width": "1.5",
              d: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            })
          })
        }), jsx("button", {
          type: "button",
          class: "text-text-dim hover:text-gold transition-colors p-1.5 rounded-lg hover:bg-gold/5",
          title: "Link a resource",
          children: jsx("svg", {
            class: "w-5 h-5",
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24",
            children: jsx("path", {
              "stroke-linecap": "round",
              "stroke-linejoin": "round",
              "stroke-width": "1.5",
              d: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            })
          })
        })]
      }), jsx("button", {
        type: "submit",
        disabled: !content.trim() || submitting,
        class: "px-5 py-1.5 rounded-full bg-gold text-navy text-sm font-medium hover:bg-gold-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed",
        children: submitting ? "Posting..." : "Post"
      })]
    })]
  });
}

const $$Index = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "SocialLayout", $$SocialLayout, { "title": "Social" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6"> <!-- Left sidebar --> <aside class="hidden lg:block lg:col-span-3 space-y-4"> <div class="rounded-xl bg-card-bg border border-card-border p-5"> <h3 class="font-heading text-lg text-gold mb-3">Welcome</h3> <p class="text-sm text-text-dim leading-relaxed">
Connect with fellow seekers, share insights, and explore conscious living together.
</p> <a href="/social/login" class="mt-4 block text-center px-4 py-2 rounded-lg bg-gold/10 border border-gold/30 text-gold text-sm font-medium hover:bg-gold/20 transition-colors">
Sign In to Post
</a> </div> <div class="rounded-xl bg-card-bg border border-card-border p-5"> <h3 class="font-heading text-lg text-gold mb-3">Trending Topics</h3> <ul class="space-y-2 text-sm"> <li><a href="#" class="text-text-dim hover:text-gold transition-colors"># Meditation</a></li> <li><a href="#" class="text-text-dim hover:text-gold transition-colors"># Quantum Consciousness</a></li> <li><a href="#" class="text-text-dim hover:text-gold transition-colors"># Sound Healing</a></li> <li><a href="#" class="text-text-dim hover:text-gold transition-colors"># Sacred Geometry</a></li> <li><a href="#" class="text-text-dim hover:text-gold transition-colors"># Plant Medicine</a></li> </ul> </div> </aside> <!-- Main feed --> <section class="lg:col-span-6 space-y-6"> ${renderComponent($$result2, "PostComposer", PostComposer, { "client:load": true, "client:component-hydration": "load", "client:component-path": "/sessions/relaxed-keen-euler/mnt/FRQNCY WEBSITE/social/src/components/PostComposer", "client:component-export": "default" })} ${renderComponent($$result2, "Feed", Feed, { "client:load": true, "client:component-hydration": "load", "client:component-path": "/sessions/relaxed-keen-euler/mnt/FRQNCY WEBSITE/social/src/components/Feed", "client:component-export": "default" })} </section> <!-- Right sidebar --> <aside class="hidden lg:block lg:col-span-3 space-y-4"> <div class="rounded-xl bg-card-bg border border-card-border p-5"> <h3 class="font-heading text-lg text-gold mb-3">Suggested People</h3> <ul class="space-y-3"> <li class="flex items-center gap-3"> <div class="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-semibold">R</div> <div class="flex-1 min-w-0"> <p class="text-sm text-text truncate">Ram Dass</p> <p class="text-xs text-text-dim">Consciousness</p> </div> <button class="text-xs text-gold border border-gold/30 rounded-full px-2.5 py-0.5 hover:bg-gold/10 transition-colors">Follow</button> </li> <li class="flex items-center gap-3"> <div class="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold text-xs font-semibold">A</div> <div class="flex-1 min-w-0"> <p class="text-sm text-text truncate">Alan Watts</p> <p class="text-xs text-text-dim">Philosophy</p> </div> <button class="text-xs text-gold border border-gold/30 rounded-full px-2.5 py-0.5 hover:bg-gold/10 transition-colors">Follow</button> </li> <li class="flex items-center gap-3"> <div class="w-8 h-8 rounded-full bg-gold-light/20 flex items-center justify-center text-gold-light text-xs font-semibold">T</div> <div class="flex-1 min-w-0"> <p class="text-sm text-text truncate">Terence McKenna</p> <p class="text-xs text-text-dim">Psychedelics</p> </div> <button class="text-xs text-gold border border-gold/30 rounded-full px-2.5 py-0.5 hover:bg-gold/10 transition-colors">Follow</button> </li> </ul> </div> <div class="rounded-xl bg-card-bg border border-card-border p-5"> <h3 class="font-heading text-lg text-gold mb-3">Explore</h3> <div class="flex flex-wrap gap-2"> <a href="/v2/explore.html" class="text-xs px-3 py-1 rounded-full bg-navy-mid border border-card-border text-text-dim hover:text-gold hover:border-gold/30 transition-colors">Network Map</a> <a href="/social/search" class="text-xs px-3 py-1 rounded-full bg-navy-mid border border-card-border text-text-dim hover:text-gold hover:border-gold/30 transition-colors">Search</a> <a href="/v2/courses/index.html" class="text-xs px-3 py-1 rounded-full bg-navy-mid border border-card-border text-text-dim hover:text-gold hover:border-gold/30 transition-colors">Courses</a> <a href="/podcast.html" class="text-xs px-3 py-1 rounded-full bg-navy-mid border border-card-border text-text-dim hover:text-gold hover:border-gold/30 transition-colors">Podcast</a> </div> </div> </aside> </div> ` })}`;
}, "/sessions/relaxed-keen-euler/mnt/FRQNCY WEBSITE/social/src/pages/index.astro", void 0);

const $$file = "/sessions/relaxed-keen-euler/mnt/FRQNCY WEBSITE/social/src/pages/index.astro";
const $$url = "/social";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
