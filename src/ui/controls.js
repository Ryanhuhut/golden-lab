import { clamp } from '../core/animation.js';

export function section(label) { const el=document.createElement('div'); el.className='control-section'; el.innerHTML=`<div class="section-label">${label}</div>`; return el; }
export function button(label, handler, className='') { const b=document.createElement('button'); b.type='button'; b.className=`button ${className}`; b.textContent=label; b.addEventListener('click',handler); return b; }
export function actions(items) { const row=document.createElement('div'); row.className='actions'; items.forEach(([label, fn, cls])=>row.append(button(label,fn,cls||''))); return row; }
export function numberControl(label, value, min, max, step, onChange, unit='') {
  const wrap=document.createElement('div'); wrap.className='control';
  const title=document.createElement('label'); title.className='control-label'; title.textContent=label;
  const row=document.createElement('div'); row.className='number-row';
  const minus=button('−',()=>commit(Number(input.value)-step),'square-button'); minus.setAttribute('aria-label',`Decrease ${label}`);
  const input=document.createElement('input'); input.type='number'; input.min=min; input.max=max; input.step=step; input.value=value; input.setAttribute('aria-label',label);
  const plus=button('+',()=>commit(Number(input.value)+step),'square-button'); plus.setAttribute('aria-label',`Increase ${label}`);
  const suffix=document.createElement('span'); suffix.className='unit'; suffix.textContent=unit;
  function commit(raw){const safe=Number.isFinite(raw)?raw:value; value=clamp(Math.round(safe/step)*step,min,max); input.value=step<1?value.toFixed(1):value; onChange(value);}
  input.addEventListener('change',()=>commit(Number(input.value))); input.addEventListener('blur',()=>commit(Number(input.value)));
  input.addEventListener('keydown',e=>{if(e.key==='Enter'){commit(Number(input.value));input.blur()}});
  row.append(minus,input,suffix,plus); wrap.append(title,row);
  return {el:wrap,set(v){value=v;input.value=step<1?v.toFixed(1):v}};
}
export function rangeControl(label,value,min,max,step,onChange,formatter=v=>String(v)) {
  const wrap=document.createElement('label'); wrap.className='control';
  const top=document.createElement('span'); top.className='control-top';
  const name=document.createElement('span'); name.className='control-label'; name.textContent=label;
  const readout=document.createElement('span'); readout.className='control-value'; readout.textContent=formatter(value);
  const input=document.createElement('input'); input.type='range'; input.min=min;input.max=max;input.step=step;input.value=value;input.setAttribute('aria-label',label);
  const showProgress=v=>input.style.setProperty('--range-percent',`${(v-min)/(max-min)*100}%`);
  showProgress(value);
  input.addEventListener('input',()=>{const v=clamp(Number(input.value),min,max);readout.textContent=formatter(v);showProgress(v);onChange(v)});
  top.append(name,readout);wrap.append(top,input);
  return {el:wrap,set(v){input.value=v;readout.textContent=formatter(v);showProgress(v)}};
}
export function toggleControl(label,value,onChange){
  const wrap=document.createElement('label'); wrap.className='toggle-control'; const text=document.createElement('span');text.textContent=label;
  const input=document.createElement('input');input.type='checkbox';input.checked=value;input.addEventListener('change',()=>onChange(input.checked));
  const slider=document.createElement('span');slider.className='toggle-track';wrap.append(text,input,slider);return {el:wrap,set(v){input.checked=v}};
}
