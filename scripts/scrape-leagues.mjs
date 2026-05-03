import { httpClient } from "./http-client.mjs";
import {
  listScrapeSources,
  markSourceScraped,
  replaceStandings,
  replaceTeamsAndPlayers
} from "./db.mjs";
import { syncSourceRegistry } from "./source-registry.mjs";

function statValue(stats = [], names = [], fallback = 0) {
  for (const stat of stats) {
    if (names.includes(stat.name) || names.includes(stat.type)) {
      return Number(stat.value ?? stat.displayValue ?? fallback);
    }
  }
  return fallback;
}

function toStandingsRow(source, entry, idx) {
  const stats = entry.stats || [];
  const team = entry.team || {};
  const teamId = team.id || `${source.leagueKey}-${idx}`;

  return {
    rowKey: `${source.leagueKey}-${teamId}`,
    leagueKey: source.leagueKey,
    leagueName: source.leagueName,
    nation: source.nation,
    rank: statValue(stats, ["rank"], idx + 1),
    teamId,
    teamName: team.displayName || "Unknown",
    gamesPlayed: statValue(stats, ["gamesPlayed", "gamesplayed"]),
    wins: statValue(stats, ["wins"]),
    draws: statValue(stats, ["ties", "draws"]),
    losses: statValue(stats, ["losses"]),
    goalsFor: statValue(stats, ["pointsFor", "goalsfor", "pointsfor"]),
    goalsAgainst: statValue(stats, ["pointsAgainst", "goalsagainst", "pointsagainst"]),
    goalDifference: statValue(stats, ["pointDifferential", "goaldifference", "pointdifferential"]),
    points: statValue(stats, ["points"]),
    form: entry.note?.description || "",
    scrapedAt: new Date().toISOString()
  };
}

function normalizeTeam(source, teamWrapper) {
  const team = teamWrapper.team || teamWrapper;
  return {
    teamKey: `${source.leagueKey}-${team.id}`,
    teamId: team.id,
    leagueKey: source.leagueKey,
    leagueName: source.leagueName,
    nation: source.nation,
    name: team.displayName || team.shortDisplayName || "Unknown",
    abbreviation: team.abbreviation || "",
    venue: team.venue?.fullName || "",
    logo: team.logos?.[0]?.href || "",
    sourceUrl: source.url,
    scrapedAt: new Date().toISOString()
  };
}

function normalizePlayers(source, team, rosterData) {
  const athletes = rosterData.athletes || [];
  return athletes.map((athlete) => ({
    playerKey: `${source.leagueKey}-${team.id}-${athlete.id || athlete.displayName}`,
    teamKey: `${source.leagueKey}-${team.id}`,
    leagueKey: source.leagueKey,
    leagueName: source.leagueName,
    nation: source.nation,
    teamId: team.id,
    teamName: team.displayName || team.shortDisplayName || "Unknown",
    playerId: athlete.id || null,
    name: athlete.displayName || athlete.shortName || "Unknown",
    position: athlete.position?.displayName || "",
    age: athlete.age || null,
    nationality: athlete.flag?.displayName || "",
    scrapedAt: new Date().toISOString()
  }));
}

async function scrapeStandings() {
  const sources = await listScrapeSources({ sourceType: "standings", keepScraping: true });
  const rows = [];

  for (const source of sources) {
    try {
      const { data } = await httpClient.get(source.url, { timeout: 15000 });
      const entries = data.children?.[0]?.standings?.entries || [];
      const parsed = entries.map((entry, idx) => toStandingsRow(source, entry, idx));
      rows.push(...parsed);
      await markSourceScraped(source.url);
      console.log(`Fetched standings rows ${parsed.length} from ${source.leagueName}`);
    } catch (error) {
      console.error(`Failed standings scrape ${source.leagueName}:`, error.message);
    }
  }

  await replaceStandings(rows);
  return rows;
}

async function scrapeTeamsAndPlayers() {
  const sources = await listScrapeSources({ sourceType: "teams", keepScraping: true });
  const allTeams = [];
  const allPlayers = [];

  for (const source of sources) {
    try {
      const { data } = await httpClient.get(source.url, { timeout: 15000 });
      const teams = data.sports?.[0]?.leagues?.[0]?.teams?.map(normalizeTeam.bind(null, source)) || [];

      for (const teamDoc of teams) {
        const rosterUrl = `https://site.api.espn.com/apis/site/v2/sports/soccer/${source.leagueKey}/teams/${teamDoc.teamId}/roster`;
        try {
          const { data: rosterData } = await httpClient.get(rosterUrl, { timeout: 15000 });
          allPlayers.push(...normalizePlayers(source, { id: teamDoc.teamId, displayName: teamDoc.name }, rosterData));
        } catch (error) {
          console.error(`Failed roster scrape ${teamDoc.name}:`, error.message);
        }
      }

      allTeams.push(...teams);
      await markSourceScraped(source.url);
      console.log(`Fetched ${teams.length} teams from ${source.leagueName}`);
    } catch (error) {
      console.error(`Failed team scrape ${source.leagueName}:`, error.message);
    }
  }

  await replaceTeamsAndPlayers(allTeams, allPlayers);
  return { teams: allTeams, players: allPlayers };
}

export async function scrapeLeaguesAndRosters() {
  await syncSourceRegistry();
  const [standings, rosterData] = await Promise.all([scrapeStandings(), scrapeTeamsAndPlayers()]);
  return {
    standings,
    teams: rosterData.teams,
    players: rosterData.players
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  scrapeLeaguesAndRosters().then(({ standings, teams, players }) => {
    console.log(`Saved standings=${standings.length}, teams=${teams.length}, players=${players.length}`);
  });
}
