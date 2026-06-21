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
    notConfigured: "Leaderboard not set up yet. Add your Supabase URL and key to enable it.",
    tagline: "Play bingo with your friends in real time.",
    nickname: "Your nickname", createRoom: "Create room", joinRoom: "Join room", playSolo: "Play solo", newBoard: "New board",
    roomCode: "Room code", enterCode: "Enter a room code", enterNickname: "Type a nickname first",
    connecting: "Connecting…", connectErr: "Couldn't connect — try again",
    code: "Code", copy: "Copy", copied: "Copied!", players: "players",
    voteRestart: "Vote restart", leave: "Leave", waiting: "Waiting for players…",
    didBingo: "did the BINGO!", youBingo: "You got the BINGO!", restarting: "New round!"
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
    notConfigured: "Placar ainda não configurado. Adicione a URL e a chave do Supabase para ativar.",
    tagline: "Jogue bingo com seus amigos em tempo real.",
    nickname: "Seu apelido", createRoom: "Criar sala", joinRoom: "Entrar na sala", playSolo: "Jogar sozinho", newBoard: "Novo quadro",
    roomCode: "Código da sala", enterCode: "Digite um código de sala", enterNickname: "Digite um apelido primeiro",
    connecting: "Conectando…", connectErr: "Não foi possível conectar — tente de novo",
    code: "Código", copy: "Copiar", copied: "Copiado!", players: "jogadores",
    voteRestart: "Votar reinício", leave: "Sair", waiting: "Aguardando jogadores…",
    didBingo: "fez BINGO!", youBingo: "Você fez BINGO!", restarting: "Nova rodada!"
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
