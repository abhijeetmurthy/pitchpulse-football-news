import { scrapeNews } from "./scrape-news.mjs";
import { scrapeMatches } from "./scrape-matches.mjs";
import { scrapeClubs } from "./scrape-clubs.mjs";

async function run() {
  const started = Date.now();
  const [news, matches, clubs] = await Promise.all([
    scrapeNews(),
    scrapeMatches(),
    scrapeClubs()
  ]);

  const elapsed = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`Done in ${elapsed}s | news=${news.length}, matches=${matches.length}, clubs=${clubs.length}`);
}

run();
