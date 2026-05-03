import { readJson } from "./utils.mjs";
import { upsertScrapeSources } from "./db.mjs";

export async function syncSourceRegistry() {
  const sources = await readJson("config/scrape-websites.json", []);
  await upsertScrapeSources(sources);
  return sources;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  syncSourceRegistry().then((sources) => {
    console.log(`Synced ${sources.length} scrape sources into DB.`);
  });
}
