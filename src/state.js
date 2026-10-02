import { GOLDEN_ANGLE } from './core/animation.js';
export const DEBUG = new URLSearchParams(location.search).has('debug');
export const state = {
  appearance:'graphite',
  fibonacci:{showGrid:true,steps:12,speed:1,lineWidth:1.5,direction:'clockwise',showSquares:true,showSpiral:true,showNumbers:true,playing:true,progress:0},
  phyllotaxis:{showGrid:true,points:700,angle:GOLDEN_ANGLE,targetAngle:GOLDEN_ANGLE,angleVelocity:0,spacing:7.5,dotSize:2.6,speed:1,glow:.55,flicker:.15,playing:true,progress:0},
  petals:{showGrid:true,petalCount:15,currentCount:15,targetCount:15,currentAngle:120,targetAngle:120,angleVelocity:0,petalLength:190,petalWidth:34,centerRadius:17,glow:.45,speed:1,duration:10,motion:{phase:'idle',elapsed:0,from:120,paused:false},playing:false,rotation:0,goldenPulse:0},
  mechanics:{position:11,velocity:0,activeIndex:11,playing:false,speed:1,autoTimer:0,manualUntil:0}
};
