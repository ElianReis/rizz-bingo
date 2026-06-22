import { RoomController } from "../js/room-controller.js";

class Hub {
  constructor(){ this.sessions = new Map(); this.queue = []; }
  add(s){ this.sessions.set(s.id, s); this.scheduleSync(); }
  remove(id){ this.sessions.delete(id); this.scheduleSync(); }
  track(id, state){ this.sessions.get(id).state = { ...state }; this.scheduleSync(); }
  presence(){ const o = {}; for (const s of this.sessions.values()) o[s.id] = [{ ...s.state }]; return o; }
  scheduleSync(){ const snap = this.presence(); for (const s of this.sessions.values()) this.queue.push(() => s._sync(snap)); }
  broadcast(event, payload){ for (const s of this.sessions.values()) this.queue.push(() => s._broadcast(event, payload)); }
  flush(){ let n = 0; while (this.queue.length){ this.queue.shift()(); if (++n > 1e6) throw new Error("loop"); } }
}
class FakeSession {
  constructor(hub, code, identity){ this.hub = hub; this.id = identity.id; this.state = { id: identity.id, nickname: identity.nickname, voteRound: -1, wonRound: -1 }; }
  onPresenceSync(h){ this.presenceHandler = h; }
  onBingo(h){ this.bingoHandler = h; }
  onRestart(h){ this.restartHandler = h; }
  players(){ return Object.values(this.hub.presence()).map(m => m[m.length - 1]); }
  async join(){ this.hub.add(this); }
  announceBingo(){ this.hub.broadcast("bingo", { nickname: this.state.nickname }); }
  announceRestart(round){ this.hub.broadcast("restart", { round }); }
  setWonRound(r){ this.state.wonRound = r; this.hub.track(this.id, this.state); }
  setVoteRound(r){ this.state.voteRound = r; this.hub.track(this.id, this.state); }
  async leave(){ this.hub.remove(this.id); }
  _sync(snap){ if (this.presenceHandler) this.presenceHandler(Object.values(snap).map(m => m[m.length - 1])); }
  _broadcast(e, p){ if (e === "bingo" && this.bingoHandler) this.bingoHandler(p); if (e === "restart" && this.restartHandler) this.restartHandler(p); }
}
const i18n = { lang: "en", t: { restarting: "R", didBingo: "did", youBingo: "you", players: "p", voteRestart: "v", newBoard: "n", free: "FREE" } };
const board = { render(){}, highlight(){}, score(){}, setLocked(v){ this.locked = v; }, setMarked(){} };
const roomView = { setSolo(){}, showCode(){}, setVote(){}, announce(){}, setPlayers(){} };
const celebration = { fire(){} };
const service = { ready: false, submit(){ return Promise.resolve(); } };
function makeModel(){
  return {
    builds: 0, nextFresh: 0,
    cells: Array.from({ length: 25 }, () => ({ marked: false, free: false })),
    build(){ this.builds++; this.cells.forEach(c => c.marked = false); },
    toggle(i){ this.cells[i].marked = true; const f = this.nextFresh; this.nextFresh = 0; return f; },
    snapshot(){ return {}; }, dabbed: 1, lines: 1, totalBingos: 0, litCells(){ return new Set(); }, won: true
  };
}
let idc = 0;
function makeController(hub){
  return new RoomController({ i18n, model: makeModel(), board, celebration, service, roomView, onExit(){},
    createSession: (code, identity) => new FakeSession(hub, code, identity), makeId: () => "id_" + (++idc) });
}
function assert(c, m){ if (!c){ console.error("FAIL:", m); process.exitCode = 1; throw new Error(m); } }

// single player in a multiplayer room: WIN -> vote restart -> WIN -> vote restart ...
const hub = new Hub();
const A = makeController(hub);
await A.start("ROOM", "A", false); hub.flush();

for (let i = 1; i <= 5; i++){
  // win
  A.model.nextFresh = 1;
  A.handleToggle(0); hub.flush();
  assert(A.locked === true, `round ${i}: board should be LOCKED after win`);
  // vote restart
  const buildsBefore = A.model.builds;
  A.toggleVote(); hub.flush();
  console.log(`cycle ${i}: round=${A.round} locked=${A.locked} voted=${A.voted} builds=${A.model.builds}`);
  assert(A.locked === false, `round ${i}: board should be UNLOCKED after restart`);
  assert(A.model.builds === buildsBefore + 1, `round ${i}: board did NOT rebuild on restart`);
  assert(A.round === i, `round ${i}: expected round ${i}, got ${A.round}`);
}
console.log("\nPASS: single-player room win->restart cycles work.");
process.exit(process.exitCode || 0);
