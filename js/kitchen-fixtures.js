/* Cookster — the fixtures of the kitchen picture that can be clicked: the two drawers of the table (click = the drawer opens / closes in 0.3 s) and the stone grill (click = zoom).
   The kitchen picture itself does not change: an open drawer is a small cut-out picture (a frame of the Higgsfield video, with its shadow on the floor; assets/drawers/*.webp)
   that is shown over it, (20 steps from closed to open. */
(function(){
'use strict';
if(window.CooksterKitchenFx)return;
var W=1672,H=941;
var N=15;                                                       // the drawer is drawn in (20 steps (frames of the animation: assets/drawers/<left|right>_<1..15>.webp, 0 = closed)
var DR={
  left:{x:380,y:585,N:16,G:[0,0,.007,.03,.06,.10,.15,.18,.27,.33,.45,.54,.66,.77,.87,1,1.03],p:0,idx:0,to:0,label:'leva fioka',x0:485,x1:825,dx0:-39,dx1:-3,dy:153,el:null,ims:[]},
  right:{x:828,y:585,N:15,G:[0,0,.016,.04,.087,.135,.19,.214,.27,.357,.444,.563,.635,.77,.873,1],p:0,idx:0,to:0,label:'desna fioka',x0:835,x1:1170,dx0:-8,dx1:31,dy:124,el:null,ims:[]}
};
var GRILL={l:225,t:20,r:760,b:235},ZOOM_SRC='assets/grill_zoom.webp?v=2';
var imgs={};
function load(src){var im=imgs[src];if(!im){im=imgs[src]=new Image();im.src=src}return im}
Object.keys(DR).forEach(function(k){for(var i=1;i<=DR[k].N;i++)DR[k].ims[i]=load('assets/drawers/'+k+'_'+i+'.webp?v=11')});
// the open drawer is a small picture (a frame of the video, with its shadow on the floor) over the kitchen: above the occluders of the table, below all the things of the player
function ensureEl(d){
  if(d.el&&d.el.isConnected)return true;
  var sc=document.getElementById('scene');if(!sc)return false;
  d.el=document.createElement('img');d.el.draggable=false;
  d.el.style.cssText='position:absolute;z-index:26;pointer-events:none;display:none;left:'+d.x+'px;top:'+d.y+'px';
  sc.appendChild(d.el);return true;
}
// the shadow of a pulled-out drawer on the floor below it (the light comes from the window on the left, so it falls a little to the right); drawn in a canvas under the drawer
var shc=null;
function shadows(){
  var sc=document.getElementById('scene');if(!sc)return;
  if(!shc||!shc.isConnected){shc=document.createElement('canvas');shc.width=W;shc.height=H;shc.style.cssText='position:absolute;left:0;top:0;width:'+W+'px;height:'+H+'px;z-index:25;pointer-events:none';sc.appendChild(shc)}
  var g=shc.getContext('2d');g.clearRect(0,0,W,H);
  Object.keys(DR).forEach(function(k){
    var d=DR[k];if(!d.idx)return;var t=Math.min(1,gOf(d)),yb=680+d.dy*t,x0=d.x0+d.dx0*t,x1=d.x1+d.dx1*t;
    g.save();g.beginPath();g.rect(0,yb-1,W,70);g.clip();
    g.filter='blur(8px)';g.fillStyle='rgba(38,18,6,'+(0.52*Math.pow(t,.6)).toFixed(3)+')';
    g.beginPath();g.ellipse((x0+x1)/2+22,yb+9,(x1-x0)/2+2,19,0,0,Math.PI*2);g.fill();g.restore();
  });
}
function paint(k){
  var d=DR[k];if(!ensureEl(d))return;
  shadows();
  if(!d.idx){d.el.style.display='none';return}
  d.el.src=d.ims[d.idx].src;d.el.style.display='block';
}
function setP(k,v){
  var d=DR[k];d.p=Math.max(0,Math.min(1,v));var i=Math.round(d.p*d.N);
  if(i!==d.idx){d.idx=i;paint(k);if(k==='left')updateJars()}
}
// a click on the drawer: it opens (or closes) in 0.3 s
function toggle(k){
  var d=DR[k];d.to=d.to?0:1;
  try{playImpactSound(k==='left'?drawerLeftSoundTarget:drawerRightSoundTarget,d.to?'open':'close')}catch(e){}   // the sounds are chosen in the sound tool ("Leva fioka stola", "Desna fioka stola": open / close)
  var from=d.p,to=d.to,t0=performance.now(),dur=300,token=d.tok=(d.tok||0)+1;
  (function step(now){
    if(d.tok!==token)return;
    var t=Math.min(1,((now||performance.now())-t0)/dur),e=t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
    setP(k,from+(to-from)*e);if(t<1)requestAnimationFrame(step);
  })(t0);
}
// ---------- the spice jars stand in the compartments of the left drawer (the pictures are cut out of the picture of the drawer with the jars) ----------
// a jar that is in the drawer is only a picture; when it is taken a real jar (the item zacin_<name>) is in the hand, and when it is put back over the open drawer the item goes away and the picture is shown again
// in the compartment where it was put (any jar can stand in any compartment); the jars move together with the drawer while it opens (they are cut off by the table and by the front of the drawer)
var JARS=[
  {id:'paprika',x:506,y:596,box:{l:512,t:602,r:568,b:680},slot:0},
  {id:'tucana',x:579,y:595,box:{l:585,t:601,r:639,b:680},slot:1},
  {id:'biber',x:654,y:595,box:{l:660,t:601,r:711,b:680},slot:2},
  {id:'so',x:726,y:595,box:{l:732,t:601,r:785,b:680},slot:3},
  {id:'secer',x:490,y:675,box:{l:496,t:681,r:555,b:751},slot:4},
  {id:'lovor',x:570,y:676,box:{l:576,t:682,r:632,b:751},slot:5}
];
// the eight compartments: where the middle of the bottom of a jar stands (back row, then front row)
var SLOTS=[{cx:540,b:680},{cx:612,b:680},{cx:686,b:680},{cx:759,b:680},{cx:525,b:751},{cx:604,b:751},{cx:683,b:751},{cx:762,b:751}];
var slotJar=[];                                                  // slotJar[i] = id of the jar that stands in the compartment i (or null)
for(var si=0;si<SLOTS.length;si++)slotJar[si]=null;
JARS.forEach(function(j){j.im=load('assets/drawers/jar_'+j.id+'.webp?v=2');j.el=null;j.slot=-1;j.cx0=(j.box.l+j.box.r)/2;j.b0=j.box.b});
(function(){var def=['paprika','tucana','biber','so','secer','lovor'];def.forEach(function(id,i){JARS.forEach(function(j){if(j.id===id){j.slot=i;slotJar[i]=id}})})})();
function gOf(d){return d.G[d.idx]||0}
var DRAWER_IN={l:462,t:603,r:818,b:756};                        // the inside of the open left drawer
var jarClip=null;
function jarOut(j){try{return(window.items||items).some(function(el){return el.dataset&&el.dataset.itemId==='zacin_'+j.id})}catch(e){return false}}
function freeSlotNear(x,y){var best=-1,bd=1e9;for(var i=0;i<SLOTS.length;i++){if(slotJar[i])continue;var d=Math.hypot(SLOTS[i].cx-x,(SLOTS[i].b-30)-y);if(d<bd){bd=d;best=i}}return best}
function slotBox(j){var o=SLOTS[j.slot];return{l:j.box.l+o.cx-j.cx0,r:j.box.r+o.cx-j.cx0,t:j.box.t+o.b-j.b0,b:j.box.b+o.b-j.b0}}
// the drawer slides toward the camera and gets a little bigger: a point of its inside is at (x,y) when it is open and at ((x-TX)/SC,(y-TY)/SC) when it is closed; in between everything is mixed in the same proportion
var SC=1.106,TX=-90.4,TY=82.8,DIVIDER={x:462,y:681,w:356,h:32};
var divEl=null;
function mapPoint(x,y,t){var cx=(x-TX)/SC,cy=(y-TY)/SC;return{x:cx+(x-cx)*t,y:cy+(y-cy)*t}}
function scaleAt(t){return 1/SC+(1-1/SC)*t}
function updateJars(){
  var sc=document.getElementById('scene');if(!sc)return;
  var d=DR.left,t=d.idx>=d.N?1:gOf(d)*.843,frontTop=597+155*t;      // the jars are placed on the last picture (the deeper drawer), the pictures from the video go a little less deep: .843
  if(!jarClip||!jarClip.isConnected){jarClip=document.createElement('div');jarClip.style.cssText='position:absolute;z-index:27;pointer-events:none;overflow:hidden;left:440px;top:603px;width:390px;height:0px';sc.appendChild(jarClip)}
  JARS.forEach(function(j){                                     // reconcile: a jar that is out of the drawer frees its compartment, a jar that is in the drawer gets one
    if(jarOut(j)){if(j.slot>=0){slotJar[j.slot]=null;j.slot=-1}}
    else if(j.slot<0){var f=freeSlotNear(660,700);if(f>=0){j.slot=f;slotJar[f]=j.id}}
  });
  var shown=d.idx>0;
  var L=Math.round(d.x0+d.dx0*t)+6,R=Math.round(d.x1+d.dx1*t)-6;                // the jars can be seen only inside of the drawer (between its walls)
  jarClip.style.left=L+'px';jarClip.style.width=Math.max(0,R-L)+'px';
  jarClip.style.height=Math.max(0,Math.round(frontTop-603))+'px';jarClip.style.display=shown?'block':'none';
  var k=scaleAt(t);
  if(!divEl||!divEl.isConnected){divEl=document.createElement('img');divEl.draggable=false;divEl.src='assets/drawers/divider.webp?v=1';divEl.style.cssText='position:absolute;pointer-events:none;transform-origin:0 0;z-index:2';jarClip.appendChild(divEl)}
  var dp=mapPoint(DIVIDER.x,DIVIDER.y,t);divEl.style.left=Math.round(dp.x-L)+'px';divEl.style.top=Math.round(dp.y-603)+'px';divEl.style.transform='scale('+k.toFixed(4)+')';divEl.style.display=shown?'block':'none';
  JARS.forEach(function(j){
    if(!j.el||!j.el.isConnected){j.el=document.createElement('img');j.el.draggable=false;j.el.style.cssText='position:absolute;pointer-events:none;display:none;transform-origin:0 0';jarClip.appendChild(j.el)}
    var show=shown&&j.slot>=0;
    if(show){
      var o=SLOTS[j.slot],back=o.b<700,jx=j.x+(o.cx-j.cx0),jy=j.y+(o.b-j.b0)+(back?7:4);   // the bottoms of the jars go a little behind the divider (back row) and behind the front of the drawer (front row)
      var mp=mapPoint(jx,jy,t);if(!j.el.src)j.el.src=j.im.src;
      j.el.style.left=Math.round(mp.x-L)+'px';j.el.style.top=Math.round(mp.y-603)+'px';j.el.style.transform='scale('+k.toFixed(4)+')';
      j.el.style.zIndex=back?'1':'3';
    }
    j.el.style.display=show?'block':'none';
  });
}
setInterval(updateJars,150);
function jarAt(p){
  if(DR.left.idx!==DR.left.N)return null;
  for(var i=0;i<JARS.length;i++){var j=JARS[i];if(j.slot>=0&&!jarOut(j)&&inR(p,slotBox(j)))return j}
  return null;
}
function takeJar(j){
  try{
    var id='zacin_'+j.id,def=kitchenEquipmentDef(id),sp=screenToScene(mouse.x,mouse.y);
    if(!def||jarOut(j))return;
    var el=makeItem(Object.assign({},def,{instanceId:nextItemInstanceId(id),x:sp.x-def.w/2,y:sp.y-def.h,z:++zCounter}));
    if(!el)return;el.dataset.surfaceZone='table';
    setPose(el,sp.x,sp.y,surfaceScaleFor(el,'table',sp.y));
    startHolding(el);updateJars();
    try{CooksterSave.schedule()}catch(e){}
  }catch(e){}
}
// a jar that is put down over the open drawer goes into the compartment that is the nearest to the place (a free one)
function tryDrop(item){
  try{
    if(!item||!item.dataset||DR.left.idx!==DR.left.N)return false;
    var m=/^zacin_(paprika|tucana|biber|so|secer|lovor)$/.exec(item.dataset.itemId||'');if(!m)return false;
    var p=screenToScene(mouse.x,mouse.y);if(!inR(p,DRAWER_IN))return false;
    var jar=null;JARS.forEach(function(j){if(j.id===m[1])jar=j});if(!jar)return false;
    var f=freeSlotNear(p.x,p.y);if(f<0)return false;
    removeItem(item);holding=null;jar.slot=f;slotJar[f]=jar.id;
    try{hidePlacementGhost();hideOriginGhost();clearPanTargets();updateHover()}catch(e){}
    updateJars();try{showToast('Tegla je u fioci.')}catch(e){}try{CooksterSave.schedule()}catch(e){}
    return true;
  }catch(e){return false}
}
function inR(p,r){return p.x>=r.l&&p.x<=r.r&&p.y>=r.t&&p.y<=r.b}
// what lies under the mouse (client coordinates); an item that stands over it has the priority
function hit(x,y){
  var p=screenToScene(x,y);
  try{if(typeof itemAt==='function'&&itemAt(x,y))return null}catch(e){}
  var jr=jarAt(p);if(jr){var jd=null;try{jd=kitchenEquipmentDef('zacin_'+jr.id)}catch(e){}return{kind:'jar',id:jr.id,label:((jd&&jd.label)||jr.id)+' — klik da uzmeš'}}
  for(var k in DR){var d=DR[k],t=Math.min(1,gOf(d));
    if(inR(p,{l:d.x0+d.dx0*t,r:d.x1+d.dx1*t,t:603,b:680+d.dy*t+4}))return{kind:'drawer',key:k,label:d.label+(d.to?' — klik za zatvaranje':' — klik za otvaranje')}}
  if(inR(p,GRILL))return{kind:'grill',label:'roštilj — klik za zumiranje'};
  return null;
}
// ---------- the grill: the camera comes close ----------
var view=null;
// the camera zooms in on the grill (frames of a Higgsfield video: assets/grillzoom/z_1..41.webp, from the whole kitchen to the grill) in about half a second,
// then the picture of the grill (the same one) takes over; the zoom out is the same frames the other way round
var ZN=64,ZMS=400,ZIN=330,FADE=110,zimgs=[],zbit=[],ARC=[0.0000,0.0329,0.0892,0.1419,0.1692,0.1935,0.2165,0.2384,0.2603,0.2824,0.3047,0.3273,0.3496,0.3658,0.3831,0.4002,0.4151,0.4312,0.4475,0.4710,0.4953,0.5187,0.5414,0.5645,0.5874,0.6090,0.6312,0.6527,0.6748,0.6980,0.7214,0.7396,0.7584,0.7765,0.7849,0.7953,0.8047,0.8122,0.8217,0.8301,0.8447,0.8615,0.8766,0.8895,0.9040,0.9179,0.9282,0.9403,0.9509,0.9568,0.9655,0.9732,0.9756,0.9798,0.9821,0.9833,0.9866,0.9878,0.9899,0.9940,0.9962,0.9971,0.9991,1.0000];       // ARC[i-1]: how far the picture has travelled (0..1, measured as the sum of the differences between the frames) at frame i: the time is mapped to the travelled distance, so the motion is smooth whatever the speed of the video was
// the frames are decoded once into bitmaps (createImageBitmap) and drawn on a canvas: setting img.src for every frame made the first frames come too late (the zoom seemed to start from the middle)
for(var zi=1;zi<=ZN;zi++){(function(i){
  var im=new Image();im.src='assets/grillzoom/z_'+i+'.webp?v=6';zimgs[i]=im;
  var go=function(){if(window.createImageBitmap)createImageBitmap(im).then(function(b){zbit[i]=b}).catch(function(){})};
  if(im.decode)im.decode().then(go).catch(function(){}) ;else im.onload=go;
})(zi)}
var zoomImg=new Image();zoomImg.src=ZOOM_SRC;if(zoomImg.decode)zoomImg.decode().catch(function(){});
function zoomReady(){for(var i=1;i<=ZN;i++)if(!zbit[i]&&!(zimgs[i].complete&&zimgs[i].naturalWidth))return false;return zoomImg.complete}
function drawFrame(cv,i){var g=cv.getContext('2d');g.drawImage(zbit[i]||zimgs[i],0,0,cv.width,cv.height)}
function frameAt(q){q=Math.max(0,Math.min(1,q));var lo=0,hi=ZN-1;while(lo<hi){var mid=(lo+hi)>>1;if(ARC[mid]<q)lo=mid+1;else hi=mid}return lo+1}
function animateZoom(v,back,done){
  var fr=v.querySelector('.gz-frame'),gi=v.querySelector('.gz-grill'),ZM=back?ZMS:ZIN,total=FADE+ZM+FADE,t0=performance.now(),last=-1;
  (function step(now){
    var e=Math.max(0,Math.min(total,now-t0)),f,g;
    // the same both ways (the zoom in is the zoom out drawn the other way round): a short stop (FADE), then the camera starts slowly and gets faster, and at the end the picture of the other side takes over (FADE)
    if(!back){                                                    // the kitchen -> the grill
      var t=Math.max(0,Math.min(1,(e-FADE)/ZM));f=t*t;g=e>FADE+ZM?(e-FADE-ZM)/FADE:0;
    }else{                                                        // the grill -> the kitchen
      var t2=Math.max(0,Math.min(1,(e-FADE)/ZM));f=1-t2*t2;g=e<FADE?1-e/FADE:0;
    }
    var idx=frameAt(f);
    if(idx!==last){drawFrame(fr,idx);last=idx}
    gi.style.opacity=Math.max(0,Math.min(1,g));
    // the things on the table (they are behind the frames, which show the empty kitchen) stay while the camera is still standing, melt away when it starts, and fade back in while it comes back, so they do not just pop
    fr.style.opacity=back?Math.max(0,Math.min(1,f<.45?f/.45:1)):Math.max(0,Math.min(1,(e-FADE)/(ZM*.3)));       // forward: the things stay during the stop and melt away only when the camera starts to move
    if(e<total)requestAnimationFrame(step);else done();
  })(t0);
}
// ---------- the other way (for trying: add ?zoom=live to the address): the live scene itself is zoomed toward the grill, with everything that stands on the table, then the picture of the grill takes over ----------
var LIVE=/[?&]zoom=live/.test(location.search);
function liveParams(){
  var sc=scale||1,tx0=offsetX-cameraX*sc,ty0=offsetY,K=2.52,G={x:492,y:125},T={x:870,y:470};
  var p0={x:tx0+G.x*sc,y:ty0+G.y*sc},p1={x:tx0+T.x*sc,y:ty0+T.y*sc},S1=sc*K;
  return{sc:sc,tx0:tx0,ty0:ty0,G:G,p0:p0,p1:p1,S1:S1};
}
function setLive(P,u){
  var S=P.sc*Math.pow(P.S1/P.sc,u),w=(S-P.sc)/(P.S1-P.sc),px=P.p0.x+(P.p1.x-P.p0.x)*w,py=P.p0.y+(P.p1.y-P.p0.y)*w;
  var sc=document.getElementById('scene');sc.style.transform='translate('+(px-P.G.x*S)+'px,'+(py-P.G.y*S)+'px) scale('+S+')';
}
function runLive(v,back,done){
  var P=v._P,gi=v.querySelector('.gz-grill'),ZM=ZIN,total=ZM,t0=performance.now();
  var Kz=P.S1/P.sc,Tl={x:870*P.sc,y:470*P.sc};
  (function step(now){
    var e=Math.max(0,Math.min(total,now-t0)),t=Math.min(1,e/ZM),u=back?1-t*t:t*t;
    setLive(P,u);
    // the picture of the grill zooms in together with the scene: when the scene is at the zoom u, the picture is at the scale Kz^(u-1) of its final size, with its point T on the place where the scene puts the grill
    var S=P.sc*Math.pow(Kz,u),w=(S-P.sc)/(P.S1-P.sc),px=P.p0.x+(P.p1.x-P.p0.x)*w-P.tx0,py=P.p0.y+(P.p1.y-P.p0.y)*w-P.ty0,r=Math.pow(Kz,u-1);
    gi.style.transformOrigin=Tl.x+'px '+Tl.y+'px';
    gi.style.transform='translate('+(px-Tl.x)+'px,'+(py-Tl.y)+'px) scale('+r+')';
    gi.style.opacity=back?Math.max(0,Math.min(1,u/.55)):Math.max(0,Math.min(1,(u-.28)/.42));          // it melts in while both are zooming; on the way back it melts out only at the very end, so the zoom out stops exactly when the whole scene has taken over
    if(e<total)requestAnimationFrame(step);else done();
  })(t0);
}
function zoomLive(){
  var P=liveParams(),v=document.createElement('div');v.id='grillZoom';v.setAttribute('data-tool-ui','1');v._live=true;v._P=P;
  v.style.cssText='position:fixed;left:'+P.tx0+'px;top:'+P.ty0+'px;width:'+(W*P.sc)+'px;height:'+(H*P.sc)+'px;z-index:30000;overflow:hidden;cursor:default';
  var gi=document.createElement('img');gi.className='gz-grill';gi.draggable=false;gi.src=ZOOM_SRC;gi.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;opacity:0;display:block;will-change:transform,opacity';
  var back=document.createElement('button');back.type='button';back.textContent='← nazad u kuhinju';
  back.style.cssText='position:absolute;right:24px;top:72px;padding:10px 18px;font:700 16px system-ui,sans-serif;color:#fff;background:rgba(44,20,8,.92);border:2px solid #f1af33;border-radius:10px;cursor:pointer;opacity:0;transition:opacity .2s';
  v.appendChild(gi);v.appendChild(back);document.body.appendChild(v);view=v;
  ['pointerdown','pointerup','mousedown','mouseup','click','dblclick','contextmenu','wheel'].forEach(function(n){v.addEventListener(n,function(e){e.stopPropagation()})});
  back.addEventListener('click',closeGrill);v.addEventListener('click',function(){closeGrill()});
  addEventListener('keydown',onKey,true);v._busy=true;
  runLive(v,false,function(){v._busy=false;back.style.opacity='1'});
}
function closeLive(){
  var v=view;if(!v||v._busy)return;view=null;removeEventListener('keydown',onKey,true);
  var bb=v.querySelector('button');if(bb)bb.style.opacity='0';v._busy=true;
  runLive(v,true,function(){v.remove();try{applyCamera()}catch(e){}});
}
function zoomGrill(){
  if(view)return;
  if(LIVE){zoomLive();return}
  var sc=document.getElementById('scene');if(!sc)return;
  var v=document.createElement('div');v.id='grillZoom';v.setAttribute('data-tool-ui','1');
  v.style.cssText='position:absolute;left:0;top:0;width:'+W+'px;height:'+H+'px;z-index:30000;overflow:hidden;cursor:default';
  var css='position:absolute;left:0;top:0;width:100%;height:100%;display:block;user-select:none;-webkit-user-drag:none';
  var fr=document.createElement('canvas');fr.className='gz-frame';fr.width=960;fr.height=540;fr.style.cssText=css;if(zoomReady())drawFrame(fr,1);
  var gi=document.createElement('img');gi.className='gz-grill';gi.draggable=false;gi.style.cssText=css+';opacity:0';gi.src=ZOOM_SRC;
  var vg=document.createElement('div');vg.className='gz-vig';vg.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;opacity:0;background:linear-gradient(90deg,rgba(24,12,4,.94) 0%,rgba(24,12,4,.82) 7%,rgba(24,12,4,.45) 13%,rgba(24,12,4,0) 22%)';
  var back=document.createElement('button');back.type='button';back.textContent='← nazad u kuhinju';
  back.style.cssText='position:absolute;right:24px;top:72px;padding:10px 18px;font:700 16px system-ui,sans-serif;color:#fff;background:rgba(44,20,8,.92);border:2px solid #f1af33;border-radius:10px;cursor:pointer;opacity:0;transition:opacity .2s';
  v.appendChild(fr);v.appendChild(gi);v.appendChild(vg);v.appendChild(back);sc.appendChild(v);view=v;
  ['pointerdown','pointerup','mousedown','mouseup','click','dblclick','contextmenu','wheel'].forEach(function(n){v.addEventListener(n,function(e){e.stopPropagation()})});
  back.addEventListener('click',closeGrill);
  v.addEventListener('click',function(){closeGrill()});                 // a click anywhere on the zoomed picture zooms out
  addEventListener('keydown',onKey,true);
  v._busy=true;
  var go=function(){animateZoom(v,false,function(){v._busy=false;back.style.opacity='1'})};
  if(zoomReady())go();else{gi.style.opacity='1';vg.style.opacity='1';fr.style.display='none';v._busy=false;back.style.opacity='1'}   // the frames are not loaded yet: just the picture
}
function onKey(e){if(e.key==='Escape'){e.stopPropagation();closeGrill()}}
function closeGrill(){
  if(view&&view._live){closeLive();return}
  if(!view||view._busy)return;var v=view;view=null;removeEventListener('keydown',onKey,true);
  var bb=v.querySelector('button');if(bb)bb.style.opacity='0';
  if(zoomReady()&&v.querySelector('.gz-frame').style.display!=='none'){v._busy=true;animateZoom(v,true,function(){v.remove()})}else v.remove();
}
function click(h){
  if(!h)return false;
  if(h.kind==='drawer')toggle(h.key);else if(h.kind==='grill')zoomGrill();else if(h.kind==='jar'){for(var i=0;i<JARS.length;i++)if(JARS[i].id===h.id)takeJar(JARS[i])}
  return true;
}
function liveAt(u){                                              // (for testing) the live zoom frozen at the zoom u (0..1)
  if(!view){zoomLive();view._busy=true;view._frozen=true}
  var v=view,P=v._P,gi=v.querySelector('.gz-grill'),Kz=P.S1/P.sc,Tl={x:870*P.sc,y:470*P.sc};
  setLive(P,u);var S=P.sc*Math.pow(Kz,u),w=(S-P.sc)/(P.S1-P.sc),px=P.p0.x+(P.p1.x-P.p0.x)*w-P.tx0,py=P.p0.y+(P.p1.y-P.p0.y)*w-P.ty0,r=Math.pow(Kz,u-1);
  gi.style.transformOrigin=Tl.x+'px '+Tl.y+'px';gi.style.transform='translate('+(px-Tl.x)+'px,'+(py-Tl.y)+'px) scale('+r+')';gi.style.opacity=Math.max(0,Math.min(1,(u-.28)/.42));
}
window.CooksterKitchenFx={liveAt:liveAt,compose:function(src){return src},hit:hit,click:click,tryDrop:tryDrop,updateJars:updateJars,zoomGrill:zoomGrill,closeGrill:closeGrill,
  drawer:function(k){return DR[k]?DR[k].p:0},setDrawer:function(k,v){if(DR[k])setP(k,v)},isZoomed:function(){return !!view}};
})();
