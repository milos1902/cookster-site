/* Cookster: the kitchen window without the flower pot. The pot is drawn in the pictures of the kitchen, so a piece of the picture of the window WITHOUT the pot
   (assets/effects/prozor_bez_saksije.webp, drawn in ChatGPT, the edges are soft) lies over the kitchen at the place of the pot.
   It lies over the pictures without the sun / with the night window, under the dirt, and under the picture of the open window (js/window-open.js).
   It hides while the window is open and at night (the night picture of the window still has the pot: it needs its own piece). */
(function(){
'use strict';
if(window.CooksterWindowPatch)return;
var X=0,Y=86,W=132,H=196,el=null;
function build(){
  var sc=document.getElementById('scene');if(!sc||el)return;
  el=document.createElement('div');el.id='windowPatch';el.setAttribute('aria-hidden','true');
  el.style.cssText='position:absolute;left:'+X+'px;top:'+Y+'px;width:'+W+'px;height:'+H+'px;pointer-events:none;z-index:0;background:url(assets/effects/prozor_bez_saksije.webp?v=1) 0 0/100% 100% no-repeat;transition:opacity .4s ease';
  var ref=document.getElementById('windowOpen');
  if(ref&&ref.parentNode===sc)sc.insertBefore(el,ref);else sc.appendChild(el);      // under the picture of the open window
  tick();
}
function tick(){
  if(!el)return;
  var open=false,nw=0;
  try{open=!!(window.CooksterWindow&&CooksterWindow.isOpen());}catch(e){}
  try{var D=window.CooksterDay;nw=D&&D.phase?D.phase().nw:0;}catch(e){}
  el.style.opacity=open?'0':String(Math.max(0,Math.min(1,1-nw*2)).toFixed(2));
}
function init(){build();setInterval(tick,300);}
window.CooksterWindowPatch={tick:tick};
if(document.readyState==='complete')setTimeout(init,400);else window.addEventListener('load',function(){setTimeout(init,400);});
})();
