/* Cookster - cleaning the tavern.
   The tavern shows the DIRTY picture on top of the CLEAN one. The dirt is a canvas: whatever is rubbed off it shows the clean picture below.
     - the sponge (hold the left mouse button and rub) cleans everything except the tables, slowly: a few passes are needed.
       It lies flat on the floor and the bar top, and is held upright against the walls and the front of the bar.
     - the tables are not cleaned with the sponge: right click on a table, then "Očisti sto"
   What the sponge cleans, and how it sits there, is taken from the tool "Kalibracija kafane":
     Sunđer: površine   - the surfaces (floor, walls, bar...) with the way the sponge sits on them
     Sunđer NE čisti    - the tables with their chairs
     Maska stola        - one shape per table, the table that is cleaned with the menu */
(function(){
'use strict';
var T=window.CooksterTavern,room=document.getElementById('tavernScene');
if(!T||!room||window.CooksterTavernClean)return;
var W=T.size.w,H=T.size.h,DIRTY='assets/tavern/kafana_prljava.webp?v=1';
var IMG=T.spongeImg;                                  // the pictures of the sponge (size and the point where it touches the surface)
var RADIUS=46,SPACING=9,STRENGTH=.06;               // sponge: size, distance between two touches, how much one touch removes
var cv=room.querySelector('.ts-guests');
if(!cv)return;

function mk(tag,cls){var e=document.createElement(tag);if(cls)e.className=cls;return e}
var css=document.createElement('style');
css.textContent=
'#tavernScene.tc-sponge-on{cursor:none}#tavernScene button,#tavernScene .tc-menu{cursor:pointer}'+
'#tavernScene .ts-add{display:none!important}'+
'#tavernScene .tc-dirt,#tavernScene .tc-fx{position:absolute;pointer-events:none}'+
'#tavernScene .tc-sponge{position:fixed;left:0;top:0;pointer-events:none;z-index:60;display:none;will-change:transform}'+
'#tavernScene .tc-sponge img{position:absolute;left:0;top:0;width:100%;height:100%;display:block;-webkit-user-drag:none}'+
'#tavernScene .tc-sponge .tc-shadow{position:absolute;border-radius:50%;background:radial-gradient(ellipse at center,rgba(0,0,0,.6),rgba(0,0,0,0) 70%)}'+
'#tavernScene .tc-info{position:absolute;left:50%;top:12px;transform:translateX(-50%);z-index:70;padding:6px 14px;border-radius:9px;background:rgba(32,20,9,.82);border:1px solid #7a5428;color:#f3e3c2;font:600 14px/1.2 system-ui,sans-serif;pointer-events:none;white-space:nowrap}'+
'#tavernScene .tc-hint{position:absolute;left:50%;bottom:58px;transform:translateX(-50%);z-index:70;padding:5px 12px;border-radius:8px;background:rgba(32,20,9,.7);color:#d9c69c;font:12px/1.2 system-ui,sans-serif;pointer-events:none;white-space:nowrap;transition:opacity .6s}'+
'#tavernScene .tc-reset{position:absolute;right:14px;top:12px;z-index:70;border:2px solid #351b0d;border-radius:9px;background:#e8c27a;color:#351b0d;font:700 13px/1 system-ui,sans-serif;padding:7px 12px;opacity:.85}'+
'#tavernScene .tc-reset:hover{opacity:1}'+
'#tavernScene .tc-menu{position:fixed;z-index:80;width:0;height:0;display:none}'+
'#tavernScene .tc-menu .tc-ring{position:absolute;left:-84px;top:-84px;width:168px;height:168px;border-radius:50%;border:3px solid rgba(232,194,122,.75);background:rgba(42,26,11,.55);box-shadow:0 8px 24px rgba(0,0,0,.5)}'+
'#tavernScene .tc-menu button{position:absolute;width:64px;height:64px;margin:-32px 0 0 -32px;border-radius:50%;border:2px solid #351b0d;background:#e8c27a;color:#351b0d;font:700 11px/1.1 system-ui,sans-serif;padding:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}'+
'#tavernScene .tc-menu button i{font-style:normal;font-size:22px;line-height:1}'+
'#tavernScene .tc-menu button.on{background:#ffd88a;box-shadow:0 0 0 3px #fff3c4}'+
'#tavernScene .tc-menu button:hover:not(:disabled){background:#ffd88a}'+
'#tavernScene .tc-menu button:disabled{opacity:.5;cursor:default}';
document.head.appendChild(css);

// ---------- the layers ----------
var dirt=mk('canvas','tc-dirt'),fx=mk('canvas','tc-fx');
dirt.width=W;dirt.height=H;fx.width=W;fx.height=H;
cv.parentNode.insertBefore(dirt,cv);cv.parentNode.insertBefore(fx,cv.nextSibling);
var D=dirt.getContext('2d'),X=fx.getContext('2d');
// the stove: the picture of the room has the fire lit; "assets/tavern/dirt/stove_off.webp" is the same picture with the fire out (only where it differs, the rest is transparent).
// Right click on the stove -> "Ugasi" / "Zapali": the picture of the stove without fire fades in over the room (and over the dirt)
T.overlayCanvases=[];                              // pictures that lie over the dirt (stove without fire, unlit lamps): redrawn over the guests too
var stoveCv=mk('canvas','tc-dirt');stoveCv.width=W;stoveCv.height=H;cv.parentNode.insertBefore(stoveCv,cv);
var SC=stoveCv.getContext('2d'),STOVE_KEY='cookster.tavern-stove.v1',STOVE_RECT=[1150,285,1385,475],stoveLit=true,stoveA=0,stoveOk=false,stoveImg=new Image();
try{stoveLit=localStorage.getItem(STOVE_KEY)==='on'}catch(e){}
stoveImg.onload=function(){stoveOk=true;stoveA=stoveLit?0:1;drawStove()};stoveImg.src='assets/tavern/dirt/stove_off.webp?v=5';
function drawStove(){SC.clearRect(0,0,W,H);if(stoveOk&&stoveA>0){SC.globalAlpha=stoveA;SC.drawImage(stoveImg,0,0,W,H);SC.globalAlpha=1}if(window.__drawLights)window.__drawLights()}
function setStove(lit){
  if(!stoveOk||lit===stoveLit)return;
  stoveLit=lit;try{localStorage.setItem(STOVE_KEY,lit?'on':'off')}catch(e){}
  if(lit)burst.pec=performance.now()+1200;
  var from=stoveA,to=lit?0:1,t0=performance.now();
  (function f(now){var k=Math.min(1,(now-t0)/700);stoveA=from+(to-from)*k;drawStove();if(k<1)requestAnimationFrame(f)})(t0);
}

// the lamps: the tavern starts dark (all lights out). tools/make_lights.py builds assets/tavern/lights/ from one picture of the dark tavern:
//   shade.webp  - how much darker the dark picture is (multiplied over everything, also over the guests)
//   w<i>.webp   - the part of the light that belongs to lamp i (white, alpha); a lit lamp makes its part of the shade disappear
//   core<i>.webp - the lamp itself (unlit) drawn over the lit picture while the lamp is out
// Right click on a lamp -> "Upali svetlo" / "Ugasi svetlo". The stove (fire) is one of the lamps, its picture is stove_off.webp (above).
var shadeCv=mk('canvas','tc-dirt'),coreCv=mk('canvas','tc-dirt'),SH=null,CR=coreCv.getContext('2d');
shadeCv.style.mixBlendMode='multiply';coreCv.width=W;coreCv.height=H;
cv.parentNode.insertBefore(coreCv,cv);T.overlayCanvases.push(stoveCv,coreCv);cv.parentNode.insertBefore(shadeCv,cv.nextSibling);
var LIGHTS_KEY='cookster.tavern-lights.v1',lightsDef=null,lightState={},lightA={},shadeImg=null,lampImgs={};
try{lightState=JSON.parse(localStorage.getItem(LIGHTS_KEY)||'{}')||{}}catch(e){lightState={}}
// flicker: a lit flame trembles a little (the light is a bit weaker now and then); right after lighting it, it stutters for a moment
var flk={},burst={};
function flickerOf(id,now,amp){
  var o=flk[id]||(flk[id]={v:1,t:1,n:0}),b=burst[id]>now;
  if(now>o.n){o.t=1-(b?amp*5:amp)*Math.random()*(Math.random()<.5?1:2);if(b&&Math.random()<.25)o.t=.35+Math.random()*.3;o.n=now+(b?40:70)+Math.random()*(b?70:150)}
  o.v+=(o.t-o.v)*(b?.5:.3);return Math.max(.2,Math.min(1,o.v));
}
function lampAmount(L){
  var a=L.stove?(1-stoveA):(lightA[L.id]||0);
  return a>0?a*flickerOf(L.id,performance.now(),L.stove?.07:.04):0;
}
function drawLights(){
  if(!lightsDef||!shadeImg||!shadeImg.naturalWidth)return;
  if(!SH){shadeCv.width=shadeImg.naturalWidth;shadeCv.height=shadeImg.naturalHeight;SH=shadeCv.getContext('2d')}
  SH.globalAlpha=1;SH.clearRect(0,0,shadeCv.width,shadeCv.height);SH.drawImage(shadeImg,0,0);
  CR.clearRect(0,0,W,H);
  lightsDef.lamps.forEach(function(L){
    var a=lampAmount(L),wi=lampImgs[L.weight];
    if(a>0&&wi&&wi.naturalWidth){SH.globalAlpha=a;SH.drawImage(wi,0,0,shadeCv.width,shadeCv.height)}
    if(L.core&&a<1){var ci=lampImgs[L.core.file];if(ci&&ci.naturalWidth){CR.globalAlpha=1-a;CR.drawImage(ci,L.core.x,L.core.y,L.core.w,L.core.h)}}
  });
  SH.globalAlpha=1;CR.globalAlpha=1;
}
function setLamp(L,on){
  if(L.stove){setStove(on);return}
  if(!!lightState[L.id]===on)return;
  lightState[L.id]=on;try{localStorage.setItem(LIGHTS_KEY,JSON.stringify(lightState))}catch(e){}
  if(on)burst[L.id]=performance.now()+900;
  var from=lightA[L.id]||0,to=on?1:0,t0=performance.now();
  (function f(now){var k=Math.min(1,(now-t0)/600);lightA[L.id]=from+(to-from)*k;drawLights();if(k<1)requestAnimationFrame(f)})(t0);
}
window.__drawLights=drawLights;
function lampLit(L){return L.stove?stoveLit:!!lightState[L.id]}
function lampAt(x,y){
  if(!lightsDef)return null;
  for(var i=0;i<lightsDef.lamps.length;i++){var L=lightsDef.lamps[i];if(L.stove)continue;
    if(Math.abs(x-L.x)<=(L.core?L.core.w/2:40)+8&&Math.abs(y-L.y)<=(L.core?L.core.h/2:50)+8)return L}
  return null;
}
// sparks and dust next to the fire (while the stove is lit), and the flicker of the lamps; drawn only while the tavern is on the screen
var sparkCv=mk('canvas','tc-fx'),SP=sparkCv.getContext('2d'),sparks=[],lastFx=0,spawnAcc=0;
sparkCv.width=W;sparkCv.height=H;cv.parentNode.insertBefore(sparkCv,fx);
var FIRE={x:1217,y:372};                                // the opening of the stove
function spawnSpark(dust){
  var up=dust?-(2+Math.random()*5):-(14+Math.random()*28);
  sparks.push({x:FIRE.x+(Math.random()-.5)*(dust?150:34),y:FIRE.y+(dust?(Math.random()-.8)*110:(Math.random()-.4)*14),vx:(Math.random()-.5)*(dust?4:10),vy:up,t:0,life:dust?4+Math.random()*4:1.8+Math.random()*2.4,r:dust?1.2+Math.random()*1.6:1.6+Math.random()*2.4,dust:dust,ph:Math.random()*6.28});
}
function fxTick(now){
  requestAnimationFrame(fxTick);
  if(!T.isOpen||now-lastFx<33)return;
  var dt=Math.min(.1,(now-lastFx)/1000);lastFx=now;
  smokeTick(dt);
  if(lightsDef&&lightsDef.lamps.some(function(L){return L.stove?(stoveLit||stoveA<1):!!lightState[L.id]}))drawLights();
  if(stoveLit&&stoveA<.5){spawnAcc+=dt*(5+Math.random()*3);while(spawnAcc>=1){spawnAcc--;spawnSpark(false);if(Math.random()<.6)spawnSpark(true)}}
  if(!sparks.length)return;
  SP.clearRect(0,0,W,H);SP.globalCompositeOperation='lighter';
  for(var i=sparks.length-1;i>=0;i--){
    var p=sparks[i];p.t+=dt;if(p.t>=p.life){sparks.splice(i,1);continue}
    p.x+=p.vx*dt+Math.sin(p.t*1.6+p.ph)*(p.dust?3:7)*dt;p.y+=p.vy*dt;if(!p.dust)p.vy*=.992;
    var k=p.t/p.life,a=(p.dust?.9*Math.sin(Math.PI*k)*(.6+.4*Math.sin(p.t*4+p.ph)):(1-k)*(.75+.25*Math.sin(p.t*12+p.ph)));
    var g=SP.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*(p.dust?5:4));
    g.addColorStop(0,p.dust?'rgba(255,225,160,'+a+')':'rgba(255,200,90,'+a+')');g.addColorStop(.35,p.dust?'rgba(255,190,100,'+a*.4+')':'rgba(255,120,30,'+a*.5+')');g.addColorStop(1,'rgba(255,100,20,0)');
    SP.fillStyle=g;SP.fillRect(p.x-p.r*5,p.y-p.r*5,p.r*10,p.r*10);
    if(!p.dust){SP.fillStyle='rgba(255,235,170,'+a+')';SP.fillRect(p.x-.8,p.y-.8,1.6,1.6)}
  }
  SP.globalCompositeOperation='source-over';
  if(!sparks.length)SP.clearRect(0,0,W,H);
}
// smoke that drifts slowly through the tavern: the more guests, the more of it (it grows and fades slowly, so a crowd fills the room and an empty room clears)
var smokeCv=mk('canvas','tc-dirt'),SM=null,puffs=[],smokeLevel=0,smokeTex=[],SMW=W/2,SMH=H/2;
smokeCv.width=SMW;smokeCv.height=SMH;SM=smokeCv.getContext('2d');cv.parentNode.insertBefore(smokeCv,shadeCv);
(function makeSmokeTex(){
  for(var n=0;n<4;n++){
    var c=mk('canvas');c.width=c.height=256;var x=c.getContext('2d');
    try{x.filter='blur(7px)'}catch(e){}
    for(var i=0;i<16;i++){
      var a=Math.random()*6.28,r=Math.random()*70,px=128+Math.cos(a)*r*(1.3),py=128+Math.sin(a)*r*.8,rad=28+Math.random()*44;
      var g=x.createRadialGradient(px,py,0,px,py,rad);g.addColorStop(0,'rgba(232,212,190,.7)');g.addColorStop(.6,'rgba(222,202,182,.35)');g.addColorStop(1,'rgba(210,190,170,0)');
      x.fillStyle=g;x.fillRect(px-rad,py-rad,rad*2,rad*2);
    }
    smokeTex.push(c);
  }
})();
var SMOKE_SRC=[[420,440],[850,650],[1400,500],[760,250],[1250,380]];     // the tables, the bar, the stove: where it comes from
function newPuff(){
  var s=SMOKE_SRC[Math.floor(Math.random()*SMOKE_SRC.length)];
  return{x:s[0]+(Math.random()-.5)*260,y:s[1]-40-Math.random()*160,vx:5+Math.random()*10,vy:-(1+Math.random()*4),size:230+Math.random()*260,rot:Math.random()*6.28,vr:(Math.random()-.5)*.05,t:0,life:16+Math.random()*14,tex:smokeTex[Math.floor(Math.random()*smokeTex.length)],ph:Math.random()*6.28,al:.5+Math.random()*.5};
}
function smokeTick(dt){
  var guests=(T.guestCount?T.guestCount():0),target=Math.min(1,(T.smokeForce!=null?T.smokeForce:guests)/12);
  smokeLevel+=(target-smokeLevel)*Math.min(1,dt/14);                  // slow: about 14 s to follow
  var want=Math.round(3+55*smokeLevel);
  while(puffs.length<want&&Math.random()<.5)puffs.push(newPuff());
  SM.clearRect(0,0,SMW,SMH);
  for(var i=puffs.length-1;i>=0;i--){
    var p=puffs[i];p.t+=dt;
    if(p.t>=p.life||(puffs.length>want+3&&p.t>p.life*.5)){puffs.splice(i,1);continue}
    p.x+=(p.vx+Math.sin(p.t*.5+p.ph)*5)*dt;p.y+=(p.vy+Math.cos(p.t*.4+p.ph)*2)*dt;p.rot+=p.vr*dt;
    var k=p.t/p.life,fade=Math.sin(Math.PI*k);
    SM.globalAlpha=Math.min(.24,(.06+.14*smokeLevel)*p.al)*fade;
    var sz=p.size*(1+k*.4)/2;
    SM.save();SM.translate(p.x/2,p.y/2);SM.rotate(p.rot);SM.drawImage(p.tex,-sz/2,-sz/2,sz,sz);SM.restore();
  }
  SM.globalAlpha=1;
}
requestAnimationFrame(fxTick);
try{
  fetch('assets/tavern/lights/lights.json?v=5').then(function(r){return r.json()}).then(function(d){
    lightsDef=d;var left=1+d.lamps.length*2;
    function done(){if(--left<=0){d.lamps.forEach(function(L){if(!L.stove)lightA[L.id]=lightState[L.id]?1:0});drawLights()}}
    function load(file){var im=new Image();im.onload=done;im.onerror=done;im.src='assets/tavern/lights/'+file+'?v=5';return im}
    shadeImg=load(d.shade);
    d.lamps.forEach(function(L){lampImgs[L.weight]=load(L.weight);if(L.core)lampImgs[L.core.file]=load(L.core.file);else done()});
  }).catch(function(){});
}catch(e){}
T.dirtCanvas=dirt;                                    // the scene redraws parts of the picture over the guests, with the dirt that is still on it
// the dirt on the tables comes in 5 levels (assets/tavern/dirt/lvl1..5.webp: only the tables, the rest is transparent); a table gets dirtier level by level
var LV=[],LVN=5,STEP=2,TH=[2,12,26,44,66],TRECT=[[215,330,650,540],[590,500,1105,800],[1180,360,1625,590]];   // the 3 tables: x1,y1,x2,y2
var tlevel=[],tscore=[];
var TQUAD=[[[236,428],[450,358],[600,432],[388,520]],[[612,632],[850,540],[1086,650],[827,786]],[[1201,476],[1400,400],[1600,474],[1416,568]]];   // the table tops (for the right click; can be cleaned at any moment)

for(var li=1;li<=LVN;li++){(function(n){var im=new Image();im.onload=function(){initTables()};im.src='assets/tavern/dirt/lvl'+n+'.webp?v=5';LV[n]=im})(li)}
function lvReady(){for(var n=1;n<=LVN;n++)if(!LV[n]||!LV[n].naturalWidth)return false;return true}
function lvDraw(i,n,alpha,op){var r=TRECT[i],im=LV[n];if(!r||!im||!im.naturalWidth)return;D.globalCompositeOperation=op;D.globalAlpha=alpha;D.drawImage(im,r[0],r[1],r[2]-r[0],r[3]-r[1],r[0],r[1],r[2]-r[0],r[3]-r[1]);D.globalAlpha=1;D.globalCompositeOperation='source-over'}
var tinit=false;
function initTables(){              // the tables start at level 2; whatever the old dirty picture had on them is replaced by the levels
  if(!dirtyOk||!lvReady())return;
  if(tinit&&!initTables.force)return;tinit=true;initTables.force=false;
  TRECT.forEach(function(r,i){                // only the tables' own shapes are cleared (the sprites' transparent parts leave the floor alone)
    for(var n=1;n<=LVN;n++){lvDraw(i,n,1,'destination-out');lvDraw(i,n,1,'destination-out')}
    tlevel[i]=1;tscore[i]=TH[0];lvDraw(i,1,1,'source-over');
  });
}
var dirtyImg=new Image(),dirtyOk=false;
function paintDirt(){
  D.globalCompositeOperation='source-over';D.clearRect(0,0,W,H);
  if(dirtyOk)D.drawImage(dirtyImg,0,0,W,H);
  initTables();
}
dirtyImg.onload=function(){dirtyOk=true;tinit=false;paintDirt();refreshInfo()};
dirtyImg.src=DIRTY;
var cleanImg=new Image();cleanImg.src=T.roomSrc;           // the clean picture: the difference to the dirty one is what lies on the tables
// the dirt and the effects lie exactly over the picture, wherever the scene puts it
function sync(){
  ['left','top','width','height'].forEach(function(k){dirt.style[k]=cv.style[k];fx.style[k]=cv.style[k];stoveCv.style[k]=cv.style[k];shadeCv.style[k]=cv.style[k];coreCv.style[k]=cv.style[k];sparkCv.style[k]=cv.style[k];smokeCv.style[k]=cv.style[k]});
}
new MutationObserver(sync).observe(cv,{attributes:true,attributeFilter:['style']});
addEventListener('resize',sync);sync();

// ---------- what may be cleaned ----------
var calRef=null,floorMask=null,zones=[],cleaned=[];
function polyPath(c,p){c.beginPath();p.forEach(function(q,i){if(i)c.lineTo(q[0],q[1]);else c.moveTo(q[0],q[1])});c.closePath()}
function pip(p,x,y){var ins=false;for(var i=0,j=p.length-1;i<p.length;j=i++){var a=p[i],b=p[j];if(((a[1]>y)!==(b[1]>y))&&(x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]))ins=!ins}return ins}
function prepare(){
  var cal=T.calibration();if(!cal||cal===calRef)return;
  calRef=cal;
  floorMask=mk('canvas');floorMask.width=W;floorMask.height=H;
  var f=floorMask.getContext('2d');
  f.fillStyle='#fff';(cal.surfaces||[]).forEach(function(sf){sf.polys.forEach(function(p){if(p.length>=3){polyPath(f,p);f.fill()}})});
  f.globalCompositeOperation='destination-out';
  (cal.cleanExclude||[]).forEach(function(p){if(p.length>=3){polyPath(f,p);f.fill()}});
  zones=cal.tableMask.filter(function(p){return p.length>=3});
  while(cleaned.length<zones.length)cleaned.push(false);
  cleaned.length=zones.length;
  small=null;
}

