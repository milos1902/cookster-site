/* The day of the game: the clock and the light of the KITCHEN (the tavern has its own lamps).
   One game hour lasts `secPerHour` real seconds (60 = one real minute is one game hour). The kitchen opens at 06:00, the tavern works until 24:00; at 24:00 the clock stops
   (CooksterDay.endDay() starts the next morning; the button for it comes later). Light: a dark layer (the shade of the time of day), a warm haze, the shaft of the sun from the window
   and light pools around the fire (the grill and the stove) that cut the darkness, so the fire shines more at night. All of it is one small canvas over the scene, redrawn about once a second.
   The tool "Vreme i svetlo" (the button at the bottom right) changes the time and every number; the values are kept in this browser (cookster.day-light.v1) and can be exported/imported as JSON. */
(function(){
'use strict';
if(window.CooksterDay)return;
var KEY='cookster.day-light.v2',OPEN=360,CLOSE=1440,W=1672,H=941,SC=.25;
/* Four points in the 24 hours (the keys). Each key has the time, the colours and the dark of that moment, the sun on the floor (0..1: how much of the painted sun is seen) and the sun shaft:
   lx,ly = where the light falls on the floor (the centre of the far end of the shaft), spread = how much the shaft widens, alpha = how strong, blur = how soft, bc = its colour.
   Between two keys everything changes slowly (the sun moves from one place to the other). The window (the beginning of the shaft) is one for all keys. */
var DEF={
  secPerHour:60,      // Miloš's export has 10 here (a test); the real default stays one real minute = one game hour
  win:{x1:-12,y1:-17,x2:-9,y2:302},
  keys:[
    {name:'Jutro',t:360,nw:0,c:'#ff932e',light:0.09,dark:0.12,shade:'#33210f',sun:1,lx:1277,ly:854,spread:2,alpha:0.52,blur:38,bc:'#ffddad'},
    {name:'Podne',t:720,nw:0,c:'#fff4dc',light:0,dark:0,shade:'#2a2a2e',sun:1,lx:614,ly:858,spread:1.1,alpha:0.37,blur:30,bc:'#fff6dc'},
    {name:'Veče',t:1140,nw:0.6,c:'#4639fe',light:0.07,dark:0.28,shade:'#010223',sun:0.3,lx:432,ly:589,spread:0,alpha:0,blur:0,bc:'#000000'},
    {name:'Noć',t:0,nw:1,c:'#192b52',light:0.22,dark:0.53,shade:'#050c24',sun:0,lx:600,ly:720,spread:0.5,alpha:0.68,blur:0,bc:'#bcd0ff'}
  ],
  itemLight2:.15,
  fireNight:0.2,
  sh:{on:1,len:.9,op:.45,blur:2.5,flat:.7}
};
function clone(o){return JSON.parse(JSON.stringify(o));}
var cfg=clone(DEF);
try{var sv=JSON.parse(localStorage.getItem(KEY)||'null');if(sv&&sv.keys&&sv.keys.length===4){cfg=clone(DEF);if(sv.secPerHour)cfg.secPerHour=sv.secPerHour;if(sv.win)cfg.win=Object.assign(cfg.win,sv.win);if(sv.fireNight!=null)cfg.fireNight=sv.fireNight;if(sv.itemLight2!=null)cfg.itemLight2=sv.itemLight2;if(sv.sh)cfg.sh=Object.assign(cfg.sh,sv.sh);sv.keys.forEach(function(k,i){cfg.keys[i]=Object.assign(cfg.keys[i],k);});}}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(cfg));}catch(e){}}
function mergeCfg(src){var c=clone(DEF);if(src.secPerHour)c.secPerHour=src.secPerHour;if(src.win)c.win=Object.assign(c.win,src.win);if(src.fireNight!=null)c.fireNight=src.fireNight;if(src.itemLight2!=null)c.itemLight2=src.itemLight2;if(src.sh)c.sh=Object.assign(c.sh,src.sh);if(src.keys&&src.keys.length===4)src.keys.forEach(function(k,i){c.keys[i]=Object.assign(c.keys[i],k);});return c;}

/* ---------- the clock ---------- */
var st={minute:OPEN,paused:false,day:1,closed:false};
function nowM(){return st.minute;}
function hex(h){h=String(h||'#000').replace('#','');if(h.length===3)h=h.replace(/./g,'$&$&');var n=parseInt(h,16)||0;return [(n>>16)&255,(n>>8)&255,n&255];}
function toHex(a){return '#'+a.map(function(v){return ('0'+Math.max(0,Math.min(255,Math.round(v))).toString(16)).slice(-2);}).join('');}
function fmt(m){m=Math.floor(m);var hh=Math.floor(m/60)%24,mm=m%60;return (hh<10?'0':'')+hh+':'+(mm<10?'0':'')+mm;}
function part(h){return h<5?'Noć':h<10?'Jutro':h<17?'Dan':h<21?'Veče':'Noć';}
window.currentGameMinute=function(){return nowM()%1440;};      // the old stub of the game said 12:00 forever
window.gameDayPart=function(){var h=nowM()/60;return part(h)==='Jutro'?'Jutro':part(h)==='Dan'?'Podne':part(h);};
var lastT=performance.now(),lastSig='';
function tick(){
  var n=performance.now(),dt=Math.min(1,(n-lastT)/1000);lastT=n;
  if(!st.paused&&!st.closed&&!document.hidden){
    st.minute+=dt*60/Math.max(5,cfg.secPerHour);
    if(st.minute>=CLOSE){st.minute=CLOSE;st.closed=true;
      try{if(window.CooksterTavern&&CooksterTavern.setOpenForGuests)CooksterTavern.setOpenForGuests(false);}catch(e){}
      try{showToast('Ponoć je. Kafana je zatvorena.');}catch(e){}}
  }
  var sig=Math.round(st.minute*2)+'|'+fireSig();
  if(sig!==lastSig){lastSig=sig;render();chip();}
}
function endDay(){st.minute=OPEN;st.closed=false;st.paused=false;st.day++;
  try{if(window.CooksterTavern&&CooksterTavern.setOpenForGuests)CooksterTavern.setOpenForGuests(true);}catch(e){}
  try{if(window.CooksterState&&CooksterState.player)CooksterState.player.day=st.day;}catch(e){}
  lastSig='';render();chip();syncPanel();}

