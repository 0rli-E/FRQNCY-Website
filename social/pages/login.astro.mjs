/* empty css                                     */
import { c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_C8GjfOXF.mjs';
import 'piccolore';
import 'html-escaper';
import { s as supabase, $ as $$SocialLayout } from '../chunks/SocialLayout_BQoA4DU3.mjs';
import { useState } from 'preact/hooks';
import { jsxs, jsx, Fragment } from 'preact/jsx-runtime';
export { renderers } from '../renderers.mjs';

function AuthForm() {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setIsError(false);
    try {
      if (mode === "forgot") {
        const {
          error
        } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        setMessage("If an account exists with that email, a reset link has been sent.");
      } else if (mode === "signup") {
        const {
          error
        } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName,
              username: displayName.toLowerCase().replace(/\s+/g, "_")
            }
          }
        });
        if (error) throw error;
        setMessage("Check your email for a confirmation link.");
      } else {
        const {
          error
        } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        window.location.href = "/social/";
      }
    } catch (err) {
      setIsError(true);
      setMessage(err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };
  const handleGoogleOAuth = async () => {
    const {
      error
    } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/social/"
      }
    });
    if (error) {
      setIsError(true);
      setMessage(error.message);
    }
  };
  return jsxs("form", {
    onSubmit: handleSubmit,
    class: "space-y-4",
    children: [mode !== "forgot" && jsxs("div", {
      class: "flex gap-1 bg-navy rounded-lg p-1 mb-2",
      children: [jsx("button", {
        type: "button",
        onClick: () => {
          setMode("signin");
          setMessage("");
        },
        class: `flex-1 text-sm py-2 rounded-md transition-colors ${mode === "signin" ? "bg-navy-mid text-gold font-medium" : "text-text-dim hover:text-text"}`,
        children: "Sign In"
      }), jsx("button", {
        type: "button",
        onClick: () => {
          setMode("signup");
          setMessage("");
        },
        class: `flex-1 text-sm py-2 rounded-md transition-colors ${mode === "signup" ? "bg-navy-mid text-gold font-medium" : "text-text-dim hover:text-text"}`,
        children: "Sign Up"
      })]
    }), mode === "forgot" && jsxs("div", {
      class: "text-center mb-2",
      children: [jsx("h2", {
        class: "font-heading text-xl text-gold",
        children: "Reset Password"
      }), jsx("p", {
        class: "text-xs text-text-dim mt-1",
        children: "Enter your email to receive a reset link"
      })]
    }), mode === "signup" && jsxs("div", {
      children: [jsx("label", {
        for: "displayName",
        class: "block text-xs text-text-dim mb-1.5",
        children: "Display Name"
      }), jsx("input", {
        id: "displayName",
        type: "text",
        value: displayName,
        onInput: (e) => setDisplayName(e.target.value),
        placeholder: "Your name",
        required: true,
        class: "w-full bg-navy border border-card-border rounded-lg px-3 py-2.5 text-sm text-text placeholder-text-dim focus:outline-none focus:border-gold/40 transition-colors"
      })]
    }), jsxs("div", {
      children: [jsx("label", {
        for: "email",
        class: "block text-xs text-text-dim mb-1.5",
        children: "Email"
      }), jsx("input", {
        id: "email",
        type: "email",
        value: email,
        onInput: (e) => setEmail(e.target.value),
        placeholder: "you@example.com",
        required: true,
        class: "w-full bg-navy border border-card-border rounded-lg px-3 py-2.5 text-sm text-text placeholder-text-dim focus:outline-none focus:border-gold/40 transition-colors"
      })]
    }), mode !== "forgot" && jsxs("div", {
      children: [jsx("label", {
        for: "password",
        class: "block text-xs text-text-dim mb-1.5",
        children: "Password"
      }), jsx("input", {
        id: "password",
        type: "password",
        value: password,
        onInput: (e) => setPassword(e.target.value),
        placeholder: "••••••••",
        required: true,
        minLength: 8,
        class: "w-full bg-navy border border-card-border rounded-lg px-3 py-2.5 text-sm text-text placeholder-text-dim focus:outline-none focus:border-gold/40 transition-colors"
      })]
    }), message && jsx("div", {
      class: `text-sm rounded-lg px-3 py-2 ${isError ? "text-red-400 bg-red-500/5 border border-red-500/20" : "text-gold-light bg-gold/5 border border-gold/20"}`,
      children: message
    }), jsx("button", {
      type: "submit",
      disabled: loading,
      class: "w-full py-2.5 rounded-lg bg-gold text-navy font-medium text-sm hover:bg-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
      children: loading ? "Loading..." : mode === "signin" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Link"
    }), mode === "signin" && jsx("button", {
      type: "button",
      onClick: () => {
        setMode("forgot");
        setMessage("");
      },
      class: "w-full text-xs text-text-dim hover:text-gold transition-colors",
      children: "Forgot your password?"
    }), mode === "forgot" && jsx("button", {
      type: "button",
      onClick: () => {
        setMode("signin");
        setMessage("");
      },
      class: "w-full text-xs text-text-dim hover:text-gold transition-colors",
      children: "Back to sign in"
    }), mode !== "forgot" && jsxs(Fragment, {
      children: [jsxs("div", {
        class: "relative my-4",
        children: [jsx("div", {
          class: "absolute inset-0 flex items-center",
          children: jsx("div", {
            class: "w-full border-t border-card-border"
          })
        }), jsx("div", {
          class: "relative flex justify-center text-xs",
          children: jsx("span", {
            class: "bg-card-bg px-3 text-text-dim",
            children: "or continue with"
          })
        })]
      }), jsxs("button", {
        type: "button",
        onClick: handleGoogleOAuth,
        class: "w-full py-2.5 rounded-lg border border-card-border text-text-dim text-sm hover:border-gold/30 hover:text-text transition-colors flex items-center justify-center gap-2",
        children: [jsxs("svg", {
          class: "w-4 h-4",
          viewBox: "0 0 24 24",
          fill: "currentColor",
          children: [jsx("path", {
            d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
          }), jsx("path", {
            d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          }), jsx("path", {
            d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          }), jsx("path", {
            d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          })]
        }), "Google"]
      })]
    })]
  });
}

const $$Login = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "SocialLayout", $$SocialLayout, { "title": "Sign In" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="max-w-md mx-auto mt-12"> <div class="text-center mb-8"> <h1 class="font-heading text-4xl text-gold mb-2">Welcome Back</h1> <p class="text-text-dim text-sm">
Sign in to connect with the FRQNCY community
</p> </div> <div class="rounded-xl bg-card-bg border border-card-border p-6"> ${renderComponent($$result2, "AuthForm", AuthForm, { "client:visible": true, "client:component-hydration": "visible", "client:component-path": "/sessions/relaxed-keen-euler/mnt/FRQNCY WEBSITE/social/src/components/AuthForm", "client:component-export": "default" })} </div> <p class="text-center text-text-dim text-xs mt-6">
By signing in, you agree to our
<a href="#" class="text-gold hover:text-gold-light transition-colors">Terms of Service</a>
and
<a href="#" class="text-gold hover:text-gold-light transition-colors">Privacy Policy</a>.
</p> </div> ` })}`;
}, "/sessions/relaxed-keen-euler/mnt/FRQNCY WEBSITE/social/src/pages/login.astro", void 0);

const $$file = "/sessions/relaxed-keen-euler/mnt/FRQNCY WEBSITE/social/src/pages/login.astro";
const $$url = "/social/login";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Login,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