// ---------- the sponge ----------
var scratch=mk('canvas');
// the sponge lies flat on the floor: seen from above at an angle its footprint is a flattened ellipse, and it is smaller farther away.
// Held against a wall it touches in a round patch.
function flatOf(q){return IMG[q.img].flat*q.flat}
function sp(x,y){return T.spongeAt(Math.max(0,Math.min(W,x)),Math.max(0,Math.min(H,y)))}      // size, flatness ... at that place (from the tool)
function depthK(x,y){return sp(x,y).scale}
function stamp(x,y){
  var q=sp(x,y),k=q.scale,rx=Math.round(RADIUS*k),ry=Math.max(2,Math.round(rx*flatOf(q))),sc=scratch.getContext('2d');
  scratch.width=rx*2;scratch.height=ry*2;
  sc.setTransform(1,0,0,ry/rx,rx,ry);
  var g=sc.createRadialGradient(0,0,0,0,0,rx);
  g.addColorStop(0,'rgba(0,0,0,'+STRENGTH+')');g.addColorStop(.6,'rgba(0,0,0,'+STRENGTH*.7+')');g.addColorStop(1,'rgba(0,0,0,0)');
  sc.fillStyle=g;sc.fillRect(-rx,-rx,rx*2,rx*2);
  sc.setTransform(1,0,0,1,0,0);
  sc.globalCompositeOperation='destination-in';           // only where the floor is
  sc.drawImage(floorMask,-(x-rx),-(y-ry));
  D.globalCompositeOperation='destination-out';
  D.drawImage(scratch,x-rx,y-ry);
  D.globalCompositeOperation='source-over';
}
function rubTo(x,y){
  prepare();
  if(!last){last={x:x,y:y};stamp(x,y);return}
  var step=SPACING*depthK(x,y),dx=x-last.x,dy=y-last.y,d=Math.hypot(dx,dy),n=Math.floor(d/step);
  if(n>0){
    rubbed+=n*step;
    var ux=dx/d,uy=dy/d;
    for(var i=1;i<=n;i++)stamp(last.x+ux*step*i,last.y+uy*step*i);
    last={x:last.x+ux*step*n,y:last.y+uy*step*n};
  }
  if(now()-lastBubble>45&&d>2){lastBubble=now();bubble(x,y,1)}
}

