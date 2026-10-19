/* Cookster: the weather outside and the calendar.
   - The weather changes with the game time (every 3 game hours it can stay or change): sun / rain / storm. It is decided from the number of the day and the hour, so it is always the same for the same moment.
   - It changes the light of the kitchen (js/day-light.js asks CooksterWeather.sunF() and .darkAdd()), the rain on the window, the lightning with a thunder in a storm,
     and the sound outside when the window is open (js/game.js: the ambient "Napolje", chosen in the tool "Zvuk").
   - The two fields at the top (the wooden strip "dva polja"): the small one shows the date (day and month), the long one the time and the weather. */
(function(){
if(window.CooksterWeather)return;
var NAMES={sunce:'Sunčano',kisa:'Kiša',nevreme:'Nevreme'},ICON={sunce:'☀️',kisa:'🌧️',nevreme:'⛈️'},
    TARGET={sunce:{sun:1,dark:0,rain:0,storm:0},kisa:{sun:.4,dark:.05,rain:1,storm:0},nevreme:{sun:.14,dark:.12,rain:1,storm:1}},
    MONTHS=['januar','februar','mart','april','maj','jun','jul','avgust','septembar','oktobar','novembar','decembar'],MDAYS=[31,28,31,30,31,30,31,31,30,31,30,31],
    START={m:4,d:1},      // the game starts on the 1st of May
    forced=null,cur={sun:1,dark:0,rain:0,storm:0},kind='sunce',lastRef=0,nextFlash=0;
function hash(n){n=(n^61)^(n>>>16);n=(n+(n<<3))|0;n=n^(n>>>4);n=Math.imul(n,0x27d4eb2d);n=n^(n>>>15);return (n>>>0)/4294967296;}
function pick(r,prev){var k=r<.52?'sunce':r<.86?'kisa':'nevreme';if(prev==='sunce'&&k==='nevreme')k='kisa';return k;}
function kindAt(day,minute){      // a chain through the day: it mostly stays as it was, sometimes it changes
  var b=Math.max(0,Math.min(7,Math.floor(minute/180))),s=pick(hash(day*131+7),'');
  for(var i=1;i<=b;i++){if(hash(day*977+i*13)>=.58)s=pick(hash(day*389+i*29),s);}
  return s;
}
function dayNow(){try{return Math.max(1,+CooksterState.player.day||1);}catch(e){return 1;}}
function minNow(){try{return ((CooksterDay.minute()%1440)+1440)%1440;}catch(e){return 720;}}
function dateOf(day){var m=START.m,d=START.d+day-1;while(d>MDAYS[m%12]){d-=MDAYS[m%12];m++;}return {d:d,m:m%12};}
function setKind(k){
  if(k===kind)return;kind=k;
  try{if(window.CooksterSound&&k!=='nevreme')flashT=0;}catch(e){}
}
var flashT=0;
function lightning(){
  var sc=document.getElementById('scene');if(!sc)return;
  var f=document.createElement('div');f.style.cssText='position:absolute;inset:0;pointer-events:none;z-index:95000;background:#dfe8ff;opacity:0';sc.appendChild(f);
  try{f.animate([{opacity:0},{opacity:.42,offset:.08},{opacity:.05,offset:.22},{opacity:.34,offset:.34},{opacity:0}],{duration:520,easing:'ease-out'}).onfinish=function(){f.remove();};}catch(e){f.remove();}
  setTimeout(function(){f.remove();},800);
  setTimeout(function(){try{CooksterSound.play('ambWindow','thunder');}catch(e){}},400+Math.random()*1400);
}
/* the rain on the window (the strip on the left of the scene) */
var cv=null,cx=null,drops=[];
function rainBuild(){var sc=document.getElementById('scene');if(!sc)return false;if(cv&&cv.parentNode===sc)return true;
  cv=document.createElement('canvas');cv.id='weatherRain';cv.width=48;cv.height=410;cv.style.cssText='position:absolute;left:0;top:0;width:48px;height:410px;pointer-events:none;z-index:69000;opacity:0;transition:opacity .6s';sc.appendChild(cv);cx=cv.getContext('2d');return true;}
function rainDraw(dt){
  if(!rainBuild())return;var r=cur.rain;cv.style.opacity=r>.02?'1':'0';if(r<=.02&&!drops.length)return;
  cx.clearRect(0,0,48,410);
  var want=Math.round(34*r*(1+cur.storm*.8));
  while(drops.length<want)drops.push({x:Math.random()*40,y:Math.random()*410,v:380+Math.random()*260,l:7+Math.random()*10});
  if(drops.length>want)drops.length=want;
  cx.strokeStyle='rgba(205,220,255,.55)';cx.lineWidth=1;cx.beginPath();
  drops.forEach(function(d){d.y+=d.v*dt;d.x-=d.v*dt*.22;if(d.y>410||d.x<-6){d.y=-d.l;d.x=Math.random()*48;}cx.moveTo(d.x,d.y);cx.lineTo(d.x+d.l*.22,d.y-d.l);});
  cx.stroke();
}
/* the two fields at the top */
var hudA=null,hudB=null;
function hudBuild(){
  if(hudA&&hudA.isConnected)return;
  function mk(){var d=document.createElement('div');d.setAttribute('data-tool-ui','1');d.style.cssText='position:fixed;pointer-events:none;z-index:2147483100;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#3a2210;font:800 12px/1.05 Georgia,serif;text-shadow:0 1px 0 rgba(255,244,214,.6);white-space:nowrap;overflow:hidden';document.body.appendChild(d);return d;}
  hudA=mk();hudB=mk();
}
function hudUpdate(){
  hudBuild();
  var img=document.querySelector('img.ui-overlay-element[src*="dva_polja"]');
  if(!img||!img.isConnected){hudA.style.display=hudB.style.display='none';return;}
  var r=img.getBoundingClientRect();if(!r.width){hudA.style.display=hudB.style.display='none';return;}
  hudA.style.display=hudB.style.display='flex';
  function put(el,x0,x1,y0,y1){el.style.left=(r.left+r.width*x0)+'px';el.style.width=(r.width*(x1-x0))+'px';el.style.top=(r.top+r.height*y0)+'px';el.style.height=(r.height*(y1-y0))+'px';}
  put(hudA,.12,.29,.365,.62);put(hudB,.31,.90,.365,.62);      // the small field (the date) and the long field (the time and the weather)
  var dt=dateOf(dayNow()),k=r.width/238;
  hudA.innerHTML='<span style="font-size:'+(15*k).toFixed(1)+'px">'+dt.d+'</span><span style="font-size:'+(8.5*k).toFixed(1)+'px;letter-spacing:.04em;text-transform:uppercase">'+MONTHS[dt.m].slice(0,3)+'</span>';
  var tm='--:--';try{tm=CooksterDay.fmt(minNow());}catch(e){}
  hudB.innerHTML='<span style="font-size:'+(12.5*k).toFixed(1)+'px">'+tm+' · '+ICON[kind]+' '+NAMES[kind]+'</span><span style="font-size:'+(8.5*k).toFixed(1)+'px;opacity:.8">'+dt.d+'. '+MONTHS[dt.m]+' · dan '+dayNow()+'</span>';
}
var last=performance.now(),hudT=0;
function frame(now){
  requestAnimationFrame(frame);var dt=Math.min(.1,(now-last)/1000);last=now;
  var k=forced||kindAt(dayNow(),minNow());setKind(k);
  var t=TARGET[kind],a=1-Math.exp(-dt/2.5),ch=0;      // the light follows the weather slowly (a few seconds), not in a jump
  ['sun','dark','rain','storm'].forEach(function(n){var o=cur[n];cur[n]=o+(t[n]-o)*a;ch=Math.max(ch,Math.abs(cur[n]-o));});
  rainDraw(dt);
  if(ch>.0004&&now-lastRef>120){lastRef=now;try{if(window.CooksterDay&&CooksterDay.refreshLight)CooksterDay.refreshLight();}catch(e){}}
  if(kind==='nevreme'){if(!nextFlash)nextFlash=now+5000+Math.random()*9000;if(now>nextFlash){nextFlash=now+6000+Math.random()*14000;lightning();}}else nextFlash=0;
  if(now-hudT>400){hudT=now;try{hudUpdate();}catch(e){}}
}
requestAnimationFrame(frame);
window.CooksterWeather={kind:function(){return kind;},name:function(){return NAMES[kind];},icon:function(){return ICON[kind];},
  sunF:function(){return cur.sun;},darkAdd:function(){return cur.dark;},rain:function(){return cur.rain;},storm:function(){return cur.storm;},
  force:function(k){forced=(k&&TARGET[k])?k:null;},forced:function(){return forced;},date:function(){return dateOf(dayNow());},lightning:lightning};
})();
