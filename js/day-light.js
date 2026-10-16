/* The day of the game: the clock and the light of the KITCHEN (the tavern has its own lamps).
   One game hour lasts `secPerHour` real seconds (60 = one real minute is one game hour). The kitchen opens at 06:00, the tavern works until 24:00; at 24:00 the clock stops
   (CooksterDay.endDay() starts the next morning; the button for it comes later). Light: a dark layer (the shade of the time of day), a warm haze, the shaft of the sun from the window
   and light pools around the fire (the grill and the stove) that cut the darkness, so the fire shines more at night. All of it is one small canvas over the scene, redrawn about once a second.
   The tool "Vreme i svetlo" (the button at the bottom right) changes the time and every number; the values are kept in this browser (cookster.day-light.v1) and can be exported/imported as JSON. */
(function(){
'use strict';
if(window.CooksterDay)return;
var KEY='cookster.day-light.v1',OPEN=360,CLOSE=1440,W=1672,H=941,SC=.25;
var DEF={
  secPerHour:60,
  phases:{
    morning:{c:'#fec590',light:.23,dark:.29,shade:'#33210f'},
    noon:{c:'#fff4dc',light:.08,dark:.02,shade:'#2a2a2e'},
    evening:{c:'#ff9b57',light:.10,dark:.21,shade:'#3d1a0c'},
    night:{c:'#192b52',light:0,dark:.48,shade:'#050c24'}
  },
  beam:{strength:.55,opacity:.5},
  fireNight:1.6,
  sunPatch:.65
};
var PH=[['night','Noć',0],['morning','Jutro',7],['noon','Podne',12],['evening','Veče',19]];
function clone(o){return JSON.parse(JSON.stringify(o));}
function merge(a,b){for(var k in b){if(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])){a[k]=merge(a[k]&&typeof a[k]==='object'?a[k]:{},b[k]);}else a[k]=b[k];}return a;}
var cfg=clone(DEF);
try{var sv=JSON.parse(localStorage.getItem(KEY)||'null');if(sv)merge(cfg,sv);}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(cfg));}catch(e){}}

