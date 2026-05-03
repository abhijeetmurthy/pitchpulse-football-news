import Parser from "rss-parser";
import { writeJson, summarize } from "./utils.mjs";
import { httpClient } from "./http-client.mjs";
import { classifyArticle } from "./classify-news.mjs";
import { listScrapeSources, markSourceScraped, replaceArticles } from "./db.mjs";
import { syncSourceRegistry } from "./source-registry.mjs";

const parser = new Parser();

function normalizeItem(source, item, index) {
  const description = item.contentSnippet || item.content || item.summary || "";
  const combined = `${item.title || ""} ${description}`;
  const classification = classifyArticle(combined, {
    leagueKey: source.leagueKey,
    leagueName: source.leagueName,
    nation: source.nation
  });
  const publishedAt = item.isoDate || item.pubDate || new Date().toISOString();

  return {
    id: `${source.name}-${item.guid || item.link || index}`.replace(/\s+/g, "-").slice(0, 240),
    source: source.name,
    sourceUrl: source.url,
    title: item.title || "Untitled",
    summary: summarize(description || "No summary provided."),
    link: item.link,
    leagueKey: classification.leagueKey,
    leagueName: classification.leagueName,
    nation: classification.nation,
    category: classification.category,
    publishedAt,
    publishedAtTs: new Date(publishedAt).getTime(),
    scrapedAt: new Date().toISOString()
  };
}

export async function scrapeNews() {
  await syncSourceRegistry();
  const sources = await listScrapeSources({ sourceType: "rss", keepScraping: true });
  const allArticles = [];

  for (const source of sources) {
    try {
      const { data: xml } = await httpClient.get(source.url, { responseType: "text" });
      const feed = await parser.parseString(xml);
      const normalized = (feed.items || [])
        .slice(0, 30)
        .map((item, idx) => normalizeItem(source, item, idx))
        .filter((item) => item.link);

      allArticles.push(...normalized);
      await markSourceScraped(source.url);
      console.log(`Fetched ${normalized.length} items from ${source.name}`);
    } catch (error) {
      console.error(`Failed source ${source.name}:`, error.message);
    }
  }

  const deduped = Array.from(new Map(allArticles.map((a) => [a.link, a])).values())
    .sort((a, b) => b.publishedAtTs - a.publishedAtTs)
    .slice(0, 250);

  await replaceArticles(deduped);
  await writeJson("data/news.json", deduped);
  return deduped;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  scrapeNews().then((items) => console.log(`Saved ${items.length} news articles.`));
}
