import { FREE_INDEX, GRID_SIZE, KEYS } from "./config.js";
import { Storage } from "./storage.js";
import { PHRASES } from "../data/phrases.js";

const LINES = (() => {
  const lines = [];
  for (let r = 0; r < 5; r++) lines.push([0, 1, 2, 3, 4].map(c => r * 5 + c));
  for (let c = 0; c < 5; c++) lines.push([0, 1, 2, 3, 4].map(r => r * 5 + c));
  lines.push([0, 6, 12, 18, 24]);
  lines.push([4, 8, 12, 16, 20]);
  return lines;
})();

function shuffle(source){
  const arr = source.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export class BoardModel {
  constructor(){
    this.cells = [];
    this.completed = new Set();
    this.startedAt = null;
    this.bingoSeconds = null;
    this.totalBingos = parseInt(Storage.get(KEYS.bingos) || "0", 10) || 0;
  }

  build(){
    const pool = shuffle(PHRASES);
    this.cells = [];
    let next = 0;
    for (let i = 0; i < GRID_SIZE; i++) {
      if (i === FREE_INDEX) {
        this.cells.push({ t: "FREE", marked: true, free: true });
      } else {
        const phrase = pool[next++];
        this.cells.push({ t: phrase.t, l: phrase.l, en: phrase.en, pt: phrase.pt, marked: false, free: false });
      }
    }
    this.completed = new Set();
    this.startedAt = null;
    this.bingoSeconds = null;
    this.persist();
  }

  clearMarks(){
    this.cells.forEach(cell => { if (!cell.free) cell.marked = false; });
    this.completed = new Set();
    this.startedAt = null;
    this.bingoSeconds = null;
    this.totalBingos = 0;
    Storage.set(KEYS.bingos, "0");
    this.persist();
  }

  toggle(index){
    const cell = this.cells[index];
    if (cell.free) return 0;
    cell.marked = !cell.marked;
    if (cell.marked && this.startedAt === null) this.startedAt = Date.now();
    const fresh = this.evaluate();
    this.persist();
    return fresh;
  }

  evaluate(){
    let fresh = 0;
    LINES.forEach((line, idx) => {
      const done = line.every(i => this.cells[i].marked);
      if (done && !this.completed.has(idx)) { this.completed.add(idx); fresh++; }
      if (!done) this.completed.delete(idx);
    });
    if (fresh > 0) {
      this.totalBingos += fresh;
      Storage.set(KEYS.bingos, String(this.totalBingos));
      if (this.bingoSeconds === null && this.startedAt !== null) {
        this.bingoSeconds = Math.round((Date.now() - this.startedAt) / 1000);
      }
    }
    return fresh;
  }

  litCells(){
    const lit = new Set();
    this.completed.forEach(idx => LINES[idx].forEach(i => lit.add(i)));
    return lit;
  }

  get dabbed(){
    return this.cells.filter(cell => cell.marked && !cell.free).length;
  }

  get lines(){
    return this.completed.size;
  }

  get won(){
    return this.completed.size > 0;
  }

  snapshot(){
    return {
      lines: this.lines,
      dabbed: this.dabbed,
      won: this.won,
      seconds: this.won ? this.bingoSeconds : null
    };
  }

  persist(){
    Storage.setJSON(KEYS.board, {
      cells: this.cells,
      completed: [...this.completed],
      startedAt: this.startedAt,
      bingoSeconds: this.bingoSeconds
    });
  }

  restore(){
    const saved = Storage.getJSON(KEYS.board);
    if (!saved || !Array.isArray(saved.cells) || saved.cells.length !== GRID_SIZE) return false;
    if (saved.cells.some(cell => !cell.free && (cell.t === undefined || cell.l === undefined))) return false;
    this.cells = saved.cells;
    this.completed = new Set(saved.completed || []);
    this.startedAt = saved.startedAt ?? null;
    this.bingoSeconds = saved.bingoSeconds ?? null;
    return true;
  }
}
