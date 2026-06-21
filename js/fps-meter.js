export function startFpsMeter(){
  const badge = document.createElement("div");
  badge.style.cssText = "position:fixed;left:10px;top:10px;z-index:200;font:600 12px/1 ui-monospace,monospace;background:rgba(0,0,0,.6);color:#0f0;padding:6px 8px;border-radius:8px;pointer-events:none;";
  badge.textContent = "… fps";
  document.body.appendChild(badge);

  let frames = 0;
  let last = performance.now();

  function tick(now){
    frames++;
    const elapsed = now - last;
    if (elapsed >= 500) {
      const fps = Math.round((frames * 1000) / elapsed);
      badge.textContent = fps + " fps";
      badge.style.color = fps >= 55 ? "#3cf06f" : fps >= 40 ? "#ffd93b" : "#ff5a5a";
      frames = 0;
      last = now;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
