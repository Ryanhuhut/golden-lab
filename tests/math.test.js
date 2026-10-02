import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.matchMedia = () => ({matches:false});
const [{buildSquares,arcData},{phyllotaxisPoint},{fib,ratio},{smoothDamp,GOLDEN_ANGLE},{pascalRows,isOddPascal},{stepPetalMotion}] = await Promise.all([
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
test('petal run and presentation sequence reach the displayed golden angle',()=>{
  const s={currentAngle:200,targetAngle:200,angleVelocity:0,duration:1,motion:{phase:'run',elapsed:0,from:200,paused:false},playing:true};
  function frame(){stepPetalMotion(s,1/60);const next=smoothDamp(s.currentAngle,s.targetAngle,s.angleVelocity,.20,1/60);s.currentAngle=next.value;s.angleVelocity=next.velocity}
  for(let i=0;i<300;i++)frame();
  assert.equal(s.motion.phase,'idle');assert.ok(Math.abs(s.currentAngle-GOLDEN_ANGLE)<.001);
  s.motion={phase:'return',elapsed:0,from:s.currentAngle,paused:false};s.playing=true;
  let sawReturn=false,sawAdvance=false;
  for(let i=0;i<500;i++){frame();if(s.motion.phase==='hold')sawReturn=true;if(s.motion.phase==='advance')sawAdvance=true}
  assert.equal(sawReturn,true);assert.equal(sawAdvance,true);
  assert.equal(s.motion.phase,'idle');assert.ok(Math.abs(s.currentAngle-GOLDEN_ANGLE)<.001);
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
