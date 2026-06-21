import { RoomSession, makePlayerId } from "./realtime-service.js";

export class RoomController {
  constructor({ i18n, model, board, celebration, service, roomView, onExit }){
    this.i18n = i18n;
    this.model = model;
    this.board = board;
    this.celebration = celebration;
    this.service = service;
    this.roomView = roomView;
    this.onExit = onExit;

    this.session = null;
    this.solo = false;
    this.nickname = "";
    this.myId = null;
    this.voted = false;
    this.locked = false;
    this.round = 0;
    this.requestedRound = false;
  }

  async start(code, nickname, verify){
    this.solo = false;
    this.nickname = nickname;
    this.myId = makePlayerId();
    this.voted = false;
    this.locked = false;
    this.round = 0;
    this.requestedRound = false;

    this.session = new RoomSession(code, { id: this.myId, nickname });
    this.session.onPresenceSync(players => this.onSync(players));
    this.session.onBingo(payload => this.declareWin(payload.nickname, false));
    this.session.onRestart(payload => this.onRestart(payload));
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
      this.session.announceBingo();
      this.declareWin(this.nickname, true);
    }
  }

  declareWin(nickname, isSelf){
    if (this.locked) return;
    this.locked = true;
    this.board.setLocked(true);
    this.celebration.fire();
    this.roomView.announce(isSelf ? this.i18n.t.youBingo : `${nickname} ${this.i18n.t.didBingo}`);
    if (isSelf && this.session) {
      this.session.setWon(true);
      if (this.service.ready) {
        this.service.submit({ name: this.nickname, ...this.model.snapshot() }).catch(() => {});
      }
    }
  }

  toggleVote(){
    if (this.solo) { this.rebuild(); this.roomView.announce(""); return; }
    this.voted = !this.voted;
    this.session.setVote(this.voted);
  }

  onSync(players){
    this.players = players;
    const total = players.length;
    const voted = players.filter(p => p.voteRestart).length;
    this.roomView.setPlayers(players);
    this.roomView.setVote(this.voted, voted, total);

    const allVoted = total > 0 && voted === total;
    if (allVoted && !this.requestedRound) {
      this.requestedRound = true;
      this.session.announceRestart(this.round);   // every client may send; receivers dedup by round
    }
    if (!allVoted) this.requestedRound = false;
  }

  onRestart({ round }){
    if (round < this.round) return;        // stale duplicate — already handled
    this.round = round + 1;
    this.requestedRound = false;
    this.rebuild();
    this.roomView.announce(this.i18n.t.restarting);
    setTimeout(() => this.roomView.announce(""), 1500);
    this.session.setVote(false);
    this.session.setWon(false);
  }

  rebuild(){
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

  async leave(){
    if (this.session) await this.session.leave();
    this.session = null;
    this.solo = false;
    this.players = null;
    if (this.onExit) this.onExit();
  }
}