/* ---------- the light ---------- */
function ease(t){return t*t*(3-2*t);}
function mixPhase(m){      // m = game minute (0..1440): the values between the two neighbouring keys (the day is a circle: after the last key come the first of the next day)
  var ks=cfg.keys.slice().sort(function(a,b){return a.t-b.t;}),n=ks.length,a=ks[n-1],b=ks[0],aT=a.t-1440,bT=b.t,i;
  if(m>=ks[0].t){for(i=0;i<n;i++){var nx=ks[(i+1)%n],nT=nx.t+(i===n-1?1440:0);if(m>=ks[i].t&&m<=nT){a=ks[i];b=nx;aT=ks[i].t;bT=nT;break;}}}
  else{a=ks[n-1];b=ks[0];aT=a.t-1440;bT=b.t;}
  var t=ease(clamp01((m-aT)/Math.max(1,bT-aT)));
  function f(x,y){return x+(y-x)*t;}
  function mc(x,y){var p=hex(x),q=hex(y);return [f(p[0],q[0]),f(p[1],q[1]),f(p[2],q[2])];}
  return {c:mc(a.c,b.c),shade:mc(a.shade,b.shade),bc:mc(a.bc,b.bc),light:f(a.light,b.light),dark:f(a.dark,b.dark),sun:f(a.sun,b.sun),nw:f(a.nw||0,b.nw||0),lx:f(a.lx,b.lx),ly:f(a.ly,b.ly),spread:f(a.spread,b.spread),alpha:f(a.alpha,b.alpha),blur:f(a.blur,b.blur)};
}
function clamp01(v){return Math.max(0,Math.min(1,v));}
function bell(h,s,p,e){return h<=s||h>=e?0:h<p?(h-s)/(p-s):(e-h)/(e-p);}
function rgba(c,a){return 'rgba('+Math.round(c[0])+','+Math.round(c[1])+','+Math.round(c[2])+','+Math.max(0,Math.min(1,a)).toFixed(3)+')';}
function grillLevel(){try{return window.CooksterGrill&&CooksterGrill.level?CooksterGrill.level():0;}catch(e){return 0;}}
function stoveLevel(){try{return (stoveState.fireOn&&(+stoveState.fireLevel||0)>0)?Math.min(1,(+stoveState.fireLevel||0)/FIRE_MAX_LEVEL):0;}catch(e){return 0;}}
function fireSig(){return Math.round(grillLevel()*20)+'/'+Math.round(stoveLevel()*10);}
var cv=null,cx=null,tintC=null,sunI=new Image();sunI.src='assets/effects/sun_patches.png?v=1';
/* the picture of the kitchen WITHOUT the sun on the floor (assets/effects/kuhinja_bez_sunca.webp, the same picture, drawn without the light of the window) lies over the real one inside a mask of the window light
   (assets/effects/sun_zone_mask.png) and it melts in while the sun goes away (evening, night, early morning). If that picture is not there, the patches are only darkened. */
var sunless2=null,OCC_CLIP='polygon(322px 243px,1211px 243px,1243px 548px,1212px 612px,365px 612px,320px 548px)';      // the same polygon as #tableOccluder in game.css (it draws the OLD picture of the table over the things under the table)
var SUNLESS='assets/effects/kuhinja_bez_sunca.webp?v=3',ZONE='assets/effects/sun_zone_mask.png?v=2',sunless=null,sunlessOK=false;
(function(){var im=new Image();im.onload=function(){sunlessOK=true;lastSig='';};im.src=SUNLESS;})();
function sunlessLayer(){
  var sc=document.getElementById('scene');if(!sc)return null;
  if(sunless&&sunless.parentNode===sc&&sunless2&&sunless2.parentNode===sc)return sunless;
  function mk(id,z,clip){var d=document.createElement('div');d.id=id;
    d.style.cssText='position:absolute;left:0;top:0;width:'+W+'px;height:'+H+'px;pointer-events:none;z-index:'+z+';opacity:0;background:url('+SUNLESS+') 0 0/100% 100% no-repeat;'+
    '-webkit-mask-image:url('+ZONE+');mask-image:url('+ZONE+');-webkit-mask-size:100% 100%;mask-size:100% 100%;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat'+(clip?';clip-path:'+clip:'');return d;}
  if(sunless)sunless.remove();if(sunless2)sunless2.remove();
  sunless=mk('daySunless',0,null);sc.insertBefore(sunless,sc.firstChild);
  sunless2=mk('daySunless2',25,OCC_CLIP);sc.appendChild(sunless2);      // over the occluder of the table, so the old picture does not show the sun in the floor left of the table
  return sunless;
}
/* the window at night: the same picture of the kitchen drawn with the night outside (assets/effects/kuhinja_prozor_noc.webp) is laid over the real one only inside a small mask around the window (window_zone_mask.png);
   how much of it is seen is the key value "nw" (0 = the day outside, 1 = the night outside), so it melts in between two keys like the sun on the floor. */
