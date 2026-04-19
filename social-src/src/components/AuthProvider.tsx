import { useState, useEffect } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

// ─────────────────────────────────────────────────────────────────────────────
// Astro-friendly auth hook.
//
// Each Astro island is its own Preact root, so React Context can't be shared
// across islands. Instead we keep a module-level store that every island on
// the page subscribes to.
//
// We avoid supabase.auth.getSession() on boot because in dev it frequently
// gets stuck on an orphaned localStorage lock (lock:sb-*-auth-token), which
// makes islands hang in a "loading" state forever. Instead we read the token
// directly from localStorage synchronously, parse the user out of it, and
// then rely on onAuthStateChange for any subsequent updates.
// ─────────────────────────────────────────────────────────────────────────────

interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
}

type Listener = (state: AuthState) => void;

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL || '';
// Extract project ref from the URL: https://<ref>.supabase.co
const PROJECT_REF = SUPABASE_URL.replace('https://', '').split('.')[0];
const TOKEN_KEY = PROJECT_REF ? `sb-${PROJECT_REF}-auth-token` : '';

function readSessionFromStorage(): User | null {
  if (typeof window === 'undefined' || !TOKEN_KEY) return null;
  try {
    const raw = window.localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Check expiry
    const nowSec = Math.floor(Date.now() / 1000);
    if (parsed?.expires_at && parsed.expires_at < nowSec) return null;
    return (parsed?.user ?? null) as User | null;
  } catch {
    return null;
  }
}

let state: AuthState = { user: null, profile: null, loading: true };
const listeners = new Set<Listener>();
let initialized = false;

function setState(next: Partial<AuthState>) {
  state = { ...state, ...next };
  listeners.forEach((cb) => cb(state));
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, bio')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return data as Profile;
}

function initAuthOnce() {
  if (initialized) return;
  if (typeof window === 'undefined') return;
  initialized = true;

  // Read session synchronously from storage — no lock contention, no hang.
  const user = readSessionFromStorage();
  state = { user, profile: null, loading: false };
  // Fetch profile in background; UI can render composer/nav immediately.
  if (user) {
    fetchProfile(user.id).then((profile) => {
      if (profile) setState({ profile });
    });
  }

  // Keep state in sync with subsequent sign in / sign out events.
  supabase.auth.onAuthStateChange(async (_event, session) => {
    const u = session?.user ?? null;
    const p = u ? await fetchProfile(u.id) : null;
    setState({ user: u, profile: p, loading: false });
  });
}

export function useAuth() {
  const [snapshot, setSnapshot] = useState<AuthState>(state);

  useEffect(() => {
    initAuthOnce();
    const listener: Listener = (s) => setSnapshot(s);
    listeners.add(listener);
    // Pick up any state that arrived before this island mounted
    setSnapshot(state);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setState({ user: null, profile: null, loading: false });
  };

  return {
    user: snapshot.user,
    profile: snapshot.profile,
    loading: snapshot.loading,
    signOut,
  };
}

// Kept as a no-op passthrough for backward compat with any code that expects
// to wrap children in <AuthProvider>. The real work is done by useAuth().
export function AuthProvider({ children }: { children: ComponentChildren }) {
  return <>{children}</>;
}
