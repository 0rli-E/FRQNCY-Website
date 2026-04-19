/* empty css                                     */
import { c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_C8GjfOXF.mjs';
import 'piccolore';
import 'html-escaper';
import { $ as $$SocialLayout } from '../chunks/SocialLayout_BQoA4DU3.mjs';
import { useState, useRef, useEffect } from 'preact/hooks';
import { s as searchAll } from '../chunks/api_3ASLHgzT.mjs';
import { jsxs, jsx } from 'preact/jsx-runtime';
export { renderers } from '../renderers.mjs';

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1e3);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
function highlight(text, q) {
  if (!q.trim()) return text;
  const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"));
  return parts.map((p, i) => p.toLowerCase() === q.toLowerCase() ? jsx("mark", {
    class: "bg-gold/20 text-gold px-0.5 rounded-sm",
    children: p
  }) : p);
}
function SearchView() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const debounceRef = useRef(null);
  const inputRef = useRef(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q") || "";
    if (q) {
      setQuery(q);
      runSearch(q);
    }
    inputRef.current?.focus();
  }, []);
  async function runSearch(q) {
    if (!q.trim()) {
      setResults(null);
      return;
    }
    setLoading(true);
    const data = await searchAll(q);
    setResults(data);
    setLoading(false);
  }
  function onInput(e) {
    const v = e.currentTarget.value;
    setQuery(v);
    const url = new URL(window.location.href);
    if (v) url.searchParams.set("q", v);
    else url.searchParams.delete("q");
    window.history.replaceState({}, "", url.toString());
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => runSearch(v), 250);
  }
  const counts = results ? {
    posts: results.posts.length,
    people: results.profiles.length,
    projects: results.projects.length
  } : {
    posts: 0,
    people: 0,
    projects: 0
  };
  const totalCount = counts.posts + counts.people + counts.projects;
  return jsxs("div", {
    class: "space-y-6",
    children: [jsxs("div", {
      class: "relative",
      children: [jsx("svg", {
        class: "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-dim pointer-events-none",
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: jsx("path", {
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          "stroke-width": "1.5",
          d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        })
      }), jsx("input", {
        ref: inputRef,
        type: "text",
        value: query,
        onInput,
        placeholder: "Search posts, people, projects...",
        class: "w-full bg-card-bg border border-card-border rounded-full pl-12 pr-4 py-3.5 text-text placeholder-text-dim focus:outline-none focus:border-gold/40 transition-colors"
      }), query && jsx("button", {
        onClick: () => {
          setQuery("");
          setResults(null);
          const url = new URL(window.location.href);
          url.searchParams.delete("q");
          window.history.replaceState({}, "", url.toString());
          inputRef.current?.focus();
        },
        class: "absolute right-4 top-1/2 -translate-y-1/2 text-text-dim hover:text-gold text-sm",
        "aria-label": "Clear",
        children: "✕"
      })]
    }), results && totalCount > 0 && jsx("div", {
      class: "flex gap-1 border-b border-card-border text-sm",
      children: [["all", "All", totalCount], ["posts", "Posts", counts.posts], ["people", "People", counts.people], ["projects", "Projects", counts.projects]].map(([key, label, n]) => jsxs("button", {
        onClick: () => setActiveTab(key),
        class: `px-4 py-2 border-b-2 transition-colors ${activeTab === key ? "border-gold text-gold" : "border-transparent text-text-dim hover:text-text"}`,
        children: [label, " ", jsx("span", {
          class: "text-xs opacity-60",
          children: n
        })]
      }, key))
    }), loading && jsx("div", {
      class: "py-12 text-center text-text-dim text-sm",
      children: "Searching…"
    }), !loading && !results && jsxs("div", {
      class: "py-16 text-center space-y-3",
      children: [jsx("p", {
        class: "text-text-dim",
        children: "Search the network."
      }), jsxs("p", {
        class: "text-xs text-text-dim/70",
        children: ["Try a project symbol like ", jsx("span", {
          class: "text-gold",
          children: "BTC"
        }), ", a handle, or a phrase from a post."]
      })]
    }), !loading && results && totalCount === 0 && jsxs("div", {
      class: "rounded-xl bg-card-bg border border-card-border p-8 text-center",
      children: [jsxs("p", {
        class: "text-text-dim",
        children: ['No results for "', jsx("span", {
          class: "text-text",
          children: query
        }), '".']
      }), jsx("p", {
        class: "text-xs text-text-dim/70 mt-2",
        children: "Try a broader term or a project symbol."
      })]
    }), !loading && results && totalCount > 0 && jsxs("div", {
      class: "space-y-10",
      children: [(activeTab === "all" || activeTab === "projects") && results.projects.length > 0 && jsxs("section", {
        class: "space-y-3",
        children: [activeTab === "all" && jsxs("h2", {
          class: "font-heading text-lg text-gold flex items-baseline gap-2",
          children: ["Projects ", jsxs("span", {
            class: "text-xs text-text-dim",
            children: ["· ", results.projects.length]
          })]
        }), jsx("div", {
          class: "grid md:grid-cols-2 gap-3",
          children: results.projects.map((p) => jsx("div", {
            class: "rounded-xl bg-card-bg border border-card-border hover:border-gold/30 p-4 transition-colors",
            children: jsxs("div", {
              class: "flex items-start justify-between gap-3",
              children: [jsxs("div", {
                class: "min-w-0",
                children: [jsx("p", {
                  class: "font-heading text-gold",
                  children: highlight(p.name, query)
                }), jsxs("p", {
                  class: "text-xs text-text-dim mt-0.5",
                  children: [highlight(p.symbol, query), " · ", p.category]
                })]
              }), jsx("span", {
                class: "text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border flex-shrink-0",
                style: {
                  color: p.accent,
                  borderColor: `${p.accent}40`
                },
                children: p.tierLabel
              })]
            })
          }, `${p.symbol}-${p.name}`))
        })]
      }), (activeTab === "all" || activeTab === "people") && results.profiles.length > 0 && jsxs("section", {
        class: "space-y-3",
        children: [activeTab === "all" && jsxs("h2", {
          class: "font-heading text-lg text-gold flex items-baseline gap-2",
          children: ["People ", jsxs("span", {
            class: "text-xs text-text-dim",
            children: ["· ", results.profiles.length]
          })]
        }), jsx("div", {
          class: "grid md:grid-cols-2 gap-3",
          children: results.profiles.map((pr) => jsxs("a", {
            href: `/social/profile/${pr.username}`,
            class: "rounded-xl bg-card-bg border border-card-border hover:border-gold/30 p-4 transition-colors flex gap-3 items-center",
            children: [jsx("div", {
              class: "w-10 h-10 rounded-full bg-navy-mid overflow-hidden flex-shrink-0 border border-card-border",
              children: pr.avatar_url ? jsx("img", {
                src: pr.avatar_url,
                alt: pr.display_name,
                class: "w-full h-full object-cover"
              }) : jsx("div", {
                class: "w-full h-full flex items-center justify-center text-gold font-heading",
                children: (pr.display_name || pr.username || "?")[0].toUpperCase()
              })
            }), jsxs("div", {
              class: "min-w-0 flex-1",
              children: [jsx("p", {
                class: "font-heading text-text truncate",
                children: highlight(pr.display_name || pr.username, query)
              }), jsxs("p", {
                class: "text-xs text-text-dim truncate",
                children: ["@", highlight(pr.username, query)]
              })]
            }), jsxs("div", {
              class: "text-right flex-shrink-0 text-xs text-text-dim",
              children: [jsx("p", {
                children: pr.follower_count ?? 0
              }), jsx("p", {
                class: "opacity-60",
                children: "followers"
              })]
            })]
          }, pr.id))
        })]
      }), (activeTab === "all" || activeTab === "posts") && results.posts.length > 0 && jsxs("section", {
        class: "space-y-3",
        children: [activeTab === "all" && jsxs("h2", {
          class: "font-heading text-lg text-gold flex items-baseline gap-2",
          children: ["Posts ", jsxs("span", {
            class: "text-xs text-text-dim",
            children: ["· ", results.posts.length]
          })]
        }), jsx("div", {
          class: "space-y-3",
          children: results.posts.map((post) => {
            const author = post.author;
            return jsxs("article", {
              class: "rounded-xl bg-card-bg border border-card-border hover:border-gold/30 p-4 transition-colors",
              children: [jsxs("header", {
                class: "flex items-center gap-3 mb-2",
                children: [jsx("a", {
                  href: author ? `/social/profile/${author.username}` : "#",
                  class: "w-8 h-8 rounded-full bg-navy-mid overflow-hidden border border-card-border flex-shrink-0",
                  children: author?.avatar_url ? jsx("img", {
                    src: author.avatar_url,
                    alt: author.display_name,
                    class: "w-full h-full object-cover"
                  }) : jsx("div", {
                    class: "w-full h-full flex items-center justify-center text-gold font-heading text-xs",
                    children: (author?.display_name || author?.username || "?")[0]?.toUpperCase()
                  })
                }), jsxs("div", {
                  class: "min-w-0 flex-1 flex items-baseline gap-2",
                  children: [jsx("a", {
                    href: author ? `/social/profile/${author.username}` : "#",
                    class: "font-heading text-sm text-text hover:text-gold truncate",
                    children: author?.display_name || author?.username || "Anonymous"
                  }), jsxs("span", {
                    class: "text-xs text-text-dim",
                    children: ["· ", timeAgo(post.created_at)]
                  })]
                }), post.project_tag && jsxs("span", {
                  class: "text-[10px] px-2 py-0.5 rounded-full bg-gold/10 border border-gold/30 text-gold flex-shrink-0",
                  children: ["$", post.project_tag]
                })]
              }), jsx("p", {
                class: "text-sm text-text-dim leading-relaxed whitespace-pre-wrap",
                children: highlight(post.content, query)
              }), jsxs("footer", {
                class: "flex gap-4 text-xs text-text-dim mt-3 pt-2 border-t border-card-border",
                children: [jsxs("span", {
                  children: ["♡ ", post.likes_count ?? 0]
                }), jsxs("span", {
                  children: ["💬 ", post.comments_count ?? 0]
                }), jsxs("span", {
                  children: ["⧖ ", post.bookmarks_count ?? 0]
                })]
              })]
            }, post.id);
          })
        })]
      })]
    })]
  });
}