var NIGHTWIN='assets/effects/kuhinja_prozor_noc.webp?v=1',WZONE='assets/effects/window_zone_mask.png?v=1',winNight=null;
function winLayer(){
  var sc=document.getElementById('scene');if(!sc)return null;
  if(winNight&&winNight.parentNode===sc)return winNight;
  winNight=document.createElement('div');winNight.id='dayWinNight';
  winNight.style.cssText='position:absolute;left:0;top:0;width:'+W+'px;height:'+H+'px;pointer-events:none;z-index:0;opacity:0;background:url('+NIGHTWIN+') 0 0/100% 100% no-repeat;'+
    '-webkit-mask-image:url('+WZONE+');mask-image:url('+WZONE+');-webkit-mask-size:100% 100%;mask-size:100% 100%;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat';
  if(sunless&&sunless.nextSibling)sc.insertBefore(winNight,sunless.nextSibling);else sc.appendChild(winNight);
  return winNight;
}
function layer(){
  var sc=document.getElementById('scene');if(!sc)return false;
  if(cv&&cv.isConnected&&cv.parentNode===sc)return true;
  cv=document.createElement('canvas');cv.id='dayLight';cv.width=Math.round(W*SC);cv.height=Math.round(H*SC);
  cv.style.cssText='position:absolute;left:0;top:0;width:'+W+'px;height:'+H+'px;pointer-events:none;z-index:90000';
  sc.appendChild(cv);cx=cv.getContext('2d');
  return true;
}
function pool(x,y,rx,ry,carve,glow,col){
  cx.save();cx.translate(x,y);cx.scale(1,ry/rx);
  var g=cx.createRadialGradient(0,0,0,0,0,rx);
  cx.globalCompositeOperation='destination-out';
  g.addColorStop(0,'rgba(0,0,0,'+clamp01(carve).toFixed(3)+')');g.addColorStop(.55,'rgba(0,0,0,'+clamp01(carve*.6).toFixed(3)+')');g.addColorStop(1,'rgba(0,0,0,0)');
  cx.fillStyle=g;cx.beginPath();cx.arc(0,0,rx,0,Math.PI*2);cx.fill();
  cx.globalCompositeOperation='source-over';
  var g2=cx.createRadialGradient(0,0,0,0,0,rx);
  g2.addColorStop(0,rgba(col,glow));g2.addColorStop(.5,rgba(col,glow*.45));g2.addColorStop(1,rgba(col,0));
  cx.fillStyle=g2;cx.beginPath();cx.arc(0,0,rx,0,Math.PI*2);cx.fill();
  cx.restore();
}
function render(){
  if(!layer())return;
  var m=st.closed?1440:nowM(),P=mixPhase(m%1440);
  cx.setTransform(1,0,0,1,0,0);cx.clearRect(0,0,cv.width,cv.height);cx.scale(SC,SC);
  // 1. the shade of the time of day (dark at night)
  cx.fillStyle=rgba(P.shade,P.dark*.95);cx.fillRect(0,0,W,H);
  // 1b. the sun painted on the floor: the picture without the sun melts in when the sun goes away (key value "sun")
  var dayF=clamp01(P.sun),extra=(1-dayF)*.65;
  var slr=sunlessLayer();if(slr){var op=sunlessOK?(1-dayF).toFixed(3):'0';slr.style.opacity=op;if(sunless2)sunless2.style.opacity=op;}
  if(!sunlessOK&&extra>.01&&sunI.complete&&sunI.naturalWidth){
    if(!tintC){tintC=document.createElement('canvas');tintC.width=cv.width;tintC.height=cv.height;}
    var tc=tintC.getContext('2d');tc.setTransform(1,0,0,1,0,0);tc.globalCompositeOperation='source-over';tc.clearRect(0,0,tintC.width,tintC.height);
    tc.fillStyle=rgba(P.shade,1);tc.fillRect(0,0,tintC.width,tintC.height);tc.globalCompositeOperation='destination-in';tc.drawImage(sunI,0,0,tintC.width,tintC.height);
    cx.save();cx.setTransform(1,0,0,1,0,0);cx.globalAlpha=extra;cx.drawImage(tintC,0,0);cx.restore();
  }
  try{ambMatrix(P);}catch(e){}
  try{var rs=document.documentElement.style,ab=clamp01(1-P.dark*.95*.98),haze=P.light*.5;rs.setProperty('--amb-b',Math.min(1.05,ab+haze*.35).toFixed(3));rs.setProperty('--amb-s',(1-P.dark*.25).toFixed(3));}catch(e){}
  var wl=winLayer();if(wl)wl.style.opacity=clamp01(P.nw).toFixed(3);
  // 2. the warm haze of the morning / the evening
  if(P.light>.005){cx.fillStyle=rgba(P.c,P.light*.55);cx.fillRect(0,0,W,H);}
  // 3. the shaft of the sun: it comes IN through the window (the segment A-B) and falls on the floor at (lx,ly); the key values move it over the day
  if(P.alpha>.01){
    var w=cfg.win,mx=(w.x1+w.x2)/2,my=(w.y1+w.y2)/2,dx=P.lx-mx,dy=P.ly-my,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len;
    var ax=w.x1+dx,ay=w.y1+dy,bx=w.x2+dx,by=w.y2+dy;                       // the far end: the window moved along the shaft
    ax+=(w.x1-mx)*P.spread;ay+=(w.y1-my)*P.spread;bx+=(w.x2-mx)*P.spread;by+=(w.y2-my)*P.spread;   // and widened
    cx.save();cx.filter='blur('+Math.max(0,P.blur*SC).toFixed(1)+'px)';
    var g=cx.createLinearGradient(mx,my,P.lx,P.ly);
    g.addColorStop(0,rgba(P.bc,P.alpha));g.addColorStop(.55,rgba(P.bc,P.alpha*.45));g.addColorStop(1,rgba(P.bc,0));
    cx.fillStyle=g;cx.beginPath();cx.moveTo(w.x1,w.y1);cx.lineTo(w.x2,w.y2);cx.lineTo(bx,by);cx.lineTo(ax,ay);cx.closePath();cx.fill();cx.restore();
  }
  // 4. the fire shines: pools of light that cut the dark (the grill, the stove)
  var nightF=clamp01(P.dark/.3)*(+cfg.fireNight||1),gl=grillLevel(),stl=stoveLevel();
  if(gl>.02)pool(497,98,340,115,Math.min(1,gl*.95*nightF),gl*.22*nightF,[255,140,50]);
  if(stl>.02)pool(1334,540,230,190,Math.min(1,stl*.75*nightF),stl*.16*nightF,[255,150,60]);
}

