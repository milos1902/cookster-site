/* Cleaning the kitchen. The game starts with the DIRTY picture (assets/kitchen/prljava.webp) lying over the clean kitchen; whatever is rubbed off shows the clean one under it.
   - the broom (metla) cleans only the floor, the sponge (sunđer) cleans everything else (table, stove, sink, window, walls, grill, chest)
   - hold the left mouse button and move the tool left <-> right (or up <-> down): every sweep in one direction is one pass and takes off a third of the dirt of the places it touches;
     three passes over the same place make it clean (a change of direction starts a new pass)
   - the broom lifts a little dust and swishes, the sponge uses the scrubbing sound of the tool "Zvuk" (CooksterSound.scrub)
   The levels of the dirt (a grid of 4 px cells) are kept in this browser (cookster.kitchen-dirt.v1); "Nova igra" in the start menu clears them. ?cistakuhinja in the address starts with a clean kitchen. */
(function(){
'use strict';
if(window.CooksterKitchenClean)return;
var W=1672,H=941,CELL=4,GW=Math.ceil(W/CELL),GH=Math.ceil(H/CELL),KEY='cookster.kitchen-dirt.v1';
var DONE_AT=.035;                                    // the average dirt that is left when the kitchen counts as clean (the rest fades away)
var BRUSH={metla:{r:80,zone:1},sundjer:{r:54,zone:2}};
var sc=document.getElementById('scene');if(!sc)return;
if(/[?&]cistakuhinja(=|&|$)/.test(location.search)){try{localStorage.setItem(KEY,'clean');}catch(e){}}
var stored=null;try{stored=localStorage.getItem(KEY);}catch(e){}
var startClean=stored==='clean';                      // already clean: the dirt canvas stays hidden

var level=new Float32Array(GW*GH).fill(1),sweepOf=new Int32Array(GW*GH).fill(-1),applied=new Float32Array(GW*GH),zone=new Uint8Array(GW*GH);
if(!startClean&&stored&&stored.length>100){                       // levels saved as 0..3 thirds, one character per cell
  try{var s=atob(stored);if(s.length===GW*GH)for(var i=0;i<s.length;i++)level[i]=s.charCodeAt(i)/3;}catch(e){}
}
// ---------- the zones: 1 = floor (broom), 2 = everything else (sponge) ----------
// taken from the tool "Kalibracija scene": the floor is the zone "Pod"; the table top, the legs, the stove, the chest, the sink, the chimneys ... are cut out of it.
// Everything under and beside the table that is floor stays floor (the broom cleans it).
(function(){
  var cz=document.createElement('canvas');cz.width=GW;cz.height=GH;var g=cz.getContext('2d');
  var S=window.CooksterSceneSurfaces,SF=(typeof placementGeometry!=='undefined'&&placementGeometry.SURFACES)||{};
  function zoneOf(id){try{return S&&S.calibratedZone?S.calibratedZone(id):null;}catch(e){return null;}}
  function path(pts){g.beginPath();pts.forEach(function(q,i){var x=q.x/CELL,y=q.y/CELL;i?g.lineTo(x,y):g.moveTo(x,y);});g.closePath();g.fill();}
  function fillZone(id,col,fallback){
    var z=zoneOf(id);g.fillStyle=col;
    if(z&&z.top&&z.top.length>2){
      path(z.top);
      if(z.bottom&&z.bottom.length===z.top.length){                       // a volume: the top, the bottom and the sides
        path(z.bottom);for(var i=0;i<z.top.length;i++){var j=(i+1)%z.top.length;path([z.top[i],z.top[j],z.bottom[j],z.bottom[i]]);}
      }
    }else if(fallback&&fallback.length)path(fallback);
  }
  g.fillStyle='#00f';g.fillRect(0,0,GW,GH);                                // blue = everything else (sponge)
  fillZone('floor','#f00',SF.floorPoly);                                  // red = floor (broom)
  g.fillStyle='#f00';path([{x:228,y:236},{x:452,y:228},{x:440,y:336},{x:86,y:340},{x:132,y:326},{x:212,y:326}]);   // the floor between the pile of logs and the table (the zone "Pod" starts lower)
  ['table','left-leg','right-leg','cabinet-left','stove-left','stove-right','stove-upper-left','chimney-left','chimney-right','woodpile-left','back','sink-rim','sink','sink-front'].forEach(function(id){
    fillZone(id,'#00f',id==='table'?SF.tablePoly:null);
  });
  g.fillStyle='#f00';path([{x:752,y:146},{x:1268,y:146},{x:1286,y:234},{x:752,y:234}]);   // the floor between the saloon doors and the table (the zone "Gornja zona" covered it)
  g.fillStyle='#00f';path([{x:478,y:592},{x:1174,y:592},{x:1172,y:690},{x:480,y:692}]);   // the drawers of the table (the front of the table between the legs): the sponge
  g.fillStyle='#00f';g.fillRect(1220/CELL,235/CELL,(W-1220)/CELL,(668-235)/CELL);   // the body of the stove (no zone of its own)
  var d=g.getImageData(0,0,GW,GH).data;
  for(var i=0;i<GW*GH;i++)zone[i]=d[i*4]>128&&d[i*4+2]<128?1:2;
})();

// ---------- the picture ----------
var cv=document.createElement('canvas');cv.id='kitchenDirt';cv.width=W;cv.height=H;
cv.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:26';
sc.insertBefore(cv,sc.firstChild);
var g=cv.getContext('2d'),img=new Image(),ready=false,dirty=true;
img.onload=function(){ready=true;dirty=true;draw();};img.src='assets/kitchen/prljava.webp?v=1';
var mk=document.createElement('canvas');mk.width=GW;mk.height=GH;var mg=mk.getContext('2d'),md=mg.createImageData(GW,GH);
function draw(){
  if(!ready||!dirty)return;dirty=false;
  var d=md.data;for(var i=0;i<GW*GH;i++){d[i*4]=0;d[i*4+1]=0;d[i*4+2]=0;d[i*4+3]=Math.round(Math.max(0,Math.min(1,level[i]))*255);}
  mg.putImageData(md,0,0);
  g.globalCompositeOperation='source-over';g.clearRect(0,0,W,H);g.drawImage(img,0,0,W,H);
  g.globalCompositeOperation='destination-in';g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
  try{g.filter='blur(3px)';}catch(e){}g.drawImage(mk,0,0,W,H);try{g.filter='none';}catch(e){}
  g.globalCompositeOperation='source-over';
}
// ---------- dust ----------
var fx=document.createElement('canvas');fx.width=W;fx.height=H;fx.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:12040';
sc.appendChild(fx);var fg=fx.getContext('2d'),dust=[];
function puff(x,y,n,big){
  for(var i=0;i<n;i++)dust.push({x:x+(Math.random()-.5)*50,y:y+(Math.random()-.5)*24,vx:(Math.random()-.5)*26,vy:-8-Math.random()*26,r:(big?3.5:2.2)+Math.random()*3,t:0,life:.8+Math.random()*.7,a:.28+Math.random()*.2});
  if(dust.length>260)dust.splice(0,dust.length-260);
}
var lastT=0;
function tick(now){
  requestAnimationFrame(tick);var dt=Math.min(.05,(now-lastT)/1000||.016);lastT=now;
  draw();
  if(!dust.length){if(fx._busy){fg.clearRect(0,0,W,H);fx._busy=false;}return;}
  fx._busy=true;fg.clearRect(0,0,W,H);
  for(var i=dust.length-1;i>=0;i--){
    var p=dust[i];p.t+=dt;if(p.t>=p.life){dust.splice(i,1);continue;}
    p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.98;var k=1-p.t/p.life;
    fg.fillStyle='rgba(176,150,112,'+(p.a*k).toFixed(3)+')';fg.beginPath();fg.arc(p.x,p.y,p.r*(1+(1-k)*.8),0,6.2832);fg.fill();
  }
}
requestAnimationFrame(tick);
if(startClean){cv.style.display='none';}

// ---------- the sound of the broom: a short swish of filtered noise (no file) ----------
var ac=null,lastSwish=0;
function swish(speed){
  var now=performance.now();if(now-lastSwish<330)return;lastSwish=now;
  try{
    var AC=window.AudioContext||window.webkitAudioContext;if(!ac&&AC)ac=new AC();if(!ac)return;if(ac.state==='suspended')ac.resume();
    var len=Math.floor(ac.sampleRate*.34),buf=ac.createBuffer(1,len,ac.sampleRate),d=buf.getChannelData(0);
    for(var i=0;i<len;i++){var t=i/len,env=Math.sin(Math.PI*Math.pow(t,.7));d[i]=(Math.random()*2-1)*env;}
    var n=ac.createBufferSource();n.buffer=buf;
    var f=ac.createBiquadFilter();f.type='bandpass';f.frequency.value=1700+Math.random()*700;f.Q.value=.7;
    var g2=ac.createGain();g2.gain.value=Math.min(.34,.12+speed/2400);
    n.connect(f);f.connect(g2);g2.connect(ac.destination);n.start();
  }catch(e){}
}

// ---------- the pill with the progress, and the hints ----------
var pill=document.createElement('div');pill.setAttribute('data-tool-ui','1');
pill.style.cssText='position:fixed;left:50%;top:78px;transform:translateX(-50%);z-index:2147483000;padding:7px 16px;border-radius:11px;background:rgba(40,24,10,.85);border:2px solid #7a5428;color:#ffe8bf;font:700 14px system-ui,sans-serif;pointer-events:none;opacity:0;transition:opacity .4s';
document.body.appendChild(pill);var pillT=0,lastHint=0;
function say(t,ms){pill.textContent=t;pill.style.opacity='1';clearTimeout(pillT);pillT=setTimeout(function(){pill.style.opacity='0';},ms||1800);}
function progress(){var s=0,n=0;for(var i=0;i<GW*GH;i++){n++;s+=level[i];}return 1-s/n;}

// ---------- the brush ----------
var down=false,tool='',curSweep=0,px=0,py=0,pt=0,axis=0,dirSign=0,travel=0,sinceSave=0,passInfo=0;
function toolId(){try{var h=holding;return h&&h.dataset?h.dataset.itemId:'';}catch(e){return '';}}
function toScene(e){try{return screenToScene(e.clientX,e.clientY);}catch(x){return {x:e.clientX,y:e.clientY};}}
function stamp(x,y,b){
  // a soft brush: full strength in the middle, fading out towards the edge (so the clean place has a gradient, not a hard edge);
  // in one pass (sweep) a place never loses more than a third, whatever the number of touches
  var r=b.r,cx=Math.round(x/CELL),cy=Math.round(y/CELL),R=Math.ceil(r/CELL),hit=false,touched=0;
  for(var j=-R;j<=R;j++){var yy=cy+j;if(yy<0||yy>=GH)continue;
    for(var i=-R;i<=R;i++){var xx=cx+i;if(xx<0||xx>=GW)continue;
      var q=Math.sqrt(i*i+j*j)/R;if(q>=1)continue;var id=yy*GW+xx;
      if(zone[id]!==b.zone||level[id]<=0)continue;
      touched++;
      var t=(q-.3)/.7,w=t<=0?1:1-t*t*(3-2*t);           // 1 in the middle, 0 at the edge (smoothstep)
      if(w<=.002)continue;
      if(sweepOf[id]!==curSweep){sweepOf[id]=curSweep;applied[id]=0;}
      if(w>applied[id]){level[id]=Math.max(0,level[id]-(w-applied[id])/3);applied[id]=w;hit=true;if(level[id]<.004)level[id]=0;}
    }}
  if(hit){dirty=true;puff(x,y+8,tool==='metla'?2:1,tool==='metla');}
  return touched;
}
function onMove(e){
  var b=BRUSH[tool];if(!b)return;var p=toScene(e),now=performance.now();
  var dx=p.x-px,dy=p.y-py,dist=Math.hypot(dx,dy);if(dist<1)return;
  // a new pass: the direction of the main movement turns round (more than 28 px against the old direction) or goes to the other axis
  var ax=Math.abs(dx)>=Math.abs(dy)?1:2,sg=ax===1?Math.sign(dx):Math.sign(dy);
  if(axis===0){axis=ax;dirSign=sg;}
  else if(ax===axis&&sg!==dirSign&&sg!==0){travel+=dist;if(travel>28){curSweep++;dirSign=sg;travel=0;}}
  else if(ax!==axis){travel+=dist;if(travel>40){curSweep++;axis=ax;dirSign=sg;travel=0;}}
  else travel=0;
  var steps=Math.max(1,Math.ceil(dist/9)),any=0;
  for(var i=1;i<=steps;i++){var t=i/steps;any+=stamp(px+dx*t,py+dy*t,b);}
  var dt=Math.max(1,now-pt),speed=dist/dt*1000;
  if(tool==='metla')swish(speed);
  else{try{if(window.CooksterSound&&CooksterSound.scrub)CooksterSound.scrub(dx,dy,dt);}catch(x){}}
  if(!any&&now-lastHint>2600){lastHint=now;say(tool==='metla'?'Metla čisti samo pod. Za sve ostalo uzmi sunđer.':'Sunđer ne čisti pod. Za pod uzmi metlu.',2200);}
  px=p.x;py=p.y;pt=now;
  var pr=progress();say('Kuhinja: '+Math.min(100,Math.round(pr*100))+'% očišćena',1400);
  if(1-pr<=DONE_AT)finish();
}
function save(){
  try{var s='';for(var i=0;i<GW*GH;i++)s+=String.fromCharCode(Math.round(level[i]*3));localStorage.setItem(KEY,btoa(s));}catch(e){}
}
function finish(){
  if(finish.done||startClean)return;finish.done=true;down=false;level.fill(0);dirty=true;
  try{localStorage.setItem(KEY,'clean');}catch(e){}
  say('Kuhinja je čista! Baka bi bila ponosna.',4200);
  setTimeout(function(){cv.style.transition='opacity .8s';cv.style.opacity='0';setTimeout(function(){if(cv.parentNode)cv.parentNode.removeChild(cv);},900);},300);
  try{window.dispatchEvent(new CustomEvent('cookster:kitchen-clean'));}catch(e){}
}
window.CooksterKitchenClean={
  active:function(){return !startClean&&!finish.done;},
  progress:progress,
  zoneMap:function(){var c=document.createElement('canvas');c.width=GW;c.height=GH;var x=c.getContext('2d'),im=x.createImageData(GW,GH);for(var i=0;i<GW*GH;i++){var f=zone[i]===1;im.data[i*4]=f?255:0;im.data[i*4+1]=f?60:120;im.data[i*4+2]=f?60:255;im.data[i*4+3]=110;}x.putImageData(im,0,0);return c.toDataURL();},
  // called by the game when the left button goes down with the broom or the sponge in the hand; true = the cleaning has started
  begin:function(e){
    if(startClean||finish.done)return false;tool=toolId();if(!BRUSH[tool])return false;
    if(document.body.classList.contains('pantry-open')||document.body.classList.contains('garden-open')||document.body.classList.contains('market-open'))return false;
    try{if(window.CooksterTavern&&CooksterTavern.isOpen===true)return false;}catch(x){}
    var p=toScene(e);down=true;px=p.x;py=p.y;pt=performance.now();axis=0;dirSign=0;travel=0;curSweep++;
    return true;
  },
  move:onMove,
  end:function(){if(!down)return;down=false;try{if(window.CooksterSound&&CooksterSound.scrubStop)CooksterSound.scrubStop();}catch(e){}save();},
  // "Nova igra": the kitchen is dirty again (also when it had been cleaned before)
  restart:function(){
    try{localStorage.removeItem(KEY);}catch(e){}
    level.fill(1);sweepOf.fill(-1);applied.fill(0);finish.done=false;startClean=false;down=false;dust.length=0;
    if(!cv.parentNode)sc.insertBefore(cv,sc.firstChild);
    cv.style.display='block';cv.style.transition='none';cv.style.opacity='1';dirty=true;
  }
};
})();
