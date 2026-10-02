import { canvasBackground } from './theme.js';

export function canvasSurface(canvas) {
  const ctx = canvas.getContext('2d', { alpha: false });
  let width = 0, height = 0, ratio = 1;
  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(rect.width*dpr));
    const h = Math.max(1, Math.round(rect.height*dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width=w; canvas.height=h; }
    width=rect.width; height=rect.height; ratio=dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    return {ctx,width,height,ratio};
  }
  return { ctx, resize, get width(){return width}, get height(){return height} };
}

export function clear(ctx,w,h) { ctx.fillStyle=canvasBackground(); ctx.fillRect(0,0,w,h); }
export function grid(ctx,w,h, spacing=48) {
  ctx.save(); ctx.strokeStyle='rgba(255,255,255,.032)'; ctx.lineWidth=1;
  for(let x=w/2%spacing; x<w; x+=spacing){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}
  for(let y=h/2%spacing; y<h; y+=spacing){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
  ctx.restore();
}
