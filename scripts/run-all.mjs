import { scrapeNews } from "./scrape-news.mjs";
import { scrapeMatches } from "./scrape-matches.mjs";
import { scrapeClubs } from "./scrape-clubs.mjs";
import { scrapeLeaguesAndRosters } from "./scrape-leagues.mjs";
import { syncSourceRegistry } from "./source-registry.mjs";

async function run() {
  const started = Date.now();
  await syncSourceRegistry();
  const [news, matches, clubs, leagueData] = await Promise.all([
    scrapeNews(),
    scrapeMatches(),
    scrapeClubs(),
    scrapeLeaguesAndRosters()
  ]);

  const elapsed = ((Date.now() - started) / 1000).toFixed(1);
  console.log(
    `Done in ${elapsed}s | news=${news.length}, matches=${matches.length}, clubs=${clubs.length}, standings=${leagueData.standings.length}, teams=${leagueData.teams.length}, players=${leagueData.players.length}`
  );
}

run();
