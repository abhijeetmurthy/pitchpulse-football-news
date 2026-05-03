import Datastore from "nedb-promises";
import path from "node:path";
import fs from "node:fs/promises";
import { PROJECT_ROOT } from "./utils.mjs";

const DB_DIR = path.join(PROJECT_ROOT, "data", "db");

let stores;

function createStore(name) {
  return Datastore.create({
    filename: path.join(DB_DIR, `${name}.db`),
    autoload: true,
    timestampData: true
  });
}

async function ensureIndexes(db) {
  await db.sources.ensureIndex({ fieldName: "url", unique: true });
  await db.articles.ensureIndex({ fieldName: "link", unique: true });
  await db.matches.ensureIndex({ fieldName: "id", unique: true });
  await db.clubs.ensureIndex({ fieldName: "name", unique: true });
  await db.standings.ensureIndex({ fieldName: "rowKey", unique: true });
  await db.teams.ensureIndex({ fieldName: "teamKey", unique: true });
  await db.players.ensureIndex({ fieldName: "playerKey", unique: true });
}

export async function getStores() {
  if (stores) return stores;
  await fs.mkdir(DB_DIR, { recursive: true });

  stores = {
    sources: createStore("sources"),
    articles: createStore("articles"),
    matches: createStore("matches"),
    clubs: createStore("clubs"),
    standings: createStore("standings"),
    teams: createStore("teams"),
    players: createStore("players")
  };

  await ensureIndexes(stores);
  return stores;
}

function clean(doc) {
  if (!doc) return doc;
  const { _id, createdAt, updatedAt, ...rest } = doc;
  return rest;
}

function toBoolean(value, fallback = true) {
  if (typeof value === "boolean") return value;
  if (value === 1 || value === "1") return true;
  if (value === 0 || value === "0") return false;
  return fallback;
}

export async function upsertScrapeSources(sources = []) {
  const db = await getStores();
  const now = new Date().toISOString();

  for (const source of sources) {
    if (!source?.url) continue;
    const existing = await db.sources.findOne({ url: source.url });

    await db.sources.update(
      { url: source.url },
      {
        $set: {
          name: source.name || source.url,
          sourceType: source.sourceType || "rss",
          leagueKey: source.leagueKey || "global",
          leagueName: source.leagueName || "Global",
          nation: source.nation || "International",
          keepScraping: toBoolean(source.keepScraping, true),
          intervalMinutes: Number(source.intervalMinutes || 120),
          notes: source.notes || "",
          updatedAtIso: now,
          createdAtIso: existing?.createdAtIso || now,
          lastScrapedAt: existing?.lastScrapedAt || null
        }
      },
      { upsert: true }
    );
  }
}

export async function markSourceScraped(url) {
  const db = await getStores();
  await db.sources.update(
    { url },
    { $set: { lastScrapedAt: new Date().toISOString(), updatedAtIso: new Date().toISOString() } },
    { upsert: false }
  );
}

export async function listScrapeSources(filter = {}) {
  const db = await getStores();
  const query = {};

  if (filter.sourceType) query.sourceType = filter.sourceType;
  if (filter.keepScraping !== undefined) query.keepScraping = filter.keepScraping;
  if (filter.leagueKey) query.leagueKey = filter.leagueKey;

  const rows = await db.sources.find(query).sort({ sourceType: 1, leagueName: 1, name: 1 });
  return rows.map(clean);
}

export async function replaceArticles(articles = []) {
  const db = await getStores();
  await db.articles.remove({}, { multi: true });

  if (!articles.length) return;
  await db.articles.insert(articles);
}

export async function getArticles({ leagueKey, nation, limit = 120 } = {}) {
  const db = await getStores();
  const query = {};
  if (leagueKey) query.leagueKey = leagueKey;
  if (nation) query.nation = nation;

  const rows = await db.articles.find(query).sort({ publishedAtTs: -1 }).limit(limit);
  return rows.map(clean);
}

