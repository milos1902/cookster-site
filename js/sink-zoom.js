/* Cookster - the sink close-up.
   A click on the sink (with nothing in the hand) zooms the kitchen into the sink, then the picture of the sink close-up (assets/sink/sudopera_krupno.webp) fades in.
   Back: the button "Nazad", the Escape key, or a click on the dark edge. The game behind keeps running. */
(function(){
'use strict';
if(window.CooksterSinkZoom)return;
var SRC='assets/sink/sudopera_krupno.webp?v=1',DUR=900;
var css=document.createElement('style');
css.textContent=
'#sinkZoom{position:fixed;inset:0;z-index:20000;display:none;background:rgba(10,6,3,0);transition:background .5s ease;touch-action:none}'+
'#sinkZoom.on{display:block}#sinkZoom.dark{background:rgba(10,6,3,.82)}'+
'#sinkZoom .sz-stage{position:absolute;left:50%;top:50%;width:min(100vw,calc(100vh*16/9));aspect-ratio:16/9;transform-origin:50% 50%;will-change:transform,opacity;overflow:hidden;border-radius:6px;box-shadow:0 12px 50px rgba(0,0,0,.6)}'+
'#sinkZoom img{position:absolute;inset:0;width:100%;height:100%;display:block;-webkit-user-drag:none;user-select:none}'+
'#sinkZoom .sz-back{position:absolute;right:16px;top:60px;z-index:2;border:2px solid #351b0d;border-radius:9px;background:#e8c27a;color:#351b0d;font:700 14px/1 system-ui,sans-serif;padding:9px 14px;cursor:pointer;opacity:0;transition:opacity .4s ease}'+
'#sinkZoom.ready .sz-back{opacity:.92}#sinkZoom .sz-back:hover{opacity:1}';
document.head.appendChild(css);
var root=document.createElement('div');root.id='sinkZoom';root.setAttribute('data-tool-ui','1');
root.innerHTML='<div class="sz-stage"><img alt="Sudopera" draggable="false"><button type="button" class="sz-back" data-tool-ui="1">⬅ Nazad</button></div>';
document.body.appendChild(root);
var stage=root.querySelector('.sz-stage'),img=root.querySelector('img'),back=root.querySelector('.sz-back');
img.src=SRC;
var opened=false,busy=false;
// where the sink is on the screen now (to start the zoom from there)
function sinkRect(){
  try{
    var g=calibratedSinkGeometry(),b=sinkGeometryBounds(g.vertices),a=sceneToScreen(b.left,b.top),c=sceneToScreen(b.right,b.bottom);
    return {x:(a.x+c.x)/2,y:(a.y+c.y)/2,w:Math.max(40,c.x-a.x),h:Math.max(30,c.y-a.y)};
  }catch(e){return {x:innerWidth*.9,y:innerHeight*.15,w:innerWidth*.12,h:innerHeight*.12};}
}
function fromTransform(){
  var r=sinkRect(),sw=stage.offsetWidth||innerWidth,sh=stage.offsetHeight||innerHeight;
  var s=Math.max(.05,Math.min(r.w/sw*1.6,r.h/sh*1.6));
  return 'translate(-50%,-50%) translate('+(r.x-innerWidth/2).toFixed(1)+'px,'+(r.y-innerHeight/2).toFixed(1)+'px) scale('+s.toFixed(3)+')';
}
function open(){
  if(opened||busy)return;busy=true;opened=true;
  root.classList.add('on');
  stage.style.transition='none';stage.style.opacity='0';stage.style.transform=fromTransform();
  void stage.offsetWidth;
  // the zoom: the picture grows out of the place of the sink to the whole screen while the kitchen fades to dark
  stage.style.transition='transform '+DUR+'ms cubic-bezier(.22,.8,.2,1),opacity '+Math.round(DUR*.55)+'ms ease';
  root.classList.add('dark');stage.style.opacity='1';stage.style.transform='translate(-50%,-50%) scale(1)';
  setTimeout(function(){busy=false;root.classList.add('ready');},DUR);
}
function close(){
  if(!opened||busy)return;busy=true;root.classList.remove('ready','dark');
  stage.style.transition='transform '+Math.round(DUR*.75)+'ms cubic-bezier(.5,0,.8,.4),opacity '+Math.round(DUR*.6)+'ms ease '+Math.round(DUR*.2)+'ms';
  stage.style.opacity='0';stage.style.transform=fromTransform();
  setTimeout(function(){root.classList.remove('on');opened=false;busy=false;},DUR);
}
back.addEventListener('click',function(e){e.stopPropagation();close();});
root.addEventListener('pointerdown',function(e){if(e.target===root)close();});
['wheel','contextmenu'].forEach(function(t){root.addEventListener(t,function(e){e.preventDefault();e.stopPropagation();},{passive:false});});
window.addEventListener('keydown',function(e){if(opened&&e.key==='Escape'){e.stopPropagation();close();}},true);
window.CooksterSinkZoom={open:open,close:close,isOpen:function(){return opened;}};
})();
