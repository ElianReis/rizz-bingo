import { escapeHtml, formatTime, formatAgo } from "./format.js";
import { rankPlayers } from "./leaderboard-service.js";

const MEDALS = ["🥇", "🥈", "🥉"];

export class LeaderboardView {
  constructor({ i18n, service }){
    this.i18n = i18n;
    this.service = service;

    this.overlay = document.getElementById("lb-overlay");
    this.title = document.getElementById("lb-title");
    this.rankTitle = document.getElementById("lb-rank-title");
    this.recentTitle = document.getElementById("lb-recent-title");
    this.rankEl = document.getElementById("lb-rank");
    this.recentEl = document.getElementById("lb-recent");
    this.refreshBtn = document.getElementById("lb-refresh");
    this.closeBtn = document.getElementById("lb-close");

    this.refreshBtn.addEventListener("click", () => this.load());
    this.closeBtn.addEventListener("click", () => this.close());
    this.overlay.addEventListener("click", e => { if (e.target === this.overlay) this.close(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") this.close(); });
  }

  get isOpen(){
    return !this.overlay.hidden;
  }

  apply(){
    const t = this.i18n.t;
    this.title.textContent = "🏆 " + t.leaderboard;
    this.rankTitle.textContent = t.ranking;
    this.recentTitle.textContent = t.recent;
    this.refreshBtn.textContent = t.refresh;
    if (this.isOpen) this.load();
  }

  open(){
    this.overlay.hidden = false;
    this.load();
  }

  close(){
    this.overlay.hidden = true;
  }

  async load(){
    const t = this.i18n.t;
    if (!this.service.ready) {
      this.rankEl.innerHTML = `<div class="lb-empty">${t.notConfigured}</div>`;
      this.recentEl.innerHTML = "";
      return;
    }
    this.rankEl.innerHTML = `<div class="lb-empty">${t.loading}</div>`;
    this.recentEl.innerHTML = "";
    try {
      const rows = await this.service.fetchScores();
      if (!rows.length) {
        this.rankEl.innerHTML = `<div class="lb-empty">${t.noScores}</div>`;
        return;
      }
      this.rankEl.innerHTML = rankPlayers(rows).map((player, i) => `
        <div class="lb-row">
          <span class="lb-pos">${MEDALS[i] || (i + 1)}</span>
          <span class="lb-name-cell">${escapeHtml(player.name)}</span>
          <span class="lb-stat">${player.wins} ${t.winsShort}</span>
          <span class="lb-stat">🔥${player.best}</span>
          <span class="lb-stat">⏱${formatTime(player.fastest)}</span>
        </div>`).join("");
      const seen = new Set();
      const recent = rows.filter(row => {
        const key = (row.name || "").trim().toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).slice(0, 12);
      this.recentEl.innerHTML = recent.map(row => `
        <div class="lb-recent-row">
          <span>${escapeHtml(row.name)}</span>
          <span>${row.won ? "🎉 " + row.lines : (row.lines || 0) + " " + t.linesShort}</span>
          <span class="lb-ago">${formatAgo(row.created_at)}</span>
        </div>`).join("");
    } catch (e) {
      this.rankEl.innerHTML = `<div class="lb-empty err">${t.loadErr}</div>`;
    }
  }
}
