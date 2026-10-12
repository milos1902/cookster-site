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
var GRILL={l:225,t:20,r:760,b:235},ZOOM_SRC='assets/grill_zoom.webp?v=1';
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
function zoomGrill(){
  if(view)return;
  var sc=document.getElementById('scene');if(!sc)return;
  var v=document.createElement('div');v.id='grillZoom';v.setAttribute('data-tool-ui','1');
  v.style.cssText='position:absolute;left:0;top:0;width:'+W+'px;height:'+H+'px;z-index:30000;overflow:hidden;background:#1a0d05;cursor:default';
  var im=document.createElement('img');im.src=ZOOM_SRC;im.draggable=false;
  im.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;display:block;user-select:none;-webkit-user-drag:none';
  var back=document.createElement('button');back.type='button';back.textContent='← nazad u kuhinju';
  back.style.cssText='position:absolute;right:24px;top:72px;padding:10px 18px;font:700 16px system-ui,sans-serif;color:#fff;background:rgba(44,20,8,.92);border:2px solid #f1af33;border-radius:10px;cursor:pointer';
  v.appendChild(im);v.appendChild(back);sc.appendChild(v);view=v;
  var from=[(GRILL.l+GRILL.r)/2-W/2,(GRILL.t+GRILL.b)/2-H/2];            // the picture starts small over the grill and grows to the whole screen
  if(v.animate)im.animate([{transform:'translate('+from[0]+'px,'+from[1]+'px) scale(.4)',opacity:.0},{opacity:1,offset:.35},{transform:'none',opacity:1}],{duration:650,easing:'cubic-bezier(.22,.72,.22,1)',fill:'both'});
  ['pointerdown','pointerup','mousedown','mouseup','click','dblclick','contextmenu','wheel'].forEach(function(n){v.addEventListener(n,function(e){e.stopPropagation()})});
  back.addEventListener('click',closeGrill);
  addEventListener('keydown',onKey,true);
}
function onKey(e){if(e.key==='Escape'){e.stopPropagation();closeGrill()}}
function closeGrill(){
  if(!view)return;var v=view;view=null;removeEventListener('keydown',onKey,true);
  var im=v.querySelector('img'),from=[(GRILL.l+GRILL.r)/2-W/2,(GRILL.t+GRILL.b)/2-H/2];
  var done=function(){v.remove()};
  if(im&&im.animate){var a=im.animate([{transform:'none',opacity:1},{opacity:.0,offset:.8},{transform:'translate('+from[0]+'px,'+from[1]+'px) scale(.4)',opacity:0}],{duration:450,easing:'ease-in',fill:'both'});a.onfinish=done}else done();
  var bb=v.querySelector('button');if(bb)bb.style.display='none';
}
function click(h){
  if(!h)return false;
  if(h.kind==='drawer')toggle(h.key);else if(h.kind==='grill')zoomGrill();else if(h.kind==='jar'){for(var i=0;i<JARS.length;i++)if(JARS[i].id===h.id)takeJar(JARS[i])}
  return true;
}
window.CooksterKitchenFx={compose:function(src){return src},hit:hit,click:click,tryDrop:tryDrop,updateJars:updateJars,zoomGrill:zoomGrill,closeGrill:closeGrill,
  drawer:function(k){return DR[k]?DR[k].p:0},setDrawer:function(k,v){if(DR[k])setP(k,v)},isZoomed:function(){return !!view}};
})();
