/* Cookster: the sound of food in a pan on the stove.
   - A pan with food that is put on the stove (or heats up there): a quiet sizzle starts slowly and grows with the heat, and goes on until the pan is taken away or the fire is out.
   - A hot pan (with oil) that is empty, and the food is thrown in: a sudden loud sizzle first (the same sound as the meat on the grill), then it settles into the quiet one.
   It only listens: every 250 ms it looks at the pans on the stove (js/game.js keeps dataset.onStove) and at what is in them (CooksterPan). */
(function(){
'use strict';
if(window.CooksterPanSizzle)return;
var ctx=null,src=null,gain=null,hp=null,lastBurst=0;
var seen=new WeakMap();      // pan -> {n: pieces of food it had at the last look}
function AC(){var A=window.AudioContext||window.webkitAudioContext;if(!A)return null;ctx=ctx||new A();if(ctx.state==='suspended')ctx.resume().catch(function(){});return ctx;}
function startLoop(){
  var c=AC();if(!c||src)return !!src;
  var n=Math.floor(c.sampleRate*4),b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0),lp=0,lp2=0,i,j,pops=[];
  for(i=0;i<60;i++)pops.push({t:Math.random()*4,a:.3+Math.random()*.7,l:.003+Math.random()*.008});
  for(i=0;i<n;i++){var t=i/c.sampleRate,w=Math.random()*2-1;lp+=(w-lp)*.5;lp2+=(w-lp2)*.08;var pp=0;
    for(j=0;j<pops.length;j++){var q=pops[j],dt=t-q.t;if(dt>=0&&dt<q.l*6)pp+=(Math.random()*2-1)*q.a*Math.exp(-dt/q.l);}
    d[i]=Math.max(-1,Math.min(1,(w-lp)*.42+lp2*.5+pp*.5));}      // a hiss, a soft bubbling (the low noise) and small pops
  var f=Math.floor(c.sampleRate*.05);for(i=0;i<f;i++){var k=i/f;d[i]=d[i]*k+d[n-f+i]*(1-k);}
  src=c.createBufferSource();src.buffer=b;src.loop=true;
  hp=c.createBiquadFilter();hp.type='highpass';hp.frequency.value=900;
  gain=c.createGain();gain.gain.value=0;src.connect(hp);hp.connect(gain);gain.connect(c.destination);src.start();
  return true;
}
function stopLoop(){try{src.stop();}catch(e){}src=null;gain=null;hp=null;}
function foodOf(p){
  try{var m=CooksterPan.read(p),ing=m.ingredients||{},n=0;for(var k in ing)n+=Math.max(0,+ing[k]||0);return {n:n,heat:+m.heat||0,oil:+((m.staples||{}).oil)||0,burnt:!!m.burnt};}catch(e){return null;}
}
function tick(){
  try{
    var target=0,burst=0,pans=(window.items||[]).filter(function(v){return v&&v.isConnected&&v.dataset&&v.dataset.onStove==='1'&&typeof isPanItem==='function'&&isPanItem(v);});
    (window.items||[]).forEach(function(v){if(v&&v.dataset&&v.dataset.onStove!=='1')seen.delete(v);});      // a pan that is off the stove forgets (food added there makes no hiss)
    pans.forEach(function(p){
      var s=foodOf(p);if(!s)return;
      var st=seen.get(p)||{n:s.n,fresh:true};
      if(s.n>st.n&&s.heat>=.3&&!s.burnt){burst=Math.max(burst,st.n===0?(s.oil>0?.95:.6):.45);}      // food thrown into the hot pan
      st.n=s.n;seen.set(p,st);
      if(s.n>0&&!s.burnt){var lvl=Math.min(1,s.heat/.55)*Math.min(1,.45+.12*s.n);target=Math.max(target,lvl);}
    });
    if(burst&&performance.now()-lastBurst>700){lastBurst=performance.now();try{CooksterGrillSizzle(burst);}catch(e){}if(src&&gain&&ctx)gain.gain.setTargetAtTime(Math.max(.1,.12*burst),ctx.currentTime,.02);}
    if(target>0||src){
      if(!src&&!startLoop())return;
      var want=target*.09;
      // slow in (about 2 s), a bit faster out
      gain.gain.setTargetAtTime(want,ctx.currentTime,want>gain.gain.value?(burst?.9:1.3):.5);
      if(want<=0&&gain.gain.value<.002)stopLoop();
    }
  }catch(e){}
}
setInterval(tick,250);
window.CooksterPanSizzle={_tick:tick,_state:function(){return {loop:!!src,gain:gain?gain.gain.value:0};}};
})();
