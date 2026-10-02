import { smoothDamp } from './animation.js';

const appearance={value:5,velocity:0,target:5,mode:'graphite',lastTone:5};
export function setAppearance(mode){
  appearance.mode=mode==='true-black'?'true-black':'graphite';
  appearance.target=appearance.mode==='true-black'?0:5;
  document.documentElement.dataset.appearance=appearance.mode;
}
export function updateAppearance(dt){
  const next=smoothDamp(appearance.value,appearance.target,appearance.velocity,.28,dt);
  appearance.value=next.value;appearance.velocity=next.velocity;
  if(Math.abs(appearance.value-appearance.target)<.005){appearance.value=appearance.target;appearance.velocity=0}
  const tone=Math.round(appearance.value);
  if(tone!==appearance.lastTone){document.documentElement.style.setProperty('--bg',`rgb(${tone}, ${tone}, ${tone})`);appearance.lastTone=tone}
}
export function canvasBackground(){const tone=Math.round(appearance.value);return `rgb(${tone}, ${tone}, ${tone})`}
export function appearanceMode(){return appearance.mode}
