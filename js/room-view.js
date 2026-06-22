import { escapeHtml } from "./format.js";

export class RoomView {
  constructor({ i18n, onVote, onLeave }){
    this.i18n = i18n;
    this.players = [];
    this.solo = false;
    this.bar = document.getElementById("room-bar");
    this.playersWrap = document.getElementById("room-players-wrap");
    this.codeBtn = document.getElementById("room-code");
    this.codeValue = document.getElementById("rc-value");
    this.codeLabel = document.getElementById("rc-label");
    this.playersEl = document.getElementById("room-players");
    this.listEl = document.getElementById("room-playerlist");
    this.announceEl = document.getElementById("room-announce");
    this.voteBtn = document.getElementById("vote-btn");
    this.leaveBtn = document.getElementById("leave-btn");

    this.voteBtn.addEventListener("click", () => onVote());
    this.leaveBtn.addEventListener("click", () => onLeave());
    this.codeBtn.addEventListener("click", () => this.copyCode());
    this.playersEl.addEventListener("click", e => { e.stopPropagation(); this.toggleList(); });
    document.addEventListener("click", e => {
      if (!this.listEl.hidden && !this.listEl.contains(e.target)) this.closeList();
    });
  }

  apply(){
    const t = this.i18n.t;
    this.codeLabel.textContent = t.code;
    this.leaveBtn.textContent = t.leave;
    this.setPlayers(this.players);
  }

  showCode(code){
    this.code = code;
    this.codeValue.textContent = code;
  }

  setSolo(solo){
    this.solo = solo;
    this.codeBtn.hidden = solo;
    this.playersWrap.hidden = solo;
  }

  setPlayers(players){
    this.players = Array.isArray(players) ? players : [];
    const count = this.players.length;
    if (count >= 2) {
      this.playersEl.hidden = false;
      this.playersEl.textContent = `${count} ${this.i18n.t.players}`;
    } else {
      this.playersEl.hidden = true;
      this.closeList();
    }
    if (!this.listEl.hidden) this.renderList();   // only rebuild the list DOM while it's open
  }

  renderList(){
    this.listEl.innerHTML = this.players.map(p => {
      const tag = p.isWinner ? "🏆" : p.voteRestart ? "✓" : "";
      return `<div class="rp-row"><span class="rp-name">${escapeHtml(p.nickname)}</span><span class="rp-tag">${tag}</span></div>`;
    }).join("") || `<div class="rp-row"><span class="rp-name">${this.i18n.t.waiting}</span></div>`;
  }

  toggleList(){
    if (this.listEl.hidden) { this.renderList(); this.listEl.hidden = false; }
    else this.listEl.hidden = true;
    this.playersEl.setAttribute("aria-expanded", String(!this.listEl.hidden));
  }

  closeList(){
    this.listEl.hidden = true;
    this.playersEl.setAttribute("aria-expanded", "false");
  }

  setVote(active, voted, total){
    if (this.solo) {
      this.voteBtn.textContent = this.i18n.t.newBoard;
      this.voteBtn.classList.remove("active");
      return;
    }
    this.voteBtn.textContent = total > 1 ? `${this.i18n.t.voteRestart} (${voted}/${total})` : this.i18n.t.voteRestart;
    this.voteBtn.classList.toggle("active", active);
  }

  announce(text){
    this.announceEl.textContent = text || "";
    this.announceEl.classList.toggle("show", Boolean(text));
  }

  async copyCode(){
    try {
      await navigator.clipboard.writeText(this.code);
      const original = this.codeLabel.textContent;
      this.codeLabel.textContent = this.i18n.t.copied;
      setTimeout(() => { this.codeLabel.textContent = original; }, 1500);
    } catch (e) {}
  }
}
