import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';
import { supabase } from '../lib/supabase';
import CommentItem, { type CommentNode } from './CommentItem';

interface CommentsThreadProps {
  postId: string;
  onCountChange?: (count: number) => void;
}

interface CommentRow {
  id: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  profiles?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
}

const MAX_DEPTH = 3;

function buildTree(rows: CommentRow[]): CommentNode[] {
  const byId = new Map<string, CommentNode>();
  rows.forEach((r) => {
    byId.set(r.id, { ...r, children: [] });
  });

  const roots: CommentNode[] = [];
  byId.forEach((node) => {
    if (node.parent_id && byId.has(node.parent_id)) {
      byId.get(node.parent_id)!.children.push(node);
    } else {
      // Treat orphaned parents (deep-linked replies beyond fetched set) as roots
      roots.push(node);
    }
  });

  const sortByTime = (a: CommentNode, b: CommentNode) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime();

  const sortTree = (nodes: CommentNode[]) => {
    nodes.sort(sortByTime);
    nodes.forEach((n) => sortTree(n.children));
  };
  sortTree(roots);

  return roots;
}

export default function CommentsThread({
  postId,
  onCountChange,
}: CommentsThreadProps) {
  const [rows, setRows] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles!author_id(username, display_name, avatar_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      const next = data as unknown as CommentRow[];
      setRows(next);
      onCountChange?.(next.length);
    }
    setLoading(false);
  }, [postId, onCountChange]);

  useEffect(() => {
    fetchComments();

    const channelKey = `comments-${postId}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    const channel = supabase
      .channel(channelKey)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`,
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, fetchComments]);

  const tree = useMemo(() => buildTree(rows), [rows]);

  const handleReplyPosted = useCallback(
    (_c: any) => {
      // Realtime will deliver it — but refetch to guarantee ordering + joined profile
      fetchComments();
    },
    [fetchComments]
  );

  if (loading) {
    return (
      <div class="space-y-2 py-1">
        {[1, 2].map((i) => (
          <div key={i} class="flex gap-2 animate-pulse">
            <div class="w-7 h-7 rounded-full bg-navy-mid shrink-0" />
            <div class="flex-1 space-y-1.5">
              <div class="h-2.5 bg-navy-mid rounded w-1/3" />
              <div class="h-2.5 bg-navy-mid rounded w-4/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tree.length === 0) {
    return (
      <p class="text-xs text-text-dim italic py-2">
        No comments yet — be the first.
      </p>
    );
  }

  return (
    <div class="space-y-3">
      {tree.map((c) => (
        <CommentItem
          key={c.id}
          comment={c}
          depth={0}
          maxDepth={MAX_DEPTH}
          postId={postId}
          onReplyPosted={handleReplyPosted}
        />
      ))}
    </div>
  );
}
