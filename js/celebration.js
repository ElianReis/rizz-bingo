const COLORS = ["#FF4757", "#FF8A1F", "#2BB673", "#2E86FF", "#B14EFF", "#FF1F8E", "#FFD93B"];

export class Celebration {
  constructor(banner){
    this.banner = banner;
  }

  fire(){
    this.banner.classList.remove("show");
    void this.banner.offsetWidth;
    this.banner.classList.add("show");
    this.confetti();
  }

  confetti(){
    for (let i = 0; i < 60; i++) {
      const piece = document.createElement("div");
      piece.className = "confetti-piece";
      piece.style.left = Math.random() * 100 + "vw";
      piece.style.background = COLORS[Math.floor(Math.random() * COLORS.length)];
      const duration = 1.5 + Math.random() * 1.4;
      const drift = Math.random() * 200 - 100;
      piece.animate([
        { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
        { transform: `translate(${drift}px, 105vh) rotate(${720 + Math.random() * 360}deg)`, opacity: 1 }
      ], { duration: duration * 1000, easing: "cubic-bezier(.2,.6,.4,1)" });
      document.body.appendChild(piece);
      setTimeout(() => piece.remove(), duration * 1000);
    }
  }
}
