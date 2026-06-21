import { Storage } from "./storage.js";
import { KEYS } from "./config.js";

const STRINGS = {
  en: {
    subtitle: "Dab a square every time he says it. Get 5 in a row.",
    shuffle: "Shuffle", reset: "New day", free: "FREE",
    dabbed: "dabbed", lines: "line(s)", bingos: "bingos",
    leaderboard: "Leaderboard", yourName: "Your name", save: "Save result",
    ranking: "Ranking", recent: "Recent", refresh: "Refresh",
    saved: "Saved!", saveErr: "Couldn't save — check your connection",
    loadErr: "Couldn't load scores", needName: "Type your name first",
    noScores: "No scores yet — be the first!", loading: "Loading…",
    winsShort: "wins", linesShort: "lines",
    notConfigured: "Leaderboard not set up yet. Add your Supabase URL and key to enable it."
  },
  pt: {
    subtitle: "Marque um quadrado cada vez que ele falar. Faça 5 em linha.",
    shuffle: "Embaralhar", reset: "Novo dia", free: "LIVRE",
    dabbed: "marcados", lines: "linha(s)", bingos: "bingos",
    leaderboard: "Placar", yourName: "Seu nome", save: "Salvar resultado",
    ranking: "Ranking", recent: "Recentes", refresh: "Atualizar",
    saved: "Salvo!", saveErr: "Não foi possível salvar — verifique a conexão",
    loadErr: "Não foi possível carregar", needName: "Digite seu nome primeiro",
    noScores: "Ainda sem pontuações — seja o primeiro!", loading: "Carregando…",
    winsShort: "vit.", linesShort: "linhas",
    notConfigured: "Placar ainda não configurado. Adicione a URL e a chave do Supabase para ativar."
  }
};

export class I18n {
  constructor(){
    this.lang = Storage.get(KEYS.lang) || "en";
  }
  get t(){
    return STRINGS[this.lang];
  }
  setLang(lang){
    this.lang = lang;
    Storage.set(KEYS.lang, lang);
  }
}
