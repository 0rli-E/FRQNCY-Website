# NRG E2E Encrypted Messaging — v1 Design Notes

## What's wired (current state)

End-to-end encryption is **live in the messaging UI** as of this session. Six pieces:

1. **Keypair generation on first signed-in load** (`AuthProvider.ensureEncryptionKeypair`). When a user signs in and has neither a profile public key nor a localStorage private key, we generate a libsodium X25519 keypair, save the private key to localStorage, and write the public key to `profiles.encryption_public_key`. Idempotent — runs every session, no-op when healthy.
2. **Recipient lookup in useMessages**. When a conversation opens, we resolve the other member's `encryption_public_key` from `conversation_members` → `profiles`. Surfaced as `encryptionStatus: 'ready' | 'no-own-key' | 'recipient-no-key'`.
3. **Encrypt on send**. `useMessages.send()` encrypts content with the recipient's public key (libsodium sealed boxes), writes `encrypted_content` + `encryption_version=1`, leaves `content` NULL. Falls back to plaintext (`encryption_version=0`) only if the recipient hasn't generated a key yet.
4. **Decrypt on receive**. `useMessages` decrypts every fetched + realtime-streamed message. Failed decrypts get `_state='failed'` and the renderer shows a discrete `[unable to decrypt — sent before this device had your key, or the key was lost]` placeholder.
5. **Encryption banner in ChatWindow**. Three states: ready (faint gold "end-to-end encrypted"), no-own-key (amber prompt to set up keys), recipient-no-key (amber "this person hasn't set up encryption — your messages are stored as plaintext").
6. **Key backup/recovery surface** at `/social/profile/keys/`. Download private key as .txt, import on a new device, or regenerate (destructive). Linked from the user dropdown in NavAuth.

## What we ship in v1

libsodium sealed boxes (X25519). Each user generates a keypair on signup. Public key persists to `profiles.encryption_public_key`; private key stays in the user's `localStorage`. Senders fetch the recipient's public key, encrypt client-side, and store ciphertext in `messages.encrypted_content`. The server never sees plaintext.

## What this gets us

- Server can't read message bodies even if the database is compromised.
- No third party (CDN, network) can read in-transit content beyond what TLS already protects.
- Failed decryptions are visible to the user as failed — no silent corruption.

## What this does NOT get us

- **No forward secrecy.** Compromising the recipient's private key reveals every past message. (Signal-style double-ratchet would fix this; v2 work.)
- **No sender authentication.** Anyone with the recipient's public key can encrypt to it. We rely on the messages table's `sender_id` (a Supabase authenticated user) to attest sender identity. The crypto layer doesn't prove it.
- **No metadata privacy.** Conversation membership, message timing, message count are all visible in the database to anyone with admin access. Sealed boxes hide the message body, not the social graph.
- **Key loss = message loss.** Mitigated by the keys panel at `/social/profile/keys/` (download-as-txt). Users who don't back up and clear localStorage lose access to all past encrypted DMs. v2 should add passphrase-derived recovery.

## User flows

### First signup
1. User signs up via AuthForm (email/password, Google, or Privy).
2. After Supabase session resolves, AuthProvider calls `ensureEncryptionKeypair`.
3. libsodium generates keypair; private key saved to localStorage as `frqncy.nrg.encrypted_messaging.private_key.b64`; public key written to `profiles.encryption_public_key`.
4. User navigates to /social/messages/. Banner shows "end-to-end encrypted" once their conversation partner also has a key.

### Returning on the same device
1. AuthProvider sees both private key in localStorage AND public key on profile. No-op.
2. Messaging UI flips encryption banner to "ready" once the other member's key is fetched.

### New device (or cleared localStorage)
1. AuthProvider sees public key on profile but no private key locally.
2. Logs `[encryption] new-device state` — does NOT auto-generate (would orphan past messages).
3. Banner in ChatWindow shows "Your encryption key isn't set up on this device" with a link to `/social/profile/keys/`.
4. User uploads their backup .txt → private key restored → past messages decrypt on next page load.

### Lost backup
1. User has no private key, no backup file.
2. Two choices on the keys panel: live with `[unable to decrypt]` on past messages, OR regenerate (types "regenerate" to confirm). Regeneration writes a fresh public key — past encrypted messages stay un-decryptable forever.

