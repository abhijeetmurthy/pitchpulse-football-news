import * as cheerio from "cheerio";
import { readJson, writeJson } from "./utils.mjs";
import { httpClient } from "./http-client.mjs";

function findCurrentSquad($) {
  const players = new Set();

  $("table.wikitable tr").each((_, row) => {
    const cells = $(row).find("td");
    if (cells.length < 2) return;

    const maybeName = $(cells[1]).find("a").first().text().trim();
    if (maybeName && maybeName.length > 3 && !/position|manager|coach/i.test(maybeName)) {
      players.add(maybeName);
    }
  });

  return Array.from(players).slice(0, 35);
}

export async function scrapeClubs() {
  const clubSources = await readJson("config/club-sources.json", []);
  const clubs = [];

  for (const club of clubSources) {
    try {
      const { data } = await httpClient.get(club.url, { timeout: 20000 });
      const $ = cheerio.load(data);
      const players = findCurrentSquad($);

      clubs.push({
        ...club,
        players,
        scrapedAt: new Date().toISOString()
      });

      console.log(`Fetched ${players.length} players for ${club.name}`);
    } catch (error) {
      console.error(`Failed club scrape ${club.name}:`, error.message);
      clubs.push({
        ...club,
        players: [],
        scrapedAt: new Date().toISOString()
      });
    }
  }

  await writeJson("data/clubs.json", clubs);
  return clubs;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  scrapeClubs().then((items) => console.log(`Saved ${items.length} club profiles.`));
}
