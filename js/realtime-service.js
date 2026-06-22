import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_KEY, ROOM_PREFIX, ROOM_CODE_LENGTH } from "./config.js";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

let client = null;
function getClient(){
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_KEY, {
      realtime: { params: { eventsPerSecond: 30 } }
    });
  }
  return client;
}

export function makeRoomCode(){
  let code = "";
  const values = crypto.getRandomValues(new Uint32Array(ROOM_CODE_LENGTH));
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) code += CODE_ALPHABET[values[i] % CODE_ALPHABET.length];
  return code;
}

export function makePlayerId(){
  return crypto.randomUUID();
}

export class RoomSession {
  constructor(code, identity){
    this.code = code;
    this.state = { id: identity.id, nickname: identity.nickname, voteRestart: false, wonRound: -1 };
    this.channel = getClient().channel(ROOM_PREFIX + code, {
      config: { presence: { key: identity.id }, broadcast: { self: true } }
    });
    this.presenceHandler = null;
    this.bingoHandler = null;
    this.restartHandler = null;
  }

  onPresenceSync(handler){ this.presenceHandler = handler; }
  onBingo(handler){ this.bingoHandler = handler; }
  onRestart(handler){ this.restartHandler = handler; }

  players(){
    const presence = this.channel.presenceState();
    return Object.values(presence).map(metas => metas[metas.length - 1]);
  }

  join(){
    this.channel.on("presence", { event: "sync" }, () => {
      if (this.presenceHandler) this.presenceHandler(this.players());
    });
    this.channel.on("broadcast", { event: "bingo" }, ({ payload }) => {
      if (this.bingoHandler) this.bingoHandler(payload);
    });
    this.channel.on("broadcast", { event: "restart" }, ({ payload }) => {
      if (this.restartHandler) this.restartHandler(payload);
    });
    return new Promise((resolve, reject) => {
      this.channel.subscribe(async status => {
        if (status === "SUBSCRIBED") {
          await this.channel.track(this.state);
          resolve();
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          reject(new Error(status));
        }
      });
    });
  }

  announceBingo(){
    return this.channel.send({ type: "broadcast", event: "bingo", payload: { nickname: this.state.nickname } });
  }

  announceRestart(round){
    return this.channel.send({ type: "broadcast", event: "restart", payload: { round } });
  }

  setVote(value){
    this.state.voteRestart = value;
    return this.channel.track(this.state);
  }

  setWonRound(round){
    this.state.wonRound = round;
    return this.channel.track(this.state);
  }

  async leave(){
    try { await this.channel.untrack(); } catch (e) {}
    getClient().removeChannel(this.channel);
  }
}
