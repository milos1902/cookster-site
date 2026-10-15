/* Flour: the sack of flour (kal_01_dzak_brasna) is poured on the table.
   Take the sack (left click). With the sack in the hand the LEFT button held down = it tilts and the flour pours out on the table where the stream lands;
   the RIGHT button puts the sack down. The flour makes a pile that grows (assets/flour/gomila.webp). The flour on the table is NOT remembered: when the game is refreshed the table is clean again. */
(function(){
'use strict';
if(window.CooksterFlour)return;
var SACK='kal_01_dzak_brasna',KEY='cookster.flour-piles.v1',RATE=9,SACK_MAX=300;     // units of flour per second; one sack
var IMG={a:'assets/flour/dzak_nagnut1.webp?v=1',b:'assets/flour/dzak_nagnut2.webp?v=1',pile:'assets/flour/gomila.webp?v=1',pile2:'assets/flour/gomila2.webp?v=1',pile3:'assets/flour/gomila3.webp?v=1'};
var piles=[],pour=null,hold=null;
try{localStorage.removeItem(KEY);}catch(e){}     // the table does not remember the flour: an old saved pile is thrown away
function save(){}
[IMG.a,IMG.b,IMG.pile,IMG.pile2,IMG.pile3].forEach(function(s){var i=new Image();i.src=s;});
function scn(){return document.getElementById('scene');}
/* The table gets white where the flour is worked: a canvas under the objects on which small white specks and soft blots are added around the trough.
   It is not saved (after a refresh the table is clean again). */
(function(){var st=document.createElement('style');st.textContent='.item:not(.ghost-item-copy) .dough-img{transition:opacity .35s ease}';document.head.appendChild(st);})();
function setO(im,v){if(!im)return;im.style.opacity=String(v);im.style.display=v>.01?'':'none';}   // the copy of a trough in the hand forces opacity 1 on every picture (css/game.css), so a hidden picture is display:none
var dcv=null,dcx=null;
function dustLayer(){
  var sc=scn();if(!sc)return null;
  if(!dcv||!dcv.isConnected){
    dcv=document.createElement('canvas');dcv.width=Math.max(300,sc.offsetWidth||1672);dcv.height=Math.max(200,sc.offsetHeight||941);
    dcv.style.cssText='position:absolute;left:0;top:0;width:'+dcv.width+'px;height:'+dcv.height+'px;pointer-events:none;z-index:30';   // above the picture of the table (the layer of the table is z 25), below the objects
    sc.appendChild(dcv);dcx=dcv.getContext('2d');
  }
  return dcx;
}
function dustAt(x,y,rx,ry,n){        // x,y: scene; rx,ry: the size of the spot; n: how many specks. Only fine dust: tiny specks, thinner towards the edge, never a solid patch
  var c=dustLayer();if(!c)return;
  for(var i=0;i<n;i++){
    var a=Math.random()*6.283,r=Math.pow(Math.random(),.65),px=x+Math.cos(a)*r*rx,py=y+Math.sin(a)*r*ry;
    var fade=1-r*.7,sz=.5+Math.random()*1.1;
    c.fillStyle='rgba(255,'+(248+Math.floor(Math.random()*7))+','+(236+Math.floor(Math.random()*14))+','+((.18+Math.random()*.4)*fade).toFixed(2)+')';
    c.beginPath();c.ellipse(px,py,sz,sz*.75,0,0,7);c.fill();
  }
}
function dustTrough(tr,n){            // the place on the table around a trough
  try{var r=tr.getBoundingClientRect(),a=screenToScene(r.left,r.top),b=screenToScene(r.right,r.bottom),w=b.x-a.x,h=b.y-a.y;
    dustAt((a.x+b.x)/2,a.y+h*.6,w*1.1,h*.38,n);}catch(e){}
}
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
/* The dough can always be made: the ratio water : flour decides the state, and the player corrects it (dry: add water, too soft: add flour).
   units: the sack gives flour, a full pitcher is 100 units of water; a good dough is about 0.6 water for 1 flour (0.45 to 0.8). */
var R_DRY=.45,R_WET=.8;
function doughState(e){
  var F=+e.dataset.inFlour||0,W=+e.dataset.inWater||0,r=F>0?W/F:(W>0?9:0);
  var st=F<3&&W<3?'empty':(W<1?'flour':(F<3?'water':(r<R_DRY?'dry':(r>R_WET?'wet':'good'))));
  return {F:F,W:W,r:r,st:st};
}
var ST_TXT={flour:'brašno',water:'voda',dry:'suvo, dodaj vode',good:'dobro testo',wet:'previše meko, dodaj brašna'};
function drawTrough(e){
  var D=doughState(e),n=D.F;
  if(!e._lbl||!e._lbl.isConnected){var l=document.createElement('div');l.className='dough-lbl';l.style.cssText='position:absolute;left:50%;top:-4%;transform:translate(-50%,-100%);font:700 10px/1.1 system-ui,sans-serif;color:#fff;text-shadow:0 0 3px #000,0 1px 2px #000;white-space:nowrap;pointer-events:none;z-index:6;text-align:center';e.appendChild(l);e._lbl=l;}
  e._lbl.textContent=D.st==='empty'?'':(ST_TXT[D.st]+'  ·  brašno '+Math.round(D.F)+' · voda '+Math.round(D.W));
  e._lbl.style.color=D.st==='good'?'#bff5b8':(D.st==='dry'||D.st==='wet'?'#ffd48a':'#fff');
  if(D.W>0&&(!e._wt||!e._wt.isConnected)){
    var wcl=document.createElement('div');wcl.style.cssText='position:absolute;left:'+INNER.l+'%;top:'+INNER.t+'%;width:'+(INNER.r-INNER.l)+'%;height:'+(INNER.b-INNER.t)+'%;border-radius:38% / 18%;overflow:hidden;pointer-events:none;z-index:2';
    var wd=document.createElement('div');wd.style.cssText='position:absolute;left:50%;top:50%;width:30%;height:30%;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(ellipse at 40% 32%,rgba(250,254,255,.92),rgba(222,240,250,.82) 40%,rgba(190,222,240,.78) 100%);box-shadow:inset 0 0 10px rgba(255,255,255,.6),inset 0 -2px 6px rgba(120,170,205,.35);transition:width .7s ease,height .7s ease,opacity .5s';
    wcl.appendChild(wd);e.appendChild(wcl);e._wt=wcl;e._wd=wd;
  }
  if(e._wt){e._wt.style.display=(D.W>0&&D.F<3)?'':'none';   // the flour covers the water: with flour in the trough the water is not drawn, the picture of the wet flour shows it
   if(e._wd){var sp=Math.max(0,Math.min(1,D.W/60));e._wd.style.width=(30+sp*50)+'%';e._wd.style.height=(22+sp*28)+'%';}   // the water spreads as there is more of it, but only up to the half of the length of the trough (not to the edges)
    if(e._wd)e._wd.style.opacity=String(Math.min(.95,.25+D.W/90)*(D.st==='good'?.45:(D.st==='wet'?1:.8)));}
  // the picture of the trough itself shows the flour (the pictures drawn by the owner)
  var tb=e.querySelector('.body');
  if(tb){var want=(D.W>=1&&D.F>=3)||n<=0?'assets/flour/nacve.webp':(n<120?'assets/flour/nacve_brasno1.webp':'assets/flour/nacve_brasno2.webp');
    if(tb.getAttribute('src')!==want){
      var old=tb.getAttribute('src');
      // the new picture does not jump in: the old one melts away behind a cloud of flour dust
      var ov=document.createElement('img');ov.className='flour-ov';ov.src=old;ov.draggable=false;ov.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:4';
      e.appendChild(ov);var oa=ov.animate([{opacity:1},{opacity:1,offset:.35},{opacity:0}],{duration:1500,fill:'forwards'});oa.onfinish=function(){ov.remove();};
      tb.setAttribute('src',want);
      for(var k=0;k<7;k++){
        var c=document.createElement('div'),w=34+Math.random()*30;
        c.style.cssText='position:absolute;left:'+(26+Math.random()*48)+'%;top:'+(22+Math.random()*58)+'%;width:'+w+'%;height:'+(w*.55)+'%;margin:'+(-w*.28)+'% 0 0 '+(-w/2)+'%;border-radius:50%;background:radial-gradient(ellipse,rgba(255,252,244,.9),rgba(255,250,240,.5) 55%,rgba(255,250,240,0) 75%);filter:blur(3px);pointer-events:none;z-index:5;opacity:0';
        e.appendChild(c);
        var ca=c.animate([{opacity:0,transform:'scale(.4)'},{opacity:.95,transform:'scale(1.1)',offset:.3},{opacity:.7,transform:'translateY(-12%) scale(1.5)',offset:.65},{opacity:0,transform:'translateY(-30%) scale(1.9)'}],{duration:1500+Math.random()*500,delay:Math.random()*200,fill:'forwards'});
        ca.onfinish=function(x){return function(){x.remove();};}(c);
      }
    }}
  if(e._fl){e._fl.remove();e._fl=null;}
  // the dough appears only by mixing (the flour and the water that are already in the trough), not by pouring: the picture of the dough melts in as the mixing goes
  var mx=Math.min(1,+e.dataset.inMix||0);
  // the dough is a picture of its own (without the trough), so that only the dough can stretch while the trough stays still:
  // the wet flour (flour and water in the trough) -> the lumpy mass -> the smooth ball; when it is pulled the ball turns into the long dough
  if(!e._dw||!e._dw.isConnected){
    var dw=document.createElement('div');dw.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:3;clip-path:inset('+(INNER.t+1)+'% '+(100-INNER.r+1)+'% '+(100-INNER.b+1)+'% '+(INNER.l+1)+'% round 38% / 18%)';
    var dg=document.createElement('div');dg.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%';dw.appendChild(dg);
    e._dl={};[['smesa',58],['grudve',70],['kugla',46],['razvuceno',68]].forEach(function(q){
      var im=document.createElement('img');im.src='assets/flour/testo_'+q[0]+'.webp?v=1';im.draggable=false;
      im.className='dough-img';im.style.cssText='position:absolute;left:50%;top:46%;height:'+q[1]+'%;width:auto;transform:translate(-50%,-50%);opacity:0;display:none';dg.appendChild(im);e._dl[q[0]]=im;});
    e.appendChild(dw);e._dw=dw;e._dg=dg;
  }
  var wetF=D.W>=1&&D.F>=3,stage=mx<1?0:1,meshOn=false;      // stages: 0 wet flour (7 s of kneading), 1 the dough (it first appears stretched)
  if(window.CooksterDoughMesh){if(wetF)meshOn=CooksterDoughMesh.setStage(e,stage,D.F);else CooksterDoughMesh.hide(e);}
  // reserve (when WebGL is not there): the plain pictures
  e._o={kugla:0};
  setO(e._dl.smesa,(wetF&&!meshOn&&stage===0)?1:0);setO(e._dl.grudve,0);setO(e._dl.razvuceno,(wetF&&!meshOn&&stage===1)?1:0);setO(e._dl.kugla,0);
  e._dl.smesa.style.height=(48+Math.min(1,D.F/200)*16)+'%';      // the wet flour fills the opening like the flour did (it grows with the amount of the flour)
  return;
  if(!e._fl||!e._fl.isConnected){
    var clip=document.createElement('div');clip.className='flour-in';
    clip.style.cssText='position:absolute;left:'+INNER.l+'%;top:'+INNER.t+'%;width:'+(INNER.r-INNER.l)+'%;height:'+(INNER.b-INNER.t)+'%;border-radius:38% / 18%;overflow:hidden;pointer-events:none;z-index:3';
    var im=document.createElement('img');im.src=IMG.pile;im.draggable=false;im.style.cssText='position:absolute;left:50%;top:62%;transform:translate(-50%,-62%);user-select:none';
    clip.appendChild(im);e.appendChild(clip);e._fl=clip;e._flImg=im;
  }
  var st=n<35?'pile':(n<110?'pile2':'pile3');
  if(e._flSt!==st){e._flSt=st;e._flImg.src=IMG[st];}
  e._flImg.style.width=Math.min(96,24+Math.pow(Math.min(n,300),.6)*7.6)+'%';
  e._flImg.style.filter=D.st==='wet'?'brightness(.78) saturate(1.1) contrast(1.05)':(D.st==='good'?'brightness(.88) sepia(.12)':(D.st==='dry'?'brightness(.94) contrast(1.08)':''));
}
setInterval(function(){(typeof items!=='undefined'?items:[]).forEach(function(e){if(e&&e.dataset&&e.dataset.itemId===TR&&((+e.dataset.inFlour||0)>0||(+e.dataset.inWater||0)>0||e._fl))drawTrough(e);});},700);
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
  setPic('b');      // straight to the pouring picture (no middle picture)
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
    if(tr)dustTrough(tr,3);else dustAt(land.x,land.y,60,22,2);
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
// ---- mixing: the stirring spoon in the hand, LEFT button held, moved over the trough; the flour and the water become a dough (only when the ratio is right) ----
var mixP=null;
window.addEventListener('pointerdown',function(e){
  var h=typeof holding!=='undefined'?holding:null;if(e.button!==0||h)return;     // by hand: nothing in the hand
  if(e.target&&e.target.closest&&e.target.closest('#hud,[data-tool-ui],.cookster-ctx,#toolDock'))return;
  var sp=screenToScene(e.clientX,e.clientY),tr=troughAt(sp.x,sp.y);if(!tr)return;
  var D=doughState(tr);if(D.st==='empty'||D.st==='flour'||D.st==='water')return;   // an empty trough or only one thing in it: the normal click (picking it up)
  // the hand is only on the dough itself (an ellipse in the middle of the opening); the rim and the empty places of the trough still pick the trough up
  var br=tr.getBoundingClientRect(),nx=(e.clientX-br.left)/br.width-.5,ny=(e.clientY-br.top)/br.height-.46;
  if((nx/.3)*(nx/.3)+(ny/.3)*(ny/.3)>1)return;
  e.stopImmediatePropagation();e.preventDefault();
  if(D.st==='dry'){try{showToast('Suvo je, dodaj još vode.');}catch(x){}}
  if(D.st==='wet'){try{showToast('Previše je meko, dodaj još brašna.');}catch(x){}}
  mixP={tr:tr,x:e.clientX,y:e.clientY,t:performance.now()};
  try{CooksterDoughMesh.grab(tr,e.clientX,e.clientY);}catch(x){}
  knMove(tr,e,0,0,true);
},true);
/* The kneading hand, drawn in code (no video): it follows the mouse inside the opening of the trough and presses the dough; every bit of movement kneads (up-down counts fully, left-right a quarter), so going up-down-up-down gets to the end. The dough picture is pushed a little by the hand and a puff of flour rises now and then. */
/* the two pictures of the hand (open and pressed): the same place on both, so the swap does not jump */
var HAND_IMG=['assets/flour/ruka1.webp?v=2','assets/flour/ruka2.webp?v=2'];
HAND_IMG.forEach(function(u){var i=new Image();i.src=u;});
function knLayer(tr){
  if(tr._kn&&tr._kn.isConnected)return tr._kn;
  /* a window the size of the trough opening (it goes on down, so the arm can come from the front): the hand never goes out of the sides */
  var w=document.createElement('div');w.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:7;clip-path:polygon('+INNER.l+'% '+INNER.t+'%,'+INNER.r+'% '+INNER.t+'%,'+INNER.r+'% 140%,'+INNER.l+'% 140%)';
  var h=document.createElement('div');h.style.cssText='position:absolute;left:0;top:0;width:'+(tr.offsetWidth*.62)+'px;opacity:0;transition:opacity .2s;transform-origin:49% 22%;will-change:transform';
  h.innerHTML='<img draggable="false" src="'+HAND_IMG[0]+'" style="display:block;width:100%;user-select:none"><img draggable="false" src="'+HAND_IMG[1]+'" style="position:absolute;left:0;top:0;width:100%;opacity:0;user-select:none">';
  h._p=h.children[1];w.appendChild(h);tr.appendChild(w);tr._kn=h;return h;
}
/* the dough stretches the way the hand pulls it: going up it stretches upwards, going down downwards (and gets thinner), then it springs back */
function knStretch(tr,vy,vx){
  var st=tr._st||(tr._st={s:0,v:0,t:0,run:false});
  st.v+=Math.max(-30,Math.min(30,vy))*.03;      // the pull
  if(!st.run){st.run=true;st.t=performance.now();requestAnimationFrame(function f(now){
    var dt=Math.min(.05,(now-st.t)/1000);st.t=now;
    st.v+=(-st.s*90-st.v*9)*dt;st.s+=st.v*dt;st.s=Math.max(-.22,Math.min(.22,st.s));   // the spring
    var a=Math.abs(st.s),o=st.s<0?'50% 100%':'50% 0%',tf=a<.002?'':'scale('+(1-a*.35)+','+(1+a*.9)+')';   // going up: it grows upwards from its bottom
    if(tr._dg){tr._dg.style.transformOrigin=o;tr._dg.style.transform=tf;}
    tr._ks=Math.min(1,a*5);                                    // the ball turns into the long dough while it is pulled
    if(tr._dl&&tr._o){setO(tr._dl.kugla,tr._o.kugla*(1-tr._ks));setO(tr._dl.razvuceno,tr._o.kugla*tr._ks);}
    if(a>.002||Math.abs(st.v)>.01)requestAnimationFrame(f);else{st.run=false;st.s=st.v=0;tr._ks=0;if(tr._dg)tr._dg.style.transform='';if(tr._dl&&tr._o){setO(tr._dl.kugla,tr._o.kugla);setO(tr._dl.razvuceno,0);}}
  });}
}
function knMove(tr,e,vx,vy,shaping){
  var h=knLayer(tr),r=tr.getBoundingClientRect(),k=r.width/(tr.offsetWidth||1)||1,W=tr.offsetWidth,H=tr.offsetHeight;
  var px=Math.max(W*(INNER.l+12)/100,Math.min(W*(INNER.r-12)/100,(e.clientX-r.left)/k)),py=Math.max(H*INNER.t/100+W*.62*.93*.9,Math.min(H*(INNER.b-2)/100,(e.clientY-r.top)/k));   // the fingers stay inside the opening
  var hw=W*.62,hh=hw*1804/420,rot=Math.max(-12,Math.min(12,vx*.5)),sc=1-Math.max(-.05,Math.min(.05,vy*.003));
  if(vy>1.5)h._pt=performance.now();var pr=(performance.now()-(h._pt||0)<160);h._p.style.opacity=pr?'1':'0';h.children[0].style.opacity=pr?'0':'1';   // the pressed hand while it goes down
  h.style.opacity='1';h.style.transform='translate('+(px-hw*.49)+'px,'+(py-hh*.222)+'px) rotate('+rot+'deg) scale('+sc+')';
  if(!shaping)knStretch(tr,vy,vx);
  var now=performance.now();
  if(now-(tr._puff||0)>260&&Math.abs(vy)+Math.abs(vx)>3){tr._puff=now;
    var c=document.createElement('div'),sz=12+Math.random()*10;
    c.style.cssText='position:absolute;left:'+(px-sz/2+(Math.random()-.5)*18)+'px;top:'+(py-sz/2+(Math.random()-.5)*14)+'px;width:'+sz+'px;height:'+sz*.7+'px;border-radius:50%;background:radial-gradient(ellipse,rgba(255,252,244,.85),rgba(255,250,240,0) 70%);filter:blur(1.5px);pointer-events:none;z-index:8';
    dustTrough(tr,6);
    tr.appendChild(c);var a=c.animate([{opacity:.9,transform:'scale(.5)'},{opacity:0,transform:'translateY(-14px) scale(1.7)'}],{duration:700,fill:'forwards'});a.onfinish=function(){c.remove();};}
}
window.addEventListener('pointermove',function(e){
  if(!mixP)return;var vy=e.clientY-mixP.y,vx=e.clientX-mixP.x,d=Math.hypot(vx,vy),tr=mixP.tr;mixP.x=e.clientX;mixP.y=e.clientY;
  var tnow=performance.now(),dt=Math.min(.08,(tnow-mixP.t)/1000);mixP.t=tnow;
  try{CooksterDoughMesh.drag(tr,e.clientX,e.clientY);}catch(x){}           // the hand pulls the dough, the points follow it and stay
  var D=doughState(tr);
  if(D.st!=='good'){tr.dataset.inMix=String(Math.max(0,(+tr.dataset.inMix||0)-d/6000));drawTrough(tr);knMove(tr,e,vx,vy,true);return;}
  if(d>1.5){            // after 7 seconds of kneading (only while the mouse moves) the wet flour becomes the dough
    var was=+tr.dataset.inMix||0,T=Math.min(7,was*7+dt),nm=T/7;
    if(nm>=1&&was<1){try{showToast('Testo je zamešeno. Oblikuj ga rukom u loptu.');}catch(x){}}
    tr.dataset.inMix=String(nm);drawTrough(tr);
  }
  knMove(tr,e,vx,vy,true);
},true);
window.addEventListener('pointerup',function(e){if(mixP&&e.button===0){if(mixP.tr._kn)mixP.tr._kn.style.opacity='0';try{CooksterDoughMesh.release(mixP.tr);}catch(x){}mixP=null;try{CooksterSave.schedule();}catch(x){}}},true);
window.CooksterFlour={troughAt:troughAt,addWater:function(tr,units){tr.dataset.inWater=String(Math.min(400,(+tr.dataset.inWater||0)+units));drawTrough(tr);},dough:function(){var e=(typeof items!=='undefined'?items:[]).filter(function(x){return x.dataset&&x.dataset.itemId===TR;}).pop();return e?doughState(e):null;},piles:function(){return piles.map(function(p){return {x:p.x,y:p.y,n:p.n};});},clear:function(){piles.forEach(function(p){if(p.el)p.el.remove();});piles=[];save();}};
})();
