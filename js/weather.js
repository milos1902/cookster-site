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
    START={m:6,d:1},      // the game starts on the 1st of July (summer)
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
var envCache={},thunderBusy=0;
function envelope(src){      // where the thunder sound is the loudest (the moments of the flashes): the peaks of its loudness, from the audio file itself
  if(envCache[src])return envCache[src];
  return envCache[src]=fetch(src).then(function(r){return r.arrayBuffer();}).then(function(buf){
    var AC=window.AudioContext||window.webkitAudioContext,ac=new AC();return ac.decodeAudioData(buf).then(function(ab){try{ac.close();}catch(e){}
      var d=ab.getChannelData(0),sr=ab.sampleRate,win=Math.floor(sr*.02),n=Math.floor(d.length/win),e=new Float32Array(n),mx=0;
      for(var i=0;i<n;i++){var s=0;for(var j=0;j<win;j+=4){var v=d[i*win+j];s+=v*v;}e[i]=Math.sqrt(s/(win/4));if(e[i]>mx)mx=e[i];}
      var sm=new Float32Array(n);for(i=0;i<n;i++){var a=0,c=0;for(j=-2;j<=2;j++){if(i+j>=0&&i+j<n){a+=e[i+j];c++;}}sm[i]=a/c;}
      var peaks=[],last=-9;
      for(i=1;i<n-1;i++){if(sm[i]>mx*.4&&sm[i]>=sm[i-1]&&sm[i]>=sm[i+1]){var t=i*.02;if(t-last>.45){peaks.push({t:t,a:Math.min(1,sm[i]/mx)});last=t;}else if(peaks.length&&sm[i]>peaks[peaks.length-1].a*mx){peaks[peaks.length-1]={t:t,a:Math.min(1,sm[i]/mx)};last=t;}}}
      if(!peaks.length)peaks.push({t:0,a:1});
      return {dur:ab.duration,peaks:peaks.slice(0,6)};});
  }).catch(function(){return null;});
}
function flash(power,flick){
  var sc=document.getElementById('scene');if(!sc)return;
  var wl=0;try{wl=window.CooksterWindow?CooksterWindow.level():0;}catch(e){}
  var k=(.4+.6*wl)*power;      // through the open window the flash is much stronger than through the closed one
  var f=document.createElement('div');f.style.cssText='position:absolute;inset:0;pointer-events:none;z-index:95000;opacity:0;mix-blend-mode:screen;'+
    'background:radial-gradient(ellipse 360px 520px at 10px 190px,rgba(235,242,255,1) 0,rgba(205,222,255,.75) 35%,rgba(170,195,255,.28) 70%,rgba(150,180,255,0) 100%),'+
    'linear-gradient(105deg,rgba(220,232,255,.55) 0,rgba(200,220,255,.30) 38%,rgba(190,210,255,0) 70%),rgba(190,208,255,.20)';
  sc.appendChild(f);
  var o=Math.min(1,.95*k);
  try{f.animate([{opacity:0},{opacity:o,offset:.05},{opacity:o*.15,offset:.16},{opacity:o*.9,offset:.26},{opacity:o*.1,offset:.38},{opacity:o*.55,offset:.47},{opacity:0}],{duration:760,easing:'ease-out'}).onfinish=function(){f.remove();};}catch(e){f.remove();}
  setTimeout(function(){f.remove();},1100);
  if(flick!==false)try{if(window.CooksterLuster&&CooksterLuster.flicker)CooksterLuster.flicker();}catch(e){}      // the chandelier loses the power for a moment (only at the stronger flashes)
}
function wave(src,cols){      // the picture of the sound for the tool: the loudest sample in every column
  return fetch(src).then(function(r){return r.arrayBuffer();}).then(function(buf){var AC=window.AudioContext||window.webkitAudioContext,ac=new AC();
    return ac.decodeAudioData(buf).then(function(ab){try{ac.close();}catch(e){}var d=ab.getChannelData(0),n=d.length,out=new Float32Array(cols),step=n/cols;
      for(var i=0;i<cols;i++){var m=0,s=Math.floor(i*step),e=Math.floor((i+1)*step);for(var j=s;j<e;j+=Math.max(1,Math.floor((e-s)/40))){var v=Math.abs(d[j]);if(v>m)m=v;}out[i]=m;}
      return {dur:ab.duration,peaks:out};});}).catch(function(){return null;});
}
function markersFor(src,env){      // only a very light flash: at the loudest place of the thunder sound (found from the sound itself), nowhere else
  var pk=(env&&env.peaks?env.peaks:[{t:0,a:1}]).slice().sort(function(x,y){return y.a-x.a;})[0]||{t:0,a:1};
  return [{t:pk.t,a:.15}];
}
function flashPower(a){return .3+.7*a;}
function lightning(){
  var th=null;try{th=CooksterSound.thunderSrc();}catch(e){}
  if(!th){flash(.3,false);return;}      // no thunder sound is set: only a light flash
  envelope(th.src).then(function(env){
    thunderBusy=performance.now()+((env&&env.dur)||4)*1000+800;      // one thunder at a time: the next lightning waits till this sound ends
    try{CooksterSound.playKey(th.key,th.vol);}catch(e){}
    markersFor(th.src,env).forEach(function(p){setTimeout(function(){flash(flashPower(p.a)*.6,false);},Math.max(0,p.t*1000-25));});      // a faint light through the window exactly at the loudest peak of the sound
  });
}
/* the rain on the window (the strip on the left of the scene) */
var cv=null,cx=null,drops=[];
function rainBuild(){var sc=document.getElementById('scene');if(!sc)return false;if(cv&&cv.parentNode===sc)return true;
  cv=document.createElement('canvas');cv.id='weatherRain';cv.width=48;cv.height=410;cv.style.cssText='position:absolute;left:0;top:0;width:48px;height:410px;pointer-events:none;z-index:69000;opacity:0;transition:opacity .6s';sc.appendChild(cv);cx=cv.getContext('2d');return true;}