/* ---------- the things in the shaft of the sun are lit ---------- */
(function(){var st2=document.createElement('style');st2.textContent='.item.lit-sun:not(.container-target):not(.stir-ready-target):not(.pour-target-ready),.flour-pile.lit-sun{filter:brightness(var(--lit-b,1)) contrast(var(--lit-c,1)) saturate(var(--lit-s,1)) sepia(var(--lit-w,0))}.placement-ghost .ghost-item-copy.lit-sun{filter:brightness(var(--lit-b,1)) contrast(var(--lit-c,1)) saturate(var(--lit-s,1)) sepia(var(--lit-w,0))!important}';document.head.appendChild(st2);})();
/* the things that are drawn ABOVE the dark layer (the item in the hand = its ghost, the pitcher that pours, the cloth, the picture of the sack) do not get the dark of the canvas, so they get the same dark as a filter:
   --amb-b is set on the page in render() from the dark of the time of day (the held thing looks as dark as the things lying around). */
(function(){var st3=document.createElement('style');st3.textContent=
 '#ppLayer,#clothLayer,body>.placement-ghost{filter:url(#dlAmb)}      /* the picture of the thing in the hand is a fixed copy on the body (outside the scene), so the dark layer of the scene does not reach it */';document.head.appendChild(st3);
  var sv=document.createElementNS('http://www.w3.org/2000/svg','svg');sv.setAttribute('width','0');sv.setAttribute('height','0');sv.style.cssText='position:absolute;width:0;height:0';
  sv.innerHTML='<filter id="dlAmb" color-interpolation-filters="sRGB" x="-5%" y="-5%" width="110%" height="110%"><feColorMatrix id="dlAmbM" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"/></filter>';(document.body||document.documentElement).appendChild(sv);})();
/* the same blend as the canvas: colour*(1-a) + shade*a (the dark of the time of day) + the warm haze; a feColorMatrix does it exactly */
var heldS=0;      // the veil of the sun shaft at the place of the thing in the hand (0..1)
function ambMatrix(P){var m=document.getElementById('dlAmbM');if(!m)return;var a=clamp01(P.dark*.95),hz=clamp01(P.light*.55),sv=clamp01(heldS),k=(1-a)*(1-hz)*(1-sv),r=((P.shade[0]*a*(1-hz)+P.c[0]*hz)*(1-sv)+P.bc[0]*sv)/255,g=((P.shade[1]*a*(1-hz)+P.c[1]*hz)*(1-sv)+P.bc[1]*sv)/255,b=((P.shade[2]*a*(1-hz)+P.c[2]*hz)*(1-sv)+P.bc[2]*sv)/255;
  m.setAttribute('values',k.toFixed(4)+' 0 0 0 '+r.toFixed(4)+'  0 '+k.toFixed(4)+' 0 0 '+g.toFixed(4)+'  0 0 '+k.toFixed(4)+' 0 '+b.toFixed(4)+'  0 0 0 1 0');}
