import { PHRASES } from "../data/phrases.js";

export class Mascot {
  constructor(){
    this.hit = document.getElementById("mascot-hit");
    this.balloon = document.getElementById("mascot-balloon");
    this.timer = null;
    if (this.hit) {
      this.hit.addEventListener("click", () => this.speak());
    }
  }

  speak(){
    const phrase = PHRASES[Math.floor(Math.random() * PHRASES.length)];
    this.balloon.textContent = phrase.t;
    this.balloon.hidden = false;
    this.balloon.classList.remove("pop");
    void this.balloon.offsetWidth;
    this.balloon.classList.add("pop");
    clearTimeout(this.timer);
    this.timer = setTimeout(() => { this.balloon.hidden = true; }, 2600);
  }
}
