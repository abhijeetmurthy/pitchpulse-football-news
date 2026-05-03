import { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:58080";

const NAV_TREE = [
  {
    label: "Overview",
    href: "#overview"
  },
  {
    label: "News",
    children: [
      { label: "By League", href: "#news-league" },
      { label: "By Nation", href: "#news-nation" }
    ]
  },
  {
    label: "Competitions",
    children: [
      { label: "League Tables", href: "#standings" },
      { label: "Teams + Players", href: "#teams" }
    ]
  },
  {
    label: "Scraping",
    children: [{ label: "Tracked Websites", href: "#sources" }]
  }
];

function Sidebar({ leagues, nations, activeLeague, activeNation, onLeague, onNation, clearFilters }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <p>PitchPulse</p>
        <h2>Football OS</h2>
      </div>

      <nav>
        {NAV_TREE.map((item) =>
          item.children ? (
            <details key={item.label} open>
              <summary>{item.label}</summary>
              <ul>
                {item.children.map((child) => (
                  <li key={child.href}>
                    <a href={child.href}>{child.label}</a>
                  </li>
                ))}
              </ul>
            </details>
          ) : (
            <a className="top-nav-link" key={item.href} href={item.href}>
              {item.label}
            </a>
          )
        )}

        <details open>
          <summary>League Filter</summary>
          <ul>
            <li>
              <button className={activeLeague === "all" ? "side-btn active" : "side-btn"} onClick={() => onLeague("all")}>
                All Leagues
              </button>
            </li>
            {leagues.map((league) => (
              <li key={league.leagueKey}>
                <button
                  className={activeLeague === league.leagueKey ? "side-btn active" : "side-btn"}
                  onClick={() => onLeague(league.leagueKey)}
                >
                  {league.leagueName}
                </button>
              </li>
            ))}
          </ul>
        </details>

        <details open>
          <summary>Nation Filter</summary>
          <ul>
            <li>
              <button className={activeNation === "all" ? "side-btn active" : "side-btn"} onClick={() => onNation("all")}>
                All Nations
              </button>
            </li>
            {nations.map((nation) => (
              <li key={nation}>
                <button className={activeNation === nation ? "side-btn active" : "side-btn"} onClick={() => onNation(nation)}>
                  {nation}
                </button>
              </li>
            ))}
          </ul>
        </details>

        <button className="clear-btn" onClick={clearFilters}>
          Clear Filters
        </button>
      </nav>
    </aside>
  );
}

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
            {stories.slice(0, 6).map((story) => (
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
            {league.teams.map((team) => (
              <details className="team-row" key={team.teamKey}>
                <summary>{team.name}</summary>
                <p>
                  {(team.players || [])
                    .slice(0, 30)
                    .map((player) => player.name)
                    .join(", ") || "Roster pending"}
                </p>
              </details>
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

async function fetchJson(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`Request failed: ${path}`);
  return res.json();
}

function applyFilters(groupedNews, standings, teamsByLeague, sources, activeLeague, activeNation) {
  const byLeagueEntries = Object.entries(groupedNews.byLeague || {}).filter(([leagueKey, stories]) => {
    if (activeLeague !== "all" && leagueKey !== activeLeague) return false;
    if (activeNation !== "all" && (stories[0]?.nation || "International") !== activeNation) return false;
    return true;
  });

  const byNationEntries = Object.entries(groupedNews.byNation || {}).filter(([nation]) =>
    activeNation === "all" ? true : nation === activeNation
  );

  const filteredStandings = standings.filter((league) => {
    if (activeLeague !== "all" && league.leagueKey !== activeLeague) return false;
    if (activeNation !== "all" && league.nation !== activeNation) return false;
    return true;
  });

  const filteredTeams = teamsByLeague.filter((league) => {
    if (activeLeague !== "all" && league.leagueKey !== activeLeague) return false;
    if (activeNation !== "all" && league.nation !== activeNation) return false;
    return true;
  });

  const filteredSources = sources.filter((source) => {
    if (!source.keepScraping) return false;
    if (activeLeague !== "all" && source.leagueKey !== activeLeague) return false;
    if (activeNation !== "all" && source.nation !== activeNation) return false;
    return true;
  });

  return {
    groupedNews: {
      byLeague: Object.fromEntries(byLeagueEntries),
      byNation: Object.fromEntries(byNationEntries)
    },
    standings: filteredStandings,
    teams: filteredTeams,
    sources: filteredSources
  };
}

export default function App() {
  const [overview, setOverview] = useState({});
  const [groupedNews, setGroupedNews] = useState({ byLeague: {}, byNation: {} });
  const [standings, setStandings] = useState([]);
  const [teamsByLeague, setTeamsByLeague] = useState([]);
  const [sourcesPayload, setSourcesPayload] = useState({ sources: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeLeague, setActiveLeague] = useState("all");
  const [activeNation, setActiveNation] = useState("all");

  async function loadData(allowBootstrap = true) {
    const [overviewData, groupedData, standingsData, teamsData, sourcesData] = await Promise.all([
      fetchJson("/api/overview"),
      fetchJson("/api/news/grouped"),
      fetchJson("/api/standings"),
      fetchJson("/api/teams"),
      fetchJson("/api/sources")
    ]);

    const isEmpty = !overviewData.articleCount || !overviewData.standingsCount || !overviewData.teamCount;

    if (isEmpty && allowBootstrap) {
      await fetch(`${API_BASE}/api/scrape`, { method: "POST" });
      return loadData(false);
    }

    setOverview(overviewData);
    setGroupedNews(groupedData);
    setStandings(standingsData);
    setTeamsByLeague(teamsData);
    setSourcesPayload(sourcesData);
  }

  async function refreshData() {
    setLoading(true);
    setError("");
    try {
      await loadData(true);
    } catch (err) {
      console.error(err);
      setError("Could not refresh data from API.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshData();
  }, []);

  const leagueFilterOptions = useMemo(
    () => standings.map((league) => ({ leagueKey: league.leagueKey, leagueName: league.leagueName })),
    [standings]
  );

  const nationFilterOptions = useMemo(() => {
    const nations = new Set([
      ...standings.map((league) => league.nation),
      ...Object.keys(groupedNews.byNation || {})
    ]);
    return Array.from(nations).filter(Boolean).sort();
  }, [standings, groupedNews]);

  const filtered = useMemo(
    () =>
      applyFilters(
        groupedNews,
        standings,
        teamsByLeague,
        sourcesPayload.sources || [],
        activeLeague,
        activeNation
      ),
    [groupedNews, standings, teamsByLeague, sourcesPayload, activeLeague, activeNation]
  );

  return (
    <div className="app-shell">
      <Sidebar
        leagues={leagueFilterOptions}
        nations={nationFilterOptions}
        activeLeague={activeLeague}
        activeNation={activeNation}
        onLeague={setActiveLeague}
        onNation={setActiveNation}
        clearFilters={() => {
          setActiveLeague("all");
          setActiveNation("all");
        }}
      />

      <main className="content">
        <section id="overview" className="hero">
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
              <strong>{filtered.standings.length}</strong>
              <span>Visible Leagues</span>
            </div>
            <div>
              <strong>{overview.teamCount || 0}</strong>
              <span>Total Teams</span>
            </div>
            <div>
              <strong>{overview.playerCount || 0}</strong>
              <span>Total Players</span>
            </div>
            <div>
              <strong>{filtered.sources.length}</strong>
              <span>Visible Sources</span>
            </div>
          </div>
          <button className="scrape-btn" onClick={refreshData}>
            Refresh Data
          </button>
          {loading && <p className="status-text">Loading data...</p>}
          {error && <p className="status-text error">{error}</p>}
        </section>

        <section id="news-league">
          <SectionHeader
            kicker="News Intelligence"
            title="Organized By League"
            subtitle="Automatically tagged into major competitions"
          />
          <LeagueNewsBlocks groupedNews={filtered.groupedNews} />
        </section>

        <section id="news-nation">
          <SectionHeader
            kicker="National Coverage"
            title="Organized By Nation"
            subtitle="Country-level feed clustering"
          />
          <NationNewsBlocks groupedNews={filtered.groupedNews} />
        </section>

        <section id="standings">
          <SectionHeader
            kicker="League Analytics"
            title="Standings Tables"
            subtitle="Live tables for tracked leagues"
          />
          <LeagueTables standings={filtered.standings} />
        </section>

        <section id="teams">
          <SectionHeader
            kicker="Squad Intelligence"
            title="Teams + Players"
            subtitle="Rosters scraped by competition"
          />
          <TeamRosters leagues={filtered.teams} />
        </section>

        <section id="sources">
          <SectionHeader
            kicker="Scrape Registry"
            title="Websites Marked To Keep Scraping"
            subtitle={`Active ${sourcesPayload.activeCount || 0} / Total ${sourcesPayload.totalCount || 0}`}
          />
          <SourceRegistry sources={filtered.sources} />
        </section>
      </main>
    </div>
  );
}
