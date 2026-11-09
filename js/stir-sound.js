/* Cookster: the sound of stirring a dish. While the food is stirred (and while it coasts to a stop after the spoon is let go) a soft wooden-spoon swish and a wet slosh
   follow the speed of the stirring: faster stirring is louder and brighter, slow is quiet and low, and it fades out with the movement.
   It reads the stirring state of js/game.js (stirring, stirAngularVelocity, stirVisualTurn, stirVessel) 30 times a second. */
(function(){
'use strict';
if(window.CooksterStirSound)return;
var ctx=null,src=null,bp=null,lpf=null,gain=null,gSw=null;
function AC(){var A=window.AudioContext||window.webkitAudioContext;if(!A)return null;ctx=ctx||new A();if(ctx.state==='suspended')ctx.resume().catch(function(){});return ctx;}
function build(){
  var c=AC();if(!c||src)return !!src;
  var n=Math.floor(c.sampleRate*3),b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0),lp=0,lp2=0,i,j,sl=[];
  for(i=0;i<40;i++)sl.push({t:Math.random()*3,a:.3+Math.random()*.7,l:.012+Math.random()*.03,f:180+Math.random()*320});      // small wet bubbles / slosh
  for(i=0;i<n;i++){var t=i/c.sampleRate,w=Math.random()*2-1;lp+=(w-lp)*.22;lp2+=(w-lp2)*.04;var s=0;
    for(j=0;j<sl.length;j++){var q=sl[j],dt=t-q.t;if(dt>=0&&dt<q.l*5)s+=Math.sin(dt*q.f*6.283*(1+dt*8))*q.a*Math.exp(-dt/q.l);}
    d[i]=Math.max(-1,Math.min(1,lp*.55+lp2*.7+s*.35));}
  var f=Math.floor(c.sampleRate*.06);for(i=0;i<f;i++){var k=i/f;d[i]=d[i]*k+d[n-f+i]*(1-k);}
  src=c.createBufferSource();src.buffer=b;src.loop=true;
  bp=c.createBiquadFilter();bp.type='bandpass';bp.frequency.value=500;bp.Q.value=.7;
  lpf=c.createBiquadFilter();lpf.type='lowpass';lpf.frequency.value=2600;
  gSw=c.createGain();gSw.gain.value=1;      // once per round of the spoon
  gain=c.createGain();gain.gain.value=0;
  src.connect(bp);bp.connect(lpf);lpf.connect(gSw);gSw.connect(gain);gain.connect(c.destination);src.start();
  return true;
}
function stop(){try{src.stop();}catch(e){}src=null;gain=null;}
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
    var v=(typeof stirring!=='undefined'&&stirring)?mv:0,active=v>.03;
    if(!active||v<.02){if(src&&gain){gain.gain.setTargetAtTime(0,ctx.currentTime,.12);if(gain.gain.value<.002)stop();}return;}
    if(!src&&!build())return;
    var now=ctx.currentTime,turn=(typeof stirVisualTurn!=='undefined'?stirVisualTurn:0)*Math.PI/180;
    gain.gain.setTargetAtTime(Math.pow(v,.8)*.16,now,.08);
    bp.frequency.setTargetAtTime(380+720*v,now,.1);
    gSw.gain.setTargetAtTime(.72+.28*Math.sin(turn),now,.03);
    src.playbackRate.setTargetAtTime(.85+.5*v,now,.1);
  }catch(e){}
}
setInterval(tick,33);
window.CooksterStirSound={_state:function(){return {on:!!src,gain:gain?gain.gain.value:0};}};
})();
