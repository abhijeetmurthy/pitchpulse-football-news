import "dotenv/config";
import express from "express";
import cors from "cors";
import cron from "node-cron";
import { readJson } from "../../../scripts/utils.mjs";
import { scrapeNews } from "../../../scripts/scrape-news.mjs";
import { scrapeMatches } from "../../../scripts/scrape-matches.mjs";
import { scrapeClubs } from "../../../scripts/scrape-clubs.mjs";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.get("/api/news", async (_req, res) => {
  const news = await readJson("data/news.json", []);
  res.json(news);
});

app.get("/api/matches", async (_req, res) => {
  const matches = await readJson("data/matches.json", []);
  res.json(matches);
});

app.get("/api/clubs", async (_req, res) => {
  const clubs = await readJson("data/clubs.json", []);
  res.json(clubs);
});

app.get("/api/overview", async (_req, res) => {
  const [news, matches, clubs] = await Promise.all([
    readJson("data/news.json", []),
    readJson("data/matches.json", []),
    readJson("data/clubs.json", [])
  ]);

  res.json({
    articleCount: news.length,
    matchCount: matches.length,
    clubCount: clubs.length,
    updatedAt: new Date().toISOString()
  });
});

app.post("/api/scrape", async (_req, res) => {
  const [news, matches, clubs] = await Promise.all([
    scrapeNews(),
    scrapeMatches(),
    scrapeClubs()
  ]);

  res.json({
    message: "Scrape finished",
    news: news.length,
    matches: matches.length,
    clubs: clubs.length
  });
});

async function primeData() {
  const [news, matches, clubs] = await Promise.all([
    readJson("data/news.json", []),
    readJson("data/matches.json", []),
    readJson("data/clubs.json", [])
  ]);

  if (!news.length || !matches.length || !clubs.length) {
    console.log("Data missing. Running initial scrape...");
    await Promise.all([scrapeNews(), scrapeMatches(), scrapeClubs()]);
  }
}

cron.schedule("0 */3 * * *", async () => {
  console.log("Running scheduled news + matches scrape...");
  await Promise.all([scrapeNews(), scrapeMatches()]);
});

cron.schedule("30 2 * * *", async () => {
  console.log("Running scheduled club scrape...");
  await scrapeClubs();
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
