/* empty css                                     */
import { c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_C8GjfOXF.mjs';
import 'piccolore';
import 'html-escaper';
import { u as useAuth, s as supabase, $ as $$SocialLayout } from '../chunks/SocialLayout_BQoA4DU3.mjs';
import { useState, useRef, useEffect, useCallback, useMemo } from 'preact/hooks';
import { jsxs, jsx } from 'preact/jsx-runtime';
export { renderers } from '../renderers.mjs';

function useMessages(conversationId) {
  const {
    user
  } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const profileCacheRef = useRef({});
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      const {
        data,
        error: fetchErr
      } = await supabase.from("messages").select("id, conversation_id, sender_id, content, media_url, created_at, sender:profiles!sender_id(id, username, display_name, avatar_url)").eq("conversation_id", conversationId).order("created_at", {
        ascending: true
      });
      if (cancelled) return;
      if (fetchErr) {
        setError(fetchErr.message);
        setMessages([]);
        setLoading(false);
        return;
      }
      const rows = data || [];
      for (const r of rows) {
        if (r.sender) profileCacheRef.current[r.sender_id] = r.sender;
      }
      setMessages(rows);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [conversationId]);
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase.channel("msgs-" + conversationId).on("postgres_changes", {
      event: "INSERT",
      schema: "public",
      table: "messages",
      filter: `conversation_id=eq.${conversationId}`
    }, async (payload) => {
      const row = payload.new;
      let alreadyHave = false;
      setMessages((prev) => {
        alreadyHave = prev.some((m) => m.id === row.id);
        return prev;
      });
      if (alreadyHave) return;
      let sender = profileCacheRef.current[row.sender_id];
      if (!sender) {
        const {
          data: prof
        } = await supabase.from("profiles").select("id, username, display_name, avatar_url").eq("id", row.sender_id).maybeSingle();
        if (prof) {
          sender = prof;
          profileCacheRef.current[row.sender_id] = sender;
        }
      }
      setMessages((prev) => {
        if (prev.some((m) => m.id === row.id)) return prev;
        return [...prev, {
          ...row,
          sender: sender ?? null
        }];
      });
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);
  const send = useCallback(async (content) => {
    const trimmed = content.trim();
    if (!trimmed || !user || !conversationId) return;
    const {
      data,
      error: insertErr
    } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: trimmed
    }).select("id, conversation_id, sender_id, content, media_url, created_at, sender:profiles!sender_id(id, username, display_name, avatar_url)").single();
    if (insertErr) {
      setError(insertErr.message);
      throw insertErr;
    }
    if (data) {
      const row = data;
      if (row.sender) profileCacheRef.current[row.sender_id] = row.sender;
      setMessages((prev) => {
        if (prev.some((m) => m.id === row.id)) return prev;
        return [...prev, row];
      });
    }
  }, [user, conversationId]);
  return {
    messages,
    send,
    loading,
    error
  };
}

function MessageInput({
  onSend,
  disabled = false
}) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState(null);
  const doSend = async () => {
    const trimmed = value.trim();
    if (!trimmed || sending || disabled) return;
    setSending(true);
    setErr(null);
    try {
      await onSend(trimmed);
      setValue("");
    } catch (e) {
      setErr(e?.message || "Failed to send");
    } finally {
      setSending(false);
    }
  };
  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      doSend();
    }
  };
  const onSubmit = (e) => {
    e.preventDefault();
    doSend();
  };
  return jsxs("form", {
    onSubmit,
    class: "border-t border-card-border bg-card-bg p-3",
    children: [err && jsx("p", {
      class: "text-xs text-red-400 mb-2 px-1",
      children: err
    }), jsxs("div", {
      class: "flex items-end gap-2",
      children: [jsx("textarea", {
        value,
        onInput: (e) => setValue(e.target.value),
        onKeyDown,
        placeholder: "Type a message...",
        rows: 1,
        disabled: disabled || sending,
        class: "flex-1 bg-navy-mid border border-card-border rounded-xl px-3 py-2 text-sm text-text placeholder-text-dim focus:outline-none focus:border-gold/40 transition-colors resize-none max-h-40 disabled:opacity-50"
      }), jsx("button", {
        type: "submit",
        disabled: !value.trim() || sending || disabled,
        class: "px-4 py-2 rounded-xl bg-gold text-navy text-sm font-medium hover:bg-gold-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0",
        children: sending ? "Sending..." : "Send"
      })]
    })]
  });
}

