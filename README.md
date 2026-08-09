# MLB Value Betting Tool

Find the best +EV MLB plays by identifying sharp vs square money discrepancies and line value opportunities.

## Features

- **Real-time odds** from The Odds API (DraftKings, FanDuel, BetMGM, Caesars, Pinnacle, etc.)
- **Smart value detection** — identifies sharp reversals and line discrepancies
- **3 bullet points** explaining WHY each game has edge
- **Clean, mobile-friendly** interface
- **Save favorites** for tracking
- **Auto-refreshes** every 5 minutes

## What You Need

1. **Free API key** from The Odds API (https://the-odds-api.com)
2. **Vercel account** (free)
3. **GitHub account** (free)

## Deploy to Vercel

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Connect your GitHub account
4. Select this repository
5. Add Environment Variable:
   - **Name:** `ODDS_API_KEY`
   - **Value:** Your API key from The Odds API
6. Click "Deploy"
7. Wait 60 seconds
8. You get a live URL — bookmark it!

## How It Works

- Pulls live odds from 50+ sportsbooks via The Odds API
- Calculates implied probability from American odds
- Identifies when sharp books disagree with square books
- Flags games with +EV opportunity
- Shows 3 bullets explaining the edge

## Cost

- **Free forever** — Vercel free tier + The Odds API free tier (25 requests/day)
- Optional upgrade to The Odds API Pro ($29/month) for more sportsbooks
