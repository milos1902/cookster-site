/* Cookster: the kitchen window without the flower pot. The pot is drawn in the pictures of the kitchen, so a piece of the picture of the window WITHOUT the pot
   (assets/effects/prozor_bez_saksije.webp, drawn in ChatGPT, the edges are soft) lies over the kitchen at the place of the pot.
   It lies over the pictures without the sun / with the night window, under the dirt, and under the picture of the open window (js/window-open.js).
   It hides while the window is open; at night a second piece (prozor_bez_saksije_noc.webp, the night picture of the window) takes over. */
(function(){
'use strict';
if(window.CooksterWindowPatch)return;
var X=0,Y=86,W=132,H=196,el=null,elN=null;
function build(){
  var sc=document.getElementById('scene');if(!sc||el)return;
  el=document.createElement('div');el.id='windowPatch';el.setAttribute('aria-hidden','true');
  el.style.cssText='position:absolute;left:'+X+'px;top:'+Y+'px;width:'+W+'px;height:'+H+'px;pointer-events:none;z-index:0;background:url(assets/effects/prozor_bez_saksije.webp?v=1) 0 0/100% 100% no-repeat;';
  elN=el.cloneNode(false);elN.id='windowPatchNight';elN.style.backgroundImage='url(assets/effects/prozor_bez_saksije_noc.webp?v=1)';elN.style.opacity='0';elN.style.webkitMaskImage=elN.style.maskImage='url(assets/effects/window_zone_mask.png?v=1)';elN.style.webkitMaskSize=elN.style.maskSize='1672px 941px';elN.style.webkitMaskPosition=elN.style.maskPosition='0px -'+Y+'px';elN.style.webkitMaskRepeat=elN.style.maskRepeat='no-repeat';
  var ref=document.getElementById('windowOpen');
  if(ref&&ref.parentNode===sc){sc.insertBefore(el,ref);sc.insertBefore(elN,ref);}else{sc.appendChild(el);sc.appendChild(elN);}      // under the picture of the open window
  tick();
}
var lastOpen=null,lastN=-1;
// what is seen at any moment must be what the kitchen itself shows: the day picture with the night picture of the window over it only inside the window mask (js/day-light.js: #dayWinNight), by the same amount.
// So the day piece is always there, and the night piece has the SAME mask and the SAME opacity as #dayWinNight (otherwise the whole piece, the sill and the wood, turned blue at dawn and at dusk).
// The pieces lie UNDER the picture of the open window: when the window closes they must be there at once, when it opens they hide only after the open picture is fully seen.
function tick(){
  if(!el)return;
  var open=false,n=0,w=document.getElementById('dayWinNight');
  try{open=!!(window.CooksterWindow&&CooksterWindow.isOpen());}catch(e){}
  if(w){n=parseFloat(w.style.opacity);if(!isFinite(n))n=parseFloat(getComputedStyle(w).opacity)||0;}
  if(open!==lastOpen||Math.abs(n-lastN)>.004){
    lastOpen=open;lastN=n;
    var tr=open?'opacity 0s linear 1.2s':'none';      // opening: hide after 1.2 s; closing / day-night change: at once
    el.style.transition=elN.style.transition=tr;
    el.style.opacity=open?'0':'1';elN.style.opacity=open?'0':Math.max(0,Math.min(1,n)).toFixed(3);
  }
}
function loop(){tick();requestAnimationFrame(loop);}
function init(){build();requestAnimationFrame(loop);}
window.CooksterWindowPatch={tick:tick};
if(document.readyState==='complete')setTimeout(init,400);else window.addEventListener('load',function(){setTimeout(init,400);});
})();
