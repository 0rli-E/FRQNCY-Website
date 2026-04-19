import { useState, useRef, useEffect, useCallback, useMemo } from 'preact/hooks';
import { u as useAuth, s as supabase } from './SocialLayout_BQoA4DU3.mjs';
import { jsxs, jsx } from 'preact/jsx-runtime';

const TIER_COLORS = {
  S: "#C4973A",
  A: "#7B61FF",
  B: "#4A9AE8",
  C: "#7090B8",
  D: "#5A6A7A",
  E: "#4A5260",
  F: "#3A3F48"
};
function getTierColor(tier) {
  return TIER_COLORS[tier?.toUpperCase()] ?? TIER_COLORS.D;
}
function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
const CONVICTION_GLYPH = {
  bullish: "▲",
  bearish: "▼",
  neutral: "▬"
};
function ProjectBadge({
  name,
  tier,
  linked = true,
  compact = false,
  conviction = null
}) {
  const color = getTierColor(tier);
  const href = `/v2/crypto/projects.html#${slugify(name)}`;
  const convictionGlyph = conviction ? CONVICTION_GLYPH[conviction] : null;
  const convictionColor = conviction === "bullish" ? "#C4973A" : conviction === "bearish" ? "#7090B8" : "#C8D8F0";
  const badge = jsxs("span", {
    class: "inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full transition-colors hover:brightness-110",
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
      class: "font-medium truncate max-w-[140px]",
      children: name
    }), !compact && jsx("span", {
      class: "text-[10px] font-bold opacity-70 ml-0.5",
      style: {
        color
      },
      children: tier?.toUpperCase()
    }), convictionGlyph && jsx("span", {
      class: "text-[10px] leading-none ml-0.5",
      style: {
        color: convictionColor
      },
      title: `Author is ${conviction}`,
      "aria-label": `Conviction: ${conviction}`,
      children: convictionGlyph
    })]
  });
  if (!linked) return badge;
  return jsx("a", {
    href,
    class: "inline-block no-underline",
    title: `View ${name} project page (Tier ${tier?.toUpperCase()})`,
    children: badge
  });
}

