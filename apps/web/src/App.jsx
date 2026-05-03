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

function TopStory({ story }) {
  if (!story) return null;
  return (
    <a className="top-story" href={story.link} target="_blank" rel="noreferrer">
      <div className="top-story-meta">
        <span>Top Story</span>
        <h3>{story.title}</h3>
        <p>{story.summary}</p>
      </div>
      <div className="top-story-footer">
        <strong>{story.source}</strong>
        <small>{new Date(story.publishedAt).toLocaleString()}</small>
      </div>
    </a>
  );
}

function NewsGrid({ items }) {
  return (
    <div className="news-grid">
      {items.map((item) => (
        <a className="news-card" key={item.id} href={item.link} target="_blank" rel="noreferrer">
          <div className="badge">{item.source}</div>
          <h4>{item.title}</h4>
          <p>{item.summary}</p>
          <small>{new Date(item.publishedAt).toLocaleString()}</small>
        </a>
      ))}
    </div>
  );
}

function MatchStrip({ matches }) {
  return (
    <div className="match-strip">
      {matches.map((match) => (
        <div className="match-card" key={match.id}>
          <div className="match-league">{match.league}</div>
          <div className="clubs-row">
            <span>{match.home}</span>
            <strong>{match.score || "vs"}</strong>
            <span>{match.away}</span>
          </div>
          <div className="match-footer">
            <small>{new Date(match.kickoff).toLocaleString()}</small>
            <b>{match.status}</b>
          </div>
        </div>
      ))}
    </div>
  );
}

function ClubCards({ clubs }) {
  return (
    <div className="club-grid">
      {clubs.map((club) => (
        <article className="club-card" key={club.name}>
          <header>
            <h3>{club.name}</h3>
            <p>{club.country}</p>
          </header>
          <div>
            <h5>Current Players</h5>
            <p>{club.players.slice(0, 10).join(", ") || "Pending scrape"}</p>
          </div>
          <div>
            <h5>Club Legends</h5>
            <p>{club.legends.join(", ")}</p>
          </div>
          <a href={club.url} target="_blank" rel="noreferrer">
            Source page
          </a>
        </article>
      ))}
    </div>
  );
}

export default function App() {
  const [news, setNews] = useState([]);
  const [matches, setMatches] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [overview, setOverview] = useState({});

  useEffect(() => {
    async function load() {
      const [newsRes, matchRes, clubRes, overviewRes] = await Promise.all([
        fetch(`${API_BASE}/api/news`),
        fetch(`${API_BASE}/api/matches`),
        fetch(`${API_BASE}/api/clubs`),
        fetch(`${API_BASE}/api/overview`)
      ]);

      setNews(await newsRes.json());
      setMatches(await matchRes.json());
      setClubs(await clubRes.json());
      setOverview(await overviewRes.json());
    }

    load().catch((err) => console.error("Failed to load dashboard", err));
  }, []);

  const topStory = news[0];
  const restNews = useMemo(() => news.slice(1, 9), [news]);

  return (
    <main>
      <section className="hero">
        <div className="glow glow-one" />
        <div className="glow glow-two" />
        <p className="eyebrow">PitchPulse</p>
        <h1>AI-Synthesized Football Intelligence</h1>
        <p>
          One visual newsroom for fixtures, breaking news, squads, legends, and
          trend narratives.
        </p>
        <div className="stats-row">
          <div>
            <strong>{overview.articleCount || 0}</strong>
            <span>Fresh Articles</span>
          </div>
          <div>
            <strong>{overview.matchCount || 0}</strong>
            <span>Tracked Matches</span>
          </div>
          <div>
            <strong>{overview.clubCount || 0}</strong>
            <span>Club Profiles</span>
          </div>
        </div>
      </section>

      <section>
        <SectionHeader
          kicker="Live Scoreboard"
          title="Matches"
          subtitle="Pulled from public scoreboard endpoints"
        />
        <MatchStrip matches={matches.slice(0, 8)} />
      </section>

      <section>
        <SectionHeader
          kicker="Headlines"
          title="Synthesized News"
          subtitle="Merged RSS streams from football media"
        />
        <TopStory story={topStory} />
        <NewsGrid items={restNews} />
      </section>

      <section>
        <SectionHeader
          kicker="Club Intel"
          title="Players + Legends"
          subtitle="Automated crawl over selected club pages"
        />
        <ClubCards clubs={clubs} />
      </section>
    </main>
  );
}
