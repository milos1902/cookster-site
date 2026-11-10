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
  elN=el.cloneNode(false);elN.id='windowPatchNight';elN.style.backgroundImage='url(assets/effects/prozor_bez_saksije_noc.webp?v=1)';elN.style.opacity='0';
  var ref=document.getElementById('windowOpen');
  if(ref&&ref.parentNode===sc){sc.insertBefore(el,ref);sc.insertBefore(elN,ref);}else{sc.appendChild(el);sc.appendChild(elN);}      // under the picture of the open window
  tick();
}
var lastOpen=null,nwCache=0,nwT=0;
// the pieces lie UNDER the picture of the open window: when the window closes they must be there at once (the open picture fades out over them), when it opens they hide only after the open picture is fully seen - otherwise the pot shows for a moment
function tick(){
  if(!el)return;
  var open=false,now=performance.now();
  try{open=!!(window.CooksterWindow&&CooksterWindow.isOpen());}catch(e){}
  if(now-nwT>250){nwT=now;try{var D=window.CooksterDay;nwCache=D&&D.phase?D.phase().nw:0;}catch(e){nwCache=0;}}
  var nw=nwCache,dayOp=Math.max(0,Math.min(1,2*(1-nw))),nightOp=Math.max(0,Math.min(1,2*nw));
  if(open!==lastOpen||Math.abs(nw-(tick.nw||0))>.01){
    lastOpen=open;tick.nw=nw;
    var tr=open?'opacity 0s linear 1.2s':'none';      // opening: hide after 1.2 s; closing / day-night change: at once
    el.style.transition=elN.style.transition=tr;
    el.style.opacity=open?'0':dayOp.toFixed(2);elN.style.opacity=open?'0':nightOp.toFixed(2);
  }
}
function loop(){tick();requestAnimationFrame(loop);}
function init(){build();requestAnimationFrame(loop);}
window.CooksterWindowPatch={tick:tick};
if(document.readyState==='complete')setTimeout(init,400);else window.addEventListener('load',function(){setTimeout(init,400);});
})();
