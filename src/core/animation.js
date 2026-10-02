export const GOLDEN_ANGLE = 137.5;
export const PHI = (1 + Math.sqrt(5)) / 2;
export const TAU = Math.PI * 2;
export const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const lerp = (a, b, t) => a + (b - a) * t;
export const easeInOutCubic = t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;
export const easeOutExpo = t => t >= 1 ? 1 : 1 - Math.pow(2, -10*t);
export const smoothstep = (a, b, x) => { const t = clamp((x-a)/(b-a), 0, 1); return t*t*(3-2*t); };

// Semi-implicit spring integration. Velocities are in units per second.
export function springValue(state, target, dt, frequency = 5, damping = 1) {
  const omega = 2 * Math.PI * frequency;
  const acceleration = (target - state.value) * omega * omega - 2 * damping * omega * state.velocity;
  state.velocity += acceleration * dt;
  state.value += state.velocity * dt;
  if (Math.abs(target-state.value) < 0.0001 && Math.abs(state.velocity) < 0.0001) {
    state.value = target; state.velocity = 0;
  }
  return state.value;
}

export function smoothDamp(current, target, velocity, smoothTime, dt) {
  const omega = 2 / Math.max(.001, smoothTime);
  const x = omega * dt;
  const decay = 1 / (1 + x + .48*x*x + .235*x*x*x);
  const change = current - target;
  const temp = (velocity + omega*change)*dt;
  return { value: target + (change + temp)*decay, velocity: (velocity - omega*temp)*decay };
}

export function animateValue(state, target, dt, time = .28) {
  const next = smoothDamp(state.value, target, state.velocity, reducedMotion ? .06 : time, dt);
  state.value = next.value; state.velocity = next.velocity;
  if (Math.abs(state.value-target) < .0001 && Math.abs(state.velocity) < .0001) { state.value=target; state.velocity=0; }
  return state.value;
}

export function loop(callback) {
  let previous = performance.now(), frame = 0;
  function tick(now) {
    const dt = Math.min((now-previous)/1000, .033);
    previous = now;
    if (!document.hidden) callback(dt, now/1000, frame++);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
