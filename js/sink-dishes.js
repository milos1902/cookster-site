/* Cookster - dirty dishes in the sink.
   A dirty bowl from the tavern ("Pranje" in the right click ring) goes into the sink in the kitchen and stays there (the washing itself comes later).
   The number is kept in localStorage; the bowls lie in the sink opening (the sink geometry comes from game.js). */
(function(){
'use strict';
if(window.CooksterSinkDishes)return;
var KEY='cookster.sink-dishes.v1',SRC='assets/calibration_props/posuda_za_kupus/posuda_prljava.webp',MAX=8;
var SLOTS=[[.30,.45],[.55,.40],[.42,.62],[.70,.58],[.22,.65],[.62,.75],[.40,.30],[.80,.42]];
var n=0,layer=null;
try{n=Math.max(0,parseInt(localStorage.getItem(KEY),10)||0)}catch(e){}
function save(){try{localStorage.setItem(KEY,String(n))}catch(e){}}
function render(){
  var scene=document.getElementById('scene');if(!scene)return;
  if(!layer||!layer.isConnected){layer=document.createElement('div');layer.id='sinkDishLayer';layer.style.cssText='position:absolute;z-index:10013;pointer-events:none;overflow:hidden';scene.appendChild(layer)}
  var g,b;
  try{g=calibratedSinkGeometry();b=sinkGeometryBounds(g.vertices)}catch(e){return}
  layer.style.left=b.left+'px';layer.style.top=b.top+'px';layer.style.width=(b.right-b.left)+'px';layer.style.height=(b.bottom-b.top)+'px';
  layer.replaceChildren();
  for(var i=0;i<Math.min(n,MAX);i++){
    var s=SLOTS[i],pt=sinkQuadPoint(g.top,s[0],s[1]),im=document.createElement('img');
    im.src=SRC;im.alt='Prljava posuda';im.draggable=false;
    im.style.cssText='position:absolute;width:58px;height:auto;transform:translate(-50%,-50%) rotate('+((i*37)%25-12)+'deg);left:'+(pt.x-b.left).toFixed(1)+'px;top:'+(pt.y-b.top).toFixed(1)+'px';
    layer.appendChild(im);
  }
}
window.CooksterSinkDishes={add:function(){n++;save();render()},count:function(){return n},render:render};
setTimeout(render,800);
})();
