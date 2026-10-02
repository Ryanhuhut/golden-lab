import { GOLDEN_ANGLE, TAU, clamp, smoothDamp, easeInOutCubic, lerp, reducedMotion } from '../core/animation.js';
import { canvasSurface, clear, grid } from '../core/canvas.js';
import { actions, numberControl, rangeControl, section } from '../ui/controls.js';
import { angleSlider } from '../ui/slider.js';

function petalPath(ctx,length,width){
  ctx.beginPath();ctx.moveTo(0,0);
  ctx.bezierCurveTo(width*.76,-length*.18,width*1.08,-length*.55,0,-length);
  ctx.bezierCurveTo(-width*1.08,-length*.55,-width*.76,-length*.18,0,0);ctx.closePath();
}
function drawFlower(ctx,w,h,p,{count,angle,length,width,center,glow,rotation,pulse,preview}){
  const compact=h<440&&!preview;
  ctx.save();ctx.translate(w/2,preview?h/2:h*(compact?.34:.42));
  const radius=preview?Math.min(w,h)*.41:Math.min(w*.42,h*(compact?.20:.31));
  const fit=radius/(length*1.38);ctx.scale(fit,fit);ctx.rotate(rotation);
  const aura=ctx.createRadialGradient(0,0,10,0,0,length*1.27);aura.addColorStop(0,`rgba(210,142,40,${.17+glow*.14})`);aura.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=aura;ctx.beginPath();ctx.arc(0,0,length*1.27,0,TAU);ctx.fill();
  const drawCount=Math.ceil(count);const goldenBoost=1+pulse*.034;
  for(let i=drawCount-1;i>=0;i--){const visibility=clamp(count-i,0,1);if(visibility<=0)continue;
    const a=i*angle*Math.PI/180;const radial=center*.4+length*.23*Math.sqrt((i+.5)/Math.max(count,1));
    const petalLength=length*(.57+.43*Math.sqrt((i+4)/(Math.max(count,1)+4)))*goldenBoost;
    const petalWidth=width*(.75+.25*Math.sqrt((i+1)/Math.max(count,1)));
    ctx.save();ctx.rotate(a);ctx.translate(0,-radial);ctx.globalAlpha=visibility*(.44+.45*(i/drawCount));
    if(p>0&&count<45&&i%3===0){ctx.shadowColor='#d99b39';ctx.shadowBlur=Math.min(35,8+glow*23+p*18)}
    const grad=ctx.createLinearGradient(-petalWidth,0,petalWidth*.3,-petalLength);grad.addColorStop(0,'#6b3d16');grad.addColorStop(.33,'#b57624');grad.addColorStop(.67,'#e5af49');grad.addColorStop(1,'#f7d47c');ctx.fillStyle=grad;
    petalPath(ctx,petalLength,petalWidth);ctx.fill();ctx.shadowBlur=0;
    ctx.strokeStyle='rgba(255,221,146,.38)';ctx.lineWidth=.9;ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,-5);ctx.quadraticCurveTo(petalWidth*.13,-petalLength*.5,0,-petalLength*.92);ctx.strokeStyle='rgba(255,225,155,.18)';ctx.stroke();ctx.restore();
  }
  const cg=ctx.createRadialGradient(0,0,0,0,0,center*2.8);cg.addColorStop(0,`rgba(255,215,125,${.24+p*.16})`);cg.addColorStop(1,'rgba(255,185,66,0)');ctx.fillStyle=cg;ctx.beginPath();ctx.arc(0,0,center*2.8,0,TAU);ctx.fill();
  const centerGrad=ctx.createRadialGradient(-center*.22,-center*.25,1,0,0,center);centerGrad.addColorStop(0,'#f5ca6c');centerGrad.addColorStop(.5,'#b2752a');centerGrad.addColorStop(1,'#34200e');ctx.fillStyle=centerGrad;ctx.beginPath();ctx.arc(0,0,center,0,TAU);ctx.fill();ctx.strokeStyle='#f4c46b88';ctx.lineWidth=1;ctx.stroke();
  ctx.restore();
}

export function stepPetalMotion(state,dt){
  const motion=state.motion;if(!motion||motion.paused||motion.phase==='idle')return;
  if(motion.phase==='hold'){state.targetAngle=120;if(Math.abs(state.currentAngle-120)<.025&&Math.abs(state.angleVelocity)<.08)motion.elapsed+=dt;if(motion.elapsed>.38){motion.phase='advance';motion.elapsed=0;motion.from=120}return}
  motion.elapsed+=dt;
  const returning=motion.phase==='return',destination=returning?120:GOLDEN_ANGLE;
  const duration=returning?Math.min(1.1,state.duration*.45):state.duration;
  const fraction=clamp(motion.elapsed/Math.max(.15,duration),0,1);
  state.targetAngle=lerp(motion.from,destination,easeInOutCubic(fraction));
  if(fraction>=1&&Math.abs(state.currentAngle-destination)<.025&&Math.abs(state.angleVelocity)<.08){
    state.targetAngle=destination;
    if(returning){motion.phase='hold';motion.elapsed=0}else{motion.phase='idle';state.playing=false}
  }
}

