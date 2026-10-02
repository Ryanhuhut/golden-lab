import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.matchMedia = () => ({matches:false});
const [{buildSquares},{phyllotaxisPoint},{fib,ratio},{smoothDamp,GOLDEN_ANGLE}] = await Promise.all([
  import('../src/experiments/fibonacci.js'),
  import('../src/experiments/phyllotaxis.js'),
  import('../src/experiments/mechanics.js'),
  import('../src/core/animation.js')
]);

test('Fibonacci squares follow the sequence and stay adjacent',()=>{
  const squares=buildSquares(100);
  assert.equal(squares.length,100);
  assert.deepEqual(squares.slice(0,8).map(s=>s.value),[1n,1n,2n,3n,5n,8n,13n,21n]);
  assert.deepEqual(squares.slice(0,5).map(s=>s.dir),['seed','right','up','left','down']);
  for(let i=2;i<30;i++)assert.equal(squares[i].value,squares[i-1].value+squares[i-2].value);
  assert.ok(Number.isFinite(squares[99].x)&&Number.isFinite(squares[99].size));
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
