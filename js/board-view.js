export class BoardView {
  constructor({ grid, countEl, linesEl, bingosEl, i18n, onToggle }){
    this.grid = grid;
    this.countEl = countEl;
    this.linesEl = linesEl;
    this.bingosEl = bingosEl;
    this.i18n = i18n;
    this.onToggle = onToggle;
    this.locked = false;
  }

  setLocked(locked){
    this.locked = locked;
    this.grid.classList.toggle("locked", locked);
  }

  render(model){
    this.grid.innerHTML = "";
    model.cells.forEach((cell, i) => {
      const button = document.createElement("button");
      button.className = "cell" + (cell.marked ? " marked" : "") + (cell.free ? " free" : "");
      button.setAttribute("aria-pressed", cell.marked);
      button.dataset.i = i;
      button.innerHTML = `<span class="dab"></span><span class="label">${this.labelHtml(cell)}</span>`;
      if (cell.free) {
        button.style.cursor = "default";
      } else {
        button.addEventListener("click", () => { if (!this.locked) this.onToggle(i); });
      }
      this.grid.appendChild(button);
    });
  }

  labelHtml(cell){
    if (cell.free) return this.i18n.t.free;
    const lang = this.i18n.lang;
    const main = cell.t || "";
    if (cell.l && cell.l !== lang) {
      const translation = lang === "pt" ? cell.pt : cell.en;
      if (translation) return `${main}<span class="sub">${translation}</span>`;
    }
    return main;
  }

  setMarked(index, marked){
    const button = this.grid.querySelector(`.cell[data-i="${index}"]`);
    if (!button) return;
    button.classList.toggle("marked", marked);
    button.setAttribute("aria-pressed", marked);
  }

  highlight(model){
    const lit = model.litCells();
    this.grid.querySelectorAll(".cell").forEach(el => {
      el.classList.toggle("in-line", lit.has(Number(el.dataset.i)));
    });
  }

  score(model){
    this.countEl.textContent = model.dabbed;
    this.linesEl.textContent = model.lines;
    this.bingosEl.textContent = model.totalBingos;
  }
}
