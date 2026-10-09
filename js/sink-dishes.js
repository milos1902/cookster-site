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
// ---- washing: while the tap runs the bowls in the sink shake in the water, suds rise, and one by one they are washed (they disappear)
var WASH_SECS=2.4,washT=0,css=document.createElement('style');
css.textContent='@keyframes sdShake{0%{transform:translate(-50%,-50%) rotate(-6deg) scale(1)}50%{transform:translate(-46%,-54%) rotate(6deg) scale(1.04)}100%{transform:translate(-50%,-50%) rotate(-6deg) scale(1)}}'+
 '@keyframes sdGone{0%{opacity:1;filter:brightness(1)}60%{opacity:1;filter:brightness(1.9) saturate(.3)}100%{opacity:0;filter:brightness(2.4);transform:translate(-50%,-70%) scale(.5)}}'+
 '@keyframes sdBub{0%{opacity:0;transform:translateY(0) scale(.4)}30%{opacity:.9}100%{opacity:0;transform:translateY(-34px) scale(1.1)}}'+
 '#sinkDishLayer.sdwash img{animation:sdShake .5s ease-in-out infinite}#sinkDishLayer img.sdgone{animation:sdGone .7s ease-in forwards!important}'+
 '#sinkDishLayer .sdb{position:absolute;width:10px;height:10px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,#bfe6ff 60%,rgba(150,210,255,.4));animation:sdBub 1.1s ease-out forwards}';
document.head.appendChild(css);
function tapOn(){try{return !!(typeof faucetOn!=='undefined'&&faucetOn)}catch(e){return false}}
setInterval(function(){
  if(!layer||!layer.isConnected)return;
  var on=tapOn()&&n>0;layer.classList.toggle('sdwash',on);
  if(!on){washT=0;return}
  var imgs=layer.querySelectorAll('img:not(.sdgone)');
  for(var i=0;i<imgs.length;i++){if(Math.random()<.5){var b=document.createElement('i');b.className='sdb';b.style.left=(parseFloat(imgs[i].style.left)+(Math.random()*40-20)).toFixed(0)+'px';b.style.top=(parseFloat(imgs[i].style.top)-8)+'px';layer.appendChild(b);setTimeout(function(x){x.remove()}.bind(null,b),1150)}}
  washT+=.3;
  if(washT>=WASH_SECS&&imgs.length){
    washT=0;var last=imgs[imgs.length-1];last.classList.add('sdgone');n=Math.max(0,n-1);save();
    try{if(window.CooksterSound&&window.CooksterSound.play)window.CooksterSound.play('kitchen','wash')}catch(e){}
    setTimeout(render,750);
  }
},300);
window.CooksterSinkDishes={add:function(){n++;save();render()},count:function(){return n},render:render};
setTimeout(render,800);
})();
