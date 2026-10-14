/* Flour: the sack of flour (kal_01_dzak_brasna) is poured on the table.
   Take the sack (left click). With the sack in the hand the LEFT button held down = it tilts and the flour pours out on the table where the stream lands;
   the RIGHT button puts the sack down. The flour makes a pile that grows (assets/flour/gomila.webp). The piles are saved in this browser (cookster.flour-piles.v1). */
(function(){
'use strict';
if(window.CooksterFlour)return;
var SACK='kal_01_dzak_brasna',KEY='cookster.flour-piles.v1',RATE=9,SACK_MAX=300;     // units of flour per second; one sack
var IMG={a:'assets/flour/dzak_nagnut1.webp?v=1',b:'assets/flour/dzak_nagnut2.webp?v=1',pile:'assets/flour/gomila.webp?v=1'};
var piles=[],pour=null,hold=null;
try{var raw=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(raw))piles=raw.filter(function(p){return p&&isFinite(p.x)&&isFinite(p.y)&&p.n>0;});}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(piles.map(function(p){return {x:p.x,y:p.y,n:p.n};})));}catch(e){}}
[IMG.a,IMG.b,IMG.pile].forEach(function(s){var i=new Image();i.src=s;});
function scn(){return document.getElementById('scene');}
function pileW(n){return 46+Math.pow(Math.min(n,200),.62)*7.2;}   // pile width in the pixels of the scene (a little flour = a small heap, 100 units about 170 px)
function drawPile(p){
  var sc=scn();if(!sc)return;
  if(!p.el||!p.el.isConnected){p.el=document.createElement('img');p.el.src=IMG.pile;p.el.draggable=false;p.el.className='flour-pile';p.el.style.cssText='position:absolute;pointer-events:none;transform:translate(-50%,-72%);user-select:none';sc.appendChild(p.el);}
  var vis=1;try{vis=surfaceScaleFor({dataset:{itemId:SACK,surfaceZone:'table'}},'table',p.y)||1;}catch(e){}
  var w=pileW(p.n)*vis;p.el.style.left=p.x+'px';p.el.style.top=p.y+'px';p.el.style.width=w+'px';p.el.style.zIndex=String(Math.floor(p.y)+2);
}
function addFlour(x,y,n){
  var best=null,bd=60;
  piles.forEach(function(p){var d=Math.hypot(p.x-x,(p.y-y)*1.6);if(d<bd){bd=d;best=p;}});
  if(!best){best={x:x,y:y,n:0};piles.push(best);}
  best.n=Math.min(260,best.n+n);drawPile(best);return best;
}
piles.forEach(function(p){setTimeout(function(){drawPile(p);},0);});
setInterval(function(){piles.forEach(function(p){if(p.el&&!p.el.isConnected)p.el=null;if(!p.el)drawPile(p);});},1500);

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
    var p=addFlour(c.cx+w*.34,c.by-hh*.04,n);   // the stream lands at the lower right of the tilted sack
    h.dataset.flour=String(left-n);
    pour.pile=p;
  }
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