const $$Search = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "SocialLayout", $$SocialLayout, { "title": "Search", "description": "Search across FRQNCY Social \u2014 posts, people, and the 604-resource project corpus." }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<article class="max-w-4xl mx-auto mt-8 pb-16 space-y-8"> <header class="space-y-2"> <p class="text-xs uppercase tracking-[0.25em] text-gold/70 font-body">Find</p> <h1 class="font-heading text-3xl md:text-4xl text-gold leading-tight">
Search the network
</h1> <p class="text-base text-text-dim leading-relaxed max-w-2xl">
One search — posts, people, and projects. Results update as you type. The project corpus is the same 604-resource, 133-topic graph that powers the main site.
</p> </header> ${renderComponent($$result2, "SearchView", SearchView, { "client:load": true, "client:component-hydration": "load", "client:component-path": "/sessions/relaxed-keen-euler/mnt/FRQNCY WEBSITE/social/src/components/SearchView", "client:component-export": "default" })} </article> ` })}`;
}, "/sessions/relaxed-keen-euler/mnt/FRQNCY WEBSITE/social/src/pages/search.astro", void 0);

const $$file = "/sessions/relaxed-keen-euler/mnt/FRQNCY WEBSITE/social/src/pages/search.astro";
const $$url = "/social/search";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Search,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
