# CalculaHora

Simple time tracking powered by Google Sheets. All data stays in your Google Drive; tokens are stored only in your browser.

## Stack

- React + TypeScript + Vite
- shadcn-style UI + Tailwind CSS v4
- TanStack Query
- Google Sheets & Drive APIs (OAuth PKCE + minimal serverless token exchange)
- i18n: Spanish + English

## Setup

1. Create a [Google Cloud](https://console.cloud.google.com/) project.
2. Enable **Google Sheets API** and **Google Drive API**.
3. Configure the [OAuth consent screen](https://console.cloud.google.com/auth/audience) (External).
4. While the app is in **Testing**, add every Google account that will sign in under **Test users** on the [Audience](https://console.cloud.google.com/auth/audience) page. Only listed users can complete OAuth until you publish the app.
5. Create an OAuth **Web application** client (Google Console → APIs & Services → Credentials → your client).

   **Authorized JavaScript origins** (origin only, no path):

   | Environment | URI |
   |-------------|-----|
   | Local | `http://localhost:5173` |
   | Production | `https://calculahora.vercel.app` |

   **Authorized redirect URIs** (must match the app exactly — see `src/lib/google/oauth.ts`):

   | Environment | URI |
   |-------------|-----|
   | Local | `http://localhost:5173/oauth/callback` |
   | Production | `https://calculahora.vercel.app/oauth/callback` |

   If a redirect URI is missing or differs by even one character, Google returns `redirect_uri_mismatch`.

6. Copy the client **ID** and **secret** from Credentials.
7. Copy `.env.example` to `.env` and set:

   ```env
   VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

   The **client secret** is only used by the server route `api/oauth/token` (and the Vite dev plugin). It is never sent to the browser. Google **Web application** clients require the secret when exchanging an authorization code — calling Google's token endpoint directly from the SPA causes `client_secret is missing`.

```bash
npm install
npm run dev   # restart after changing .env
```

`.env` must live in the project root (next to `package.json`). `GOOGLE_CLIENT_SECRET` is read by the dev server only — it is not bundled into the browser.

## Deploy (Vercel)

1. Import the repo in Vercel (production domain: `https://calculahora.vercel.app`).
2. Set environment variables:
   - `VITE_GOOGLE_CLIENT_ID` — same as local
   - `GOOGLE_CLIENT_SECRET` — server-only, **do not** prefix with `VITE_`
3. Ensure the production origin and redirect URI above are registered in Google Cloud (same OAuth client as local dev).
4. Add production test users (or publish the OAuth app) on the [Audience](https://console.cloud.google.com/auth/audience) page.

## Security notes

- Access and refresh tokens live in `localStorage` — protect against XSS.
- `GOOGLE_CLIENT_SECRET` stays on Vercel / in local `.env` only; the browser calls `/api/oauth/token` instead of Google’s token URL.
- Sheet data is still edited only via Google APIs using the user’s access token in the browser.
- Use `drive.file` scope: workspaces live in the app-created `CalculaHora` folder.

## Spreadsheet layout

| Sheet | Purpose |
|-------|---------|
| `workspace` | key/value metadata (version, name, timezone) |
| `projects` | id, name, billableDefault, currency, rate |
| `time-tracker` | id, startTime, endTime, title, projectId, billable, currency, rate |
