import { loop, reducedMotion } from './core/animation.js';
import { state, DEBUG } from './state.js';
import { createOverview, experiments } from './ui/overview.js';
import { createWorkspace } from './ui/workspace.js';
import { createPascalHero } from './ui/pascal.js';
import { createFibonacci } from './experiments/fibonacci.js';
import { createPhyllotaxis } from './experiments/phyllotaxis.js';
import { createPetals } from './experiments/petals.js';
import { createMechanics } from './experiments/mechanics.js';
import { setAppearance, updateAppearance, appearanceMode, canvasBackground } from './core/theme.js';

const app=document.querySelector('#app');app.className='app-shell';
const overview=createOverview(open);const workspace=createWorkspace(close);app.append(overview.el,workspace.el);
const factories={fibonacci:createFibonacci,phyllotaxis:createPhyllotaxis,petals:createPetals,mechanics:createMechanics};
let activeInstance=null;let active=null,originCard=null,transitioning=false;
const previewInstances=Object.fromEntries(experiments.map(item=>[item.id,factories[item.id]({canvas:overview.canvases[item.id],state:state[item.id],preview:true})]));
const previews=Object.values(previewInstances);
const pascal=createPascalHero(overview.pascalRegion,overview.pascalCanvas);
for(const control of document.querySelectorAll('[data-appearance-toggle]')){
  control.addEventListener('click',()=>{
    state.appearance=appearanceMode()==='graphite'?'true-black':'graphite';
    setAppearance(state.appearance);
    syncAppearance();
  });
}
function syncAppearance(){
  for(const control of document.querySelectorAll('[data-appearance-toggle]')){
    const black=appearanceMode()==='true-black';
    control.querySelector('span').textContent=black?'TRUE BLACK':'GRAPHITE';
    control.setAttribute('aria-label',`Switch to ${black?'Graphite':'True Black'} background`);
    control.setAttribute('aria-pressed',String(black));
  }
}
syncAppearance();

function transitionSheet(card){
  const rect=card.getBoundingClientRect(),sheet=document.createElement('div');sheet.className='transition-rect';
  sheet.textContent=card.querySelector('h2')?.textContent||'GOLDEN LAB';
  const preview=card.querySelector('canvas');
  if(preview?.width)try{sheet.style.backgroundImage=`linear-gradient(180deg, transparent 35%, ${canvasBackground()} 100%), url(${preview.toDataURL('image/png')})`}catch{sheet.style.backgroundColor=canvasBackground()}
  document.body.append(sheet);
  const start={left:`${rect.left}px`,top:`${rect.top}px`,width:`${rect.width}px`,height:`${rect.height}px`,borderRadius:'3px',fontSize:getComputedStyle(card.querySelector('h2')).fontSize,opacity:1};
  const end={left:'0px',top:'0px',width:`${innerWidth}px`,height:`${innerHeight}px`,borderRadius:'0px',fontSize:`${Math.min(65,innerWidth*.045)}px`,opacity:1};
  return {sheet,start,end};
}
function open(id,card){
  if(transitioning)return;transitioning=true;originCard=card;active=id;overview.el.classList.add('dimmed');
  workspace.setExperiment(id);
  activeInstance?.dispose?.();activeInstance=factories[id]({canvas:workspace.canvas,state:state[id],workspace});
  document.body.classList.add('workspace-open');
  workspace.el.classList.add('visible','is-opening');
  workspace.el.style.pointerEvents='none';
  workspace.el.setAttribute('aria-hidden','false');
  if(reducedMotion){workspace.el.classList.remove('is-opening');workspace.el.style.pointerEvents='';transitioning=false;workspace.el.querySelector('.back-button').focus({preventScroll:true});return}
  const {sheet,start,end}=transitionSheet(card),duration=720;
  const sheetAnimation=sheet.animate([start,{...end,opacity:1,offset:.67},{...end,opacity:0,offset:1}],{duration,easing:'cubic-bezier(.19,.76,.25,1)',fill:'forwards'});
  const workspaceAnimation=workspace.el.animate([{opacity:0,offset:0},{opacity:0,offset:.66},{opacity:1,offset:1}],{duration,easing:'ease-out',fill:'forwards'});
  const panelAnimation=workspace.panel.animate([{opacity:0,transform:'translateX(18px)'},{opacity:1,transform:'translateX(0)'}],{duration:duration*.35,delay:duration*.65,easing:'cubic-bezier(.2,.8,.2,1)',fill:'both'});
  Promise.all([sheetAnimation.finished,workspaceAnimation.finished,panelAnimation.finished]).then(()=>{
    sheetAnimation.cancel();workspaceAnimation.cancel();panelAnimation.cancel();sheet.remove();workspace.el.classList.remove('is-opening');workspace.el.style.pointerEvents='';transitioning=false;
    workspace.el.querySelector('.back-button').focus({preventScroll:true});
  }).catch(()=>{sheet.remove();workspace.el.classList.remove('is-opening');workspace.el.style.pointerEvents='';transitioning=false});
}
function close(){
  if(transitioning||!active)return;transitioning=true;workspace.el.classList.add('is-closing');workspace.el.style.pointerEvents='none';
  const card=originCard;
  const finish=()=>{activeInstance?.dispose?.();activeInstance=null;workspace.el.classList.remove('visible','is-closing');workspace.el.style.pointerEvents='';workspace.el.setAttribute('aria-hidden','true');document.body.classList.remove('workspace-open');overview.el.classList.remove('dimmed');card.focus({preventScroll:true});active=null;transitioning=false};
  if(reducedMotion){finish();return}
  const {sheet,start,end}=transitionSheet(card),duration=620;
  sheet.style.opacity='0';
  const sheetAnimation=sheet.animate([{...end,opacity:0,offset:0},{...end,opacity:1,offset:.28},start],{duration,easing:'cubic-bezier(.19,.76,.25,1)',fill:'forwards'});
  const workspaceAnimation=workspace.el.animate([{opacity:1,offset:0},{opacity:1,offset:.22},{opacity:0,offset:.72},{opacity:0,offset:1}],{duration,easing:'ease-in',fill:'forwards'});
  setTimeout(()=>overview.el.classList.remove('dimmed'),duration*.44);
  Promise.all([sheetAnimation.finished,workspaceAnimation.finished]).then(()=>{sheetAnimation.cancel();workspaceAnimation.cancel();sheet.remove();finish()}).catch(()=>{sheet.remove();finish()});
}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&active)close()});
let fps=60,debugEl=null;
if(DEBUG){debugEl=document.createElement('div');debugEl.className='debug';workspace.el.append(debugEl)}
loop((dt,time)=>{
  updateAppearance(dt);
  fps += ((1/Math.max(dt,.001))-fps)*.04;
  if(!active){pascal.update(dt);for(const instance of previews)instance.update(dt,time)}
  if(active&&workspace.el.classList.contains('visible'))activeInstance?.update(dt,time);
  if(DEBUG&&active){const s=state[active];debugEl.textContent=`FPS ${fps.toFixed(0)}\n${active==='petals'||active==='phyllotaxis'?`ANGLE ${(s.currentAngle??s.angle).toFixed(3)}\nTARGET ${s.targetAngle.toFixed(3)}\nVELOCITY ${(s.angleVelocity??0).toFixed(3)}`:active==='mechanics'?`INDEX ${s.activeIndex}\nPOSITION ${s.position.toFixed(3)}\nVELOCITY ${s.velocity.toFixed(3)}`:`STEP ${s.progress.toFixed(2)}\nCAMERA ${activeInstance?.cameraScale?.toExponential(2)??''}`}`}
});