function timeAgo$1(dateStr) {
  if (!dateStr) return "";
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1e3);
  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString();
}
function groupMessages(messages) {
  const groups = [];
  for (const m of messages) {
    const last = groups[groups.length - 1];
    if (last && last.sender_id === m.sender_id) {
      last.messages.push(m);
    } else {
      groups.push({
        key: m.id,
        sender_id: m.sender_id,
        sender: m.sender ?? null,
        startedAt: m.created_at,
        messages: [m]
      });
    }
  }
  return groups;
}
function ChatWindow({
  conversationId
}) {
  const {
    user
  } = useAuth();
  const {
    messages,
    send,
    loading,
    error
  } = useMessages(conversationId);
  const scrollRef = useRef(null);
  const groups = useMemo(() => groupMessages(messages), [messages]);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [messages.length, conversationId]);
  return jsxs("div", {
    class: "flex flex-col h-full min-h-[60vh] bg-navy",
    children: [jsx("div", {
      ref: scrollRef,
      class: "flex-1 overflow-y-auto px-4 py-4 space-y-4",
      children: loading ? jsx("div", {
        class: "flex items-center justify-center h-full",
        children: jsx("p", {
          class: "text-text-dim text-sm",
          children: "Loading messages..."
        })
      }) : error ? jsx("div", {
        class: "flex items-center justify-center h-full",
        children: jsxs("p", {
          class: "text-red-400 text-sm",
          children: ["Failed to load messages: ", error]
        })
      }) : groups.length === 0 ? jsx("div", {
        class: "flex items-center justify-center h-full",
        children: jsx("p", {
          class: "text-text-dim text-sm",
          children: "No messages yet. Say hi."
        })
      }) : groups.map((g) => {
        const isSelf = user?.id === g.sender_id;
        const displayName = g.sender?.display_name || g.sender?.username || "Unknown";
        const initial = displayName.charAt(0).toUpperCase();
        return jsxs("div", {
          class: "flex gap-3",
          children: [jsx("div", {
            class: "w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-semibold shrink-0 overflow-hidden",
            children: g.sender?.avatar_url ? jsx("img", {
              src: g.sender.avatar_url,
              alt: displayName,
              class: "w-full h-full object-cover"
            }) : initial
          }), jsxs("div", {
            class: "flex-1 min-w-0",
            children: [jsxs("div", {
              class: "flex items-baseline gap-2",
              children: [jsx("span", {
                class: `text-sm font-medium ${isSelf ? "text-gold" : "text-text"}`,
                children: displayName
              }), jsx("span", {
                class: "text-xs text-text-dim",
                children: timeAgo$1(g.startedAt)
              })]
            }), jsx("div", {
              class: "mt-1 space-y-1",
              children: g.messages.map((m) => jsx("p", {
                class: "text-sm text-text leading-relaxed whitespace-pre-wrap break-words",
                children: m.content
              }, m.id))
            })]
          })]
        }, g.key);
      })
    }), jsx(MessageInput, {
      onSend: send,
      disabled: loading || !user
    })]
  });
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1e3);
  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
