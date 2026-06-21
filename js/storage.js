export const Storage = {
  get(key){
    try { return localStorage.getItem(key); } catch (e) { return null; }
  },
  set(key, value){
    try { localStorage.setItem(key, value); } catch (e) {}
  },
  getJSON(key){
    const raw = this.get(key);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  },
  setJSON(key, value){
    this.set(key, JSON.stringify(value));
  }
};