// ---------- soap bubbles ----------
var parts=[],loop=false,lastBubble=0;
function now(){return performance.now()}
function bubble(x,y,n){
  for(var i=0;i<n;i++)parts.push({x:x+(Math.random()-.5)*RADIUS*1.2,y:y+(Math.random()-.5)*RADIUS*.8,r:3+Math.random()*7,vy:-8-Math.random()*14,vx:(Math.random()-.5)*10,t:0,life:.7+Math.random()*.7});
  if(!loop){loop=true;requestAnimationFrame(frame)}
}
var prevT=0;
function frame(t){
  var dt=Math.min(.05,(t-prevT)/1000||.016);prevT=t;
  X.clearRect(0,0,W,H);
  for(var i=parts.length-1;i>=0;i--){
    var p=parts[i];p.t+=dt;if(p.t>=p.life){parts.splice(i,1);continue}
    p.x+=p.vx*dt;p.y+=p.vy*dt;
    var a=1-p.t/p.life;
    X.beginPath();X.arc(p.x,p.y,p.r,0,Math.PI*2);X.fillStyle='rgba(255,255,255,'+(.22*a)+')';X.fill();
    X.lineWidth=1.2;X.strokeStyle='rgba(255,255,255,'+(.7*a)+')';X.stroke();
    X.beginPath();X.arc(p.x-p.r*.35,p.y-p.r*.35,p.r*.25,0,Math.PI*2);X.fillStyle='rgba(255,255,255,'+(.9*a)+')';X.fill();
  }
  if(parts.length)requestAnimationFrame(frame);else{loop=false;X.clearRect(0,0,W,H)}
}

