/* Cookster: the weather outside and the calendar.
   - The weather changes with the game time (every 3 game hours it can stay or change): sun / rain / storm. It is decided from the number of the day and the hour, so it is always the same for the same moment.
   - It changes the light of the kitchen (js/day-light.js asks CooksterWeather.sunF() and .darkAdd()), the rain on the window, the lightning with a thunder in a storm,
     and the sound outside when the window is open (js/game.js: the ambient "Napolje", chosen in the tool "Zvuk").
   - The two fields at the top (the wooden strip "dva polja"): the small one shows the date (day and month), the long one the time and the weather. */
(function(){
if(window.CooksterWeather)return;
var NAMES={sunce:'Sunčano',kisa:'Kiša',nevreme:'Nevreme',sneg:'Sneg'},ICON={sunce:'☀️',kisa:'🌧️',nevreme:'⛈️',sneg:'❄️'},
    TARGET={sunce:{sun:1,dark:0,rain:0,storm:0,snow:0},kisa:{sun:0,dark:.065,rain:1,storm:0,snow:0},nevreme:{sun:0,dark:.15,rain:1,storm:1,snow:0},sneg:{sun:0,dark:.07,rain:0,storm:0,snow:1}},      // sun = the rays of the sun (the painted sun on the floor and the shaft from the window): only when it is sunny; dark = how much darker the whole scene is (sunny is the lightest, the storm the darkest)
    MONTHS=['januar','februar','mart','april','maj','jun','jul','avgust','septembar','oktobar','novembar','decembar'],MDAYS=[31,28,31,30,31,30,31,31,30,31,30,31],
    START={m:0,d:1},      // the game starts on the 1st of January
    forced=null,cur={sun:1,dark:0,rain:0,storm:0,snow:0},kind='sunce',lastRef=0,nextFlash=0,wt={sunce:1,kisa:0,nevreme:0,sneg:0};
function hash(n){n=(n^61)^(n>>>16);n=(n+(n<<3))|0;n=n^(n>>>4);n=Math.imul(n,0x27d4eb2d);n=n^(n>>>15);return (n>>>0)/4294967296;}
function pick(r,prev,month){      // the weather depends on the season: snow only in winter, storms rather in spring / summer
  var w=(month===11||month===0||month===1),su=(month>=5&&month<=7),cuts;
  // cumulative limits: sunce, sneg, kisa (the rest = nevreme)
  if(w)cuts=[.30,.85,.96];else if(su)cuts=[.60,.60,.86];else cuts=[.46,.46,.84];
  var k=r<cuts[0]?'sunce':r<cuts[1]?'sneg':r<cuts[2]?'kisa':'nevreme';
  if(prev==='sunce'&&k==='nevreme')k='kisa';
  return k;
}
function kindAt(day,minute){      // a chain through the day: it mostly stays as it was, sometimes it changes
  var b=Math.max(0,Math.min(7,Math.floor(minute/180))),m=dateOf(day).m,s=pick(hash(day*131+7),'',m);
  for(var i=1;i<=b;i++){if(hash(day*977+i*13)>=.58)s=pick(hash(day*389+i*29),s,m);}
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
  if(!rainBuild())return;var r=Math.max(cur.rain,cur.snow);cv.style.opacity=r>.02?'1':'0';if(r<=.02&&!drops.length)return;
  cx.clearRect(0,0,48,410);
  var snow=cur.snow>cur.rain,want=Math.round((snow?26:34)*r*(1+cur.storm*.8));
  while(drops.length<want)drops.push({x:Math.random()*48,y:Math.random()*410,v:snow?(26+Math.random()*30):(380+Math.random()*260),l:7+Math.random()*10,p:Math.random()*6.28});
  if(drops.length>want)drops.length=want;
  if(snow){cx.fillStyle='rgba(255,255,255,.85)';var tt=performance.now()/1000;
    drops.forEach(function(d){d.y+=d.v*dt;d.x+=Math.sin(tt*1.3+d.p)*10*dt;if(d.y>414){d.y=-4;d.x=Math.random()*48;}cx.beginPath();cx.arc(d.x,d.y,1.3+(d.p%1)*1.1,0,6.2832);cx.fill();});
  }else{
  cx.strokeStyle='rgba(205,220,255,.55)';cx.lineWidth=1;cx.beginPath();
  drops.forEach(function(d){d.y+=d.v*dt;d.x-=d.v*dt*.22;if(d.y>410||d.x<-6){d.y=-d.l;d.x=Math.random()*48;}cx.moveTo(d.x,d.y);cx.lineTo(d.x+d.l*.22,d.y-d.l);});
  cx.stroke();}
}
/* the fields at the top: the ring (the icon of the weather) with the name of the weather beside it on the wooden strip; the small field (the date); the long field (the time on the left, the day of the game on the right) */
var FONT="'Paytone One','Lilita One',Georgia,serif";      // a chunky game font with all our letters (č ć š ž đ): assets/fonts/PaytoneOne-Regular.ttf (SIL Open Font License)
(function(){var st=document.createElement('style');st.textContent="@font-face{font-family:'Paytone One';src:url('assets/fonts/PaytoneOne-Regular.ttf') format('truetype');font-display:swap}";document.head.appendChild(st);})();
var hudR=null,hudN=null,hudA=null,hudB=null;
function hudBuild(){
  if(hudA&&hudA.isConnected)return;
  function mk(){var d=document.createElement('div');d.setAttribute('data-tool-ui','1');d.style.cssText='position:fixed;pointer-events:none;z-index:2147483100;display:flex;align-items:center;justify-content:center;text-align:center;color:#3a2210;font:400 12px/1 '+FONT+';text-shadow:0 1px 0 rgba(255,244,214,.6);white-space:nowrap;overflow:hidden';document.body.appendChild(d);return d;}
  hudR=mk();hudN=mk();hudA=mk();hudB=mk();hudA.style.flexDirection='column';hudN.style.justifyContent='flex-start';hudN.style.color='#fff1cf';hudN.style.textShadow='0 1px 2px rgba(40,18,6,.85)';
}
function night(m){return m<330||m>=1140;}
function hudUpdate(){
  hudBuild();var all=[hudR,hudN,hudA,hudB];
  var ring=document.querySelector('img.ui-overlay-element[src*="drvena_traka_krug"]'),two=document.querySelector('img.ui-overlay-element[src*="dva_polja"]');
  function hide(l){l.forEach(function(e){e.style.display='none';});}
  var m=minNow(),icon=ICON[kind],name=NAMES[kind];
  if(kind==='sunce'&&night(m)){icon='🌙';name='Vedro';}
  if(ring&&ring.isConnected&&ring.getBoundingClientRect().width){
    var r=ring.getBoundingClientRect(),k=r.width/197;
    function put(el,x0,x1,y0,y1){el.style.display='flex';el.style.left=(r.left+r.width*x0)+'px';el.style.width=(r.width*(x1-x0))+'px';el.style.top=(r.top+r.height*y0)+'px';el.style.height=(r.height*(y1-y0))+'px';}
    put(hudR,.12,.30,.285,.665);hudR.innerHTML='<span style="font-size:'+(25*k).toFixed(1)+'px;line-height:1">'+icon+'</span>';      // the icon inside the ring
    put(hudN,.36,.94,.34,.64);hudN.innerHTML='<span style="font-size:'+(21*k).toFixed(1)+'px;letter-spacing:.02em">'+name+'</span>';      // the name of the weather on the strip beside the ring
  }else hide([hudR,hudN]);
  if(two&&two.isConnected&&two.getBoundingClientRect().width){
    var q=two.getBoundingClientRect(),kk=q.width/238;
    function put2(el,x0,x1,y0,y1){el.style.display='flex';el.style.left=(q.left+q.width*x0)+'px';el.style.width=(q.width*(x1-x0))+'px';el.style.top=(q.top+q.height*y0)+'px';el.style.height=(q.height*(y1-y0))+'px';}
    put2(hudA,.12,.29,.365,.62);put2(hudB,.31,.90,.365,.62);
    var dt=dateOf(dayNow()),tm='--:--';try{tm=CooksterDay.fmt(m);}catch(e){}
    hudA.innerHTML='<span style="font-size:'+(23*kk).toFixed(1)+'px">'+dt.d+'</span><span style="font-size:'+(12*kk).toFixed(1)+'px;letter-spacing:.04em;text-transform:uppercase">'+MONTHS[dt.m].slice(0,3)+'</span>';
    hudB.style.justifyContent='space-between';hudB.style.padding='0 '+(8*kk).toFixed(1)+'px';
    hudB.innerHTML='<span style="font-size:'+(21*kk).toFixed(1)+'px">'+tm+'</span><span style="font-size:'+(19*kk).toFixed(1)+'px">Dan '+dayNow()+'</span>';      // the time on the left, the day of the game on the right
  }else hide([hudA,hudB]);
}
var last=performance.now(),hudT=0;
function frame(now){
  requestAnimationFrame(frame);var dt=Math.min(.1,(now-last)/1000);last=now;
  var k=forced||kindAt(dayNow(),minNow());setKind(k);
  var t=TARGET[kind],a=1-Math.exp(-dt/2.5),ch=0;      // the light follows the weather slowly (a few seconds), not in a jump
  ['sun','dark','rain','storm','snow'].forEach(function(n){var o=cur[n];cur[n]=o+(t[n]-o)*a;ch=Math.max(ch,Math.abs(cur[n]-o));});
  ['sunce','kisa','nevreme','sneg'].forEach(function(n){var o=wt[n],g=(n===kind)?1:0;wt[n]=o+(g-o)*a;if(Math.abs(wt[n]-g)<.002)wt[n]=g;ch=Math.max(ch,Math.abs(wt[n]-o));});      // the weights of the weathers: the lighting flows slowly from one weather to the other
  rainDraw(dt);
  if(ch>.0004&&now-lastRef>120){lastRef=now;try{if(window.CooksterDay&&CooksterDay.refreshLight)CooksterDay.refreshLight();}catch(e){}}
  if(kind==='nevreme'){if(!nextFlash)nextFlash=now+5000+Math.random()*9000;if(now>nextFlash){nextFlash=now+6000+Math.random()*14000;lightning();}}else nextFlash=0;
  if(now-hudT>400){hudT=now;try{hudUpdate();}catch(e){}}
}
requestAnimationFrame(frame);
window.CooksterWeather={kind:function(){return kind;},name:function(){return NAMES[kind];},icon:function(){return ICON[kind];},
  weights:function(){return wt;},sunF:function(){return cur.sun;},darkAdd:function(){return cur.dark;},rain:function(){return cur.rain;},snow:function(){return cur.snow;},storm:function(){return cur.storm;},
  force:function(k){forced=(k&&TARGET[k])?k:null;},forced:function(){return forced;},date:function(){return dateOf(dayNow());},lightning:lightning};
})();
