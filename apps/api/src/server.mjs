import "dotenv/config";
import express from "express";
import cors from "cors";
import cron from "node-cron";
import { scrapeNews } from "../../../scripts/scrape-news.mjs";
import { scrapeMatches } from "../../../scripts/scrape-matches.mjs";
import { scrapeClubs } from "../../../scripts/scrape-clubs.mjs";
import { scrapeLeaguesAndRosters } from "../../../scripts/scrape-leagues.mjs";
import { syncSourceRegistry } from "../../../scripts/source-registry.mjs";
import {
  getArticles,
  getClubs,
  getGroupedNews,
  getMatches,
  getOverview,
  getStandingsByLeague,
  getTeamsByLeague,
  listScrapeSources
} from "../../../scripts/db.mjs";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.get("/api/news", async (req, res) => {
  const { leagueKey, nation, limit } = req.query;
  const rows = await getArticles({
    leagueKey: leagueKey || undefined,
    nation: nation || undefined,
    limit: Number(limit || 120)
  });
  res.json(rows);
});

app.get("/api/news/grouped", async (_req, res) => {
  const grouped = await getGroupedNews(8);
  res.json(grouped);
});

app.get("/api/matches", async (_req, res) => {
  res.json(await getMatches());
});

app.get("/api/clubs", async (_req, res) => {
  res.json(await getClubs());
});

app.get("/api/standings", async (_req, res) => {
  res.json(await getStandingsByLeague());
});

app.get("/api/teams", async (_req, res) => {
  res.json(await getTeamsByLeague());
});

app.get("/api/sources", async (_req, res) => {
  const allSources = await listScrapeSources({});
  const activeSources = allSources.filter((source) => source.keepScraping);
  res.json({
    activeCount: activeSources.length,
    totalCount: allSources.length,
    sources: allSources
  });
});

app.get("/api/overview", async (_req, res) => {
  res.json(await getOverview());
});

app.post("/api/scrape", async (_req, res) => {
  const [news, matches, clubs, leagueData] = await Promise.all([
    scrapeNews(),
    scrapeMatches(),
    scrapeClubs(),
    scrapeLeaguesAndRosters()
  ]);

  res.json({
    message: "Scrape finished",
    news: news.length,
    matches: matches.length,
    clubs: clubs.length,
    standings: leagueData.standings.length,
    teams: leagueData.teams.length,
    players: leagueData.players.length
  });
});

async function primeData() {
  await syncSourceRegistry();
  const overview = await getOverview();
  if (!overview.articleCount || !overview.matchCount || !overview.teamCount || !overview.standingsCount) {
    console.log("DB missing key datasets. Running initial scrape...");
    await Promise.all([scrapeNews(), scrapeMatches(), scrapeClubs(), scrapeLeaguesAndRosters()]);
  }
}

cron.schedule("0 */3 * * *", async () => {
  console.log("Scheduled scrape: news + matches");
  await Promise.all([scrapeNews(), scrapeMatches()]);
});

cron.schedule("30 */6 * * *", async () => {
  console.log("Scheduled scrape: standings + teams + players");
  await scrapeLeaguesAndRosters();
});

cron.schedule("30 2 * * *", async () => {
  console.log("Scheduled scrape: clubs");
  await scrapeClubs();
});

cron.schedule("0 */12 * * *", async () => {
  console.log("Scheduled sync: scrape source registry");
  await syncSourceRegistry();
});

primeData()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Football API running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Startup failed:", err);
    process.exit(1);
  });
