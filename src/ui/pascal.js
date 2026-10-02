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
export const PASCAL_SEQUENCE_DURATION=7.25;
const ZOOM_START=2.15;
const FINAL_SCALE=.0115;
const DEEP_BANDS=[
  {start:10,end:128,resolution:.34},
  {start:128,end:512,resolution:.10},
  {start:512,end:1024,resolution:.08}
];

// Camera distance gains speed throughout the last 5.1 seconds. Its apex never moves.
export function pascalCameraScale(seconds){
  const q=clamp((seconds-ZOOM_START)/(PASCAL_SEQUENCE_DURATION-ZOOM_START),0,1);
  return Math.exp(Math.log(FINAL_SCALE)*q*q);
}

function geometry(width,height){
  const stepX=Math.min(31,(width-22)/9),stepY=Math.min(23,(height-15)/10);
  return {stepX,stepY,apexX:width/2,apexY:(height-stepY*9)/2,cellW:stepX*.78,cellH:stepY*.78};
}

function createBand(spec,{stepX,stepY,cellW,cellH}){
  const halfWidth=(spec.end-1)*stepX/2+cellW/2;
  const xMin=-halfWidth-1/spec.resolution;
  const yMin=spec.start*stepY-cellH/2-1/spec.resolution;
  const logicalWidth=2*halfWidth+2/spec.resolution;
  const logicalHeight=(spec.end-1)*stepY+cellH/2-yMin+1/spec.resolution;
  const bitmap=typeof OffscreenCanvas==='function'
    ?new OffscreenCanvas(Math.ceil(logicalWidth*spec.resolution),Math.ceil(logicalHeight*spec.resolution))
    :document.createElement('canvas');
  bitmap.width=Math.ceil(logicalWidth*spec.resolution);
  bitmap.height=Math.ceil(logicalHeight*spec.resolution);
  const context=bitmap.getContext('2d',{alpha:true});
  context.setTransform(spec.resolution,0,0,spec.resolution,-xMin*spec.resolution,-yMin*spec.resolution);
  context.fillStyle='#fafafa';
  return {...spec,bitmap,context,xMin,yMin,nextRow:spec.start};
}

function buildBands(bands,metrics,rowBudget){
  let remaining=rowBudget,built=0;
  for(const band of bands){
    while(band.nextRow<band.end&&remaining>0){
      const r=band.nextRow++;
      for(let k=0;k<=r;k++)if(isOddPascal(r,k)){
        const x=(k-r/2)*metrics.stepX,y=r*metrics.stepY;
        band.context.fillRect(x-metrics.cellW/2,y-metrics.cellH/2,metrics.cellW,metrics.cellH);
      }
      remaining--;built++;
    }
    if(!remaining)break;
  }
  return built;
}

