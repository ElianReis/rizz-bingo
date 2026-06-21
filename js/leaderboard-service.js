import { SUPABASE_URL, SUPABASE_KEY, LB_TABLE } from "./config.js";

const BASE = SUPABASE_URL.replace(/\/$/, "");

export class LeaderboardService {
  get ready(){
    return Boolean(SUPABASE_URL.trim() && SUPABASE_KEY.trim());
  }

  headers(extra){
    return Object.assign({
      apikey: SUPABASE_KEY,
      Authorization: "Bearer " + SUPABASE_KEY,
      "Content-Type": "application/json"
    }, extra || {});
  }

  async fetchScores(){
    const url = `${BASE}/rest/v1/${LB_TABLE}?select=name,lines,dabbed,won,seconds,created_at&order=created_at.desc&limit=300`;
    const response = await fetch(url, { headers: this.headers() });
    if (!response.ok) throw new Error("fetch " + response.status);
    return response.json();
  }

  async submit(score){
    const response = await fetch(`${BASE}/rest/v1/${LB_TABLE}`, {
      method: "POST",
      headers: this.headers({ Prefer: "return=minimal" }),
      body: JSON.stringify(score)
    });
    if (!response.ok) throw new Error("insert " + response.status);
  }
}

export function rankPlayers(rows){
  const map = new Map();
  rows.forEach(row => {
    const name = (row.name || "?").trim();
    const key = name.toLowerCase();
    if (!map.has(key)) map.set(key, { name, wins: 0, games: 0, best: 0, fastest: null });
    const entry = map.get(key);
    entry.games++;
    if (row.won) entry.wins++;
    if ((row.lines || 0) > entry.best) entry.best = row.lines || 0;
    if (row.won && row.seconds != null && (entry.fastest === null || row.seconds < entry.fastest)) entry.fastest = row.seconds;
  });
  return [...map.values()].sort((a, b) =>
    b.wins - a.wins ||
    b.best - a.best ||
    ((a.fastest ?? 1e9) - (b.fastest ?? 1e9)) ||
    a.name.localeCompare(b.name)
  );
}
