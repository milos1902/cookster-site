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
  if(inR(p,DOOR)){try{if(!warmed&&window.CooksterTavern&&window.CooksterTavern.preload){warmed=true;window.CooksterTavern.preload()}}catch(e){}return{kind:'door',label:'kafana — klik za ulazak'}}      // the pictures of the tavern are fetched as soon as the mouse comes to the doors
  return null;
}
// ---------- the saloon doors (the way to the tavern): the camera zooms into them, the screen goes dark, and the tavern lights up ----------
var warmed=false;
var DOOR={l:795,t:5,r:1145,b:145};
try{setTimeout(function(){var pv=document.createElement('video');pv.preload='auto';pv.muted=true;pv.src='assets/doors/dolazak.mp4?v=1'},4000)}catch(e){}      // the film of the doors is fetched in good time
function zoomDoor(){
  if(view||(window.CooksterTavern&&(window.CooksterTavern.busy||window.CooksterTavern.isOpen)))return;
  try{if(typeof holding!=='undefined'&&holding){showToast('Prvo spusti predmet iz ruke.');return}}catch(e){}
  // a click on the doors: the film of the zoomed doors (assets/doors/dolazak.mp4) starts at once; while the doors swing open the picture zooms into the dark behind them,
  // the screen is black for half a second, and the tavern lights up (the camera flies out of the doors like a drone)
  var dark=document.createElement('div');dark.setAttribute('data-tool-ui','1');
  dark.style.cssText='position:fixed;left:0;top:0;width:100%;height:100%;z-index:30000;background:#0b0502;opacity:0;pointer-events:all';
  var vo=document.createElement('div');vo.setAttribute('data-tool-ui','1');
  vo.style.cssText='position:fixed;left:0;top:0;width:100%;height:100%;z-index:29990;pointer-events:all;overflow:hidden;background:transparent';
  [dark,vo].forEach(function(el){['pointerdown','pointerup','mousedown','mouseup','click','dblclick','contextmenu','wheel'].forEach(function(n){el.addEventListener(n,function(ev){ev.stopPropagation()})})});
  var vid=document.createElement('video');vid.muted=true;vid.playsInline=true;vid.preload='auto';vid.setAttribute('playsinline','');
  vid.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .12s ease;transform-origin:50% 36.7%;will-change:transform';
  var vok=true;vid.onerror=function(){vok=false};vid.src='assets/doors/dolazak.mp4?v=1';
  vo.appendChild(vid);document.body.appendChild(vo);document.body.appendChild(dark);view={_busy:true,remove:function(){}};
  var T=window.CooksterTavern,PLAY=950,ZM=380;      // first the doors swing open (PLAY), then a sudden zoom through them (ZM); the tavern starts to show up from the centre while the zoom ends
  try{if(T&&T.preload)T.preload()}catch(e){}                  // the pictures of the tavern are fetched while the film runs
  // the tavern grows out of the middle of the dark: a small picture with soft (faded) edges in the centre, which grows to the whole screen
  var reveal=function(){
    var room=document.getElementById('tavernScene');
    if(!room){vo.remove();view=null;dark.remove();return}
    var oz=room.style.zIndex;room.style.zIndex='30001';room.style.willChange='transform,opacity';
    var DUR=1150,t0=performance.now();
    (function step(now){
      var t=Math.min(1,(now-t0)/DUR),e=t<.51?.22*(t/.51):.22+.78*(1-Math.pow(1-(t-.51)/.49,3));       // slowly at first (behind the opening doors), faster when the zoom goes through them
      var sc=.2+.8*e,inner=lerp(4,146,e),outer=inner+lerp(40,8,e);
      room.style.transform='scale('+sc+')';room.style.transformOrigin='50% 42%';
      room.style.opacity=String(Math.min(1,.35+e*1.4));
      var m='radial-gradient(ellipse closest-side at 50% 42%,#000 '+inner+'%,rgba(0,0,0,0) '+outer+'%)';
      room.style.webkitMaskImage=m;room.style.maskImage=m;
      if(t<1){requestAnimationFrame(step);return}
      room.style.transform='';room.style.transformOrigin='';room.style.opacity='';room.style.webkitMaskImage='';room.style.maskImage='';room.style.willChange='';room.style.zIndex=oz;
      dark.remove();vo.remove();view=null;
    })(t0);
    function lerp(a2,b2,k2){return a2+(b2-a2)*k2}
  };
  var go=function(){
    var started=false,opened=false;
    function run(){
      if(started)return;started=true;
      if(vok){try{vid.currentTime=0;var pr=vid.play();if(pr&&pr.catch)pr.catch(function(){vok=false})}catch(e3){vok=false}}
      if(vok)vid.style.opacity='1';
      var t0=performance.now();
      (function step(now){
        var el=now-t0,k=Math.max(0,Math.min(1,(el-PLAY)/ZM));
        if(vok)vid.style.transform='scale('+(1+8*Math.pow(k,2.4))+')';        // a sudden zoom into the dark behind the open doors
        dark.style.opacity=vok?(k>.5?(k-.5)/.5:0):Math.min(1,el/(PLAY*.5));       // (without the film the screen just goes dark)
        if(!opened&&el>=300){opened=true;      // the tavern begins to appear behind the doors while they are only starting to open
          Promise.resolve(T&&T.open?T.open({instant:true}):false).then(reveal,reveal);
        }
        if(k<1||!opened)requestAnimationFrame(step);
      })(t0);
    }
    if(vid.readyState>=3)run();else{vid.oncanplay=run;setTimeout(function(){if(!started){vok=false;run()}},900)}
  };
  go();
}
// ---------- the grill: the camera comes close ----------
var view=null;
var ZIN=330;                                  // the length of the zoom (ms)
var zoomImg=new Image();zoomImg.src=ZOOM_SRC;if(zoomImg.decode)zoomImg.decode().catch(function(){});
// ---------- the zoom into the grill: the live scene itself is zoomed toward the grill, with everything that stands on the table, then the picture of the grill takes over ----------
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
    var e=Math.max(0,Math.min(total,now-t0)),t=Math.min(1,e/ZM),u;
    // going in: slow start, fast end. Going out the same shape, but measured in the size of the picture (not in its logarithm): otherwise the last part of the zoom out crawls (a small change of the size) and it seems longer than the zoom in
    if(!back)u=t*t;else{var wb=1-t*t;u=Math.log(1+wb*(Kz-1))/Math.log(Kz)}
    setLive(P,u);
    // the picture of the grill zooms in together with the scene: when the scene is at the zoom u, the picture is at the scale Kz^(u-1) of its final size, with its point T on the place where the scene puts the grill
    var S=P.sc*Math.pow(Kz,u),w=(S-P.sc)/(P.S1-P.sc),px=P.p0.x+(P.p1.x-P.p0.x)*w-P.tx0,py=P.p0.y+(P.p1.y-P.p0.y)*w-P.ty0,r=Math.pow(Kz,u-1);
    gi.style.transformOrigin=Tl.x+'px '+Tl.y+'px';
    gi.style.transform='translate('+(px-Tl.x)+'px,'+(py-Tl.y)+'px) scale('+r+')';
    var fw=Math.max(0,Math.round(150*(1-Math.min(1,u/.97)))),mk='linear-gradient(90deg,transparent 0,#000 '+fw+'px,#000 calc(100% - '+fw+'px),transparent 100%),linear-gradient(180deg,transparent 0,#000 '+fw+'px,#000 calc(100% - '+fw+'px),transparent 100%)';
    gi.style.webkitMaskImage=mk;gi.style.maskImage=mk;gi.style.webkitMaskComposite='source-in';gi.style.maskComposite='intersect';
    gi.style.opacity=back?Math.max(0,Math.min(1,u/.55)):Math.max(0,Math.min(1,(u-.28)/.42));          // it melts in while both are zooming; on the way back it melts out only at the very end, so the zoom out stops exactly when the whole scene has taken over
    if(e<total)requestAnimationFrame(step);else done();
  })(t0);
}
function zoomLive(){
  var scn=document.getElementById('scene');if(scn){scn.style.transition='none';scn.style.willChange='transform'}
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
  runLive(v,true,function(){v.remove();var scn=document.getElementById('scene');try{applyCamera()}catch(e){}if(scn){scn.style.willChange='';requestAnimationFrame(function(){scn.style.transition=''})}});
}
function zoomGrill(){
  if(view)return;
  zoomLive();
}
function onKey(e){if(e.key==='Escape'){e.stopPropagation();closeGrill()}}
function closeGrill(){
  if(view&&view._live)closeLive();
}
function click(h){
  if(!h)return false;
  if(h.kind==='drawer')toggle(h.key);else if(h.kind==='grill')zoomGrill();else if(h.kind==='door')zoomDoor();else if(h.kind==='jar'){for(var i=0;i<JARS.length;i++)if(JARS[i].id===h.id)takeJar(JARS[i])}
  return true;
}
function liveAt(u){                                              // (for testing) the live zoom frozen at the zoom u (0..1)
  if(!view){zoomLive();view._busy=true;view._frozen=true}
  var v=view,P=v._P,gi=v.querySelector('.gz-grill'),Kz=P.S1/P.sc,Tl={x:870*P.sc,y:470*P.sc};
  setLive(P,u);var S=P.sc*Math.pow(Kz,u),w=(S-P.sc)/(P.S1-P.sc),px=P.p0.x+(P.p1.x-P.p0.x)*w-P.tx0,py=P.p0.y+(P.p1.y-P.p0.y)*w-P.ty0,r=Math.pow(Kz,u-1);
  gi.style.transformOrigin=Tl.x+'px '+Tl.y+'px';gi.style.transform='translate('+(px-Tl.x)+'px,'+(py-Tl.y)+'px) scale('+r+')';gi.style.opacity=Math.max(0,Math.min(1,(u-.28)/.42));
}
// ---------- the saloon doors swing when the waiter comes in: only the door frames (cut out of the video) over the untouched kitchen ----------
var dEl=null,dBusy=false,dImgs=null;
function swingDoors(dur){
  var sc=document.getElementById('scene');if(!sc||dBusy)return;dBusy=true;
  if(!dImgs){dImgs=[];for(var i=1;i<=60;i++){(function(i){var m=new Image(),t=0;m.onerror=function(){if(++t<4)setTimeout(function(){m.src='assets/doors/d_'+i+'.webp?v=1&r='+t},300*t)};m.src='assets/doors/d_'+i+'.webp?v=1';dImgs.push(m)})(i)}}
  if(!dEl||!dEl.isConnected){dEl=document.createElement('img');dEl.draggable=false;dEl.style.cssText='position:absolute;left:765px;top:0;width:400px;height:185px;z-index:26;pointer-events:none;display:none';sc.appendChild(dEl)}
  var t0=performance.now(),DUR=dur||1300,last=-1;
  (function f(now){var k=Math.min(59,Math.floor((now-t0)/DUR*60));
    if(k!==last&&dImgs[k].complete&&dImgs[k].naturalWidth){dEl.src=dImgs[k].src;dEl.style.display='';last=k}
    if(now-t0<DUR)requestAnimationFrame(f);else{dEl.style.display='none';dBusy=false}})(t0);
}
// ---------- from the tavern back into the kitchen: the tavern shrinks into the dark (soft edges), the film zooms out of the dark, the doors close, and the picture turns into the kitchen ----------
var leaving=false;
function leaveTavern(restore){
  if(leaving)return Promise.resolve(false);leaving=true;
  var scn=document.getElementById('scene'),room=document.getElementById('tavernScene');
  if(!room){leaving=false;return Promise.resolve(restore())}
  var sc=scale||1,tx0=offsetX-cameraX*sc,ty0=offsetY,K=3.3,G={x:970,y:75},S1=sc*K;
  var p0={x:tx0+G.x*sc,y:ty0+G.y*sc},p1={x:innerWidth/2,y:G.y*S1},dy=p1.y-.367*innerHeight;
  var dark=document.createElement('div');dark.setAttribute('data-tool-ui','1');
  dark.style.cssText='position:fixed;left:0;top:0;width:100%;height:100%;z-index:29980;background:#0b0502;opacity:1;pointer-events:all';
  var vo=document.createElement('div');vo.setAttribute('data-tool-ui','1');
  vo.style.cssText='position:fixed;left:0;top:0;width:100%;height:100%;z-index:29990;pointer-events:all;overflow:hidden;background:transparent';
  [dark,vo].forEach(function(el){['pointerdown','pointerup','mousedown','mouseup','click','dblclick','contextmenu','wheel'].forEach(function(n){el.addEventListener(n,function(ev){ev.stopPropagation()})})});
  var vid=document.createElement('video');vid.muted=true;vid.playsInline=true;vid.preload='auto';vid.setAttribute('playsinline','');
  var tf=function(q){return 'translateY('+dy+'px) scale('+(1.16*(1+8*q))+')'};      // q=1: deep in the dark, q=0: the doors as in the kitchen
  vid.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover;opacity:0;transform-origin:50% 36.7%;will-change:transform;transform:'+tf(1);
  var vok=true;vid.onerror=function(){vok=false};vid.src='assets/doors/odlazak.mp4?v=1';
  vo.appendChild(vid);document.body.appendChild(vo);document.body.appendChild(dark);
  var oz=room.style.zIndex;room.style.zIndex='30001';room.style.willChange='transform,opacity';
  function lerp(a,b,k){return a+(b-a)*k}
  function wt(ms){return new Promise(function(r){setTimeout(r,ms)})}
  function put(S){var w=(S-sc)/(S1-sc),px=p0.x+(p1.x-p0.x)*w,py=p0.y+(p1.y-p0.y)*w;scn.style.transform='translate('+(px-G.x*S)+'px,'+(py-G.y*S)+'px) scale('+S+')'}
  var A=650,B=420,started=false,restored=false,played=false;
  return new Promise(function(done){
    var t0=performance.now();
    (function step(now){
      var el=now-t0,t=Math.min(1,el/A),e=1-Math.pow(1-t,3),r=1-e;                    // r: 1 → 0, the tavern shrinks
      room.style.transformOrigin='50% 42%';room.style.transform='scale('+(.2+.8*r)+')';room.style.opacity=String(Math.min(1,.35+r*1.4));
      var inner=lerp(4,146,r),outer=inner+lerp(8,40,r),m='radial-gradient(ellipse closest-side at 50% 42%,#000 '+inner+'%,rgba(0,0,0,0) '+outer+'%)';
      room.style.webkitMaskImage=m;room.style.maskImage=m;
      if(vok&&el>A*.25)vid.style.opacity=String(Math.min(1,(el-A*.25)/(A*.4)));       // the dark of the film shows behind the shrinking tavern
      // the zoom out of the film starts while the tavern is already small
      if(vok&&el>A*.55){
        if(!played){played=true;try{vid.currentTime=0;var pr=vid.play();if(pr&&pr.catch)pr.catch(function(){vok=false})}catch(e3){vok=false}}
        var k=Math.min(1,(el-A*.55)/B);vid.style.transform=tf(Math.pow(1-k,2.4));
      }
      if(t<1){requestAnimationFrame(step);return}
      room.style.transform='';room.style.transformOrigin='';room.style.opacity='';room.style.webkitMaskImage='';room.style.maskImage='';room.style.willChange='';room.style.zIndex=oz;
      Promise.resolve(restore()).then(function(){},function(){}).then(function(){
        // the film plays on (the doors close) until it ends; then the picture turns into the kitchen
        return vok?wt(Math.max(200,1100-(performance.now()-t0-A*.55))+80):wt(150);
      }).then(function(){
        try{vid.pause()}catch(e4){}
        if(!scn){vo.remove();dark.remove();leaving=false;done(true);return}
        scn.style.transition='none';scn.style.willChange='transform';put(S1);
        vo.style.transition='opacity .25s ease';dark.style.transition='opacity .25s ease';vo.style.opacity='0';dark.style.opacity='0';
        var z0=performance.now(),D=950;
        (function zs(now2){
          var u=Math.min(1,Math.max(0,(now2-z0-120)/D)),eu=1-Math.pow(1-u,3);
          put(S1*Math.pow(sc/S1,eu));
          if(u<1){requestAnimationFrame(zs);return}
          try{applyCamera()}catch(e5){}scn.style.willChange='';requestAnimationFrame(function(){scn.style.transition=''});
          vo.remove();dark.remove();leaving=false;done(true);
        })(z0);
      });
    })(t0);
  });
}
window.CooksterKitchenFx={leaveTavern:leaveTavern,swingDoors:swingDoors,liveAt:liveAt,compose:function(src){return src},hit:hit,click:click,tryDrop:tryDrop,updateJars:updateJars,zoomGrill:zoomGrill,closeGrill:closeGrill,
  drawer:function(k){return DR[k]?DR[k].p:0},setDrawer:function(k,v){if(DR[k])setP(k,v)},isZoomed:function(){return !!view}};
})();
