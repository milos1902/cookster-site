/* Cookster - water in vessels.
   A vessel keeps how full of water it is in dataset.water (0..1, saved with the game). The water is drawn inside the area of the food that was calibrated in the tool "Maska posude"
   (js/core/vessel-food-calibration.js: the visible area of the food, and the points of the bottom and of the top of the food = how high the water can stand).
   Only vessels that have such a calibration show water. js/sink-zoom.js fills the vessels that stand in the sink; pouring (game.js) moves the water between vessels. */
(function(){
'use strict';
if(window.CooksterVesselWater)return;
var TEX='assets/water/povrsina.webp?v=1';
var css=document.createElement('style');
css.textContent='@keyframes vwDrift{from{background-position:0 0,0 0}to{background-position:0 0,768px 384px}}'+
 '.vessel-water-ov{position:absolute;inset:0;pointer-events:none;overflow:hidden}'+
 '.vessel-water-ov .vw-fill{position:absolute;left:0;right:0;bottom:0;background:linear-gradient(rgba(60,150,190,.30),rgba(20,80,120,.52)),url('+TEX+');background-size:100% 100%,46% auto;opacity:.78;animation:vwDrift 26s linear infinite}'+
 '.vessel-water-ov .vw-top{position:absolute;left:0;right:0;height:3.2%;background:linear-gradient(rgba(255,255,255,.62),rgba(255,255,255,0));mix-blend-mode:screen}';
document.head.appendChild(css);
function prof(id){
  var C=window.CooksterVesselFoodCalibration,p=C&&C.get&&C.get(id);
  if(!p||!p.foodVisible||p.foodVisible.length<3||!p.depth||!p.depth.bottom||!p.depth.foodTop)return null;
  return p;
}
function has(id){return !!prof(id);}
function clamp(v){return Math.max(0,Math.min(1,+v||0));}
// a layer with the water, as big as the picture of the vessel (the coordinates of the calibration are percents of that picture)
function overlay(id,f){
  var p=prof(id);f=clamp(f);if(!p||f<=.004)return null;
  var d=document.createElement('div');d.className='vessel-water-ov';
  var poly='polygon('+p.foodVisible.map(function(q){return q[0]+'% '+q[1]+'%'}).join(',')+')';
  d.style.clipPath=poly;d.style.webkitClipPath=poly;
  var by=p.depth.bottom[1],ty=p.depth.foodTop[1],y=by+(ty-by)*f;      // the surface of the water (percent of the height of the picture)
  var fill=document.createElement('div');fill.className='vw-fill';fill.style.top=y+'%';
  var top=document.createElement('div');top.className='vw-top';top.style.top=(y-1.2)+'%';
  d.appendChild(fill);d.appendChild(top);return d;
}
function get(el){return clamp(el&&el.dataset&&el.dataset.water);}
// the vessel in the kitchen
function sync(el){
  if(!el||!el.dataset)return;
  var id=el.dataset.itemId,f=get(el),key=f<=.004||!has(id)?'':String(Math.round(f*100));
  if(el._waterKey===key)return;
  el._waterKey=key;
  if(el._waterOv){el._waterOv.remove();el._waterOv=null;}
  if(!key)return;
  var d=overlay(id,f);if(!d)return;
  d.style.zIndex='8';el.appendChild(d);el._waterOv=d;
}
function set(el,f){
  f=clamp(f);
  if(f<=.004)delete el.dataset.water;else el.dataset.water=f.toFixed(3);
  sync(el);
}
window.CooksterVesselWater={has:has,get:get,set:set,sync:sync,overlay:overlay,clamp:clamp};
})();
