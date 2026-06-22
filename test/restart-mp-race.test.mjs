import { RoomController } from "../js/room-controller.js";

// Manual hub: lets us deliver presence syncs to specific clients in a chosen order,
// to reproduce the race where one client restarts before another sees the all-voted state.
class ManualHub {
  constructor(){ this.sessions = new Map(); }
  add(s){ this.sessions.set(s.id, s); }
  remove(id){ this.sessions.delete(id); }
  track(id, state){ this.sessions.get(id).state = { ...state }; }
  presence(){ const o = {}; for (const s of this.sessions.values()) o[s.id] = [{ ...s.state }]; return o; }
  syncTo(id){ const s = this.sessions.get(id); if (s) s._sync(this.presence()); }
  syncAll(){ for (const id of [...this.sessions.keys()]) this.syncTo(id); }
}
class FakeSession {
  constructor(hub, code, identity){ this.hub = hub; this.id = identity.id; this.state = { id: identity.id, nickname: identity.nickname, voteRound: -1, wonRound: -1 }; }
  onPresenceSync(h){ this.presenceHandler = h; }
  onBingo(h){ this.bingoHandler = h; }
  players(){ return Object.values(this.hub.presence()).map(m => m[m.length - 1]); }
  async join(){ this.hub.add(this); }
  announceBingo(){}
  setVoteRound(r){ this.state.voteRound = r; this.hub.track(this.id, this.state); }
  setWonRound(r){ this.state.wonRound = r; this.hub.track(this.id, this.state); }
  async leave(){ this.hub.remove(this.id); }
  _sync(snap){ if (this.presenceHandler) this.presenceHandler(Object.values(snap).map(m => m[m.length - 1])); }
}
const i18n = { lang: "en", t: { restarting: "R", didBingo: "d", youBingo: "y", players: "p", voteRestart: "v", newBoard: "n", free: "FREE" } };
const board = { render(){}, highlight(){}, score(){}, setLocked(){}, setMarked(){} };
const celebration = { fire(){} };
const service = { ready: false, submit(){ return Promise.resolve(); } };
const makeModel = () => ({ builds: 0, build(){ this.builds++; }, snapshot(){ return {}; }, dabbed: 0, lines: 0, totalBingos: 0, cells: [], litCells(){ return new Set(); }, won: false });
// recording roomView captures the last vote-UI state so we can detect a "stuck green / 2-2" button
function makeRoomView(){ return { vote: null, setSolo(){}, showCode(){}, announce(){}, setPlayers(){}, setVote(active, voted, total){ this.vote = { active, voted, total }; } }; }
let idc = 0;
function makeController(hub){
  const roomView = makeRoomView();
  const c = new RoomController({ i18n, model: makeModel(), board, celebration, service, roomView, onExit(){},
    createSession: (code, identity) => new FakeSession(hub, code, identity), makeId: () => "P" + (++idc) });
  c.roomView = roomView;
  return c;
}
function assert(c, m){ if (!c){ console.error("FAIL:", m); process.exitCode = 1; throw new Error(m); } }

const hub = new ManualHub();
const A = makeController(hub);
const B = makeController(hub);
await A.start("ROOM", "A", false);
await B.start("ROOM", "B", false);
hub.syncAll();

for (let i = 1; i <= 8; i++){
  A.toggleVote();             // A.voteRound = i-1
  B.toggleVote();             // B.voteRound = i-1
  // STAGGERED: deliver the all-voted sync to A FIRST. A advances and does NOT clear votes.
  hub.syncTo(A.myId);
  assert(A.round === i, `restart ${i}: A should have advanced (A.round=${A.round})`);
  // Now B finally gets its sync — it must STILL see both votes for the old round and advance too.
  hub.syncTo(B.myId);
  assert(B.round === i, `restart ${i}: B STUCK — did not advance (B.round=${B.round}, A.round=${A.round})`);
  hub.syncAll(); // settle
  // vote UI must NOT be stuck (no green button, no "2/2") after the restart
  for (const [name, c] of [["A", A], ["B", B]]){
    assert(c.roomView.vote.active === false, `restart ${i}: ${name} vote button STUCK GREEN (active)`);
    assert(c.roomView.vote.voted === 0, `restart ${i}: ${name} vote count STUCK at ${c.roomView.vote.voted}/${c.roomView.vote.total}`);
  }
  console.log(`staggered restart ${i}: A.round=${A.round} B.round=${B.round} | UI A=${JSON.stringify(A.roomView.vote)} B=${JSON.stringify(B.roomView.vote)}`);
}
console.log("\nPASS: staggered multiplayer restarts stay in sync, vote UI resets (not stuck).");
process.exit(process.exitCode || 0);
