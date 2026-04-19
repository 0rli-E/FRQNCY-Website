/* empty css                                     */
import { c as createComponent, r as renderComponent, a as renderTemplate } from '../chunks/astro/server_C8GjfOXF.mjs';
import 'piccolore';
import 'html-escaper';
import { s as supabase, u as useAuth, $ as $$SocialLayout } from '../chunks/SocialLayout_BQoA4DU3.mjs';
import { useState, useEffect } from 'preact/hooks';
import { jsxs, jsx } from 'preact/jsx-runtime';
import { F as Feed } from '../chunks/Feed_nRUcC6gF.mjs';
export { renderers } from '../renderers.mjs';

function monthYear(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric"
    });
  } catch {
    return "";
  }
}
function ProfileCard({
  username
}) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data,
        error
      } = await supabase.from("profiles").select("id, username, display_name, avatar_url, bio, post_count, follower_count, following_count, created_at").eq("username", username).maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        setNotFound(true);
      } else {
        setProfile(data);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [username]);
  const displayName = profile?.display_name || username.charAt(0).toUpperCase() + username.slice(1);
  const initials = (profile?.display_name || username).slice(0, 2).toUpperCase();
  if (loading) {
    return jsxs("div", {
      class: "rounded-xl bg-card-bg border border-card-border overflow-hidden animate-pulse",
      children: [jsx("div", {
        class: "h-24 bg-navy-mid"
      }), jsxs("div", {
        class: "px-5 pb-5",
        children: [jsx("div", {
          class: "-mt-10 mb-3",
          children: jsx("div", {
            class: "w-20 h-20 rounded-full bg-navy-mid border-4 border-navy"
          })
        }), jsx("div", {
          class: "h-5 bg-navy-mid rounded w-1/2 mb-2"
        }), jsx("div", {
          class: "h-3 bg-navy-mid rounded w-1/3 mb-3"
        }), jsx("div", {
          class: "h-3 bg-navy-mid rounded w-full mb-1"
        }), jsx("div", {
          class: "h-3 bg-navy-mid rounded w-2/3"
        })]
      })]
    });
  }
  if (notFound) {
    return jsx("div", {
      class: "rounded-xl bg-card-bg border border-card-border p-6 text-center",
      children: jsxs("p", {
        class: "text-sm text-text-dim",
        children: ["No profile found for @", username]
      })
    });
  }
  return jsxs("div", {
    class: "rounded-xl bg-card-bg border border-card-border overflow-hidden",
    children: [jsx("div", {
      class: "h-24 bg-gradient-to-br from-navy-mid via-accent/10 to-gold/10"
    }), jsxs("div", {
      class: "px-5 pb-5",
      children: [jsx("div", {
        class: "-mt-10 mb-3",
        children: profile?.avatar_url ? jsx("img", {
          src: profile.avatar_url,
          alt: displayName,
          class: "w-20 h-20 rounded-full object-cover border-4 border-navy"
        }) : jsx("div", {
          class: "w-20 h-20 rounded-full bg-navy-mid border-4 border-navy flex items-center justify-center text-gold text-xl font-heading font-semibold",
          children: initials
        })
      }), jsx("h2", {
        class: "font-heading text-2xl text-gold",
        children: displayName
      }), jsxs("p", {
        class: "text-sm text-text-dim mt-0.5",
        children: ["@", profile?.username || username]
      }), profile?.bio && jsx("p", {
        class: "text-sm text-text leading-relaxed mt-3",
        children: profile.bio
      }), profile?.created_at && jsx("div", {
        class: "flex items-center gap-4 mt-4 text-xs text-text-dim",
        children: jsxs("span", {
          class: "flex items-center gap-1",
          children: [jsx("svg", {
            class: "w-3.5 h-3.5",
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24",
            children: jsx("path", {
              "stroke-linecap": "round",
              "stroke-linejoin": "round",
              "stroke-width": "1.5",
              d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            })
          }), "Joined ", monthYear(profile.created_at)]
        })
      })]
    })]
  });
}

