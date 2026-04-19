import { useState, useEffect } from 'preact/hooks';
import { useAuth } from './AuthProvider';
import { supabase } from '../lib/supabase';

interface StartConversationButtonProps {
  username: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// StartConversationButton
//
// Shown on a profile page alongside the FollowButton. If the viewer is not
// signed in, or is viewing their own profile, we render nothing.
//
// Clicking will:
//   1. Look for an existing 1:1 conversation between (me, target). If found,
//      reuse its id.
//   2. Otherwise create a new conversation row and insert two
//      conversation_members rows (me + target).
//   3. Navigate to /social/messages?c=<id>.
// ─────────────────────────────────────────────────────────────────────────────
export default function StartConversationButton({ username }: StartConversationButtonProps) {
  const { user } = useAuth();
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [resolving, setResolving] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .maybeSingle();
      if (cancelled) return;
      setTargetUserId(data?.id ?? null);
      setResolving(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [username]);

  // Hide while resolving, on own profile, or when signed out.
  if (resolving || !user || !targetUserId || user.id === targetUserId) return null;

  const findOrCreateConversation = async (): Promise<string | null> => {
    if (!user || !targetUserId) return null;

    // 1. Find conversations the current user belongs to.
    const { data: myMemberships, error: myErr } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', user.id);
    if (myErr) throw myErr;

    const myConvIds = (myMemberships ?? []).map((m: any) => m.conversation_id);

    if (myConvIds.length > 0) {
      // 2. Find conversations the target also belongs to (intersection).
      const { data: shared, error: sharedErr } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', targetUserId)
        .in('conversation_id', myConvIds);
      if (sharedErr) throw sharedErr;

      if (shared && shared.length > 0) {
        // For simplicity reuse the first shared conversation as the 1:1 DM.
        // (If group chats are added later this will need to filter by member count === 2.)
        return shared[0].conversation_id as string;
      }
    }

    // 3. No existing shared conversation — create a new one.
    const { data: newConv, error: convErr } = await supabase
      .from('conversations')
      .insert({})
      .select('id')
      .single();
    if (convErr) throw convErr;
    const newId = newConv.id as string;

    const { error: memErr } = await supabase.from('conversation_members').insert([
      { conversation_id: newId, user_id: user.id },
      { conversation_id: newId, user_id: targetUserId },
    ]);
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
    } catch (e: any) {
      console.error('Start conversation failed:', e);
      setErr(e?.message || 'Could not start conversation');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div class="mt-2">
      <button
        onClick={onClick}
        disabled={busy}
        class="w-full py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 bg-navy-mid border border-card-border text-text hover:border-gold/30 hover:text-gold"
      >
        {busy ? 'Opening...' : 'Message'}
      </button>
      {err && <p class="text-xs text-red-400 mt-2">{err}</p>}
    </div>
  );
}
