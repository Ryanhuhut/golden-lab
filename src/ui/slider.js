import { GOLDEN_ANGLE, clamp } from '../core/animation.js';

export function angleSlider(label, state) {
  const root=document.createElement('div');root.className='angle-control';
  root.innerHTML=`<div class="control-top"><span class="control-label">${label}</span><span class="angle-readout">${(state.currentAngle??state.angle).toFixed(1)}°</span></div>
    <div class="angle-track-area"><div class="angle-track"><div class="angle-active"></div><div class="angle-thumb"></div></div><button type="button" class="golden-marker" aria-label="Animate to Golden Angle, 137.5 degrees"><span>φ</span></button></div>
    <div class="angle-endpoints"><span>0.0°</span><span class="golden-caption">137.5° · GOLDEN ANGLE</span><span>360.0°</span></div>`;
  const area=root.querySelector('.angle-track-area'), active=root.querySelector('.angle-active'), thumb=root.querySelector('.angle-thumb'), marker=root.querySelector('.golden-marker'), readout=root.querySelector('.angle-readout');
  marker.style.left=`${GOLDEN_ANGLE/360*100}%`;
  root.querySelector('.golden-caption').style.left=`${GOLDEN_ANGLE/360*100}%`;
  let dragging=false;
  function setFromPointer(e){const rect=area.getBoundingClientRect();state.targetAngle=Math.round(clamp((e.clientX-rect.left)/rect.width,0,1)*3600)/10;}
  area.addEventListener('pointerdown',e=>{if(e.target.closest('.golden-marker'))return;dragging=true;area.setPointerCapture(e.pointerId);setFromPointer(e)});
  area.addEventListener('pointermove',e=>{if(dragging)setFromPointer(e)});
  area.addEventListener('pointerup',()=>dragging=false);area.addEventListener('pointercancel',()=>dragging=false);
  marker.addEventListener('click',()=>state.targetAngle=GOLDEN_ANGLE);
  area.tabIndex=0;area.setAttribute('role','slider');area.setAttribute('aria-label',label);area.setAttribute('aria-valuemin','0');area.setAttribute('aria-valuemax','360');
  area.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowDown','ArrowRight','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();const d=(e.key==='ArrowRight'||e.key==='ArrowUp')?1:-1;state.targetAngle=e.key==='Home'?0:e.key==='End'?360:clamp(Math.round((state.targetAngle+d*.1)*10)/10,0,360)}});
  let wasGolden=false;root.addEventListener('animationend',()=>root.classList.remove('pulse'));
  return {el:root,update(glow){const value=state.currentAngle??state.angle;const pct=value/360*100;active.style.width=`${pct}%`;thumb.style.left=`${pct}%`;readout.textContent=`${value.toFixed(1)}°`;area.setAttribute('aria-valuenow',value.toFixed(1));area.setAttribute('aria-valuetext',`${value.toFixed(1)} degrees`);root.style.setProperty('--angle-glow',glow.toFixed(3));const atGolden=Math.abs(value-GOLDEN_ANGLE)<.055;root.classList.toggle('at-golden',atGolden);if(atGolden&&!wasGolden)root.classList.add('pulse');wasGolden=atGolden}};
}
