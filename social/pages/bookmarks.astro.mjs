/* empty css                                     */
import { c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_C8GjfOXF.mjs';
import 'piccolore';
import 'html-escaper';
import { u as useAuth, $ as $$SocialLayout } from '../chunks/SocialLayout_BQoA4DU3.mjs';
import { useState, useEffect } from 'preact/hooks';
import { g as getUserBookmarks } from '../chunks/api_3ASLHgzT.mjs';
import { jsx, jsxs } from 'preact/jsx-runtime';
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
function BookmarksView() {
  const {
    user,
    loading: authLoading
  } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const data = await getUserBookmarks(user.id, 100);
      if (!cancelled) {
        setPosts(data);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);
  if (authLoading || loading) {
    return jsx("div", {
      class: "space-y-4",
      children: [1, 2, 3].map((i) => jsx("div", {
        class: "rounded-xl bg-card-bg border border-card-border p-5 animate-pulse",
        children: jsxs("div", {
          class: "flex gap-3",
          children: [jsx("div", {
            class: "w-10 h-10 rounded-full bg-navy-mid"
          }), jsxs("div", {
            class: "flex-1 space-y-2",
            children: [jsx("div", {
              class: "h-3 bg-navy-mid rounded w-1/3"
            }), jsx("div", {
              class: "h-3 bg-navy-mid rounded w-full"
            }), jsx("div", {
              class: "h-3 bg-navy-mid rounded w-2/3"
            })]
          })]
        })
      }, i))
    });
  }
  if (!user) {
    return jsxs("div", {
      class: "rounded-2xl bg-card-bg border border-card-border p-8 text-center space-y-3",
      children: [jsx("p", {
        class: "font-heading text-xl text-gold",
        children: "Sign in to see your bookmarks"
      }), jsx("p", {
        class: "text-sm text-text-dim max-w-md mx-auto",
        children: "Bookmarks are a private reading list. They live with your account so you can come back to posts worth returning to."
      }), jsx("a", {
        href: "/social/login",
        class: "inline-block text-xs px-4 py-2 rounded-full bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20 transition-colors mt-2",
        children: "Sign in →"
      })]
    });
  }
  if (posts.length === 0) {
    return jsxs("div", {
      class: "rounded-2xl bg-card-bg border border-card-border p-8 text-center space-y-3",
      children: [jsx("p", {
        class: "font-heading text-xl text-gold",
        children: "No bookmarks yet"
      }), jsx("p", {
        class: "text-sm text-text-dim max-w-md mx-auto",
        children: 'Tap the bookmark icon on any post to save it here. Think of this as a private reading list, not a "like."'
      }), jsx("a", {
        href: "/social",
        class: "inline-block text-xs px-4 py-2 rounded-full bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20 transition-colors mt-2",
        children: "Browse the feed →"
      })]
    });
  }
  return jsx("div", {
    class: "space-y-3",
    children: posts.map((post) => {
      const author = post.author;
      const conviction = post.conviction;
      return jsxs("article", {
        class: "rounded-xl bg-card-bg border border-card-border hover:border-gold/30 p-4 md:p-5 transition-colors",
        children: [jsxs("header", {
          class: "flex items-center gap-3 mb-3",
          children: [jsx("a", {
            href: author ? `/social/profile/${author.username}` : "#",
            class: "w-10 h-10 rounded-full bg-navy-mid overflow-hidden border border-card-border flex-shrink-0",
            children: author?.avatar_url ? jsx("img", {
              src: author.avatar_url,
              alt: author.display_name,
              class: "w-full h-full object-cover"
            }) : jsx("div", {
              class: "w-full h-full flex items-center justify-center text-gold font-heading",
              children: (author?.display_name || author?.username || "?")[0]?.toUpperCase()
            })
          }), jsxs("div", {
            class: "min-w-0 flex-1",
            children: [jsx("a", {
              href: author ? `/social/profile/${author.username}` : "#",
              class: "font-heading text-text hover:text-gold truncate block",
              children: author?.display_name || author?.username || "Anonymous"
            }), jsxs("p", {
              class: "text-xs text-text-dim",
              children: ["@", author?.username, " · ", timeAgo(post.created_at)]
            })]
          }), jsxs("div", {
            class: "flex gap-1.5 flex-shrink-0",
            children: [conviction === "bullish" && jsx("span", {
              class: "text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400",
              children: "▲ Bullish"
            }), conviction === "bearish" && jsx("span", {
              class: "text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400",
              children: "▼ Bearish"
            }), conviction === "neutral" && jsx("span", {
              class: "text-[10px] px-2 py-0.5 rounded-full bg-gold/10 border border-gold/30 text-gold",
              children: "◆ Neutral"
            }), post.project_tag && jsxs("span", {
              class: "text-[10px] px-2 py-0.5 rounded-full bg-navy-mid border border-card-border text-text-dim",
              children: ["$", post.project_tag]
            })]
          })]
        }), jsx("p", {
          class: "text-sm text-text-dim leading-relaxed whitespace-pre-wrap",
          children: post.content
        }), jsxs("footer", {
          class: "flex gap-5 text-xs text-text-dim mt-3 pt-3 border-t border-card-border",
          children: [jsxs("span", {
            children: ["♡ ", post.likes_count ?? 0]
          }), jsxs("span", {
            children: ["💬 ", post.comments_count ?? 0]
          }), jsx("span", {
            class: "text-gold",
            children: "⧖ Bookmarked"
          })]
        })]
      }, post.id);
    })
  });
}

const $$Bookmarks = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "SocialLayout", $$SocialLayout, { "title": "Bookmarks", "description": "Your private reading list on FRQNCY Social." }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<article class="max-w-3xl mx-auto mt-8 pb-16 space-y-8"> <header class="space-y-2"> <p class="text-xs uppercase tracking-[0.25em] text-gold/70 font-body">Saved</p> <h1 class="font-heading text-3xl md:text-4xl text-gold leading-tight">
Bookmarks
</h1> <p class="text-base text-text-dim leading-relaxed max-w-2xl">
Private. Chronological. Yours. Bookmarks never affect ranking and never notify the author — they're a reading list, not a signal.
</p> </header> ${renderComponent($$result2, "BookmarksView", BookmarksView, { "client:load": true, "client:component-hydration": "load", "client:component-path": "/sessions/relaxed-keen-euler/mnt/FRQNCY WEBSITE/social/src/components/BookmarksView", "client:component-export": "default" })} </article> ` })}`;
}, "/sessions/relaxed-keen-euler/mnt/FRQNCY WEBSITE/social/src/pages/bookmarks.astro", void 0);

const $$file = "/sessions/relaxed-keen-euler/mnt/FRQNCY WEBSITE/social/src/pages/bookmarks.astro";
const $$url = "/social/bookmarks";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Bookmarks,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
