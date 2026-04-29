import { useEffect, useState } from 'preact/hooks';
import { useAuth } from './AuthProvider';
import { supabase } from '../lib/supabase';

/**
 * NotificationsBadge — small unread-count pill that sits inside the
 * "Notifications" nav link. Hidden when count is 0 or the user is logged
 * out. Updates in realtime via a postgres_changes subscription on
 * notifications, so a like or follow on another tab updates this tab's
 * badge instantly.
 *
 * Drops naturally into existing markup:
 *   <a href="/social/notifications">Notifications<NotificationsBadge /></a>
 */
export default function NotificationsBadge() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) { setCount(0); return; }

    let cancelled = false;

    const fetchCount = async () => {
      const { count: c, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('target_user_id', user.id)
        .eq('is_read', false);
      if (!cancelled && !error) setCount(c ?? 0);
    };

    fetchCount();

    // Realtime: update the badge when a notification is inserted or marked read.
    const ch = supabase
      .channel(`notif-badge-${user.id}-${Math.random().toString(36).slice(2, 8)}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `target_user_id=eq.${user.id}`,
        },
        () => fetchCount(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [user]);

  if (!user || count <= 0) return null;

  const display = count > 99 ? '99+' : String(count);

  return (
    <span
      aria-label={`${count} unread notification${count === 1 ? '' : 's'}`}
      class="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-gold text-navy text-[10px] font-semibold leading-none align-middle"
    >
      {display}
    </span>
  );
}
