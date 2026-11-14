/* The window "Kuhinjski elementi" (the parchment, js/ke-pergament.js) unrolls from the icon that was clicked (0.5 s), like a scroll: it appears folded on the icon and, while it travels to the middle, it unfolds (from the middle up and down).
   Only for the dishes icon (dock-new.js, game-menu.js, old hud button); "Piće" stays as it was. The place of the last press is remembered, the open window is watched (class "open" of #kitchenElementsScene).
   GSAP does the movement (if it is missing, the same is done with the Web Animations API); mo.js (assets/vendor/mo.umd.js, MIT) adds the little burst of sparks and a ring on the icon at the start and the dust at the corners of the page when it lands (only if it is loaded). ?bezanimacije switches it off. */
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
var fx=null,bIcon=null,rIcon=null,bL=null,bR=null;
function fxLayer(){if(fx)return fx;fx=document.createElement('div');fx.id='keFx';fx.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:65001';document.body.appendChild(fx);return fx;}
function sparks(x,y,n,rad,col,size,delay){return new mojs.Burst({parent:fxLayer(),left:0,top:0,x:x,y:y,radius:{[rad*.4]:rad},count:n,angle:{0:30},degree:360,timeline:{delay:delay||0},
  children:{shape:'circle',fill:col,radius:{[size]:0},duration:480,easing:'cubic.out',delay:0}});}
function fxStart(c){      // sparks and a ring on the icon
  if(!window.mojs)return;
  try{
    sparks(c[0],c[1],9,60,['#f6e3b4','#f2c35b','#fff6dc'],5).replay();
    new mojs.Shape({parent:fxLayer(),left:0,top:0,x:c[0],y:c[1],shape:'circle',fill:'none',stroke:'#f6d98a',strokeWidth:{5:0},radius:{14:48},opacity:{1:0},duration:420,easing:'cubic.out'}).replay();
  }catch(e){}
}
function fxLand(r){      // dust at the two top corners of the page when it lands
  if(!window.mojs)return;
  try{
    sparks(r.left+r.width*.04,r.top+r.height*.06,6,34,['#e9d7ad','#fff3dc'],4,0).replay();
    sparks(r.right-r.width*.04,r.top+r.height*.06,6,34,['#e9d7ad','#fff3dc'],4,60).replay();
  }catch(e){}
}
function unroll(sc){
  var el=target();if(!el)return;
  el.style.transform='';var r=el.getBoundingClientRect();if(!r.width)return;
  var c=iconCenter(),dx=c[0]-(r.left+r.width/2),dy=c[1]-(r.top+r.height/2);
  // it appears folded (small and thin) on the icon and travels to the middle while it unfolds
  var from={x:dx,y:dy,scale:.08,opacity:1,clipPath:'inset(46% 0% 46% 0%)',transformOrigin:'50% 50%'},to={x:0,y:0,scale:1,clipPath:'inset(0% 0% 0% 0%)'};
  var done=function(){el.style.transform='';el.style.opacity='';el.style.clipPath='';el.style.transformOrigin='';};
  fxStart(c);
  if(window.gsap){gsap.killTweensOf(el);
    gsap.fromTo(el,from,Object.assign({duration:DUR,ease:'power2.inOut',onComplete:function(){done();fxLand(el.getBoundingClientRect());}},to));}
  else if(el.animate){var a=el.animate([{transform:'translate('+dx+'px,'+dy+'px) scale(.08)',clipPath:from.clipPath},{transform:'none',clipPath:to.clipPath}],{duration:DUR*1000,easing:'cubic-bezier(.4,0,.2,1)'});a.onfinish=function(){done();fxLand(el.getBoundingClientRect());};}
  if(window.gsap){gsap.fromTo(sc,{backgroundColor:'rgba(22,12,7,0)'},{backgroundColor:'rgba(22,12,7,.72)',duration:DUR*.8,ease:'none',onComplete:function(){sc.style.backgroundColor='';}});}
}
function init(){
  var sc=document.getElementById('kitchenElementsScene');if(!sc)return;
  new MutationObserver(function(){var o=sc.classList.contains('open');if(o&&!was)unroll(sc);was=o;}).observe(sc,{attributes:true,attributeFilter:['class']});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
