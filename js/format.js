const ENTITIES = { "&":"&amp;", "<":"&lt;", ">":"&gt;", "\"":"&quot;" };

export function escapeHtml(value){
  return (value || "").replace(/[&<>"]/g, char => ENTITIES[char]);
}

export function formatTime(seconds){
  if (seconds == null) return "—";
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return minutes ? `${minutes}m${String(rest).padStart(2, "0")}s` : `${rest}s`;
}

export function formatAgo(iso){
  const delta = (Date.now() - new Date(iso).getTime()) / 1000;
  if (delta < 60) return Math.max(0, Math.round(delta)) + "s";
  if (delta < 3600) return Math.round(delta / 60) + "m";
  if (delta < 86400) return Math.round(delta / 3600) + "h";
  return Math.round(delta / 86400) + "d";
}
