/* The window "Kuhinjski elementi" (the parchment, js/ke-pergament.js) unrolls from the icon that was clicked (0.5 s), like a scroll: it appears folded on the icon and, while it travels to the middle, it unfolds (from the middle up and down).
   Only for the dishes icon (dock-new.js, game-menu.js, old hud button); "Piće" stays as it was. The place of the last press is remembered, the open window is watched (class "open" of #kitchenElementsScene).
   GSAP does the movement (if it is missing, the same is done with the Web Animations API). ?bezanimacije switches it off. */
(function(){
if(/[?&]bezanimacije/.test(location.search))return;
var DUR=.5,px=null,py=null,was=false;
document.addEventListener('pointerdown',function(e){px=e.clientX;py=e.clientY;},true);
function target(){return document.body.classList.contains('ke-pg-on')?document.getElementById('kePg'):null;}      // only the parchment (equipment), not the drinks window
function iconCenter(){      // the dishes icon of the menu (its round hotspot); if it cannot be found, the place of the last press
  var bs=document.querySelectorAll('button[aria-label="Kuhinjski elementi"]'),i,r;
  for(i=0;i<bs.length;i++){r=bs[i].getBoundingClientRect();if(r.width>4&&r.height>4&&r.bottom>0&&r.right>0&&r.left<innerWidth&&r.top<innerHeight)return [r.left+r.width/2,r.top+r.height/2];}
  return [px==null?60:px,py==null?innerHeight-60:py];
}
function unroll(sc){
  var el=target();if(!el)return;
  el.style.transform='';var r=el.getBoundingClientRect();if(!r.width)return;
  var c=iconCenter(),dx=c[0]-(r.left+r.width/2),dy=c[1]-(r.top+r.height/2);
  // it appears folded (small and thin) on the icon and travels to the middle while it unfolds
  var from={x:dx,y:dy,scale:.08,opacity:1,clipPath:'inset(46% 0% 46% 0%)',transformOrigin:'50% 50%'},to={x:0,y:0,scale:1,clipPath:'inset(0% 0% 0% 0%)'};
  var done=function(){el.style.transform='';el.style.opacity='';el.style.clipPath='';el.style.transformOrigin='';};
  if(window.gsap){gsap.killTweensOf(el);
    gsap.fromTo(el,from,Object.assign({duration:DUR,ease:'power2.inOut',onComplete:done},to));}
  else if(el.animate){var a=el.animate([{transform:'translate('+dx+'px,'+dy+'px) scale(.08)',clipPath:from.clipPath},{transform:'none',clipPath:to.clipPath}],{duration:DUR*1000,easing:'cubic-bezier(.4,0,.2,1)'});a.onfinish=done;}
  if(window.gsap){gsap.fromTo(sc,{backgroundColor:'rgba(22,12,7,0)'},{backgroundColor:'rgba(22,12,7,.72)',duration:DUR*.8,ease:'none',onComplete:function(){sc.style.backgroundColor='';}});}
}
function init(){
  var sc=document.getElementById('kitchenElementsScene');if(!sc)return;
  new MutationObserver(function(){var o=sc.classList.contains('open');if(o&&!was)unroll(sc);was=o;}).observe(sc,{attributes:true,attributeFilter:['class']});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