export function createPascalHero(region,canvas,{interactive=true}={}){
  const surface=canvasSurface(canvas);
  const motion={time:0,speed:0,acceleration:0,target:0,manual:false};
  let bands=[],bandKey='',builtRows=0,lastFrame='';

  function setTarget(reveal){motion.manual=false;motion.target=reveal?1:0}
  function syncBands(metrics){
    const key=metrics.stepX.toFixed(4)+':'+metrics.stepY.toFixed(4);
    if(key===bandKey)return;
    bands=DEEP_BANDS.map(spec=>createBand(spec,metrics));
    bandKey=key;builtRows=0;lastFrame='';
  }
  function prepare(){
    const {width,height}=surface.resize();if(width<2||height<2)return;
    const metrics=geometry(width,height);syncBands(metrics);
    builtRows+=buildBands(bands,metrics,Infinity);
  }
  // Fixed-time export can call seek(t), then update(0), for deterministic frames.
  function seek(seconds){
    motion.manual=true;motion.time=clamp(seconds,0,PASCAL_SEQUENCE_DURATION);
    motion.speed=0;motion.acceleration=0;lastFrame='';
    if(motion.time>ZOOM_START)prepare();
  }
  if(interactive){
    region.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'||e.pointerType==='pen')setTarget(true)});
    region.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'||e.pointerType==='pen')setTarget(false)});
    region.addEventListener('focus',()=>setTarget(true));
    region.addEventListener('blur',()=>setTarget(false));
    region.addEventListener('click',e=>{if(e.pointerType==='touch'||!matchMedia('(hover: hover)').matches)setTarget(!motion.target)});
    region.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setTarget(!motion.target)}});
  }

  return {duration:PASCAL_SEQUENCE_DURATION,get time(){return motion.time},get cameraScale(){return pascalCameraScale(motion.time)},setTarget,seek,prepare,update(dt){
    if(!motion.manual){
      const atEnd=motion.target?motion.time>=PASCAL_SEQUENCE_DURATION:motion.time<=0;
      if(atEnd){motion.speed=0;motion.acceleration=0}
      else{
        const next=smoothDamp(motion.speed,motion.target?1:-1,motion.acceleration,reducedMotion?.07:.22,dt);
        motion.speed=next.value;motion.acceleration=next.velocity;
        motion.time=clamp(motion.time+motion.speed*dt,0,PASCAL_SEQUENCE_DURATION);
      }
    }
    const {ctx,width:w,height:h}=surface.resize();if(w<2||h<2)return;
    const metrics=geometry(w,h);syncBands(metrics);
    if(builtRows<1024-rows.length)builtRows+=buildBands(bands,metrics,64);
    const frameKey=canvas.width+':'+canvas.height+':'+motion.time.toFixed(4)+':'+builtRows+':'+canvasBackground();
    if(frameKey===lastFrame)return;lastFrame=frameKey;
    clear(ctx,w,h);
    const t=motion.time,focus=smoothstep(0,.45,t),retract=smoothstep(.35,1.1,t);
    const encode=smoothstep(1.1,1.8,t),numberFade=smoothstep(1.65,ZOOM_START,t);
    const cameraScale=pascalCameraScale(t);
    const {stepX,stepY,apexX,apexY,cellW,cellH}=metrics;
    const point=(r,k)=>({x:(k-r/2)*stepX,y:r*stepY});
    ctx.save();ctx.translate(apexX,apexY);ctx.scale(cameraScale,cameraScale);

    // The shallow diagonal guides still withdraw toward their left endpoints.
    for(let diagonal=4;diagonal<=10;diagonal++){
      const cells=[];
      for(let k=0;k<=Math.floor(diagonal/2);k++){const r=diagonal-k;if(r<rows.length&&k<=r)cells.push(point(r,k))}
      if(cells.length<2)continue;
      const left=cells[0],right=cells[cells.length-1],amount=1-retract;
      if(amount<=0)continue;
      ctx.beginPath();ctx.moveTo(left.x,left.y);ctx.lineTo(left.x+(right.x-left.x)*amount,left.y+(right.y-left.y)*amount);
      ctx.strokeStyle='rgba(218,170,80,'+((.34+.23*focus)*(1-retract))+')';ctx.lineWidth=1;ctx.stroke();
    }
    for(let r=0;r<rows.length;r++)for(let k=0;k<=r;k++){
      const {x,y}=point(r,k),odd=isOddPascal(r,k);
      ctx.fillStyle=odd?'rgba(250,250,250,'+encode+')':'rgba(0,0,0,'+encode+')';
      ctx.fillRect(x-cellW/2,y-cellH/2,cellW,cellH);
      ctx.strokeStyle='rgba(240,240,240,'+(.085+.14*focus)*(1-encode)+')';ctx.lineWidth=.65;ctx.strokeRect(x-cellW/2,y-cellH/2,cellW,cellH);
      ctx.globalAlpha=(1-numberFade)*(.54+.25*focus);
      const tone=odd?Math.round(245*(1-encode)):245;
      ctx.fillStyle='rgb('+tone+' '+tone+' '+tone+')';ctx.font='700 '+Math.max(10,stepY*.55)+'px Manrope,Arial,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(String(rows[r][k]),x,y+.4,cellW*.95);
      ctx.globalAlpha=1;
    }
    // Row 10 grazes the original viewport edge. Ease only that first edge into view;
    // every deeper row then enters through the same moving camera, without an LOD swap.
    const detailOpacity=smoothstep(0,.035,1-cameraScale);
    if(detailOpacity>0){
      ctx.globalAlpha=detailOpacity;
      for(const band of bands){
        if(apexY+(band.start*stepY-cellH/2)*cameraScale>h)break;
        ctx.drawImage(band.bitmap,band.xMin,band.yMin,band.bitmap.width/band.resolution,band.bitmap.height/band.resolution);
      }
      ctx.globalAlpha=1;
    }
    ctx.restore();
  }};
}