### Talking to a user who hasn't set up encryption yet
1. Their `profiles.encryption_public_key` is null. (Pre-migration users, or users who haven't logged in since the encryption rollout.)
2. Sender's UI shows the amber "this person hasn't set up encryption" banner.
3. Send proceeds with plaintext (`encryption_version=0`). The message DOES get delivered.
4. Once the recipient logs in, AuthProvider generates their keypair on next session. Future messages are encrypted; past plaintext messages stay readable as plaintext.

## Files

- `src/lib/crypto.ts` — libsodium primitives (`generateMessagingKeypair`, `encryptToPublicKey`, `decryptFromSealedBox`, `save/loadPrivateKeyLocal`).
- `src/lib/useMessages.ts` — encrypt-on-send, decrypt-on-receive, encryption status surfacing. Handles both v1 (1:1) and v2 (group) paths.
- `src/lib/encrypted-upload.ts` — file encryption primitive for attachments (foundation, not yet wired).
- `src/components/AuthProvider.tsx` — `ensureEncryptionKeypair` runs on every signed-in load.
- `src/components/ChatWindow.tsx` — `EncryptionBanner` + per-message decrypted/failed rendering.
- `src/components/EncryptionKeysPanel.tsx` — backup, import, regenerate UI.
- `src/pages/profile/keys.astro` — wraps the panel.
- `src/components/NavAuth.tsx` — link to /social/profile/keys/ in the user dropdown.
- `supabase/migrations/006_messaging_e2ee.sql` — `encryption_public_key`, `encrypted_content`, `encryption_version` columns.
- `supabase/migrations/008_group_chat_encryption.sql` — `message_recipients` table for per-recipient ciphertexts (group chats).

## Threat model in plain language

**Reads protected against:**
- Database leak / breach of the Supabase project. Encrypted ciphertext is useless without the recipient's private key.
- Backend admins (including the FRQNCY operator). Server cannot read DM content.
- Network observers between the user and the database (TLS already protects this; sealed boxes add a second layer).
- A future stolen ciphertext-only backup.

**Reads NOT protected against:**
- Recipient's private key being stolen from their device. Anyone with the .txt backup can read every past message ever sent to them.
- Sender's keystroke logger / device compromise. The encryption happens in the browser; if the browser is compromised, plaintext is too.
- Network metadata (who messaged whom, when, how much). Conversation membership and timing are still visible in the database. For group chats, the `message_recipients` table also leaks "this message was addressed to these N users" to anyone with admin DB access, even though the bodies stay encrypted.

## What's pending

- **Passphrase-derived recovery**. Today the only recovery is the .txt backup. A passphrase-derived deterministic key would let users recover without a file (at the cost of needing a long memorable passphrase).

## What shipped in v1.2 (encrypted media)

DM attachments now flow through the same per-recipient sealed-box envelope that
group chat text messages use. The primitive in `src/lib/encrypted-upload.ts` is
finally wired end-to-end through `useMessages` + `MessageInput` + `ChatWindow`.

- **Compose flow**: `MessageInput` now has a paperclip button. Picked file
  shows as a chip above the textarea (filename + size + remove). Send accepts
  `(content, attachment?)` — text-only, attachment-only, and combined sends
  all work.
- **Encryption + upload**: `useMessages.send` inserts the message row first
  (so we have a real `message_id`), then encrypts the file with
  `encryptFileForRecipients` to *every* member's pubkey including the sender's
  own (so a future-device sender can re-decrypt their own attachment). The
  base64 ciphertext is uploaded to `dm-media/<conversation_id>/<message_id>`
  and the row is UPDATEd with `encrypted_media_path`. If anything in the media
  block fails the text part is already delivered — the attachment just doesn't
  show up. Text reliability beats media.
- **Optimistic local URL**: the sender doesn't re-download their own
  attachment to render it. We `URL.createObjectURL(file)` directly off the
  picked File and cache it under the message id.
- **Receive flow**: a new effect in `useMessages` walks any rows with
  `encrypted_media_path` set, downloads the ciphertext blob from `dm-media`,
  decrypts via `decryptFileWithOwnKey`, re-tags with the original MIME, and
  caches an Object URL in `mediaUrlCacheRef`. In-flight guard via
  `mediaInflightRef` prevents duplicate downloads on rapid re-renders.
- **Render**: `ChatWindow` shows the existing text bubble plus an
  `EncryptedMedia` component below it. Three states: `pending` (spinner),
  `decrypted` (img preview for images, download link for everything else), and
  `failed` (italic "[unable to decrypt attachment]" placeholder).
- **Cleanup**: cached Object URLs are `URL.revokeObjectURL`'d in a cleanup
  effect keyed on `conversationId` (and on hook unmount).
- **RLS**: bucket `dm-media` is private. The new policies in migration 011
  scope reads + writes to conversation members via
  `(storage.foldername(name))[1] = conversation_id`. Non-members can't
  download even the ciphertext.

### Per-recipient envelope for groups

For a 1:1 chat the upload is a raw libsodium sealed box of the file bytes (no
JSON envelope, smallest possible payload). For a group with 3+ members it's
the v1 envelope from `encrypted-upload.ts`: random symmetric body key,
`crypto_secretbox_easy` encrypts the file once, then the symmetric key is
sealed-boxed N times — once per member's pubkey. Decrypt picks the wrapped
key indexed by the recipient's own pubkey.

### Metadata leaks (admin DB queries)

- `messages.encrypted_media_mime` (e.g. `image/jpeg`) — admins see the type
  even though they can't see the bytes. Acceptable: the same metadata leaks
  via the renderer's `<img>` MIME handling regardless.
- `messages.encrypted_media_size` — pre-encryption file size in plaintext.
  Useful for client-side render decisions; trade-off is the size leak.
- `messages.encrypted_media_path` — leaks the conversation_id (first folder
  segment), same as message rows already leak conversation membership.

These are intentional v1.2 trade-offs. A v1.3 could move all three columns
into a per-recipient encrypted JSON sidecar at the cost of a second round-trip.

## What shipped in v1.1 (group chats)

The encrypt path now handles 3+ member conversations.

- **1:1 (unchanged):** sender encrypts once with the recipient's pubkey, writes `encrypted_content` + `encryption_version=1` on the messages row. All historical messages still decrypt.
- **Group (new):** sender encrypts the same plaintext N times (once per non-self member's pubkey). The messages row has `content=NULL`, `encrypted_content=NULL`, `encryption_version=2`. The N ciphertexts go into a side table `message_recipients (message_id, recipient_id, encrypted_content)` with RLS that lets each recipient SELECT only their own row.
- **On read:** `useMessages.decryptRow` checks `encryption_version`. v1 → decrypt `encrypted_content` directly. v2 → fetch from `message_recipients` keyed on `(message_id, current user_id)` and decrypt that row.
- **Encryption status:** `encryptionStatus='ready'` requires *every* non-self member to have a pubkey. If even one is missing, the banner flips to `'recipient-no-key'` and `send()` falls back to plaintext for the whole message — we refuse partial encryption to avoid the half-encrypted state where some members read ciphertext and others read clear.

Schema is in `supabase/migrations/008_group_chat_encryption.sql`. No migration of historical rows — v1 messages keep working alongside v2.

## Encrypted media primitive (foundation, not yet wired)

`src/lib/encrypted-upload.ts` exposes two functions for encrypting file blobs to one or more recipients. **This is foundation only — no UI calls it yet.** Wire it into the attachment flow in v1.1 media work.

- `encryptFileForRecipients(file, recipientPublicKeysB64[])` → `{ ciphertextB64, mimeType, originalSize }`. Single recipient: raw libsodium sealed box of the file bytes. Multi-recipient: random symmetric key encrypts the body once (`crypto_secretbox_easy`), each recipient gets the symmetric key sealed-box-encrypted to them, packed as a JSON envelope `{ v: 1, mime, originalSize, nonce, body, encryptedKey: { recipientPubB64: cipher, ... } }`, then base64.
- `decryptFileWithOwnKey(ciphertextB64, ownPublicKeyB64, ownPrivateKeyB64)` → `Blob | null`. Auto-detects envelope vs. raw sealed box. Returns a Blob that can drive `URL.createObjectURL` for inline rendering.

Future image-upload flow:
1. User picks file in the chat composer.
2. Resolve all conversation members' pubkeys (same map `useMessages` already builds).
3. Call `encryptFileForRecipients(file, [...pubkeys])`.
4. Upload `ciphertextB64` (or its decoded bytes) to Supabase Storage as a `.bin` blob.
5. Write the messages row with `media_url` pointing at the storage object and `encryption_version=2` (envelope format already supports per-recipient access).
6. On read, recipient downloads the blob, calls `decryptFileWithOwnKey`, displays via `URL.createObjectURL(blob)`.

The primitive does not chunk. For files >10MB, swap the body to `crypto_secretstream` chunks; the format version (`v: 1`) is the upgrade path.

## Migration path to v2 (Signal-style double ratchet)

Future work. The `encryption_version` column on messages lets v2 clients recognize and decrypt v1 sealed-box messages while writing v2 ratchet ciphertext for new ones. v1 messages stay readable indefinitely so long as the user retains their v1 private key. When v2 ships, every existing user keeps their v1 history; new conversations move to v2 ratchet keys.

## Why sealed boxes (and not Signal) in v1

Sealed boxes are simple, libsodium ships them, no protocol state machine to maintain, no key-management ceremony per-message. The cost is no forward secrecy — fine for FRQNCY's audience and threat model in v1, where the win is "server can't read your DMs" not "compromise of your key in 2027 doesn't reveal your 2026 messages." When the audience grows or the threat model tightens, v2 adds the ratchet.
