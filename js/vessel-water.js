/* Cookster - water in vessels.
   A vessel keeps how full of water it is in dataset.water (0..1, saved with the game). The water is drawn inside the area of the food that was calibrated in the tool "Maska posude"
   (js/core/vessel-food-calibration.js: the visible area of the food, and the points of the bottom and of the top of the food = how high the water can stand).
   Only vessels that have such a calibration show water. js/sink-zoom.js fills the vessels that stand in the sink; pouring (game.js) moves the water between vessels. */
(function(){
'use strict';
if(window.CooksterVesselWater)return;
var TEX='assets/water/tamna.webp?v=1';
var css=document.createElement('style');
css.textContent='@keyframes vwDrift{from{background-position:0 0,0 0}to{background-position:0 0,768px 384px}}'+
 '@keyframes vwSlosh{from{background-position:0 0,-26px -10px}to{background-position:0 0,30px 12px}}'+
 '@keyframes vwWave{from{transform:translateX(-35%)}to{transform:translateX(335%)}}'+
 '.vessel-water-ov{position:absolute;inset:0;pointer-events:none;overflow:hidden}'+
 '.vessel-water-ov .vw-fill{position:absolute;left:0;right:0;bottom:0;background:linear-gradient(rgba(30,38,36,.25),rgba(10,14,13,.5)),url('+TEX+');background-size:100% 100%,46% auto;opacity:.78;animation:vwDrift 26s linear infinite}'+
 '.vessel-water-ov .vw-top{position:absolute;left:0;right:0;height:3.2%;background:linear-gradient(rgba(255,255,255,.4),rgba(255,255,255,0));mix-blend-mode:screen}'+
 '.vessel-water-ov .vw-surf{filter:url(#vwDist);position:absolute;inset:0;opacity:.78;background:radial-gradient(ellipse at 50% 50%,rgba(0,0,0,0) 45%,rgba(0,0,0,.35) 100%),url('+TEX+');background-size:100% 100%,42% auto}'+
 '.vessel-water-ov .vw-wave{position:absolute;top:0;bottom:0;left:0;width:28%;background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.16),rgba(255,255,255,0));mix-blend-mode:screen;animation:vwWave 2.7s ease-in-out infinite alternate}'+
 '.vessel-water-ov .vw-wave.b{width:20%;animation-duration:3.9s;animation-direction:alternate-reverse;opacity:.7}'+
 '.vessel-water-ov.vw-light .vw-surf,.vessel-water-ov.vw-light .vw-fill{filter:hue-rotate(45deg) saturate(1.5) brightness(1.15)}'+
 '@keyframes vwRg{0%{transform:scale(.06);opacity:0}15%{opacity:.9}100%{transform:scale(1);opacity:0}}'+
 '.vessel-water-ov .vw-rgw{position:absolute;pointer-events:none}.vessel-water-ov .vw-rgw i{position:absolute;inset:0;border-radius:50%;border:2px solid rgba(230,242,238,.85);box-shadow:0 0 6px rgba(255,255,255,.35);opacity:0;animation:vwRg 2.4s ease-out both}'+
 '@keyframes vwRing{0%{transform:translate(-50%,-50%) scale(.05);opacity:0}12%{opacity:.85}100%{transform:translate(-50%,-50%) scale(1);opacity:0}}'+
 '.vessel-water-ov .vw-ring{position:absolute;width:90%;aspect-ratio:1;border-radius:50%;pointer-events:none;background:repeating-radial-gradient(circle,rgba(255,255,255,0) 0,rgba(255,255,255,0) 9%,rgba(235,245,240,.5) 10.5%,rgba(255,255,255,0) 12%);-webkit-mask-image:radial-gradient(circle,#000 30%,transparent 70%);mask-image:radial-gradient(circle,#000 30%,transparent 70%);animation:vwRing 5.2s ease-out infinite}';
document.head.appendChild(css);
// UV distortion of the water picture: a slowly moving noise bends the texture (so the water seems to move without a visible loop)
(function(){var NS='http://www.w3.org/2000/svg',sv=document.createElementNS(NS,'svg');sv.setAttribute('width','0');sv.setAttribute('height','0');sv.style.cssText='position:absolute;width:0;height:0;pointer-events:none';
sv.innerHTML='<defs><filter id="vwDist" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.010 0.016" numOctaves="2" seed="3" result="n"><animate attributeName="baseFrequency" dur="14s" values="0.010 0.016;0.014 0.011;0.010 0.016" repeatCount="indefinite"/></feTurbulence><feDisplacementMap in="SourceGraphic" in2="n" scale="26" xChannelSelector="R" yChannelSelector="G"/></filter></defs>';
document.body?document.body.appendChild(sv):document.addEventListener('DOMContentLoaded',function(){document.body.appendChild(sv);});})();
var WKEY='cookster.vessel-water-cal.v1',WCAL={};
try{WCAL=JSON.parse(localStorage.getItem(WKEY)||'{}')||{};}catch(e){WCAL={};}
function prof(id){
  // the calibration of the water (tool "Voda u posudi") wins over the calibration of the food
  var w=WCAL[id];
  if(w&&w.poly&&w.poly.length>=3&&w.bottom&&w.bottom.length>=3)return {foodVisible:w.poly,bottomPoly:w.bottom,mask:w.front&&w.front.length>=3?w.front:null,tilt:+w.tilt||0,ring:w.ring||null,soft:+w.soft||0,own:true};
  if(w&&w.poly&&w.poly.length>=3&&w.lo&&w.hi)return {foodVisible:w.poly,depth:{bottom:w.lo,foodTop:w.hi},mask:w.front&&w.front.length>=3?w.front:null,tilt:+w.tilt||0,ring:w.ring||null,own:true};
  var C=window.CooksterVesselFoodCalibration,p=C&&C.get&&C.get(id);
  if(!p||!p.foodVisible||p.foodVisible.length<3||!p.depth||!p.depth.bottom||!p.depth.foodTop)return null;
  return p;
}
function has(id){return !!prof(id);}
function clamp(v){return Math.max(0,Math.min(1,+v||0));}
// a layer with the water, as big as the picture of the vessel (the coordinates of the calibration are percents of that picture)
function resample(P,N){
  var n=P.length,a=0,i;for(i=0;i<n;i++){var q=P[(i+1)%n];a+=P[i][0]*q[1]-q[0]*P[i][1];}
  if(a<0)P=P.slice().reverse();
  var s0=0;for(i=1;i<n;i++)if(P[i][1]<P[s0][1]||(P[i][1]===P[s0][1]&&P[i][0]<P[s0][0]))s0=i;
  var R=[];for(i=0;i<n;i++)R.push(P[(s0+i)%n]);R.push(R[0]);
  var L=[0];for(i=1;i<R.length;i++)L.push(L[i-1]+Math.hypot(R[i][0]-R[i-1][0],R[i][1]-R[i-1][1]));
  var tot=L[L.length-1]||1,out=[],j=1;
  for(i=0;i<N;i++){var d=tot*i/N;while(j<L.length-1&&L[j]<d)j++;var f=(d-L[j-1])/((L[j]-L[j-1])||1);out.push([R[j-1][0]+(R[j][0]-R[j-1][0])*f,R[j-1][1]+(R[j][1]-R[j-1][1])*f]);}
  return out;
}
// the surface of the water at the level f: the shape of the bottom grows (point by point) into the shape of the full vessel, so it is a whole circle (an ellipse) at every level
function surfacePoly(p,f){
  var N=40,T=resample(p.foodVisible,N),B=resample(p.bottomPoly,N),out=[],cx=0,cy=0,i;
  for(i=0;i<N;i++){var x=B[i][0]+(T[i][0]-B[i][0])*f,y=B[i][1]+(T[i][1]-B[i][1])*f;out.push([x,y]);cx+=x;cy+=y;}
  cx/=N;cy/=N;
  // the tilt forward-back (the angle the surface is seen under): a circle seen from the front is flat (a thin ellipse), seen from above it is round: the surface is squashed or stretched up-down round its middle
  var k=Math.max(.25,1+(+p.tilt||0)/80);
  if(k!==1)out=out.map(function(q){return [q[0],cy+(q[1]-cy)*k];});
  return out;
}
// the water rocks: the edge of the surface goes toward the wall, bounces back and the other side follows (a slow slosh + small ripples along the edge)
var SW=[],swRun=false;
function swayFrame(now){
  var t=now/1000,live=[];
  SW.forEach(function(o){
    if(!o.d.isConnected&&now-o.born>400)return;live.push(o);
    var P=o.pts,n=P.length,cx=0,cy=0,i;for(i=0;i<n;i++){cx+=P[i][0];cy+=P[i][1];}cx/=n;cy/=n;
    var S=o.S;
    if(o.el&&typeof holding!=='undefined'){var hd=holding===o.el;
      if(hd!==S.held&&(S.held!==undefined||hd)){S.kick=now;S.dur=hd?5:7;}   /* picked up: fast for 5 seconds; put down (table, stove, sink): fast for 7 seconds, then it calms down */
      S.held=hd;}
    var dur=S.dur||7,age=S.kick?(now-S.kick)/1000:99,kk=age<dur?Math.pow(1-age/dur,1.5):0,amp=.18+1.12*kk;
    var bAge=S.boostT?(now-S.boostT)/1000:99,bst=bAge<1.1?1-bAge/1.1:0;   /* scrubbing with the sponge: a strong slosh from the left to the right */
    amp*=1+1.3*bst;   /* after the stir the water keeps moving a little */
    if(S.fr!==now){var dt=Math.min(.05,S.lt?(now-S.lt)/1000:0);S.lt=now;S.fr=now;var sp=(1+1.3*kk)*(1+1.2*bst);   /* the stronger the stir, the faster the movement */
      S.p=S.p||[0,0,0,0];S.p[0]+=dt*1.7*sp;S.p[1]+=dt*1.15*sp;S.p[2]+=dt*3.1*sp;S.p[3]+=dt*4.3*sp;}
    var P4=S.p||[0,0,0,0],a1=Math.sin(P4[0]+o.ph)*.11*amp,a2=Math.sin(P4[1]+o.ph*1.7+1.3)*.07*amp,out=[];
    for(i=0;i<n;i++){
      var q=P[i],dx=q[0]-cx,dy=q[1]-cy,an=Math.atan2(dy,dx);
      var k=1+a1*Math.cos(an-.5*(1-bst))+a2*Math.cos(an-2.2)+(.014*Math.sin(an*5+P4[2]+o.ph)+.01*Math.sin(an*8-P4[3]))*amp;
      out.push([cx+dx*k+a1*6,cy+dy*k+a2*3]);
    }
    var c='polygon('+out.map(function(q){return q[0].toFixed(2)+'% '+q[1].toFixed(2)+'%';}).join(',')+')';o.g.style.clipPath=c;o.g.style.webkitClipPath=c;
    if(o.mp&&o.d.offsetWidth>0){var sd=(o.d.offsetWidth*o.soft/100/2).toFixed(1);if(o.sd!==sd){o.sd=sd;o.mp.setAttribute('stdDeviation',sd);}}
  });
  SW=live;if(live.length)requestAnimationFrame(swayFrame);else swRun=false;
}
function sway(d,g,mp,pts,S,el,soft){SW.push({d:d,g:g,mp:mp,pts:pts,S:S,el:el,soft:soft,ph:Math.random()*6.28,born:performance.now()});if(!swRun){swRun=true;requestAnimationFrame(swayFrame);}}
// the first hit of the water: rings go out from the middle of the surface; the tilt (perspective) and the size are set in the tool
function addRing(d,pts,r,age){
  var tl=r&&r.tilt!=null?+r.tilt:.5,sz=r&&r.size!=null?+r.size:70,x0=1e9,x1=-1e9,cx=0,cy=0;
  pts.forEach(function(q){x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);cx+=q[0];cy+=q[1];});cx/=pts.length;cy/=pts.length;
  var W=(x1-x0)*sz/100,w=document.createElement('div');w.className='vw-rgw';
  w.style.cssText='left:'+cx+'%;top:'+cy+'%;width:'+W+'%;aspect-ratio:1;transform:translate(-50%,-50%) scaleY('+tl+')';
  [0,.45,.9].forEach(function(dl){var i=document.createElement('i');i.style.animationDelay=(dl-age)+'s';w.appendChild(i);});
  d.appendChild(w);
}
var SINKS={},MASKN=0;
function overlay(id,f,src,withFront,pOverride,ringAge,owner){
  var p=pOverride||prof(id);f=clamp(f);if(!p||f<=.004)return null;
  var d=document.createElement('div');d.className='vessel-water-ov';
  var morph=!!(p.bottomPoly&&p.bottomPoly.length>=3);
  var poly='polygon('+(morph?surfacePoly(p,f):p.foodVisible).map(function(q){return q[0].toFixed(2)+'% '+q[1].toFixed(2)+'%'}).join(',')+')';
  if(morph){
    // d (the outline of the vessel) > b (soft edge: blur) > g (the shape of the surface, it rocks) > the layers of the water
    var g=document.createElement('div'),mp=null,wrap=d;g.style.cssText='position:absolute;inset:0;clip-path:'+poly+';-webkit-clip-path:'+poly;
    if(+p.soft>0){
      // soft edge: a filter multiplies the (sharp, clipped) water by its own blurred outline: only the line of the edge fades, the layers stay sharp
      var uid='vwe'+(++MASKN),NS='http://www.w3.org/2000/svg',sv=document.createElementNS(NS,'svg');sv.setAttribute('width','0');sv.setAttribute('height','0');sv.style.cssText='position:absolute;width:0;height:0';
      sv.innerHTML='<defs><filter id="'+uid+'" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB"><feGaussianBlur in="SourceAlpha" stdDeviation="0.01" result="a"/><feComposite in="SourceGraphic" in2="a" operator="in"/></filter></defs>';
      mp=sv.querySelector('feGaussianBlur');d.appendChild(sv);
      wrap=document.createElement('div');wrap.style.cssText='position:absolute;inset:0;filter:url(#'+uid+')';d.appendChild(wrap);
    }
    wrap.appendChild(g);
    var sf=document.createElement('div');sf.className='vw-surf';g.appendChild(sf);
    var sp=surfacePoly(p,f),S=owner?(owner._vw=owner._vw||{}):(SINKS[id]=SINKS[id]||{}),nowT=performance.now();
    if(S.f!==undefined&&f>S.f+.0005){S.kick=nowT;S.dur=7;}S.f=f;   /* pouring: the water rocks until 7 seconds after the last drop */
    sway(d,g,mp,sp,S,owner&&owner.dataset?owner:null,+p.soft||0);if(ringAge!=null&&ringAge<2.6)addRing(g,sp,p.ring,ringAge);
    return finish(d,p,src,withFront);
  }
  d.style.clipPath=poly;d.style.webkitClipPath=poly;
  var by=p.depth.bottom[1],ty=p.depth.foodTop[1],y=by+(ty-by)*f;      // the surface of the water (percent of the height of the picture)
  var tl=+p.tilt||0;
  // the surface of the water can be tilted (the angle set in the tool): the layer is wider than the vessel and turns round the middle of the surface
  var fill=document.createElement('div');fill.className='vw-fill';fill.style.top=y+'%';fill.style.left='-60%';fill.style.right='-60%';fill.style.bottom='-80%';
  fill.style.transformOrigin='50% 0';fill.style.transform='rotate('+tl+'deg)';fill.style.backgroundSize='100% 100%,'+(46/2.2)+'% auto';
  var top=document.createElement('div');top.className='vw-top';top.style.top=(y-1.2)+'%';top.style.left='-60%';top.style.right='-60%';top.style.transformOrigin='50% 1.2%';top.style.transform='rotate('+tl+'deg)';
  /* the middle of the layer is on the x of the calibrated point of the level: shift it so that the turning point is that point */
  var cx=(p.depth.bottom[0]+p.depth.foodTop[0])/2;var shift=(cx-50);fill.style.marginLeft=shift+'%';top.style.marginLeft=shift+'%';
  d.appendChild(fill);d.appendChild(top);
  return finish(d,p,src,withFront);
}
var LUM={};
// brightness of the bottom of the vessel (picture around the middle of the bottom shape): light bottom gets the bluer water, dark bottom the grey one
function bottomLum(src,p,cb){
  if(LUM[src]!==undefined)return cb(LUM[src]);
  var P=(p.bottomPoly&&p.bottomPoly.length>=3?p.bottomPoly:p.foodVisible),cx=0,cy=0;
  P.forEach(function(q){cx+=q[0];cy+=q[1];});cx/=P.length;cy/=P.length;
  var im=new Image();im.onload=function(){
    var v=.5;try{var W=64,H=64,c=document.createElement('canvas');c.width=W;c.height=H;var g=c.getContext('2d');g.drawImage(im,0,0,W,H);
      var x=Math.round(cx/100*W),y=Math.round(cy/100*H),r=4,sum=0,n=0,a=g.getImageData(Math.max(0,x-r),Math.max(0,y-r),2*r,2*r).data;
      for(var i=0;i<a.length;i+=4){if(a[i+3]<128)continue;sum+=(a[i]*.3+a[i+1]*.59+a[i+2]*.11)/255;n++;}
      if(n)v=sum/n;}catch(e){}
    LUM[src]=v;cb(v);};
  im.onerror=function(){LUM[src]=.5;cb(.5);};im.src=src;
}
function finish(d,p,src,withFront){
  if(src){
    bottomLum(src,p,function(v){if(v>.38)d.classList.add('vw-light');});
    // the water never leaves the outline of the vessel (the picture of the vessel is the mask), and where the front wall of the vessel is drawn over the food, it is over the water too
    var m='url("'+src+'")';d.style.webkitMaskImage=m;d.style.maskImage=m;d.style.webkitMaskSize='100% 100%';d.style.maskSize='100% 100%';
    if(withFront&&p.mask&&p.mask.length>=3){
      var fr=document.createElement('img');fr.src=src;fr.alt='';fr.draggable=false;
      var mp='polygon('+p.mask.map(function(q){return q[0]+'% '+q[1]+'%'}).join(',')+')';
      fr.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;clip-path:'+mp+';-webkit-clip-path:'+mp;
      d.appendChild(fr);
    }
  }
  return d;
}
function get(el){return clamp(el&&el.dataset&&el.dataset.water);}
// the vessel in the kitchen
function sync(el){
  if(!el||!el.dataset)return;
  var id=el.dataset.itemId,f=get(el),key=f<=.004||!has(id)?'':String(Math.round(f*100));
  if(el._waterKey===key)return;
  el._waterKey=key;
  var now=performance.now(),last=el._lastF;
  if(last!==undefined&&f>last+.0005){if(now-(el._lastInc||0)>1500)el._ring=now;el._lastInc=now;}
  el._lastF=f;
  if(el._waterOv){el._waterOv.remove();el._waterOv=null;}
  if(!key)return;
  var body=el.querySelector('.body'),src=body&&body.getAttribute('src');
  var pr=prof(id),d=overlay(id,f,src,!!(pr&&pr.own&&pr.mask),null,el._ring?(now-el._ring)/1000:null,el);if(!d)return;
  // vessels with a front wall (a picture over the food, z-index 6): the water goes under it; the pans have none: the water is over the food
  d.style.zIndex=el._vesselFrontMask&&el._vesselFrontMask.style.display!=='none'?'5':'8';el.appendChild(d);el._waterOv=d;
}
function set(el,f){
  f=clamp(f);
  if(f<=.004)delete el.dataset.water;else el.dataset.water=f.toFixed(3);
  sync(el);
}
window.CooksterVesselWater={agitate:function(el){var S=el&&(el._vw=el._vw||{});if(!S)return;var n=performance.now();S.boostT=n;S.kick=n;S.dur=1.8;},reload:function(){try{WCAL=JSON.parse(localStorage.getItem(WKEY)||'{}')||{};}catch(e){}},has:has,front:function(id){var p=prof(id);return p&&p.mask&&p.mask.length>=3?p.mask:null;},get:get,set:set,sync:sync,overlay:overlay,clamp:clamp};

/* ---------- the tool "Voda u posudi": where the water of a vessel is ----------
   For every vessel: the shape of the surface of the water (the opening of the vessel), the point where the water stands when the vessel is nearly empty and the point when it is full,
   and (not necessary) the front wall that hides the water. Points are percents of the picture of the vessel. It is saved in this browser (cookster.vessel-water-cal.v1). */
function equipment(){
  var l=[];try{(window.CooksterCatalog&&CooksterCatalog.KITCHEN_EQUIPMENT||[]).forEach(function(d){if(d&&d.id&&d.src&&(d.vessel===true||d.type==='container'||d.type==='cookware'))l.push({id:d.id,label:d.label||d.id,src:d.src});});}catch(e){}
  return l;
}
function saveW(){try{localStorage.setItem(WKEY,JSON.stringify(WCAL));}catch(e){}}
function refreshKitchen(id){try{(window.items||[]).forEach(function(it){if(it&&it.dataset&&it.dataset.itemId===id){it._waterKey=null;sync(it);}});}catch(e){}}
function ellipsePoly(cx,cy,rx,ry){var o=[];for(var i=0;i<12;i++){var a=i/12*Math.PI*2;o.push([+(cx+rx*Math.cos(a)).toFixed(1),+(cy+ry*Math.sin(a)).toFixed(1)]);}return o;}
function startFor(id){
  var C=window.CooksterVesselFoodCalibration,p=C&&C.get&&C.get(id);
  if(p&&p.foodVisible&&p.foodVisible.length>=3&&p.depth&&p.depth.bottom&&p.depth.foodTop){var T=p.foodVisible.map(function(q){return q.slice()}),cx=0,cy=0;T.forEach(function(q){cx+=q[0];cy+=q[1];});cx/=T.length;cy/=T.length;var dy=p.depth.bottom[1]-p.depth.foodTop[1];return {poly:T,bottom:T.map(function(q){return [+(cx+(q[0]-cx)*.72).toFixed(1),+(cy+(q[1]-cy)*.72+Math.abs(dy)*.55).toFixed(1)]}),front:p.mask&&p.mask.length>=3?p.mask.map(function(q){return q.slice()}):[]};}
  return {poly:ellipsePoly(50,30,36,20),bottom:ellipsePoly(50,40,26,13),front:[]};
}
function buildTool(){
  var hud=document.getElementById('hud');if(!hud||document.getElementById('vesselWaterBtn'))return;
  var btn=document.createElement('button');btn.id='vesselWaterBtn';btn.type='button';btn.textContent='💧 Voda u posudi';btn.title='Nacrtaj gde je voda u svakoj posudi';hud.appendChild(btn);
  var st=document.createElement('style');st.textContent=
   '#vwTool{position:fixed;inset:0;z-index:21000;display:none;background:rgba(10,6,3,.55)}#vwTool.open{display:block}'+
   '#vwTool .vw-card{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(1100px,96vw);height:min(720px,94vh);background:#2a1a0c;border:2px solid #7a5428;border-radius:12px;color:#f3e3c2;font:13px/1.35 system-ui,sans-serif;display:flex;gap:12px;padding:12px}'+
   '#vwTool .vw-side{width:290px;overflow:auto}#vwTool .vw-main{flex:1;position:relative;display:flex;align-items:center;justify-content:center;background:#1a0f06;border-radius:8px;overflow:hidden}'+
   '#vwTool .vw-stage{position:relative;max-width:100%;max-height:100%}#vwTool .vw-stage img.vw-pic{display:block;max-width:100%;max-height:calc(94vh - 40px);-webkit-user-drag:none;user-select:none;image-rendering:auto}'+
   '#vwTool svg{position:absolute;inset:0;width:100%;height:100%;cursor:crosshair}'+
   '#vwTool button,#vwTool select{border:1px solid #351b0d;border-radius:7px;background:#e8c27a;color:#351b0d;font:700 12px/1 system-ui,sans-serif;padding:7px 9px;margin:2px 4px 2px 0;cursor:pointer}#vwTool select{width:100%;font-weight:600}#vwTool button.on{background:#fff0b8;box-shadow:0 0 0 2px #ffd86a}'+
   '#vwTool label{display:block;margin:7px 0}#vwTool input[type=range]{width:100%}#vwTool small{display:block;color:#d9c69c;margin:5px 0}#vwTool hr{border:0;border-top:1px solid #7a5428;margin:8px 0}';
  document.head.appendChild(st);
  var root=document.createElement('div');root.id='vwTool';root.setAttribute('data-tool-ui','1');
  root.innerHTML='<div class="vw-card"><div class="vw-side"><b style="font-size:15px">💧 Voda u posudi</b><button id="vwClose" style="float:right">×</button>'+
   '<label>Posuda <select id="vwSel"></select></label>'+
   '<div><button data-m="poly" class="on">Gore (puna posuda)</button><button data-m="bottom">Dno posude</button><button data-m="front">Prednja ivica</button></div>'+
   '<small><b>Točak miša</b> uveličava posudu, <b>desni ili srednji taster</b> pomera sliku. <b style="color:#7fe3ff">Gore</b>: oblik (krug) površine vode kad je posuda PUNA. <b style="color:#ffe27a">Dno</b>: oblik (krug) dna posude. Voda raste od oblika dna do oblika gore (uvek kao ceo krug). Prevuci tačke; klik na liniju ubacuje tačku, dvoklik briše. <b style="color:#ef5350">Prednja ivica</b> (nije obavezno): deo zida posude koji treba da bude IZNAD vode.</small>'+
   '<label>Probni nivo vode <input id="vwLvl" type="range" min="0" max="100" value="60"><b id="vwLvlN">60%</b></label><label>Meki rub vode <input id="vwSoft" type="range" min="0" max="10" step="0.2" value="0"><b id="vwSoftN">0</b></label><label>Krugovi pri udaru: nagib perspektive <input id="vwRgT" type="range" min="0.15" max="1" step="0.01" value="0.5"><b id="vwRgTN">0.50</b></label><label>Krugovi: veličina (% širine vode) <input id="vwRgS" type="range" min="20" max="130" step="1" value="70"><b id="vwRgSN">70</b></label><div class="vw-row"><button id="vwRgGo">💦 Probaj prvi udar</button></div><label>Nagib napred-nazad (kako se vidi površina) <input id="vwTilt" type="range" min="-40" max="40" step="0.5" value="0"><b id="vwTiltN">0</b></label>'+
   '<div><button id="vwSave">💾 Sačuvaj ovu posudu</button><button id="vwReset">↺ Početno</button><button id="vwCopy">Kopiraj sve (JSON)</button></div><small id="vwStatus"></small></div>'+
   '<div class="vw-main"><div class="vw-stage" id="vwStage"><img class="vw-pic" id="vwPic" alt=""><div id="vwOv" style="position:absolute;inset:0;pointer-events:none"></div><svg id="vwSvg" viewBox="0 0 100 100" preserveAspectRatio="none"></svg></div></div></div>';
  document.body.appendChild(root);
  var sel=root.querySelector('#vwSel'),pic=root.querySelector('#vwPic'),svg=root.querySelector('#vwSvg'),ov=root.querySelector('#vwOv'),stage=root.querySelector('#vwStage'),lvl=root.querySelector('#vwLvl');
  var tiltEl=root.querySelector('#vwTilt'),cur=null,mode='poly',work={},drag=null,COL={poly:'#42d6e8',bottom:'#ffe27a',front:'#ef5350'};
  var list=equipment();
  function fill(){sel.innerHTML='';list.forEach(function(v){var o=document.createElement('option');o.value=v.id;var sv=!!WCAL[v.id];o.textContent=(sv?'✔ ':'')+v.label;o.style.fontWeight=sv?'800':'400';sel.appendChild(o);});if(cur)sel.value=cur;}
  function load(id){cur=id;var w=WCAL[id];work=JSON.parse(JSON.stringify(w||startFor(id)));if(!work.front)work.front=[];if(!work.bottom||work.bottom.length<3)work.bottom=startFor(id).bottom;var v=list.find(function(x){return x.id===id});pic.src=v?v.src:'';rgSync();ringT=0;draw();}
  function se(t,a){var e=document.createElementNS('http://www.w3.org/2000/svg',t);for(var k in a)e.setAttribute(k,a[k]);return e;}
  function profile(){return {foodVisible:work.poly,bottomPoly:work.bottom,mask:work.front&&work.front.length>=3?work.front:null,tilt:+work.tilt||0,ring:work.ring||null,soft:+work.soft||0};}
  var ringT=0,toolOwner={};
  function rgSync(){var sf=root.querySelector('#vwSoft');sf.value=+work.soft||0;root.querySelector('#vwSoftN').textContent=sf.value;var r=work.ring||{};rgT.value=r.tilt!=null?r.tilt:.5;rgS.value=r.size!=null?r.size:70;root.querySelector('#vwRgTN').textContent=(+rgT.value).toFixed(2);root.querySelector('#vwRgSN').textContent=rgS.value;}
  function draw(){
    while(svg.firstChild)svg.removeChild(svg.firstChild);
    ['front','bottom','poly'].forEach(function(k){var P=work[k]||[];if(P.length<2)return;var c=COL[k],on=mode===k;
      if(P.length>=3)svg.appendChild(se('polygon',{points:P.map(function(p){return p[0]+','+p[1]}).join(' '),fill:c,'fill-opacity':on?.14:.05,stroke:c,'stroke-width':on?.4:.2,'vector-effect':'non-scaling-stroke','pointer-events':'none'}));
      if(!on)return;
      P.forEach(function(p,i){var a=P[(i+1)%P.length],l=se('line',{x1:p[0],y1:p[1],x2:a[0],y2:a[1],stroke:'transparent','stroke-width':'12','vector-effect':'non-scaling-stroke'});l.dataset.k=k;l.dataset.e=i;svg.appendChild(l);});
      P.forEach(function(p,i){var c2=se('circle',{cx:p[0],cy:p[1],r:.9,fill:'#fff',stroke:c,'stroke-width':'.3','vector-effect':'non-scaling-stroke'});c2.dataset.k=k;c2.dataset.i=i;svg.appendChild(c2);});});
    ov.innerHTML='';var o=overlay(cur,+lvl.value/100,pic.getAttribute('src'),true,profile(),ringT?(performance.now()-ringT)/1000:null,toolOwner);if(o)ov.appendChild(o);
    root.querySelector('#vwLvlN').textContent=lvl.value+'%';root.querySelector('#vwTiltN').textContent=(+work.tilt||0);tiltEl.value=+work.tilt||0;
  }
  function pct(e){var r=stage.getBoundingClientRect();return [Math.max(0,Math.min(100,(e.clientX-r.left)/r.width*100)),Math.max(0,Math.min(100,(e.clientY-r.top)/r.height*100))];}
  svg.addEventListener('pointerdown',function(e){
    if(e.button!==0)return;var t=e.target;
    if(t.tagName==='circle'&&t.dataset.i!==undefined){drag={k:t.dataset.k,i:+t.dataset.i};svg.setPointerCapture(e.pointerId);e.preventDefault();return;}
    if(t.tagName==='line'&&t.dataset.e!==undefined){var k=t.dataset.k,i=+t.dataset.e;work[k].splice(i+1,0,pct(e));draw();drag={k:k,i:i+1};svg.setPointerCapture(e.pointerId);e.preventDefault();return;}
    work[mode].push(pct(e));draw();
  });
  svg.addEventListener('pointermove',function(e){if(!drag)return;work[drag.k][drag.i]=pct(e);draw();});
  svg.addEventListener('pointerup',function(){drag=null;});
  svg.addEventListener('dblclick',function(e){var t=e.target;if(t.tagName==='circle'&&t.dataset.i!==undefined&&work[t.dataset.k].length>(t.dataset.k==='front'?0:3)){work[t.dataset.k].splice(+t.dataset.i,1);draw();}});
  root.querySelectorAll('[data-m]').forEach(function(b){b.addEventListener('click',function(){mode=b.dataset.m;root.querySelectorAll('[data-m]').forEach(function(x){x.classList.toggle('on',x===b)});draw();});});
  // zoom with the wheel (round the cursor), the picture is moved with the right or middle mouse button
  var main=root.querySelector('.vw-main'),Z={s:1,x:0,y:0},pan=null;
  function applyZ(){stage.style.transform='translate('+Z.x+'px,'+Z.y+'px) scale('+Z.s+')';}
  main.addEventListener('wheel',function(e){
    e.preventDefault();var r=main.getBoundingClientRect(),vx=e.clientX-(r.left+r.width/2),vy=e.clientY-(r.top+r.height/2);
    var ns=Math.max(1,Math.min(8,Z.s*(e.deltaY<0?1.15:1/1.15)));
    Z.x=vx-(vx-Z.x)*ns/Z.s;Z.y=vy-(vy-Z.y)*ns/Z.s;Z.s=ns;if(ns===1){Z.x=0;Z.y=0;}applyZ();
  },{passive:false});
  main.addEventListener('contextmenu',function(e){e.preventDefault();});
  main.addEventListener('pointerdown',function(e){if(e.button===0)return;pan={x:e.clientX,y:e.clientY,ox:Z.x,oy:Z.y};main.setPointerCapture(e.pointerId);e.preventDefault();});
  main.addEventListener('pointermove',function(e){if(!pan)return;Z.x=pan.ox+e.clientX-pan.x;Z.y=pan.oy+e.clientY-pan.y;applyZ();});
  main.addEventListener('pointerup',function(){pan=null;});
  main.addEventListener('pointercancel',function(){pan=null;});
  lvl.addEventListener('input',draw);
  root.querySelector('#vwSoft').addEventListener('input',function(e){work.soft=+e.target.value;root.querySelector('#vwSoftN').textContent=e.target.value;draw();});
  var rgT=root.querySelector('#vwRgT'),rgS=root.querySelector('#vwRgS');
  function rgSet(){work.ring={tilt:+rgT.value,size:+rgS.value};root.querySelector('#vwRgTN').textContent=(+rgT.value).toFixed(2);root.querySelector('#vwRgSN').textContent=rgS.value;ringT=performance.now();draw();}
  rgT.addEventListener('input',rgSet);rgS.addEventListener('input',rgSet);
  root.querySelector('#vwRgGo').addEventListener('click',function(){ringT=performance.now();draw();});
  tiltEl.addEventListener('input',function(){work.tilt=+tiltEl.value;draw();});
  sel.addEventListener('change',function(){load(sel.value);});
  pic.addEventListener('load',draw);
  root.querySelector('#vwSave').addEventListener('click',function(){WCAL[cur]=JSON.parse(JSON.stringify(work));saveW();refreshKitchen(cur);fill();root.querySelector('#vwStatus').textContent='Sačuvano za ovu posudu (podebljana je u listi sa ✔).';});
  root.querySelector('#vwReset').addEventListener('click',function(){delete WCAL[cur];saveW();refreshKitchen(cur);fill();load(cur);root.querySelector('#vwStatus').textContent='Vraćeno na početno.';});
  root.querySelector('#vwCopy').addEventListener('click',function(){var t=JSON.stringify(WCAL,null,2);if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(function(){root.querySelector('#vwStatus').textContent='JSON je kopiran: nalepi ga u chat.';},function(){root.querySelector('#vwStatus').textContent='Ne mogu da kopiram.';});});
  root.querySelector('#vwClose').addEventListener('click',function(){root.classList.remove('open');});
  btn.addEventListener('click',function(){root.classList.add('open');list=equipment();fill();load(cur||(list[0]&&list[0].id));});
  window.addEventListener('keydown',function(e){if(root.classList.contains('open')&&e.key==='Escape'){e.stopPropagation();root.classList.remove('open');}},true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',buildTool,{once:true});else setTimeout(buildTool,0);

})();
