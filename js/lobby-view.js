import { Storage } from "./storage.js";
import { KEYS } from "./config.js";

export class LobbyView {
  constructor({ i18n, onCreate, onJoin, onSolo }){
    this.i18n = i18n;
    this.onCreate = onCreate;
    this.onJoin = onJoin;
    this.onSolo = onSolo;

    this.tagline = document.getElementById("lobby-tagline");
    this.nameInput = document.getElementById("nickname");
    this.createBtn = document.getElementById("create-btn");
    this.codeInput = document.getElementById("join-code");
    this.joinBtn = document.getElementById("join-btn");
    this.soloBtn = document.getElementById("solo-btn");
    this.message = document.getElementById("lobby-msg");

    this.nameInput.value = Storage.get(KEYS.name) || "";
    this.codeInput.addEventListener("input", () => {
      this.codeInput.value = this.codeInput.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    });
    this.createBtn.addEventListener("click", () => this.submitCreate());
    this.joinBtn.addEventListener("click", () => this.submitJoin());
    this.soloBtn.addEventListener("click", () => this.submitSolo());
    this.codeInput.addEventListener("keydown", e => { if (e.key === "Enter") this.submitJoin(); });
  }

  apply(){
    const t = this.i18n.t;
    this.tagline.textContent = t.tagline;
    this.nameInput.placeholder = t.nickname;
    this.createBtn.textContent = t.createRoom;
    this.codeInput.placeholder = t.roomCode;
    this.joinBtn.textContent = t.joinRoom;
    this.soloBtn.textContent = t.playSolo;
  }

  submitSolo(){
    const name = this.nickname();
    if (name) Storage.set(KEYS.name, name);
    this.onSolo(name);
  }

  nickname(){
    return (this.nameInput.value || "").trim();
  }

  requireNickname(){
    const name = this.nickname();
    if (!name) { this.notify(this.i18n.t.enterNickname, true); return null; }
    Storage.set(KEYS.name, name);
    return name;
  }

  submitCreate(){
    const name = this.requireNickname();
    if (name) this.onCreate(name);
  }

  submitJoin(){
    const name = this.requireNickname();
    if (!name) return;
    const code = (this.codeInput.value || "").trim().toUpperCase();
    if (!code) { this.notify(this.i18n.t.enterCode, true); return; }
    this.onJoin(name, code);
  }

  notify(text, isError){
    this.message.textContent = text;
    this.message.className = "lobby-msg" + (isError ? " err" : "");
  }

  setBusy(busy){
    this.createBtn.disabled = busy;
    this.joinBtn.disabled = busy;
    if (busy) this.notify(this.i18n.t.connecting, false);
  }
}
