/* The window "Kuhinjski elementi" (the parchment, js/ke-pergament.js) is a cloth stretched between two rolls. A click on the dishes icon: the page is there AT ONCE in the middle of the screen as a thin
   strip between the two rolls, and the rolls run apart (0.3 s) and stretch the cloth; the rolls STAY on the top and the bottom edge while the window is open. When it is closed the rolls come together
   and the cloth folds into them, and the window is gone the moment they meet (it does not stop in the middle). The screen does not darken first: the dark background comes in after the page has opened
   and goes out while it closes. GSAP does the movement; mo.js (assets/vendor/mo.umd.js, MIT) adds a few sparks of dust at the corners when it opens (only if loaded).
   Cloth in the picture (1600x1100): x 42..1559, y 44..1061. Only the equipment window; "Piće" stays as it was. ?bezanimacije switches it off. */
(function(){
if(/[?&]bezanimacije/.test(location.search))return;
var DUR=.3,DARK=.22,CX0=42/1600,CX1=1559/1600,CY0=46/1100,CY1=1059/1100;
var st=document.createElement('style');      // while the cloth is being opened / closed the shadows inside the page are off (they were drawn again in every frame and the cloth stuttered) and the page is its own layer
st.textContent='body.ke-anim #kePg{will-change:transform,clip-path;transform:translateZ(0)}body.ke-anim #kePg *:not(.pg-bg){filter:none!important;transition:none!important}';
document.head.appendChild(st);
var was=false,fx=null,top=null,bot=null,sc=null,closing=false,orig=null;
function target(){return document.body.classList.contains('ke-pg-on')?document.getElementById('kePg'):null;}
function layer(){if(fx)return fx;fx=document.createElement('div');fx.id='keFx';fx.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:65001';document.body.appendChild(fx);return fx;}
var ROD='assets/ui/pergament/pg_sipka.webp',RR=31/1935;      // the picture of the wooden rod (1935x31): the rolls of the cloth
function rod(){
  var d=document.createElement('div');d.className='ke-rod';
  d.style.cssText='position:fixed;background:url('+ROD+') 0 0/100% 100% no-repeat;filter:drop-shadow(0 3px 4px rgba(30,14,4,.5));will-change:transform';
  layer().appendChild(d);return d;
}
function geom(el){var r=el.getBoundingClientRect(),W=r.width,H=r.height;
  return {r:r,W:W,H:H,x0:r.left+W*CX0,x1:r.left+W*CX1,yT:r.top+H*CY0,yB:r.top+H*CY1,cy:r.top+H/2,h:Math.max(9,W*.0105)};}
function put(g,p){      // p: 0 = the rolls together in the middle, 1 = at the edges; the cloth shows between them
  var yT=g.cy+(g.yT-g.cy)*p,yB=g.cy+(g.yB-g.cy)*p;
  var rw=g.x1-g.x0+g.W*.012,rh=rw*RR;      // the rods are a little wider than the cloth
  [top,bot].forEach(function(d,i){var y=i?yB:yT;d.style.left=g.x0-g.W*.006+'px';d.style.width=rw+'px';d.style.height=rh+'px';d.style.top=y-rh/2+'px';});
  var t=Math.max(0,yT-g.r.top),b=Math.max(0,g.r.bottom-yB);
  g.el.style.clipPath='inset('+t+'px 0px '+b+'px 0px)';
}
function dust(par,x,y,delay){
  if(!window.mojs)return;
  try{new mojs.Burst({parent:par,left:0,top:0,x:x,y:y,radius:{6:30},count:6,angle:{0:40},degree:360,timeline:{delay:delay||0},
    children:{shape:'circle',fill:['#f3e3bd','#fff6dc','#e2bb7c'],radius:{4:0},duration:300,easing:'cubic.out'}}).replay();}catch(e){}
}
function animOn(){document.body.classList.add('ke-anim');}
function animOff(){document.body.classList.remove('ke-anim');}
function clean(){animOff();if(top){top.remove();top=null;}if(bot){bot.remove();bot=null;}var el=document.getElementById('kePg');if(el){el.style.clipPath='';el.style.pointerEvents='';}closing=false;}
function run(el,from,to,ease,done){
  var g=geom(el);g.el=el;var o={p:from};
  put(g,from);
  return gsap.to(o,{p:to,duration:DUR,ease:ease,onUpdate:function(){put(g,o.p);},onComplete:done});
}
function open(){
  var el=target();if(!el||!sc)return;
  clean();el.style.clipPath='';var r=el.getBoundingClientRect();if(!r.width)return;
  if(sc.animate)sc.animate([{backgroundColor:'rgba(22,12,7,0)',backdropFilter:'blur(0px)',webkitBackdropFilter:'blur(0px)'}],      // one keyframe: the end is the real look of the scene
    {duration:DARK*1000,delay:DUR*1000,easing:'linear',fill:'backwards',composite:'replace'});
  if(!window.gsap){return;}
  animOn();top=rod();bot=rod();
  run(el,0,1,'back.out(1.15)',function(){animOff();var g=geom(el),dl=document.createElement('div');layer().appendChild(dl);      // mo.js leaves its little elements behind: they are taken away after the dust is gone (they piled up and the window got slower)
    dust(dl,g.x0,g.yT,0);dust(dl,g.x1,g.yT,40);dust(dl,g.x0,g.yB,60);dust(dl,g.x1,g.yB,100);setTimeout(function(){dl.remove();},900);});
}
function closeAnimated(){
  var el=target();
  if(!el||!sc||!sc.classList.contains('open')||!window.gsap||!top||closing||/[?&]bezanimacije/.test(location.search))return false;
  closing=true;animOn();el.style.pointerEvents='none';
  var an=sc.animate?sc.animate([{backgroundColor:'rgba(22,12,7,0)',backdropFilter:'blur(0px)',webkitBackdropFilter:'blur(0px)'}],{duration:DUR*1000,easing:'linear',fill:'forwards',composite:'replace'}):null;
  run(el,1,0,'power2.in',function(){clean();orig.apply(window,[]);if(an)an.cancel();});      // it closes at the very moment the rolls meet
  return true;
}
function prewarm(){      // the pictures of the window are loaded and decoded in the background after the start, so the first opening does not wait for them
  var P='assets/ui/pergament/',list=[P+'pg_sipka.webp',P+'strana_kuhinjski_elementi_prazna.webp?v=2',P+'pg_kartica_posude_n_bez.png',P+'pg_kartica_posude_h_bez.png',P+'kartica_opis_ranac.png'];
  try{var A=window.CooksterItemArt||{};Object.keys(A).forEach(function(k){list.push(A[k]);});}catch(e){}
  try{if(typeof KITCHEN_EQUIPMENT!=='undefined')KITCHEN_EQUIPMENT.forEach(function(d){if(d.src&&list.indexOf(d.src)<0)list.push(d.src);});}catch(e){}
  var i=0;(function next(){if(i>=list.length)return;var im=new Image();im.decoding='async';im.src=list[i++];
    var go=function(){setTimeout(next,40);};(im.decode?im.decode().then(go,go):go());})();      // one after another so the game does not stutter
  window.__kePrewarm=list.length;
}
function init(){
  sc=document.getElementById('kitchenElementsScene');if(!sc)return;
  orig=window.closeKitchenElements;
  if(typeof orig==='function')window.closeKitchenElements=function(){if(closeAnimated())return;return orig.apply(this,arguments);};
  new MutationObserver(function(){var o=sc.classList.contains('open');if(o&&!was)open();if(!o&&was)clean();was=o;}).observe(sc,{attributes:true,attributeFilter:['class']});
  (window.requestIdleCallback||function(f){setTimeout(f,1500);})(function(){setTimeout(prewarm,800);});
  window.addEventListener('resize',function(){var el=target();if(el&&top&&!closing){var g=geom(el);g.el=el;put(g,1);}});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