function ProfileStats({
  username
}) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data
      } = await supabase.from("profiles").select("post_count, follower_count, following_count").eq("username", username).maybeSingle();
      if (cancelled) return;
      if (data) setStats(data);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [username]);
  const posts = stats?.post_count ?? 0;
  const followers = stats?.follower_count ?? 0;
  const following = stats?.following_count ?? 0;
  return jsxs("div", {
    class: "rounded-xl bg-card-bg border border-card-border p-5",
    children: [jsx("h3", {
      class: "font-heading text-lg text-gold mb-4",
      children: "Activity"
    }), jsxs("div", {
      class: "grid grid-cols-3 gap-4 text-center",
      children: [jsxs("div", {
        children: [jsx("p", {
          class: `text-xl font-semibold ${loading ? "text-text-dim" : "text-text"}`,
          children: loading ? "—" : posts
        }), jsx("p", {
          class: "text-xs text-text-dim mt-0.5",
          children: "Posts"
        })]
      }), jsxs("div", {
        children: [jsx("p", {
          class: `text-xl font-semibold ${loading ? "text-text-dim" : "text-text"}`,
          children: loading ? "—" : followers
        }), jsx("p", {
          class: "text-xs text-text-dim mt-0.5",
          children: "Followers"
        })]
      }), jsxs("div", {
        children: [jsx("p", {
          class: `text-xl font-semibold ${loading ? "text-text-dim" : "text-text"}`,
          children: loading ? "—" : following
        }), jsx("p", {
          class: "text-xs text-text-dim mt-0.5",
          children: "Following"
        })]
      })]
    })]
  });
}

function FollowButton({
  username
}) {
  const {
    user
  } = useAuth();
  const [targetUserId, setTargetUserId] = useState(null);
  const [following, setFollowing] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(true);
  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    (async () => {
      const {
        data
      } = await supabase.from("profiles").select("id").eq("username", username).maybeSingle();
      if (cancelled) return;
      setTargetUserId(data?.id ?? null);
      setResolving(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [username]);
  useEffect(() => {
    if (!user || !targetUserId || user.id === targetUserId) return;
    const checkFollow = async () => {
      const {
        data
      } = await supabase.from("follows").select("id").eq("follower_id", user.id).eq("following_id", targetUserId).maybeSingle();
      if (data) setFollowing(true);
    };
    checkFollow();
  }, [user, targetUserId]);
  if (resolving || !user || !targetUserId || user.id === targetUserId) return null;
  const toggle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (following) {
        await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", targetUserId);
        setFollowing(false);
      } else {
        await supabase.from("follows").insert({
          follower_id: user.id,
          following_id: targetUserId
        });
        setFollowing(true);
      }
    } catch (err) {
      console.error("Follow toggle failed:", err);
    } finally {
      setLoading(false);
    }
  };
  const label = following ? hovering ? "Unfollow" : "Following" : "Follow";
  return jsx("button", {
    onClick: toggle,
    onMouseEnter: () => setHovering(true),
    onMouseLeave: () => setHovering(false),
    disabled: loading,
    class: `w-full py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 ${following ? hovering ? "bg-red-500/10 border border-red-500/30 text-red-400" : "bg-gold/10 border border-gold/30 text-gold" : "bg-gold text-navy hover:bg-gold-light"}`,
    children: label
  });
}

