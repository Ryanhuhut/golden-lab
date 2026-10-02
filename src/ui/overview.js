export const experiments = [
  {id:'fibonacci',index:'01',name:'Fibonacci Growth',description:'A sequence becomes a living structure.',symbol:'𝑭'},
  {id:'phyllotaxis',index:'02',name:'Golden Phyllotaxis',description:'Order emerging from a single angle.',symbol:'φ'},
  {id:'petals',index:'03',name:'Golden Petals',description:'A flower shaped by rotation.',symbol:'✳'},
  {id:'mechanics',index:'04',name:'Fibonacci Mechanics',description:'A sequence tending toward φ.',symbol:'∞'}
];
export function createOverview(open) {
  const overview=document.createElement('main');overview.className='overview';overview.innerHTML=`
    <header class="topline"><div class="brand">GOLDEN <span>LAB</span></div><div>INTERACTIVE MATHEMATICS / VOL. 01</div></header>
    <section class="hero"><div><div class="eyebrow">A visual laboratory of proportion</div><h1>Numbers<br>in <em>motion.</em></h1></div><p>Four experiments. One recurring idea. Explore the structures that emerge when a simple rule is allowed to move.</p></section>
    <div class="gallery-head"><span>SELECT AN EXPERIMENT</span><span>01 — 04</span></div><div class="gallery"></div>
    <footer class="footer"><span>GOLDEN LAB / EST. 2026</span><span>SCROLL · SELECT · EXPLORE</span></footer>`;
  const gallery=overview.querySelector('.gallery');const canvases={};
  for(const item of experiments){const card=document.createElement('button');card.className='experiment-card';card.type='button';card.setAttribute('aria-label',`Open ${item.name}`);card.innerHTML=`<canvas class="card-canvas" aria-hidden="true"></canvas><span class="card-index">EXPERIMENT ${item.index}</span><span class="card-symbol">${item.symbol}</span><span class="card-info"><span><h2>${item.name}</h2><p>${item.description}</p></span><span class="open-hint">OPEN EXPERIMENT <span>↗</span></span></span>`;card.addEventListener('click',()=>open(item.id,card));gallery.append(card);canvases[item.id]=card.querySelector('canvas');}
  return {el:overview,canvases};
}