function shaftAt(c,P){      // c = a point of the scene: how strongly the shaft lights it (k, for the item) and how thick the veil of the shaft is over it (sa, as the canvas draws it)
  var w=cfg.win,mx=(w.x1+w.x2)/2,my=(w.y1+w.y2)/2,dx=P.lx-mx,dy=P.ly-my,len2=dx*dx+dy*dy||1,len=Math.sqrt(len2),t=((c.x-mx)*dx+(c.y-my)*dy)/len2;
  if(!(t>0&&t<1.15))return {k:0,sa:0};
  var px=(c.x-mx)-t*dx,py=(c.y-my)-t*dy,across=Math.abs(px*(-dy)/len+py*(dx/len)),hw=Math.hypot(w.x2-w.x1,w.y2-w.y1)/2,
      half=hw+hw*P.spread*t+60,side=1-clamp01((across-(half-120))/120),g=t<.55?1-t/.55*.55:Math.max(0,.45*(1-(t-.55)/.45));
  return {k:clamp01(side*clamp01(1.05-t*.55)*P.alpha/.55),sa:clamp01(P.alpha*g*side)};
}
function heldTick(pt){      // the thing in the hand lies above the dark layer, so it gets the veil of the shaft as a filter too (the same as the things lying around)
  var g=document.querySelector('body>.placement-ghost .ghost-item-copy'),P=mixPhase((st.closed?1440:nowM())%1440),s0=0,k=0;
  var c=null;
  if(g){try{var r=g.getBoundingClientRect();c=screenToScene(r.left+r.width/2,r.top+r.height*.62);}catch(e){}}
  else if(pt)c=pt;      // the moment of the click: the ghost is not there yet, the veil is made ready for the place of the click
  if(c){var h=shaftAt(c,P);s0=h.sa;k=h.k;}
  if(Math.abs(s0-heldS)>.004){heldS=s0;ambMatrix(P);}
  if(g&&(+cfg.itemLight2||0)>.001){      // the light of the sun on the thing itself, at once (not every 0.3 s)
    if(k>.02){g.classList.add('lit-sun');g.style.setProperty('--lit-b',(1+cfg.itemLight2*k).toFixed(3));g.style.setProperty('--lit-s',(1+.04*k).toFixed(3));g.style.setProperty('--lit-w',(.03*k).toFixed(3));g.style.setProperty('--lit-c',(1-.05*k).toFixed(3));g._litK=k;}
    else if(g._litK){g.classList.remove('lit-sun');g.style.removeProperty('--lit-b');g.style.removeProperty('--lit-s');g.style.removeProperty('--lit-w');g.style.removeProperty('--lit-c');g._litK=0;}
  }
}
/* no flicker when the thing is taken: the veil is ready before the ghost is drawn (the click), it is set at once when the ghost appears (MutationObserver) and it follows the mouse every frame */
window.addEventListener('pointerdown',function(e){if(e.button===0&&!(typeof holding!=='undefined'&&holding)){try{heldTick(screenToScene(e.clientX,e.clientY));}catch(x){}}},true);
try{new MutationObserver(function(){heldTick();}).observe(document.body,{childList:true});}catch(e){}
(function heldLoop(){requestAnimationFrame(heldLoop);if(document.querySelector('body>.placement-ghost')||heldS)heldTick();})();
function litTick(){
  var list=((typeof window.items!=='undefined'&&window.items)||(typeof items!=='undefined'?items:[])||[]).slice();
  [].forEach.call(document.querySelectorAll('.flour-pile'),function(e){list.push(e);});      // the flour on the table is not an item, but it is lit too
  if(!list.length)return;
  var P=mixPhase((st.closed?1440:nowM())%1440),w=cfg.win,on=P.alpha>.03&&(+cfg.itemLight2||0)>.001;
  list.forEach(function(el){
    if(!el||!el.isConnected)return;
    var k=0;
    if(on&&el!==(typeof holding!=='undefined'?holding:null)){      // the copy that follows the mouse (ghost-item-copy) is lit too, it shows where the thing would lie
      var r=el.getBoundingClientRect();k=shaftAt(screenToScene(r.left+r.width/2,r.top+r.height*.62),P).k;
    }
    var was=el._litK||0;
    if(Math.abs(k-was)<.02&&!(k===0&&was!==0))return;
    el._litK=k;
    if(k>.02){el.classList.add('lit-sun');el.style.setProperty('--lit-b',(1+cfg.itemLight2*k).toFixed(3));el.style.setProperty('--lit-s',(1+.04*k).toFixed(3));el.style.setProperty('--lit-w',(.03*k).toFixed(3));el.style.setProperty('--lit-c',(1-.05*k).toFixed(3));}
    else{el.classList.remove('lit-sun');el.style.removeProperty('--lit-b');el.style.removeProperty('--lit-s');el.style.removeProperty('--lit-w');el.style.removeProperty('--lit-c');el._litK=0;}
  });
}
setInterval(litTick,300);

/* ---------- the clock on the screen ---------- */
var chipEl=null;
function chip(){
  if(!chipEl||!chipEl.isConnected){chipEl=document.createElement('div');chipEl.id='dayClock';chipEl.setAttribute('data-tool-ui','1');
    chipEl.style.cssText='position:fixed;left:1062px;top:10px;z-index:2147483000;border:2px solid #351b0d;border-radius:12px;background:#f1d9a0;color:#351b0d;font:700 12px/1 system-ui,sans-serif;padding:6px 10px;opacity:.92;pointer-events:none';
    document.body.appendChild(chipEl);}
  var h=nowM()/60,ic=st.closed||h<5?'🌙':h<10?'🌅':h<17?'☀':h<21?'🌇':'🌙';
  chipEl.textContent=ic+' '+fmt(st.closed?1440:nowM())+' · '+(st.closed?'Kafana zatvorena':part(h))+(st.paused?' ⏸':'');
}

