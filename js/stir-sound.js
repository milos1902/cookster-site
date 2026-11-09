/* Cookster: the sound of stirring a dish. While the food is stirred (and while it coasts to a stop after the spoon is let go) a sizzle of the same kind as the one of the frying follows the hand:
   slow stirring = a calm sizzle a little stronger than usual, fast stirring = the sharp hiss with pops of food that has just been thrown in; it stops when the hand stops.
   It reads the stirring state of js/game.js (stirring, stirAngularVelocity, stirVisualTurn, stirVessel) 30 times a second. */
(function(){
'use strict';
if(window.CooksterStirSound)return;
var ctx=null,A1=null,A2=null;      // A1: the calm sizzle (a bit louder than the one of the pan), A2: the sharp hiss with many pops (like the first second after the food is thrown in)
function AC(){var A=window.AudioContext||window.webkitAudioContext;if(!A)return null;ctx=ctx||new A();if(ctx.state==='suspended')ctx.resume().catch(function(){});return ctx;}
function mkBuf(c,secs,npops,popA,hissA,popL){
  var n=Math.floor(c.sampleRate*secs),b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0),lp=0,i,j,pops=[];
  for(i=0;i<npops;i++)pops.push({t:Math.random()*secs,a:.3+Math.random()*popA,l:.002+Math.random()*popL});
  for(i=0;i<n;i++){var t=i/c.sampleRate,w=Math.random()*2-1;lp+=(w-lp)*.5;var pp=0;
    for(j=0;j<pops.length;j++){var q=pops[j],dt=t-q.t;if(dt>=0&&dt<q.l*6)pp+=(Math.random()*2-1)*q.a*Math.exp(-dt/q.l);}
    d[i]=Math.max(-1,Math.min(1,(w-lp)*hissA+pp*.5));}
  var f=Math.floor(c.sampleRate*.05);for(i=0;i<f;i++){var k=i/f;d[i]=d[i]*k+d[n-f+i]*(1-k);}
  return b;
}
function layer(c,buf,hpf){
  var src=c.createBufferSource();src.buffer=buf;src.loop=true;
  var hp=c.createBiquadFilter();hp.type='highpass';hp.frequency.value=hpf;
  var g=c.createGain();g.gain.value=0;src.connect(hp);hp.connect(g);g.connect(c.destination);src.start();
  return {src:src,hp:hp,g:g};
}
function build(){
  var c=AC();if(!c||A1)return !!A1;
  A1=layer(c,mkBuf(c,4,60,.7,.55,.006),1300);
  A2=layer(c,mkBuf(c,3,260,1.0,.95,.007),1900);
  return true;
}
function stop(){try{A1.src.stop();A2.src.stop();}catch(e){}A1=A2=null;}
// the speed of the hand itself (not the slow, heavy turning of the mass): the sound follows every move of the mouse and stops as soon as the hand stops
var mv=0,lastX=null,lastY=null,lastT=0;
window.addEventListener('pointermove',function(e){
  var now=performance.now();
  if(typeof stirring==='undefined'||!stirring){lastX=null;return;}
  if(lastX!==null){var dt=Math.max(4,now-lastT),sp=Math.hypot(e.clientX-lastX,e.clientY-lastY)/dt;mv=Math.max(mv*.6,Math.min(1,sp/.55));}
  lastX=e.clientX;lastY=e.clientY;lastT=now;
},true);
function tick(){
  try{
    var now0=performance.now();
    if(now0-lastT>60)mv*=.78;      // the hand does not move: it dies out in about a tenth of a second
    var v=(typeof stirring!=='undefined'&&stirring)?mv:0;
    if(v<.03){if(A1){var t0=ctx.currentTime;A1.g.gain.setTargetAtTime(0,t0,.05);A2.g.gain.setTargetAtTime(0,t0,.05);if(A1.g.gain.value<.002&&A2.g.gain.value<.002)stop();}return;}
    if(!A1&&!build())return;
    var now=ctx.currentTime;
    A1.g.gain.setTargetAtTime(.10+.10*v,now,.05);      // slow: only a sizzle a little stronger than usual
    A2.g.gain.setTargetAtTime(Math.pow(v,1.6)*.34,now,.04);      // fast: the sharp sizzle of food that has just been thrown in
    A2.hp.frequency.setTargetAtTime(1700+900*v,now,.1);
    A1.src.playbackRate.setTargetAtTime(.95+.2*v,now,.1);
  }catch(e){}
}
setInterval(tick,33);
window.CooksterStirSound={_state:function(){return {on:!!A1,gain:A1?A1.g.gain.value+A2.g.gain.value:0,calm:A1?A1.g.gain.value:0,sharp:A2?A2.g.gain.value:0};}};
})();
