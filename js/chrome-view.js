export class ChromeView {
  constructor({ i18n, onLangChange }){
    this.i18n = i18n;
    this.subtitle = document.getElementById("subtitle");
    this.openLbBtn = document.getElementById("open-lb");
    this.dabbedLabel = document.getElementById("lbl-dabbed");
    this.linesLabel = document.getElementById("lbl-lines");
    this.bingosLabel = document.getElementById("lbl-bingos");
    this.langButtons = document.querySelectorAll(".lang button");

    this.langButtons.forEach(button => {
      button.addEventListener("click", () => onLangChange(button.dataset.lang));
    });
  }

  apply(){
    const t = this.i18n.t;
    this.subtitle.textContent = t.subtitle;
    this.openLbBtn.textContent = "🏆 " + t.leaderboard;
    this.dabbedLabel.textContent = t.dabbed;
    this.linesLabel.textContent = t.lines;
    this.bingosLabel.textContent = t.bingos;
    this.langButtons.forEach(button => {
      button.classList.toggle("active", button.dataset.lang === this.i18n.lang);
    });
    document.documentElement.lang = this.i18n.lang;
  }

  onOpenLeaderboard(handler){ this.openLbBtn.addEventListener("click", handler); }
}
