/* Cookster - steaks on the stone grill.
   A slice of meat from the hand is put on the grate from the kitchen view (no zoom needed); the same steaks lie on the grate in the close-up (js/kitchen-fixtures.js).
   Every steak has two sides: the side that lies on the grate cooks (only while the grill burns), the side that faces up shows what it looks like (raw -> grilled with marks -> burnt).
   In the close-up: a click on a steak turns it over, the right button takes it back into the hand (as cooked as its upper side is). */
(function(){
'use strict';
if(window.CooksterGrillSteaks)return;
var MAXN=6;      // the logic is the same for every slice of meat that has the pictures grilledSrc / grilledWellDoneSrc in the catalog (VEGETABLES.<key>); today the beef slice
var steaks=[],seq=1,last=0;
/* the grate in the picture of the kitchen (1672x941): x 285..700, y 62..100 (the bottoms of the steaks stay above the stone wall in front of it) and in the close-up x 230..1370, y 262..420 */
var KG={x0:285,x1:700,y0:66,y1:100,w:50},ZG={x0:230,x1:1370,y0:262,y1:420,w:190};
var RAW_AT=.3,BURN_AT=.9,RATE=1/25;      // grilled from 30%, burnt from 90% of a side; one side: grilled after about 8 s, burnt after about 23 s on a full fire
function def(key){try{return VEGETABLES[key];}catch(e){return null;}}
function canGrill(key){var d=def(key);return !!(d&&d.meat==='snicla'&&d.grilledSrc);}
function srcOf(c,key){var d=def(key);if(!d)return '';return c>=BURN_AT?(d.grilledWellDoneSrc||d.src):c>=RAW_AT?(d.grilledSrc||d.src):d.src;}
function stateOf(c){return c>=BURN_AT?'burnt':c>=RAW_AT?'grilled':'raw';}
function lvl(){try{return window.CooksterGrill?CooksterGrill.level():0;}catch(e){return 0;}}
function kEl(s){
  if(s.kel&&s.kel.isConnected)return s.kel;
  var sc=document.getElementById('scene');if(!sc)return null;
  var im=document.createElement('img');im.draggable=false;im.className='grill-steak-k';
  im.style.cssText='position:absolute;z-index:6;pointer-events:none;transform:translate(-50%,-50%);filter:drop-shadow(0 2px 2px rgba(0,0,0,.5))';
  sc.appendChild(im);s.kel=im;return im;
}
var hinted=false;
function zoomHint(){if(hinted||!document.getElementById('grillZoom'))return;hinted=true;setTimeout(function(){try{showToast('Vuci šniclu da je pomeriš. Desni klik: okreni ili uzmi meso.');}catch(e){}},1200);}
function zHost(){var v=document.getElementById('grillZoom');return v?v.querySelector('.gz-steaks'):null;}
function zEl(s){
  var h=zHost();if(!h)return null;
  if(s.zel&&s.zel.isConnected&&s.zel.parentNode===h)return s.zel;
  var im=document.createElement('img');im.draggable=false;im.className='gz-steak';
  im.style.cssText='position:absolute;transform:translate(-50%,-50%);cursor:grab;pointer-events:auto;filter:drop-shadow(0 6px 5px rgba(0,0,0,.55))';
  im.addEventListener('click',function(e){e.stopPropagation();});
  im.addEventListener('pointerdown',function(e){if(e.button!==0)return;e.stopPropagation();e.preventDefault();closeMenu();startDrag(s,e);});
  im.addEventListener('contextmenu',function(e){e.preventDefault();e.stopPropagation();openMenu(s,e);});
  im.addEventListener('pointerenter',function(){showBar(s);});
  im.addEventListener('pointerleave',function(){hideBar(s);});
  h.appendChild(im);s.zel=im;return im;
}
function layout(s){
  var kx=KG.x0+s.u*(KG.x1-KG.x0),ky=KG.y0+s.v*(KG.y1-KG.y0);
  var e=kEl(s);
  if(e){var w=KG.w;e.style.left=kx+'px';e.style.top=ky+'px';e.style.width=w+'px';e.style.height='auto';e.style.transform='translate(-50%,-50%) rotate('+s.rot+'deg)';var src=srcOf(s.cook[s.up],s.key);if(e.getAttribute('src')!==src)e.setAttribute('src',src);}
  var z=zEl(s);
  if(z){var zx=ZG.x0+s.u*(ZG.x1-ZG.x0),zy=ZG.y0+s.v*(ZG.y1-ZG.y0),zw=ZG.w;
    z.style.left=(zx/1672*100)+'%';z.style.top=(zy/941*100)+'%';z.style.width=(zw/1672*100)+'%';z.style.height='auto';
    if(!s.flipping){z.style.transform='translate(-50%,-50%) rotate('+s.rot+'deg)';}
    var src2=srcOf(s.cook[s.up],s.key);if(z.getAttribute('src')!==src2)z.setAttribute('src',src2);}
}
function tick(now){
  var dt=Math.min(.25,(now-last)/1000||.05);last=now;
  var L=lvl();
  if(L>.2)steaks.forEach(function(s){var down=1-s.up;s.cook[down]=Math.min(1.5,s.cook[down]+dt*RATE*L);});
  steaks.forEach(layout);
  zoomHint();
  updateBar();
  sizzleLoop();
}
setInterval(function(){tick(performance.now());},250);
// moving a steak on the grate: hold the left button on it and drag
var drag=null;
function startDrag(s,e){
  if(drag||s.flipping)return;
  var h=zHost();if(!h)return;
  drag={s:s,pid:e.pointerId,el:s.zel};
  try{s.zel.setPointerCapture(e.pointerId);}catch(x){}
  s.zel.style.cursor='grabbing';s.zel.style.zIndex='6';
  drag.mv=function(ev){
    var r=h.getBoundingClientRect(),px=(ev.clientX-r.left)/r.width*1672,py=(ev.clientY-r.top)/r.height*941;
    s.u=Math.max(.02,Math.min(1,(px-ZG.x0)/(ZG.x1-ZG.x0)));s.v=Math.max(0,Math.min(1,(py-ZG.y0)/(ZG.y1-ZG.y0)));
    layout(s);moveBar(s);
  };
  drag.up=function(){
    if(!drag)return;var d=drag;drag=null;
    try{d.el.releasePointerCapture(d.pid);}catch(x){}
    window.removeEventListener('pointermove',d.mv,true);window.removeEventListener('pointerup',d.up,true);window.removeEventListener('pointercancel',d.up,true);
    d.el.style.cursor='grab';d.el.style.zIndex='';
  };
  window.addEventListener('pointermove',drag.mv,true);window.addEventListener('pointerup',drag.up,true);window.addEventListener('pointercancel',drag.up,true);
}
// the small menu of the right button: turn the steak over / take it
var menu=null;
function closeMenu(){if(menu){menu.remove();menu=null;}}
function openMenu(s,e){
  closeMenu();var v=document.getElementById('grillZoom');if(!v)return;
  var m=document.createElement('div');m.className='gz-menu';
  m.style.cssText='position:fixed;left:'+e.clientX+'px;top:'+e.clientY+'px;z-index:30020;background:rgba(40,20,9,.96);border:2px solid #f1af33;border-radius:10px;padding:5px;font:700 15px system-ui,sans-serif;color:#fff;box-shadow:0 6px 18px rgba(0,0,0,.5)';
  function btn(label,fn){var b=document.createElement('button');b.type='button';b.textContent=label;b.style.cssText='display:block;width:100%;text-align:left;padding:8px 14px;margin:2px 0;background:transparent;color:#fff;border:0;border-radius:7px;cursor:pointer;font:inherit';
    b.onmouseenter=function(){b.style.background='rgba(241,175,51,.35)';};b.onmouseleave=function(){b.style.background='transparent';};
    b.onclick=function(ev){ev.stopPropagation();closeMenu();fn(ev);};return b;}
  m.appendChild(btn('Okreni meso',function(){flip(s);}));
  m.appendChild(btn('Uzmi meso',function(ev){take(s,ev);}));
  ['pointerdown','click','contextmenu','mousedown'].forEach(function(n){m.addEventListener(n,function(ev){ev.stopPropagation();});});
  v.appendChild(m);menu=m;
  setTimeout(function(){window.addEventListener('pointerdown',function f(ev){if(menu&&!menu.contains(ev.target)){closeMenu();}window.removeEventListener('pointerdown',f,true);},true);},0);
}
// the cooking bar over the steak under the mouse (one bar at a time): it shows how far the side that lies on the grate is cooked
var bar=null,barFor=null;
function showBar(s){
  var v=document.getElementById('grillZoom');if(!v||s.flipping)return;
  hideBar();
  var d=document.createElement('div');d.className='cookster-cooking-hud visible gz-bar';
  d.innerHTML='<div class="cook-state-label"></div><div class="cook-progress-bar"><i><img src="assets/ui_cook/traka_boja.webp?v=1" alt="" draggable="false"></i></div>';
  d.style.zIndex='30008';v.appendChild(d);bar=d;barFor=s;moveBar(s);updateBar();
}
function hideBar(){if(bar){bar.remove();bar=null;barFor=null;}}
function moveBar(s){
  if(!bar||barFor!==s||!s.zel)return;
  var r=s.zel.getBoundingClientRect();bar.style.left=(r.x+r.width/2)+'px';bar.style.top=(r.y-8)+'px';
}
function updateBar(){
  if(!bar||!barFor)return;
  if(!barFor.zel||!barFor.zel.isConnected){hideBar();return;}
  var c=barFor.cook[1-barFor.up],f=Math.max(0,Math.min(1,c/1.0));
  bar.querySelector('i').style.width=(c<=0.004?0:f*91.4)+'%';
  moveBar(barFor);
}
function flip(s){
  if(s.flipping)return;s.flipping=true;
  var z=zEl(s);
  if(!z){s.up=1-s.up;s.flipping=false;return;}
  // a real flip: it jumps up, turns over (the picture changes when it is edge-on) and falls back with a small bounce
  var T=function(dy,sy,sc,rot){return 'translate(-50%,calc(-50% + '+dy+'px)) rotate('+(s.rot+(rot||0))+'deg) scale('+sc+','+(sc*sy)+')';};
  var D=720;
  var kf=[
    {transform:T(0,1,1,0),offset:0,easing:'cubic-bezier(.3,.1,.5,1)'},
    {transform:T(-70,.55,1.12,-6),offset:.22,easing:'linear'},
    {transform:T(-110,.04,1.2,0),offset:.45,easing:'linear'},
    {transform:T(-70,.55,1.12,6),offset:.68,easing:'cubic-bezier(.5,0,.9,.6)'},
    {transform:T(0,.9,1,0),offset:.86,easing:'ease-out'},
    {transform:T(-8,1.06,1,0),offset:.93,easing:'ease-in'},
    {transform:T(0,1,1,0),offset:1}
  ];
  var swapped=false;
  z.style.zIndex='5';
  var an=z.animate(kf,{duration:D,fill:'none'});
  setTimeout(function(){s.up=1-s.up;swapped=true;layout(s);},D*.45);      // when the steak is edge-on, the other side comes up
  setTimeout(function(){if(lvl()>.2){try{CooksterGrillSizzle(.5+.3*lvl());}catch(e){}}},D*.85);      // the other side lands on the hot grate
  var done=function(){if(!swapped){s.up=1-s.up;layout(s);}s.flipping=false;z.style.zIndex='';};
  an.onfinish=done;an.oncancel=done;
}
function add(item,e){
  if(steaks.length>=MAXN){try{showToast('Roštilj je pun.');}catch(x){}return false;}
  var p=screenToScene(e.clientX,e.clientY);
  var u=Math.max(.05,Math.min(.95,(p.x-KG.x0)/(KG.x1-KG.x0))),v=Math.max(0,Math.min(1,(p.y-KG.y0)/(KG.y1-KG.y0)));
  // not on top of another steak: a free place next to it
  for(var k=0;k<10;k++){var hit=steaks.some(function(o){return Math.abs(o.u-u)<.13&&Math.abs(o.v-v)<.45;});if(!hit)break;u=u+.14>.95?.06+(u+.14-.95):u+.14;}
  var md=item.dataset.meatDone||'',c0=md==='burnt'||md==='grilledBurnt'?1:(md==='fried'||md==='grilled'?.45:0);
  var s={id:seq++,key:item.dataset.vegKey,u:u,v:v,rot:Math.round((Math.random()-.5)*14),up:0,cook:[c0,c0],flipping:false};
  steaks.push(s);layout(s);
  if(lvl()>.2){try{CooksterGrillSizzle(.7+.3*lvl());}catch(e){}}      // the meat hits the hot grate: it sizzles
  return true;
}
function take(s,e){
  var d=def(s.key);if(!d)return;
  var c=s.cook[s.up],st=stateOf(c);
  hideBar();closeMenu();
  try{CooksterKitchenFx.closeGrill();}catch(x){}
  steaks=steaks.filter(function(o){return o!==s;});
  if(s.kel)s.kel.remove();if(s.zel)s.zel.remove();
  var src=srcOf(c,s.key),w=d.w,h=d.h,p=screenToScene(e.clientX,e.clientY);
  var el=makeItem({id:'veg_'+s.key+'_'+Date.now(),label:st==='burnt'?'Zagorela šnicla sa roštilja':st==='grilled'?'Šnicla sa roštilja':d.label,src:src,x:p.x-w/2,y:p.y-h,w:w,h:h,z:++zCounter,snapProfile:'produce'});
  el.dataset.vegetable='1';el.dataset.collisionProfile='vegetable';el.dataset.vegKey=s.key;el.dataset.cutState='whole';
  if(st==='grilled')el.dataset.meatDone='grilled';else if(st==='burnt')el.dataset.meatDone='grilledBurnt';
  el.dataset.surfaceZone='table';setPose(el,p.x,p.y,1);
  try{startHolding(el);}catch(x){}
  try{CooksterSave.schedule();}catch(x){}
}
// the built-in sizzle: hiss (filtered noise) with small pops, about 3 s, fading out
var szCtx=null,szBuf=null;
function synthSizzle(strength){
  try{
    var AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
    szCtx=szCtx||new AC();var c=szCtx;if(c.state==='suspended')c.resume().catch(function(){});
    if(!szBuf){
      var n=Math.floor(c.sampleRate*3.2),b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0),pops=[],i;
      for(i=0;i<70;i++)pops.push({t:Math.random()*Math.random()*2.6,a:.4+Math.random()*.8,l:.002+Math.random()*.006});
      var lp=0;
      for(i=0;i<n;i++){
        var t=i/c.sampleRate,env=Math.exp(-t/1.1)*(t<.03?t/.03:1),w=Math.random()*2-1;
        lp+=(w-lp)*.55;var hiss=(w-lp)*.9*env;      // high-passed noise
        var pp=0;for(var j=0;j<pops.length;j++){var q=pops[j],dt=t-q.t;if(dt>=0&&dt<q.l*6)pp+=(Math.random()*2-1)*q.a*Math.exp(-dt/q.l)*Math.exp(-q.t/1.6);}
        d[i]=Math.max(-1,Math.min(1,hiss*.55+pp*.5));
      }
      szBuf=b;
    }
    var src=c.createBufferSource();src.buffer=szBuf;src.playbackRate.value=.92+Math.random()*.16;
    var f=c.createBiquadFilter();f.type='highpass';f.frequency.value=1800;
    var g=c.createGain();g.gain.value=Math.max(.1,Math.min(1,strength==null?.7:strength))*.55;
    src.connect(f);f.connect(g);g.connect(c.destination);src.start();
  }catch(e){}
}
// the quiet sizzle goes on the whole time while there is meat on a burning grill
var loopSrc=null,loopGain=null;
function sizzleLoop(){
  try{
    var want=(steaks.length>0&&lvl()>.2)?Math.min(.075,.035+.012*steaks.length):0;
    if(!loopSrc&&want<=0)return;
    var AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
    szCtx=szCtx||new AC();var c=szCtx;
    if(!loopSrc){
      if(c.state==='suspended')c.resume().catch(function(){});
      var n=Math.floor(c.sampleRate*4),b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0),lp=0,i,pops=[];
      for(i=0;i<46;i++)pops.push({t:Math.random()*4,a:.3+Math.random()*.7,l:.002+Math.random()*.005});
      for(i=0;i<n;i++){var t=i/c.sampleRate,w=Math.random()*2-1;lp+=(w-lp)*.5;var pp=0;
        for(var j=0;j<pops.length;j++){var q=pops[j],dt=t-q.t;if(dt>=0&&dt<q.l*6)pp+=(Math.random()*2-1)*q.a*Math.exp(-dt/q.l);}
        d[i]=Math.max(-1,Math.min(1,(w-lp)*.5+pp*.45));}
      // the end joins the beginning without a click: a short cross fade
      var f=Math.floor(c.sampleRate*.05);for(i=0;i<f;i++){var k=i/f;d[i]=d[i]*k+d[n-f+i]*(1-k);}
      loopSrc=c.createBufferSource();loopSrc.buffer=b;loopSrc.loop=true;
      var hp=c.createBiquadFilter();hp.type='highpass';hp.frequency.value=1600;
      loopGain=c.createGain();loopGain.gain.value=0;loopSrc.connect(hp);hp.connect(loopGain);loopGain.connect(c.destination);loopSrc.start();
    }
    loopGain.gain.setTargetAtTime(want,c.currentTime,.5);
    if(want<=0&&loopGain.gain.value<.002){try{loopSrc.stop();}catch(e){}loopSrc=null;loopGain=null;}
  }catch(e){}
}
// a slice of meat from the hand, a click on the grate of the kitchen (not zoomed): it is put on the grill
window.addEventListener('pointerdown',function(e){
  if(e.button!==0||typeof holding==='undefined'||!holding||!holding.dataset)return;
  var vk=holding.dataset.vegKey||'';if(!canGrill(vk))return;
  if(window.CooksterKitchenFx&&CooksterKitchenFx.isZoomed&&CooksterKitchenFx.isZoomed())return;
  var p;try{p=screenToScene(e.clientX,e.clientY);}catch(x){return;}
  if(p.x<250||p.x>735||p.y<40||p.y>125)return;
  var it=holding;
  if(!add(it,e)){e.stopImmediatePropagation();e.preventDefault();return;}
  e.stopImmediatePropagation();e.preventDefault();
  try{removeItem(it);holding=null;hidePlacementGhost();hideOriginGhost();clearPanTargets();updateHover();}catch(x){}
  try{showToast(lvl()>.2?'Šnicla je na roštilju.':'Šnicla je na roštilju, ali roštilj nije upaljen.');}catch(x){}
  try{CooksterSave.schedule();}catch(x){}
},true);
// the clock panel (a picture over the upper left part of the grill) must not swallow the click while a steak is in the hand: the panels let the click through
var st=document.createElement('style');st.textContent='body.gs-holding img.ui-overlay-element{pointer-events:none!important}';document.head.appendChild(st);
setInterval(function(){var on=false;try{on=!!(typeof holding!=='undefined'&&holding&&holding.dataset&&canGrill(holding.dataset.vegKey||''));}catch(e){}document.body.classList.toggle('gs-holding',on);},150);
window.CooksterGrillSteaks={flip:function(i){var s=steaks[i||0];if(s)flip(s);},synthSizzle:synthSizzle,all:function(){return steaks;},layout:function(){steaks.forEach(layout);},host:zHost,canGrill:canGrill};
})();
