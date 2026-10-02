import { GOLDEN_ANGLE, clamp } from '../core/animation.js';

export function angleSlider(label, state, options={}) {
  const root=document.createElement('div');root.className='angle-control';
  root.innerHTML=`<div class="control-top"><span class="control-label">${label}</span><span class="angle-readout">${(state.currentAngle??state.angle).toFixed(1)}°</span></div>
    <div class="angle-track-area"><div class="angle-scale"><div class="angle-track"><div class="angle-active"></div></div><div class="angle-thumb"></div><button type="button" class="golden-marker" aria-label="Animate to Golden Angle, 137.5 degrees"><span>φ</span></button><span class="angle-tick tick-start" aria-hidden="true"></span><span class="angle-tick tick-end" aria-hidden="true"></span><span class="angle-mark-label mark-start">0.0°</span><span class="angle-mark-label golden-caption"><strong>137.5°</strong><small>GOLDEN ANGLE</small></span><span class="angle-mark-label mark-end">360.0°</span></div></div>`;
  const area=root.querySelector('.angle-track-area'), scale=root.querySelector('.angle-scale'), active=root.querySelector('.angle-active'), thumb=root.querySelector('.angle-thumb'), marker=root.querySelector('.golden-marker'), readout=root.querySelector('.angle-readout');
  marker.style.left=`${GOLDEN_ANGLE/360*100}%`;
  root.querySelector('.golden-caption').style.left=`${GOLDEN_ANGLE/360*100}%`;
  let dragging=false;
  function setTarget(value){state.targetAngle=clamp(Math.round(value*10)/10,0,360);options.onTarget?.(state.targetAngle)}
  function setFromPointer(e){const rect=scale.getBoundingClientRect();if(rect.width>0)setTarget((e.clientX-rect.left)/rect.width*360)}
  area.addEventListener('pointerdown',e=>{if(e.target.closest('.golden-marker'))return;dragging=true;area.setPointerCapture(e.pointerId);setFromPointer(e)});
  area.addEventListener('pointermove',e=>{if(dragging)setFromPointer(e)});
  area.addEventListener('pointerup',()=>{dragging=false;if(Math.abs(state.targetAngle-GOLDEN_ANGLE)<.45)setTarget(GOLDEN_ANGLE)});area.addEventListener('pointercancel',()=>dragging=false);
  marker.addEventListener('click',()=>setTarget(GOLDEN_ANGLE));
  area.tabIndex=0;area.setAttribute('role','slider');area.setAttribute('aria-label',label);area.setAttribute('aria-valuemin','0');area.setAttribute('aria-valuemax','360');
  area.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowDown','ArrowRight','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();const d=(e.key==='ArrowRight'||e.key==='ArrowUp')?1:-1;setTarget(e.key==='Home'?0:e.key==='End'?360:state.targetAngle+d*.1)}});
  let wasGolden=false;root.addEventListener('animationend',()=>root.classList.remove('pulse'));
  return {el:root,update(glow){const value=state.currentAngle??state.angle;const pct=value/360*100;active.style.width=`${pct}%`;thumb.style.left=`${pct}%`;readout.textContent=`${value.toFixed(1)}°`;area.setAttribute('aria-valuenow',value.toFixed(1));area.setAttribute('aria-valuetext',`${value.toFixed(1)} degrees`);root.style.setProperty('--angle-glow',glow.toFixed(3));const atGolden=Math.abs(value-GOLDEN_ANGLE)<.055;root.classList.toggle('at-golden',atGolden);if(atGolden&&!wasGolden)root.classList.add('pulse');wasGolden=atGolden}};
}
