# PitchPulse: AI-Synthesized Football News App

A full-stack football intelligence dashboard with:

- Live-ish match tracking via public scoreboard endpoints
- News aggregation from football RSS feeds
- Club profile scraping (players + legends)
- Auto-refresh scraping jobs through cron
- A high-contrast, visually rich frontend dashboard

## High-level architecture

1. `scripts/` collects data from internet sources and writes JSON datasets.
2. `apps/api` serves those datasets and exposes manual scrape endpoints.
3. `apps/web` renders the football newsroom UI and calls the API.
4. `node-cron` jobs in the API refresh datasets regularly.

## Project structure

- `apps/api/src/server.mjs`: Express API + cron scheduler
- `apps/web/src/App.jsx`: Main dashboard UI
- `scripts/scrape-news.mjs`: Aggregates football headlines
- `scripts/scrape-matches.mjs`: Fetches match scoreboard data
- `scripts/scrape-clubs.mjs`: Scrapes club pages for players + legends
- `config/rss-sources.json`: News feed list
- `config/club-sources.json`: Clubs to profile
- `data/*.json`: Cached dataset files used by the app

## Run locally

```bash
cd /Users/abhijeetmurthy/Development/football-news-ai
npm install
npm install --prefix apps/api
npm install --prefix apps/web
npm run scrape
npm run dev
```

Then open:

- Web app: http://localhost:5173
- API: http://localhost:8080/api/overview

## Manual scrape

```bash
npm run scrape
```

or:

```bash
curl -X POST http://localhost:8080/api/scrape
```

## Important notes

- "Scrape all webpages" is not technically finite. This project uses a controlled, configurable source list and scheduled refreshes.
- Always review source site terms of service and robots policies before expanding crawling.
- Update `config/club-sources.json` and `config/rss-sources.json` to expand coverage.

## GitHub push

```bash
git init
git add .
git commit -m "Initial football AI news app"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```