/* ---------- the clock ---------- */
var st={minute:OPEN,paused:false,day:1,closed:false};
function nowM(){return st.minute;}
function hex(h){h=String(h||'#000').replace('#','');if(h.length===3)h=h.replace(/./g,'$&$&');var n=parseInt(h,16)||0;return [(n>>16)&255,(n>>8)&255,n&255];}
function toHex(a){return '#'+a.map(function(v){return ('0'+Math.max(0,Math.min(255,Math.round(v))).toString(16)).slice(-2);}).join('');}
function fmt(m){m=Math.floor(m);var hh=Math.floor(m/60)%24,mm=m%60;return (hh<10?'0':'')+hh+':'+(mm<10?'0':'')+mm;}
function part(h){return h<10?'Jutro':h<17?'Dan':h<21?'Veče':'Noć';}
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
function mixPhase(h){
  var pts=[[0,'night'],[7,'morning'],[12,'noon'],[19,'evening'],[24,'night']],a=pts[0],b=pts[1],i;
  for(i=0;i<pts.length-1;i++)if(h>=pts[i][0]&&h<=pts[i+1][0]){a=pts[i];b=pts[i+1];break;}
  var t=ease(Math.max(0,Math.min(1,(h-a[0])/(b[0]-a[0])))),A=cfg.phases[a[1]],B=cfg.phases[b[1]];
  function m(x,y){return x+(y-x)*t;}
  function mc(x,y){var p=hex(x),q=hex(y);return [m(p[0],q[0]),m(p[1],q[1]),m(p[2],q[2])];}
  return {c:mc(A.c,B.c),shade:mc(A.shade,B.shade),light:m(A.light,B.light),dark:m(A.dark,B.dark)};
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
var SUNLESS='assets/effects/kuhinja_bez_sunca.webp?v=3',ZONE='assets/effects/sun_zone_mask.png?v=1',sunless=null,sunlessOK=false;
(function(){var im=new Image();im.onload=function(){sunlessOK=true;lastSig='';};im.src=SUNLESS;})();
function sunlessLayer(){
  var sc=document.getElementById('scene');if(!sc)return null;
  if(sunless&&sunless.parentNode===sc)return sunless;
  sunless=document.createElement('div');sunless.id='daySunless';
  sunless.style.cssText='position:absolute;left:0;top:0;width:'+W+'px;height:'+H+'px;pointer-events:none;z-index:0;opacity:0;background:url('+SUNLESS+') 0 0/100% 100% no-repeat;'+
    '-webkit-mask-image:url('+ZONE+');mask-image:url('+ZONE+');-webkit-mask-size:100% 100%;mask-size:100% 100%;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat';
  sc.insertBefore(sunless,sc.firstChild);return sunless;
}
function layer(){
  var sc=document.getElementById('scene');if(!sc)return false;
  if(cv&&cv.isConnected&&cv.parentNode===sc)return true;
  cv=document.createElement('canvas');cv.id='dayLight';cv.width=Math.round(W*SC);cv.height=Math.round(H*SC);
  cv.style.cssText='position:absolute;left:0;top:0;width:'+W+'px;height:'+H+'px;pointer-events:none;z-index:90000';
  sc.appendChild(cv);cx=cv.getContext('2d');return true;
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
  var h=st.closed?24:(nowM()%1440)/60,P=mixPhase(h);
  cx.setTransform(1,0,0,1,0,0);cx.clearRect(0,0,cv.width,cv.height);cx.scale(SC,SC);
  // 1. the shade of the time of day (dark at night)
  cx.fillStyle=rgba(P.shade,P.dark*.95);cx.fillRect(0,0,W,H);
  // 1b. the patches of sun that are painted on the floor go dark when there is no sun (night, early morning, late evening)
  var dayF=clamp01(Math.min((h-5)/2,(21-h)/2)),extra=(1-dayF)*(+cfg.sunPatch||0);
  var sl=sunlessLayer();if(sl)sl.style.opacity=sunlessOK?(1-dayF).toFixed(3):'0';
  if(!sunlessOK&&extra>.01&&sunI.complete&&sunI.naturalWidth){
    if(!tintC){tintC=document.createElement('canvas');tintC.width=cv.width;tintC.height=cv.height;}
    var tc=tintC.getContext('2d');tc.setTransform(1,0,0,1,0,0);tc.globalCompositeOperation='source-over';tc.clearRect(0,0,tintC.width,tintC.height);
    tc.fillStyle=rgba(P.shade,1);tc.fillRect(0,0,tintC.width,tintC.height);tc.globalCompositeOperation='destination-in';tc.drawImage(sunI,0,0,tintC.width,tintC.height);
    cx.save();cx.setTransform(1,0,0,1,0,0);cx.globalAlpha=extra;cx.drawImage(tintC,0,0);cx.restore();
  }
  // 2. the warm haze of the morning / the evening
  if(P.light>.005){cx.fillStyle=rgba(P.c,P.light*.55);cx.fillRect(0,0,W,H);}
  // 3. the shaft of the sun from the window (it moves over the day: morning on the left, evening further to the right)
  var dawn=bell(h,5,7.2,10.5),day=clamp01(Math.min((h-5)/2,(21-h)/2)),eve=bell(h,16.5,19,21.5);
  var bi=clamp01((dawn*.92+day*.12+eve*.34)*(+cfg.beam.strength||0));
  if(bi>.01){
    var s=Math.max(-1,Math.min(1,(h-12)/7)),bx=W*.07+s*60,by=H*.04,bw=W*.54,bh=H*.92,sh=s*90,al=bi*(+cfg.beam.opacity||0);
    cx.save();cx.filter='blur(3px)';
    var g=cx.createLinearGradient(bx,by,bx+bw*.75+sh,by+bh);
    g.addColorStop(0,'rgba(255,249,211,'+(al).toFixed(3)+')');g.addColorStop(.54,'rgba(255,211,120,'+(al*.4).toFixed(3)+')');g.addColorStop(1,'rgba(255,190,92,0)');
    cx.fillStyle=g;cx.beginPath();cx.moveTo(bx,by);cx.lineTo(bx+bw*.38,by);cx.lineTo(bx+bw+sh,by+bh);cx.lineTo(bx+bw*.24+sh,by+bh);cx.closePath();cx.fill();cx.restore();
  }
  // 4. the fire shines: pools of light that cut the dark (the grill, the stove)
  var nightF=clamp01(P.dark/.3)*(+cfg.fireNight||1),gl=grillLevel(),sl=stoveLevel();
  if(gl>.02)pool(497,98,340,115,Math.min(1,gl*.95*nightF),gl*.22*nightF,[255,140,50]);
  if(sl>.02)pool(1334,540,230,190,Math.min(1,sl*.75*nightF),sl*.16*nightF,[255,150,60]);
}

/* ---------- the clock on the screen ---------- */
var chipEl=null;
function chip(){
  if(!chipEl||!chipEl.isConnected){chipEl=document.createElement('div');chipEl.id='dayClock';chipEl.setAttribute('data-tool-ui','1');
    chipEl.style.cssText='position:fixed;left:1062px;top:10px;z-index:2147483000;border:2px solid #351b0d;border-radius:12px;background:#f1d9a0;color:#351b0d;font:700 12px/1 system-ui,sans-serif;padding:6px 10px;opacity:.92;pointer-events:none';
    document.body.appendChild(chipEl);}
  var h=nowM()/60,ic=st.closed?'🌙':h<10?'🌅':h<17?'☀':h<21?'🌇':'🌙';
  chipEl.textContent=ic+' '+fmt(st.closed?1440:nowM())+' · '+(st.closed?'Kafana zatvorena':part(h))+(st.paused?' ⏸':'');
}

/* ---------- the tool ---------- */
var css=document.createElement('style');
css.textContent='#dlBtn{position:fixed;right:12px;bottom:132px;z-index:2147483500;border:2px solid #351b0d;border-radius:9px;background:#e8c27a;color:#351b0d;font:700 13px/1 system-ui,sans-serif;padding:9px 12px;cursor:pointer}'+
 '#dlPanel{position:fixed;left:12px;top:96px;z-index:2147483600;width:330px;max-height:calc(100vh - 120px);overflow:auto;background:rgba(36,22,10,.94);border:2px solid #7a5428;border-radius:10px;color:#f3e3c2;font:13px/1.35 system-ui,sans-serif;padding:10px;display:none}'+
 '#dlPanel label{display:block;margin:6px 0 0}#dlPanel input[type=range]{width:100%}#dlPanel select{width:100%;margin:4px 0}#dlPanel output{float:right;color:#ffd98a}#dlPanel h4{margin:10px 0 2px;color:#ffd98a;font-size:13px}'+
 '#dlPanel button{border:1px solid #351b0d;border-radius:7px;background:#e8c27a;color:#351b0d;font:700 12px/1 system-ui,sans-serif;padding:7px 9px;margin:6px 4px 0 0;cursor:pointer}#dlPanel small{display:block;margin-top:6px;opacity:.85}#dlPanel input[type=color]{width:44px;height:26px;padding:0;border:0;background:none;vertical-align:middle}';
document.head.appendChild(css);
var btn=document.createElement('button');btn.id='dlBtn';btn.type='button';btn.textContent='☀ Vreme i svetlo';btn.setAttribute('data-tool-ui','1');
var pn=document.createElement('div');pn.id='dlPanel';pn.setAttribute('data-tool-ui','1');
document.body.appendChild(btn);document.body.appendChild(pn);
var ctr={};
function row(label,key,min,max,step,get,set,fmtv){
  var l=document.createElement('label'),o=document.createElement('output'),i=document.createElement('input');i.type='range';i.min=min;i.max=max;i.step=step;
  l.appendChild(document.createTextNode(label));l.appendChild(o);pn.appendChild(l);pn.appendChild(i);
  function upd(){var v=get();i.value=v;o.textContent=fmtv?fmtv(v):(+v).toFixed(2);}
  i.addEventListener('input',function(){set(+i.value);save();upd();lastSig='';render();chip();});
  ctr[key]=upd;upd();return i;
}
var phSel=null,colIn=null,shIn=null;
function curPh(){return cfg.phases[phSel.value];}
function build(){
  pn.innerHTML='<b>Vreme i svetlo (kuhinja)</b>';
  var bar=document.createElement('div');
  function mk(t,fn){var b=document.createElement('button');b.type='button';b.textContent=t;b.addEventListener('click',fn);bar.appendChild(b);return b;}
  var pp=mk(st.paused?'▶ Pusti':'⏸ Pauza',function(){st.paused=!st.paused;pp.textContent=st.paused?'▶ Pusti':'⏸ Pauza';chip();});ctr.pp=function(){pp.textContent=st.paused?'▶ Pusti':'⏸ Pauza';};
  mk('06:00',function(){jump(360);});mk('Podne',function(){jump(720);});mk('Veče 19:00',function(){jump(1140);});mk('Noć 23:00',function(){jump(1380);});
  pn.appendChild(bar);
  row('Vreme','t',OPEN,CLOSE,5,function(){return st.minute;},function(v){st.minute=v;st.closed=v>=CLOSE;st.paused=true;ctr.pp();},function(v){return fmt(v>=1440?1440:v);});
  row('Trajanje jednog sata u igri (s)','sph',10,180,5,function(){return cfg.secPerHour;},function(v){cfg.secPerHour=v;},function(v){return v+' s (dan = '+Math.round(v*18/6)/10+' min)';});
  var h=document.createElement('h4');h.textContent='Doba dana';pn.appendChild(h);
  phSel=document.createElement('select');PH.forEach(function(p){var o=document.createElement('option');o.value=p[0];o.textContent=p[1]+' ('+p[2]+':00)';phSel.appendChild(o);});phSel.value='evening';pn.appendChild(phSel);
  var cl=document.createElement('label');cl.textContent='Boja svetla ';colIn=document.createElement('input');colIn.type='color';cl.appendChild(colIn);
  var sl=document.createElement('label');sl.textContent='Boja mraka ';shIn=document.createElement('input');shIn.type='color';sl.appendChild(shIn);
  pn.appendChild(cl);pn.appendChild(sl);
  colIn.addEventListener('input',function(){curPh().c=colIn.value;save();lastSig='';render();});
  shIn.addEventListener('input',function(){curPh().shade=shIn.value;save();lastSig='';render();});
  row('Sjaj (topla izmaglica)','light',0,.6,.01,function(){return curPh().light;},function(v){curPh().light=v;});
  row('Mrak','dark',0,.9,.01,function(){return curPh().dark;},function(v){curPh().dark=v;});
  phSel.addEventListener('change',function(){syncPanel();});
  h=document.createElement('h4');h.textContent='Sunce i vatra';pn.appendChild(h);
  row('Jačina zraka sunca','bs',0,1.5,.05,function(){return cfg.beam.strength;},function(v){cfg.beam.strength=v;});
  row('Providnost zraka','bo',0,1,.02,function(){return cfg.beam.opacity;},function(v){cfg.beam.opacity=v;});
  row('Mrlje sunca na podu nestaju noću','sp',0,1,.05,function(){return cfg.sunPatch;},function(v){cfg.sunPatch=v;});
  row('Vatra noću sija jače','fn',0,3,.1,function(){return cfg.fireNight;},function(v){cfg.fireNight=v;try{CooksterGrill.boost(1+.5*v);}catch(e){}},function(v){return (+v).toFixed(1)+'x';});
  var b2=document.createElement('div');
  function mk2(t,fn){var b=document.createElement('button');b.type='button';b.textContent=t;b.addEventListener('click',fn);b2.appendChild(b);return b;}
  mk2('Novi dan (06:00)',function(){endDay();});
  mk2('Izvezi JSON',function(){var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(cfg,null,2)],{type:'application/json'}));a.download='cookster-day-light.json';document.body.appendChild(a);a.click();setTimeout(function(){a.remove();},500);});
  var fi=document.createElement('input');fi.type='file';fi.accept='application/json';fi.style.display='none';
  fi.addEventListener('change',function(){var f=fi.files[0];if(!f)return;var r=new FileReader();r.onload=function(){try{cfg=clone(DEF);merge(cfg,JSON.parse(r.result));save();syncPanel();lastSig='';render();chip();}catch(e){try{showToast('Fajl nije dobar.');}catch(x){}}};r.readAsText(f);fi.value='';});
  mk2('Uvezi JSON',function(){fi.click();});b2.appendChild(fi);
  mk2('Vrati početno',function(){cfg=clone(DEF);save();syncPanel();lastSig='';render();chip();});
  pn.appendChild(b2);
  var sm=document.createElement('small');sm.textContent='Sat stoji dok je vreme pomereno ručno (pauza); „Pusti“ ga nastavlja. Posle 24:00 sat staje (kafana zatvorena).';pn.appendChild(sm);
  syncPanel();
}
function jump(m){st.minute=m;st.closed=false;st.paused=true;ctr.pp&&ctr.pp();lastSig='';render();chip();syncPanel();}
function syncPanel(){if(!phSel)return;var p=curPh();colIn.value=toHex(hex(p.c));shIn.value=toHex(hex(p.shade));Object.keys(ctr).forEach(function(k){try{ctr[k]();}catch(e){}});}
btn.addEventListener('click',function(){var on=pn.style.display!=='block';pn.style.display=on?'block':'none';if(on&&!phSel)build();});
['pointerdown','pointerup','click','contextmenu','wheel'].forEach(function(n){pn.addEventListener(n,function(e){e.stopPropagation();},{passive:true});btn.addEventListener(n,function(e){e.stopPropagation();},{passive:true});});

setInterval(tick,250);
window.CooksterDay={minute:nowM,setMinute:function(m){st.minute=Math.max(OPEN,Math.min(CLOSE,m));st.closed=st.minute>=CLOSE;lastSig='';render();chip();},pause:function(v){st.paused=v!==false;chip();},endDay:endDay,isClosed:function(){return st.closed;},day:function(){return st.day;},fmt:fmt,config:function(){return cfg;}};
try{CooksterGrill&&CooksterGrill.boost&&CooksterGrill.boost(1+.5*cfg.fireNight);}catch(e){}
setTimeout(function(){render();chip();},300);
})();
