/* Cookster — the fixtures of the kitchen picture that can be clicked: the two drawers of the table (click = open / close) and the stone grill (click = zoom).
   The picture of the kitchen stays the same: an open drawer is a small cut-out picture (assets/drawers/*.webp) drawn over it, and the result is made once and kept
   (compose()), so the old scene backgrounds (stove states) and the occluders of the table keep working with it. */
(function(){
'use strict';
if(window.CooksterKitchenFx)return;
var W=1672,H=941;
var N=15;                                                       // the drawer is drawn in 15 steps (frames of the animation: assets/drawers/<left|right>_<1..15>.webp, 0 = closed)
var DR={
  left:{x:405,y:588,p:0,idx:0,label:'leva fioka',h0:{x:655,y:640},h1:{x:633,y:738},ims:[]},
  right:{x:818,y:599,p:0,idx:0,label:'desna fioka',h0:{x:1000,y:640},h1:{x:1013,y:764},ims:[]}
};
var GRILL={l:225,t:20,r:760,b:235},ZOOM_SRC='assets/grill_zoom.webp?v=1';
var imgs={},cache={};
function load(src,cb){var im=imgs[src];if(!im){im=imgs[src]=new Image();im.onload=function(){if(cb)cb()};im.src=src}return im}
function ready(im){return im&&im.complete&&im.naturalWidth>0}
Object.keys(DR).forEach(function(k){for(var i=1;i<=N;i++)DR[k].ims[i]=load('assets/drawers/'+k+'_'+i+'.webp?v=2')});
// the background that is really shown: the stove background with the open drawers drawn over it
// the shadow of a pulled-out drawer on the floor below it (the light comes from the window on the left, so it falls a little to the right)
function shade(g,f,t){
  g.save();g.beginPath();g.rect(0,f.yb-1,W,70);g.clip();
  g.filter='blur(8px)';g.fillStyle='rgba(38,18,6,'+(0.52*Math.pow(t,.6)).toFixed(3)+')';
  g.beginPath();g.ellipse((f.x0+f.x1)/2+22,f.yb+9,(f.x1-f.x0)/2+2,19,0,0,Math.PI*2);g.fill();
  g.restore();
}
function compose(src,again){
  var l=DR.left.idx,r=DR.right.idx;
  if(!l&&!r)return src;
  var key=src+'|'+l+'|'+r;
  if(cache[key])return cache[key];
  var b=load(src,again);
  if(!ready(b)||(l&&!ready(DR.left.ims[l]))||(r&&!ready(DR.right.ims[r]))){setTimeout(function(){if(again)again()},250);return src}
  var c=document.createElement('canvas');c.width=W;c.height=H;var g=c.getContext('2d');
  g.drawImage(b,0,0,W,H);
  if(l){g.drawImage(DR.left.ims[l],DR.left.x,DR.left.y);shade(g,{x0:485-31*l/N,x1:825-6*l/N,yb:680+93*l/N},l/N)}
  if(r){g.drawImage(DR.right.ims[r],DR.right.x,DR.right.y);shade(g,{x0:835-8*r/N,x1:1170+31*r/N,yb:680+118*r/N},r/N)}
  try{return cache[key]=c.toDataURL('image/webp',.94)}catch(e){return src}
}
function inR(p,r){return p.x>=r.l&&p.x<=r.r&&p.y>=r.t&&p.y<=r.b}
// what lies under the mouse (client coordinates); an item that stands over it has the priority
function handleAt(d,p){return{x:d.h0.x+(d.h1.x-d.h0.x)*p,y:d.h0.y+(d.h1.y-d.h0.y)*p}}
function hit(x,y){
  var p=screenToScene(x,y);
  try{if(typeof itemAt==='function'&&itemAt(x,y))return null}catch(e){}
  for(var k in DR){var d=DR[k],h=handleAt(d,d.p);if(Math.abs(p.x-h.x)<=50&&Math.abs(p.y-h.y)<=24)return{kind:'handle',key:k,label:d.label+' — drži ručicu i vuci'}}
  if(inR(p,GRILL))return{kind:'grill',label:'roštilj — klik za zumiranje'};
  return null;
}
function reapply(){if(typeof applyCookstoveState==='function')applyCookstoveState()}
function setP(k,v){
  var d=DR[k];d.p=Math.max(0,Math.min(1,v));var i=Math.round(d.p*N);
  if(i!==d.idx){d.idx=i;reapply()}
}
// ---------- the drawer is pulled with the mouse: the hand grabs the handle, the more it is pulled down the more it opens ----------
var drag=null,anim=null;
function animateTo(k,to){
  if(anim)cancelAnimationFrame(anim);var from=DR[k].p,t0=performance.now(),dur=280;
  (function step(now){var t=Math.min(1,(now-t0)/dur),e=t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;setP(k,from+(to-from)*e);if(t<1)anim=requestAnimationFrame(step);else anim=null})(t0);
}
function startDrag(k,e){
  if(anim){cancelAnimationFrame(anim);anim=null}
  var d=DR[k];drag={key:k,y0:e.clientY,p0:d.p,moved:false,travel:(d.h1.y-d.h0.y)*sceneScale()};
  setHand('grab');
  addEventListener('pointermove',onMove,true);addEventListener('pointerup',onUp,true);addEventListener('pointercancel',onUp,true);
}
function sceneScale(){try{return typeof scale==='number'&&scale>0?scale:1}catch(e){return 1}}
function onMove(e){
  if(!drag)return;
  var dy=e.clientY-drag.y0;if(Math.abs(dy)>4)drag.moved=true;
  if(drag.moved)setP(drag.key,drag.p0+dy/drag.travel);
}
function onUp(e){
  if(!drag)return;var k=drag.key,moved=drag.moved,p0=drag.p0;drag=null;
  removeEventListener('pointermove',onMove,true);removeEventListener('pointerup',onUp,true);removeEventListener('pointercancel',onUp,true);
  if(!moved)animateTo(k,p0>.5?0:1);                               // only a click on the handle: it opens completely / closes completely
  setHand(null);refreshHand(e.clientX,e.clientY);
}
// ---------- the small hand instead of the dot of the mouse ----------
var HAND='data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><g fill="#fff" stroke="#2b1708" stroke-width="1.5" stroke-linejoin="round"><rect x="9" y="6" width="3.8" height="14" rx="1.9"/><rect x="13" y="3.5" width="3.8" height="16" rx="1.9"/><rect x="17" y="4.5" width="3.8" height="15" rx="1.9"/><rect x="21" y="8" width="3.6" height="12" rx="1.8"/><path d="M9.5 18 L5.5 13.5 Q4.5 12 6.3 11.4 Q7.8 11.2 9.6 13.4 Z"/><rect x="9" y="15" width="15.6" height="12" rx="5.5"/></g></svg>');
var FIST='data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><g fill="#fff" stroke="#2b1708" stroke-width="1.5" stroke-linejoin="round"><rect x="7" y="12" width="19" height="14" rx="5.5"/><circle cx="11" cy="12.5" r="2.7"/><circle cx="15.5" cy="11.5" r="2.7"/><circle cx="20" cy="11.5" r="2.7"/><circle cx="24" cy="13" r="2.5"/><path d="M8 20 Q5 19.5 5.2 17.2 Q6.5 16.4 8.5 17.4 Z"/></g></svg>');
(function(){var st=document.createElement('style');st.textContent='#cursor.fx-hand,#cursor.fx-grab{width:30px;height:30px;border-radius:0;box-shadow:none;margin-left:-14px;margin-top:-10px;background:url("'+HAND+'") center/contain no-repeat}#cursor.fx-grab{background-image:url("'+FIST+'")}';document.head.appendChild(st)})();
var handMode=null;
function setHand(m){
  var c=document.getElementById('cursor');if(!c)return;handMode=m;
  c.classList.toggle('fx-hand',m==='hand');c.classList.toggle('fx-grab',m==='grab');
}
function refreshHand(x,y){
  if(drag||(view))return;
  var h=null;try{h=hit(x,y)}catch(e){}
  setHand(h&&h.kind==='handle'?'hand':null);
}
addEventListener('mousemove',function(e){refreshHand(e.clientX,e.clientY)},true);
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
function click(h,e){
  if(!h)return false;
  if(h.kind==='handle')startDrag(h.key,e||{clientY:mouse.y});else if(h.kind==='grill')zoomGrill();
  return true;
}
window.CooksterKitchenFx={compose:function(src){return compose(src,reapply)},hit:hit,click:click,zoomGrill:zoomGrill,closeGrill:closeGrill,
  drawer:function(k){return DR[k]?DR[k].p:0},setDrawer:function(k,v){if(DR[k])setP(k,v)},isZoomed:function(){return !!view}};
})();
