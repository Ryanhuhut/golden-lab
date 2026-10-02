import { loop, reducedMotion } from './core/animation.js';
import { state, DEBUG } from './state.js';
import { createOverview, experiments } from './ui/overview.js';
import { createWorkspace } from './ui/workspace.js';
import { createFibonacci } from './experiments/fibonacci.js';
import { createPhyllotaxis } from './experiments/phyllotaxis.js';
import { createPetals } from './experiments/petals.js';
import { createMechanics } from './experiments/mechanics.js';

const app=document.querySelector('#app');app.className='app-shell';
const overview=createOverview(open);const workspace=createWorkspace(close);app.append(overview.el,workspace.el);
const factories={fibonacci:createFibonacci,phyllotaxis:createPhyllotaxis,petals:createPetals,mechanics:createMechanics};
let activeInstance=null;let active=null,originCard=null,transitioning=false;
const previewInstances=Object.fromEntries(experiments.map(item=>[item.id,factories[item.id]({canvas:overview.canvases[item.id],state:state[item.id],preview:true})]));

function transition(card,forward,done){
  if(reducedMotion){done();return}
  const rect=card.getBoundingClientRect(),sheet=document.createElement('div');sheet.className='transition-rect';
  sheet.textContent=card.querySelector('h2')?.textContent||'GOLDEN LAB';
  const preview=card.querySelector('canvas');if(preview?.width)sheet.style.backgroundImage=`linear-gradient(180deg, transparent 35%, #050505 100%), url(${preview.toDataURL('image/png')})`;
  document.body.append(sheet);
  const start={left:`${rect.left}px`,top:`${rect.top}px`,width:`${rect.width}px`,height:`${rect.height}px`,borderRadius:'3px',opacity:1};
  const end={left:'0px',top:'0px',width:`${innerWidth}px`,height:`${innerHeight}px`,borderRadius:'0px',opacity:1};
  const anim=sheet.animate(forward?[start,end]:[end,start],{duration:forward?650:560,easing:'cubic-bezier(.19,.76,.25,1)',fill:'forwards'});
  anim.finished.finally(()=>{sheet.remove();done()});
}
function open(id,card){
  if(transitioning)return;transitioning=true;originCard=card;active=id;overview.el.classList.add('dimmed');
  workspace.setExperiment(id);
  activeInstance?.dispose?.();activeInstance=factories[id]({canvas:workspace.canvas,state:state[id],workspace});
  transition(card,true,()=>{workspace.el.classList.add('visible');workspace.el.setAttribute('aria-hidden','false');transitioning=false;workspace.el.querySelector('.back-button').focus({preventScroll:true});});
}
function close(){
  if(transitioning||!active)return;transitioning=true;workspace.el.classList.remove('visible');workspace.el.setAttribute('aria-hidden','true');
  const card=originCard;transition(card,false,()=>{activeInstance?.dispose?.();activeInstance=null;overview.el.classList.remove('dimmed');card.focus({preventScroll:true});active=null;transitioning=false;});
}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&active)close()});
let fps=60,debugEl=null;
if(DEBUG){debugEl=document.createElement('div');debugEl.className='debug';workspace.el.append(debugEl)}
loop((dt,time,frame)=>{
  fps += ((1/Math.max(dt,.001))-fps)*.04;
  if(!active&&frame%2===0)for(const instance of Object.values(previewInstances))instance.update(dt*2,time);
  if(active&&!transitioning)activeInstance?.update(dt,time);
  if(DEBUG&&active){const s=state[active];debugEl.textContent=`FPS ${fps.toFixed(0)}\n${active==='petals'||active==='phyllotaxis'?`ANGLE ${(s.currentAngle??s.angle).toFixed(3)}\nTARGET ${s.targetAngle.toFixed(3)}\nVELOCITY ${(s.angleVelocity??0).toFixed(3)}`:active==='mechanics'?`INDEX ${s.activeIndex}\nPOSITION ${s.position.toFixed(3)}\nVELOCITY ${s.velocity.toFixed(3)}`:`STEP ${s.progress.toFixed(2)}\nCAMERA ${activeInstance?.cameraScale?.toExponential(2)??''}`}`}
});
