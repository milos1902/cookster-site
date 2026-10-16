/* Cookster: the old Serbian chandelier hangs from the top edge of the kitchen (assets/effects/luster.webp, the chain goes out of the picture at the top).
   By day it is just a picture (the dark layer of js/day-light.js darkens it with the rest of the room); when it gets dark the lamps in the shades glow warm,
   so the glow layers lie over the dark layer (z-index above #dayLight) and their strength follows the dark of the clock. */
(function(){
if(window.CooksterLuster)return;
var X=670,Y=0,W=320,H=276,         // place in the scene (the chain is at x=830, the same as the middle of the table)
    LAMPS=[[67,71],[250,71],[30,164],[290,171],[156,116]],      // the mouths of the shades (px in the picture)
    wrap=null,glows=[],halo=null;
function build(){
  var sc=document.getElementById('scene');if(!sc)return false;
  if(wrap&&wrap.parentNode===sc)return true;
  wrap=document.createElement('div');wrap.id='luster';
  wrap.style.cssText='position:absolute;left:'+X+'px;top:'+Y+'px;width:'+W+'px;height:'+H+'px;pointer-events:none;z-index:80000;background:url(assets/effects/luster.webp?v=1) 0 0/100% 100% no-repeat';
  sc.appendChild(wrap);
  var gl=document.createElement('div');gl.id='lusterGlow';
  gl.style.cssText='position:absolute;left:'+X+'px;top:'+Y+'px;width:'+W+'px;height:'+H+'px;pointer-events:none;z-index:90001;opacity:0;mix-blend-mode:screen';
  halo=document.createElement('div');halo.style.cssText='position:absolute;left:-130px;top:-90px;width:'+(W+260)+'px;height:'+(H+260)+'px;background:radial-gradient(ellipse at 50% 38%,rgba(255,196,110,.34),rgba(255,160,70,.14) 38%,rgba(255,150,60,0) 68%)';
  gl.appendChild(halo);
  LAMPS.forEach(function(p){var d=document.createElement('div');d.style.cssText='position:absolute;left:'+(p[0]-26)+'px;top:'+(p[1]-26)+'px;width:52px;height:52px;border-radius:50%;background:radial-gradient(circle,rgba(255,236,170,.95),rgba(255,190,90,.55) 40%,rgba(255,150,50,0) 72%)';gl.appendChild(d);});
  sc.appendChild(gl);glows=[gl];return true;
}
function tick(){
  if(!build())return;
  var D=window.CooksterDay,P=null;try{P=D&&D.phase?D.phase():null;}catch(e){}
  var on=P?Math.max(0,Math.min(1,P.dark*2.4+P.nw*.5)):0;       // lit when it gets dark
  glows[0].style.opacity=on.toFixed(2);
}
setInterval(tick,300);
window.addEventListener('load',function(){setTimeout(function(){build();tick();},300);});
window.CooksterLuster={tick:tick};
})();
