import { I18n } from "./i18n.js";
import { BoardModel } from "./board-model.js";
import { BoardView } from "./board-view.js";
import { ChromeView } from "./chrome-view.js";
import { Celebration } from "./celebration.js";
import { LeaderboardService } from "./leaderboard-service.js";
import { LeaderboardView } from "./leaderboard-view.js";
import { MusicController } from "./music.js";
import { Mascot } from "./mascot.js";
import { LobbyView } from "./lobby-view.js";
import { RoomView } from "./room-view.js";
import { RoomController } from "./room-controller.js";
import { RoomSession, makeRoomCode, makePlayerId } from "./realtime-service.js";
import { startFpsMeter } from "./fps-meter.js";

const byId = id => document.getElementById(id);

if (new URLSearchParams(location.search).has("fps")) startFpsMeter();

const i18n = new I18n();
const model = new BoardModel();
const celebration = new Celebration(byId("banner"));

const board = new BoardView({
  grid: byId("grid"),
  countEl: byId("count"),
  linesEl: byId("lines"),
  bingosEl: byId("total-bingos"),
  i18n,
  onToggle: index => room.handleToggle(index)
});

const service = new LeaderboardService();
const leaderboard = new LeaderboardView({ i18n, service });
const chrome = new ChromeView({ i18n, onLangChange: changeLang });
new MusicController({ audio: byId("song"), button: byId("music-toggle") });
new Mascot();

const roomView = new RoomView({
  i18n,
  onVote: () => room.toggleVote(),
  onLeave: () => room.leave()
});

const room = new RoomController({
  i18n, model, board, celebration, service, roomView,
  onExit: showLobby,
  createSession: (code, identity) => new RoomSession(code, identity),
  makeId: makePlayerId
});

const lobby = new LobbyView({
  i18n,
  onCreate: nickname => enterRoom(nickname, makeRoomCode(), false),
  onJoin: (nickname, code) => enterRoom(nickname, code, true),
  onSolo: nickname => { room.startSolo(nickname); document.body.classList.add("in-room"); }
});

chrome.onOpenLeaderboard(() => leaderboard.open());

async function enterRoom(nickname, code, verify){
  lobby.setBusy(true);
  try {
    await room.start(code, nickname, verify);
    document.body.classList.add("in-room");
    lobby.notify("", false);
  } catch (e) {
    const msg = e.message === "not-found" ? i18n.t.roomNotFound
      : e.message === "name-taken" ? i18n.t.nameTaken
      : i18n.t.connectErr;
    lobby.notify(msg, true);
  } finally {
    lobby.setBusy(false);
  }
}

function showLobby(){
  document.body.classList.remove("in-room");
}

function applyLanguage(){
  chrome.apply();
  leaderboard.apply();
  lobby.apply();
  roomView.apply();
  if (room.session || room.solo) room.applyLang();
}

function changeLang(lang){
  i18n.setLang(lang);
  applyLanguage();
}

try {
  applyLanguage();
} finally {
  document.body.classList.add("ready");
}
