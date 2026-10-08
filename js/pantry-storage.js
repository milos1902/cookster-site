/* Cookster - putting barrels and jars in the pantry.
   Kitchen: right click on a barrel ("kaca") or a jar ("tegla") -> "U špajz": the thing is taken in the hand and the camera turns to the pantry.
   Pantry: the thing follows the mouse; a left click puts it down there (it stays there, also after a reload).
   Right click on a thing in the pantry -> "U kuhinju": back to the kitchen with the thing in the hand.
   The things are kept as saved world items (js/game.js, CooksterPantryBridge) in localStorage cookster.pantry-items.v1; the place is a fraction of the picture of the pantry. */
(function(){
'use strict';
var P=window.CooksterPantry,B=window.CooksterPantryBridge;
if(!P||!B||window.CooksterPantryStorage)return;
var room=P.room,art=room.querySelector('.ps-art'),KEY='cookster.pantry-items.v1';
var list=[],layer=document.createElement('div'),ghost=document.createElement('img'),menu=document.createElement('div');
try{var raw=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(raw))list=raw.filter(function(o){return o&&o.saved&&isFinite(o.fx)&&isFinite(o.fy)})}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(list))}catch(e){}}
layer.style.cssText='position:absolute;inset:0;pointer-events:none';
ghost.style.cssText='position:absolute;display:none;pointer-events:none;opacity:.9;transform:translate(-50%,-100%);filter:drop-shadow(0 6px 6px rgba(0,0,0,.5));z-index:5';ghost.draggable=false;
menu.className='cookster-ctx';menu.style.cssText='position:fixed;z-index:2147483600;display:none;transform:translate(-50%,-50%)';
menu.innerHTML='<button type="button" style="border:2px solid #351b0d;border-radius:10px;background:#e8c27a;color:#351b0d;font:700 14px system-ui,sans-serif;padding:9px 14px;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.5)"></button>';
room.appendChild(layer);room.appendChild(ghost);document.body.appendChild(menu);
var btn=menu.firstChild;
function hideMenu(){menu.style.display='none';btn.onclick=null}
function showMenu(x,y,text,fn){btn.textContent=text;btn.onclick=function(e){e.stopPropagation();hideMenu();fn()};menu.style.left=x+'px';menu.style.top=y+'px';menu.style.display='block'}
// the picture of the pantry sits in the middle of the screen (object-fit: contain): the places are fractions of that picture
function box(){
  var rw=room.clientWidth,rh=room.clientHeight,nw=art.naturalWidth||1672,nh=art.naturalHeight||941,s=Math.min(rw/nw,rh/nh);
  return{x:(rw-nw*s)/2,y:(rh-nh*s)/2,w:nw*s,h:nh*s,s:s};
}
function sizeOf(saved,b){var w=(saved.baseW||80)*b.w/1672;return{w:w,h:w*(saved.baseH||80)/(saved.baseW||80)}}
function render(){
  var b=box();layer.replaceChildren();
  list.forEach(function(o,i){
    var z=sizeOf(o.saved,b),im=document.createElement('img');
    im.src=o.saved.src;im.alt=o.saved.label||'';im.draggable=false;im.dataset.i=i;
    im.style.cssText='position:absolute;pointer-events:auto;cursor:context-menu;width:'+z.w+'px;height:'+z.h+'px;left:'+(b.x+o.fx*b.w-z.w/2)+'px;top:'+(b.y+o.fy*b.h-z.h)+'px;filter:drop-shadow(0 5px 5px rgba(0,0,0,.45));z-index:'+(10+Math.round(o.fy*100));
    im.addEventListener('contextmenu',function(e){
      e.preventDefault();e.stopPropagation();
      if(B.heldItem())return;
      showMenu(e.clientX,e.clientY,'🍳 U kuhinju',function(){
        var rec=list[i];if(!rec)return;
        if(B.take(rec.saved)){list.splice(i,1);save();render();P.close()}
      });
    });
    layer.appendChild(im);
  });
}
function heldSrc(){var el=B.heldItem(),body=el&&(el.querySelector('.body')||el.querySelector('img'));return body?body.getAttribute('src'):''}
function moveGhost(e){
  B.hideGhosts();                                                 // the game's own previews of the held thing (shadow) must not stay over the pantry
  var el=P.isOpen?B.heldItem():null,src=el?heldSrc():'';
  if(!el||!src){ghost.style.display='none';return}
  var b=box(),w=(+el.dataset.baseW||el.offsetWidth||80)*b.w/1672,h=w*(+el.dataset.baseH||el.offsetHeight||80)/(+el.dataset.baseW||el.offsetWidth||80);
  if(ghost.getAttribute('src')!==src)ghost.src=src;
  ghost.style.width=w+'px';ghost.style.height=h+'px';
  var r=room.getBoundingClientRect();ghost.style.left=(e.clientX-r.left)+'px';ghost.style.top=(e.clientY-r.top)+'px';ghost.style.display='block';
}
room.addEventListener('pointermove',moveGhost);
room.addEventListener('pointerenter',moveGhost);
room.addEventListener('pointerdown',function(e){
  if(e.button!==0){return}
  if(e.target.closest&&e.target.closest('button'))return;
  hideMenu();
  if(!B.heldItem())return;
  var b=box(),fx=(e.clientX-room.getBoundingClientRect().left-b.x)/b.w,fy=(e.clientY-room.getBoundingClientRect().top-b.y)/b.h;
  if(fx<0||fx>1||fy<.2||fy>1)return;                              // only onto the picture (not on the upper edge)
  var saved=B.detachHeld();if(!saved)return;
  list.push({saved:saved,fx:fx,fy:fy});save();render();ghost.style.display='none';
});
room.addEventListener('contextmenu',function(e){e.preventDefault()});
addEventListener('resize',function(){if(P.isOpen)render()});
setInterval(function(){if(P.isOpen&&!layer.childElementCount&&list.length)render();if(P.isOpen&&!B.heldItem())ghost.style.display='none'},500);

// kitchen: right click on a barrel or a jar
addEventListener('contextmenu',function(e){
  if(P.isOpen||P.busy||(window.CooksterTavern&&window.CooksterTavern.isOpen))return;
  if(B.heldItem())return;
  var el=B.hovered(e.clientX,e.clientY);if(!el||!B.storable(el))return;
  e.preventDefault();e.stopPropagation();
  showMenu(e.clientX,e.clientY,'📦 U špajz',function(){
    B.pick(el);var n=0;                                           // picking up takes a moment: go when the thing is in the hand
    (function wait(){if(B.heldItem()){B.hideGhosts();P.open(true)}else if(++n<40)setTimeout(wait,50)})();
  });
},true);
addEventListener('pointerdown',function(e){if(!menu.contains(e.target))hideMenu()},true);
addEventListener('keydown',function(e){if(e.key==='Escape')hideMenu()});
render();
window.CooksterPantryStorage={count:function(){return list.length},list:function(){return list.slice()}};
})();
