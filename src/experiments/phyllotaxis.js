import { GOLDEN_ANGLE, clamp, smoothDamp, reducedMotion, TAU } from '../core/animation.js';
import { canvasSurface, clear, grid } from '../core/canvas.js';
import { actions, rangeControl, section } from '../ui/controls.js';
import { angleSlider } from '../ui/slider.js';
import { canvasBackground } from '../core/theme.js';

function sprite(size,glow){
  const radius=Math.ceil(size*(2.5+glow*2)+4),c=document.createElement('canvas');c.width=c.height=radius*2;
  const x=c.getContext('2d'),g=x.createRadialGradient(radius,radius,0,radius,radius,radius);
  g.addColorStop(0,'rgba(255,223,143,1)');g.addColorStop(Math.min(.25,size/radius),'rgba(240,172,62,.95)');
  g.addColorStop(.55,`rgba(219,130,28,${.22*glow})`);g.addColorStop(1,'rgba(219,130,28,0)');
  x.fillStyle=g;x.fillRect(0,0,c.width,c.height);return {canvas:c,radius};
}
export function phyllotaxisPoint(n,angleDegrees,spacing){const theta=n*angleDegrees*Math.PI/180,r=spacing*Math.sqrt(n);return {x:r*Math.cos(theta),y:r*Math.sin(theta)}}
export function createPhyllotaxis({canvas,state,workspace,preview=false}){
  const surface=canvasSurface(canvas),local=preview?{points:330,angle:GOLDEN_ANGLE,targetAngle:GOLDEN_ANGLE,angleVelocity:0,spacing:7.5,dotSize:2.5,speed:.8,glow:.55,flicker:.12,playing:true,progress:0}:state;
  let cached=null,cachedSize=-1,cachedGlow=-1,scale={value:1,velocity:0},scaleInitialized=false,slider,previewCover=0,overlay;
  if(!preview){const panel=workspace.panel,geometry=section('01 / Phyllotaxis');
    geometry.append(rangeControl('Point Count',state.points,1,2000,1,v=>state.points=v,v=>Math.round(v).toLocaleString()).el);
    overlay=document.createElement('div');overlay.className='stage-angle-overlay';
    slider=angleSlider('Angle',state);overlay.append(slider.el);workspace.stage.append(overlay);workspace.stage.classList.add('has-angle-control');
    geometry.append(rangeControl('Spacing',state.spacing,2,15,.1,v=>state.spacing=v,v=>`${v.toFixed(1)} u`).el);panel.append(geometry);
    const appearance=section('02 / Appearance');
    appearance.append(rangeControl('Dot Size',state.dotSize,.8,6,.1,v=>state.dotSize=v,v=>`${v.toFixed(1)} u`).el);
    appearance.append(rangeControl('Growth Speed',state.speed,.1,3,.1,v=>state.speed=v,v=>`${v.toFixed(1)}×`).el);
    appearance.append(rangeControl('Glow',state.glow,0,1,.01,v=>state.glow=v,v=>`${Math.round(v*100)}%`).el);
    appearance.append(rangeControl('Flicker',state.flicker,0,1,.01,v=>state.flicker=v,v=>`${Math.round(v*100)}%`).el);panel.append(appearance);
    const playback=section('03 / Growth');playback.append(actions([['Grow',()=>{if(state.progress>=state.points)state.progress=0;state.playing=true},'primary'],['Pause',()=>state.playing=false],['Reset',()=>{state.playing=false;state.progress=0}],['Replay',()=>{state.progress=0;state.playing=true}]]));
    const golden=document.createElement('button');golden.type='button';golden.className='button primary';golden.textContent='φ  ANIMATE TO GOLDEN ANGLE';golden.style.width='100%';golden.style.marginTop='10px';golden.addEventListener('click',()=>state.targetAngle=GOLDEN_ANGLE);playback.append(golden);panel.append(playback);
  }
  return {dispose(){overlay?.remove();workspace?.stage.classList.remove('has-angle-control')},update(dt,time){
    const {ctx,width:w,height:h}=surface.resize();if(w<2||h<2)return;
    if(local.playing){local.progress+=dt*local.speed*(preview?95:240);if(local.progress>=local.points){if(preview){local.progress=0;previewCover=1}else{local.progress=local.points;local.playing=false}}}
    const next=smoothDamp(local.angle,local.targetAngle,local.angleVelocity,reducedMotion?.08:.34,dt);local.angle=next.value;local.angleVelocity=next.velocity;
    if(Math.abs(local.angle-local.targetAngle)<.0003&&Math.abs(local.angleVelocity)<.003){local.angle=local.targetAngle;local.angleVelocity=0}
    const count=Math.min(local.points,Math.ceil(local.progress));
    // Frame the completed flower first; increasing n then reads clearly from center outward.
    const outer=local.spacing*Math.sqrt(Math.max(1,local.points));
    const stageRadius=preview?Math.min(w,h)*.39:Math.min(w*.4,h*(h<440?.22:.34));
    const targetScale=stageRadius/Math.max(20,outer);
    if(!scaleInitialized){scale.value=targetScale;scaleInitialized=true}
    const s=smoothDamp(scale.value,targetScale,scale.velocity,.4,dt);scale.value=s.value;scale.velocity=s.velocity;
    const dotRadius=local.dotSize*Math.max(.55,Math.min(1.5,scale.value));
    if(!cached||Math.abs(dotRadius-cachedSize)>.4||Math.abs(local.glow-cachedGlow)>.08){cached=sprite(dotRadius,local.glow);cachedSize=dotRadius;cachedGlow=local.glow}
    clear(ctx,w,h);grid(ctx,w,h,preview?48:54);
    ctx.save();ctx.translate(w/2,preview?h/2:h*(h<440?.34:.43));
    for(let n=0;n<count;n++){
      // The canonical phyllotaxis rule: no random positions.
      const point=phyllotaxisPoint(n,local.angle,local.spacing);
      const x=point.x*scale.value,y=point.y*scale.value;
      const age=clamp(local.progress-n,0,1),spawn=age*age*(3-2*age);
      if(spawn<=0)continue;
      const shimmer=1-local.flicker*.12*(.5+.5*Math.sin(n*12.9898+time*19))*Math.max(0,1-age);
      ctx.globalAlpha=spawn*shimmer;
      const radius=cached.radius*spawn;ctx.drawImage(cached.canvas,x-radius,y-radius,radius*2,radius*2);
    }
    ctx.restore();
    if(preview){const closing=clamp((local.progress-(local.points-28))/28,0,1);previewCover=Math.max(0,previewCover-dt*1.6);ctx.globalAlpha=Math.max(closing,previewCover);ctx.fillStyle=canvasBackground();ctx.fillRect(0,0,w,h);ctx.globalAlpha=1}
    if(!preview)slider.update(Math.exp(-Math.pow(Math.abs(local.angle-GOLDEN_ANGLE)/6,2)));
  }};
}