/* ---------- the tool ---------- */
var css=document.createElement('style');
css.textContent='#dlBtn{position:fixed;right:12px;bottom:132px;z-index:2147483500;border:2px solid #351b0d;border-radius:9px;background:#e8c27a;color:#351b0d;font:700 13px/1 system-ui,sans-serif;padding:9px 12px;cursor:pointer}'+
 '#dlPanel{position:fixed;right:12px;top:56px;z-index:2147483600;width:340px;max-height:calc(100vh - 230px);overflow:auto;background:rgba(36,22,10,.95);border:2px solid #7a5428;border-radius:10px;color:#f3e3c2;font:13px/1.35 system-ui,sans-serif;padding:10px;display:none}'+
 '#dlPanel label{display:block;margin:6px 0 0}#dlPanel input[type=range]{width:100%}#dlPanel output{float:right;color:#ffd98a}#dlPanel h4{margin:12px 0 2px;color:#ffd98a;font-size:13px;border-top:1px solid #5b3d1c;padding-top:8px}'+
 '#dlPanel button{border:1px solid #351b0d;border-radius:7px;background:#e8c27a;color:#351b0d;font:700 12px/1 system-ui,sans-serif;padding:7px 9px;margin:6px 4px 0 0;cursor:pointer}#dlPanel button.on{background:#ffe9a8;outline:2px solid #ffb12e}'+
 '#dlPanel small{display:block;margin-top:6px;opacity:.85}#dlPanel input[type=color]{width:44px;height:26px;padding:0;border:0;background:none;vertical-align:middle}'+
 '#dlHandles{position:fixed;left:0;top:0;width:0;height:0;z-index:2147483550}#dlHandles .dh{position:fixed;transform:translate(-50%,-50%);cursor:grab;font:700 11px/1 system-ui,sans-serif;color:#351b0d;text-align:center;user-select:none;touch-action:none}'+
 '#dlHandles .dsun{width:34px;height:34px;border-radius:50%;background:radial-gradient(circle,#fff6b0,#ffc83a 70%);border:3px solid #7a4b00;box-shadow:0 0 14px #ffd35c;line-height:28px;font-size:18px}'+
 '#dlHandles .dwin{width:16px;height:16px;border-radius:3px;background:#7fd0ff;border:2px solid #0b3a5a}'+
 '#dlHandles .dtag{position:fixed;transform:translate(-50%,0);padding:2px 6px;border-radius:6px;background:rgba(36,22,10,.85);color:#ffd98a;font:700 11px system-ui,sans-serif;pointer-events:none;white-space:nowrap}';
document.head.appendChild(css);
var btn=document.createElement('button');btn.id='dlBtn';btn.type='button';btn.textContent='☀ Vreme i svetlo';btn.setAttribute('data-tool-ui','1');
var pn=document.createElement('div');pn.id='dlPanel';pn.setAttribute('data-tool-ui','1');
document.body.appendChild(btn);document.body.appendChild(pn);
var ctr={},selK=0,showH=true,hl=null,hSun=null,hA=null,hB=null,tagS=null,tagW=null;
function K(){return cfg.keys[selK];}
function row(label,key,min,max,step,get,set,fmtv){
  var l=document.createElement('label'),o=document.createElement('output'),i=document.createElement('input');i.type='range';i.min=min;i.max=max;i.step=step;
  l.appendChild(document.createTextNode(label));l.appendChild(o);pn.appendChild(l);pn.appendChild(i);
  function upd(){var v=get();i.value=v;o.textContent=fmtv?fmtv(v):(+v).toFixed(2);}
  i.addEventListener('input',function(){set(+i.value);save();upd();lastSig='';render();chip();placeHandles();});
  ctr[key]=upd;upd();return i;
}
function colorRow(label,get,set){
  var l=document.createElement('label');l.textContent=label+' ';var i=document.createElement('input');i.type='color';l.appendChild(i);pn.appendChild(l);
  i.addEventListener('input',function(){set(i.value);save();lastSig='';render();});
  ctr['c_'+label]=function(){i.value=toHex(hex(get()));};ctr['c_'+label]();
}
function hh(m){return fmt(m);}
function jump(m){st.minute=Math.max(0,Math.min(CLOSE,m));      // in the tool the whole 24 hours can be looked at (the game itself runs from 06:00 to 24:00)
  st.closed=st.minute>=CLOSE;st.paused=true;ctr.pp&&ctr.pp();lastSig='';render();chip();placeHandles();}
