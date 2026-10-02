import { clamp, smoothDamp, smoothstep, reducedMotion } from '../core/animation.js';
import { canvasSurface, clear } from '../core/canvas.js';
import { canvasBackground } from '../core/theme.js';

export function pascalRows(count){
  const rows=[];let row=[1];
  for(let n=0;n<count;n++){
    rows.push(row);
    const next=Array(n+2).fill(1);
    for(let k=1;k<=n;k++)next[k]=row[k-1]+row[k];
    row=next;
  }
  return rows;
}
// Lucas's theorem for parity: C(n,k) is odd exactly when k's bits are a subset of n's bits.
export function isOddPascal(n,k){return (k & (n-k))===0}

const rows=pascalRows(10);
export function createPascalHero(region,canvas){
  const surface=canvasSurface(canvas),motion={value:0,velocity:0,target:0};
  let lastFrame='';
  region.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'||e.pointerType==='pen')motion.target=1});
  region.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'||e.pointerType==='pen')motion.target=0});
  region.addEventListener('focus',()=>motion.target=1);
  region.addEventListener('blur',()=>motion.target=0);
  region.addEventListener('click',e=>{if(e.pointerType==='touch'||!matchMedia('(hover: hover)').matches)motion.target=1-motion.target});
  region.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();motion.target=1-motion.target}});
  return {update(dt){
    const next=smoothDamp(motion.value,motion.target,motion.velocity,reducedMotion?.13:.39,dt);
    motion.value=next.value;motion.velocity=next.velocity;
    if(Math.abs(motion.value-motion.target)<.0001&&Math.abs(motion.velocity)<.0001){motion.value=motion.target;motion.velocity=0}
    const p=clamp(motion.value,0,1),{ctx,width:w,height:h}=surface.resize();if(w<2||h<2)return;
    const frameKey=canvas.width+':'+canvas.height+':'+w+':'+h+':'+p.toFixed(4)+':'+canvasBackground();
    if(frameKey===lastFrame)return;lastFrame=frameKey;
    clear(ctx,w,h);
    const focus=smoothstep(0,.15,p),retract=smoothstep(.11,.36,p),encode=smoothstep(.33,.57,p),numberFade=smoothstep(.53,.71,p),zoom=smoothstep(.66,.94,p);
    const fractal=smoothstep(.72,.94,p),baseOpacity=1-smoothstep(.76,.94,p);
    const stepX=Math.min(31,(w-22)/9),stepY=Math.min(23,(h-15)/10),top=(h-stepY*9)/2;
    ctx.save();ctx.translate(w/2,h/2);ctx.scale(1-zoom*.35,1-zoom*.35);ctx.translate(-w/2,-h/2);
    ctx.globalAlpha=baseOpacity;
    const point=(r,k)=>({x:w/2+(k-r/2)*stepX,y:top+r*stepY});
    // Shallow Pascal diagonals: row + column stays constant, and their sums are Fibonacci numbers.
    for(let diagonal=4;diagonal<=10;diagonal++){
      const cells=[];
      for(let k=0;k<=Math.floor(diagonal/2);k++){const r=diagonal-k;if(r<rows.length&&k<=r)cells.push(point(r,k))}
      if(cells.length<2)continue;
      const left=cells[0],right=cells[cells.length-1],amount=1-retract;
      ctx.beginPath();ctx.moveTo(left.x,left.y);ctx.lineTo(left.x+(right.x-left.x)*amount,left.y+(right.y-left.y)*amount);
      ctx.strokeStyle='rgba(218,170,80,'+((.34+.23*focus)*(1-retract*.3))+')';ctx.lineWidth=1;ctx.stroke();
    }
    for(let r=0;r<rows.length;r++)for(let k=0;k<=r;k++){
      const {x,y}=point(r,k),odd=isOddPascal(r,k),cw=stepX*.78,ch=stepY*.78;
      ctx.fillStyle=odd?'rgba(250,250,250,'+encode+')':'rgba(0,0,0,'+encode+')';
      ctx.fillRect(x-cw/2,y-ch/2,cw,ch);
      ctx.strokeStyle='rgba(240,240,240,'+(.085+.14*focus)*(1-encode)+')';ctx.lineWidth=.65;ctx.strokeRect(x-cw/2,y-ch/2,cw,ch);
      ctx.globalAlpha=baseOpacity*(1-numberFade)*(.54+.25*focus);
      const tone=odd?Math.round(245*(1-encode)):245;
      ctx.fillStyle='rgb('+tone+' '+tone+' '+tone+')';ctx.font='700 '+Math.max(10,stepY*.55)+'px Manrope,Arial,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(String(rows[r][k]),x,y+.4,cw*.95);
      ctx.globalAlpha=baseOpacity;
    }
    ctx.restore();
    if(fractal>0){
      ctx.fillStyle='rgba(0,0,0,'+fractal+')';ctx.fillRect(0,0,w,h);
      const depth=32,dy=Math.min(7.2,(h-34)/depth),dx=Math.min(8.7,(w-18)/(depth-1)),startY=(h-dy*depth)/2-7;
      ctx.globalAlpha=fractal;ctx.fillStyle='#fff';
      for(let r=0;r<depth;r++)for(let k=0;k<=r;k++)if(isOddPascal(r,k)){
        const x=w/2+(k-r/2)*dx,y=startY+r*dy;
        ctx.fillRect(Math.round(x-dx*.44),Math.round(y-dy*.45),Math.ceil(dx*.88),Math.ceil(dy*.9));
      }
      ctx.globalAlpha=1;
    }
  }};
}
