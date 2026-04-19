import { c as createComponent, a as renderTemplate, d as renderSlot, r as renderComponent, e as renderHead, f as addAttribute, b as createAstro } from './astro/server_C8GjfOXF.mjs';
import 'piccolore';
import 'html-escaper';
import { useState, useEffect, useRef } from 'preact/hooks';
import { createClient } from '@supabase/supabase-js';
import { jsx, jsxs, Fragment } from 'preact/jsx-runtime';

const supabaseUrl = "https://vyazlspbmwmlyncdlezh.supabase.co";
const supabaseAnonKey = "sb_publishable_zFdrbkExarUfR2PAe4FcAQ_yvcL31CI";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const SUPABASE_URL = "https://vyazlspbmwmlyncdlezh.supabase.co";
const PROJECT_REF = SUPABASE_URL.replace("https://", "").split(".")[0];
const TOKEN_KEY = PROJECT_REF ? `sb-${PROJECT_REF}-auth-token` : "";
function readSessionFromStorage() {
  if (typeof window === "undefined" || !TOKEN_KEY) return null;
  try {
    const raw = window.localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const nowSec = Math.floor(Date.now() / 1e3);
    if (parsed?.expires_at && parsed.expires_at < nowSec) return null;
    return parsed?.user ?? null;
  } catch {
    return null;
  }
}
let state = {
  user: null,
  profile: null,
  loading: true
};
const listeners = /* @__PURE__ */ new Set();
let initialized = false;
function setState(next) {
  state = {
    ...state,
    ...next
  };
  listeners.forEach((cb) => cb(state));
}
async function fetchProfile(userId) {
  const {
    data,
    error
  } = await supabase.from("profiles").select("id, username, display_name, avatar_url, bio").eq("id", userId).single();
  if (error || !data) return null;
  return data;
}
function initAuthOnce() {
  if (initialized) return;
  if (typeof window === "undefined") return;
  initialized = true;
  const user = readSessionFromStorage();
  state = {
    user,
    profile: null,
    loading: false
  };
  if (user) {
    fetchProfile(user.id).then((profile) => {
      if (profile) setState({
        profile
      });
    });
  }
  supabase.auth.onAuthStateChange(async (_event, session) => {
    const u = session?.user ?? null;
    const p = u ? await fetchProfile(u.id) : null;
    setState({
      user: u,
      profile: p,
      loading: false
    });
  });
}
function useAuth() {
  const [snapshot, setSnapshot] = useState(state);
  useEffect(() => {
    initAuthOnce();
    const listener = (s) => setSnapshot(s);
    listeners.add(listener);
    setSnapshot(state);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  const signOut = async () => {
    await supabase.auth.signOut();
    setState({
      user: null,
      profile: null,
      loading: false
    });
  };
  return {
    user: snapshot.user,
    profile: snapshot.profile,
    loading: snapshot.loading,
    signOut
  };
}

function NavAuth() {
  const {
    user,
    profile,
    loading,
    signOut
  } = useAuth();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);
  if (loading) {
    return null;
  }
  if (!user) {
    return jsx("a", {
      href: "/social/login",
      class: "px-4 py-1.5 rounded-full bg-gold text-navy text-sm font-medium hover:bg-gold-light transition-colors",
      children: "Sign In"
    });
  }
  const initials = (profile?.display_name || user.email || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  return jsxs("div", {
    class: "relative",
    ref: dropdownRef,
    children: [jsx("button", {
      onClick: () => setOpen(!open),
      class: "flex items-center gap-2 focus:outline-none",
      children: profile?.avatar_url ? jsx("img", {
        src: profile.avatar_url,
        alt: profile.display_name,
        class: "w-8 h-8 rounded-full object-cover border border-card-border"
      }) : jsx("div", {
        class: "w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-semibold border border-card-border",
        children: initials
      })
    }), open && jsxs("div", {
      class: "absolute right-0 mt-2 w-48 rounded-xl bg-card-bg border border-card-border shadow-xl z-50 py-1 overflow-hidden",
      children: [jsxs("div", {
        class: "px-4 py-2 border-b border-card-border",
        children: [jsx("p", {
          class: "text-sm font-medium text-text truncate",
          children: profile?.display_name || "User"
        }), jsxs("p", {
          class: "text-xs text-text-dim truncate",
          children: ["@", profile?.username || "user"]
        })]
      }), jsxs("a", {
        href: `/social/profile/${profile?.username || ""}`,
        class: "flex items-center gap-2 px-4 py-2 text-sm text-text-dim hover:text-text hover:bg-navy-mid transition-colors",
        children: [jsx("svg", {
          class: "w-4 h-4",
          fill: "none",
          stroke: "currentColor",
          viewBox: "0 0 24 24",
          children: jsx("path", {
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-width": "1.5",
            d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          })
        }), "Profile"]
      }), jsxs("a", {
        href: "/social/messages",
        class: "flex items-center gap-2 px-4 py-2 text-sm text-text-dim hover:text-text hover:bg-navy-mid transition-colors",
        children: [jsx("svg", {
          class: "w-4 h-4",
          fill: "none",
          stroke: "currentColor",
          viewBox: "0 0 24 24",
          children: jsx("path", {
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-width": "1.5",
            d: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          })
        }), "Messages"]
      }), jsxs("a", {
        href: "/social/notifications",
        class: "flex items-center gap-2 px-4 py-2 text-sm text-text-dim hover:text-text hover:bg-navy-mid transition-colors",
        children: [jsx("svg", {
          class: "w-4 h-4",
          fill: "none",
          stroke: "currentColor",
          viewBox: "0 0 24 24",
          children: jsx("path", {
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-width": "1.5",
            d: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          })
        }), "Notifications"]
      }), jsx("div", {
        class: "border-t border-card-border mt-1",
        children: jsxs("button", {
          onClick: async () => {
            await signOut();
            setOpen(false);
            window.location.href = "/social/";
          },
          class: "flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/5 transition-colors",
          children: [jsx("svg", {
            class: "w-4 h-4",
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24",
            children: jsx("path", {
              "stroke-linecap": "round",
              "stroke-linejoin": "round",
              "stroke-width": "1.5",
              d: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            })
          }), "Sign Out"]
        })
      })]
    })]
  });
}

function MobileNavAuth() {
  const {
    user,
    profile,
    loading,
    signOut
  } = useAuth();
  if (loading) {
    return jsx("span", {
      class: "block text-text-dim py-1.5 opacity-50",
      children: "…"
    });
  }
  if (!user) {
    return jsx("a", {
      href: "/social/login",
      class: "block text-text-dim py-1.5",
      children: "Sign In"
    });
  }
  const displayName = profile?.display_name || profile?.username || "Profile";
  const username = profile?.username;
  return jsxs(Fragment, {
    children: [username && jsx("a", {
      href: `/social/profile/${username}`,
      class: "block text-text py-1.5",
      children: displayName
    }), jsx("button", {
      onClick: signOut,
      class: "block text-left text-text-dim py-1.5 w-full",
      children: "Sign Out"
    })]
  });
}

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro();
const $$SocialLayout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$SocialLayout;
  const { title, description = "FRQNCY Social \u2014 Connect with the conscious living community." } = Astro2.props;
  return renderTemplate(_a || (_a = __template(['<html lang="en" class="dark"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="theme-color" content="#0B1C3D"><title>', ' \u2014 FRQNCY</title><meta name="description"', '><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Jost:wght@300;400;500;600&display=swap" rel="stylesheet">', '</head> <body class="bg-navy text-text font-body min-h-screen antialiased"> <!-- Nav --> <nav class="sticky top-0 z-50 bg-navy/95 backdrop-blur-sm border-b border-card-border"> <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between"> <!-- Logo --> <a href="/" class="font-heading text-2xl font-semibold tracking-wide text-gold hover:text-gold-light transition-colors">\nFRQNCY\n</a> <!-- Center nav links --> <div class="hidden md:flex items-center gap-6 text-sm font-body"> <a href="/social" class="text-text hover:text-gold transition-colors">Feed</a> <a href="/social/space" class="text-text-dim hover:text-gold transition-colors">Space</a> <a href="/social/messages" class="text-text-dim hover:text-gold transition-colors">Messages</a> <a href="/social/notifications" class="text-text-dim hover:text-gold transition-colors">Notifications</a> </div> <!-- Right actions --> <div class="flex items-center gap-3"> <a href="/social/search" class="text-text-dim hover:text-gold transition-colors p-1.5" aria-label="Search"> <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path> </svg> </a> <a href="/social/bookmarks" class="text-text-dim hover:text-gold transition-colors p-1.5 hidden sm:block" aria-label="Bookmarks"> <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path> </svg> </a> ', ' </div> <!-- Mobile menu button --> <button id="mobile-menu-btn" class="md:hidden text-text-dim hover:text-gold transition-colors ml-4" aria-label="Open menu"> <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path> </svg> </button> </div> <!-- Mobile dropdown --> <div id="mobile-menu" class="md:hidden hidden border-t border-card-border bg-navy-mid px-4 py-3 space-y-2"> <a href="/social" class="block text-text py-1.5">Feed</a> <a href="/social/space" class="block text-text-dim py-1.5">Space</a> <a href="/social/search" class="block text-text-dim py-1.5">Search</a> <a href="/social/bookmarks" class="block text-text-dim py-1.5">Bookmarks</a> <a href="/social/messages" class="block text-text-dim py-1.5">Messages</a> <a href="/social/notifications" class="block text-text-dim py-1.5">Notifications</a> ', ' </div> </nav> <!-- Breadcrumb --> <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2"> <nav class="text-xs text-text-dim font-body" aria-label="Breadcrumb"> <a href="/" class="hover:text-gold transition-colors">FRQNCY</a> <span class="mx-1.5 opacity-50">/</span> <span class="text-text">Social</span> </nav> </div> <!-- Page content --> <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16"> ', ` </main> <!-- Footer --> <footer class="border-t border-card-border mt-auto"> <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-text-dim text-xs font-body"> <p>&copy; 2026 FRQNCY Network. Built on the Foundations of Oneness.</p> </div> </footer> <!-- Mobile menu toggle --> <script>
    document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
      document.getElementById('mobile-menu')?.classList.toggle('hidden');
    });
  <\/script> </body> </html>`])), title, addAttribute(description, "content"), renderHead(), renderComponent($$result, "NavAuth", NavAuth, { "client:load": true, "client:component-hydration": "load", "client:component-path": "/sessions/relaxed-keen-euler/mnt/FRQNCY WEBSITE/social/src/components/NavAuth", "client:component-export": "default" }), renderComponent($$result, "MobileNavAuth", MobileNavAuth, { "client:load": true, "client:component-hydration": "load", "client:component-path": "/sessions/relaxed-keen-euler/mnt/FRQNCY WEBSITE/social/src/components/MobileNavAuth", "client:component-export": "default" }), renderSlot($$result, $$slots["default"]));
}, "/sessions/relaxed-keen-euler/mnt/FRQNCY WEBSITE/social/src/layouts/SocialLayout.astro", void 0);

export { $$SocialLayout as $, supabase as s, useAuth as u };
