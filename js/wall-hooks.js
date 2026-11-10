/* Cookster: mesingane kuke na levom zidu (ispod prozora), za kese sa pijace. Za sada samo kuke (slika assets/ui/wall/kuka.webp, 160 px visoka, prikazana ~46 px).
   HOOKS: sredina gornje trecine kuke na zidu (koordinate scene 1672x941). Kuke su ukrasne dok se ne okace kese. */
(function(){
'use strict';
if(window.CooksterWallHooks)return;
var HOOKS=[{x:110,y:318},{x:97,y:348},{x:84,y:378},{x:71,y:408},{x:58,y:438},{x:45,y:468}];
var H=34;
function build(){
  var sc=document.getElementById('scene');if(!sc||sc.querySelector('.wall-hook'))return;
  HOOKS.forEach(function(h){
    var i=document.createElement('img');i.className='wall-hook';i.draggable=false;i.src='assets/ui/wall/kuka.webp?v=2';i.alt='';
    i.style.cssText='position:absolute;pointer-events:none;z-index:3;height:'+H+'px;left:'+(h.x-H*.2)+'px;top:'+(h.y-H*.12)+'px;filter:drop-shadow(1px 2px 1.5px rgba(30,12,0,.55))';
    sc.appendChild(i);
  });
}
window.CooksterWallHooks={HOOKS:HOOKS,build:build};
if(document.readyState==='complete')build();else window.addEventListener('load',build);
})();