// ---------- the table ----------
// "Očisti sto" cleans only the drawn table mask (tableMask); the bottles are left out of it on purpose, and the floor under the table is cleaned by the sponge
function cleanZone(i){
  if(!TRECT[i]||cleaning[i])return;
  cleaning[i]=true;
  var N=16,k=0,L=tlevel[i]||0;
  (function step(){
    var a=1/(N-k);                                      // the last step takes whatever is left
    if(L)lvDraw(i,L,a,'destination-out');
    if(k%3===0){var r=TRECT[i];if(r)bubble(r[0]+(r[2]-r[0])*(.2+.6*Math.random()),r[1]+(r[3]-r[1])*(.3+.5*Math.random()),2)}
    if(++k<N)setTimeout(step,45);else{cleaned[i]=true;cleaning[i]=false;tlevel[i]=0;tscore[i]=0;refreshInfo()}
  })();
}
var cleaning={};
function center(p){var x=0,y=0;p.forEach(function(q){x+=q[0];y+=q[1]});return[x/p.length,y/p.length]}

// ---------- the numbers ----------
var info=mk('div','tc-info'),hint=mk('div','tc-hint'),reset=mk('button','tc-reset'),sponge=mk('div','tc-sponge'),menu=mk('div','tc-menu');
reset.type='button';reset.textContent='↺ zaprljaj opet';
hint.textContent='Desni klik → izaberi alat (sunđer, ruka) · sa sunđerom drži levi klik i trljaj · desni klik na sto → „Očisti sto“, na prljavu posudu → „Pranje“';
// the sponge: lying (three pictures: dry, soapy while it is pressed, dirty after a lot of cleaning) or upright (one picture, tinted when it is dirty)
sponge.innerHTML='<div class="tc-shadow"></div><img alt="" draggable="false" src="'+IMG.lezeci.states.suv+'">';
var spImg=sponge.querySelector('img'),spShadow=sponge.querySelector('.tc-shadow'),spKey='lezeci',spState='suv';
Object.keys(IMG).forEach(function(k){var c=IMG[k];[c.src].concat(c.states?Object.keys(c.states).map(function(n){return c.states[n]}):[]).forEach(function(u){var i=new Image();i.src=u})});
var rubbed=0,DIRTY_AFTER=3500;                         // how far the sponge has been rubbed (scene pixels); after that it is dirty
var TINT={suv:'none',sapun:'brightness(1.08) saturate(.9)',prljav:'brightness(.78) sepia(.55) saturate(.85)'};
function spongeLook(key){
  var st=down?'sapun':(rubbed>DIRTY_AFTER?'prljav':'suv'),c=IMG[key],src=c.states?c.states[st]:c.src;
  if(key!==spKey||st!==spState){
    spKey=key;spState=st;
    if(spImg.getAttribute('src')!==src)spImg.src=src;
    spImg.style.filter=c.states?'none':TINT[st];
  }
}
room.appendChild(info);room.appendChild(hint);room.appendChild(reset);room.appendChild(sponge);room.appendChild(menu);

