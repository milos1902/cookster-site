/* Cookster: mesingane kuke na levom zidu (za kese sa pijace). Gotove: polozaj je u DEFAULTS (izvoz iz nekadasnjeg alata). Slika: assets/ui/wall/kuka.webp (101x160).
   Svaka kuka: x,y = sredina, h = visina px, rz = rotacija, rx/ry = nagib gore-dole / levo-desno (stepeni), p = perspektiva. Kese koje vise na njima: js/wall-bags.js. */
(function(){
'use strict';
if(window.CooksterWallHooks)return;
var KEY='cookster.wall-hooks.v2',IMG_W=101,IMG_H=160,SRC='assets/ui/wall/kuka.webp?v=2';
var DEFAULTS=[{"x":110,"y":299.4,"h":34,"rz":-16,"rx":0,"ry":24.5,"p":100},{"x":95.2,"y":334.8,"h":34,"rz":-16,"rx":0,"ry":18.5,"p":100},{"x":82,"y":369,"h":34,"rz":-16,"rx":0,"ry":20,"p":100},{"x":66,"y":402,"h":34,"rz":-16,"rx":0,"ry":21.5,"p":100},{"x":50.8,"y":434.2,"h":34,"rz":-16,"rx":0,"ry":23,"p":100},{"x":35.2,"y":463.9,"h":34,"rz":-11,"rx":0,"ry":11,"p":100}];   // tvoj izvoz iz alata (10.11.)
var hooks=null;
function clone(o){return JSON.parse(JSON.stringify(o));}
function load(){
  try{var r=JSON.parse(localStorage.getItem(KEY)||'null');if(Array.isArray(r)&&r.length)return r.filter(function(h){return h&&isFinite(h.x)&&isFinite(h.y);}).map(norm);}catch(e){}
  return clone(DEFAULTS);
}
function norm(h){return {x:+h.x,y:+h.y,h:+h.h||34,rz:+h.rz||0,rx:+h.rx||0,ry:+h.ry||0,p:+h.p||500};}
function save(){try{localStorage.setItem(KEY,JSON.stringify(hooks));}catch(e){}}
hooks=clone(DEFAULTS);   // kuke su gotove (alat je obrisan); polozaj je u DEFAULTS
var els=[],open=false;

function paint(h,el){
  var H=h.h,W=H*IMG_W/IMG_H;
  el.style.height=H+'px';el.style.width=W+'px';el.style.left=(h.x-W/2)+'px';el.style.top=(h.y-H/2)+'px';
  el.style.transform='perspective('+h.p+'px) rotateX('+h.rx+'deg) rotateY('+h.ry+'deg) rotateZ('+h.rz+'deg)';
}
function render(){
  var sc=document.getElementById('scene');if(!sc)return;
  els.forEach(function(e){e.remove();});els=[];
  hooks.forEach(function(h,i){
    var el=document.createElement('img');el.className='wall-hook';el.draggable=false;el.src=SRC;el.alt='';
    el.style.cssText='position:absolute;z-index:3;transform-origin:50% 50%;filter:drop-shadow(1px 2px 1.5px rgba(30,12,0,.55));pointer-events:none';
    paint(h,el);
    sc.appendChild(el);els.push(el);
  });
}

function init(){render();}
window.CooksterWallHooks={get:function(){return hooks;},render:render,DEFAULTS:DEFAULTS};
if(document.readyState==='complete')init();else window.addEventListener('load',init);
})();
