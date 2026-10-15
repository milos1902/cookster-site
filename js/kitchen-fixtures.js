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
  if(!d.idx){d.el.style.display='none';d.vis=0;return}
  // the things in the drawer (jars, tools) follow the picture that is REALLY shown: a frame is shown only when it is decoded, and then the things are redrawn with it
  var idx=d.idx,im=d.ims[idx],done=function(){
    if(d.idx!==idx)return;
    d.el.src=im.src;d.el.style.display='block';d.vis=idx;
    if(k==='left')updateJars();else updateTools();
  };
  if(im.decode)im.decode().then(done,done);else done();
}
function setP(k,v){
  var d=DR[k];d.p=Math.max(0,Math.min(1,v));var i=Math.round(d.p*d.N);
  if(i!==d.idx){d.idx=i;paint(k);if(!i){if(k==='left')updateJars();else updateTools()}}
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
  var shown=d.idx>0&&d.vis>0;
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
// ---------- the wooden spoon and the ladle lie in the right drawer (pictures, like the jars of the left drawer): the front of the drawer hides their lower part; a click on one takes the real item, and an item put down over the open drawer goes back ----------
var TOOLS=[
  {id:'kasika_mesanje',src:'assets/new_props/kasika_1.png?v=2',cx:935,cy:662,w:58,h:142,rot:90,k:.82,label:'drvena kašika'},
  {id:'kutlaca_ajvar',src:'assets/calibration_props/ajvar_jars/kutlaca_ajvar.png',cx:1075,cy:664,w:112,h:112,rot:0,k:.9,label:'drvena kutlača'}
];
var TOOL_IN={l:860,t:605,r:1165,b:712},toolClip=null;
function toolOut(t){try{
  if((window.items||items).some(function(el){return el.dataset&&el.dataset.itemId===t.id}))return true;
  if(typeof backpackContents!=='undefined'&&backpackContents.some(function(el){return el&&el.dataset&&el.dataset.itemId===t.id}))return true;
}catch(e){}return false}
function updateTools(){
  var sc=document.getElementById('scene');if(!sc)return;
  var d=DR.right,t=d.idx>=d.N?1:gOf(d),shown=d.idx>0&&d.vis>0,frontTop=605+107*t;
  if(!toolClip||!toolClip.isConnected){toolClip=document.createElement('div');toolClip.style.cssText='position:absolute;z-index:27;pointer-events:none;overflow:hidden;left:840px;top:603px;width:330px;height:0px';sc.appendChild(toolClip)}
  var L=Math.round(d.x0+d.dx0*t)+8,R=Math.round(d.x1+d.dx1*t)-8;
  toolClip.style.left=L+'px';toolClip.style.width=Math.max(0,R-L)+'px';toolClip.style.height=Math.max(0,Math.round(frontTop-603))+'px';toolClip.style.display=shown?'block':'none';
  TOOLS.forEach(function(o){
    if(!o.el||!o.el.isConnected){o.el=document.createElement('img');o.el.draggable=false;o.el.src=o.src;o.el.style.cssText='position:absolute;pointer-events:none;display:none;filter:drop-shadow(2px 3px 2px rgba(20,8,0,.45))';toolClip.appendChild(o.el)}
    var show=shown&&!toolOut(o);
    if(show){
      var w=o.w*o.k,h=o.h*o.k,y=o.cy-107*(1-t);
      o.el.style.width=w+'px';o.el.style.height=h+'px';
      o.el.style.left=Math.round(o.cx-w/2-L)+'px';o.el.style.top=Math.round(y-h/2-603)+'px';
      o.el.style.transform='rotate('+o.rot+'deg)';
    }
    o.el.style.display=show?'block':'none';
  });
}
setInterval(updateTools,150);
function toolBox(o){var w=o.rot?o.h*o.k:o.w*o.k,h=o.rot?o.w*o.k:o.h*o.k;return{l:o.cx-w/2,r:o.cx+w/2,t:o.cy-h/2,b:Math.min(o.cy+h/2,TOOL_IN.b)}}
function toolAt(p){
  if(DR.right.idx!==DR.right.N)return null;
  for(var i=0;i<TOOLS.length;i++){var o=TOOLS[i];if(!toolOut(o)&&inR(p,toolBox(o)))return o}
  return null;
}
function takeTool(o){
  try{
    var def=null;(CooksterCatalog.ITEMS||[]).forEach(function(d){if(d.id===o.id)def=d});
    var sp=screenToScene(mouse.x,mouse.y);if(!def||toolOut(o))return;
    var el=makeItem(Object.assign({},def,{instanceId:nextItemInstanceId(o.id),x:sp.x-def.w/2,y:sp.y-def.h,z:++zCounter}));
    if(!el)return;el.dataset.surfaceZone='table';
    setPose(el,sp.x,sp.y,surfaceScaleFor(el,'table',sp.y));
    startHolding(el);updateTools();
    try{CooksterSave.schedule()}catch(e){}
  }catch(e){}
}
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
    if(item&&item.dataset&&DR.right.idx===DR.right.N){
      var to=null;TOOLS.forEach(function(o){if(o.id===item.dataset.itemId)to=o});
      if(to&&inR(screenToScene(mouse.x,mouse.y),TOOL_IN)){
        removeItem(item);holding=null;
        try{hidePlacementGhost();hideOriginGhost();clearPanTargets();updateHover()}catch(e){}
        updateTools();try{showToast(to.label+' je u fioci.')}catch(e){}try{CooksterSave.schedule()}catch(e){}
        return true;
      }
    }
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
  var tl=toolAt(p);if(tl)return{kind:'tool',id:tl.id,label:tl.label+' — klik da uzmeš'};
  for(var k in DR){var d=DR[k],t=Math.min(1,gOf(d));
    if(inR(p,{l:d.x0+d.dx0*t,r:d.x1+d.dx1*t,t:603,b:680+d.dy*t+4}))return{kind:'drawer',key:k,label:d.label+(d.to?' — klik za zatvaranje':' — klik za otvaranje')}}
  if(inR(p,GRILL))return{kind:'grill',label:'roštilj — klik za zumiranje'};
  if(inR(p,DOOR)){try{doorFilm();if(!warmed&&window.CooksterTavern&&window.CooksterTavern.preload){warmed=true;window.CooksterTavern.preload()}}catch(e){}return{kind:'door',label:'kafana — klik za ulazak'}}      // the pictures of the tavern are fetched as soon as the mouse comes to the doors
  return null;
}
// ---------- the saloon doors (the way to the tavern): the camera zooms into them, the screen goes dark, and the tavern lights up ----------
var warmed=false;
var DOOR={l:795,t:5,r:1145,b:145};
// the camera zooms from the first picture of the kitchen into the saloon doors (the same live zoom as to the grill: the whole scene, with everything on it, is zoomed), the doors swing open (the film frames
// of the waiter's entrance, which zoom together with the scene), and behind them the picture of the tavern appears and grows with soft edges until it fills the screen: one zoom follows the other.
// The way back is the same thing the other way round: the tavern shrinks into the doorway, the camera zooms out of the doors, which close.
var view=null;
function DZf(){return 620*(window.__dzMul||1)}      // (the length of the zoom can be stretched for testing: window.__dzMul)
var ZIN=330;                                                       // (the length of the zoom to the grill, ms)
var DZ=620;                                                        // the length of the zoom (ms), about the same as the zoom to the grill
function doorGeom(){
  var sc=scale||1,tx0=offsetX-cameraX*sc,ty0=offsetY,K=3.3,G={x:970,y:75},S1=sc*K;
  // the doors end in the middle (left-right) and so high that the top of the kitchen picture lies on the top of the screen (no empty strip above it)
  return{sc:sc,G:G,S1:S1,p0:{x:tx0+G.x*sc,y:ty0+G.y*sc},p1:{x:innerWidth/2,y:G.y*S1}};
}
function doorFrame(g,scn,S){var w=(S-g.sc)/(g.S1-g.sc),px=g.p0.x+(g.p1.x-g.p0.x)*w,py=g.p0.y+(g.p1.y-g.p0.y)*w;scn.style.transform='translate('+(px-g.G.x*S)+'px,'+(py-g.G.y*S)+'px) scale('+S+')';return{x:px,y:py}}
function ease(u){return u*u*(3-2*u)}
function lerp(a,b,k){return a+(b-a)*k}
// the picture of the tavern grows out of the doorway: p 0..1 (small and soft in the doorway → the whole screen)
function tavernAt(room,c,p){
  var e=Math.pow(p,1.5),W=innerWidth,H=innerHeight;
  room.style.transformOrigin='50% 50%';
  room.style.transform='translate('+((c.x-W/2)*(1-e))+'px,'+((c.y-H/2)*(1-e))+'px) scale('+lerp(.16,1,e)+')';
  room.style.opacity=String(Math.min(1,e*2.2));      // it comes out of nothing (no frame of it before the zoom has started)
  var inner=lerp(4,146,e),outer=inner+lerp(40,8,e),m='radial-gradient(ellipse closest-side at 50% 50%,#000 '+inner+'%,rgba(0,0,0,0) '+outer+'%)';
  room.style.webkitMaskImage=m;room.style.maskImage=m;
}
function tavernClear(room){room.style.transform='';room.style.transformOrigin='';room.style.opacity='';room.style.webkitMaskImage='';room.style.maskImage='';room.style.willChange=''}
function zoomDoor(){
  if(view||(window.CooksterTavern&&(window.CooksterTavern.busy||window.CooksterTavern.isOpen)))return;
  try{if(typeof holding!=='undefined'&&holding){showToast('Prvo spusti predmet iz ruke.');return}}catch(e){}
  var scn=document.getElementById('scene'),vp=document.getElementById('viewport'),room=document.getElementById('tavernScene'),T=window.CooksterTavern;if(!scn||!room||!T)return;
  var DZ_=DZf(),g=doorGeom();view={_busy:true,remove:function(){}};
  scn.style.transition='none';scn.style.willChange='transform';
  try{if(T.preload)T.preload()}catch(e){}
  swingDoors(DZ_+300);
  var t0=performance.now(),opened=false,ready=false;
  (function step(now){
    var el=now-t0,u=Math.min(1,el/DZ_),S=g.sc*Math.pow(g.S1/g.sc,ease(u)),c=doorFrame(g,scn,S);
    if(!opened&&el>=DZ_*.3){opened=true;room.style.visibility='hidden';Promise.resolve(T.open({instant:true})).then(function(){try{vp.style.visibility='visible'}catch(e2){}room.style.willChange='transform,opacity';ready=true},function(){ready=true})}      // the tavern is opened behind the doors, the kitchen stays on the screen under it
    if(ready){tavernAt(room,c,ease(Math.min(1,Math.max(0,(el-DZ_*.3)/(DZ_*.7)))));if(room.style.visibility)room.style.visibility=''}
    if(u<1||!ready){requestAnimationFrame(step);return}
    tavernClear(room);room.style.visibility='';try{vp.style.visibility='hidden'}catch(e3){}
    try{applyCamera()}catch(e4){}scn.style.willChange='';requestAnimationFrame(function(){scn.style.transition=''});
    view=null;
  })(t0);
}
var leaving=false;
function leaveTavern(restore){
  if(leaving)return Promise.resolve(false);leaving=true;
  var scn=document.getElementById('scene'),vp=document.getElementById('viewport'),room=document.getElementById('tavernScene');
  if(!scn||!room){leaving=false;return Promise.resolve(restore())}
  var DZ_=DZf(),g=doorGeom();
  scn.style.transition='none';scn.style.willChange='transform';doorFrame(g,scn,g.S1);
  try{vp.style.visibility='visible'}catch(e){}room.style.willChange='transform,opacity';
  swingDoors(DZ_+300,.3);                                               // the doors are open and close while the camera zooms out
  return new Promise(function(done){
    var t0=performance.now();
    (function step(now){
      var u=Math.min(1,(now-t0)/DZ_),S=g.S1*Math.pow(g.sc/g.S1,ease(u)),c=doorFrame(g,scn,S);
      tavernAt(room,c,1-ease(Math.min(1,u*1.15)));                     // the tavern shrinks into the doorway
      if(u<1){requestAnimationFrame(step);return}
      tavernClear(room);
      Promise.resolve(restore()).then(function(){},function(){}).then(function(){
        try{applyCamera()}catch(e4){}scn.style.willChange='';requestAnimationFrame(function(){scn.style.transition=''});
        leaving=false;done(true);
      });
    })(t0);
  });
}
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
    var gx=v.querySelector('.gz-fx');if(gx){gx.style.transformOrigin=Tl.x+'px '+Tl.y+'px';gx.style.transform=gi.style.transform;gx.style.opacity=gi.style.opacity;gx.style.webkitMaskImage=mk;gx.style.maskImage=mk;gx.style.webkitMaskComposite='source-in';gx.style.maskComposite='intersect';}
    var sg=v.querySelector('.gz-signs');if(sg){sg.style.transformOrigin=Tl.x+'px '+Tl.y+'px';sg.style.transform=gi.style.transform;sg.style.opacity=gi.style.opacity;}   // the signs of the grill zoom with its picture
    if(e<total)requestAnimationFrame(step);else done();
  })(t0);
}
function zoomLive(){
  var scn=document.getElementById('scene');if(scn){scn.style.transition='none';scn.style.willChange='transform'}
  var P=liveParams(),v=document.createElement('div');v.id='grillZoom';v.setAttribute('data-tool-ui','1');v._live=true;v._P=P;
  v.style.cssText='position:fixed;left:'+P.tx0+'px;top:'+P.ty0+'px;width:'+(W*P.sc)+'px;height:'+(H*P.sc)+'px;z-index:30000;overflow:hidden;cursor:default';
  var gi=document.createElement('img');gi.className='gz-grill';gi.draggable=false;gi.src=(window.CooksterGrill&&CooksterGrill.zoomSrc)?CooksterGrill.zoomSrc(CooksterGrill.lit()||CooksterGrill.left()>0):ZOOM_SRC;gi.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;opacity:0;display:block;will-change:transform,opacity';
  var back=document.createElement('button');back.type='button';back.textContent='← nazad u kuhinju';
  back.style.cssText='position:absolute;right:24px;top:72px;padding:10px 18px;font:700 16px system-ui,sans-serif;color:#fff;background:rgba(44,20,8,.92);border:2px solid #f1af33;border-radius:10px;cursor:pointer;opacity:0;transition:opacity .2s';
  var sgh=document.createElement('div');sgh.className='sign-host gz-signs';sgh.style.cssText='left:0;top:0;width:100%;height:100%;will-change:transform,opacity;opacity:0';
  v.appendChild(gi);var gfx=null;try{gfx=window.CooksterGrill&&CooksterGrill.zoomCanvas();}catch(e){}if(gfx)v.appendChild(gfx);v.appendChild(sgh);v.appendChild(back);document.body.appendChild(v);view=v;try{window.CooksterSignposts&&CooksterSignposts.sweep()}catch(e){}
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
  if(h.kind==='drawer')toggle(h.key);else if(h.kind==='grill')zoomGrill();else if(h.kind==='door')zoomDoor();else if(h.kind==='tool'){for(var ti=0;ti<TOOLS.length;ti++)if(TOOLS[ti].id===h.id)takeTool(TOOLS[ti])}else if(h.kind==='jar'){for(var i=0;i<JARS.length;i++)if(JARS[i].id===h.id)takeJar(JARS[i])}
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
// the film of the doors (60 frames, assets/doors3, cut from the video of the whole kitchen: 440x250 at 745,0, so the open leaves are seen whole, down to the floor in front of the table).
// It is used by the camera zoom through the doors and by the waiter. Timeline of the frames (1..60): 7-15 the doors open, 15-33 wide open, 34-45 they close, 46- closed
var DOORS_FILM={x:745,y:0,w:440,h:250};
function doorFilm(){
  if(dImgs)return dImgs;dImgs=[];
  for(var i=1;i<=60;i++){(function(i){var m=new Image(),t=0;m.onerror=function(){if(++t<4)setTimeout(function(){m.src='assets/doors3/z_'+i+'.webp?v=1&r='+t},300*t)};m.src='assets/doors3/z_'+i+'.webp?v=1';dImgs.push(m)})(i)}
  return dImgs;
}
function swingDoors(dur,from){
  var sc=document.getElementById('scene');if(!sc||dBusy)return;dBusy=true;
  var G=DOORS_FILM,imgs=doorFilm();
  if(!dEl||!dEl.isConnected){dEl=document.createElement('img');dEl.draggable=false;dEl.style.cssText='position:absolute;z-index:26;pointer-events:none;display:none;left:'+G.x+'px;top:'+G.y+'px;width:'+G.w+'px;height:'+G.h+'px';sc.appendChild(dEl)}
  dEl.style.display='none';
  var t0=performance.now(),DUR=dur||1300,last=-1;
  var f0=Math.max(0,Math.min(.95,from||0));      // from: the part of the film where it starts (0.3: the doors are already wide open)
  (function f(now){var k=Math.max(0,Math.min(59,Math.floor((f0+(1-f0)*Math.max(0,Math.min(1,(now-t0)/DUR)))*60)));      // (the frame time of requestAnimationFrame can be a little before t0: without the max(0) k was -1, the loop crashed and the doors never opened again)
    if(k!==last&&imgs[k]&&imgs[k].complete&&imgs[k].naturalWidth){dEl.src=imgs[k].src;dEl.style.display='';last=k}
    if(now-t0<DUR)requestAnimationFrame(f);else{dEl.style.display='none';dBusy=false}})(t0);
}
window.CooksterKitchenFx={leaveTavern:leaveTavern,swingDoors:swingDoors,liveAt:liveAt,compose:function(src){return src},hit:hit,click:click,tryDrop:tryDrop,updateJars:updateJars,updateTools:updateTools,zoomGrill:zoomGrill,closeGrill:closeGrill,
  drawer:function(k){return DR[k]?DR[k].p:0},setDrawer:function(k,v){if(DR[k])setP(k,v)},isZoomed:function(){return !!view},zoomDoor:zoomDoor};
})();