var small=null;
function floorPercent(){
  prepare();if(!floorMask||!dirtyOk)return 0;
  var w=Math.round(W/6),h=Math.round(H/6);
  if(!small){
    var fm=mk('canvas');fm.width=w;fm.height=h;fm.getContext('2d').drawImage(floorMask,0,0,w,h);
    small={cv:mk('canvas'),mask:fm.getContext('2d').getImageData(0,0,w,h).data,w:w,h:h};small.cv.width=w;small.cv.height=h;
  }
  var sc=small.cv.getContext('2d');sc.clearRect(0,0,w,h);sc.drawImage(dirt,0,0,w,h);
  var d=sc.getImageData(0,0,w,h).data,m=small.mask,tot=0,rem=0;
  for(var i=3;i<d.length;i+=4){if(m[i]>128){tot++;rem+=d[i]/255}}
  return tot?Math.round((1-rem/tot)*100):0;
}
function refreshInfo(){
  prepare();
  var n=cleaned.filter(Boolean).length;
  info.textContent='Kafana: '+floorPercent()+'% čista  ·  Stolovi: '+n+' / '+zones.length+' čisti';
}
setInterval(function(){if(T.isOpen)refreshInfo()},500);

// ---------- the mouse ----------
var down=false,last=null,lastPos=null;
function toScene(e){var r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*W,y:(e.clientY-r.top)/r.height*H}}
function overUi(e){return !!(e.target.closest&&e.target.closest('button,.tc-menu'))}
var tool='ruka';                                      // the tool chosen in the ring menu (right click): 'sponge' or 'ruka' (hand)
function moveSponge(e){
  var over=overUi(e);
  sponge.style.display=over||!T.isOpen||tool!=='sponge'?'none':'block';
  room.style.cursor=over?'pointer':'';room.classList.toggle('tc-sponge-on',tool==='sponge'&&!over);
  if(tool!=='sponge')return;
  var p=toScene(e),q=sp(p.x,p.y),c=IMG[q.img],r=cv.getBoundingClientRect(),ss=r.width/W;
  var w=c.w,h=Math.round(c.w*c.ratio),ax=Math.round(c.ax*w),ay=Math.round(c.ay*h),lying=q.kind==='h';
  var vx=lastPos?e.clientX-lastPos.x:0;lastPos={x:e.clientX,y:e.clientY};
  // it slides: it leans a little in the direction it is pushed; a lying sponge is lifted when it does not touch the surface
  var sk=down?Math.max(-12,Math.min(12,vx*.5)):0,lift=lying?(down?2:q.lift):0;
  sponge.style.width=w+'px';sponge.style.height=h+'px';sponge.style.transformOrigin=ax+'px '+ay+'px';
  sponge.style.left=(e.clientX-ax)+'px';sponge.style.top=(e.clientY-ay)+'px';
  sponge.style.transform='scale('+(q.scale*ss)+','+(q.scale*ss*q.flat)+') rotate('+q.angle+'deg) skewX('+(q.skew-sk)+'deg)';
  spImg.style.transform='translateY('+(-lift)+'px)';
  spShadow.style.display=lying?'block':'none';
  spShadow.style.left=(ax-w*.6)+'px';spShadow.style.top=(ay-w*.17)+'px';spShadow.style.width=(w*1.2)+'px';spShadow.style.height=(w*.34)+'px';
  spShadow.style.opacity=down?Math.min(1,q.shadow*1.8):q.shadow;
  spongeLook(q.img);
}
function hideMenu(){menu.style.display='none'}
room.addEventListener('pointerdown',function(e){
  if(e.button!==0||overUi(e)){if(e.button===0&&!e.target.closest('.tc-menu'))hideMenu();return}
  hideMenu();
  if(tool!=='sponge')return;
  down=true;sponge.classList.add('down');last=null;
  try{room.setPointerCapture(e.pointerId)}catch(_){}
  var p=toScene(e);rubTo(p.x,p.y);moveSponge(e);
});
room.addEventListener('pointermove',function(e){
  moveSponge(e);
  if(down&&tool==='sponge'){var p=toScene(e);rubTo(p.x,p.y)}
});
function release(e){
  if(!down)return;down=false;last=null;sponge.classList.remove('down');
  try{room.releasePointerCapture(e.pointerId)}catch(_){}
  refreshInfo();moveSponge(e);
}
room.addEventListener('pointerup',release);room.addEventListener('pointercancel',release);
room.addEventListener('pointerleave',function(){if(!down)sponge.style.display='none'});
setTool('ruka');
function setTool(t){tool=t;down=false;last=null;sponge.style.display='none';room.classList.toggle('tc-sponge-on',false);if(t==='sponge')room.classList.add('tc-sponge-on')}
// right click anywhere: a ring with the tools (sponge, hand) and, where it fits, "Očisti sto" (over a table) and "Pranje" (over a dirty bowl)
room.addEventListener('contextmenu',function(e){
  e.preventDefault();
  if(overUi(e))return;
  prepare();
  var p=toScene(e),zi=-1,i;
  for(i=0;i<TQUAD.length;i++)if(pip(TQUAD[i],p.x,p.y)){zi=i;break}
  var dish=T.dirtyDishAt&&T.dirtyDishAt(p.x,p.y);
  var opts=[{ic:'🧽',t:'Sunđer',on:tool==='sponge',fn:function(){setTool('sponge')}},{ic:'✋',t:'Ruka',on:tool!=='sponge',fn:function(){setTool('ruka')}}];
  var lamp=lampAt(p.x,p.y);
  if(lamp)opts.push({ic:'💡',t:lampLit(lamp)?'Ugasi svetlo':'Upali svetlo',fn:function(){setLamp(lamp,!lampLit(lamp))}});
  if(stoveOk&&p.x>=STOVE_RECT[0]&&p.x<=STOVE_RECT[2]&&p.y>=STOVE_RECT[1]&&p.y<=STOVE_RECT[3])opts.push({ic:'🔥',t:stoveLit?'Ugasi vatru':'Zapali vatru',fn:function(){setStove(!stoveLit)}});
  if(zi>=0)opts.push({ic:'🫧',t:'Očisti sto',off:!tlevel[zi]||!!cleaning[zi],fn:function(){cleanZone(zi)}});
  if(dish)opts.push({ic:'🍽️',t:'Pranje',fn:function(){
    if(T.dirtyDishAt(p.x,p.y,true)){try{if(window.CooksterSinkDishes)window.CooksterSinkDishes.add()}catch(_){}}
  }});
  menu.innerHTML='<div class="tc-ring"></div>';
  opts.forEach(function(o,k){
    var b=mk('button'),a=-Math.PI/2+k*2*Math.PI/opts.length;
    b.type='button';b.innerHTML='<i>'+o.ic+'</i>'+o.t;if(o.on)b.className='on';b.disabled=!!o.off;
    b.style.left=(Math.cos(a)*(opts.length>1?62:0)).toFixed(1)+'px';b.style.top=(Math.sin(a)*(opts.length>1?62:0)).toFixed(1)+'px';
    b.onclick=function(ev){ev.stopPropagation();hideMenu();o.fn()};
    menu.appendChild(b);
  });
  menu.style.left=Math.max(100,Math.min(e.clientX,innerWidth-100))+'px';menu.style.top=Math.max(100,Math.min(e.clientY,innerHeight-100))+'px';menu.style.display='block';
  sponge.style.display='none';room.style.cursor='pointer';room.classList.remove('tc-sponge-on');
});
reset.addEventListener('click',function(e){
  e.stopPropagation();rubbed=0;initTables.force=true;paintDirt();cleaned=zones.map(function(){return false});cleaning={};hideMenu();refreshInfo();
});
// the hint fades once the player has started cleaning
var hinted=false;
room.addEventListener('pointerdown',function(){if(!hinted){hinted=true;setTimeout(function(){hint.style.opacity='0'},4000)}},true);

