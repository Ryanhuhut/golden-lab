import { experiments } from './overview.js';
export function createWorkspace(back) {
  const root=document.createElement('section');root.className='workspace';root.setAttribute('aria-hidden','true');
  root.innerHTML=`<div class="workspace-frame"><div class="workspace-top"><button class="back-button" aria-label="Back to experiments"><span>←</span> BACK TO EXPERIMENTS</button><div class="workspace-counter">GOLDEN LAB / <span>01</span> OF 04</div></div><div class="workspace-body"><div class="stage"><canvas></canvas><span class="stage-top-label"></span><span class="stage-label">INTERACTIVE STUDY / GOLDEN LAB</span></div><aside class="control-panel"></aside></div></div>`;
  root.querySelector('.back-button').addEventListener('click',back);
  const body=root.querySelector('.workspace-body'),stage=root.querySelector('.stage'),panel=root.querySelector('.control-panel');
  return {el:root,body,stage,canvas:stage.querySelector('canvas'),panel,setExperiment(id){const item=experiments.find(x=>x.id===id);root.querySelector('.workspace-counter span').textContent=item.index;root.querySelector('.stage-top-label').textContent=`${item.index} / ${item.name.toUpperCase()}`;panel.innerHTML=`<div class="panel-kicker">EXPERIMENT ${item.index} / 04</div><h2 class="panel-title">${item.name}</h2><p class="panel-description">${item.description}</p>`;}};
}
