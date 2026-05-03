import { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:58080";

function SectionHeader({ kicker, title, subtitle }) {
  return (
    <div className="section-header">
      <p>{kicker}</p>
      <h2>{title}</h2>
      <span>{subtitle}</span>
    </div>
  );
}

function LeagueNewsBlocks({ groupedNews }) {
  const entries = Object.entries(groupedNews?.byLeague || {});

  return (
    <div className="league-news-grid">
      {entries.map(([leagueKey, stories]) => (
        <article className="league-news-card" key={leagueKey}>
          <header>
            <h3>{stories[0]?.leagueName || leagueKey}</h3>
            <p>{stories[0]?.nation || "International"}</p>
          </header>
          <ul>
            {stories.slice(0, 5).map((story) => (
              <li key={story.id}>
                <a href={story.link} target="_blank" rel="noreferrer">
                  {story.title}
                </a>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}

function NationNewsBlocks({ groupedNews }) {
  const entries = Object.entries(groupedNews?.byNation || {});

  return (
    <div className="nation-news-grid">
      {entries.map(([nation, stories]) => (
        <article className="nation-news-card" key={nation}>
          <h4>{nation}</h4>
          <ul>
            {stories.slice(0, 4).map((story) => (
              <li key={story.id}>
                <a href={story.link} target="_blank" rel="noreferrer">
                  {story.title}
                </a>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}

function LeagueTables({ standings }) {
  return (
    <div className="tables-grid">
      {standings.map((league) => (
        <article key={league.leagueKey} className="table-card">
          <header>
            <h3>{league.leagueName}</h3>
            <p>{league.nation}</p>
          </header>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Team</th>
                  <th>P</th>
                  <th>W</th>
                  <th>D</th>
                  <th>L</th>
                  <th>GD</th>
                  <th>Pts</th>
                </tr>
              </thead>
              <tbody>
                {league.table.slice(0, 20).map((row) => (
                  <tr key={row.rowKey}>
                    <td>{row.rank}</td>
                    <td>{row.teamName}</td>
                    <td>{row.gamesPlayed}</td>
                    <td>{row.wins}</td>
                    <td>{row.draws}</td>
                    <td>{row.losses}</td>
                    <td>{row.goalDifference}</td>
                    <td>{row.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      ))}
    </div>
  );
}

function TeamRosters({ leagues }) {
  return (
    <div className="roster-grid">
      {leagues.map((league) => (
        <article key={league.leagueKey} className="roster-card">
          <header>
            <h3>{league.leagueName}</h3>
            <p>{league.teams.length} teams tracked</p>
          </header>
          <div className="team-list">
            {league.teams.slice(0, 12).map((team) => (
              <div className="team-row" key={team.teamKey}>
                <h5>{team.name}</h5>
                <p>
                  {(team.players || [])
                    .slice(0, 8)
                    .map((player) => player.name)
                    .join(", ") || "Roster pending"}
                </p>
              </div>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

function SourceRegistry({ sources }) {
  return (
    <div className="source-grid">
      {sources.map((source) => (
        <article className="source-card" key={source.url}>
          <div className="source-top">
            <span className="pill">{source.sourceType}</span>
            <span className={`pill ${source.keepScraping ? "active" : "inactive"}`}>
              {source.keepScraping ? "keep scraping" : "paused"}
            </span>
          </div>
          <h4>{source.name}</h4>
          <p>
            {source.leagueName} · {source.nation}
          </p>
          <a href={source.url} target="_blank" rel="noreferrer">
            {source.url}
          </a>
        </article>
      ))}
    </div>
  );
}

export default function App() {
  const [overview, setOverview] = useState({});
  const [groupedNews, setGroupedNews] = useState({ byLeague: {}, byNation: {} });
  const [standings, setStandings] = useState([]);
  const [teamsByLeague, setTeamsByLeague] = useState([]);
  const [sourcesPayload, setSourcesPayload] = useState({ sources: [] });

  useEffect(() => {
    async function load() {
      const [overviewRes, groupedRes, standingsRes, teamsRes, sourcesRes] = await Promise.all([
        fetch(`${API_BASE}/api/overview`),
        fetch(`${API_BASE}/api/news/grouped`),
        fetch(`${API_BASE}/api/standings`),
        fetch(`${API_BASE}/api/teams`),
        fetch(`${API_BASE}/api/sources`)
      ]);

      setOverview(await overviewRes.json());
      setGroupedNews(await groupedRes.json());
      setStandings(await standingsRes.json());
      setTeamsByLeague(await teamsRes.json());
      setSourcesPayload(await sourcesRes.json());
    }

    load().catch((err) => console.error("Failed to load dashboard", err));
  }, []);

  const leagueCount = useMemo(() => standings.length, [standings]);

  return (
    <main>
      <section className="hero">
        <div className="glow glow-one" />
        <div className="glow glow-two" />
        <p className="eyebrow">PitchPulse</p>
        <h1>League + National Football Intelligence Hub</h1>
        <p>
          Structured football operations view: league tables, team rosters, player lists,
          and grouped news intelligence from tracked sources.
        </p>
        <div className="stats-row">
          <div>
            <strong>{overview.articleCount || 0}</strong>
            <span>Articles</span>
          </div>
          <div>
            <strong>{leagueCount}</strong>
            <span>League Tables</span>
          </div>
          <div>
            <strong>{overview.teamCount || 0}</strong>
            <span>Teams</span>
          </div>
          <div>
            <strong>{overview.playerCount || 0}</strong>
            <span>Players</span>
          </div>
          <div>
            <strong>{overview.sourceCount || 0}</strong>
            <span>Active Scrape Sites</span>
          </div>
        </div>
      </section>

      <section>
        <SectionHeader
          kicker="News Intelligence"
          title="Organized By League"
          subtitle="Automatically tagged into major competitions"
        />
        <LeagueNewsBlocks groupedNews={groupedNews} />
      </section>

      <section>
        <SectionHeader
          kicker="National Coverage"
          title="Organized By Nation"
          subtitle="Country-level feed clustering"
        />
        <NationNewsBlocks groupedNews={groupedNews} />
      </section>

      <section>
        <SectionHeader
          kicker="League Analytics"
          title="Standings Tables"
          subtitle="Live tables for tracked leagues"
        />
        <LeagueTables standings={standings} />
      </section>

      <section>
        <SectionHeader
          kicker="Squad Intelligence"
          title="Teams + Players"
          subtitle="Rosters scraped by competition"
        />
        <TeamRosters leagues={teamsByLeague} />
      </section>

      <section>
        <SectionHeader
          kicker="Scrape Registry"
          title="Websites Marked To Keep Scraping"
          subtitle={`Active ${sourcesPayload.activeCount || 0} / Total ${sourcesPayload.totalCount || 0}`}
        />
        <SourceRegistry sources={(sourcesPayload.sources || []).filter((s) => s.keepScraping)} />
      </section>
    </main>
  );
}