// the hall gets dirty again while it works: a table gets (a little more) dirty with every dish and drink, the floor with every guest
// the table gets dirty again with every dish and drink and with the time people sit at it; the points needed for each level are in TH (the last pictures, with lots of things, only after long sitting) (the picture of the next level fades in over the old one)
function setLevel(i,n){
  var o=tlevel[i]||0;if(n<=o||!lvReady())return;
  tlevel[i]=n;var k=0,N=3;
  if(o)lvDraw(i,o,1,'destination-out');
  (function step(){lvDraw(i,n,1/(N-k),'source-over');if(++k<N)setTimeout(step,200)})();
}
function dirtyZone(i,count){
  prepare();if(!TRECT[i]||!dirtyOk||cleaning[i])return;
  tscore[i]=(tscore[i]||0)+(count>0?count:1);
  var n=0;while(n<LVN&&tscore[i]>=TH[n])n++;               // level n when the points reach TH[n-1]
  if(n>0)cleaned[i]=false;
  setLevel(i,n);
}
function markDirty(i){prepare();if(i>=0&&i<cleaned.length&&!cleaning[i]){cleaned[i]=false;refreshInfo()}}
function floorDirt(n){
  prepare();if(!floorMask||!dirtyOk)return;
  var sc=mk('canvas');sc.width=W;sc.height=H;var c=sc.getContext('2d');
  for(var k=0;k<Math.max(1,n);k++){
    var x=Math.random()*W,y=H*.35+Math.random()*H*.62,r=40+Math.random()*60;
    var g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(0,0,0,.55)');g.addColorStop(1,'rgba(0,0,0,0)');
    c.globalCompositeOperation='source-over';c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();
  }
  c.globalCompositeOperation='source-in';c.drawImage(dirtyImg,0,0,W,H);
  c.globalCompositeOperation='destination-in';c.drawImage(floorMask,0,0);
  D.globalCompositeOperation='source-over';D.drawImage(sc,0,0);
}
window.CooksterTavernClean={dirty:dirtyZone,markDirty:markDirty,floorDirt:floorDirt,reset:function(){reset.click()},floorPercent:floorPercent,zones:function(){return zones.length},cleaned:function(){return cleaned.slice()}};
})();
