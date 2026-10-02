import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.matchMedia = () => ({matches:false});
const [{buildSquares,arcData},{phyllotaxisPoint},{fib,ratio},{smoothDamp,GOLDEN_ANGLE},{pascalRows,isOddPascal,pascalCameraScale,PASCAL_SEQUENCE_DURATION,createPascalHero},{stepPetalMotion,presentationMotion}] = await Promise.all([
  import('../src/experiments/fibonacci.js'),
  import('../src/experiments/phyllotaxis.js'),
  import('../src/experiments/mechanics.js'),
  import('../src/core/animation.js'),
  import('../src/ui/pascal.js'),
  import('../src/experiments/petals.js')
]);
const {setAppearance,updateAppearance,canvasBackground}=await import('../src/core/theme.js');

test('Fibonacci squares follow the sequence and stay adjacent',()=>{
  const squares=buildSquares(100);
  assert.equal(squares.length,100);
  assert.deepEqual(squares.slice(0,8).map(s=>s.value),[1n,1n,2n,3n,5n,8n,13n,21n]);
  assert.deepEqual(squares.slice(0,5).map(s=>s.dir),['seed','right','up','left','down']);
  for(let i=2;i<30;i++)assert.equal(squares[i].value,squares[i-1].value+squares[i-2].value);
  assert.ok(Number.isFinite(squares[99].x)&&Number.isFinite(squares[99].size));
});
test('spiral arcs join with matching positions and tangents in both directions',()=>{
  const squares=buildSquares(30);
  for(const mirror of [1,-1])for(let i=0;i<squares.length-1;i++){
    const a=arcData(squares[i]),b=arcData(squares[i+1]);
    const end=[mirror*(a.cx+squares[i].size*Math.cos(a.end)),a.cy+squares[i].size*Math.sin(a.end)];
    const start=[mirror*(b.cx+squares[i+1].size*Math.cos(b.start)),b.cy+squares[i+1].size*Math.sin(b.start)];
    assert.ok(Math.hypot(end[0]-start[0],end[1]-start[1])<1e-7);
    const tangentA=[mirror*Math.sin(a.end),-Math.cos(a.end)];
    const tangentB=[mirror*Math.sin(b.start),-Math.cos(b.start)];
    assert.ok(Math.hypot(tangentA[0]-tangentB[0],tangentA[1]-tangentB[1])<1e-7);
  }
});
test('Pascal coefficients and parity produce Sierpiński structure',()=>{
  assert.deepEqual(pascalRows(6)[5],[1,5,10,10,5,1]);
  for(let n=0;n<32;n++)for(let k=0;k<=n;k++){
    if(n<6)assert.equal(isOddPascal(n,k),pascalRows(6)[n][k]%2===1);
  }
  assert.equal(isOddPascal(7,3),true);
  assert.equal(isOddPascal(8,3),false);
  assert.equal(isOddPascal(512,1),false);
  assert.equal(isOddPascal(512,512),true);
  assert.equal(isOddPascal(1023,511),true);
});
test('Pascal camera stays at the original scale, then accelerates outward to reveal 512+ rows',()=>{
  assert.equal(pascalCameraScale(2.15),1);
  const samples=[2.15,3.15,4.15,5.15,6.15,PASCAL_SEQUENCE_DURATION].map(pascalCameraScale);
  for(let i=1;i<samples.length;i++)assert.ok(samples[i]<samples[i-1]);
  const logTravel=samples.slice(1).map((scale,i)=>Math.log(samples[i]/samples[i+1]));
  for(let i=1;i<logTravel.length;i++)assert.ok(logTravel[i]>logTravel[i-1]);
  const visibleRows=(235-(235-23*9)/2)/(23*samples.at(-1));
  assert.ok(visibleRows>512);
});
test('Pascal renderer keeps one apex and reveals cached row bands through the same camera',()=>{
  const previousWindow=globalThis.window,previousOffscreen=globalThis.OffscreenCanvas;
  globalThis.window={devicePixelRatio:1};
  const calls=[];
  const context={setTransform(){},save(){},restore(){},translate(x,y){calls.push(['apex',x,y])},scale(x){calls.push(['scale',x])},beginPath(){},moveTo(){},lineTo(){},stroke(){},fillRect(){},strokeRect(){},fillText(){},drawImage(){calls.push(['band'])}};
  globalThis.OffscreenCanvas=class {constructor(width,height){this.width=width;this.height=height}getContext(){return {setTransform(){},fillRect(){}}}};
  const canvas={width:0,height:0,getBoundingClientRect(){return {width:360,height:235}},getContext(){return context}};
  const hero=createPascalHero(null,canvas,{interactive:false});
  const drawAt=time=>{calls.length=0;hero.seek(time);hero.update(0);return {apex:calls.find(x=>x[0]==='apex'),scale:calls.find(x=>x[0]==='scale')?.[1],bands:calls.filter(x=>x[0]==='band').length}};
  const initial=drawAt(0),near=drawAt(2.7),far=drawAt(PASCAL_SEQUENCE_DURATION),restored=drawAt(0);
  assert.deepEqual(initial.apex,['apex',180,18.5]);
  assert.deepEqual(near.apex,initial.apex);assert.deepEqual(far.apex,initial.apex);
  assert.equal(initial.bands,0);assert.ok(near.bands>0);assert.equal(far.bands,3);assert.equal(restored.bands,0);
  assert.ok(far.scale<near.scale);assert.equal(restored.scale,1);
  hero.setTarget(true);
  for(let i=0;i<330;i++){calls.length=0;hero.update(1/60)}
  const beforeReverse=calls.find(x=>x[0]==='scale')[1];
  hero.setTarget(false);calls.length=0;hero.update(1/60);
  const afterReverse=calls.find(x=>x[0]==='scale')[1];
  assert.ok(Math.abs(afterReverse-beforeReverse)<.01);
  for(let i=0;i<500;i++){calls.length=0;hero.update(1/60)}
  assert.equal(hero.time,0);assert.equal(hero.cameraScale,1);
  globalThis.window=previousWindow;globalThis.OffscreenCanvas=previousOffscreen;
});
test('phyllotaxis uses the golden angle formula',()=>{
  const p=phyllotaxisPoint(100,GOLDEN_ANGLE,7.5);
  const theta=100*GOLDEN_ANGLE*Math.PI/180;
  assert.ok(Math.abs(p.x-75*Math.cos(theta))<1e-10);
  assert.ok(Math.abs(p.y-75*Math.sin(theta))<1e-10);
});
test('BigInt recurrence and scaled ratio work at large indices',()=>{
  assert.equal(fib(11),89n);
  assert.equal(ratio(11).decimal,'1.618181818181…');
  assert.equal(fib(10000),fib(9999)+fib(9998));
  assert.ok(ratio(10000).decimal.startsWith('1.618033988749'));
  assert.ok(ratio(100).closeness>ratio(11).closeness);
});
test('damped angle converges without overshoot',()=>{
  let value=120,velocity=0;
  for(let i=0;i<300;i++){const next=smoothDamp(value,GOLDEN_ANGLE,velocity,.33,1/60);value=next.value;velocity=next.velocity;assert.ok(value<=GOLDEN_ANGLE+1e-7)}
  assert.ok(Math.abs(value-GOLDEN_ANGLE)<1e-5);
});
test('petal run and long presentation keep a calm cadence and exact destination',()=>{
  const dt=1/120;
  const s={currentAngle:200,targetAngle:200,angleVelocity:0,duration:10,motion:{phase:'run',elapsed:0,from:200,duration:10,paused:false},playing:true};
  for(let i=0;i<1200;i++)stepPetalMotion(s,dt);
  assert.equal(s.motion.phase,'idle');assert.equal(s.currentAngle,GOLDEN_ANGLE);
  s.duration=20;s.motion=presentationMotion(s.currentAngle,s.duration);s.playing=true;
  let sawReturn=false,sawAdvance=false,advanceStarted=0;
  for(let i=0;i<2700;i++){
    stepPetalMotion(s,dt);
    if(s.motion.phase==='hold')sawReturn=true;
    if(s.motion.phase==='advance'&&!sawAdvance){sawAdvance=true;advanceStarted=i}
    if(i===advanceStarted+240&&sawAdvance){
      const angle=s.currentAngle;s.motion.paused=true;
      for(let j=0;j<120;j++)stepPetalMotion(s,dt);
      assert.equal(s.currentAngle,angle);s.motion.paused=false;
    }
  }
  assert.equal(sawReturn,true);assert.equal(sawAdvance,true);
  assert.equal(s.motion.phase,'idle');assert.equal(s.currentAngle,GOLDEN_ANGLE);
  const calm={currentAngle:120,targetAngle:120,angleVelocity:0,duration:20,motion:presentationMotion(120,20),playing:true};
  const samples=[];
  for(let i=0;i<2400;i++){stepPetalMotion(calm,dt);if([600,1200,1800].includes(i))samples.push(calm.currentAngle)}
  assert.ok(Math.abs((samples[1]-samples[0])-(samples[2]-samples[1]))<.2);
  assert.equal(calm.currentAngle,GOLDEN_ANGLE);
});
test('appearance eases from graphite to true black and back',()=>{
  const previous=globalThis.document;
  globalThis.document={documentElement:{dataset:{},style:{setProperty(){}}}};
  setAppearance('true-black');for(let i=0;i<180;i++)updateAppearance(1/60);
  assert.equal(canvasBackground(),'rgb(0, 0, 0)');
  setAppearance('graphite');for(let i=0;i<180;i++)updateAppearance(1/60);
  assert.equal(canvasBackground(),'rgb(5, 5, 5)');
  globalThis.document=previous;
});