export async function getGroupedNews(limit = 8) {
  const rows = await getArticles({ limit: 400 });
  const byLeague = {};
  const byNation = {};

  for (const row of rows) {
    const leagueKey = row.leagueKey || "global";
    const nationKey = row.nation || "International";

    byLeague[leagueKey] = byLeague[leagueKey] || [];
    byNation[nationKey] = byNation[nationKey] || [];

    if (byLeague[leagueKey].length < limit) byLeague[leagueKey].push(row);
    if (byNation[nationKey].length < limit) byNation[nationKey].push(row);
  }

  return { byLeague, byNation };
}

export async function replaceMatches(matches = []) {
  const db = await getStores();
  await db.matches.remove({}, { multi: true });

  if (!matches.length) return;
  await db.matches.insert(matches);
}

export async function getMatches() {
  const db = await getStores();
  const rows = await db.matches.find({}).sort({ kickoffTs: 1 });
  return rows.map(clean);
}

export async function upsertClubs(clubs = []) {
  const db = await getStores();

  for (const club of clubs) {
    await db.clubs.update(
      { name: club.name },
      {
        $set: {
          ...club,
          scrapedAt: club.scrapedAt || new Date().toISOString()
        }
      },
      { upsert: true }
    );
  }
}

export async function getClubs() {
  const db = await getStores();
  const rows = await db.clubs.find({}).sort({ name: 1 });
  return rows.map(clean);
}

export async function replaceStandings(rows = []) {
  const db = await getStores();
  await db.standings.remove({}, { multi: true });
  if (!rows.length) return;
  await db.standings.insert(rows);
}

export async function getStandingsByLeague() {
  const db = await getStores();
  const rows = await db.standings.find({}).sort({ leagueName: 1, rank: 1 });

  const grouped = {};
  for (const row of rows.map(clean)) {
    grouped[row.leagueKey] = grouped[row.leagueKey] || {
      leagueKey: row.leagueKey,
      leagueName: row.leagueName,
      nation: row.nation,
      table: []
    };
    grouped[row.leagueKey].table.push(row);
  }

  return Object.values(grouped);
}

export async function replaceTeamsAndPlayers(teams = [], players = []) {
  const db = await getStores();
  await db.teams.remove({}, { multi: true });
  await db.players.remove({}, { multi: true });

  if (teams.length) await db.teams.insert(teams);
  if (players.length) await db.players.insert(players);
}

export async function getTeamsByLeague() {
  const db = await getStores();
  const [teamsRows, playersRows] = await Promise.all([
    db.teams.find({}).sort({ leagueName: 1, name: 1 }),
    db.players.find({}).sort({ teamName: 1, name: 1 })
  ]);

  const playersByTeam = new Map();
  for (const player of playersRows.map(clean)) {
    const key = player.teamKey;
    if (!playersByTeam.has(key)) playersByTeam.set(key, []);
    playersByTeam.get(key).push(player);
  }

  const grouped = {};
  for (const team of teamsRows.map(clean)) {
    grouped[team.leagueKey] = grouped[team.leagueKey] || {
      leagueKey: team.leagueKey,
      leagueName: team.leagueName,
      nation: team.nation,
      teams: []
    };

    grouped[team.leagueKey].teams.push({
      ...team,
      players: playersByTeam.get(team.teamKey) || []
    });
  }

  return Object.values(grouped);
}

export async function getOverview() {
  const db = await getStores();
  const [articleCount, matchCount, clubCount, sourceCount, standingsCount, teamCount, playerCount] = await Promise.all([
    db.articles.count({}),
    db.matches.count({}),
    db.clubs.count({}),
    db.sources.count({ keepScraping: true }),
    db.standings.count({}),
    db.teams.count({}),
    db.players.count({})
  ]);

  return {
    articleCount,
    matchCount,
    clubCount,
    sourceCount,
    standingsCount,
    teamCount,
    playerCount,
    updatedAt: new Date().toISOString()
  };
}
