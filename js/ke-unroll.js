/* The window "Kuhinjski elementi" (the parchment, js/ke-pergament.js) opens and closes the normal way (at once, with all its shadows, the dark background as always). The only thing added: two wooden rods
   (the picture assets/ui/pergament/pg_sipka.webp) lie on the top and the bottom edge of the cloth while the window is open, as if the cloth were stretched between them.
   The pictures of the window are loaded and decoded in the background after the start (prewarm), so the first opening does not wait for them.
   Cloth in the picture (1600x1100): x 42..1559, y 44..1061. Only the equipment window; "Piće" stays as it was. ?bezanimacije switches the rods off. */
(function(){
if(/[?&]bezanimacije/.test(location.search))return;
var CX0=42/1600,CX1=1559/1600,CY0=46/1100,CY1=1059/1100,ROD='assets/ui/pergament/pg_sipka.webp',RR=31/1935;
var fx=null,top=null,bot=null,sc=null,was=false;
function target(){return document.body.classList.contains('ke-pg-on')?document.getElementById('kePg'):null;}
function layer(){if(fx)return fx;fx=document.createElement('div');fx.id='keFx';fx.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:65001';document.body.appendChild(fx);return fx;}
function rod(){var d=document.createElement('div');d.className='ke-rod';d.style.cssText='position:fixed;background:url('+ROD+') 0 0/100% 100% no-repeat;filter:drop-shadow(0 3px 4px rgba(30,14,4,.5))';layer().appendChild(d);return d;}
function place(){
  var el=target();if(!el||!top)return;
  var r=el.getBoundingClientRect(),W=r.width,H=r.height;if(!W)return;
  var x0=r.left+W*CX0,x1=r.left+W*CX1,rw=x1-x0+W*.012,rh=rw*RR;      // the rods are a little wider than the cloth
  [[top,r.top+H*CY0],[bot,r.top+H*CY1]].forEach(function(a){a[0].style.left=x0-W*.006+'px';a[0].style.width=rw+'px';a[0].style.height=rh+'px';a[0].style.top=a[1]-rh/2+'px';});
}
function clean(){if(top){top.remove();top=null;}if(bot){bot.remove();bot=null;}}
function open(){if(!target())return;clean();top=rod();bot=rod();place();}
function prewarm(){
  var P='assets/ui/pergament/',list=[P+'pg_sipka.webp',P+'strana_kuhinjski_elementi_prazna.webp?v=2',P+'pg_kartica_posude_n_bez.png',P+'pg_kartica_posude_h_bez.png',P+'kartica_opis_ranac.png'];
  try{var A=window.CooksterItemArt||{};Object.keys(A).forEach(function(k){list.push(A[k]);});}catch(e){}
  try{if(typeof KITCHEN_EQUIPMENT!=='undefined')KITCHEN_EQUIPMENT.forEach(function(d){if(d.src&&list.indexOf(d.src)<0)list.push(d.src);});}catch(e){}
  var i=0;(function next(){if(i>=list.length)return;var im=new Image();im.decoding='async';im.src=list[i++];
    var go=function(){setTimeout(next,40);};(im.decode?im.decode().then(go,go):go());})();      // one after another so the game does not stutter
}
function init(){
  sc=document.getElementById('kitchenElementsScene');if(!sc)return;
  new MutationObserver(function(){var o=sc.classList.contains('open');if(o&&!was)open();if(!o&&was)clean();was=o;}).observe(sc,{attributes:true,attributeFilter:['class']});
  (window.requestIdleCallback||function(f){setTimeout(f,1500);})(function(){setTimeout(prewarm,800);});
  window.addEventListener('resize',place);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
