import { useState } from 'preact/hooks';
import { supabase } from '../lib/supabase';
import PrivyLoginButton from './PrivyLoginButton';

type Mode = 'signin' | 'signup' | 'forgot';

export default function AuthForm() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsError(false);

    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        setMessage('If an account exists with that email, a reset link has been sent.');
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName,
              username: displayName.toLowerCase().replace(/\s+/g, '_'),
            },
          },
        });
        if (error) throw error;
        // Referral attribution — best-effort. If a ref code was captured by
        // an inline script on a landing page (or by /membership/), record the
        // attribution row. Never blocks the signup confirmation message.
        try {
          const newUserId = data?.user?.id;
          const storedRef = localStorage.getItem('frqncy.ref_code');
          if (newUserId && storedRef) {
            // Runtime-resolved URL: keep the path out of rollup's static-analysis
            // so the dist build doesn't try to bundle this public-folder asset.
            const membershipModuleUrl = `${window.location.origin}/assets/frqncy-membership.js`;
            const { attributeSignup } = await import(/* @vite-ignore */ membershipModuleUrl);
            // Fire-and-forget. attributeSignup is defensive and never throws.
            attributeSignup(storedRef, newUserId).catch(() => {});
          }
        } catch (_) { /* private mode / SSR / module-load fail — silent */ }
        setMessage('Check your email for a confirmation link.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = '/social/';
      }
    } catch (err: any) {
      setIsError(true);
      setMessage(err?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleOAuth = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/social/',
      },
    });
    if (error) {
      setIsError(true);
      setMessage(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} class="space-y-4">
      {/* Mode tabs */}
      {mode !== 'forgot' && (
        <div class="flex gap-1 bg-navy rounded-lg p-1 mb-2">
          <button
            type="button"
            onClick={() => { setMode('signin'); setMessage(''); }}
            class={`flex-1 text-sm py-2 rounded-md transition-colors ${
              mode === 'signin' ? 'bg-navy-mid text-gold font-medium' : 'text-text-dim hover:text-text'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setMessage(''); }}
            class={`flex-1 text-sm py-2 rounded-md transition-colors ${
              mode === 'signup' ? 'bg-navy-mid text-gold font-medium' : 'text-text-dim hover:text-text'
            }`}
          >
            Sign Up
          </button>
        </div>
      )}

      {mode === 'forgot' && (
        <div class="text-center mb-2">
          <h2 class="font-heading text-xl text-gold">Reset Password</h2>
          <p class="text-xs text-text-dim mt-1">Enter your email to receive a reset link</p>
        </div>
      )}

      {mode === 'signup' && (
        <div>
          <label for="displayName" class="block text-xs text-text-dim mb-1.5">Display Name</label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onInput={(e) => setDisplayName((e.target as HTMLInputElement).value)}
            placeholder="Your name"
            required
            class="w-full bg-navy border border-card-border rounded-lg px-3 py-2.5 text-sm text-text placeholder-text-dim focus:outline-none focus:border-gold/40 transition-colors"
          />
        </div>
      )}

      <div>
        <label for="email" class="block text-xs text-text-dim mb-1.5">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
          placeholder="you@example.com"
          required
          class="w-full bg-navy border border-card-border rounded-lg px-3 py-2.5 text-sm text-text placeholder-text-dim focus:outline-none focus:border-gold/40 transition-colors"
        />
      </div>

      {mode !== 'forgot' && (
        <div>
          <label for="password" class="block text-xs text-text-dim mb-1.5">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
            placeholder="••••••••"
            required
            minLength={8}
            class="w-full bg-navy border border-card-border rounded-lg px-3 py-2.5 text-sm text-text placeholder-text-dim focus:outline-none focus:border-gold/40 transition-colors"
          />
        </div>
      )}

      {message && (
        <div class={`text-sm rounded-lg px-3 py-2 ${
          isError
            ? 'text-red-400 bg-red-500/5 border border-red-500/20'
            : 'text-gold-light bg-gold/5 border border-gold/20'
        }`}>
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        class="w-full py-2.5 rounded-lg bg-gold text-navy font-medium text-sm hover:bg-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Loading...' : mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
      </button>

      {mode === 'signin' && (
        <button
          type="button"
          onClick={() => { setMode('forgot'); setMessage(''); }}
          class="w-full text-xs text-text-dim hover:text-gold transition-colors"
        >
          Forgot your password?
        </button>
      )}

      {mode === 'forgot' && (
        <button
          type="button"
          onClick={() => { setMode('signin'); setMessage(''); }}
          class="w-full text-xs text-text-dim hover:text-gold transition-colors"
        >
          Back to sign in
        </button>
      )}

      {/* Social auth divider */}
      {mode !== 'forgot' && (
        <>
          <div class="relative my-4">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-card-border"></div>
            </div>
            <div class="relative flex justify-center text-xs">
              <span class="bg-card-bg px-3 text-text-dim">or continue with</span>
            </div>
          </div>

          {/* Privy: embedded-wallet auth (email / Google / wallet via Privy modal).
              Drops a self-custodial wallet on every signup without forcing the
              wallet UX on first-touch. See proposals/PROTOCOL-LESSONS-2026-04.md
              for the rationale (Ethos pattern). */}
          <PrivyLoginButton />

          <button
            type="button"
            onClick={handleGoogleOAuth}
            class="w-full py-2.5 rounded-lg border border-card-border text-text-dim text-sm hover:border-gold/30 hover:text-text transition-colors flex items-center justify-center gap-2"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google (Supabase)
          </button>
        </>
      )}
    </form>
  );
}
