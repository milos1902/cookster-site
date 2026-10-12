/* Cookster — the fixtures of the kitchen picture that can be clicked: the two drawers of the table (click = the drawer opens / closes in 0.3 s) and the stone grill (click = zoom).
   The kitchen picture itself does not change: an open drawer is a small cut-out picture (a frame of the Higgsfield video, with its shadow on the floor; assets/drawers/*.webp)
   that is shown over it, (20 steps from closed to open. */
(function(){
'use strict';
if(window.CooksterKitchenFx)return;
var W=1672,H=941;
var N=15;                                                       // the drawer is drawn in (20 steps (frames of the animation: assets/drawers/<left|right>_<1..15>.webp, 0 = closed)
var DR={
  left:{x:380,y:585,p:0,idx:0,to:0,label:'leva fioka',x0:485,x1:825,dx0:-31,dx1:-6,dy:108,el:null,ims:[]},
  right:{x:828,y:585,p:0,idx:0,to:0,label:'desna fioka',x0:835,x1:1170,dx0:-8,dx1:31,dy:118,el:null,ims:[]}
};
var GRILL={l:225,t:20,r:760,b:235},ZOOM_SRC='assets/grill_zoom.webp?v=1';
var imgs={};
function load(src){var im=imgs[src];if(!im){im=imgs[src]=new Image();im.src=src}return im}
Object.keys(DR).forEach(function(k){for(var i=1;i<=N;i++)DR[k].ims[i]=load('assets/drawers/'+k+'_'+i+'.webp?v=9')});
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
    var d=DR[k];if(!d.idx)return;var t=d.idx/N,yb=680+d.dy*t,x0=d.x0+d.dx0*t,x1=d.x1+d.dx1*t;
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
  var d=DR[k];d.p=Math.max(0,Math.min(1,v));var i=Math.round(d.p*N);
  if(i!==d.idx){d.idx=i;paint(k)}
}
// a click on the drawer: it opens (or closes) in 0.3 s
function toggle(k){
  var d=DR[k];d.to=d.to?0:1;
  var from=d.p,to=d.to,t0=performance.now(),dur=300,token=d.tok=(d.tok||0)+1;
  (function step(now){
    if(d.tok!==token)return;
    var t=Math.min(1,((now||performance.now())-t0)/dur),e=t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
    setP(k,from+(to-from)*e);if(t<1)requestAnimationFrame(step);
  })(t0);
}
function inR(p,r){return p.x>=r.l&&p.x<=r.r&&p.y>=r.t&&p.y<=r.b}
// what lies under the mouse (client coordinates); an item that stands over it has the priority
function hit(x,y){
  var p=screenToScene(x,y);
  try{if(typeof itemAt==='function'&&itemAt(x,y))return null}catch(e){}
  for(var k in DR){var d=DR[k],t=d.p;
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
  if(h.kind==='drawer')toggle(h.key);else if(h.kind==='grill')zoomGrill();
  return true;
}
window.CooksterKitchenFx={compose:function(src){return src},hit:hit,click:click,zoomGrill:zoomGrill,closeGrill:closeGrill,
  drawer:function(k){return DR[k]?DR[k].p:0},setDrawer:function(k,v){if(DR[k])setP(k,v)},isZoomed:function(){return !!view}};
})();