// the rain / snow falls only outside the window: to the left of the line drawn by the owner (scene px); right of it are the open sash and the wall
var RAIN_AREA=[[-2,0],[6,0],[12,40],[24,100],[34,130],[52,172],[39,195],[14,215],[9,240],[0,278],[-2,278]];
function rainDraw(dt){
  if(!rainBuild())return;var r=Math.max(cur.rain,cur.snow);cv.style.opacity=r>.02?'1':'0';if(r<=.02&&!drops.length)return;
  cx.clearRect(0,0,48,410);cx.save();cx.beginPath();RAIN_AREA.forEach(function(q,i){i?cx.lineTo(q[0],q[1]):cx.moveTo(q[0],q[1]);});cx.closePath();cx.clip();
  var snow=cur.snow>cur.rain,want=Math.round((snow?26:34)*r*(1+cur.storm*.8));
  while(drops.length<want)drops.push({x:Math.random()*48,y:Math.random()*410,v:snow?(26+Math.random()*30):(380+Math.random()*260),l:7+Math.random()*10,p:Math.random()*6.28});
  if(drops.length>want)drops.length=want;
  if(snow){cx.fillStyle='rgba(255,255,255,.85)';var tt=performance.now()/1000;
    drops.forEach(function(d){d.y+=d.v*dt;d.x+=Math.sin(tt*1.3+d.p)*10*dt;if(d.y>414){d.y=-4;d.x=Math.random()*48;}cx.beginPath();cx.arc(d.x,d.y,1.3+(d.p%1)*1.1,0,6.2832);cx.fill();});
  }else{
  cx.strokeStyle='rgba(205,220,255,.55)';cx.lineWidth=1;cx.beginPath();
  drops.forEach(function(d){d.y+=d.v*dt;d.x-=d.v*dt*.22;if(d.y>410||d.x<-6){d.y=-d.l;d.x=Math.random()*48;}cx.moveTo(d.x,d.y);cx.lineTo(d.x+d.l*.22,d.y-d.l);});
  cx.stroke();}
  cx.restore();
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
/* the places of the texts are marked by the player with dots (fractions of the picture of the strip): the centre of the ring (the icon), the middle between the ring and the end of the strip (the name),
   the middle between the two dots of the small field (the day above, the month under it), the middle of the long field (the time only) */
var PT={iconC:[.2108,.4812],nameL:.3194,nameR:.9251,nameY:.4834,dateL:.1102,dateR:.2828,dateY:.4955,timeL:.3107,timeR:.891,timeY:.4919};
function fit(el,text,maxW,maxH,k){      // the biggest letters that still fit between the dots (measured, not guessed)
  el.style.fontSize='100px';el.textContent=text;var w=el.scrollWidth||1,h=100;
  var f=Math.min(100*maxW/w,maxH/1.05);el.style.fontSize=Math.max(6,f).toFixed(1)+'px';
}
function hudUpdate(){
  hudBuild();var all=[hudR,hudN,hudA,hudB];
  var ring=document.querySelector('img.ui-overlay-element[src*="drvena_traka_krug"]'),two=document.querySelector('img.ui-overlay-element[src*="dva_polja"]');
  function hide(l){l.forEach(function(e){e.style.display='none';});}
  var m=minNow(),icon=ICON[kind],name=NAMES[kind];
  if(kind==='sunce'&&night(m)){icon='🌙';name='Vedro';}
  function boxAt(el,r,cx,cy,w,h){el.style.display='flex';el.style.justifyContent='center';el.style.alignItems='center';el.style.padding='0';el.style.width=w+'px';el.style.height=h+'px';el.style.left=(r.left+r.width*cx-w/2)+'px';el.style.top=(r.top+r.height*cy-h/2)+'px';}
  if(ring&&ring.isConnected&&ring.getBoundingClientRect().width){
    var r=ring.getBoundingClientRect(),k=r.width/197;
    boxAt(hudR,r,PT.iconC[0],PT.iconC[1],36*k,36*k);hudR.innerHTML='';var ic=document.createElement('span');ic.style.cssText='line-height:1;display:block';ic.textContent=icon;hudR.appendChild(ic);ic.style.fontSize=(25*k).toFixed(1)+'px';
    var nw=r.width*(PT.nameR-PT.nameL),nh=r.height*.3;
    boxAt(hudN,r,(PT.nameL+PT.nameR)/2,PT.nameY,nw,nh);var ns=document.createElement('span');ns.style.cssText='line-height:1;display:block;white-space:nowrap';hudN.innerHTML='';hudN.appendChild(ns);
    ns.style.fontSize='100px';ns.textContent=name;var wN=ns.getBoundingClientRect().width||1;ns.style.fontSize=Math.min(100*nw*.9/wN,nh*.8).toFixed(1)+'px';      // centred between the ring and the end of the strip, as big as it fits
  }else hide([hudR,hudN]);
  if(two&&two.isConnected&&two.getBoundingClientRect().width){
    var q=two.getBoundingClientRect(),kk=q.width/238,dt=dateOf(dayNow()),tm='--:--';try{tm=CooksterDay.fmt(m);}catch(e){}
    var dw=q.width*(PT.dateR-PT.dateL),dh=q.height*.34;
    boxAt(hudA,q,(PT.dateL+PT.dateR)/2,PT.dateY,dw,dh);hudA.style.flexDirection='column';
    hudA.innerHTML='<span style="font-size:'+(24*kk).toFixed(1)+'px;line-height:1">'+dt.d+'</span><span style="font-size:'+(12*kk).toFixed(1)+'px;line-height:1;letter-spacing:.04em;text-transform:uppercase;margin-top:'+(1*kk).toFixed(1)+'px">'+MONTHS[dt.m].slice(0,3)+'</span>';
    var tw=q.width*(PT.timeR-PT.timeL),th=q.height*.3;
    boxAt(hudB,q,(PT.timeL+PT.timeR)/2,PT.timeY,tw,th);hudB.style.flexDirection='row';
    var ts=document.createElement('span');ts.style.cssText='line-height:1;display:block;white-space:nowrap';hudB.innerHTML='';hudB.appendChild(ts);ts.style.fontSize='100px';ts.textContent=tm;var wT=ts.getBoundingClientRect().width||1;
    ts.style.fontSize=Math.min(100*tw*.94/wT,th*1.0).toFixed(1)+'px';      // only the time, the biggest that fits between the dots
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
  if(kind==='nevreme'){if(!nextFlash)nextFlash=now+5000+Math.random()*9000;if(now>nextFlash){if(now<thunderBusy){nextFlash=thunderBusy+1500+Math.random()*4000;}else{nextFlash=now+6000+Math.random()*14000;lightning();}}}else nextFlash=0;
  if(now-hudT>400){hudT=now;try{hudUpdate();}catch(e){}}
}
requestAnimationFrame(frame);
window.CooksterWeather={kind:function(){return kind;},name:function(){return NAMES[kind];},icon:function(){return ICON[kind];},
  weights:function(){return wt;},sunF:function(){return cur.sun;},darkAdd:function(){return cur.dark;},rain:function(){return cur.rain;},snow:function(){return cur.snow;},storm:function(){return cur.storm;},
  force:function(k){forced=(k&&TARGET[k])?k:null;},forced:function(){return forced;},date:function(){return dateOf(dayNow());},lightning:lightning,busy:function(){return performance.now()<thunderBusy;}};
})();
