/* Cookster — the fixtures of the kitchen picture that can be clicked: the two drawers of the table (click = open / close) and the stone grill (click = zoom).
   The picture of the kitchen stays the same: an open drawer is a small cut-out picture (assets/drawers/*.webp) drawn over it, and the result is made once and kept
   (compose()), so the old scene backgrounds (stove states) and the occluders of the table keep working with it. */
(function(){
'use strict';
if(window.CooksterKitchenFx)return;
var W=1672,H=941;
var DR={
  left:{src:'assets/drawers/left_open.webp?v=1',x:405,y:588,open:false,label:'leva fioka',closed:{l:485,t:605,r:825,b:680},openR:{l:440,t:598,r:825,b:775}},
  right:{src:'assets/drawers/right_open.webp?v=1',x:818,y:599,open:false,label:'desna fioka',closed:{l:835,t:605,r:1170,b:680},openR:{l:828,t:598,r:1200,b:800}}
};
var GRILL={l:225,t:20,r:760,b:235},ZOOM_SRC='assets/grill_zoom.webp?v=1';
var imgs={},cache={};
function load(src,cb){var im=imgs[src];if(!im){im=imgs[src]=new Image();im.onload=function(){if(cb)cb()};im.src=src}return im}
function ready(im){return im&&im.complete&&im.naturalWidth>0}
Object.keys(DR).forEach(function(k){DR[k].im=load(DR[k].src)});
// the background that is really shown: the stove background with the open drawers drawn over it
function compose(src,again){
  var l=DR.left.open,r=DR.right.open;
  if(!l&&!r)return src;
  var key=src+'|'+(l?1:0)+(r?1:0);
  if(cache[key])return cache[key];
  var b=load(src,again);
  if(!ready(b)||(l&&!ready(DR.left.im))||(r&&!ready(DR.right.im))){setTimeout(function(){if(again)again()},250);return src}
  var c=document.createElement('canvas');c.width=W;c.height=H;var g=c.getContext('2d');
  g.drawImage(b,0,0,W,H);
  if(l)g.drawImage(DR.left.im,DR.left.x,DR.left.y);
  if(r)g.drawImage(DR.right.im,DR.right.x,DR.right.y);
  try{return cache[key]=c.toDataURL('image/webp',.94)}catch(e){return src}
}
function inR(p,r){return p.x>=r.l&&p.x<=r.r&&p.y>=r.t&&p.y<=r.b}
// what lies under the mouse (client coordinates); an item that stands over it has the priority
function hit(x,y){
  var p=screenToScene(x,y);
  try{if(typeof itemAt==='function'&&itemAt(x,y))return null}catch(e){}
  for(var k in DR){var d=DR[k];if(inR(p,d.open?d.openR:d.closed))return{kind:'drawer',key:k,label:d.label+(d.open?' — klik za zatvaranje':' — klik za otvaranje')}}
  if(inR(p,GRILL))return{kind:'grill',label:'roštilj — klik za zumiranje'};
  return null;
}
function reapply(){if(typeof applyCookstoveState==='function')applyCookstoveState()}
function toggleDrawer(k){
  var d=DR[k];d.open=!d.open;reapply();
  try{showToast(d.label+(d.open?' je otvorena.':' je zatvorena.'))}catch(e){}
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
  if(h.kind==='drawer')toggleDrawer(h.key);else if(h.kind==='grill')zoomGrill();
  return true;
}
window.CooksterKitchenFx={compose:function(src){return compose(src,reapply)},hit:hit,click:click,zoomGrill:zoomGrill,closeGrill:closeGrill,
  drawer:function(k){return DR[k]&&DR[k].open},setDrawer:function(k,o){if(DR[k]&&DR[k].open!==!!o)toggleDrawer(k)},isZoomed:function(){return !!view}};
})();
