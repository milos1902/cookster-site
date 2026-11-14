/* The window "Kuhinjski elementi" (the parchment, js/ke-pergament.js) unrolls from the icon that was clicked (0.5 s), like a scroll: it grows from the icon and opens from the middle up and down.
   Only for the dishes icon (dock-new.js, game-menu.js, old hud button); "Piće" stays as it was. The place of the last press is remembered, the open window is watched (class "open" of #kitchenElementsScene).
   GSAP does the movement (if it is missing, the same is done with the Web Animations API). ?bezanimacije switches it off. */
(function(){
if(/[?&]bezanimacije/.test(location.search))return;
var DUR=.5,px=null,py=null,was=false;
document.addEventListener('pointerdown',function(e){px=e.clientX;py=e.clientY;},true);
function target(){return document.body.classList.contains('ke-pg-on')?document.getElementById('kePg'):null;}      // only the parchment (equipment), not the drinks window
function unroll(sc){
  var el=target();if(!el)return;
  var r=el.getBoundingClientRect();if(!r.width)return;
  var x=px==null?innerWidth/2:px,y=py==null?innerHeight:py;
  var ox=Math.max(0,Math.min(100,(x-r.left)/r.width*100)),oy=Math.max(0,Math.min(100,(y-r.top)/r.height*100));
  el.style.transformOrigin=ox+'% '+oy+'%';
  var from={scale:.12,opacity:0,clipPath:'inset(38% 0% 38% 0%)'},to={scale:1,opacity:1,clipPath:'inset(0% 0% 0% 0%)'};
  var done=function(){el.style.transform='';el.style.opacity='';el.style.clipPath='';el.style.transformOrigin='';};
  if(window.gsap){gsap.killTweensOf(el);gsap.fromTo(el,from,Object.assign({duration:DUR,ease:'power3.out',onComplete:done},to));}
  else if(el.animate){var a=el.animate([{transform:'scale(.12)',opacity:0,clipPath:from.clipPath},{transform:'scale(1)',opacity:1,clipPath:to.clipPath}],{duration:DUR*1000,easing:'cubic-bezier(.2,.8,.2,1)'});a.onfinish=done;}
  if(window.gsap){gsap.fromTo(sc,{backgroundColor:'rgba(22,12,7,0)'},{backgroundColor:'rgba(22,12,7,.72)',duration:DUR*.8,ease:'none',onComplete:function(){sc.style.backgroundColor='';}});}
}
function init(){
  var sc=document.getElementById('kitchenElementsScene');if(!sc)return;
  new MutationObserver(function(){var o=sc.classList.contains('open');if(o&&!was)unroll(sc);was=o;}).observe(sc,{attributes:true,attributeFilter:['class']});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
