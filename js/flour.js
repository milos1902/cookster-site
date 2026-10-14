/* Flour: the sack of flour (kal_01_dzak_brasna) is poured on the table.
   Take the sack (left click). With the sack in the hand the LEFT button held down = it tilts and the flour pours out on the table where the stream lands;
   the RIGHT button puts the sack down. The flour makes a pile that grows (assets/flour/gomila.webp). The piles are saved in this browser (cookster.flour-piles.v1). */
(function(){
'use strict';
if(window.CooksterFlour)return;
var SACK='kal_01_dzak_brasna',KEY='cookster.flour-piles.v1',RATE=9,SACK_MAX=300;     // units of flour per second; one sack
var IMG={a:'assets/flour/dzak_nagnut1.webp?v=1',b:'assets/flour/dzak_nagnut2.webp?v=1',pile:'assets/flour/gomila.webp?v=1',pile2:'assets/flour/gomila2.webp?v=1',pile3:'assets/flour/gomila3.webp?v=1'};
var piles=[],pour=null,hold=null;
try{var raw=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(raw))piles=raw.filter(function(p){return p&&isFinite(p.x)&&isFinite(p.y)&&p.n>0;});}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(piles.map(function(p){return {x:p.x,y:p.y,n:p.n};})));}catch(e){}}
[IMG.a,IMG.b,IMG.pile,IMG.pile2,IMG.pile3].forEach(function(s){var i=new Image();i.src=s;});
function scn(){return document.getElementById('scene');}
function pileW(n){return 46+Math.pow(Math.min(n,200),.62)*7.2;}   // pile width in the pixels of the scene (a little flour = a small heap, 100 units about 170 px)
function drawPile(p){
  var sc=scn();if(!sc)return;
  if(!p.el||!p.el.isConnected){p.el=document.createElement('img');p.el.src=IMG.pile;p.el.draggable=false;p.el.className='flour-pile';p.el.style.cssText='position:absolute;pointer-events:none;transform:translate(-50%,-72%);user-select:none';sc.appendChild(p.el);}
  var vis=1;try{vis=surfaceScaleFor({dataset:{itemId:SACK,surfaceZone:'table'}},'table',p.y)||1;}catch(e){}
  var st=p.n<35?'pile':(p.n<110?'pile2':'pile3');   // a flat heap, a heap, a high mound
  if(p.st!==st){p.st=st;p.el.src=IMG[st];}
  var w=pileW(p.n)*vis*(st==='pile3'?.9:1);p.el.style.left=p.x+'px';p.el.style.top=p.y+'px';p.el.style.width=w+'px';p.el.style.zIndex=String(Math.floor(p.y)+2);
}
function addFlour(x,y,n){
  var best=null,bd=60;
  piles.forEach(function(p){var d=Math.hypot(p.x-x,(p.y-y)*1.6);if(d<bd){bd=d;best=p;}});
  if(!best){best={x:x,y:y,n:0};piles.push(best);}
  best.n=Math.min(260,best.n+n);drawPile(best);return best;
}
piles.forEach(function(p){setTimeout(function(){drawPile(p);},0);});
setInterval(function(){piles.forEach(function(p){if(p.el&&!p.el.isConnected)p.el=null;if(!p.el)drawPile(p);});},1500);

