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
var RADIUS=46,SPACING=9,STRENGTH=.085;               // sponge: size, distance between two touches, how much one touch removes
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
'#tavernScene .tc-signwrap{position:absolute;container-type:inline-size;pointer-events:none;transition:opacity .5s}'+
'#tavernScene .tc-sign{position:absolute;left:9.7%;top:6.4%;width:9.72%;aspect-ratio:520/515;pointer-events:none;transform-origin:54% 12%;perspective:700px}'+
'#tavernScene .tc-sign img{position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;-webkit-user-drag:none;transform-origin:54% 50%;filter:drop-shadow(0 4px 4px rgba(0,0,0,.6));-webkit-mask-image:linear-gradient(transparent 33%,#000 42%);mask-image:linear-gradient(transparent 33%,#000 42%)}'+
'#tavernScene .tc-sign.swing{animation:tcSwing 1.5s ease-out}@keyframes tcSwing{0%{rotate:0deg}20%{rotate:7deg}40%{rotate:-5deg}60%{rotate:3deg}80%{rotate:-1.5deg}100%{rotate:0deg}}'+
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
coreCv.width=W;coreCv.height=H;
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
// The darkness is a plain layer (almost black, with more or less alpha), not a "multiply" layer: a blend mode over the whole screen made the tavern
// run at half the speed. The alpha of every point is worked out here: (how much darker the dark picture is) x (how much of the light of the lit lamps does not reach it).
var fLum=null,wArr={},shData=null;
function prepCpu(){
  var w=shadeImg.naturalWidth,h=shadeImg.naturalHeight,c=mk('canvas');c.width=w;c.height=h;
  var x=c.getContext('2d',{willReadFrequently:true}),d,i;
  x.drawImage(shadeImg,0,0);d=x.getImageData(0,0,w,h).data;fLum=new Float32Array(w*h);
  for(i=0;i<w*h;i++)fLum[i]=(d[i*4]*.5+d[i*4+1]*.35+d[i*4+2]*.15)/255;      // the light of the room is mostly red / orange: the red counts most
  lightsDef.lamps.forEach(function(L){
    x.clearRect(0,0,w,h);x.drawImage(lampImgs[L.weight],0,0,w,h);d=x.getImageData(0,0,w,h).data;
    var arr=new Float32Array(w*h);for(i=0;i<w*h;i++)arr[i]=d[i*4+3]/255;wArr[L.id]=arr;
  });
  shadeCv.width=w;shadeCv.height=h;SH=shadeCv.getContext('2d');shData=SH.createImageData(w,h);
  for(i=0;i<w*h;i++){shData.data[i*4+2]=6}
}
function drawLights(){
  if(!lightsDef||!fLum)return;
  var n=fLum.length,lit=new Float32Array(n),i;
  CR.clearRect(0,0,W,H);
  lightsDef.lamps.forEach(function(L){
    var a=lampAmount(L),arr=wArr[L.id];
    if(a>0&&arr){for(i=0;i<n;i++)lit[i]+=a*arr[i]}
    if(L.core&&a<1){var ci=lampImgs[L.core.file];if(ci&&ci.naturalWidth){CR.globalAlpha=1-a;CR.drawImage(ci,L.core.x,L.core.y,L.core.w,L.core.h)}}
  });
  CR.globalAlpha=1;
  var dd=shData.data;
  for(i=0;i<n;i++){var l=lit[i]>1?1:lit[i];dd[i*4+3]=(1-fLum[i])*(1-l)*255}
  SH.putImageData(shData,0,0);
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
var sparkCv=mk('canvas','tc-fx'),SP=sparkCv.getContext('2d'),sparks=[],lastFx=0,spawnAcc=0,lightT=0,glowSpr={};
sparkCv.width=W;sparkCv.height=H;cv.parentNode.insertBefore(sparkCv,fx);
var FIRE={x:1217,y:372};                                // the opening of the stove
function makeGlow(dust){
  var c=mk('canvas');c.width=c.height=64;var x=c.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);
  g.addColorStop(0,dust?'rgba(255,225,160,1)':'rgba(255,200,90,1)');g.addColorStop(.35,dust?'rgba(255,190,100,.4)':'rgba(255,120,30,.5)');g.addColorStop(1,'rgba(255,100,20,0)');
  x.fillStyle=g;x.fillRect(0,0,64,64);return c;
}
function spawnSpark(dust){
  var up=dust?-(2+Math.random()*5):-(14+Math.random()*28);
  sparks.push({x:FIRE.x+(Math.random()-.5)*(dust?150:34),y:FIRE.y+(dust?(Math.random()-.8)*110:(Math.random()-.4)*14),vx:(Math.random()-.5)*(dust?4:10),vy:up,t:0,life:dust?4+Math.random()*4:1.8+Math.random()*2.4,r:dust?1.2+Math.random()*1.6:1.6+Math.random()*2.4,dust:dust,ph:Math.random()*6.28});
}
function fxTick(now){
  requestAnimationFrame(fxTick);
  if(!T.isOpen||now-lastFx<33)return;
  var dt=Math.min(.1,(now-lastFx)/1000);lastFx=now;
  smokeTick(dt);
  lightT+=dt;if(lightT>=.066&&lightsDef&&lightsDef.lamps.some(function(L){return L.stove?(stoveLit||stoveA<1):!!lightState[L.id]})){lightT=0;drawLights()}
  if(stoveLit&&stoveA<.5){spawnAcc+=dt*(5+Math.random()*3);while(spawnAcc>=1){spawnAcc--;spawnSpark(false);if(Math.random()<.6)spawnSpark(true)}}
  if(!sparks.length)return;
  SP.clearRect(0,0,W,H);SP.globalCompositeOperation='lighter';
  for(var i=sparks.length-1;i>=0;i--){
    var p=sparks[i];p.t+=dt;if(p.t>=p.life){sparks.splice(i,1);continue}
    p.x+=p.vx*dt+Math.sin(p.t*1.6+p.ph)*(p.dust?3:7)*dt;p.y+=p.vy*dt;if(!p.dust)p.vy*=.992;
    var k=p.t/p.life,a=(p.dust?.9*Math.sin(Math.PI*k)*(.6+.4*Math.sin(p.t*4+p.ph)):(1-k)*(.75+.25*Math.sin(p.t*12+p.ph)));
    var spr=glowSpr[p.dust?'d':'e']||(glowSpr[p.dust?'d':'e']=makeGlow(p.dust)),gr=p.r*(p.dust?5:4);
    SP.globalAlpha=Math.max(0,Math.min(1,a));SP.drawImage(spr,p.x-gr,p.y-gr,gr*2,gr*2);SP.globalAlpha=1;
    if(!p.dust){SP.fillStyle='rgba(255,235,170,'+a+')';SP.fillRect(p.x-.8,p.y-.8,1.6,1.6)}
  }
  SP.globalCompositeOperation='source-over';
  if(!sparks.length)SP.clearRect(0,0,W,H);
}
// smoke that drifts slowly through the tavern: the more guests, the more of it (it grows and fades slowly, so a crowd fills the room and an empty room clears)
var ventK=0,smokeCv=mk('canvas','tc-dirt'),SM=null,puffs=[],smokeLevel=0,smokeTex=[],SMW=W/4,SMH=H/4,smokeT=0;
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
  var s=SMOKE_SRC[Math.floor(Math.random()*SMOKE_SRC.length)],rise=Math.random()<.65;       // most of the smoke climbs slowly up to the ceiling
  if(rise)return{x:s[0]+(Math.random()-.5)*220,y:s[1]-60-Math.random()*80,vx:(Math.random()-.5)*14,vy:-(20+Math.random()*16),size:200+Math.random()*220,rot:Math.random()*6.28,vr:(Math.random()-.5)*.05,t:0,life:20+Math.random()*10,tex:smokeTex[Math.floor(Math.random()*smokeTex.length)],ph:Math.random()*6.28,al:.6+Math.random()*.5,rise:1};
  return{x:s[0]+(Math.random()-.5)*260,y:s[1]-40-Math.random()*160,vx:5+Math.random()*10,vy:-(1+Math.random()*4),size:230+Math.random()*260,rot:Math.random()*6.28,vr:(Math.random()-.5)*.05,t:0,life:16+Math.random()*14,tex:smokeTex[Math.floor(Math.random()*smokeTex.length)],ph:Math.random()*6.28,al:.5+Math.random()*.5};
}
function smokeTick(dt){
  smokeT+=dt;if(smokeT<.1)return;dt=smokeT;smokeT=0;                  // 10 times in a second is enough for such a slow smoke
  ventK+=((doorOpen?1:0)-ventK)*Math.min(1,dt/7);
  var guests=(T.guestCount?T.guestCount():0),target=Math.min(1,(T.smokeForce!=null?T.smokeForce:guests)/9)*(1-.85*ventK);
  smokeLevel+=(target-smokeLevel)*Math.min(1,dt/14);                  // slow: about 14 s to follow
  var want=Math.round(5+40*smokeLevel);
  while(puffs.length<want&&Math.random()<.6)puffs.push(newPuff());
  SM.clearRect(0,0,SMW,SMH);
  if(smokeLevel>.05){                                                  // the smoke collects under the ceiling
    var hz=SM.createLinearGradient(0,0,0,SMH*.5);hz.addColorStop(0,'rgba(200,184,164,'+(.5*smokeLevel).toFixed(3)+')');hz.addColorStop(.55,'rgba(200,184,164,'+(.16*smokeLevel).toFixed(3)+')');hz.addColorStop(1,'rgba(200,184,164,0)');
    SM.fillStyle=hz;SM.fillRect(0,0,SMW,SMH*.5);
  }
  for(var i=puffs.length-1;i>=0;i--){
    var p=puffs[i];p.t+=dt;
    if(p.t>=p.life||(!p.dust&&puffs.length>want+3&&p.t>p.life*.5)){puffs.splice(i,1);continue}
    if(p.t<0)continue;
    p.x+=(p.vx+Math.sin(p.t*.5+p.ph)*5)*dt;p.y+=(p.vy+Math.cos(p.t*.4+p.ph)*2)*dt;p.rot+=p.vr*dt;
    var k=p.t/p.life,fade=Math.sin(Math.PI*k);
    SM.globalAlpha=Math.min(p.dust?.55:.3,(.07+.18*smokeLevel)*p.al)*fade;
    var sz=p.size*(1+k*.4)/4;
    SM.save();SM.translate(p.x/4,p.y/4);SM.rotate(p.rot);SM.drawImage(p.tex,-sz/2,-sz/2,sz,sz);SM.restore();
  }
  SM.globalAlpha=1;
}
requestAnimationFrame(fxTick);
try{
  fetch('assets/tavern/lights/lights.json?v=5').then(function(r){return r.json()}).then(function(d){
    lightsDef=d;var left=1+d.lamps.length*2;
    function done(){if(--left<=0){d.lamps.forEach(function(L){if(!L.stove)lightA[L.id]=lightState[L.id]?1:0});prepCpu();drawLights()}}
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
  ['left','top','width','height'].forEach(function(k){dirt.style[k]=cv.style[k];fx.style[k]=cv.style[k];stoveCv.style[k]=cv.style[k];if(doorCv)doorCv.style[k]=cv.style[k];if(signWrap)signWrap.style[k]=cv.style[k];shadeCv.style[k]=cv.style[k];coreCv.style[k]=cv.style[k];sparkCv.style[k]=cv.style[k];smokeCv.style[k]=cv.style[k]});
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
  if(scratch.width<rx*2||scratch.height<ry*2){scratch.width=Math.max(scratch.width,rx*2);scratch.height=Math.max(scratch.height,ry*2)}     // the work canvas only grows, resizing it for every touch was slow
  sc.setTransform(1,0,0,1,0,0);sc.globalCompositeOperation='source-over';sc.clearRect(0,0,scratch.width,scratch.height);
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
// the sponge over a table: a few passes wipe the whole table clean (WIPE_NEED = how far the sponge has to travel over that table, scene pixels)
var WIPE_NEED=760,wipe=[];
function wipeTable(x0,y0,x1,y1,d){
  for(var i=0;i<TQUAD.length;i++){
    if(!tlevel[i]||cleaning[i]||!pip(TQUAD[i],x1,y1))continue;
    var w0=wipe[i]||0,w1=Math.min(WIPE_NEED,w0+d);wipe[i]=w1;
    var L=tlevel[i];lvDraw(i,L,Math.min(1,(w1-w0)/(WIPE_NEED-w0)),'destination-out');
    if(Math.random()<.5){var r=TRECT[i];bubble(x1,y1,1)}
    if(w1>=WIPE_NEED){lvDraw(i,L,1,'destination-out');cleaned[i]=true;tlevel[i]=0;tscore[i]=0;wipe[i]=0;refreshInfo()}
  }
}
function rubTo(x,y){
  prepare();
  if(!last){last={x:x,y:y};stamp(x,y);return}
  var step=SPACING*depthK(x,y),dx=x-last.x,dy=y-last.y,d=Math.hypot(dx,dy),n=Math.floor(d/step);
  if(n>0){
    rubbed+=n*step;
    var ux=dx/d,uy=dy/d;
    for(var i=1;i<=n;i++)stamp(last.x+ux*step*i,last.y+uy*step*i);
    wipeTable(last.x,last.y,last.x+ux*step*n,last.y+uy*step*n,n*step);
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
  var rep=0;try{rep=window.CooksterQuality?window.CooksterQuality.reputation():0}catch(e){}
  if(performance.now()<msgUntil)return;
  info.textContent='Kafana: '+floorPercent()+'% čista  ·  Stolovi: '+n+' / '+zones.length+' čisti  ·  Ugled: '+(rep>0?'+':'')+rep;
}
var msgUntil=0;
function showMsg(t){info.textContent=t;msgUntil=performance.now()+2600;setTimeout(refreshInfo,2700)}
setInterval(function(){if(T.isOpen&&!down)refreshInfo()},1500);
// ---------- the door: right click -> "Provetri": the door opens (the picture of the open door fades in over the closed one) and the smoke thins out ----------
var doorOpen=false,doorA=0,doorCv=null;
var DOOR_RECT=[105,0,350,355],DOOR_POS=[100,0],doorImg=new Image();
doorCv=mk('canvas','tc-dirt');doorCv.width=W;doorCv.height=H;
cv.parentNode.insertBefore(doorCv,cv);                       // right under the people (above the dirt), so everybody walks in front of the door and the sign
doorImg.src='assets/tavern/vrata_otvorena.webp?v=1';
var DOOR_N=40,doorFr=[],doorFrOk=0;
for(var di=0;di<DOOR_N;di++)(function(i){var im=new Image();im.onload=function(){doorFrOk++};im.src='assets/tavern/vrata/d'+(i<10?'0':'')+i+'.webp?v=1';doorFr.push(im)})(di);
var DOORC_N=41,doorCl=[],doorClOk=0;
for(var dj=0;dj<DOORC_N;dj++)(function(i){var im=new Image();im.onload=function(){doorClOk++};im.src='assets/tavern/vrata_zatvaranje/c'+(i<10?'0':'')+i+'.webp?v=1';doorCl.push(im)})(dj);
function drawDoor(){                                   // doorA = how far the door is open (0 closed .. 1 open); the pictures are the frames of the door opening (from a video)
  var c=doorCv.getContext('2d');c.clearRect(0,0,W,H);
  if(doorA>0){
    if(doorFrOk>=DOOR_N){var i=Math.min(DOOR_N-1,Math.round(doorA*(DOOR_N-1)));c.globalAlpha=Math.min(1,doorA*(DOOR_N-1)/2);c.drawImage(doorFr[i],DOOR_POS[0],DOOR_POS[1],260,360);c.globalAlpha=1}
    else if(doorImg.naturalWidth){c.globalAlpha=doorA;c.drawImage(doorImg,DOOR_POS[0],DOOR_POS[1]);c.globalAlpha=1}
  }
  if(signWrap)signWrap.style.opacity=String(1-Math.min(1,doorA*6));
}
function dustPuff(){                                  // a small cloud of dust that comes out of the door frame when the door is slammed
  var spots=[[150,300,-14],[330,300,14],[240,340,0],[200,330,-6],[290,330,6]];
  spots.forEach(function(a,i){puffs.push({x:a[0]+(Math.random()-.5)*20,y:a[1]+(Math.random()-.5)*14,vx:a[2]*(1+Math.random()*.6),vy:-(10+Math.random()*12),size:90+Math.random()*80,rot:Math.random()*6.28,vr:(Math.random()-.5)*.3,t:-i*.04,life:1.7+Math.random()*.6,tex:smokeTex[Math.floor(Math.random()*smokeTex.length)],ph:Math.random()*6.28,al:5,dust:1})});
}
function dustFall(){                                 // fine dust that falls down along the door after the slam
  for(var i=0;i<14;i++)puffs.push({x:140+Math.random()*210,y:20+Math.random()*120,vx:(Math.random()-.5)*10,vy:18+Math.random()*30,size:34+Math.random()*50,rot:Math.random()*6.28,vr:(Math.random()-.5)*.4,t:-Math.random()*.5,life:1.8+Math.random()*1.2,tex:smokeTex[Math.floor(Math.random()*smokeTex.length)],ph:Math.random()*6.28,al:4,dust:1});
}
var doorSnds=[],doorAnim=0,doorManual=false,doorAutoUntil=0,doorAutoTimer=0;
function setDoor(v,opt){                               // opt.auto: opened/closed by the guests (gently, no message); manual close = the slam with dust
  opt=opt||{};
  if(v===doorOpen)return;doorOpen=v;
  if(!opt.auto)doorManual=v;
  var id=++doorAnim,t0=performance.now(),soft=!!opt.soft;
  function slam(){dustPuff();dustFall();if(signEl){signEl.classList.remove('swing');void signEl.offsetWidth;signEl.classList.add('swing')}}      // the slam: dust at the door frame and falling down, the sign sways
  var side=opt.auto?'guest':'me',snds=[];     // the sounds of the door (tool "Zvuk": JA / GOST); every sound starts at a time chosen there, counted from the start of the opening or from the moment the door hits the frame
  function planSound(action,hitS){try{if(window.CooksterSound&&window.CooksterSound.door){var t=window.CooksterSound.door(side,action,hitS);if(t)snds.push(t)}}catch(e){}}
  doorSnds.forEach(clearTimeout);doorSnds=snds;       // a new movement of the door cancels the sounds that are still waiting from the old one
  function done(){if(!soft)slam()}                 // the dust comes when the door hits the frame
  var hitS=v?0:(doorClOk>=DOORC_N?(soft?1.5:.62):(soft?.9:.42));       // when the door touches the frame (seconds after it starts to close)
  if(v)planSound('open',0);else{planSound('close',hitS);planSound('slam',hitS)}
  if(!v&&doorClOk>=DOORC_N){                           // closing: its own frames (a video of the door shutting); the curtain stays on the door
    var dur=soft?1500:620;
    (function f(now){if(id!==doorAnim)return;var k=Math.min(1,(now-t0)/dur),e=soft?k*k*(3-2*k):.25*k+.75*k*k;
      var c=doorCv.getContext('2d');c.clearRect(0,0,W,H);c.drawImage(doorCl[Math.min(DOORC_N-1,Math.round(e*(DOORC_N-1)))],DOOR_POS[0],DOOR_POS[1],260,360);
      if(signWrap)signWrap.style.opacity='0';
      if(k<1)requestAnimationFrame(f);else{doorA=0;drawDoor();done()}
    })(t0);
  }else{
    var from=doorA,to=v?1:0,dur2=v?1700:(soft?900:420);
    (function f(now){if(id!==doorAnim)return;var k=Math.min(1,(now-t0)/dur2),e=v?k*k*(3-2*k):(soft?k*k*(3-2*k):k*k);doorA=from+(to-from)*e;drawDoor();
      if(k<1)requestAnimationFrame(f);else if(!v)done();
    })(t0);
  }
  if(!opt.auto)showMsg(v?'Vrata su otvorena — provetrava se.':'Vrata su zatvorena.');
}
// guests come in and go out through the door: it opens for them and closes by itself a bit later, slowly and quietly (a door that the player opened stays open)
function autoDoor(){
  if(doorManual)return;
  doorAutoUntil=performance.now()+2400;
  if(!doorOpen)setDoor(true,{auto:true});
  if(!doorAutoTimer)doorAutoTimer=setInterval(function(){
    if(doorManual||!doorOpen){clearInterval(doorAutoTimer);doorAutoTimer=0;return}
    if(performance.now()>doorAutoUntil){clearInterval(doorAutoTimer);doorAutoTimer=0;setDoor(false,{auto:true,soft:true})}
  },300);
}
// ---------- the sign on the door: Otvoreno / Zatvoreno (click: it turns around, hanging on its strings) ----------
(function(){
  var wrap=mk('div','tc-signwrap'),open=T.isOpenForGuests?T.isOpenForGuests():true,SRC={1:'assets/tavern/sign/radi.webp?v=1',0:'assets/tavern/sign/neradi.webp?v=1'};
  wrap.innerHTML='<div class="tc-sign"><img alt="Kafana" draggable="false"></div>';
  var sg=wrap.firstChild,im=sg.firstChild,busyTurn=false;
  [SRC[1],SRC[0]].forEach(function(u){var pre=new Image();pre.src=u});
  im.src=SRC[open?1:0];
  function toggleSign(){
    if(busyTurn)return;busyTurn=true;open=!open;try{T.setOpenForGuests(open)}catch(x){}
    var turn=function(from,to,ms,ease){return im.animate?im.animate([{transform:'rotateY('+from+'deg)'},{transform:'rotateY('+to+'deg)'}],{duration:ms,easing:ease,fill:'forwards'}).finished:Promise.resolve()};
    turn(0,90,230,'ease-in').then(function(){im.src=SRC[open?1:0];return turn(-90,0,300,'ease-out')}).then(function(){
      busyTurn=false;sg.classList.remove('swing');void sg.offsetWidth;sg.classList.add('swing');
    }).catch(function(){busyTurn=false});
    showMsg(open?'Kafana radi — gosti dolaze.':'Kafana ne radi — novi gosti ne dolaze.');
  }
  // the sign is the lowest layer (glued to the door, everybody walks in front of it), so the click is caught on the room and tested against the picture of the sign
  room.addEventListener('pointerdown',function(e){
    if(e.button!==0||tool==='sponge'||doorOpen||overUi(e)||e.target.closest&&e.target.closest('.tc-menu'))return;
    var r=im.getBoundingClientRect();
    if(e.clientX>=r.left+r.width*.12&&e.clientX<=r.right-r.width*.12&&e.clientY>=r.top+r.height*.35&&e.clientY<=r.bottom-r.height*.08){e.stopImmediatePropagation();e.preventDefault();toggleSign()}
  },true);
  // the pose of the sign (placement tool "Mesta"): position and size in % of the picture, tilt in degrees
  // the pose of the sign (from Miloš's export): position and size in % of the picture, tilt in degrees
  var P={x:10.2,y:9.7,w:7,rz:-8,ry:0,rx:0};
  sg.style.left=P.x+'%';sg.style.top=P.y+'%';sg.style.width=P.w+'%';sg.style.transform='perspective(900px) rotateX('+P.rx+'deg) rotateY('+P.ry+'deg) rotate('+P.rz+'deg)';
  cv.parentNode.insertBefore(wrap,doorCv);                      // the lowest layer of the people: glued to the door, guests and the waiter walk in front of it
  signWrap=wrap;signEl=sg;sync();
})();                // reading the picture back is slow, so not while the sponge is rubbing

// ---------- the mouse ----------
var down=false,last=null,lastPos=null;
function toScene(e){var r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*W,y:(e.clientY-r.top)/r.height*H}}
function overUi(e){return !!(e.target.closest&&e.target.closest('button,.tc-menu'))}
var signWrap,signEl;
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
  if(p.x>=DOOR_RECT[0]&&p.x<=DOOR_RECT[2]&&p.y>=DOOR_RECT[1]&&p.y<=DOOR_RECT[3])opts.push({ic:'🚪',t:doorOpen?'Zatvori vrata':'Provetri',fn:function(){setDoor(!doorOpen)}});
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
  tlevel[i]=n;wipe[i]=0;var k=0,N=3;
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
window.CooksterTavernClean={cleanTable:function(i){cleanZone(i)},dirty:dirtyZone,markDirty:markDirty,floorDirt:floorDirt,reset:function(){reset.click()},floorPercent:floorPercent,levels:function(){return tlevel.slice()},smoke:function(){return smokeLevel},doorOpen:function(){return doorOpen},doorProgress:function(){return doorA},setDoor:setDoor,autoDoor:autoDoor,stoveLit:function(){return stoveLit},lamps:function(){if(!lightsDef)return null;var t=0,l=0;lightsDef.lamps.forEach(function(L){if(L.stove)return;t++;if(lightState[L.id])l++});return{lit:l,total:t}},zones:function(){return zones.length},cleaned:function(){return cleaned.slice()}};
})();
