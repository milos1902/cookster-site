/* Cookster: the tavern is locked at the start of the game (until the progression unlocks it).
   - On the door of the tavern (top of the kitchen) two crossed yellow (police) tapes with the word "ZAKLJUČANO" are drawn; a click on the door only says that it is locked.
   - The ticket rail (order rail) and the waiter's bell are hidden in the kitchen while the tavern is locked.
   Unlocking: CooksterTavernLock.set(false) (the progression calls it), or ?otkljucaj in the address (it is remembered), ?zakljucaj locks again.
   The state is kept in localStorage 'cookster.tavern-locked.v1' ('0' = unlocked). */
(function(){
'use strict';
if(window.CooksterTavernLock)return;
var KEY='cookster.tavern-locked.v1';
var DOOR={l:795,t:5,r:1145,b:145};      // the door in the picture of the kitchen (the same box as DOOR in js/kitchen-fixtures.js)
var HIDE_IDS={ticket_rail:1,zvonce_konobar:1};
var locked=true;
try{
  var q=location.search;
  if(/[?&]otkljucaj\b/.test(q))localStorage.setItem(KEY,'0');
  else if(/[?&]zakljucaj\b/.test(q))localStorage.removeItem(KEY);
  locked=localStorage.getItem(KEY)!=='0';
}catch(e){}
var overlay=null;

function css(){
  var s=document.createElement('style');
  s.textContent='#tavernLockX{position:absolute;pointer-events:none;z-index:70000}'
    +'#tavernLockX .tl-bar{position:absolute;left:50%;top:50%;height:24px;margin-top:-12px;'
    +'background:linear-gradient(180deg,#e9b800 0,#ffd51c 18%,#ffd51c 82%,#e9b800 100%);border-top:3px solid #1b1b1b;border-bottom:3px solid #1b1b1b;box-shadow:0 3px 5px rgba(0,0,0,.5);'
    +'display:flex;align-items:center;justify-content:center;color:#151515;font:900 14px/1 Arial Black,Arial,sans-serif;letter-spacing:.2em;white-space:nowrap}';
  document.head.appendChild(s);
}
function build(){
  var sc=document.getElementById('scene');if(!sc||overlay)return;
  css();
  var w=DOOR.r-DOOR.l,h=DOOR.b-DOOR.t,len=Math.hypot(w,h)+30,ang=Math.atan2(h,w)*180/Math.PI;
  overlay=document.createElement('div');overlay.id='tavernLockX';
  overlay.style.cssText='left:'+DOOR.l+'px;top:'+DOOR.t+'px;width:'+w+'px;height:'+h+'px';
  [ang,-ang].forEach(function(a){
    var b=document.createElement('div');b.className='tl-bar';b.textContent='ZAKLJUČANO';
    b.style.width=len.toFixed(0)+'px';b.style.marginLeft=(-len/2).toFixed(0)+'px';b.style.transform='rotate('+a.toFixed(1)+'deg)';
    overlay.appendChild(b);
  });
  sc.appendChild(overlay);
}
// the rail and the bell: hidden (with their shadows) while locked
function apply(){
  if(overlay)overlay.style.display=locked?'':'none';
  var list;try{list=items;}catch(e){return;}
  for(var i=0;i<list.length;i++){
    var el=list[i];if(!el||!el.dataset||!HIDE_IDS[el.dataset.itemId])continue;
    var d=locked?'none':'';
    if(el.style.display!==d)el.style.display=d;
    var sh=el._contactShadow;if(sh&&sh.style.display!==d)sh.style.display=d;
  }
}
function set(v){locked=!!v;try{if(locked)localStorage.removeItem(KEY);else localStorage.setItem(KEY,'0');}catch(e){}apply();}
function init(){build();apply();setInterval(apply,400);}
window.CooksterTavernLock={locked:function(){return locked;},set:set,apply:apply};
if(document.readyState==='complete')init();else window.addEventListener('load',init);
})();
