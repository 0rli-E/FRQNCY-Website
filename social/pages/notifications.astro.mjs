/* empty css                                     */
import { c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_C8GjfOXF.mjs';
import 'piccolore';
import 'html-escaper';
import { u as useAuth, s as supabase, $ as $$SocialLayout } from '../chunks/SocialLayout_BQoA4DU3.mjs';
import { useState, useEffect } from 'preact/hooks';
import { jsx, jsxs, Fragment } from 'preact/jsx-runtime';
export { renderers } from '../renderers.mjs';

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1e3);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
function notifText(n) {
  switch (n.type) {
    case "follow":
      return "started following you";
    case "like":
      return "liked your post";
    case "comment":
      return "commented on your post";
    case "mention":
      return "mentioned you in a post";
    case "friend_request":
      return "sent you a friend request";
    case "friend_accept":
      return "accepted your friend request";
    case "message":
      return "sent you a message";
    default:
      return n.type;
  }
}
function NotificationsList() {
  const {
    user,
    loading: authLoading
  } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const {
        data,
        error
      } = await supabase.from("notifications").select("id, type, actor_id, ref_type, ref_id, is_read, created_at, actor:profiles!actor_id(username, display_name, avatar_url)").eq("target_user_id", user.id).order("created_at", {
        ascending: false
      }).limit(50);
      if (cancelled) return;
      if (!error && data) {
        setItems(data);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);
  if (authLoading || loading) {
    return jsx("div", {
      class: "space-y-2",
      children: [1, 2, 3].map((i) => jsx("div", {
        class: "rounded-xl bg-card-bg border border-card-border p-4 animate-pulse",
        children: jsxs("div", {
          class: "flex gap-3",
          children: [jsx("div", {
            class: "w-10 h-10 rounded-full bg-navy-mid"
          }), jsxs("div", {
            class: "flex-1 space-y-2",
            children: [jsx("div", {
              class: "h-3 bg-navy-mid rounded w-2/3"
            }), jsx("div", {
              class: "h-2 bg-navy-mid rounded w-1/4"
            })]
          })]
        })
      }, i))
    });
  }
  if (!user) {
    return jsxs("div", {
      class: "rounded-xl bg-card-bg border border-card-border p-8 text-center",
      children: [jsx("p", {
        class: "text-text-dim text-sm mb-4",
        children: "Sign in to see your notifications."
      }), jsx("a", {
        href: "/social/login",
        class: "inline-block px-4 py-2 rounded-lg bg-gold/10 border border-gold/30 text-gold text-sm font-medium hover:bg-gold/20 transition-colors",
        children: "Sign In"
      })]
    });
  }
  const filtered = items.filter((n) => {
    if (tab === "all") return true;
    if (tab === "mentions") return n.type === "mention";
    if (tab === "follows") return n.type === "follow";
    if (tab === "likes") return n.type === "like";
    return true;
  });
  return jsxs(Fragment, {
    children: [jsx("div", {
      class: "flex gap-1 mb-6 bg-card-bg rounded-lg p-1 border border-card-border",
      children: ["all", "mentions", "follows", "likes"].map((t) => jsx("button", {
        onClick: () => setTab(t),
        class: `flex-1 text-sm py-2 rounded-md font-medium transition-colors capitalize ${tab === t ? "bg-navy-mid text-gold" : "text-text-dim hover:text-text"}`,
        children: t
      }, t))
    }), filtered.length === 0 ? jsx("div", {
      class: "rounded-xl bg-card-bg border border-card-border p-8 text-center",
      children: jsx("p", {
        class: "text-text-dim text-sm",
        children: tab === "all" ? "You're all caught up — no notifications yet." : `No ${tab} yet.`
      })
    }) : jsx("div", {
      class: "space-y-2",
      children: filtered.map((n) => {
        const actor = n.actor;
        const initial = (actor?.display_name || actor?.username || "?").charAt(0).toUpperCase();
        return jsxs("div", {
          class: "rounded-xl bg-card-bg border border-card-border p-4 flex items-start gap-3 hover:border-gold/20 transition-colors",
          children: [jsx("div", {
            class: "w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-semibold shrink-0 overflow-hidden",
            children: actor?.avatar_url ? jsx("img", {
              src: actor.avatar_url,
              alt: actor.display_name,
              class: "w-full h-full object-cover"
            }) : initial
          }), jsxs("div", {
            class: "flex-1 min-w-0",
            children: [jsxs("p", {
              class: "text-sm text-text",
              children: [actor?.username ? jsx("a", {
                href: `/social/profile/${actor.username}`,
                class: "font-medium text-gold hover:text-gold-light transition-colors",
                children: actor.display_name || actor.username
              }) : jsx("span", {
                class: "font-medium text-gold",
                children: "Someone"
              }), " ", notifText(n)]
            }), jsx("p", {
              class: "text-xs text-text-dim mt-1",
              children: timeAgo(n.created_at)
            })]
          }), !n.is_read && jsx("div", {
            class: "w-2 h-2 rounded-full bg-gold shrink-0 mt-2"
          })]
        }, n.id);
      })
    })]
  });
}

const $$Notifications = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "SocialLayout", $$SocialLayout, { "title": "Notifications" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="max-w-2xl mx-auto mt-6"> <h1 class="font-heading text-3xl text-gold mb-6">Notifications</h1> ${renderComponent($$result2, "NotificationsList", NotificationsList, { "client:load": true, "client:component-hydration": "load", "client:component-path": "/sessions/relaxed-keen-euler/mnt/FRQNCY WEBSITE/social/src/components/NotificationsList", "client:component-export": "default" })} </div> ` })}`;
}, "/sessions/relaxed-keen-euler/mnt/FRQNCY WEBSITE/social/src/pages/notifications.astro", void 0);

const $$file = "/sessions/relaxed-keen-euler/mnt/FRQNCY WEBSITE/social/src/pages/notifications.astro";
const $$url = "/social/notifications";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Notifications,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
