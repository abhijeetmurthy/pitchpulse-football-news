const LEAGUE_PATTERNS = [
  { leagueKey: "eng.1", leagueName: "Premier League", nation: "England", pattern: /premier league|epl|fa cup|arsenal|chelsea|liverpool|manchester united|manchester city|tottenham|newcastle/i },
  { leagueKey: "esp.1", leagueName: "La Liga", nation: "Spain", pattern: /la liga|real madrid|barcelona|atletico madrid|sevilla/i },
  { leagueKey: "ger.1", leagueName: "Bundesliga", nation: "Germany", pattern: /bundesliga|bayern|dortmund|leverkusen|rb leipzig/i },
  { leagueKey: "ita.1", leagueName: "Serie A", nation: "Italy", pattern: /serie a|juventus|inter milan|ac milan|napoli|roma/i },
  { leagueKey: "fra.1", leagueName: "Ligue 1", nation: "France", pattern: /ligue 1|paris saint-germain|psg|marseille|lyon/i },
  { leagueKey: "usa.1", leagueName: "MLS", nation: "United States", pattern: /major league soccer|\bmls\b|inter miami|la galaxy|nycfc/i },
  { leagueKey: "uefa.champions", leagueName: "Champions League", nation: "Europe", pattern: /champions league|ucl|uefa champions/i },
  { leagueKey: "fifa.world", leagueName: "International", nation: "International", pattern: /world cup|fifa|uefa nations league|euro 20/i }
];

export function classifyArticle(text, fallback = {}) {
  const content = String(text || "");

  for (const rule of LEAGUE_PATTERNS) {
    if (rule.pattern.test(content)) {
      return {
        leagueKey: rule.leagueKey,
        leagueName: rule.leagueName,
        nation: rule.nation,
        category: rule.nation === "International" || rule.nation === "Europe" ? "national" : "league"
      };
    }
  }

  return {
    leagueKey: fallback.leagueKey || "global",
    leagueName: fallback.leagueName || "Global",
    nation: fallback.nation || "International",
    category: fallback.leagueKey && fallback.leagueKey !== "global" ? "league" : "national"
  };
}
