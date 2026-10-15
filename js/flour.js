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
/* The yeast: one measure per batch. First it wakes up in a small starter (a little water, a little flour, a little sugar, stirred with the spoon, then a short wait);
   only then the right amount of flour and water is added. Without a live yeast the dough can be kneaded but it will not rise (y: none / sleep / alive / dead). */
var T_MIN=28,T_MAX=45,ST_F=14,ST_W=50,STIR_PX=1200,WAKE_S=25;
function doughState(e){
  var F=+e.dataset.inFlour||0,W=+e.dataset.inWater||0,r=F>0?W/F:(W>0?9:0);
  var Y=+e.dataset.inYeast>0,act=(+e.dataset.inStarter||0)>=1,sg=+e.dataset.inSugar||0;
  var T=e.dataset.inWaterT!=null?+e.dataset.inWaterT:15,y=!Y?'none':(e.dataset.inYeastDead==='1'?'dead':(act?'alive':'sleep'));
  var st=F<3&&W<3?'empty':(W<1?'flour':(F<3?'water':(r<R_DRY?'dry':(r>R_WET?'wet':'good'))));
  if((y==='sleep'||y==='alive')&&F<=ST_F&&W<=ST_W)st='starter';
  return {F:F,W:W,r:r,st:st,y:y,sugar:sg,T:T,small:F<=ST_F&&W<=ST_W};
}
var ST_TXT={flour:'brašno',water:'voda',dry:'suvo, dodaj vode',good:'dobro testo',wet:'previše meko, dodaj brašna',starter:'kvasac'};
var CLOTH='assets/calibration_props/krpa/krpa.webp?v=1',RISE_S=45,KRPA='kal_krpa';
(function(){var i=new Image();i.src=CLOTH;})();
function riseTf(e){var r=Math.min(1,+e.dataset.inRise||0);return r>.002?'scale('+(1+.45*r).toFixed(3)+')':'';}   // the dough that has risen is bigger (it grows from its bottom)
function starterTxt(e,D){
  var need=[];if(D.W<10)need.push('voda');if(D.F<3)need.push('brašno');if(D.sugar<1)need.push('šećer');
  if(need.length)return 'kvasac · fali: '+need.join(', ');
  var sr=+e.dataset.inStir||0,wk=+e.dataset.inStarter||0;
  if(D.y==='alive')return 'kvasac je živ · dodaj brašno i vodu';
  if(sr<1)return 'kvasac · promešaj kašikom '+Math.round(sr*100)+'%';
  if(D.T<T_MIN)return 'kvasac · voda je hladna, dodaj mlaku';
  return 'kvasac se budi · '+Math.max(1,Math.ceil((1-wk)*WAKE_S))+' s';
}
(function(){var st=document.createElement('style');st.textContent='@keyframes yb{0%{transform:translateY(30%) scale(.5);opacity:0}30%{opacity:.9}100%{transform:translateY(-120%) scale(1.15);opacity:0}}';document.head.appendChild(st);})();
function drawTrough(e){
  var D=doughState(e),n=D.F;
  if(!e._lbl||!e._lbl.isConnected){var l=document.createElement('div');l.className='dough-lbl';l.style.cssText='position:absolute;left:50%;top:-4%;transform:translate(-50%,-100%);font:700 10px/1.1 system-ui,sans-serif;color:#fff;text-shadow:0 0 3px #000,0 1px 2px #000;white-space:nowrap;pointer-events:none;z-index:6;text-align:center';e.appendChild(l);e._lbl=l;}
  if(D.y==='sleep'&&(D.F>ST_F||D.W>ST_W||(D.W>=3&&D.T>T_MAX))){e.dataset.inYeastDead='1';D=doughState(e);}   // too much flour or water before the yeast woke up: it does not work any more
  var yTxt=D.y==='alive'?'  ·  kvasac živ':(D.y==='dead'?'  ·  kvasac nije oživeo, testo se neće dići':(D.y==='none'?'  ·  bez kvasca se neće dići':''));
  e._lbl.textContent=D.st==='empty'?(D.y==='sleep'?'kvasac u naćvama':''):(D.st==='starter'?starterTxt(e,D):((D.small&&D.y==='none'?'malo brašna i vode':ST_TXT[D.st])+(D.st==='good'?'  ·  umešeno '+Math.round(Math.min(1,+e.dataset.inMix||0)*100)+'%':'')+'  ·  brašno '+Math.round(D.F)+' · voda '+Math.round(D.W)+yTxt));
  e._lbl.style.color=D.st==='good'?'#bff5b8':(D.st==='dry'||D.st==='wet'?'#ffd48a':'#fff');
  if(D.W>0&&(!e._wt||!e._wt.isConnected)){
    var wcl=document.createElement('div');wcl.style.cssText='position:absolute;left:'+INNER.l+'%;top:'+INNER.t+'%;width:'+(INNER.r-INNER.l)+'%;height:'+(INNER.b-INNER.t)+'%;border-radius:38% / 18%;overflow:hidden;pointer-events:none;z-index:2';
    var wd=document.createElement('div');wd.style.cssText='position:absolute;left:50%;top:50%;width:30%;height:30%;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(ellipse at 40% 32%,rgba(250,254,255,.92),rgba(222,240,250,.82) 40%,rgba(190,222,240,.78) 100%);box-shadow:inset 0 0 10px rgba(255,255,255,.6),inset 0 -2px 6px rgba(120,170,205,.35);transition:width .7s ease,height .7s ease,opacity .5s';
    wcl.appendChild(wd);e.appendChild(wcl);e._wt=wcl;e._wd=wd;
  }
  if(e._wt){e._wt.style.display=(D.W>0&&(D.F<3||D.st==='starter'))?'':'none';
    if(e._wd&&D.y!=='none'){var wk2=D.y==='alive'?1:(+e.dataset.inStarter||0),bs=e._wt.querySelector('.yb-box');
      if(!bs){bs=document.createElement('div');bs.className='yb-box';bs.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none';
        for(var bi=0;bi<9;bi++){var bb=document.createElement('i');bb.style.cssText='position:absolute;left:'+(28+Math.random()*44)+'%;top:'+(48+Math.random()*26)+'%;width:'+(5+Math.random()*7)+'px;height:'+(5+Math.random()*7)+'px;border-radius:50%;background:rgba(255,247,222,.85);box-shadow:inset 0 0 3px rgba(190,160,100,.7);opacity:0;animation:yb '+(1.6+Math.random()*1.4)+'s linear infinite;animation-delay:'+(Math.random()*2)+'s';bs.appendChild(bb);}
        e._wt.appendChild(bs);}
      bs.style.opacity=String(D.y==='dead'?0:(+e.dataset.inStir>=1||D.y==='alive'?Math.min(1,.25+wk2):.0));
      e._wd.style.background='radial-gradient(ellipse at 40% 32%,rgba(246,236,205,.95),rgba(226,206,160,.85) 45%,rgba(204,176,120,.8) 100%)';}   // the flour covers the water: with flour in the trough the water is not drawn, the picture of the wet flour shows it
   if(e._wd){var sp=Math.max(0,Math.min(1,D.W/60));e._wd.style.width=(30+sp*50)+'%';e._wd.style.height=(22+sp*28)+'%';}   // the water spreads as there is more of it, but only up to the half of the length of the trough (not to the edges)
    if(e._wd)e._wd.style.opacity=String(Math.min(.95,.25+D.W/90)*(D.st==='good'?.45:(D.st==='wet'?1:.8)));}
  // the picture of the trough itself shows the flour (the pictures drawn by the owner)
  var tb=e.querySelector('.body');
  if(tb){var want=(D.W>=1&&D.F>=3)||n<=0||D.small&&D.F>=1?'assets/flour/nacve.webp':(n<120?'assets/flour/nacve_brasno1.webp':'assets/flour/nacve_brasno2.webp');
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
  if(D.small&&D.F>=1&&D.st!=='good'){           // the flour of the starter: a small heap (the same picture as on the table), not the picture of the trough full of flour
    if(!e._sh||!e._sh.isConnected){var sc=document.createElement('div');sc.style.cssText='position:absolute;left:'+INNER.l+'%;top:'+INNER.t+'%;width:'+(INNER.r-INNER.l)+'%;height:'+(INNER.b-INNER.t)+'%;border-radius:38% / 18%;overflow:hidden;pointer-events:none;z-index:3';
      var si=document.createElement('img');si.src=IMG.pile;si.draggable=false;si.style.cssText='position:absolute;left:50%;top:60%;transform:translate(-50%,-60%);user-select:none';sc.appendChild(si);e.appendChild(sc);e._sh=sc;e._shI=si;}
    e._shI.style.width=Math.min(60,12+D.F*2.4)+'%';e._sh.style.opacity=D.W>=3?'.82':'1';
  }else if(e._sh){e._sh.remove();e._sh=null;}
  if(e._fl){e._fl.remove();e._fl=null;}
  // the cloth over the trough: it covers the dough while it rises
  if(e.dataset.inCloth==='1'){
    if(!e._cl||!e._cl.isConnected){var cl=document.createElement('img');cl.src=CLOTH;cl.draggable=false;cl.style.cssText='position:absolute;left:-3%;top:-1%;width:106%;height:103%;pointer-events:none;z-index:9;transform-origin:50% 60%;transition:transform 1s linear,opacity .35s;opacity:0;user-select:none';e.appendChild(cl);e._cl=cl;requestAnimationFrame(function(){cl.style.opacity='1';});}
    var rz=Math.min(1,+e.dataset.inRise||0);e._cl.style.transform='scale('+(1+.07*rz).toFixed(3)+')';
    e._lbl.textContent=D.y==='alive'?(rz>=1?'testo je naraslo · skini krpu':'diže se '+Math.round(rz*100)+'%'):'ne diže se · nema živog kvasca';
  }else if(e._cl){e._cl.remove();e._cl=null;}
  if(e._dg&&!(e._st&&e._st.run))e._dg.style.transform=riseTf(e);
  if(e._m){var rs=Math.min(1,+e.dataset.inRise||0),rv=rs>.002?String((1+.45*rs).toFixed(3)):'';[e._m.cv,e._m.bs].forEach(function(n){if(n){n.style.scale=rv;n.style.transformOrigin='50% 62%';}});}   // the mesh of the dough (a canvas) grows too
  // the dough appears only by mixing (the flour and the water that are already in the trough), not by pouring: the picture of the dough melts in as the mixing goes
  var mx=Math.min(1,+e.dataset.inMix||0);
  // the dough is a picture of its own (without the trough), so that only the dough can stretch while the trough stays still:
  // the wet flour (flour and water in the trough) -> the lumpy mass -> the smooth ball; when it is pulled the ball turns into the long dough
  if(!e._dw||!e._dw.isConnected){
    var dw=document.createElement('div');dw.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:3;clip-path:inset('+(INNER.t+1)+'% '+(100-INNER.r+1)+'% '+(100-INNER.b+1)+'% '+(INNER.l+1)+'% round 38% / 18%)';
    var dg=document.createElement('div');dg.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%';dw.appendChild(dg);
    e._dl={};[['smesa',58],['grudve',70],['kugla',46],['razvuceno',68]].forEach(function(q){
      var im=document.createElement('img');im.src='assets/flour/testo_'+q[0]+'.webp?v=2';im.draggable=false;
      im.className='dough-img';im.style.cssText='position:absolute;left:50%;top:46%;height:'+q[1]+'%;width:auto;transform:translate(-50%,-50%);opacity:0;display:none';dg.appendChild(im);e._dl[q[0]]=im;});
    e.appendChild(dw);e._dw=dw;e._dg=dg;
  }
  var wetF=D.W>=1&&D.F>=3&&D.st!=='starter',stage=mx>=1?5:Math.min(4,Math.floor(mx*5)),meshOn=false;      // 5 phases of the mixing, 4 s of kneading each (20 s), then 5 = the whole ball
  if(window.CooksterDoughMesh){if(wetF)meshOn=CooksterDoughMesh.setStage(e,stage,D.F,mx);else CooksterDoughMesh.hide(e);}
  // reserve (when WebGL is not there): the plain pictures
  e._o={kugla:0};
  setO(e._dl.smesa,(wetF&&!meshOn&&stage<=3)?1:0);setO(e._dl.grudve,0);setO(e._dl.razvuceno,(wetF&&!meshOn&&stage>=4)?1:0);setO(e._dl.kugla,0);
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
function spawnGrains(m,land,k,col){
  var L=fxLayer();if(!L)return;
  for(var i=0;i<k&&grains.length<110;i++){
    var d=document.createElement('i'),sz=2+Math.random()*3.2;
    d.style.cssText='position:absolute;border-radius:50%;background:'+(col||'#f7f0e2')+';box-shadow:0 0 2px rgba(255,255,255,.8);width:'+sz+'px;height:'+sz+'px;opacity:.95';
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
// ---- the yeast: the yeast bowl (one measure) and the sugar jar over the trough; the spoon stirs the starter; the yeast wakes up by itself in a few seconds ----
var YEAST='kal_01_kvasac',SUGAR='zacin_secer',SPOON='kasika_mesanje',stirP=null;
function sayT(m){try{showToast(m);}catch(x){}}
/* the yeast bowl tilts over the trough like the spice jars: to the side that is away from where it comes (from the left it pours to the right) */
/* the risen dough goes into the hand as an item (it hangs from the hand and stretches, see cloth-hand.js); the trough is empty again */
function takeDough(tr,e){
  var d;try{d=kitchenEquipmentDef('kal_testo_naraslo');}catch(x){}
  if(!d||(typeof holding!=='undefined'&&holding))return false;
  e.stopImmediatePropagation();e.preventDefault();
  ['inFlour','inWater','inWaterT','inMix','inRise','inCloth','inYeast','inSugar','inStir','inStarter','inYeastDead','inBall','inMesh','inMeshS'].forEach(function(k){delete tr.dataset[k];});
  try{if(tr._m){tr._m.off.fill(0);tr._m.ball=0;tr._m.stage=-1;tr._m.glue=null;}CooksterDoughMesh.hide(tr);}catch(x){}
  drawTrough(tr);
  var el=makeItem({...d,instanceId:nextItemInstanceId(d.id),x:700-d.w/2,y:560-d.h,z:++zCounter});
  if(el){el.dataset.surfaceZone='table';setPose(el,700,560,surfaceScaleFor(el,'table',560));el.dataset.noFlash='1';el.style.visibility='hidden';setTimeout(function(){delete el.dataset.noFlash;},1500);startHolding(el);}
  sayT('Testo je u ruci. Spusti ga na sto što pre, razvlači se.');try{CooksterSave.schedule();}catch(x){}
  return true;
}
var tilt={a:0,dir:0},mx=0,my=0,lastY=null;
window.addEventListener('pointermove',function(e){mx=e.clientX;my=e.clientY;},true);
function trCenter(tr){var b=tr.getBoundingClientRect();return screenToScene(b.left+b.width*.5,b.top+b.height*.46);}
function yGhosts(){return [].slice.call(document.querySelectorAll('.ghost-item-copy')).filter(function(g){return g.querySelector('img[src*="kvasac"]');});}
function yMouth(){
  var g=yGhosts()[0],h=typeof holding!=='undefined'?holding:null,r=g?g.getBoundingClientRect():(h&&h.getBoundingClientRect());if(!r||!r.width)return null;
  return screenToScene(tilt.dir>0?r.right-r.width*.14:r.left+r.width*.14,r.top+r.height*.3);
}
function driveGrains(){var t0=performance.now();(function f(n){var dt=Math.min(.05,(n-t0)/1000);t0=n;stepGrains(dt,null);if(grains.length)requestAnimationFrame(f);})(t0);}
(function tickY(){
  requestAnimationFrame(tickY);
  var h=typeof holding!=='undefined'?holding:null,isY=!!h&&h.dataset&&h.dataset.itemId===YEAST;
  if(lastY&&(!isY||lastY!==h)){lastY.style.rotate='';yGhosts().forEach(function(g){g.style.rotate='';});tilt.a=0;}
  lastY=isY?h:null;if(!isY)return;
  var tr=null;try{var sp=screenToScene(mx,my);tr=troughAt(sp.x,sp.y);}catch(x){}
  if(tr){var b=tr.getBoundingClientRect();tilt.dir=mx<b.left+b.width/2?1:-1;}
  tilt.a+=((tr?52*tilt.dir:0)-tilt.a)*.18;if(!tr&&Math.abs(tilt.a)<.5)tilt.a=0;
  h.style.rotate=tilt.a.toFixed(1)+'deg';yGhosts().forEach(function(g){g.style.rotate=tilt.a.toFixed(1)+'deg';});
})();
function heldId(){var h=typeof holding!=='undefined'?holding:null;return h&&h.dataset?h.dataset.itemId:'';}
function puffAtTrough(tr,col){try{var r=tr.getBoundingClientRect(),n=0;for(var i=0;i<8;i++){var d=document.createElement('i'),sz=2.5+Math.random()*3;d.style.cssText='position:fixed;left:'+(r.left+r.width*(.3+Math.random()*.4))+'px;top:'+(r.top+r.height*.05)+'px;width:'+sz+'px;height:'+sz+'px;border-radius:50%;background:'+col+';z-index:20000;pointer-events:none;transition:transform .5s cubic-bezier(.3,.1,.6,1),opacity .5s';document.body.appendChild(d);(function(d){requestAnimationFrame(function(){d.style.transform='translate('+((Math.random()-.5)*10)+'px,'+(r.height*(.28+Math.random()*.2))+'px)';d.style.opacity='.2';});setTimeout(function(){d.remove();},600);})(d);}}catch(x){}}
window.addEventListener('pointerdown',function(e){
  if(e.button===0&&!(typeof holding!=='undefined'&&holding)){          // an empty hand on a covered trough takes the cloth off
    if(e.target&&e.target.closest&&e.target.closest('#hud,[data-tool-ui],.cookster-ctx,#toolDock'))return;
    var sp0=screenToScene(e.clientX,e.clientY),tr0=troughAt(sp0.x,sp0.y);
    if(tr0&&tr0.dataset.inCloth!=='1'&&(+tr0.dataset.inRise||0)>=1&&doughState(tr0).st==='good'){       // the risen dough: the hand takes it out of the trough
      var br0=tr0.getBoundingClientRect(),nx0=(e.clientX-br0.left)/br0.width-.5,ny0=(e.clientY-br0.top)/br0.height-.46;
      if((nx0/.34)*(nx0/.34)+(ny0/.34)*(ny0/.34)<=1&&takeDough(tr0,e))return;
    }
    if(tr0&&tr0.dataset.inCloth==='1'){e.stopImmediatePropagation();e.preventDefault();delete tr0.dataset.inCloth;drawTrough(tr0);sayT((+tr0.dataset.inRise||0)>=1?'Krpa je skinuta, testo je naraslo.':'Krpa je skinuta.');try{CooksterSave.schedule();}catch(x){}return;}
  }
  var id=heldId();if(e.button!==0||(id!==YEAST&&id!==SPOON&&id!==KRPA))return;
  if(e.target&&e.target.closest&&e.target.closest('#hud,[data-tool-ui],.cookster-ctx,#toolDock'))return;
  var sp=screenToScene(e.clientX,e.clientY),tr=troughAt(sp.x,sp.y);if(!tr)return;
  var D=doughState(tr);
  if(id===KRPA){
    e.stopImmediatePropagation();e.preventDefault();
    if(tr.dataset.inCloth==='1')return;
    if(D.st!=='good'||(+tr.dataset.inMix||0)<1){sayT('Prvo umesi testo do kraja, pa ga pokrij krpom.');return;}
    if(tr._covering)return;
    var cover=function(){tr._covering=false;tr.dataset.inCloth='1';if(tr.dataset.inRise==null)tr.dataset.inRise='0';drawTrough(tr);
      sayT(D.y==='alive'?'Testo se diže pod krpom.':'Testo je pod krpom, ali bez živog kvasca se neće dići.');try{CooksterSave.schedule();}catch(x){}};
    tr._covering=true;var flying=false;try{flying=!!(window.CooksterCloth&&CooksterCloth.dropOver(tr,cover));}catch(x){}      // the cloth flies over the trough, then it covers it
    try{CooksterPantryBridge.detachHeld();}catch(x){tr._covering=false;return;}
    if(!flying)cover();return;
  }
  if(id===YEAST){
    e.stopImmediatePropagation();e.preventDefault();
    if(D.y!=='none'){sayT('Jedna merica kvasca je dovoljna za jedno testo.');return;}
    if(D.F>ST_F||D.W>ST_W){sayT('Kvasac se prvo budi u malo vode i malo brašna, pre nego što dodaš ostalo.');return;}
    if(tilt.dir===0||Math.abs(tilt.a)<12){sayT('Približi kvasac naćvama da se nagne.');return;}
    var m=yMouth(),c=trCenter(tr);if(m&&c)spawnGrains(m,c,16,'#c9a56a');driveGrains();
    tr.dataset.inYeast='1';tr.dataset.inStir='0';tr.dataset.inStarter='0';delete tr.dataset.inYeastDead;
    sayT('Kvasac je u naćvama. Treba mlaka voda, malo brašna i šećera, pa promešaj kašikom.');setTimeout(function(){drawTrough(tr);},500);try{CooksterSave.schedule();}catch(x){}
  }else if(id===SPOON){
    if(D.st!=='starter')return;                       // the normal behaviour of the spoon
    e.stopImmediatePropagation();e.preventDefault();
    if(D.W<10||D.F<3||D.sugar<1){sayT(starterTxt(tr,D)+'.');return;}
    if((+tr.dataset.inStir||0)>=1){sayT('Već je promešano, sačekaj da kvasac počne da radi.');return;}
    stirP={tr:tr,x:e.clientX,y:e.clientY};
  }
},true);
window.addEventListener('pointermove',function(e){
  if(!stirP)return;var tr=stirP.tr,d=Math.hypot(e.clientX-stirP.x,e.clientY-stirP.y);stirP.x=e.clientX;stirP.y=e.clientY;
  var sp=screenToScene(e.clientX,e.clientY);if(troughAt(sp.x,sp.y)!==tr)return;
  var v=Math.min(1,(+tr.dataset.inStir||0)+d/STIR_PX);tr.dataset.inStir=String(v);
  if(v>=1)sayT('Promešano. Kvasac se budi, sačekaj malo.');
  drawTrough(tr);
},true);
window.addEventListener('pointerup',function(e){if(stirP&&e.button===0){stirP=null;try{CooksterSave.schedule();}catch(x){}}},true);
window.addEventListener('click',function(e){var id=heldId();if(e.button===0&&(id===YEAST||id===SUGAR||id===SPOON||id===KRPA)){var sp=screenToScene(e.clientX,e.clientY),tr=troughAt(sp.x,sp.y);if(tr&&(id!==SPOON||doughState(tr).st==='starter'))e.stopImmediatePropagation();}},true);
setInterval(function(){(typeof items!=='undefined'?items:[]).forEach(function(e){      // the rising: only under the cloth and only with a live yeast
  if(!e||!e.dataset||e.dataset.itemId!==TR||e.dataset.inCloth!=='1')return;
  var D=doughState(e),r=+e.dataset.inRise||0;
  if(D.y==='alive'&&r<1){r=Math.min(1,r+.5/RISE_S);e.dataset.inRise=String(r);if(r>=1){sayT('Testo je naraslo. Skini krpu.');try{CooksterSave.schedule();}catch(x){}}drawTrough(e);}
});},500);
setInterval(function(){(typeof items!=='undefined'?items:[]).forEach(function(e){
  if(!e||!e.dataset||e.dataset.itemId!==TR||!(+e.dataset.inYeast>0))return;
  var D=doughState(e);
  if(D.y==='sleep'&&D.W>=3&&D.T>T_MAX){e.dataset.inYeastDead='1';sayT('Voda je prevruća, kvasac je uginuo.');drawTrough(e);return;}
  if(D.y==='sleep'&&(+e.dataset.inStir||0)>=1&&D.F>=3&&D.W>=10&&D.T>=T_MIN){
    var w=Math.min(1,(+e.dataset.inStarter||0)+.5/WAKE_S);e.dataset.inStarter=String(w);
    if(w>=1){sayT('Kvasac je živ. Sad dodaj pravu količinu brašna i vode.');try{CooksterSave.schedule();}catch(x){}}
    drawTrough(e);
  }});},500);
// ---- mixing: the stirring spoon in the hand, LEFT button held, moved over the trough; the flour and the water become a dough (only when the ratio is right) ----
/* The camera: while the dough is kneaded the picture comes a little closer in 0.2 s (1.35 times, the whole table stays visible; the trough in the middle, the arm goes down behind the squares at the bottom); the moment the kneading
   is let go it goes back in 0.2 s. It uses the camera of the game (scale, offsetX, offsetY). */
var camSaved=null,camRaf=0;
function camTo(T,dur,done){
  if(camRaf)cancelAnimationFrame(camRaf);
  var s0=scale,x0=offsetX,y0=offsetY,t0=performance.now();
  (function f(now){var k=Math.min(1,(now-t0)/dur),e=1-Math.pow(1-k,3);
    scale=s0+(T.s-s0)*e;offsetX=x0+(T.ox-x0)*e;offsetY=y0+(T.oy-y0)*e;applyCamera();
    if(k<1)camRaf=requestAnimationFrame(f);else{camRaf=0;if(done)done();}})(t0);
}
function camIn(tr,f){
  if(camSaved)return;
  try{
    camSaved={s:scale,ox:offsetX,oy:offsetY};
    var r=tr.getBoundingClientRect(),pt=screenToScene(r.left+r.width/2,r.top+r.height*.46);
    f=f||1.35;var s=Math.min(fitScale*(f+.15),Math.max(scale*f,fitScale*f)),sx=innerWidth/2,sy=innerHeight*.47;      // only a little closer: the whole table stays in the picture
    camTo({s:s,ox:sx-(pt.x-cameraX)*s,oy:sy-pt.y*s},200);
  }catch(e){camSaved=null;}
}
function camOut(){
  if(!camSaved)return;var T={s:camSaved.s,ox:camSaved.ox,oy:camSaved.oy};camSaved=null;
  try{camTo(T,200);}catch(e){}
}
var mixP=null;
window.addEventListener('pointerdown',function(e){
  var h=typeof holding!=='undefined'?holding:null;if(e.button!==0||h||document.body.classList.contains('nacve-tool'))return;     // by hand: nothing in the hand (and not while the tool for the limits of the dough is open)
  if(e.target&&e.target.closest&&e.target.closest('#hud,[data-tool-ui],.cookster-ctx,#toolDock'))return;
  var sp=screenToScene(e.clientX,e.clientY),tr=troughAt(sp.x,sp.y);if(!tr)return;
  var D=doughState(tr);if(tr.dataset.inCloth==='1'||D.st==='empty'||D.st==='flour'||D.st==='water'||D.st==='starter')return;   // an empty trough or only one thing in it: the normal click (picking it up)
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
var HAND_IMG={c:['ruka1','ruka2'],m:['ruka_b1','ruka_b2'],v:['ruka_a1','ruka_a2']};   // the clean hand, the hand a little and a lot smeared with the dough (open and pressed)
Object.keys(HAND_IMG).forEach(function(k){HAND_IMG[k].forEach(function(n){var i=new Image();i.src='assets/flour/'+n+'.webp?v=4';});});
function knLayer(tr){
  if(tr._kn&&tr._kn.isConnected)return tr._kn;
  /* a window the size of the trough opening (it goes on down, so the arm can come from the front): the hand never goes out of the sides */
  var w=document.createElement('div');w.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:7;clip-path:polygon('+INNER.l+'% '+INNER.t+'%,'+INNER.r+'% '+INNER.t+'%,'+INNER.r+'% 700%,'+INNER.l+'% 700%)';
  var h=document.createElement('div');h.style.cssText='position:absolute;left:0;top:0;width:'+(tr.offsetWidth*.62)+'px;opacity:0;transition:opacity .2s;transform-origin:49% 9.5%;will-change:transform';
  var html='',lv,po;
  ['c','m','v'].forEach(function(l){[0,1].forEach(function(q){html+='<img draggable="false" data-l="'+l+'" data-p="'+q+'" src="assets/flour/'+HAND_IMG[l][q]+'.webp?v=4" style="'+(l==='c'&&q===0?'display:block;width:100%;':'position:absolute;left:0;top:0;width:100%;')+'opacity:'+(l==='c'&&q===0?1:0)+';user-select:none">';});});
  h.innerHTML=html;h._I={};[].forEach.call(h.children,function(i){h._I[i.dataset.l+i.dataset.p]=i;});
  w.appendChild(h);tr.appendChild(w);tr._kn=h;tr._kw=w;return h;
}
/* the hand is smeared with the dough while the dough is wet and gets cleaner as it is kneaded: the clean hand is always below, the little smeared one over it and the very smeared one over that */
function knDress(h,pressed,T,wet){
  var oM=0,oV=0,p=pressed?1:0;
  if(wet&&T>=3){oM=Math.min(1,(T-3)*2.5);oV=T<10?Math.min(1,(T-3)*2.5):Math.max(0,1-(T-10)*1.6);}      // clean for the first 3 s, then the most smeared hand, from 10 s the less smeared one to the end
  [['c',1],['m',oM],['v',oV]].forEach(function(L){h._I[L[0]+'0'].style.opacity=String(p?0:L[1]);h._I[L[0]+'1'].style.opacity=String(p?L[1]:0);});
  h._I.c0.style.opacity=p?'0':'1';h._I.c1.style.opacity=p?'1':'0';
}
function knStretch(tr,vy,vx){
  var st=tr._st||(tr._st={s:0,v:0,t:0,run:false});
  st.v+=Math.max(-30,Math.min(30,vy))*.03;      // the pull
  if(!st.run){st.run=true;st.t=performance.now();requestAnimationFrame(function f(now){
    var dt=Math.min(.05,(now-st.t)/1000);st.t=now;
    st.v+=(-st.s*90-st.v*9)*dt;st.s+=st.v*dt;st.s=Math.max(-.22,Math.min(.22,st.s));   // the spring
    var a=Math.abs(st.s),o=st.s<0?'50% 100%':'50% 0%',tf=riseTf(tr)+(a<.002?'':' scale('+(1-a*.35)+','+(1+a*.9)+')');   // going up: it grows upwards from its bottom
    if(tr._dg){tr._dg.style.transformOrigin=o;tr._dg.style.transform=tf;}
    tr._ks=Math.min(1,a*5);                                    // the ball turns into the long dough while it is pulled
    if(tr._dl&&tr._o){setO(tr._dl.kugla,tr._o.kugla*(1-tr._ks));setO(tr._dl.razvuceno,tr._o.kugla*tr._ks);}
    if(a>.002||Math.abs(st.v)>.01)requestAnimationFrame(f);else{st.run=false;st.s=st.v=0;tr._ks=0;if(tr._dg)tr._dg.style.transform=riseTf(tr);if(tr._dl&&tr._o){setO(tr._dl.kugla,tr._o.kugla);setO(tr._dl.razvuceno,0);}}
  });}
}
function knMove(tr,e,vx,vy,shaping){
  var h=knLayer(tr),r=tr.getBoundingClientRect(),k=r.width/(tr.offsetWidth||1)||1,W=tr.offsetWidth,H=tr.offsetHeight;
  var px=Math.max(W*(INNER.l+12)/100,Math.min(W*(INNER.r-12)/100,(e.clientX-r.left)/k)),py=Math.max(H*INNER.t/100+W*.62*.93*.9,Math.min(H*(INNER.b-2)/100,(e.clientY-r.top)/k));   // the fingers stay inside the opening
  var hw=W*.62,hh=hw*4200/420,rot=Math.max(-12,Math.min(12,vx*.5)),sc=1-Math.max(-.05,Math.min(.05,vy*.003));
  if(vy>1.5)h._pt=performance.now();var pr=(performance.now()-(h._pt||0)<160),mxv=+tr.dataset.inMix||0,stg=doughState(tr);knDress(h,pr,mxv*20,stg.W>=1&&stg.F>=3);   // the pressed hand while it goes down
  h.style.opacity='1';h.style.transform='translate('+(px-hw*.49)+'px,'+(py-hh*.0952)+'px) rotate('+rot+'deg) scale('+sc+')';
  // the end of the arm goes behind the squares at the bottom of the screen (the bar with the vessels): the window of the hand ends in the middle of the bar when the arm is over it
  try{var bs=document.querySelectorAll('.cookster-bottom-button'),bl=1e9,brr=-1e9,bt=1e9,bb2=-1e9,q;
    bs.forEach(function(x){q=x.getBoundingClientRect();if(q.width){bl=Math.min(bl,q.left);brr=Math.max(brr,q.right);bt=Math.min(bt,q.top);bb2=Math.max(bb2,q.bottom);}});
    var armX=r.left+px*k,cut=(brr>bl&&armX>bl&&armX<brr)?(bt+bb2)/2:1e5,lp=Math.max(100,Math.min(900,((cut-r.top)/k)/H*100));
    if(tr._kw)tr._kw.style.clipPath='polygon('+INNER.l+'% '+INNER.t+'%,'+INNER.r+'% '+INNER.t+'%,'+INNER.r+'% '+lp+'%,'+INNER.l+'% '+lp+'%)';}catch(x){}
  if(!shaping)knStretch(tr,vy,vx);
  var now=performance.now();
  var mxk=+tr.dataset.inMix||0,ph=Math.min(5,Math.floor(mxk*5)),kf=[1,1,.95,.6,.25,0][ph];      // the flour in the air is strong in the first phases and stops only when the dough is mixed
  if(kf>0&&now-(tr._puff||0)>110&&Math.abs(vy)+Math.abs(vx)>3){tr._puff=now;
    var c=document.createElement('div'),sz=(30+Math.random()*34)*(.6+.4*kf);
    c.style.cssText='position:absolute;left:'+(px-sz/2+(Math.random()-.5)*18)+'px;top:'+(py-sz/2+(Math.random()-.5)*14)+'px;width:'+sz+'px;height:'+sz*.75+'px;border-radius:50%;background:radial-gradient(ellipse,rgba(255,253,247,.9),rgba(255,250,240,0) 70%);filter:blur(1.5px);pointer-events:none;z-index:8';
    dustTrough(tr,Math.round(12*kf));
    // the specks of flour that are torn off the dough while it is pulled: they fall to the dough and to the table
    var nS=Math.round(Math.min(11,2+Math.floor((Math.abs(vy)+Math.abs(vx))/5))*kf);
    for(var q=0;q<nS;q++){
      var sp=document.createElement('i'),sx=px+(Math.random()-.5)*34,sy=py+(Math.random()-.5)*30,sz=1.2+Math.random()*2;
      sp.style.cssText='position:absolute;left:'+sx+'px;top:'+sy+'px;width:'+sz+'px;height:'+sz+'px;border-radius:50%;background:#fbf6ea;pointer-events:none;z-index:8;opacity:.9';
      tr.appendChild(sp);
      var an=sp.animate([{transform:'translate(0,0)',opacity:.9},{transform:'translate('+((Math.random()-.5)*14)+'px,'+(10+Math.random()*26)+'px)',opacity:0}],{duration:520+Math.random()*420,easing:'cubic-bezier(.3,.1,.7,1)',fill:'forwards'});
      an.onfinish=(function(el){return function(){el.remove();};})(sp);
    }
    tr.appendChild(c);var a=c.animate([{opacity:.75*kf+.15,transform:'translateY(0) scale(.5)'},{opacity:.5*kf,transform:'translateY(-22px) scale(1.5)',offset:.5},{opacity:0,transform:'translateY(-46px) scale(2.3)'}],{duration:1500,fill:'forwards'});a.onfinish=function(){c.remove();};}
}
window.addEventListener('pointermove',function(e){
  if(!mixP)return;var vy=e.clientY-mixP.y,vx=e.clientX-mixP.x,d=Math.hypot(vx,vy),tr=mixP.tr;mixP.x=e.clientX;mixP.y=e.clientY;
  var tnow=performance.now(),dt=Math.min(.08,(tnow-mixP.t)/1000);mixP.t=tnow;
  try{CooksterDoughMesh.drag(tr,e.clientX,e.clientY);}catch(x){}           // the hand pulls the dough, the points follow it and stay
  var D=doughState(tr);
  if(D.st!=='good'){tr.dataset.inMix=String(Math.max(0,(+tr.dataset.inMix||0)-d/6000));drawTrough(tr);knMove(tr,e,vx,vy,true);return;}
  if(d>1.5){            // after 7 seconds of kneading (only while the mouse moves) the wet flour becomes the dough
    var was=+tr.dataset.inMix||0,T=Math.min(20,was*20+dt),nm=T/20;
    if(nm>=1&&was<1){try{showToast('Testo je umešeno 100%. Oblikuj ga rukom.');}catch(x){}}
    tr.dataset.inMix=String(nm);drawTrough(tr);
  }
  knMove(tr,e,vx,vy,true);
},true);
window.addEventListener('pointerup',function(e){if(mixP&&e.button===0){if(mixP.tr._kn)mixP.tr._kn.style.opacity='0';try{CooksterDoughMesh.release(mixP.tr);}catch(x){}mixP=null;camOut();try{CooksterSave.schedule();}catch(x){}}},true);
window.addEventListener('blur',function(){if(mixP){mixP=null;}camOut();});
window.CooksterFlour={camIn:camIn,camOut:camOut,troughAt:troughAt,addWater:function(tr,units,temp){var w0=+tr.dataset.inWater||0,T=temp==null?15:temp,t0=tr.dataset.inWaterT!=null?+tr.dataset.inWaterT:T,nw=Math.min(400,w0+units);tr.dataset.inWaterT=((t0*w0+T*(nw-w0))/Math.max(.0001,nw)).toFixed(1);tr.dataset.inWater=String(nw);drawTrough(tr);},addSugar:function(tr){if((+tr.dataset.inSugar||0)>=3){sayT('Šećera je dosta.');return;}tr.dataset.inSugar=String((+tr.dataset.inSugar||0)+1);sayT('šećer ×'+tr.dataset.inSugar);drawTrough(tr);try{CooksterSave.schedule();}catch(x){}},dough:function(){var e=(typeof items!=='undefined'?items:[]).filter(function(x){return x.dataset&&x.dataset.itemId===TR;}).pop();return e?doughState(e):null;},piles:function(){return piles.map(function(p){return {x:p.x,y:p.y,n:p.n};});},clear:function(){piles.forEach(function(p){if(p.el)p.el.remove();});piles=[];save();}};
})();
