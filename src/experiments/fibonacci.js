import { clamp, easeInOutCubic, smoothDamp, TAU, reducedMotion } from '../core/animation.js';
import { canvasSurface, clear, grid } from '../core/canvas.js';
import { actions, numberControl, rangeControl, section, toggleControl } from '../ui/controls.js';

export function buildSquares(count){
  const values=[1n,1n];for(let i=2;i<count;i++)values.push(values[i-1]+values[i-2]);
  const squares=[];let bounds={minX:0,minY:0,maxX:1,maxY:1};
  for(let i=0;i<count;i++){
    const size=Number(values[i]);let x=0,y=0,dir='seed';
    if(i>0){dir=['right','up','left','down'][(i-1)%4];
      if(dir==='right'){x=bounds.maxX;y=bounds.minY}
      if(dir==='up'){x=bounds.minX;y=bounds.minY-size}
      if(dir==='left'){x=bounds.minX-size;y=bounds.minY}
      if(dir==='down'){x=bounds.minX;y=bounds.maxY}
    }
    squares.push({x,y,size,dir,value:values[i]});
    bounds={minX:Math.min(bounds.minX,x),minY:Math.min(bounds.minY,y),maxX:Math.max(bounds.maxX,x+size),maxY:Math.max(bounds.maxY,y+size)};
  }
  return squares;
}
function extent(squares,visible){let b={minX:Infinity,minY:Infinity,maxX:-Infinity,maxY:-Infinity};for(let i=0;i<visible;i++){const s=squares[i];b.minX=Math.min(b.minX,s.x);b.minY=Math.min(b.minY,s.y);b.maxX=Math.max(b.maxX,s.x+s.size);b.maxY=Math.max(b.maxY,s.y+s.size)}return b;}
function arcData(s){
  const {x,y,size:r,dir}=s;
  if(dir==='seed')return {cx:x,cy:y+r,start:-Math.PI/2,end:0};
  if(dir==='right')return {cx:x,cy:y,start:Math.PI/2,end:0};
  if(dir==='up')return {cx:x,cy:y+r,start:0,end:-Math.PI/2};
  if(dir==='left')return {cx:x+r,cy:y+r,start:-Math.PI/2,end:-Math.PI};
  return {cx:x+r,cy:y,start:Math.PI,end:Math.PI/2};
}
function draw(ctx,w,h,squares,progress,camera,settings){
  const complete=Math.floor(progress),partial=easeInOutCubic(progress-complete);
  const toX=x=>w/2+(x-camera.x.value)*camera.scale.value;
  const toY=y=>h/2+(y-camera.y.value)*camera.scale.value;
  ctx.save();if(settings.direction==='counterclockwise'){ctx.translate(w,0);ctx.scale(-1,1)}
  for(let i=0;i<Math.min(squares.length,Math.ceil(progress));i++){
    const s=squares[i],p=i<complete?1:partial,px=toX(s.x),py=toY(s.y),sz=s.size*camera.scale.value;
    if(sz<.4||p<=0)continue;
    ctx.save();ctx.globalAlpha=p;
    let x=px,y=py,sw=sz,sh=sz;
    if(i===complete){if(s.dir==='right'){sw=sz*p}else if(s.dir==='left'){sw=sz*p;x=px+sz-sw}else if(s.dir==='up'){sh=sz*p;y=py+sz-sh}else if(s.dir==='down'){sh=sz*p}else{sw=sz*p;sh=sz*p;x=px+(sz-sw)/2;y=py+(sz-sh)/2}}
    if(settings.showSquares){
      ctx.fillStyle=i%2?'rgba(198,145,55,.066)':'rgba(230,177,79,.043)';ctx.fillRect(x,y,sw,sh);
      ctx.strokeStyle=`rgba(224,177,94,${.44+.33*p})`;ctx.lineWidth=settings.lineWidth;ctx.strokeRect(x+.5,y+.5,Math.max(0,sw-1),Math.max(0,sh-1));
    }
    if(settings.showSpiral&&sz>1){
      const a=arcData(s);ctx.beginPath();ctx.arc(toX(a.cx),toY(a.cy),sz,a.start,a.start+(a.end-a.start)*p,a.end<a.start);
      ctx.strokeStyle='#f7cb70';ctx.lineWidth=Math.max(1.2,settings.lineWidth*1.55);ctx.shadowColor='#e6ac48';ctx.shadowBlur=sz>8?10:0;ctx.stroke();ctx.shadowBlur=0;
    }
    if(settings.showNumbers&&sz>37&&p>.65){ctx.save();if(settings.direction==='counterclockwise'){ctx.translate(w,0);ctx.scale(-1,1)}ctx.font=`${Math.min(25,Math.max(10,sz*.18))}px 'DM Mono',monospace`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='rgba(255,233,187,.78)';const cx=px+sz/2,cy=py+sz/2;ctx.fillText(s.value.toString(),settings.direction==='counterclockwise'?w-cx:cx,cy,Math.max(10,sz*.92));ctx.restore()}
    ctx.restore();
  }
  ctx.restore();
}
export function createFibonacci({canvas,state,workspace,preview=false}){
  const surface=canvasSurface(canvas),local=preview?{steps:8,speed:.75,lineWidth:1,direction:'clockwise',showSquares:true,showSpiral:true,showNumbers:false,playing:true,progress:0}:state;
  let squares=buildSquares(local.steps),camera={x:{value:.5,velocity:0},y:{value:.5,velocity:0},scale:{value:1,velocity:0}},previewCover=0,cameraInitialized=false;
  function resetTimeline(play){local.progress=0;local.playing=play;camera.x={value:.5,velocity:0};camera.y={value:.5,velocity:0};camera.scale={value:Math.max(1,Math.min(surface.width,surface.height)*.73),velocity:0};cameraInitialized=true}
  if(!preview){const panel=workspace.panel,geometry=section('01 / Sequence');
    geometry.append(numberControl('Steps',state.steps,1,100,1,v=>{state.steps=v;squares=buildSquares(v);state.progress=Math.min(state.progress,v)}).el);
    geometry.append(rangeControl('Animation Speed',state.speed,.1,3,.1,v=>state.speed=v,v=>`${v.toFixed(1)}×`).el);
    geometry.append(rangeControl('Line Width',state.lineWidth,.5,4,.1,v=>state.lineWidth=v,v=>`${v.toFixed(1)} px`).el);
    const direction=document.createElement('div');direction.className='control';direction.innerHTML='<span class="control-label">Direction</span><div class="actions"><button class="button" type="button" data-dir="clockwise">Clockwise</button><button class="button" type="button" data-dir="counterclockwise">Counterclockwise</button></div>';
    for(const b of direction.querySelectorAll('button')){b.addEventListener('click',()=>{state.direction=b.dataset.dir;sync()})}function sync(){for(const b of direction.querySelectorAll('button'))b.classList.toggle('primary',b.dataset.dir===state.direction)}sync();geometry.append(direction);panel.append(geometry);
    const layers=section('02 / Layers');for(const [label,key] of [['Squares','showSquares'],['Spiral','showSpiral'],['Numbers','showNumbers']])layers.append(toggleControl(label,state[key],v=>state[key]=v).el);panel.append(layers);
    const playback=section('03 / Timeline');playback.append(actions([['Run',()=>{if(state.progress>=state.steps)resetTimeline(true);else state.playing=true},'primary'],['Pause',()=>state.playing=false],['Reset',()=>resetTimeline(false)],['Replay',()=>resetTimeline(true)]]));panel.append(playback);
  }
  return {get cameraScale(){return camera.scale.value},update(dt){
    const {ctx,width:w,height:h}=surface.resize();if(w<2||h<2)return;
    if(local.playing){local.progress+=dt*local.speed*1.1;if(local.progress>=local.steps){if(preview){resetTimeline(true);previewCover=1}else{local.progress=local.steps;local.playing=false}}}
    const progress=clamp(local.progress,0,local.steps),visible=Math.max(1,Math.min(squares.length,Math.ceil(progress)));
    const b=extent(squares,visible),bw=Math.max(1,b.maxX-b.minX),bh=Math.max(1,b.maxY-b.minY);
    const targetScale=Math.min(w/bw,h/bh)*(preview?.71:.73);
    const targetX=(b.minX+b.maxX)/2,targetY=(b.minY+b.maxY)/2;
    if(!cameraInitialized){camera.x.value=targetX;camera.y.value=targetY;camera.scale.value=targetScale;cameraInitialized=true}
    for(const [axis,target] of [['x',targetX],['y',targetY],['scale',targetScale]]){
      const next=smoothDamp(camera[axis].value,target,camera[axis].velocity,reducedMotion?.08:.42,dt);camera[axis].value=next.value;camera[axis].velocity=next.velocity;
    }
    clear(ctx,w,h);grid(ctx,w,h,preview?44:54);
    draw(ctx,w,h,squares,progress,camera,local);
    if(preview){const closing=clamp((progress-(local.steps-.35))/.35,0,1);previewCover=Math.max(0,previewCover-dt*1.6);ctx.fillStyle=`rgba(5,5,5,${Math.max(closing,previewCover)})`;ctx.fillRect(0,0,w,h)}
  }};
}
