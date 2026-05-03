import { writeJson } from "./utils.mjs";
import { httpClient } from "./http-client.mjs";

const SCOREBOARD_ENDPOINTS = [
  { league: "Premier League", url: "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard" },
  { league: "La Liga", url: "https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/scoreboard" },
  { league: "Champions League", url: "https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions/scoreboard" }
];

function toMatch(league, event) {
  const comp = event.competitions?.[0];
  const home = comp?.competitors?.find((c) => c.homeAway === "home");
  const away = comp?.competitors?.find((c) => c.homeAway === "away");
  const score = home?.score && away?.score ? `${home.score}-${away.score}` : null;

  return {
    id: event.id,
    league,
    home: home?.team?.displayName || "Home",
    away: away?.team?.displayName || "Away",
    score,
    status: event.status?.type?.description || "Scheduled",
    kickoff: event.date
  };
}

export async function scrapeMatches() {
  const matches = [];

  for (const endpoint of SCOREBOARD_ENDPOINTS) {
    try {
      const { data } = await httpClient.get(endpoint.url, { timeout: 15000 });
      const mapped = (data.events || []).map((event) => toMatch(endpoint.league, event));
      matches.push(...mapped);
      console.log(`Fetched ${mapped.length} matches from ${endpoint.league}`);
    } catch (error) {
      console.error(`Failed ${endpoint.league} scoreboard:`, error.message);
    }
  }

  const deduped = Array.from(new Map(matches.map((m) => [m.id, m])).values());
  await writeJson("data/matches.json", deduped);
  return deduped;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  scrapeMatches().then((items) => console.log(`Saved ${items.length} matches.`));
}