function selectKey(i,go){selK=i;if(go)jump(Math.max(0,Math.min(CLOSE-1,cfg.keys[i].t)));Object.keys(ctr).forEach(function(k){try{ctr[k]();}catch(e){}});markKeys();placeHandles();}
var keyBtns=[];
function markKeys(){keyBtns.forEach(function(b,i){b.classList.toggle('on',i===selK);b.textContent=cfg.keys[i].name+' '+hh(cfg.keys[i].t);});}
function build(){
  pn.innerHTML='<b>Vreme i svetlo (kuhinja)</b>';
  var bar=document.createElement('div');
  function mk(par,t,fn){var b=document.createElement('button');b.type='button';b.textContent=t;b.addEventListener('click',fn);par.appendChild(b);return b;}
  var pp=mk(bar,st.paused?'▶ Pusti':'⏸ Pauza',function(){st.paused=!st.paused;ctr.pp();chip();});ctr.pp=function(){pp.textContent=st.paused?'▶ Pusti':'⏸ Pauza';};
  mk(bar,'Novi dan (06:00)',function(){endDay();});
  pn.appendChild(bar);
  row('Vreme (celih 24 h za podešavanje)','t',0,CLOSE,5,function(){return st.minute;},function(v){st.minute=v;st.closed=v>=CLOSE;st.paused=true;ctr.pp();},function(v){return hh(v>=1440?1440:v);});
  row('Trajanje jednog sata u igri (s)','sph',10,180,5,function(){return cfg.secPerHour;},function(v){cfg.secPerHour=v;},function(v){return v+' s (dan = '+Math.round(v*18/6)/10+' min)';});
  var h=document.createElement('h4');h.textContent='Četiri tačke u vremenu (klik = otvori tačku i idi na to vreme)';pn.appendChild(h);
  var kb=document.createElement('div');keyBtns=[];cfg.keys.forEach(function(k,i){keyBtns.push(mk(kb,'',function(){selectKey(i,true);}));});pn.appendChild(kb);
  row('Vreme ove tačke','kt',0,1425,15,function(){return K().t;},function(v){K().t=v;markKeys();},function(v){return hh(v);});
  mk(pn,'Postavi tačku na trenutno vreme',function(){K().t=Math.round(st.minute/5)*5;save();selectKey(selK,false);lastSig='';render();});
  h=document.createElement('h4');h.textContent='Svetlo u ovoj tački';pn.appendChild(h);
  colorRow('Boja svetla',function(){return K().c;},function(v){K().c=v;});
  colorRow('Boja mraka',function(){return K().shade;},function(v){K().shade=v;});
  row('Sjaj (topla izmaglica)','light',0,.6,.01,function(){return K().light;},function(v){K().light=v;});
  row('Mrak','dark',0,.9,.01,function(){return K().dark;},function(v){K().dark=v;});
  row('Sunce na podu (naslikane mrlje)','sun',0,1,.05,function(){return K().sun;},function(v){K().sun=v;});
  row('Prozor: noć napolju (0 = dan, 1 = noć)','nw',0,1,.05,function(){return K().nw||0;},function(v){K().nw=v;});
  h=document.createElement('h4');h.textContent='Sunčev zrak u ovoj tački';pn.appendChild(h);
  row('Gde pada: levo-desno','lx',-200,1672,5,function(){return K().lx;},function(v){K().lx=v;},function(v){return Math.round(v);});
  row('Gde pada: gore-dole','ly',-100,941,5,function(){return K().ly;},function(v){K().ly=v;},function(v){return Math.round(v);});
  row('Širenje zraka','sp',0,2,.05,function(){return K().spread;},function(v){K().spread=v;});
  row('Jačina zraka','al',0,1,.01,function(){return K().alpha;},function(v){K().alpha=v;});
  row('Mekoća (zamućenje)','bl',0,120,2,function(){return K().blur;},function(v){K().blur=v;},function(v){return Math.round(v);});
  colorRow('Boja zraka',function(){return K().bc;},function(v){K().bc=v;});
  h=document.createElement('h4');h.textContent='Prozor (odakle zrak ulazi)';pn.appendChild(h);
  var hb=mk(pn,'Prikaži ručke na slici',function(){showH=!showH;hb.classList.toggle('on',showH);placeHandles();});hb.classList.add('on');
  row('Prozor: gornja tačka x','wx1',-200,600,5,function(){return cfg.win.x1;},function(v){cfg.win.x1=v;},function(v){return Math.round(v);});
  row('Prozor: gornja tačka y','wy1',-100,600,5,function(){return cfg.win.y1;},function(v){cfg.win.y1=v;},function(v){return Math.round(v);});
  row('Prozor: donja tačka x','wx2',-200,600,5,function(){return cfg.win.x2;},function(v){cfg.win.x2=v;},function(v){return Math.round(v);});
  row('Prozor: donja tačka y','wy2',-100,700,5,function(){return cfg.win.y2;},function(v){cfg.win.y2=v;},function(v){return Math.round(v);});
  h=document.createElement('h4');h.textContent='Vatra';pn.appendChild(h);
  row('Predmeti u zraku su svetliji','il',0,1,.05,function(){return cfg.itemLight2;},function(v){cfg.itemLight2=v;});
  row('Vatra noću sija jače','fn',0,3,.1,function(){return cfg.fireNight;},function(v){cfg.fireNight=v;try{CooksterGrill.boost(1+.5*v);}catch(e){}},function(v){return (+v).toFixed(1)+'x';});
  h=document.createElement('h4');h.textContent='Senke od sunca (odvojene od senki dodira)';pn.appendChild(h);
  var sb=mk(pn,'Senke od sunca uključene',function(){cfg.sh.on=cfg.sh.on?0:1;sb.classList.toggle('on',!!cfg.sh.on);save();});sb.classList.toggle('on',!!cfg.sh.on);
  row('Dužina senke','shl',0,2.5,.05,function(){return cfg.sh.len;},function(v){cfg.sh.len=v;});
  row('Jačina senke','sho',0,1,.05,function(){return cfg.sh.op;},function(v){cfg.sh.op=v;});
  row('Mekoća senke','shb',0,10,.5,function(){return cfg.sh.blur;},function(v){cfg.sh.blur=v;},function(v){return (+v).toFixed(1)+'px';});
  row('Spljoštenost senke','shf',.1,1.2,.05,function(){return cfg.sh.flat;},function(v){cfg.sh.flat=v;});
  var b2=document.createElement('div');
  mk(b2,'Izvezi JSON',function(){var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(cfg,null,2)],{type:'application/json'}));a.download='cookster-day-light.json';document.body.appendChild(a);a.click();setTimeout(function(){a.remove();},500);});
  var fi=document.createElement('input');fi.type='file';fi.accept='application/json';fi.style.display='none';
  fi.addEventListener('change',function(){var f=fi.files[0];if(!f)return;var r=new FileReader();r.onload=function(){try{cfg=mergeCfg(JSON.parse(r.result));save();selectKey(selK,false);lastSig='';render();chip();}catch(e){try{showToast('Fajl nije dobar.');}catch(x){}}};r.readAsText(f);fi.value='';});
  mk(b2,'Uvezi JSON',function(){fi.click();});b2.appendChild(fi);
  mk(b2,'Vrati početno',function(){cfg=clone(DEF);save();selectKey(selK,false);lastSig='';render();chip();});
  pn.appendChild(b2);
  var sm=document.createElement('small');sm.textContent='Na slici: ☀ = gde pada zrak (prevlači), plavi kvadrati = prozor. Zrak ulazi kroz prozor i pada tamo gde je ☀. Između tačaka u vremenu sunce se lagano pomera. Vreme stoji (pauza) dok ga pomeraš ručno.';pn.appendChild(sm);
  selectKey(selK,false);
}
/* the handles on the picture: the sun (where the shaft falls) and the two ends of the window */
function ensureHandles(){
  if(hl&&hl.isConnected)return;
  hl=document.createElement('div');hl.id='dlHandles';hl.setAttribute('data-tool-ui','1');document.body.appendChild(hl);
  function mkh(cls,txt){var d=document.createElement('div');d.className='dh '+cls;d.textContent=txt||'';d.setAttribute('data-tool-ui','1');hl.appendChild(d);return d;}
  hSun=mkh('dsun','☀');hA=mkh('dwin','');hB=mkh('dwin','');
  tagS=document.createElement('div');tagS.className='dtag';hl.appendChild(tagS);tagW=document.createElement('div');tagW.className='dtag';hl.appendChild(tagW);
  function drag(el,onMove){
    el.addEventListener('pointerdown',function(e){e.preventDefault();e.stopPropagation();el.setPointerCapture(e.pointerId);
      function mv(ev){var p=screenToScene(ev.clientX,ev.clientY);onMove(p);save();lastSig='';render();ctr&&Object.keys(ctr).forEach(function(k){try{ctr[k]();}catch(x){}});placeHandles();}
      function up(){el.removeEventListener('pointermove',mv);el.removeEventListener('pointerup',up);}
      el.addEventListener('pointermove',mv);el.addEventListener('pointerup',up);});
    ['click','contextmenu','wheel','mousedown'].forEach(function(n){el.addEventListener(n,function(e){e.stopPropagation();});});
  }
  drag(hSun,function(p){K().lx=Math.round(Math.max(-200,Math.min(1672,p.x)));K().ly=Math.round(Math.max(-100,Math.min(941,p.y)));});
  drag(hA,function(p){cfg.win.x1=Math.round(p.x);cfg.win.y1=Math.round(p.y);});
  drag(hB,function(p){cfg.win.x2=Math.round(p.x);cfg.win.y2=Math.round(p.y);});
}
function placeHandles(){
  var open=pn.style.display==='block'&&showH;
  if(!open){if(hl)hl.style.display='none';return;}
  ensureHandles();hl.style.display='block';
  function at(el,x,y){var s=sceneToScreen(x,y);el.style.left=s.x+'px';el.style.top=s.y+'px';}
  at(hSun,K().lx,K().ly);at(hA,cfg.win.x1,cfg.win.y1);at(hB,cfg.win.x2,cfg.win.y2);
  var s1=sceneToScreen(K().lx,K().ly+24),s2=sceneToScreen((cfg.win.x1+cfg.win.x2)/2,Math.max(cfg.win.y1,cfg.win.y2)+14);
  tagS.textContent='sunce · '+K().name+' '+hh(K().t);tagS.style.left=s1.x+'px';tagS.style.top=s1.y+'px';tagW.textContent='prozor';tagW.style.left=s2.x+'px';tagW.style.top=s2.y+'px';
}
btn.addEventListener('click',function(){var on=pn.style.display!=='block';pn.style.display=on?'block':'none';if(on&&!keyBtns.length)build();placeHandles();});
['pointerdown','pointerup','click','contextmenu','wheel'].forEach(function(n){pn.addEventListener(n,function(e){e.stopPropagation();},{passive:true});btn.addEventListener(n,function(e){e.stopPropagation();},{passive:true});});
setInterval(function(){if(pn.style.display==='block')placeHandles();},300);

setInterval(tick,250);
window.CooksterDay={minute:nowM,selectKey:function(i){if(!keyBtns.length)build();selectKey(i,true);},setMinute:function(m){st.minute=Math.max(0,Math.min(CLOSE,m));st.closed=st.minute>=CLOSE;lastSig='';render();chip();},pause:function(v){st.paused=v!==false;chip();},endDay:endDay,isClosed:function(){return st.closed;},day:function(){return st.day;},fmt:fmt,config:function(){return cfg;},phase:function(){return mixPhase((st.closed?1440:nowM())%1440);}};
try{CooksterGrill&&CooksterGrill.boost&&CooksterGrill.boost(1+.5*cfg.fireNight);}catch(e){}
setTimeout(function(){render();chip();},300);
})();
