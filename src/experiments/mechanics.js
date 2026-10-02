import { clamp, smoothDamp, reducedMotion } from '../core/animation.js';
import { canvasSurface } from '../core/canvas.js';
import { actions, rangeControl, section } from '../ui/controls.js';

const MAX_INDEX=10000, SCALE=10n**40n, PHI_SCALED=16180339887498948482045868343656381177203n;
const cache=new Map([[0,0n],[1,1n],[2,1n]]);
function pair(n){if(n===0)return [0n,1n];const [a,b]=pair(Math.floor(n/2)),c=a*(2n*b-a),d=a*a+b*b;return n%2?[d,c+d]:[c,d]}
export function fib(n){if(n<0)return 0n;if(!cache.has(n)){cache.set(n,pair(n)[0]);if(cache.size>60)cache.delete(cache.keys().next().value)}return cache.get(n)}
function short(value,max=23){const s=String(value);return s.length<=max?s:`${s.slice(0,Math.ceil(max*.55))}…${s.slice(-Math.floor(max*.32))}`}
export function ratio(index){const numerator=fib(index),denominator=fib(index-1),scaled=numerator*SCALE/denominator;
  const digits=scaled.toString().padStart(41,'0'),decimal=`${digits.slice(0,-40)}.${digits.slice(-40,-28)}…`;
  const error=scaled>PHI_SCALED?scaled-PHI_SCALED:PHI_SCALED-scaled;
  const closeness=error===0n?1:clamp(1-(error.toString().length-1)/40,0,1);
  return {numerator,denominator,decimal,closeness};
}
function previewDraw(ctx,w,h,time){
  ctx.save();ctx.translate(w*.35,h*.47);const pos=9+(time*.32)%6;
  ctx.textAlign='center';ctx.textBaseline='middle';
  for(let k=-3;k<=3;k++){const index=Math.round(pos)+k;if(index<2)continue;const d=index-pos;ctx.globalAlpha=Math.max(0,1-Math.abs(d)*.25);ctx.fillStyle=Math.abs(d)<.5?'#f2ce78':'#a8a198';ctx.font=`${Math.round(24-Math.abs(d)*3)}px 'DM Mono',monospace`;ctx.fillText(short(fib(index),12),0,d*45)}
  ctx.globalAlpha=1;ctx.strokeStyle='#a7803a';ctx.beginPath();ctx.moveTo(-70,-24);ctx.lineTo(70,-24);ctx.moveTo(-70,24);ctx.lineTo(70,24);ctx.stroke();ctx.restore();
  ctx.save();ctx.translate(w*.73,h*.46);ctx.textAlign='center';ctx.fillStyle='#a49a86';ctx.font="12px 'DM Mono',monospace";ctx.fillText('Fₙ / Fₙ₋₁',0,-25);ctx.fillStyle='#f1c66a';ctx.font="22px 'DM Mono',monospace";ctx.fillText('1.618…',0,11);ctx.fillStyle='#786b52';ctx.font="11px 'DM Mono',monospace";ctx.fillText('→ φ',0,37);ctx.restore();
}
function equationValue(text,maxLength=26){
  const value=document.createElement('span');
  value.className='reel-value';value.textContent=short(text,maxLength);value.title=text;
  return value;
}
function slotCapacity(slot){return Math.max(8,Math.min(26,Math.floor((slot.clientWidth-8)/(11*.61))))}
function animateEquation(stage,slots,values,direction){
  const travel=direction>=0?-1:1;
  const duration=reducedMotion?110:440;
  slots.forEach((slot,i)=>{
    const prior=slot.lastElementChild;
    const incoming=equationValue(values[i],slotCapacity(slot));
    if(!prior){slot.replaceChildren(incoming);return}
    const previousTransform=getComputedStyle(prior).transform;
    const previousOpacity=getComputedStyle(prior).opacity;
    prior.getAnimations().forEach(animation=>animation.cancel());
    const generation=String(Number(slot.dataset.generation||0)+1);
    slot.dataset.generation=generation;
    slot.replaceChildren(prior,incoming);
    const outgoing=prior.animate([
      {transform:previousTransform==='none'?'translateY(0)':previousTransform,opacity:previousOpacity},
      {transform:'translateY('+(travel*100)+'%)',opacity:.2}
    ],{duration,easing:'cubic-bezier(.25,.75,.25,1)',fill:'forwards'});
    const arriving=incoming.animate([
      {transform:'translateY('+(-travel*100)+'%)',opacity:.2},
      {transform:'translateY(0)',opacity:1}
    ],{duration,easing:'cubic-bezier(.25,.75,.25,1)',fill:'forwards'});
    Promise.allSettled([outgoing.finished,arriving.finished]).then(()=>{
      if(slot.dataset.generation===generation)slot.replaceChildren(incoming);
    });
  });
}
export function createMechanics({canvas,state,workspace,preview=false}){
  if(preview){const surface=canvasSurface(canvas);return {update(dt,time){const {ctx,width:w,height:h}=surface.resize();if(w>1&&h>1){surface.background(w,h,46);previewDraw(ctx,w,h,time)}}}}
  const body=workspace.body;body.classList.add('mechanics-body');
  const panel=workspace.panel,stage=document.createElement('div');stage.className='mechanics-stage';
  stage.innerHTML=`<div class="mechanics-roller-section"><div><h3>01 / THE SEQUENCE</h3><div class="wheel-wrap" tabindex="0" role="slider" aria-label="Fibonacci number wheel" aria-valuemin="2" aria-valuemax="10000"><div class="wheel-items"></div><div class="wheel-center"></div></div></div><div class="ratio-display"><div class="ratio-label">CONSECUTIVE RATIO</div><div class="ratio-fraction"></div><div class="ratio-value"></div><div class="phi-reference">φ ≈ 1.6180339887…</div><div class="ratio-note">The ratio converges toward φ. Every finite ratio remains an approximation.</div></div></div><div class="recurrence-section"><h3>02 / THE RECURRENCE</h3><div class="equation-stage"><span class="eq-slot result"></span><span class="eq-operator">=</span><span class="eq-slot previous"></span><span class="eq-operator">+</span><span class="eq-slot before"></span></div><div class="recurrence-caption">Fₙ = Fₙ₋₁ + Fₙ₋₂</div></div>`;
  body.insertBefore(stage,panel);const wheel=stage.querySelector('.wheel-wrap'),items=stage.querySelector('.wheel-items');
  const itemEls=Array.from({length:9},()=>{const el=document.createElement('div');el.className='wheel-item';items.append(el);return el});
  const fraction=stage.querySelector('.ratio-fraction'),value=stage.querySelector('.ratio-value'),display=stage.querySelector('.ratio-display'),slots=[...stage.querySelectorAll('.eq-slot')],equation=stage.querySelector('.equation-stage');
  let lastEquationWidth=0;
  function fitNumbers(){
    const width=equation.clientWidth;if(!width)return;
    lastEquationWidth=width;
    slots.forEach(slot=>{
      if(slot.children.length===1)slot.firstElementChild.textContent=short(slot.title,slotCapacity(slot));
      const digits=slot.lastElementChild?.textContent.length||1;
      const available=Math.max(1,slot.clientWidth-8);
      slot.style.setProperty('--eq-font',`${Math.max(11,Math.min(54,available/(Math.max(1,digits)*.61)))}px`);
    });
    const fractionLength=fraction.textContent.length;
    fraction.style.fontSize=`${Math.max(16,Math.min(44,(display.clientWidth-38)/(Math.max(1,fractionLength)*.59)))}px`;
    const leading=value.querySelector('.ratio-leading')?.textContent.length||0;
    const tail=value.querySelector('.ratio-tail')?.textContent.length||0;
    value.style.fontSize=`${Math.max(22,Math.min(58,(display.clientWidth-38)/(Math.max(1,leading+tail*.52)*.58)))}px`;
  }
  const controls=section('01 / Roller');controls.append(rangeControl('Auto Roll Speed',state.speed,.2,3,.1,v=>state.speed=v,v=>`${v.toFixed(1)}×`).el);panel.append(controls);
  const playback=section('02 / Playback');playback.append(actions([['Play',()=>{state.playing=true;state.autoTimer=0},'primary'],['Pause',()=>state.playing=false],['Reset',()=>{state.playing=false;state.position=11;state.velocity=0;state.activeIndex=11;refresh(true)}]]));panel.append(playback);
  const hint=document.createElement('p');hint.className='panel-description';hint.textContent='Drag, swipe, scroll, or use the arrow keys. The wheel keeps its momentum and settles on an exact Fibonacci term.';panel.append(hint);
  const events=new AbortController();let dragging=false,lastY=0,lastTime=0;
  function manual(){state.manualUntil=performance.now()/1000+2.2;state.autoTimer=0}
  wheel.addEventListener('wheel',e=>{e.preventDefault();manual();state.velocity=clamp(state.velocity+e.deltaY*.04,-42,42)},{passive:false,signal:events.signal});
  wheel.addEventListener('pointerdown',e=>{dragging=true;manual();state.velocity=0;lastY=e.clientY;lastTime=performance.now();wheel.setPointerCapture(e.pointerId)},{signal:events.signal});
  wheel.addEventListener('pointermove',e=>{if(!dragging)return;const now=performance.now(),dy=e.clientY-lastY,dt=Math.max(.008,(now-lastTime)/1000);state.position=clamp(state.position-dy/55,2,MAX_INDEX);state.velocity=clamp(-dy/55/dt,-35,35);lastY=e.clientY;lastTime=now},{signal:events.signal});
  wheel.addEventListener('pointerup',()=>{dragging=false;if(performance.now()-lastTime>85)state.velocity*=.22},{signal:events.signal});wheel.addEventListener('pointercancel',()=>dragging=false,{signal:events.signal});
  wheel.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End'].includes(e.key)){e.preventDefault();manual();const change=e.key==='ArrowUp'?-1:e.key==='ArrowDown'?1:e.key==='PageUp'?-5:5;state.velocity=0;state.position=clamp(e.key==='Home'?2:e.key==='End'?MAX_INDEX:Math.round(state.position)+change,2,MAX_INDEX);refresh()}},{signal:events.signal});
  function refresh(force=false){const index=clamp(Math.round(state.position),2,MAX_INDEX);if(!force&&index===state.activeIndex)return;
    const direction=index-state.activeIndex;state.activeIndex=index;const data=ratio(index);
    fraction.textContent=`${short(data.numerator,32)} / ${short(data.denominator,32)}`;fraction.title=`${data.numerator} / ${data.denominator}`;
    const leading=document.createElement('span'),tail=document.createElement('span');
    leading.className='ratio-leading';tail.className='ratio-tail';
    leading.textContent=data.decimal.slice(0,7);tail.textContent=data.decimal.slice(7);
    value.replaceChildren(leading,tail);value.title=data.decimal;
    display.style.setProperty('--ratio-glow',data.closeness.toFixed(3));
    const values=[fib(index),fib(index-1),fib(index-2)].map(String);
    if(force||!slots[0].textContent)slots.forEach((el,i)=>el.replaceChildren(equationValue(values[i],slotCapacity(el))));else animateEquation(equation,slots,values,direction);
    slots.forEach((el,i)=>el.title=values[i]);fitNumbers();wheel.setAttribute('aria-valuenow',String(index));wheel.setAttribute('aria-valuetext',`Fibonacci term ${index}: ${short(data.numerator,18)}`);
  }
  refresh(true);
  return {dispose(){events.abort();stage.remove();body.classList.remove('mechanics-body')},update(dt,time){
    if(!dragging){
      const physicsDt=Math.min(dt,.05);
      if(state.playing&&time>state.manualUntil&&Math.abs(state.velocity)<.2){state.autoTimer+=dt*state.speed;if(state.autoTimer>=1.18){state.autoTimer%=1.18;state.velocity=3.3}}
      if(Math.abs(state.velocity)>.55){const decay=Math.exp(-3.25*physicsDt);state.position+=state.velocity*(1-decay)/3.25;state.velocity*=decay}
      else {const target=Math.round(state.position),next=smoothDamp(state.position,target,state.velocity,reducedMotion?.07:.23,physicsDt);state.position=next.value;state.velocity=next.velocity;if(Math.abs(state.position-target)<.0001&&Math.abs(state.velocity)<.001){state.position=target;state.velocity=0}}
      state.position=clamp(state.position,2,MAX_INDEX);if(state.position===2||state.position===MAX_INDEX)state.velocity=0;
    }
    refresh();if(equation.clientWidth!==lastEquationWidth)fitNumbers();const nearest=Math.round(state.position);
    for(let j=-4;j<=4;j++){const el=itemEls[j+4],index=nearest+j;if(index<2||index>MAX_INDEX){el.style.display='none';continue}el.style.display='flex';
      const d=index-state.position,abs=Math.abs(d);if(el.dataset.index!==String(index)){const term=fib(index);el.textContent=short(term,23);el.title=term.toString();el.dataset.index=String(index)}el.classList.toggle('active',index===state.activeIndex);
      el.style.transform=`translateY(calc(-50% + ${d*54}px)) scale(${Math.max(.58,1-abs*.105)}) rotateX(${d*-5}deg)`;el.style.opacity=String(Math.max(0,1-abs*.22));el.style.filter='blur('+Math.max(0,abs-.35)*.38+'px)';
    }
  }};
}
