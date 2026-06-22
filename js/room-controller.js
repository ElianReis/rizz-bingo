const DEBUG = typeof location !== "undefined" && new URLSearchParams(location.search).has("debug");
function dlog(...a){ if (DEBUG) console.log("[rb]", ...a); }

export class RoomController {
  constructor({ i18n, model, board, celebration, service, roomView, onExit, createSession, makeId }){
    this.i18n = i18n;
    this.model = model;
    this.board = board;
    this.celebration = celebration;
    this.service = service;
    this.roomView = roomView;
    this.onExit = onExit;
    this.createSession = createSession;
    this.makeId = makeId;

    this.session = null;
    this.solo = false;
    this.nickname = "";
    this.myId = null;
    this.voted = false;
    this.locked = false;
    this.round = 0;
  }

  async start(code, nickname, verify){
    this.solo = false;
    this.nickname = nickname;
    this.myId = this.makeId();
    this.voted = false;
    this.locked = false;
    this.round = 0;

    this.session = this.createSession(code, { id: this.myId, nickname });
    this.session.onPresenceSync(players => this.onSync(players));
    this.session.onBingo(payload => this.declareWin(payload.nickname, false));
    await this.session.join();

    if (verify) {
      await new Promise(res => setTimeout(res, 1500));
      const others = this.session.players().filter(p => p.id !== this.myId);
      if (others.length === 0) { await this.bail(); throw new Error("not-found"); }
      const taken = others.some(p => (p.nickname || "").trim().toLowerCase() === nickname.trim().toLowerCase());
      if (taken) { await this.bail(); throw new Error("name-taken"); }
    }

    this.roomView.setSolo(false);
    this.roomView.showCode(code);
    this.roomView.setVote(false, 1, 1);
    this.roomView.announce("");
    this.model.build();
    this.board.setLocked(false);
    this.paint();
  }

  async bail(){
    await this.session.leave();
    this.session = null;
  }

  startSolo(nickname){
    this.solo = true;
    this.session = null;
    this.players = null;
    this.nickname = nickname || "";
    this.locked = false;
    this.roomView.setSolo(true);
    this.roomView.setVote(false, 0, 0);
    this.roomView.announce("");
    this.model.build();
    this.board.setLocked(false);
    this.paint();
  }

  paint(){
    this.board.render(this.model);
    this.board.highlight(this.model);
    this.board.score(this.model);
  }

  handleToggle(index){
    if (this.locked) return;
    const fresh = this.model.toggle(index);
    this.board.setMarked(index, this.model.cells[index].marked);
    this.board.highlight(this.model);
    this.board.score(this.model);
    if (fresh > 0) {
      if (this.session) this.session.announceBingo();
      this.declareWin(this.nickname, true);
    }
  }

  declareWin(nickname, isSelf){
    if (this.locked) return;
    this.locked = true;
    this.board.setLocked(true);
    this.celebration.fire();
    this.roomView.announce(isSelf ? this.i18n.t.youBingo : `${nickname} ${this.i18n.t.didBingo}`);
    if (isSelf) {
      if (this.session) this.session.setWonRound(this.round);
      if (this.service.ready && this.nickname) {
        this.service.submit({ name: this.nickname, ...this.model.snapshot() }).catch(() => {});
      }
    }
  }

  toggleVote(){
    if (this.solo) { dlog("toggleVote: solo -> rebuild"); this.rebuild(); this.roomView.announce(""); return; }
    this.voted = !this.voted;
    dlog("toggleVote -> voted =", this.voted, "round", this.round);
    this.session.setVoteRound(this.voted ? this.round : -1);   // vote is bound to the current round
    this.evaluateRestart();   // act on local knowledge now — don't wait for my own vote to echo back
    this.renderRoom();
    this.scheduleResync();    // keep re-asserting so a dropped presence sync self-heals
  }

  // re-send my vote while it's pending; each re-send carries full presence state to all clients,
  // healing a one-off dropped sync that would otherwise leave a player's vote "missed".
  resyncVote(){
    if (this.session && this.voted) this.session.setVoteRound(this.round);
  }

  scheduleResync(attempt = 0){
    clearTimeout(this._resync);
    if (!this.voted || attempt >= 4) return;
    const roundAtVote = this.round;
    this._resync = setTimeout(() => {
      if (this.voted && this.round === roundAtVote) {
        this.resyncVote();
        this.scheduleResync(attempt + 1);
      }
    }, 1200);
  }

  // count my own vote from LOCAL state (no presence round-trip), others from presence
  votedFor(p){
    return p.id === this.myId ? this.voted : p.voteRound === this.round;
  }

  onSync(players){
    this.players = players;

    const winner = players.find(p => p.wonRound === this.round);   // win tied to the current round
    if (winner && !this.locked) this.declareWin(winner.nickname, winner.id === this.myId);

    this.evaluateRestart();
    this.renderRoom();
  }

  evaluateRestart(){
    const players = this.players || [];
    const total = players.length;
    if (total === 0) return;
    const voted = players.filter(p => this.votedFor(p)).length;
    // votes are bound to the round and never cleared — advancing the round makes them stale,
    // so every client advances exactly once and there is no clearing race.
    if (voted === total) {
      dlog("ALL VOTED -> advance to round", this.round + 1);
      this.round += 1;
      this.voted = false;
      this.rebuild();
      this.roomView.announce(this.i18n.t.restarting);
      setTimeout(() => this.roomView.announce(""), 1500);
    }
  }

  renderRoom(){
    const players = this.players || [];
    const total = players.length;
    const voted = players.filter(p => this.votedFor(p)).length;
    players.forEach(p => { p.isWinner = p.wonRound === this.round; p.isVoter = this.votedFor(p); });
    dlog("render: total", total, "voted", voted, "round", this.round, "myVoted", this.voted);
    this.roomView.setPlayers(players);
    this.roomView.setVote(this.voted, voted, total);
  }

  rebuild(){
    clearTimeout(this._resync);
    this.voted = false;
    this.locked = false;
    this.board.setLocked(false);
    this.model.build();
    this.paint();
  }

  applyLang(){
    this.roomView.apply();
    this.paint();
    if (this.solo) this.roomView.setVote(false, 0, 0);
    else if (this.players) this.onSync(this.players);
  }

  leave(){
    clearTimeout(this._resync);
    const session = this.session;
    this.session = null;
    this.solo = false;
    this.players = null;
    if (this.onExit) this.onExit();   // return to the lobby immediately
    if (session) session.leave();     // tear the realtime channel down in the background
  }
}