// ---- the kneading trough (nacve): flour that falls into it stays inside (a pile in the opening of the trough, under its front rim) ----
var TR='nacve',INNER={l:13,r:89,t:10,b:81};   // the opening of the trough, percents of its picture
function troughAt(x,y){
  var list=typeof items!=='undefined'?items:[],i;
  for(i=list.length-1;i>=0;i--){
    var e=list[i];if(!e||!e.dataset||e.dataset.itemId!==TR||!e.isConnected)continue;
    var r=e.getBoundingClientRect(),a=screenToScene(r.left,r.top),b=screenToScene(r.right,r.bottom),w=b.x-a.x,h=b.y-a.y;
    if(x>=a.x+w*INNER.l/100&&x<=a.x+w*INNER.r/100&&y>=a.y+h*INNER.t/100&&y<=a.y+h*(INNER.b+14)/100)return e;
  }
  return null;
}
function drawTrough(e){
  var n=+e.dataset.inFlour||0;
  if(n<=0){if(e._fl){e._fl.remove();e._fl=null;}return;}
  if(!e._fl||!e._fl.isConnected){
    var clip=document.createElement('div');clip.className='flour-in';
    clip.style.cssText='position:absolute;left:'+INNER.l+'%;top:'+INNER.t+'%;width:'+(INNER.r-INNER.l)+'%;height:'+(INNER.b-INNER.t)+'%;border-radius:38% / 18%;overflow:hidden;pointer-events:none;z-index:3';
    var im=document.createElement('img');im.src=IMG.pile;im.draggable=false;im.style.cssText='position:absolute;left:50%;top:62%;transform:translate(-50%,-62%);user-select:none';
    clip.appendChild(im);e.appendChild(clip);e._fl=clip;e._flImg=im;
  }
  var st=n<35?'pile':(n<110?'pile2':'pile3');
  if(e._flSt!==st){e._flSt=st;e._flImg.src=IMG[st];}
  e._flImg.style.width=Math.min(96,24+Math.pow(Math.min(n,300),.6)*7.6)+'%';
}
setInterval(function(){(typeof items!=='undefined'?items:[]).forEach(function(e){if(e&&e.dataset&&e.dataset.itemId===TR&&((+e.dataset.inFlour||0)>0||e._fl))drawTrough(e);});},700);
function isSack(el){return !!el&&el.dataset&&el.dataset.itemId===SACK;}
function bodies(){
  var out=[],h=typeof holding!=='undefined'?holding:null;
  if(h){var b=h.querySelector('.body');if(b)out.push(b);}
  var g=typeof placementGhost!=='undefined'?placementGhost:null;
  if(g){var c=g.querySelector('.ghost-item-copy .body');if(c)out.push(c);}
  if(h&&h._contactShadow)h._contactShadow.querySelectorAll('img').forEach(function(i){out.push(i);});   /* the shadow follows the picture */
  return out;
}
function setPic(which){
  bodies().forEach(function(b){
    if(!b._orig)b._orig=b.getAttribute('src');
    var src=which?IMG[which]:b._orig;if(b.getAttribute('src')!==src)b.setAttribute('src',src);
    b.style.transformOrigin='50% 100%';b.style.transform=which?'scale('+(which==='a'?1.28:1.45)+')':'';
  });
  document.querySelectorAll('.cookster-backpack-held-preview').forEach(function(e){if(which)e.style.setProperty('display','none','important');else e.style.removeProperty('display');});   /* the small upright preview of the sack in the backpack mode */
}
function remaining(el){var v=+el.dataset.flour;return isFinite(v)&&el.dataset.flour!==undefined?v:SACK_MAX;}
function tableSpot(){
  var st=typeof placementState!=='undefined'?placementState:null,c=st&&st.candidate;
  if(!c||c.inSurface===false||c.zone==='outside'||!isFinite(c.cx)||!isFinite(c.by))return null;
  return c;
}
// ---- the animation of the pouring: grains fall from the mouth of the sack to the table, and where they land a little cloud of flour dust rises ----
var grains=[],layer=null,puffAt=0;
function fxLayer(){
  var sc=scn();if(!sc)return null;
  if(!layer||!layer.isConnected){layer=document.createElement('div');layer.style.cssText='position:absolute;left:0;top:0;width:0;height:0;pointer-events:none;z-index:9500';sc.appendChild(layer);}
  return layer;
}
function mouthPoint(){
  var g=typeof placementGhost!=='undefined'?placementGhost:null,b=g&&g.querySelector('.ghost-item-copy .body');
  if(!b||typeof screenToScene!=='function')return null;
  var r=b.getBoundingClientRect();if(!r.width)return null;
  return screenToScene(r.left+r.width*.60,r.top+r.height*.52);
}
function spawnGrains(m,land,k){
  var L=fxLayer();if(!L)return;
  for(var i=0;i<k&&grains.length<110;i++){
    var d=document.createElement('i'),sz=2+Math.random()*3.2;
    d.style.cssText='position:absolute;border-radius:50%;background:#f7f0e2;box-shadow:0 0 2px rgba(255,255,255,.8);width:'+sz+'px;height:'+sz+'px;opacity:.95';
    L.appendChild(d);
    var dx=land.x-m.x,dy=land.y-m.y,T=.34+Math.random()*.16;
    grains.push({el:d,x:m.x+(Math.random()-.5)*14,y:m.y+(Math.random()-.5)*8,vx:dx/T+(Math.random()-.5)*26,vy:(dy-.5*620*T*T)/T,ly:land.y+(Math.random()-.5)*8,sz:sz});
  }
}
function puff(land,big){
  var L=fxLayer();if(!L)return;
  var n=big?3:2;
  for(var i=0;i<n;i++){
    var e=document.createElement('div'),w=34+Math.random()*34+(big?18:0);
    e.style.cssText='position:absolute;left:'+(land.x+(Math.random()-.5)*46)+'px;top:'+(land.y-4-Math.random()*8)+'px;width:'+w+'px;height:'+(w*.72)+'px;margin:'+(-w*.36)+'px 0 0 '+(-w/2)+'px;border-radius:50%;background:radial-gradient(ellipse at 50% 55%,rgba(255,252,244,.62),rgba(255,250,240,.28) 55%,rgba(255,250,240,0) 74%);filter:blur(1.2px)';
    L.appendChild(e);
    var dx=(Math.random()-.5)*70,dy=-(26+Math.random()*34);
    var a=e.animate([{transform:'translate(0,0) scale(.35)',opacity:0},{transform:'translate('+dx*.35+'px,'+dy*.4+'px) scale(1)',opacity:.85,offset:.28},{transform:'translate('+dx+'px,'+dy+'px) scale(1.9)',opacity:0}],{duration:900+Math.random()*500,easing:'cubic-bezier(.2,.6,.3,1)',fill:'forwards'});
    a.onfinish=function(ev){return function(){ev.remove();};}(e);
  }
}
function stepGrains(dt,land){
  grains=grains.filter(function(g){
    g.vy+=620*dt;g.x+=g.vx*dt;g.y+=g.vy*dt;
    if(g.y>=g.ly){g.el.remove();
      if(Math.random()<.5&&land){var s2=document.createElement('i');s2.style.cssText='position:absolute;border-radius:50%;background:#f7f0e2;width:2px;height:2px;left:'+g.x+'px;top:'+g.y+'px';var L=fxLayer();if(L){L.appendChild(s2);var a=s2.animate([{transform:'translate(0,0)',opacity:.9},{transform:'translate('+((Math.random()-.5)*46)+'px,'+(-8-Math.random()*14)+'px)',opacity:0}],{duration:420,fill:'forwards'});a.onfinish=function(){s2.remove();};}}
      return false;}
    g.el.style.transform='translate('+g.x+'px,'+g.y+'px)';return true;});
}
function frame(now){
  if(!pour)return;
  var h=typeof holding!=='undefined'?holding:null;
  if(!h||h!==pour.el){stop();return;}
  var dt=Math.min(.05,(now-pour.last)/1000);pour.last=now;pour.t+=dt;
  var left=remaining(h);
  if(left<=0){try{showToast('Džak je prazan.');}catch(e){}stop();return;}
  setPic(pour.t<.35?'a':'b');
  var c=tableSpot();
  if(c&&pour.t>.35){
    var n=Math.min(left,RATE*dt);
    var w=c.w||140,hh=c.h||110;
    var lx=c.cx+w*.34,ly=c.by-hh*.04,tr=troughAt(lx,ly),p,land;
    if(tr){                                       // into the trough
      tr.dataset.inFlour=String(Math.min(300,(+tr.dataset.inFlour||0)+n));drawTrough(tr);
      var tb=tr.getBoundingClientRect(),tp=screenToScene(tb.left+tb.width*.5,tb.top+tb.height*.5);
      p={x:tp.x,y:tp.y};land={x:lx,y:ly};
    }else{p=addFlour(lx,ly,n);land={x:p.x,y:p.y};}
    var m=mouthPoint();
    if(m){spawnGrains(m,land,3);if(now-puffAt>150){puffAt=now;puff(land,pour.t<1);}}
    h.dataset.flour=String(left-n);
    pour.pile=p;
  }
  stepGrains(dt,pour.pile?{x:pour.pile.x,y:pour.pile.y}:null);
  requestAnimationFrame(frame);
}
function start(el){
  if(pour)return;
  pour={el:el,t:0,last:performance.now(),pile:null};
  try{if(typeof playImpactSound==='function')playImpactSound(el,'pour');}catch(e){}
  requestAnimationFrame(frame);
}
function stop(){
  if(!pour)return;pour=null;setPic(null);
  (function drain(){var t0=performance.now();(function f(n){stepGrains(Math.min(.05,(n-t0)/1000>.05?.016:.016),null);if(grains.length&&n-t0<900)requestAnimationFrame(f);else{grains.forEach(function(g){g.el.remove();});grains=[];}})(t0);})();
  bodies().forEach(function(b){delete b._orig;});
  save();try{CooksterSave.schedule();}catch(e){}
}
// the sack in the hand: left button = pour, right button = put it down (capture phase: before the game takes the click as "put down")
window.addEventListener('pointerdown',function(e){
  var h=typeof holding!=='undefined'?holding:null;if(!isSack(h))return;
  if(e.target&&e.target.closest&&e.target.closest('#hud,[data-tool-ui],.cookster-ctx,#toolDock'))return;
  if(e.button===0){
    if(!tableSpot())return;           // not above the table: the normal behaviour (put down / nothing)
    e.stopImmediatePropagation();e.preventDefault();hold=e.pointerId;start(h);
  }else if(e.button===2){
    e.stopImmediatePropagation();e.preventDefault();stop();try{dropHolding();}catch(x){}
  }
},true);
window.addEventListener('pointerup',function(e){if(pour&&e.button===0){e.stopImmediatePropagation();stop();}},true);
window.addEventListener('click',function(e){if(hold!==null&&e.button===0){hold=null;e.stopImmediatePropagation();}},true);
window.addEventListener('contextmenu',function(e){var h=typeof holding!=='undefined'?holding:null;if(isSack(h))e.preventDefault();},true);
window.CooksterFlour={piles:function(){return piles.map(function(p){return {x:p.x,y:p.y,n:p.n};});},clear:function(){piles.forEach(function(p){if(p.el)p.el.remove();});piles=[];save();}};
})();