export function createPetals({canvas,state,workspace,preview=false}){
  const surface=canvasSurface(canvas);let slider,status,overlay,runButton;
  let previewAngle=120,previewClock=0,wasGolden=false;
  function startDemo(){state.motion={phase:'return',elapsed:0,from:state.currentAngle,paused:false};state.playing=true;if(runButton)runButton.textContent='Run'}
  function run(){if(state.motion.paused&&state.motion.phase!=='idle'){state.motion.paused=false;state.playing=true;if(runButton)runButton.textContent='Run';return}state.motion={phase:'run',elapsed:0,from:state.currentAngle,paused:false};state.playing=true;if(runButton)runButton.textContent='Run'}
  function pause(){state.motion.paused=true;state.playing=false;if(runButton)runButton.textContent='Resume'}
  function reset(){state.motion={phase:'idle',elapsed:0,from:state.currentAngle,paused:false};state.targetAngle=120;state.playing=false;if(runButton)runButton.textContent='Run'}
  if(!preview){
    const panel=workspace.panel,primary=section('01 / Geometry');
    primary.append(numberControl('Petal Count',state.targetCount,1,100,1,v=>{state.targetCount=v;state.petalCount=v}).el);
    panel.append(primary);
    overlay=document.createElement('div');overlay.className='stage-angle-overlay';
    slider=angleSlider('Angle',state,{onTarget(){state.motion.phase='idle';state.motion.paused=false;state.playing=false;if(runButton)runButton.textContent='Run'}});
    overlay.append(slider.el);
    status=document.createElement('div');status.className='golden-status';overlay.append(status);
    workspace.stage.append(overlay);workspace.stage.classList.add('has-angle-control');
    const playback=section('02 / Motion');
    playback.append(rangeControl('Animation Duration',state.duration,.5,8,.1,v=>state.duration=v,v=>v.toFixed(1)+' s').el);
    const mainActions=actions([['Run',run,'primary'],['Pause',pause],['Reset',reset]]);
    runButton=mainActions.querySelector('button');runButton.textContent=state.motion.paused?'Resume':'Run';playback.append(mainActions);
    playback.append(actions([['Animate',startDemo,'primary'],['Replay',startDemo]]));
    panel.append(playback);
    const details=document.createElement('details');details.className='advanced-settings';
    details.innerHTML='<summary>Settings <span>FORM / LIGHT</span></summary>';
    const form=section('03 / Flower Form');
    form.append(rangeControl('Petal Length',state.petalLength,80,280,1,v=>state.petalLength=v,v=>v+' u').el);
    form.append(rangeControl('Petal Width',state.petalWidth,8,70,1,v=>state.petalWidth=v,v=>v+' u').el);
    form.append(rangeControl('Center Radius',state.centerRadius,5,35,1,v=>state.centerRadius=v,v=>v+' u').el);
    form.append(rangeControl('Glow Strength',state.glow,0,1,.01,v=>state.glow=v,v=>Math.round(v*100)+'%').el);
    form.append(rangeControl('Rotation Speed',state.speed,.1,3,.1,v=>state.speed=v,v=>v.toFixed(1)+'×').el);
    details.append(form);panel.append(details);
  }
  return {dispose(){overlay?.remove();workspace?.stage.classList.remove('has-angle-control')},update(dt,time){
    const {ctx,width:w,height:h}=surface.resize();if(w<2||h<2)return;
    let angle,count,rotation,glow,pulse;
    if(preview){previewClock+=dt;const phase=(previewClock%10)/10;const target=phase<.57?GOLDEN_ANGLE:120;previewAngle+=(target-previewAngle)*Math.min(1,dt*1.5);angle=previewAngle;count=15;rotation=time*.025;glow=.48;}
    else {
      stepPetalMotion(state,dt);
      if(!state.motion.paused){
        const next=smoothDamp(state.currentAngle,state.targetAngle,state.angleVelocity,reducedMotion?.08:.20,dt);
        state.currentAngle=next.value;state.angleVelocity=next.velocity;
        if(Math.abs(state.currentAngle-state.targetAngle)<.0003&&Math.abs(state.angleVelocity)<.003){state.currentAngle=state.targetAngle;state.angleVelocity=0;}
      }
      state.currentCount+= (state.targetCount-state.currentCount)*Math.min(1,dt*6);
      if(Math.abs(state.currentCount-state.targetCount)<.001)state.currentCount=state.targetCount;
      if(state.playing)state.rotation+=dt*.045*state.speed;
      angle=state.currentAngle;count=state.currentCount;rotation=state.rotation;glow=state.glow;
    }
    const proximity=Math.exp(-Math.pow(Math.abs(angle-GOLDEN_ANGLE)/5.5,2));
    if(preview)pulse=proximity*(.5+.5*Math.sin(time*2.8));
    else {const atGolden=proximity>.997;if(atGolden&&!wasGolden)state.goldenPulse=1;wasGolden=atGolden;state.goldenPulse*=Math.exp(-dt*3.2);pulse=proximity*state.goldenPulse;}
    clear(ctx,w,h);grid(ctx,w,h,preview?48:54);
    drawFlower(ctx,w,h,proximity,{count,angle,length:preview?180:state.petalLength,width:preview?35:state.petalWidth,center:preview?16:state.centerRadius,glow,rotation,pulse,preview});
    if(!preview){slider.update(proximity);status.textContent=Math.abs(angle-GOLDEN_ANGLE)<.055?'φ  GOLDEN ANGLE':`ANGLE / ${angle.toFixed(1)}°`;}
  }};
}
