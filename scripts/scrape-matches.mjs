import { writeJson } from "./utils.mjs";
import { httpClient } from "./http-client.mjs";
import { listScrapeSources, markSourceScraped, replaceMatches } from "./db.mjs";
import { syncSourceRegistry } from "./source-registry.mjs";

function toMatch(source, event) {
  const comp = event.competitions?.[0];
  const home = comp?.competitors?.find((c) => c.homeAway === "home");
  const away = comp?.competitors?.find((c) => c.homeAway === "away");
  const score = home?.score && away?.score ? `${home.score}-${away.score}` : null;

  return {
    id: `${source.leagueKey}-${event.id}`,
    eventId: event.id,
    leagueKey: source.leagueKey,
    league: source.leagueName,
    nation: source.nation,
    home: home?.team?.displayName || "Home",
    away: away?.team?.displayName || "Away",
    score,
    status: event.status?.type?.description || "Scheduled",
    kickoff: event.date,
    kickoffTs: new Date(event.date).getTime(),
    sourceUrl: source.url,
    scrapedAt: new Date().toISOString()
  };
}

export async function scrapeMatches() {
  await syncSourceRegistry();
  const endpoints = await listScrapeSources({ sourceType: "scoreboard", keepScraping: true });
  const matches = [];

  for (const endpoint of endpoints) {
    try {
      const { data } = await httpClient.get(endpoint.url, { timeout: 15000 });
      const mapped = (data.events || []).map((event) => toMatch(endpoint, event));
      matches.push(...mapped);
      await markSourceScraped(endpoint.url);
      console.log(`Fetched ${mapped.length} matches from ${endpoint.leagueName}`);
    } catch (error) {
      console.error(`Failed ${endpoint.leagueName} scoreboard:`, error.message);
    }
  }

  const deduped = Array.from(new Map(matches.map((m) => [m.id, m])).values());
  await replaceMatches(deduped);
  await writeJson("data/matches.json", deduped);
  return deduped;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  scrapeMatches().then((items) => console.log(`Saved ${items.length} matches.`));
}