const MAX_LEN = 1e3;
function CommentForm({
  postId,
  parentId = null,
  onSubmit,
  onCancel,
  autoFocus = false
}) {
  const {
    user,
    profile
  } = useAuth();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const textareaRef = useRef(null);
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);
  if (!user) {
    return jsx("div", {
      class: "text-xs text-text-dim py-2",
      children: jsx("a", {
        href: "/social/login",
        class: "text-gold hover:text-gold-light transition-colors",
        children: "Sign in to comment"
      })
    });
  }
  const initials = (profile?.display_name || user.email || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || submitting) return;
    if (trimmed.length > MAX_LEN) {
      setError(`Comments must be ${MAX_LEN} characters or fewer.`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const {
        data,
        error: insertError
      } = await supabase.from("comments").insert({
        post_id: postId,
        author_id: user.id,
        content: trimmed,
        parent_id: parentId
      }).select("*, profiles!author_id(username, display_name, avatar_url)").maybeSingle();
      if (insertError) throw insertError;
      setContent("");
      onSubmit?.(data);
    } catch (err) {
      console.error("Comment insert failed:", err?.message || err);
      setError("Failed to post comment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };
  const remaining = MAX_LEN - content.length;
  return jsxs("form", {
    onSubmit: handleSubmit,
    class: "flex gap-2 items-start",
    children: [profile?.avatar_url ? jsx("img", {
      src: profile.avatar_url,
      alt: profile.display_name,
      class: "w-7 h-7 rounded-full object-cover shrink-0"
    }) : jsx("div", {
      class: "w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-accent text-[10px] font-semibold shrink-0",
      children: initials
    }), jsxs("div", {
      class: "flex-1 min-w-0",
      children: [jsx("textarea", {
        ref: textareaRef,
        value: content,
        onInput: (e) => {
          const v = e.target.value;
          setContent(v.slice(0, MAX_LEN));
        },
        placeholder: parentId ? "Write a reply..." : "Add a comment...",
        rows: parentId ? 2 : 2,
        maxLength: MAX_LEN,
        class: "w-full bg-navy-deep/50 border border-card-border rounded-lg px-3 py-2 text-sm text-text placeholder-text-dim resize-none focus:outline-none focus:border-gold/30 transition-colors"
      }), error && jsx("p", {
        class: "text-xs text-red-400 mt-1",
        children: error
      }), jsxs("div", {
        class: "flex items-center justify-between mt-1.5",
        children: [jsxs("span", {
          class: `text-[10px] ${remaining < 50 ? "text-gold" : "text-text-dim"}`,
          children: [remaining, " left"]
        }), jsxs("div", {
          class: "flex items-center gap-2",
          children: [parentId && onCancel && jsx("button", {
            type: "button",
            onClick: onCancel,
            class: "text-xs px-3 py-1 rounded-full text-text-dim hover:text-text transition-colors",
            children: "Cancel"
          }), jsx("button", {
            type: "submit",
            disabled: !content.trim() || submitting,
            class: "px-3 py-1 rounded-full bg-gold text-navy text-xs font-medium hover:bg-gold-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed",
            children: submitting ? "Posting..." : parentId ? "Reply" : "Comment"
          })]
        })]
      })]
    })]
  });
}

function timeAgo$1(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1e3);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w`;
  return new Date(dateStr).toLocaleDateString();
}
function CommentItem({
  comment,
  depth,
  maxDepth,
  postId,
  onReplyPosted
}) {
  const {
    user
  } = useAuth();
  const [replyOpen, setReplyOpen] = useState(false);
  const [expanded, setExpanded] = useState(depth < maxDepth);
  const author = comment.profiles;
  const display = author?.display_name || author?.username || "Unknown";
  const username = author?.username || "unknown";
  const initial = display.charAt(0).toUpperCase();
  const hasChildren = comment.children && comment.children.length > 0;
  const atMaxDepth = depth >= maxDepth;
  return jsxs("div", {
    class: "flex gap-2",
    children: [jsx("a", {
      href: `/social/profile/${username}`,
      class: "w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-accent text-[10px] font-semibold shrink-0 overflow-hidden hover:ring-1 hover:ring-gold/30 transition-all",
      children: author?.avatar_url ? jsx("img", {
        src: author.avatar_url,
        alt: display,
        class: "w-full h-full object-cover"
      }) : initial
    }), jsxs("div", {
      class: "flex-1 min-w-0",
      children: [jsxs("div", {
        class: "flex items-baseline gap-1.5 flex-wrap",
        children: [jsx("a", {
          href: `/social/profile/${username}`,
          class: "text-xs font-medium text-text hover:text-gold transition-colors",
          children: display
        }), jsxs("span", {
          class: "text-[11px] text-text-dim",
          children: ["@", username]
        }), jsx("span", {
          class: "text-[11px] text-text-dim opacity-50",
          children: "·"
        }), jsx("span", {
          class: "text-[11px] text-text-dim",
          children: timeAgo$1(comment.created_at)
        })]
      }), jsx("p", {
        class: "text-sm text-text leading-relaxed whitespace-pre-wrap mt-0.5",
        children: comment.content
      }), jsxs("div", {
        class: "flex items-center gap-4 mt-1.5",
        children: [jsx("button", {
          type: "button",
          title: "Likes coming soon",
          class: "flex items-center gap-1 text-[11px] text-text-dim/60 cursor-not-allowed",
          children: jsx("svg", {
            class: "w-3.5 h-3.5",
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24",
            children: jsx("path", {
              "stroke-linecap": "round",
              "stroke-linejoin": "round",
              "stroke-width": "1.5",
              d: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            })
          })
        }), user && !atMaxDepth && jsx("button", {
          type: "button",
          onClick: () => setReplyOpen((v) => !v),
          class: "text-[11px] text-text-dim hover:text-gold transition-colors",
          children: replyOpen ? "Cancel" : "Reply"
        })]
      }), replyOpen && jsx("div", {
        class: "mt-2",
        children: jsx(CommentForm, {
          postId,
          parentId: comment.id,
          autoFocus: true,
          onCancel: () => setReplyOpen(false),
          onSubmit: (c) => {
            setReplyOpen(false);
            setExpanded(true);
            onReplyPosted(c);
          }
        })
      }), hasChildren && jsx("div", {
        class: "mt-3",
        children: atMaxDepth ? jsxs("a", {
          href: `/social/post/${postId}`,
          class: "text-[11px] text-gold hover:text-gold-light transition-colors",
          children: ["Continue thread (", comment.children.length, " more)", " ", jsx("span", {
            "aria-hidden": true,
            children: "->"
          })]
        }) : expanded ? jsx("div", {
          class: "space-y-3 pl-2 border-l border-card-border",
          children: comment.children.map((child) => jsx(CommentItem, {
            comment: child,
            depth: depth + 1,
            maxDepth,
            postId,
            onReplyPosted
          }, child.id))
        }) : jsxs("button", {
          type: "button",
          onClick: () => setExpanded(true),
          class: "text-[11px] text-gold hover:text-gold-light transition-colors",
          children: ["Show ", comment.children.length, " ", comment.children.length === 1 ? "reply" : "replies"]
        })
      })]
    })]
  });
}

const MAX_DEPTH = 3;
function buildTree(rows) {
  const byId = /* @__PURE__ */ new Map();
  rows.forEach((r) => {
    byId.set(r.id, {
      ...r,
      children: []
    });
  });
  const roots = [];
  byId.forEach((node) => {
    if (node.parent_id && byId.has(node.parent_id)) {
      byId.get(node.parent_id).children.push(node);
    } else {
      roots.push(node);
    }
  });
  const sortByTime = (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  const sortTree = (nodes) => {
    nodes.sort(sortByTime);
    nodes.forEach((n) => sortTree(n.children));
  };
  sortTree(roots);
  return roots;
}
function CommentsThread({
  postId,
  onCountChange
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchComments = useCallback(async () => {
    const {
      data,
      error
    } = await supabase.from("comments").select("*, profiles!author_id(username, display_name, avatar_url)").eq("post_id", postId).order("created_at", {
      ascending: true
    });
    if (!error && data) {
      const next = data;
      setRows(next);
      onCountChange?.(next.length);
    }
    setLoading(false);
  }, [postId, onCountChange]);
  useEffect(() => {
    fetchComments();
    const channelKey = `comments-${postId}-${Math.random().toString(36).slice(2, 8)}`;
    const channel = supabase.channel(channelKey).on("postgres_changes", {
      event: "INSERT",
      schema: "public",
      table: "comments",
      filter: `post_id=eq.${postId}`
    }, () => {
      fetchComments();
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, fetchComments]);
  const tree = useMemo(() => buildTree(rows), [rows]);
  const handleReplyPosted = useCallback((_c) => {
    fetchComments();
  }, [fetchComments]);
  if (loading) {
    return jsx("div", {
      class: "space-y-2 py-1",
      children: [1, 2].map((i) => jsxs("div", {
        class: "flex gap-2 animate-pulse",
        children: [jsx("div", {
          class: "w-7 h-7 rounded-full bg-navy-mid shrink-0"
        }), jsxs("div", {
          class: "flex-1 space-y-1.5",
          children: [jsx("div", {
            class: "h-2.5 bg-navy-mid rounded w-1/3"
          }), jsx("div", {
            class: "h-2.5 bg-navy-mid rounded w-4/5"
          })]
        })]
      }, i))
    });
  }
  if (tree.length === 0) {
    return jsx("p", {
      class: "text-xs text-text-dim italic py-2",
      children: "No comments yet — be the first."
    });
  }
  return jsx("div", {
    class: "space-y-3",
    children: tree.map((c) => jsx(CommentItem, {
      comment: c,
      depth: 0,
      maxDepth: MAX_DEPTH,
      postId,
      onReplyPosted: handleReplyPosted
    }, c.id))
  });
}

function PostCard({
  id,
  author = "Anonymous",
  username = "anon",
  avatar,
  content = "",
  tags = [],
  project_tag = null,
  project_tier = null,
  likes = 0,
  comments = 0,
  time = "just now"
}) {
  const {
    user
  } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const [bookmarked, setBookmarked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(comments);
  useEffect(() => {
    if (!user || !id) return;
    const checkStatus = async () => {
      const [likeResult, bookmarkResult] = await Promise.all([supabase.from("likes").select("id").eq("user_id", user.id).eq("post_id", id).maybeSingle(), supabase.from("bookmarks").select("id").eq("user_id", user.id).eq("post_id", id).maybeSingle()]);
      if (likeResult.data) setLiked(true);
      if (bookmarkResult.data) setBookmarked(true);
    };
    checkStatus();
  }, [user, id]);
  useEffect(() => {
    setCommentCount(comments);
  }, [comments]);
  const toggleLike = async () => {
    if (!user || !id || likeLoading) return;
    setLikeLoading(true);
    try {
      if (liked) {
        await supabase.from("likes").delete().eq("user_id", user.id).eq("post_id", id);
        setLiked(false);
        setLikeCount(likeCount - 1);
      } else {
        await supabase.from("likes").insert({
          user_id: user.id,
          post_id: id
        });
        setLiked(true);
        setLikeCount(likeCount + 1);
      }
    } catch (err) {
      console.error("Like toggle failed:", err);
    } finally {
      setLikeLoading(false);
    }
  };
  const toggleBookmark = async () => {
    if (!user || !id || bookmarkLoading) return;
    setBookmarkLoading(true);
    try {
      if (bookmarked) {
        await supabase.from("bookmarks").delete().eq("user_id", user.id).eq("post_id", id);
        setBookmarked(false);
      } else {
        await supabase.from("bookmarks").insert({
          user_id: user.id,
          post_id: id
        });
        setBookmarked(true);
      }
    } catch (err) {
      console.error("Bookmark toggle failed:", err);
    } finally {
      setBookmarkLoading(false);
    }
  };
  const initials = author.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  return jsxs("article", {
    class: "rounded-xl bg-card-bg border border-card-border p-5 hover:border-gold/10 transition-colors",
    children: [jsxs("div", {
      class: "flex items-start gap-3",
      children: [jsx("a", {
        href: `/social/profile/${username}`,
        class: "w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-semibold shrink-0 hover:ring-2 hover:ring-gold/30 transition-all overflow-hidden",
        children: avatar ? jsx("img", {
          src: avatar,
          alt: author,
          class: "w-full h-full object-cover"
        }) : initials
      }), jsx("div", {
        class: "flex-1 min-w-0",
        children: jsxs("div", {
          class: "flex items-center gap-2",
          children: [jsx("a", {
            href: `/social/profile/${username}`,
            class: "text-sm font-medium text-text hover:text-gold transition-colors",
            children: author
          }), jsxs("span", {
            class: "text-xs text-text-dim",
            children: ["@", username]
          }), jsx("span", {
            class: "text-xs text-text-dim opacity-50",
            children: "·"
          }), jsx("span", {
            class: "text-xs text-text-dim",
            children: time
          })]
        })
      }), jsx("button", {
        class: "text-text-dim hover:text-text transition-colors p-1",
        children: jsx("svg", {
          class: "w-4 h-4",
          fill: "none",
          stroke: "currentColor",
          viewBox: "0 0 24 24",
          children: jsx("path", {
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-width": "2",
            d: "M12 5v.01M12 12v.01M12 19v.01"
          })
        })
      })]
    }), jsxs("div", {
      class: "mt-3 ml-13",
      children: [jsx("p", {
        class: "text-sm text-text leading-relaxed whitespace-pre-wrap",
        children: content
      }), project_tag && jsx("div", {
        class: "mt-2.5",
        children: jsx(ProjectBadge, {
          name: project_tag,
          tier: project_tier || "D"
        })
      }), tags.length > 0 && jsx("div", {
        class: "flex flex-wrap gap-1.5 mt-3",
        children: tags.map((tag) => jsxs("a", {
          href: "#",
          class: "text-xs px-2.5 py-0.5 rounded-full bg-gold/5 border border-gold/15 text-gold hover:bg-gold/10 transition-colors",
          children: ["#", tag]
        }, tag))
      })]
    }), jsxs("div", {
      class: "flex items-center gap-6 mt-4 ml-13",
      children: [jsxs("button", {
        onClick: toggleLike,
        disabled: likeLoading,
        class: `flex items-center gap-1.5 text-xs transition-colors ${liked ? "text-gold" : "text-text-dim hover:text-gold"}`,
        children: [jsx("svg", {
          class: "w-4 h-4",
          fill: liked ? "currentColor" : "none",
          stroke: "currentColor",
          viewBox: "0 0 24 24",
          children: jsx("path", {
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-width": "1.5",
            d: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          })
        }), likeCount > 0 && jsx("span", {
          children: likeCount
        })]
      }), jsxs("button", {
        onClick: () => id && setShowComments((v) => !v),
        disabled: !id,
        "aria-expanded": showComments,
        class: `flex items-center gap-1.5 text-xs transition-colors ${showComments ? "text-accent" : "text-text-dim hover:text-accent"}`,
        children: [jsx("svg", {
          class: "w-4 h-4",
          fill: "none",
          stroke: "currentColor",
          viewBox: "0 0 24 24",
          children: jsx("path", {
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-width": "1.5",
            d: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          })
        }), commentCount > 0 && jsx("span", {
          children: commentCount
        })]
      }), jsx("button", {
        class: "flex items-center gap-1.5 text-xs text-text-dim hover:text-gold-light transition-colors",
        children: jsx("svg", {
          class: "w-4 h-4",
          fill: "none",
          stroke: "currentColor",
          viewBox: "0 0 24 24",
          children: jsx("path", {
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-width": "1.5",
            d: "M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          })
        })
      }), jsx("button", {
        onClick: toggleBookmark,
        disabled: bookmarkLoading,
        class: `flex items-center gap-1.5 text-xs transition-colors ml-auto ${bookmarked ? "text-gold" : "text-text-dim hover:text-gold-light"}`,
        children: jsx("svg", {
          class: "w-4 h-4",
          fill: bookmarked ? "currentColor" : "none",
          stroke: "currentColor",
          viewBox: "0 0 24 24",
          children: jsx("path", {
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-width": "1.5",
            d: "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
          })
        })
      })]
    }), showComments && id && jsxs("div", {
      class: "mt-4 ml-13 rounded-lg bg-navy-mid border border-card-border p-3 space-y-3",
      children: [jsx(CommentForm, {
        postId: id,
        onSubmit: () => setCommentCount((c) => c + 1)
      }), jsx("div", {
        class: "pt-2 border-t border-card-border",
        children: jsx(CommentsThread, {
          postId: id,
          onCountChange: (n) => setCommentCount(n)
        })
      })]
    })]
  });
}

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
function Feed({
  username
} = {}) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authorId, setAuthorId] = useState(null);
  useEffect(() => {
    if (!username) {
      setAuthorId(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const {
        data
      } = await supabase.from("profiles").select("id").eq("username", username).maybeSingle();
      if (!cancelled) setAuthorId(data?.id ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [username]);
  const fetchPosts = useCallback(async () => {
    let query = supabase.from("posts").select("*, profiles!author_id(username, display_name, avatar_url), likes(count), comments(count)").order("created_at", {
      ascending: false
    }).limit(20);
    if (username) {
      if (!authorId) {
        setPosts([]);
        setLoading(false);
        return;
      }
      query = query.eq("author_id", authorId);
    }
    const {
      data,
      error
    } = await query;
    if (!error && data) {
      setPosts(data);
    }
    setLoading(false);
  }, [username, authorId]);
  useEffect(() => {
    if (username && !authorId) return;
    fetchPosts();
    const channelKey = `posts-feed-${username ?? "global"}-${Math.random().toString(36).slice(2, 8)}`;
    const channel = supabase.channel(channelKey).on("postgres_changes", {
      event: "INSERT",
      schema: "public",
      table: "posts"
    }, () => {
      fetchPosts();
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPosts, username, authorId]);
  if (loading) {
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
              class: "h-4 bg-navy-mid rounded w-1/3"
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
  if (posts.length === 0) {
    return jsx("div", {
      class: "rounded-xl bg-card-bg border border-card-border p-8 text-center",
      children: jsx("p", {
        class: "text-text-dim text-sm",
        children: username ? `@${username} hasn't posted yet.` : "No posts yet. Be the first to share something!"
      })
    });
  }
  return jsxs("div", {
    class: "space-y-4",
    children: [posts.map((post) => jsx(PostCard, {
      id: post.id,
      author: post.profiles?.display_name || "Anonymous",
      username: post.profiles?.username || "anon",
      avatar: post.profiles?.avatar_url || void 0,
      content: post.content,
      tags: post.project_tag ? [post.project_tag] : [],
      likes: post.likes?.[0]?.count || 0,
      comments: post.comments?.[0]?.count || 0,
      time: timeAgo(post.created_at)
    }, post.id)), jsx("div", {
      class: "text-center py-6",
      children: jsx("button", {
        class: "text-sm text-text-dim hover:text-gold transition-colors border border-card-border rounded-full px-6 py-2 hover:border-gold/30",
        children: "Load more posts"
      })
    })]
  });
}

export { Feed as F, TIER_COLORS as T };
