import { Storage } from "./storage.js";
import { KEYS } from "./config.js";

export class MusicController {
  constructor({ audio, button }){
    this.audio = audio;
    this.button = button;
    this.on = Storage.get(KEYS.music) === "on";

    this.button.addEventListener("click", () => this.toggle());
    this.reflect();

    if (this.on) {
      this.play();
      const resume = () => {
        if (this.on) this.play();
        window.removeEventListener("pointerdown", resume);
        window.removeEventListener("keydown", resume);
      };
      window.addEventListener("pointerdown", resume);
      window.addEventListener("keydown", resume);
    }
  }

  play(){
    return this.audio.play().catch(() => {});
  }

  toggle(){
    this.on = !this.on;
    Storage.set(KEYS.music, this.on ? "on" : "off");
    if (this.on) this.play(); else this.audio.pause();
    this.reflect();
  }

  reflect(){
    this.button.classList.toggle("on", this.on);
    this.button.setAttribute("aria-pressed", this.on);
  }
}
