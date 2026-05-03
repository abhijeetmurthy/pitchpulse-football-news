import Parser from "rss-parser";
import { readJson, writeJson, summarize } from "./utils.mjs";
import { httpClient } from "./http-client.mjs";

const parser = new Parser();

function normalizeItem(sourceName, item, index) {
  const description = item.contentSnippet || item.content || item.summary || "";
  return {
    id: `${sourceName}-${item.guid || item.link || index}`.replace(/\s+/g, "-"),
    source: sourceName,
    title: item.title || "Untitled",
    summary: summarize(description || "No summary provided."),
    link: item.link,
    publishedAt: item.isoDate || item.pubDate || new Date().toISOString()
  };
}

export async function scrapeNews() {
  const sources = await readJson("config/rss-sources.json", []);
  const allArticles = [];

  for (const source of sources) {
    try {
      const { data: xml } = await httpClient.get(source.url, { responseType: "text" });
      const feed = await parser.parseString(xml);
      const normalized = (feed.items || []).slice(0, 20).map((item, idx) => normalizeItem(source.name, item, idx));
      allArticles.push(...normalized);
      console.log(`Fetched ${normalized.length} items from ${source.name}`);
    } catch (error) {
      console.error(`Failed source ${source.name}:`, error.message);
    }
  }

  const deduped = Array.from(new Map(allArticles.map((a) => [a.link, a])).values())
    .filter((a) => a.link)
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, 100);

  await writeJson("data/news.json", deduped);
  return deduped;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  scrapeNews().then((items) => console.log(`Saved ${items.length} news articles.`));
}