function ConversationsList() {
  const {
    user,
    loading: authLoading
  } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const c = params.get("c");
    if (c) setSelectedId(c);
  }, []);
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const {
        data: memberships,
        error: memErr
      } = await supabase.from("conversation_members").select("conversation_id").eq("user_id", user.id);
      if (cancelled) return;
      if (memErr || !memberships || memberships.length === 0) {
        setLoading(false);
        return;
      }
      const convIds = memberships.map((m) => m.conversation_id);
      const {
        data: convs
      } = await supabase.from("conversations").select("id, updated_at").in("id", convIds).order("updated_at", {
        ascending: false
      });
      if (cancelled || !convs) {
        setLoading(false);
        return;
      }
      const {
        data: otherMembers
      } = await supabase.from("conversation_members").select("conversation_id, user_id, profiles!user_id(id, username, display_name, avatar_url)").in("conversation_id", convIds).neq("user_id", user.id);
      const {
        data: recentMessages
      } = await supabase.from("messages").select("conversation_id, content, created_at").in("conversation_id", convIds).order("created_at", {
        ascending: false
      });
      const lastMsgByConv = {};
      for (const m of recentMessages || []) {
        if (!lastMsgByConv[m.conversation_id]) {
          lastMsgByConv[m.conversation_id] = {
            content: m.content,
            at: m.created_at
          };
        }
      }
      const othersByConv = {};
      for (const m of otherMembers || []) {
        const profile = m.profiles;
        if (!profile) continue;
        if (!othersByConv[m.conversation_id]) othersByConv[m.conversation_id] = [];
        othersByConv[m.conversation_id].push(profile);
      }
      const rows = convs.map((c) => ({
        id: c.id,
        updated_at: c.updated_at,
        lastMessage: lastMsgByConv[c.id]?.content ?? null,
        lastMessageAt: lastMsgByConv[c.id]?.at ?? c.updated_at,
        others: othersByConv[c.id] || []
      }));
      rows.sort((a, b) => {
        const at = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const bt = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return bt - at;
      });
      setConversations(rows);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);
  if (authLoading || loading) {
    return jsxs("div", {
      class: "grid grid-cols-1 md:grid-cols-12 gap-0 rounded-xl border border-card-border overflow-hidden",
      style: "min-height: 60vh;",
      children: [jsx("div", {
        class: "md:col-span-4 bg-card-bg border-r border-card-border p-4",
        children: jsx("div", {
          class: "space-y-3 animate-pulse",
          children: [1, 2, 3].map((i) => jsxs("div", {
            class: "flex gap-3",
            children: [jsx("div", {
              class: "w-10 h-10 rounded-full bg-navy-mid"
            }), jsxs("div", {
              class: "flex-1 space-y-2",
              children: [jsx("div", {
                class: "h-3 bg-navy-mid rounded w-1/2"
              }), jsx("div", {
                class: "h-2 bg-navy-mid rounded w-3/4"
              })]
            })]
          }, i))
        })
      }), jsx("div", {
        class: "md:col-span-8 bg-navy"
      })]
    });
  }
  if (!user) {
    return jsxs("div", {
      class: "rounded-xl bg-card-bg border border-card-border p-12 text-center",
      children: [jsx("p", {
        class: "text-text-dim text-sm mb-4",
        children: "Sign in to see your messages."
      }), jsx("a", {
        href: "/social/login",
        class: "inline-block px-4 py-2 rounded-lg bg-gold/10 border border-gold/30 text-gold text-sm font-medium hover:bg-gold/20 transition-colors",
        children: "Sign In"
      })]
    });
  }
  return jsxs("div", {
    class: "grid grid-cols-1 md:grid-cols-12 gap-0 rounded-xl border border-card-border overflow-hidden",
    style: "min-height: 60vh;",
    children: [jsxs("div", {
      class: "md:col-span-4 bg-card-bg border-r border-card-border",
      children: [jsx("div", {
        class: "p-4 border-b border-card-border",
        children: jsx("input", {
          type: "search",
          placeholder: "Search conversations...",
          class: "w-full bg-navy-mid border border-card-border rounded-lg px-3 py-2 text-sm text-text placeholder-text-dim focus:outline-none focus:border-gold/40 transition-colors"
        })
      }), conversations.length === 0 ? jsxs("div", {
        class: "p-8 text-center",
        children: [jsx("p", {
          class: "text-text-dim text-sm",
          children: "No conversations yet."
        }), jsx("p", {
          class: "text-text-dim text-xs mt-2 opacity-70",
          children: "Start a conversation by visiting someone's profile."
        })]
      }) : jsx("ul", {
        class: "divide-y divide-card-border",
        children: conversations.map((c) => {
          const primary = c.others[0];
          const title = primary ? primary.display_name || primary.username : "Conversation";
          const initial = title.charAt(0).toUpperCase();
          const active = selectedId === c.id;
          return jsx("li", {
            onClick: () => setSelectedId(c.id),
            class: `px-4 py-3 cursor-pointer transition-colors ${active ? "bg-navy-mid/50" : "hover:bg-navy-mid/30"}`,
            children: jsxs("div", {
              class: "flex items-center gap-3",
              children: [jsx("div", {
                class: "w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-semibold shrink-0 overflow-hidden",
                children: primary?.avatar_url ? jsx("img", {
                  src: primary.avatar_url,
                  alt: title,
                  class: "w-full h-full object-cover"
                }) : initial
              }), jsxs("div", {
                class: "flex-1 min-w-0",
                children: [jsxs("div", {
                  class: "flex items-center justify-between",
                  children: [jsx("p", {
                    class: "text-sm font-medium text-text truncate",
                    children: title
                  }), jsx("span", {
                    class: "text-xs text-text-dim",
                    children: timeAgo(c.lastMessageAt)
                  })]
                }), jsx("p", {
                  class: "text-xs text-text-dim truncate",
                  children: c.lastMessage || "No messages yet"
                })]
              })]
            })
          }, c.id);
        })
      })]
    }), jsx("div", {
      class: "md:col-span-8 bg-navy flex flex-col",
      children: selectedId ? jsx(ChatWindow, {
        conversationId: selectedId
      }) : jsx("div", {
        class: "flex-1 flex items-center justify-center",
        children: jsxs("div", {
          class: "text-center py-16 px-6",
          children: [jsx("div", {
            class: "w-16 h-16 rounded-full bg-card-bg border border-card-border flex items-center justify-center mx-auto mb-4",
            children: jsx("svg", {
              class: "w-8 h-8 text-text-dim",
              fill: "none",
              stroke: "currentColor",
              viewBox: "0 0 24 24",
              children: jsx("path", {
                "stroke-linecap": "round",
                "stroke-linejoin": "round",
                "stroke-width": "1.5",
                d: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              })
            })
          }), jsx("p", {
            class: "text-text-dim text-sm",
            children: "Select a conversation to view messages"
          }), jsx("p", {
            class: "text-text-dim text-xs mt-1 opacity-60",
            children: "Your direct messages will appear here."
          })]
        })
      })
    })]
  });
}

const $$Messages = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "SocialLayout", $$SocialLayout, { "title": "Messages" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="mt-6"> <h1 class="font-heading text-3xl text-gold mb-6">Messages</h1> ${renderComponent($$result2, "ConversationsList", ConversationsList, { "client:load": true, "client:component-hydration": "load", "client:component-path": "/sessions/relaxed-keen-euler/mnt/FRQNCY WEBSITE/social/src/components/ConversationsList", "client:component-export": "default" })} </div> ` })}`;
}, "/sessions/relaxed-keen-euler/mnt/FRQNCY WEBSITE/social/src/pages/messages.astro", void 0);

const $$file = "/sessions/relaxed-keen-euler/mnt/FRQNCY WEBSITE/social/src/pages/messages.astro";
const $$url = "/social/messages";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Messages,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
