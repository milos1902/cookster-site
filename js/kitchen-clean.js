/* Cleaning the kitchen. The game starts with the DIRTY picture (assets/kitchen/prljava.webp) lying over the clean kitchen; whatever is rubbed off shows the clean one under it.
   - the broom (metla) cleans only the floor, the sponge (sunđer) cleans everything else (table, stove, sink, window, walls, grill, chest)
   - hold the left mouse button and move the tool left <-> right (or up <-> down): every sweep in one direction is one pass and takes off a third of the dirt of the places it touches;
     about three and a half passes over the same place make it clean (a change of direction starts a new pass)
   - the broom lifts a little dust and swishes, the sponge uses the scrubbing sound of the tool "Zvuk" (CooksterSound.scrub)
   The levels of the dirt (a grid of 4 px cells) are kept in this browser (cookster.kitchen-dirt.v1); "Nova igra" in the start menu clears them. ?cistakuhinja in the address starts with a clean kitchen. */
(function(){
'use strict';
if(window.CooksterKitchenClean)return;
var W=1672,H=941,CELL=4,GW=Math.ceil(W/CELL),GH=Math.ceil(H/CELL),KEY='cookster.kitchen-dirt.v1';
var DONE_AT=.2;                                    // the average dirt that is left when the kitchen counts as clean: at 80% cleaned the rest fades away at once
var BRUSH={metla:{r:90,zone:1},sundjer:{r:62,zone:2}};
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
img.onload=function(){ready=true;dirty=true;draw();};img.src='assets/kitchen/prljava.webp?v=2';
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
// soap bubbles of the sponge: many, bigger, light with a bright rim; they follow the sponge and float up
var bub=[];
function bubbles(x,y,n){
  for(var i=0;i<n;i++){var r=4+Math.random()*Math.random()*14;bub.push({x:x+(Math.random()-.5)*70,y:y+(Math.random()-.5)*46,vx:(Math.random()-.5)*22,vy:-10-Math.random()*34,r:r,t:0,life:1.1+Math.random()*1.3,ph:Math.random()*6.28,wob:6+Math.random()*10});}
  if(bub.length>520)bub.splice(0,bub.length-520);
}
// dust of the broom: big soft clouds (a gradient, not hard dots) that follow the broom, spread out, drift against the sweep and slowly fade
var clouds=[],specks=[],PAL=[[196,176,146],[170,150,120],[210,196,170]];
function dustClouds(x,y,n,dx,dy){
  var l=Math.hypot(dx,dy)||1,ux=dx/l,uy=dy/l;
  for(var i=0;i<n;i++){      // a wispy cloud = several soft blobs of different size that drift apart and swirl a little
    var c={x:x+(Math.random()-.5)*80,y:y+12+(Math.random()-.5)*28,vx:-ux*(10+Math.random()*26)+(Math.random()-.5)*18,vy:-uy*(5+Math.random()*12)-8-Math.random()*14,t:0,life:1.4+Math.random()*1.6,ph:Math.random()*6.28,col:PAL[(Math.random()*3)|0],b:[]};
    for(var k=0;k<4;k++)c.b.push({ox:(Math.random()-.5)*34,oy:(Math.random()-.5)*20,r:10+Math.random()*20,a:.11+Math.random()*.13,sp:(Math.random()-.5)*12});
    clouds.push(c);
  }
  for(var m=0;m<n*9;m++){      // fine specks thrown out behind the broom
    var ang=Math.atan2(-uy,-ux)+(Math.random()-.5)*1.5,sp=25+Math.random()*90;
    specks.push({x:x+(Math.random()-.5)*60,y:y+14+(Math.random()-.5)*20,vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp*.6-10-Math.random()*25,r:1+Math.random()*2.4,t:0,life:.6+Math.random()*1.2,col:PAL[(Math.random()*2)|0],a:.55+Math.random()*.4});
  }
  if(clouds.length>150)clouds.splice(0,clouds.length-150);
  if(specks.length>900)specks.splice(0,specks.length-900);
}
var lastT=0;
function tick(now){
  requestAnimationFrame(tick);var dt=Math.min(.05,(now-lastT)/1000||.016);lastT=now;
  draw();
  if(!dust.length&&!bub.length&&!clouds.length&&!specks.length){if(fx._busy){fg.clearRect(0,0,W,H);fx._busy=false;}return;}
  fx._busy=true;fg.clearRect(0,0,W,H);
  for(var i=dust.length-1;i>=0;i--){
    var p=dust[i];p.t+=dt;if(p.t>=p.life){dust.splice(i,1);continue;}
    p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.98;var k=1-p.t/p.life;
    fg.fillStyle='rgba(176,150,112,'+(p.a*k).toFixed(3)+')';fg.beginPath();fg.arc(p.x,p.y,p.r*(1+(1-k)*.8),0,6.2832);fg.fill();
  }
  for(var q=clouds.length-1;q>=0;q--){
    var c=clouds[q];c.t+=dt;if(c.t>=c.life){clouds.splice(q,1);continue;}
    c.x+=(c.vx+Math.sin(c.t*2.2+c.ph)*9)*dt;c.y+=(c.vy+Math.cos(c.t*1.7+c.ph)*5)*dt;c.vx*=.982;c.vy*=.99;
    var u=c.t/c.life,f=u<.18?u/.18:1-(u-.18)/.82,gr;
    for(var k=0;k<c.b.length;k++){var bb=c.b[k],rr=bb.r*(1+u*1.4),bx=c.x+bb.ox*(1+u*1.2)+bb.sp*c.t,by=c.y+bb.oy*(1+u);
      gr=fg.createRadialGradient(bx,by,0,bx,by,rr);var al=bb.a*f;
      gr.addColorStop(0,'rgba('+c.col[0]+','+c.col[1]+','+c.col[2]+','+al.toFixed(3)+')');gr.addColorStop(.55,'rgba('+c.col[0]+','+c.col[1]+','+c.col[2]+','+(al*.42).toFixed(3)+')');gr.addColorStop(1,'rgba('+c.col[0]+','+c.col[1]+','+c.col[2]+',0)');
      fg.fillStyle=gr;fg.beginPath();fg.arc(bx,by,rr,0,6.2832);fg.fill();}
  }
  for(var w=specks.length-1;w>=0;w--){
    var sk=specks[w];sk.t+=dt;if(sk.t>=sk.life){specks.splice(w,1);continue;}
    sk.x+=sk.vx*dt;sk.y+=sk.vy*dt;sk.vx*=.93;sk.vy=sk.vy*.93+14*dt;var ka=1-sk.t/sk.life;
    fg.fillStyle='rgba('+sk.col[0]+','+sk.col[1]+','+sk.col[2]+','+(sk.a*ka).toFixed(3)+')';fg.beginPath();fg.arc(sk.x,sk.y,sk.r,0,6.2832);fg.fill();
  }
  for(var j=bub.length-1;j>=0;j--){
    var b=bub[j];b.t+=dt;if(b.t>=b.life){bub.splice(j,1);continue;}
    b.y+=b.vy*dt;b.x+=b.vx*dt+Math.sin(b.t*4+b.ph)*b.wob*dt;b.vx*=.98;var f=b.t<.12?b.t/.12:Math.min(1,(b.life-b.t)/.5);
    fg.globalAlpha=Math.max(0,f);
    fg.beginPath();fg.arc(b.x,b.y,b.r,0,6.2832);fg.fillStyle='rgba(225,242,255,.38)';fg.fill();
    fg.lineWidth=1.6;fg.strokeStyle='rgba(255,255,255,.95)';fg.stroke();
    fg.beginPath();fg.arc(b.x,b.y,b.r*.62,3.5,4.6);fg.lineWidth=Math.max(1.2,b.r*.16);fg.strokeStyle='rgba(255,255,255,.95)';fg.stroke();
    fg.globalAlpha=1;
  }
}
requestAnimationFrame(tick);
if(startClean){cv.style.display='none';}

// ---------- the sound of the broom: a short swish of filtered noise (no file) ----------
var ac=null,lastSwish=0;
var swishSweep=-1,spongeSweep=-1;
function sponge(speed){      // one wet, soft rub per stroke of the sponge (noise through a low band that sweeps down, with a quick start)
  try{
    var AC=window.AudioContext||window.webkitAudioContext;if(!ac&&AC)ac=new AC();if(!ac)return;if(ac.state==='suspended')ac.resume();
    var dur=.3,len=Math.floor(ac.sampleRate*dur),buf=ac.createBuffer(1,len,ac.sampleRate),d=buf.getChannelData(0);
    for(var i=0;i<len;i++){var t=i/len,env=Math.pow(Math.sin(Math.PI*Math.pow(t,.55)),1.3);d[i]=(Math.random()*2-1)*env;}
    var n=ac.createBufferSource();n.buffer=buf;
    var f=ac.createBiquadFilter();f.type='bandpass';var t0=ac.currentTime,f0=1300+Math.random()*350;f.frequency.setValueAtTime(f0,t0);f.frequency.exponentialRampToValueAtTime(f0*.55,t0+dur);f.Q.value=1.1;
    var lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=3200;
    var g2=ac.createGain();g2.gain.value=Math.min(.13,.045+speed/6000);
    n.connect(f);f.connect(lp);lp.connect(g2);g2.connect(ac.destination);n.start();
  }catch(e){}
}
function swish(speed){
  var now=performance.now();if(now-lastSwish<120)return;lastSwish=now;
  try{
    var AC=window.AudioContext||window.webkitAudioContext;if(!ac&&AC)ac=new AC();if(!ac)return;if(ac.state==='suspended')ac.resume();
    var len=Math.floor(ac.sampleRate*.34),buf=ac.createBuffer(1,len,ac.sampleRate),d=buf.getChannelData(0);
    for(var i=0;i<len;i++){var t=i/len,env=Math.sin(Math.PI*Math.pow(t,.7));d[i]=(Math.random()*2-1)*env;}
    var n=ac.createBufferSource();n.buffer=buf;
    var f=ac.createBiquadFilter();f.type='bandpass';f.frequency.value=1700+Math.random()*700;f.Q.value=.7;
    var g2=ac.createGain();g2.gain.value=Math.min(.15,.05+speed/5200);      // quieter
    n.connect(f);f.connect(g2);g2.connect(ac.destination);n.start();
  }catch(e){}
}

// ---------- the pill with the progress, and the hints ----------
var pill=document.createElement('div');pill.setAttribute('data-tool-ui','1');
pill.style.cssText='position:fixed;left:50%;top:78px;transform:translateX(-50%);z-index:2147483000;padding:7px 16px;border-radius:11px;background:rgba(40,24,10,.85);border:2px solid #7a5428;color:#ffe8bf;font:700 14px system-ui,sans-serif;pointer-events:none;opacity:0;transition:opacity .4s';
document.body.appendChild(pill);var pillT=0,lastHint=0;
function say(t,ms){pill.textContent=t;pill.style.opacity='1';clearTimeout(pillT);pillT=setTimeout(function(){pill.style.opacity='0';},ms||1800);}
// the window (with its sill): the cells inside the hotspot of the window (js/window-open.js: 112 x 300 px, the lower right corner cut); the neighbour knocks only when this is clean
var winCells=(function(){var a=[],P=[[0,0],[112,0],[112,186],[67,300],[0,300]];
  function inside(x,y){var c=false;for(var i=0,j=P.length-1;i<P.length;j=i++){var xi=P[i][0],yi=P[i][1],xj=P[j][0],yj=P[j][1];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))c=!c;}return c;}
  for(var gy=0;gy<GH;gy++)for(var gx=0;gx<GW;gx++){if(inside(gx*CELL+2,gy*CELL+2))a.push(gy*GW+gx);}
  return a;})();
