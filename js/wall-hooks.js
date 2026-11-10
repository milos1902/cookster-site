/* Cookster: mesingane kuke na levom zidu (ispod prozora), za kese sa pijace. Za sada samo kuke (slika assets/ui/wall/kuka.webp, 160 px visoka, prikazana ~46 px).
   HOOKS: sredina gornje trecine kuke na zidu (koordinate scene 1672x941). Kuke su ukrasne dok se ne okace kese. */
(function(){
'use strict';
if(window.CooksterWallHooks)return;
var HOOKS=[{x:106,y:314},{x:84,y:360},{x:61,y:406},{x:38,y:452}];
var H=46;
function build(){
  var sc=document.getElementById('scene');if(!sc||sc.querySelector('.wall-hook'))return;
  HOOKS.forEach(function(h){
    var i=document.createElement('img');i.className='wall-hook';i.draggable=false;i.src='assets/ui/wall/kuka.webp?v=1';i.alt='';
    i.style.cssText='position:absolute;pointer-events:none;z-index:3;height:'+H+'px;left:'+(h.x-H*.2)+'px;top:'+(h.y-H*.12)+'px;filter:drop-shadow(1px 2px 1.5px rgba(30,12,0,.55))';
    sc.appendChild(i);
  });
}
window.CooksterWallHooks={HOOKS:HOOKS,build:build};
if(document.readyState==='complete')build();else window.addEventListener('load',build);
})();
