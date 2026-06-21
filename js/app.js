import { I18n } from "./i18n.js";
import { BoardModel } from "./board-model.js";
import { BoardView } from "./board-view.js";
import { ChromeView } from "./chrome-view.js";
import { Celebration } from "./celebration.js";
import { LeaderboardService } from "./leaderboard-service.js";
import { LeaderboardView } from "./leaderboard-view.js";
import { MusicController } from "./music.js";
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
  onToggle: handleToggle
});

const service = new LeaderboardService();
const leaderboard = new LeaderboardView({
  i18n,
  service,
  getSnapshot: () => model.snapshot()
});

const chrome = new ChromeView({ i18n, onLangChange: changeLang });

new MusicController({ audio: byId("song"), button: byId("music-toggle") });

function handleToggle(index){
  const fresh = model.toggle(index);
  board.setMarked(index, model.cells[index].marked);
  board.highlight(model);
  board.score(model);
  if (fresh > 0) celebration.fire();
}

function paintBoard(){
  board.render(model);
  board.highlight(model);
  board.score(model);
}

function applyLanguage(){
  chrome.apply();
  leaderboard.apply();
  paintBoard();
}

function changeLang(lang){
  i18n.setLang(lang);
  applyLanguage();
}

chrome.onShuffle(() => { model.build(); paintBoard(); });
chrome.onReset(() => { model.clearMarks(); paintBoard(); });
chrome.onOpenLeaderboard(() => leaderboard.open());

try {
  if (!model.restore()) model.build();
  applyLanguage();
} finally {
  document.body.classList.add("ready");
}
