import { Storage } from "./storage.js";
import { KEYS } from "./config.js";
import { escapeHtml, formatTime, formatAgo } from "./format.js";
import { rankPlayers } from "./leaderboard-service.js";

const MEDALS = ["🥇", "🥈", "🥉"];

export class LeaderboardView {
  constructor({ i18n, service, getSnapshot }){
    this.i18n = i18n;
    this.service = service;
    this.getSnapshot = getSnapshot;
    this.playerName = Storage.get(KEYS.name) || "";

    this.overlay = document.getElementById("lb-overlay");
    this.title = document.getElementById("lb-title");
    this.nameInput = document.getElementById("lb-name");
    this.saveBtn = document.getElementById("lb-save");
    this.message = document.getElementById("lb-msg");
    this.rankTitle = document.getElementById("lb-rank-title");
    this.recentTitle = document.getElementById("lb-recent-title");
    this.rankEl = document.getElementById("lb-rank");
    this.recentEl = document.getElementById("lb-recent");
    this.refreshBtn = document.getElementById("lb-refresh");
    this.closeBtn = document.getElementById("lb-close");

    this.saveBtn.addEventListener("click", () => this.submit());
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
    this.nameInput.placeholder = t.yourName;
    this.saveBtn.textContent = t.save;
    this.rankTitle.textContent = t.ranking;
    this.recentTitle.textContent = t.recent;
    this.refreshBtn.textContent = t.refresh;
    if (this.isOpen) this.load();
  }

  open(){
    this.nameInput.value = this.playerName;
    this.overlay.hidden = false;
    this.load();
  }

  close(){
    this.overlay.hidden = true;
  }

  notify(text, isError){
    this.message.textContent = text;
    this.message.className = "lb-msg" + (isError ? " err" : " ok");
    if (text) setTimeout(() => { if (this.message.textContent === text) this.message.textContent = ""; }, 3000);
  }

  async submit(){
    const t = this.i18n.t;
    const name = (this.nameInput.value || "").trim();
    if (!name) return this.notify(t.needName, true);
    if (!this.service.ready) return this.notify(t.notConfigured, true);
    this.playerName = name;
    Storage.set(KEYS.name, name);
    try {
      await this.service.submit({ name, ...this.getSnapshot() });
      this.notify(t.saved, false);
      this.load();
    } catch (e) {
      this.notify(t.saveErr, true);
    }
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
      this.recentEl.innerHTML = rows.slice(0, 12).map(row => `
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
