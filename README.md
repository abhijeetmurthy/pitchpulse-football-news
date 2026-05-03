# PitchPulse: Football Intelligence Platform

Full-stack football data app that now supports:

- News organized by `league` and `nation`
- League standings tables for tracked competitions
- Teams and players (roster scraping) for each tracked league
- Scrape source registry stored in DB with `keepScraping` flag
- Scheduled scrape jobs (news, matches, standings, teams, players, clubs)

## Architecture

1. `config/scrape-websites.json`
- master list of websites/endpoints to scrape
- every source has metadata (`sourceType`, `leagueKey`, `nation`, `keepScraping`)

2. `scripts/`
- `source-registry.mjs`: sync sources into embedded DB
- `scrape-news.mjs`: fetch + classify news by league/nation
- `scrape-matches.mjs`: scrape scoreboard feeds
- `scrape-leagues.mjs`: standings + teams + player rosters
- `scrape-clubs.mjs`: club player lists + legends
- `db.mjs`: embedded DB layer (`data/db/*.db`)

3. `apps/api`
- serves DB-backed endpoints for all sections
- runs recurring cron refresh jobs

4. `apps/web`
- renders grouped news, standings tables, teams + players, and source registry

## Run locally

```bash
cd /Users/abhijeetmurthy/Development/football-news-ai
npm install
npm install --prefix apps/api
npm install --prefix apps/web
npm run scrape
npm run dev
```

Open:

- Web app: http://127.0.0.1:54173
- API overview: http://127.0.0.1:58080/api/overview

## DB-backed scrape source list

- Config file: `config/scrape-websites.json`
- DB collection: `sources` in `data/db/sources.db`
- Active sources are those with `keepScraping: true`

Sync registry only:

```bash
npm run sources:sync
```

## Key API endpoints

- `GET /api/news`
- `GET /api/news/grouped`
- `GET /api/matches`
- `GET /api/standings`
- `GET /api/teams`
- `GET /api/clubs`
- `GET /api/sources`
- `GET /api/overview`
- `POST /api/scrape`

## Notes

- This project scrapes a curated source list; it does not attempt to crawl the entire web.
- Respect each source's terms and robots policies before expanding coverage.
- TLS note: scraper runs in compatibility mode by default for certificate-chain issues. Set `ALLOW_INSECURE_TLS=false` to enforce strict TLS.