function windowProgress(){var s=0;for(var i=0;i<winCells.length;i++)s+=level[winCells[i]];return winCells.length?1-s/winCells.length:1;}
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
      if(w>applied[id]){level[id]=Math.max(0,level[id]-(w-applied[id])/3.6);applied[id]=w;hit=true;if(level[id]<.004)level[id]=0;}
    }}
  if(hit){dirty=true;if(tool==='metla')puff(x,y+8,1,false);}
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
  if(tool==='metla')dustClouds(p.x,p.y,Math.min(4,1+Math.round(dist/12)),dx,dy);      // a big cloud of dust follows the broom
  if(tool==='sundjer')bubbles(p.x,p.y+6,Math.min(9,2+Math.round(dist/5)));      // the sponge makes a lot of soap bubbles all along its way
  var dt=Math.max(1,now-pt),speed=dist/dt*1000;
  if(tool==='metla'&&curSweep!==swishSweep){swishSweep=curSweep;swish(speed);}      // ONE swish per stroke (left, then right...), not a continuous sound while the mouse moves
  else{      // the sponge: the sounds chosen in the tool "Zvuk" (one per stroke, game.js scrubMove); if none is chosen, a soft built-in rub: one per stroke as well
    var chosen=false;try{chosen=!!(window.CooksterSound&&CooksterSound.hasScrub&&CooksterSound.hasScrub());}catch(x){}
    if(chosen){try{CooksterSound.scrub(dx,dy,dt);}catch(x){}}
    else if(curSweep!==spongeSweep){spongeSweep=curSweep;sponge(speed);}
  }
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
  windowProgress:windowProgress,
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