function StartConversationButton({
  username
}) {
  const {
    user
  } = useAuth();
  const [targetUserId, setTargetUserId] = useState(null);
  const [resolving, setResolving] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    (async () => {
      const {
        data
      } = await supabase.from("profiles").select("id").eq("username", username).maybeSingle();
      if (cancelled) return;
      setTargetUserId(data?.id ?? null);
      setResolving(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [username]);
  if (resolving || !user || !targetUserId || user.id === targetUserId) return null;
  const findOrCreateConversation = async () => {
    if (!user || !targetUserId) return null;
    const {
      data: myMemberships,
      error: myErr
    } = await supabase.from("conversation_members").select("conversation_id").eq("user_id", user.id);
    if (myErr) throw myErr;
    const myConvIds = (myMemberships ?? []).map((m) => m.conversation_id);
    if (myConvIds.length > 0) {
      const {
        data: shared,
        error: sharedErr
      } = await supabase.from("conversation_members").select("conversation_id").eq("user_id", targetUserId).in("conversation_id", myConvIds);
      if (sharedErr) throw sharedErr;
      if (shared && shared.length > 0) {
        return shared[0].conversation_id;
      }
    }
    const {
      data: newConv,
      error: convErr
    } = await supabase.from("conversations").insert({}).select("id").single();
    if (convErr) throw convErr;
    const newId = newConv.id;
    const {
      error: memErr
    } = await supabase.from("conversation_members").insert([{
      conversation_id: newId,
      user_id: user.id
    }, {
      conversation_id: newId,
      user_id: targetUserId
    }]);
    if (memErr) throw memErr;
    return newId;
  };
  const onClick = async () => {
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      const convId = await findOrCreateConversation();
      if (convId) {
        window.location.href = `/social/messages?c=${convId}`;
      }
    } catch (e) {
      console.error("Start conversation failed:", e);
      setErr(e?.message || "Could not start conversation");
    } finally {
      setBusy(false);
    }
  };
  return jsxs("div", {
    class: "mt-2",
    children: [jsx("button", {
      onClick,
      disabled: busy,
      class: "w-full py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 bg-navy-mid border border-card-border text-text hover:border-gold/30 hover:text-gold",
      children: busy ? "Opening..." : "Message"
    }), err && jsx("p", {
      class: "text-xs text-red-400 mt-2",
      children: err
    })]
  });
}

function ProfilePage() {
  const [username, setUsername] = useState(null);
  useEffect(() => {
    const path = window.location.pathname.replace(/\/+$/, "");
    const parts = path.split("/");
    const last = parts[parts.length - 1];
    if (last && last !== "profile" && last !== "index.html") {
      setUsername(decodeURIComponent(last));
    } else {
      setUsername("");
    }
  }, []);
  if (username === null) {
    return jsx("div", {
      class: "rounded-xl bg-card-bg border border-card-border p-6 text-center",
      children: jsx("p", {
        class: "text-sm text-text-dim",
        children: "Loading…"
      })
    });
  }
  if (!username) {
    return jsx("div", {
      class: "rounded-xl bg-card-bg border border-card-border p-8 text-center",
      children: jsxs("p", {
        class: "text-sm text-text-dim",
        children: ["No profile specified. Try ", jsx("a", {
          href: "/social",
          class: "text-gold",
          children: "the feed"
        }), "."]
      })
    });
  }
  return jsxs("div", {
    class: "grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6",
    children: [jsxs("aside", {
      class: "lg:col-span-4 space-y-4",
      children: [jsx(ProfileCard, {
        username
      }), jsxs("div", {
        class: "rounded-xl bg-card-bg border border-card-border p-5",
        children: [jsx(FollowButton, {
          username
        }), jsx(StartConversationButton, {
          username
        })]
      }), jsx(ProfileStats, {
        username
      })]
    }), jsxs("section", {
      class: "lg:col-span-8",
      children: [jsxs("h2", {
        class: "font-heading text-2xl text-gold mb-4",
        children: ["Posts by @", username]
      }), jsx(Feed, {
        username
      })]
    })]
  });
}

const $$Index = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "SocialLayout", $$SocialLayout, { "title": "Profile" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "ProfilePage", ProfilePage, { "client:load": true, "client:component-hydration": "load", "client:component-path": "/sessions/relaxed-keen-euler/mnt/FRQNCY WEBSITE/social/src/components/ProfilePage", "client:component-export": "default" })} ` })}`;
}, "/sessions/relaxed-keen-euler/mnt/FRQNCY WEBSITE/social/src/pages/profile/index.astro", void 0);

const $$file = "/sessions/relaxed-keen-euler/mnt/FRQNCY WEBSITE/social/src/pages/profile/index.astro";
const $$url = "/social/profile";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
