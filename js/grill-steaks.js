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
var RAW_AT=.3,BURN_AT=.9,RATE=1/40;      // grilled from 30%, burnt from 90% of a side; one side takes about 40 s on a full fire
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
function zHost(){var v=document.getElementById('grillZoom');return v?v.querySelector('.gz-steaks'):null;}
function zEl(s){
  var h=zHost();if(!h)return null;
  if(s.zel&&s.zel.isConnected&&s.zel.parentNode===h)return s.zel;
  var im=document.createElement('img');im.draggable=false;im.className='gz-steak';
  im.style.cssText='position:absolute;transform:translate(-50%,-50%);cursor:none;pointer-events:auto;filter:drop-shadow(0 6px 5px rgba(0,0,0,.55))';
  im.addEventListener('click',function(e){e.stopPropagation();});      // a click alone does nothing: the steak is turned with a half circle
  im.addEventListener('pointerdown',function(e){if(e.button!==0)return;e.stopPropagation();e.preventDefault();startArc(s,e);});
  im.addEventListener('contextmenu',function(e){e.preventDefault();e.stopPropagation();take(s,e);});
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
}
setInterval(function(){tick(performance.now());},250);
// turning: hold the left button on the steak and draw ONE half circle with the mouse (around the steak); the trail shows the line
var arc=null,trail=null;
function trailSvg(){
  var v=document.getElementById('grillZoom');if(!v)return null;
  if(trail&&trail.isConnected)return trail;
  var ns='http://www.w3.org/2000/svg',sv=document.createElementNS(ns,'svg');
  sv.setAttribute('class','gz-trail');sv.style.cssText='position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:30005';
  var pl=document.createElementNS(ns,'polyline');pl.setAttribute('fill','none');pl.setAttribute('stroke','#7be26a');pl.setAttribute('stroke-width','7');pl.setAttribute('stroke-linecap','round');pl.setAttribute('stroke-linejoin','round');pl.setAttribute('opacity','.85');
  pl.style.filter='drop-shadow(0 0 5px rgba(60,200,60,.8))';sv.appendChild(pl);v.appendChild(sv);trail=sv;return sv;
}
function endArc(){
  if(!arc)return;var a=arc;arc=null;
  try{a.el.releasePointerCapture(a.pid);}catch(e){}
  window.removeEventListener('pointermove',a.mv,true);window.removeEventListener('pointerup',a.up,true);window.removeEventListener('pointercancel',a.up,true);
  var t=trail;trail=null;if(t){t.style.transition='opacity .35s';t.style.opacity='0';setTimeout(function(){t.remove();},380);}
}
function startArc(s,e){
  if(s.flipping||arc)return;
  var r=s.zel.getBoundingClientRect(),cx=r.x+r.width/2,cy=r.y+r.height/2;
  var a={s:s,cx:cx,cy:cy,last:null,acc:0,pts:[[e.clientX,e.clientY]],el:s.zel,pid:e.pointerId};
  try{s.zel.setPointerCapture(e.pointerId);}catch(x){}
  a.mv=function(ev){
    if(!arc)return;
    var x=ev.clientX,y=ev.clientY,dx=x-cx,dy=y-cy;
    a.pts.push([x,y]);if(a.pts.length>140)a.pts.shift();
    var sv=trailSvg();if(sv)sv.firstChild.setAttribute('points',a.pts.map(function(q){return q[0]+','+q[1];}).join(' '));
    if(Math.hypot(dx,dy)<r.width*.16)return;      // too near the middle of the steak: the angle is not stable
    var ang=Math.atan2(dy,dx);
    if(a.last!=null){var d=ang-a.last;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;a.acc+=d;}
    a.last=ang;
    if(Math.abs(a.acc)>=Math.PI*.78){var ss=a.s;endArc();flip(ss);}      // about a half circle (140 degrees) is enough
  };
  a.up=function(){endArc();};
  window.addEventListener('pointermove',a.mv,true);window.addEventListener('pointerup',a.up,true);window.addEventListener('pointercancel',a.up,true);
  arc=a;
}
function flip(s){
  if(s.flipping)return;s.flipping=true;
  var z=zEl(s);
  if(!z){s.up=1-s.up;s.flipping=false;return;}
  tongsGrab();
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
// the tongs: as soon as the close-up of the grill opens, the player holds the tongs (they follow the mouse, the tips are at the pointer); they are what turns and takes the steaks
var tongs=null;
function attachTongs(v){
  if(!v)return;
  v.style.cursor='none';
  if(tongs&&tongs.isConnected)tongs.remove();
  var im=document.createElement('img');im.className='gz-tongs';im.draggable=false;im.src='assets/new_props/hvataljka.png?v=1';
  im.style.cssText='position:fixed;left:0;top:0;width:230px;height:auto;pointer-events:none;z-index:30010;transform-origin:2% 50%;filter:drop-shadow(0 8px 6px rgba(0,0,0,.5));opacity:0;transition:opacity .25s';
  v.appendChild(im);tongs=im;
  if(!window.__gsHint){window.__gsHint=1;setTimeout(function(){try{showToast('Uhvati šniclu levim klikom i povuci polukrug mišem da je okreneš. Desni klik je vadi.');}catch(e){}},1200);}
  var place=function(x,y){im.style.transform='translate('+x+'px,'+(y-40)+'px) rotate(16deg)';};
  var mv=function(e){place(e.clientX,e.clientY);im.style.opacity='1';};
  window.addEventListener('pointermove',mv,true);
  try{place(mouse.x,mouse.y);}catch(e){}
  setTimeout(function(){im.style.opacity='1';},700);      // it appears when the zoom is nearly there
  var watch=setInterval(function(){if(!v.isConnected){window.removeEventListener('pointermove',mv,true);clearInterval(watch);}},400);
  im._place=place;
}
function tongsGrab(){
  if(!tongs||!tongs.isConnected)return;
  var cur=tongs.style.transform;
  try{tongs.animate([{transform:cur},{transform:cur.replace('rotate(16deg)','rotate(6deg) scale(.96)')},{transform:cur}],{duration:520,easing:'ease-in-out'});}catch(e){}
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
window.CooksterGrillSteaks={attachTongs:attachTongs,synthSizzle:synthSizzle,all:function(){return steaks;},layout:function(){steaks.forEach(layout);},host:zHost,canGrill:canGrill};
})();
