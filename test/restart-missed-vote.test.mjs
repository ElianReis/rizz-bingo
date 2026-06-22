import { RoomController } from "../js/room-controller.js";

// Manual hub: track() updates state but does NOT auto-deliver; we choose who receives each sync,
// so we can simulate a dropped presence update for one client.
class ManualHub {
  constructor(){ this.sessions = new Map(); }
  add(s){ this.sessions.set(s.id, s); }
  remove(id){ this.sessions.delete(id); }
  track(id, state){ this.sessions.get(id).state = { ...state }; }
  presence(){ const o = {}; for (const s of this.sessions.values()) o[s.id] = [{ ...s.state }]; return o; }
  syncTo(id){ const s = this.sessions.get(id); if (s) s._sync(this.presence()); }
}
class FakeSession {
  constructor(hub, code, identity){ this.hub = hub; this.id = identity.id; this.state = { id: identity.id, nickname: identity.nickname, voteRound: -1, wonRound: -1 }; }
  onPresenceSync(h){ this.presenceHandler = h; }
  onBingo(){}
  players(){ return Object.values(this.hub.presence()).map(m => m[m.length - 1]); }
  async join(){ this.hub.add(this); }
  announceBingo(){}
  setVoteRound(r){ this.state.voteRound = r; this.hub.track(this.id, this.state); }
  setWonRound(r){ this.state.wonRound = r; this.hub.track(this.id, this.state); }
  leave(){ this.hub.remove(this.id); }
  _sync(snap){ if (this.presenceHandler) this.presenceHandler(Object.values(snap).map(m => m[m.length - 1])); }
}
const i18n = { lang: "en", t: { restarting: "R", didBingo: "d", youBingo: "y", players: "p", voteRestart: "v", newBoard: "n", free: "FREE" } };
const board = { render(){}, highlight(){}, score(){}, setLocked(){}, setMarked(){} };
const celebration = { fire(){} };
const service = { ready: false, submit(){ return Promise.resolve(); } };
const makeModel = () => ({ builds: 0, build(){ this.builds++; }, snapshot(){ return {}; }, dabbed: 0, lines: 0, totalBingos: 0, cells: [], litCells(){ return new Set(); }, won: false });
function makeRoomView(){ return { setSolo(){}, showCode(){}, announce(){}, setPlayers(){}, setVote(){} }; }
let idc = 0;
function makeController(hub){
  return new RoomController({ i18n, model: makeModel(), board, celebration, service, roomView: makeRoomView(), onExit(){},
    createSession: (code, identity) => new FakeSession(hub, code, identity), makeId: () => "P" + (++idc) });
}
function assert(c, m){ if (!c){ console.error("FAIL:", m); process.exitCode = 1; throw new Error(m); } }

const hub = new ManualHub();
const A = makeController(hub);
const B = makeController(hub);
await A.start("ROOM", "A", false);
await B.start("ROOM", "B", false);
hub.syncTo(A.myId); hub.syncTo(B.myId);

// both vote for round 0
A.toggleVote();
B.toggleVote();

// DROP the all-voted sync to A: only B receives it
hub.syncTo(B.myId);
assert(B.round === 1, `B should advance (B.round=${B.round})`);
assert(A.round === 0, `A should be stuck (missed B's vote) (A.round=${A.round})`);
console.log(`after dropped sync: A.round=${A.round} (stuck), B.round=${B.round}`);

// A's resync heartbeat fires: it re-asserts A's vote, which generates a fresh sync A then receives
A.resyncVote();
hub.syncTo(A.myId);
assert(A.round === 1, `A should self-heal via resync and advance (A.round=${A.round})`);
console.log(`after A resync: A.round=${A.round} B.round=${B.round}`);

console.log("\nPASS: a missed vote self-heals via the resync heartbeat (no permanent desync).");
process.exit(process.exitCode || 0);
