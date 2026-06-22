import { RoomController } from "../js/room-controller.js";

// ---- fake realtime hub: models Supabase presence + broadcast(self:true) ----
class Hub {
  constructor(){ this.sessions = new Map(); this.queue = []; }
  add(s){ this.sessions.set(s.id, s); this.scheduleSync(); }
  remove(id){ this.sessions.delete(id); this.scheduleSync(); }
  track(id, state){ this.sessions.get(id).state = { ...state }; this.scheduleSync(); }
  presence(){ const o = {}; for (const s of this.sessions.values()) o[s.id] = [{ ...s.state }]; return o; }
  scheduleSync(){ const snap = this.presence(); for (const s of this.sessions.values()) this.queue.push(() => s._sync(snap)); }
  broadcast(event, payload){ for (const s of this.sessions.values()) this.queue.push(() => s._broadcast(event, payload)); }
  flush(){ let n = 0; while (this.queue.length){ this.queue.shift()(); if (++n > 1e6) throw new Error("hub flush loop"); } }
}

class FakeSession {
  constructor(hub, code, identity){
    this.hub = hub; this.id = identity.id;
    this.state = { id: identity.id, nickname: identity.nickname, voteRound: -1, wonRound: -1 };
  }
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
  _broadcast(event, payload){
    if (event === "bingo" && this.bingoHandler) this.bingoHandler(payload);
    if (event === "restart" && this.restartHandler) this.restartHandler(payload);
  }
}

// ---- DOM-less mocks ----
const i18n = { lang: "en", t: { restarting: "R", didBingo: "did", youBingo: "you", players: "p", voteRestart: "v", newBoard: "n", free: "FREE" } };
const board = { render(){}, highlight(){}, score(){}, setLocked(){}, setMarked(){} };
const roomView = { setSolo(){}, showCode(){}, setVote(){}, announce(){}, setPlayers(){} };
const celebration = { fire(){} };
const service = { ready: false, submit(){ return Promise.resolve(); } };
const makeModel = () => ({ builds: 0, build(){ this.builds++; }, snapshot(){ return {}; }, dabbed: 0, lines: 0, totalBingos: 0, cells: [], litCells(){ return new Set(); }, won: false });

let idc = 0;
function makeController(hub){
  return new RoomController({
    i18n, model: makeModel(), board, celebration, service, roomView,
    onExit(){},
    createSession: (code, identity) => new FakeSession(hub, code, identity),
    makeId: () => "id_" + (++idc)
  });
}

// ---- the test ----
function assert(cond, msg){ if (!cond){ console.error("FAIL:", msg); process.exitCode = 1; throw new Error(msg); } }

const hub = new Hub();
const A = makeController(hub);
const B = makeController(hub);
await A.start("ROOM", "A", false); hub.flush();
await B.start("ROOM", "B", false); hub.flush();

const ROUNDS = 12;
for (let i = 1; i <= ROUNDS; i++){
  A.toggleVote(); hub.flush();
  B.toggleVote(); hub.flush();
  console.log(`restart ${i}: A.round=${A.round} B.round=${B.round} A.voted=${A.voted} B.voted=${B.voted} A.builds=${A.model.builds}`);
  assert(A.round === B.round, `round desync at restart ${i}: A=${A.round} B=${B.round}`);
  assert(A.round === i, `expected round ${i}, got A.round=${A.round}`);
  assert(A.voted === false && B.voted === false, `votes not cleared after restart ${i}`);
}
console.log(`\nPASS: ${ROUNDS} restarts, both clients in sync (round=${A.round}).`);
process.exit(process.exitCode || 0);
