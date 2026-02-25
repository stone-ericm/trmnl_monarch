# TRMNL Monarch Money

A TRMNL private plugin that displays recent transactions from Monarch Money on an e-ink screen.

## What It Does

Fetches your latest transactions from Monarch Money and renders them for TRMNL's e-ink display. Each transaction shows the merchant name, amount, category, account name, and relative date. Pending transactions are marked with a badge. Income and expenses are visually distinguished.

## Display Layouts

The plugin supports all four TRMNL display sizes:

- **Full** -- Up to 10 transactions with merchant, amount, category, account, date, and pending badge.
- **Half Horizontal** -- Up to 5 transactions with the same detail as full.
- **Half Vertical** -- Up to 7 transactions in compact mode (category icon, merchant, amount).
- **Quadrant** -- Up to 4 transactions in compact mode.

All layouts support toggling the title bar on or off via plugin settings.

## Setup

### 1. Deploy to Vercel

Fork or clone this repo, then deploy to Vercel:

```
npm i -g vercel
vercel --prod
```

Or connect the repo directly in the Vercel dashboard for automatic deploys.

### 2. Set Environment Variables

In your Vercel project settings, add one of the following authentication configurations (see the Authentication section below):

**Token auth:**

| Variable | Description |
|---|---|
| `MONARCH_TOKEN` | Session token from your browser |

**Email/password auth:**

| Variable | Description |
|---|---|
| `MONARCH_EMAIL` | Your Monarch Money email |
| `MONARCH_PASSWORD` | Your Monarch Money password |
| `MONARCH_MFA_SECRET` | (Optional) TOTP secret for MFA |

### 3. Configure TRMNL

1. In the TRMNL dashboard, create a new Private Plugin.
2. Set the polling strategy to **Webhook/Polling**.
3. Set the API URL to your Vercel deployment endpoint: `https://your-app.vercel.app/api/monarch`
4. Upload the Liquid templates from `src/` for each display size (full, half_horizontal, half_vertical, quadrant), along with `shared.liquid`.

### 4. Plugin Settings

These options are configurable in the TRMNL plugin settings panel:

| Setting | Default | Description |
|---|---|---|
| Show Account Name | true | Display which account each transaction is from |
| Show Category | true | Display category name/icon |
| Show Date | true | Display relative date (e.g. "Today", "3d ago") |
| Show Pending Badge | true | Show a badge on pending transactions |
| Show Title Bar | true | Display the plugin title bar |

## Authentication

**Method 1 -- Session Token (recommended for Google OAuth users)**

If you log in to Monarch Money with Google, you cannot use email/password auth. Instead:

1. Log in to [monarchmoney.com](https://monarchmoney.com) in your browser.
2. Open DevTools and find a request to `api.monarchmoney.com`.
3. Copy the `Authorization` header value (the token after `Token `).
4. Set `MONARCH_TOKEN` in your Vercel environment variables.

Note: Session tokens expire periodically and will need to be refreshed.

**Method 2 -- Email and Password**

Set `MONARCH_EMAIL` and `MONARCH_PASSWORD`. If your account has MFA enabled, also set `MONARCH_MFA_SECRET` to your TOTP secret (the base32 string you get when setting up an authenticator app). The server generates TOTP codes automatically at request time.

## API Query Parameters

The `/api/monarch` endpoint accepts optional query parameters:

| Parameter | Default | Description |
|---|---|---|
| `limit` | 10 | Number of transactions to fetch (max 50) |
| `start_date` | -- | Filter start date (YYYY-MM-DD) |
| `end_date` | -- | Filter end date (YYYY-MM-DD) |

## Local Development

```
npm run trmnl    # Serve templates with trmnlp
npm run dev      # Run Vercel dev server locally
```

The `.trmnlp.yml` file configures local development defaults for the TRMNL plugin preview tool.

## Tech Stack

- Node.js 18+ (Vercel Serverless Function, zero dependencies)
- Monarch Money GraphQL API
- Liquid templates (TRMNL rendering engine)
- Vercel for deployment
