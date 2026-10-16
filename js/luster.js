/* Cookster: the old Serbian chandelier hangs from the top edge of the kitchen (assets/effects/luster.webp, the chain goes out of the picture at the top).
   A click on the middle of the chandelier switches it on / off. When it is on the lamps in the shades glow warm and it lights the room (js/day-light.js draws a pool of light that cuts the dark, it asks CooksterLuster.level()). */
(function(){
if(window.CooksterLuster)return;
var KEY='cooksterLusterOn',on=false,level=0,hot=null,X=702,Y=0,W=256,H=221,         // place in the scene (the chain is at x=830, the same as the middle of the table)
    LAMPS=[[54,57],[200,57],[24,131],[232,137],[125,93]],      // the mouths of the shades (px in the picture)
    wrap=null,glows=[],halo=null;
function build(){
  var sc=document.getElementById('scene');if(!sc)return false;
  if(wrap&&wrap.parentNode===sc)return true;
  wrap=document.createElement('div');wrap.id='luster';
  wrap.style.cssText='position:absolute;left:'+X+'px;top:'+Y+'px;width:'+W+'px;height:'+H+'px;pointer-events:none;z-index:80000;background:url(assets/effects/luster.webp?v=1) 0 0/100% 100% no-repeat';
  sc.appendChild(wrap);
  var gl=document.createElement('div');gl.id='lusterGlow';
  gl.style.cssText='position:absolute;left:'+X+'px;top:'+Y+'px;width:'+W+'px;height:'+H+'px;pointer-events:none;z-index:90001;opacity:0;mix-blend-mode:screen';
  halo=document.createElement('div');halo.style.cssText='position:absolute;left:-105px;top:-72px;width:'+(W+210)+'px;height:'+(H+210)+'px;background:radial-gradient(ellipse at 50% 38%,rgba(255,196,110,.34),rgba(255,160,70,.14) 38%,rgba(255,150,60,0) 68%)';
  gl.appendChild(halo);
  LAMPS.forEach(function(p){var d=document.createElement('div');d.style.cssText='position:absolute;left:'+(p[0]-21)+'px;top:'+(p[1]-21)+'px;width:42px;height:42px;border-radius:50%;background:radial-gradient(circle,rgba(255,236,170,.95),rgba(255,190,90,.55) 40%,rgba(255,150,50,0) 72%)';gl.appendChild(d);});
  sc.appendChild(gl);glows=[gl];
  hot=document.createElement('div');hot.id='lusterHot';hot.title='Upali / ugasi luster';hot.dataset.soundTarget='lusterHot';hot.dataset.soundActions='click';hot.dataset.label='Luster';
  hot.style.cssText='position:absolute;left:'+(X+W*.34)+'px;top:'+(Y+H*.42)+'px;width:'+(W*.34)+'px;height:'+(H*.34)+'px;border-radius:50%;z-index:80002;cursor:pointer';
  hot.addEventListener('click',function(e){e.stopPropagation();toggle();});
  sc.appendChild(hot);return true;
}
function toggle(){set(!on,true);}
function set(v,sound){on=!!v;try{localStorage.setItem(KEY,on?'1':'0');}catch(e){}
  if(sound){try{if(typeof playImpactSound==='function'&&hot)playImpactSound(hot,'click');}catch(e){}}}
function tick(){      // the lamps glow smoothly (about half a second), as much as the chandelier is switched on
  if(!build())return;
  var tgt=on?1:0;if(Math.abs(tgt-level)>.001){level+=(tgt-level)*.18;if(Math.abs(tgt-level)<.01)level=tgt;}
  glows[0].style.opacity=level.toFixed(3);
}
try{on=localStorage.getItem(KEY)==='1';level=on?1:0;}catch(e){}
setInterval(tick,40);
window.addEventListener('load',function(){setTimeout(function(){build();tick();},300);});
window.CooksterLuster={toggle:toggle,set:function(v){set(v,true);},isOn:function(){return on;},level:function(){return level;}};
})();
