# FRQNCY Email Collection — Setup Guide

Your email collection is built and ready. You just need to connect it to Brevo (free).
This takes about 10 minutes.

---

## Why Brevo?

- **Free forever** — unlimited contacts, 300 emails/day
- Clean dashboard to see and manage your subscribers
- Send newsletters directly from the platform
- No credit card required to start

---

## Step 1 — Create a Brevo account

Go to **brevo.com** and sign up for free.
Use your FRQNCY email (hello@frqncy.network or similar).

---

## Step 2 — Create a contact list

1. In Brevo, go to **Contacts → Lists**
2. Click **Create a list**
3. Name it: `FRQNCY Waitlist`
4. Note the **List ID** (a number like `2`) — you'll need it in Step 4

---

## Step 3 — Get your API key

1. In Brevo, go to your **profile icon → SMTP & API**
2. Click the **API Keys** tab
3. Click **Generate a new API key**
4. Name it: `FRQNCY Website`
5. Copy the key — it starts with `xkeysib-...`

---

## Step 4 — Add your keys to Cloudflare Pages

Once the site is deployed on Cloudflare Pages:

1. Go to **Cloudflare Dashboard → Pages → frqncy-website → Settings → Environment Variables**
2. Add two variables:

| Variable name     | Value                      |
|-------------------|----------------------------|
| `BREVO_API_KEY`   | `xkeysib-your-key-here`    |
| `BREVO_LIST_ID`   | `2` (your list number)     |

3. Click **Save** and redeploy

---

## How it works (technical)

When someone submits the form on your site:

```
Browser → /api/subscribe (Cloudflare Function) → Brevo API → Contact added to list
```

Your API key never touches the browser — it lives securely inside Cloudflare.
The function file is at: `functions/api/subscribe.js`

---

## Viewing your subscribers

Go to **brevo.com → Contacts → Lists → FRQNCY Waitlist**

You'll see every email with the date they signed up and their source (FRQNCY Website).

---

## Sending your first newsletter

1. In Brevo, go to **Campaigns → Create an email campaign**
2. Choose your list
3. Design and send

Brevo has good templates and a drag-and-drop editor.

---

## Testing locally (before deploy)

When running the site locally (`file://` or localhost), the `/api/subscribe` endpoint
doesn't exist yet — the function only runs on Cloudflare Pages.

During local testing, the form will show a connection error. This is expected.
Once deployed, everything works.

---

## Notes

- The form appears in two places: the scroll-triggered overlay + the contact section at the bottom
- Both submit to the same `/api/subscribe` endpoint
- Duplicate emails are handled gracefully (Brevo updates the contact, user sees success)
- The `SOURCE` attribute is set to `FRQNCY Website` so you can track where signups come from
