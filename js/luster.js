/* Cookster: the old Serbian chandelier hangs from the top edge of the kitchen (assets/effects/luster.webp, the chain goes out of the picture at the top).
   A click on the middle of the chandelier switches it on / off. When it is on the lamps in the shades glow warm and it lights the room (js/day-light.js draws a pool of light that cuts the dark, it asks CooksterLuster.level()). */
(function(){
if(window.CooksterLuster)return;
var KEY='cooksterLusterOn',on=false,level=0,hot=null,X=702,Y=0,W=256,H=221,         // place in the scene (the chain is at x=830, the same as the middle of the table)
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
  var MK='url(assets/effects/luster_lampe.png?v=1) 0 0/100% 100% no-repeat';      // the shape of the four shades (drawn by the player), the glow follows exactly this line
  function shadeLayer(col,op,blurPx){var o=document.createElement('div');o.style.cssText='position:absolute;left:0;top:0;width:'+W+'px;height:'+H+'px;opacity:'+op+(blurPx?';filter:blur('+blurPx+'px)':'');
    var m=document.createElement('div');m.style.cssText='position:absolute;inset:0;background:'+col+';-webkit-mask:'+MK+';mask:'+MK;o.appendChild(m);return o;}
  gl.appendChild(shadeLayer('rgb(255,190,100)',.75,14));gl.appendChild(shadeLayer('rgb(255,205,120)',.7,5));gl.appendChild(shadeLayer('rgb(255,238,185)',.8,0));
  sc.appendChild(gl);glows=[gl];
  hot=document.createElement('div');hot.id='lusterHot';hot.dataset.soundTarget='lusterHot';hot.dataset.soundActions='click';hot.dataset.label='Luster';      // only a name for the sound tool: the clicks are caught by the picture of the chandelier itself (below)
  hot.style.cssText='position:absolute;left:'+(X+W*.34)+'px;top:'+(Y+H*.42)+'px;width:'+(W*.34)+'px;height:'+(H*.34)+'px;pointer-events:none;border-radius:50%';
  sc.appendChild(hot);return true;
}
/* a click anywhere on the chandelier (the whole picture, the chain too, not only the middle) switches it: the transparent part of the picture does not catch the clicks, they go to what lies under it */
var hit=null,HW=0,HH=0;
(function(){var im=new Image();im.onload=function(){try{
  HW=W;HH=H;var c=document.createElement('canvas');c.width=W;c.height=H;var g=c.getContext('2d');g.drawImage(im,0,0,W,H);var d=g.getImageData(0,0,W,H).data,src=new Uint8Array(W*H),R=6;
  for(var i=0;i<W*H;i++)src[i]=d[i*4+3]>25?1:0;
  hit=new Uint8Array(W*H);for(var y=0;y<H;y++)for(var x=0;x<W;x++){if(!src[y*W+x])continue;for(var yy=Math.max(0,y-R);yy<=Math.min(H-1,y+R);yy++)for(var xx=Math.max(0,x-R);xx<=Math.min(W-1,x+R);xx++)hit[yy*W+xx]=1;}
  }catch(e){hit=null;}};im.src='assets/effects/luster.webp?v=1';})();
function onLuster(e){
  var sc=document.getElementById('scene');if(!hit||!sc)return false;
  var r=sc.getBoundingClientRect(),k=r.width/1672;if(!(k>0))return false;
  var x=Math.round((e.clientX-r.left)/k-X),y=Math.round((e.clientY-r.top)/k-Y);
  return x>=0&&y>=0&&x<W&&y<H&&hit[y*W+x]===1;
}
var swallowT=0;
window.addEventListener('pointerdown',function(e){
  if(e.button!==0||(typeof holding!=='undefined'&&holding)||!onLuster(e))return;
  e.preventDefault();e.stopImmediatePropagation();swallowT=performance.now();toggle();
},true);
window.addEventListener('click',function(e){if(performance.now()-swallowT<600&&onLuster(e)){e.preventDefault();e.stopImmediatePropagation();}},true);
window.addEventListener('pointermove',function(e){var sc=document.getElementById('scene');if(!sc)return;var h=onLuster(e)&&!(typeof holding!=='undefined'&&holding);if(h!==!!sc._lusterCur){sc._lusterCur=h;sc.style.cursor=h?'pointer':'';}},true);
function toggle(){set(!on,true);}
function set(v,sound){on=!!v;lGo();try{localStorage.setItem(KEY,on?'1':'0');}catch(e){}
  if(sound){try{if(typeof playImpactSound==='function'&&hot)playImpactSound(hot,'click');}catch(e){}}}
function tick(){      // the lamps glow smoothly (about half a second), as much as the chandelier is switched on
  if(!build())return;
  glows[0].style.opacity=level.toFixed(3);
}
try{on=localStorage.getItem(KEY)==='1';level=on?1:0;}catch(e){}
/* switching on / off is almost instant (0.12 s / 0.1 s: one or two frames when the page is slow) and only the light is redrawn (not the lighting of every item), so it does not stutter */
var lFrom=level,lTo=level,lT0=0,lDur=400,lRun=false;
function lStep(){var k=Math.max(0,Math.min(1,(performance.now()-lT0)/lDur));level=lFrom+(lTo-lFrom)*(k*k*(3-2*k));tick();try{if(window.CooksterDay&&CooksterDay.refreshLight)CooksterDay.refreshLight();}catch(e){}if(k<1)requestAnimationFrame(lStep);else lRun=false;}
function lGo(){lFrom=level;lTo=on?1:0;lT0=performance.now();lDur=on?120:100;if(!lRun){lRun=true;requestAnimationFrame(lStep);}}
setInterval(tick,300);
window.addEventListener('load',function(){setTimeout(function(){build();tick();},300);});
window.CooksterLuster={toggle:toggle,set:function(v){set(v,true);},isOn:function(){return on;},level:function(){return level;}};
})();
