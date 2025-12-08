# TRMNL Monarch Money Plugin

A TRMNL private plugin that displays recent transactions from your [Monarch Money](https://monarchmoney.com) account.

![TRMNL](https://usetrmnl.com/images/trmnl-logo.svg)

## Features

- 💰 Display recent transactions with amounts
- 🏷️ Category icons for visual identification
- 🏦 Account name display
- ⏳ Pending transaction badges
- 📅 Relative date formatting (Today, Yesterday, 3d ago, etc.)
- 📱 Multiple display sizes (full, half, quadrant)

## Prerequisites

- A [Monarch Money](https://monarchmoney.com) account
- A [Vercel](https://vercel.com) account (for hosting the API)
- A [TRMNL](https://usetrmnl.com) device
- Node.js 18+ (for local development)

## Quick Start

### 1. Clone and Deploy to Vercel

```bash
# Clone this repository
git clone <your-repo-url>
cd trmnl-monarch

# Deploy to Vercel
vercel deploy --prod
```

### 2. Configure Environment Variables

In your Vercel project settings, add environment variables based on your login method:

#### For Google OAuth Users (Recommended for Google login)

| Variable | Description | Required |
|----------|-------------|----------|
| `MONARCH_TOKEN` | Your Monarch session token | Yes |

**How to get your token:**
1. Go to [app.monarchmoney.com](https://app.monarchmoney.com) and login with Google
2. Open browser DevTools (F12 or Cmd+Option+I on Mac)
3. Go to **Application** tab → **Local Storage** → `https://app.monarchmoney.com`
4. Look for the key `mm_at` - copy its value
5. Alternatively: Go to **Network** tab, make any request, and find the `Authorization: Token ...` header

> ⚠️ **Note:** This token may expire periodically (typically after a few weeks). You'll need to refresh it when it expires.

#### For Email/Password Users

| Variable | Description | Required |
|----------|-------------|----------|
| `MONARCH_EMAIL` | Your Monarch Money email | Yes |
| `MONARCH_PASSWORD` | Your Monarch Money password | Yes |
| `MONARCH_MFA_SECRET` | TOTP secret for MFA (if enabled) | No |

### 3. Set Up TRMNL Private Plugin

1. Go to your [TRMNL Dashboard](https://usetrmnl.com/dashboard)
2. Navigate to **Plugins** → **Private Plugins**
3. Create a new private plugin
4. Upload the contents of the `src/` folder
5. Configure the plugin settings:
   - **API URL**: Your Vercel deployment URL (e.g., `https://your-app.vercel.app/api/monarch`)
   - Other display preferences as desired

## Local Development

### Install TRMNL CLI

```bash
npm install -g trmnlp
```

### Set Up Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your Monarch credentials
nano .env
```

### Run Locally

```bash
# Start the Vercel dev server (for the API)
npm run dev

# In a separate terminal, start the TRMNL preview
npm run trmnl
```

The TRMNL preview will be available at `http://localhost:8080`

## Configuration Options

| Setting | Description | Default |
|---------|-------------|---------|
| Show Account Name | Display which account each transaction is from | true |
| Show Category | Display category name and icon | true |
| Show Date | Display relative date | true |
| Show Pending Badge | Show badge for pending transactions | true |
| Show Title Bar | Display the plugin title bar | true |

## API Parameters

The API endpoint supports the following query parameters:

| Parameter | Description | Default |
|-----------|-------------|---------|
| `limit` | Number of transactions to fetch (max 50) | 10 |
| `start_date` | Filter transactions from this date (YYYY-MM-DD) | - |
| `end_date` | Filter transactions to this date (YYYY-MM-DD) | - |

Example: `https://your-app.vercel.app/api/monarch?limit=20`

## Category Icons

Transactions are displayed with emoji icons based on their category:

| Category | Icon |
|----------|------|
| Groceries | 🛒 |
| Restaurants | 🍴 |
| Gas | ⛽ |
| Shopping | 🛍️ |
| Entertainment | 🎬 |
| Income | 💰 |
| Transfer | ↔️ |
| ... and many more | |

## Multi-Factor Authentication (MFA)

If your Monarch Money account has MFA enabled, you'll need to provide your TOTP secret key in the `MONARCH_MFA_SECRET` environment variable.

To get your TOTP secret:
1. When setting up your authenticator app, look for the "manual entry" or "secret key" option
2. Copy this secret key and add it to your environment variables

**Note**: If you've already set up MFA and don't have the secret, you may need to disable and re-enable MFA to obtain it.

## Troubleshooting

### "Token expired" or "Unauthorized" error (Google OAuth users)
- Your session token has expired
- Get a new token from the browser (see instructions above)
- Update the `MONARCH_TOKEN` environment variable in Vercel

### "Login failed" error (Email/Password users)
- Verify your email and password are correct
- Check if MFA is required and configure `MONARCH_MFA_SECRET`

### "MFA_REQUIRED" error
- Your account has MFA enabled
- Add the `MONARCH_MFA_SECRET` environment variable

### No transactions appearing
- Verify the API URL is correct in TRMNL settings
- Check Vercel function logs for errors
- Ensure your Monarch account has transactions
- For Google OAuth: Make sure your token is fresh

## Project Structure

```
trmnl-monarch/
├── api/
│   └── monarch.js      # Vercel serverless function
├── src/
│   ├── settings.yml    # TRMNL plugin settings
│   ├── shared.liquid   # Shared components
│   ├── full.liquid     # Full screen template
│   ├── half_horizontal.liquid
│   ├── half_vertical.liquid
│   └── quadrant.liquid # Smallest display
├── .env.example        # Environment template
├── .trmnlp.yml         # Local dev config
├── package.json
├── vercel.json
└── README.md
```

## License

MIT

## Disclaimer

This plugin is not affiliated with or endorsed by Monarch Money. Use at your own risk. Your credentials are stored securely in Vercel environment variables and are never exposed to TRMNL or third parties.
