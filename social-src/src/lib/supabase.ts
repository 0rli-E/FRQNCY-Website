import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '';

// Auth options are stated explicitly rather than inherited. They were the
// library defaults before, which meant login persistence — the thing users
// actually feel — was an accident of the SDK version rather than a decision
// anyone had made. These three are what keep a login alive across reloads and
// browser restarts; changing any of them logs everyone out on their next visit.
//
// storageKey is deliberately NOT set. The default is `sb-<project-ref>-auth-token`,
// and every existing session in every user's localStorage is already under that
// key — setting it to anything else, including a hand-built string that differs
// by a character, would orphan all of them at once. AuthProvider derives the
// same key to read the session synchronously on boot; if that default ever
// changes upstream, that derivation is what has to change with it.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Keep the session in localStorage so it survives a reload / restart.
    persistSession: true,
    // Renew the access token before it expires. Access tokens are short-lived
    // (1h by default); without this a session dies quietly after an hour.
    autoRefreshToken: true,
    // Parse the token out of the URL fragment after an OAuth / magic-link
    // redirect. Required for the Privy magic-link bridge to complete.
    detectSessionInUrl: true,
  },
});
