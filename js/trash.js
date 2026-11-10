/* Cookster: the rubbish on the floor of the dirty kitchen (cans, rags, paper balls, bottles, broken pots).
   Six heaps of 3-4 things (assets/effects/smece/g1..g6.webp, cut out of the picture made in ChatGPT; every heap is at its own place of the 1672 x 941 scene).
   With EMPTY hands a click on a heap takes the whole heap at once (it lights up for a moment and fades away). The leaves stay on the floor: the broom sweeps them (they are in the dirty picture).
   State: localStorage 'cookster.trash.v1' (the numbers of the heaps already taken); "Nova igra" brings all of them back (event cookster:kitchen-restart from kitchen-clean.js). ?cistakuhinja = no rubbish. */
(function(){
'use strict';
if(window.CooksterTrash)return;
var KEY='cookster.trash.v1',BASKET={x:1578,y:842};
// x,y,w,h of the picture of the heap; p = the boxes of the single things (for the click)
var HEAPS=[
 {id:1,x:247,y:5,w:275,h:165,p:[[249,83,83,68],[341,7,179,161]]},
 {id:2,x:426,y:36,w:287,h:116,p:[[428,38,117,70],[556,79,83,71],[604,40,107,73]]},
 {id:3,x:76,y:277,w:226,h:302,p:[[218,279,82,70],[99,338,174,123],[78,475,138,102]]},
 {id:4,x:174,y:629,w:209,h:165,p:[[176,631,111,65],[212,687,53,41],[293,713,88,79]]},
 {id:5,x:1006,y:672,w:362,h:196,p:[[1008,685,162,134],[1250,674,116,92],[1208,752,111,114]]},
 {id:6,x:1335,y:681,w:282,h:201,p:[[1400,701,114,85],[1337,790,177,129],[1533,683,82,68]]}
];
var els={},gone={},sc=null,hover=0;
function load(){try{var a=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(a))a.forEach(function(i){gone[i]=1;});}catch(e){}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(Object.keys(gone).map(Number)));}catch(e){}}
function noRubbish(){try{return localStorage.getItem('cookster.kitchen-dirt.v1')==='clean';}catch(e){return false;}}
function build(){
  sc=document.getElementById('scene');if(!sc||els[1]||noRubbish())return;
  var css=document.createElement('style');css.textContent='.trash-heap{position:absolute;pointer-events:none;z-index:27;transition:transform .55s cubic-bezier(.5,0,.8,.4),opacity .55s ease,filter .15s ease}.trash-heap.hov{filter:brightness(1.25) drop-shadow(0 0 6px rgba(255,236,170,.95))}';
  document.head.appendChild(css);
  HEAPS.forEach(function(h){
    if(gone[h.id])return;
    var im=document.createElement('img');im.className='trash-heap';im.src='assets/effects/smece/g'+h.id+'.webp?v=1';im.draggable=false;im.alt='';im.setAttribute('aria-hidden','true');
    im.style.cssText='left:'+h.x+'px;top:'+h.y+'px;width:'+h.w+'px;height:'+h.h+'px';
    sc.appendChild(im);els[h.id]=im;
  });
}
function scenePt(e){var R=sc.getBoundingClientRect(),k=R.width/1672;return {x:(e.clientX-R.left)/k,y:(e.clientY-R.top)/k};}
function heapAt(e){
  if(!sc)return 0;var p=scenePt(e);
  for(var i=0;i<HEAPS.length;i++){var h=HEAPS[i];if(gone[h.id]||!els[h.id])continue;
    for(var j=0;j<h.p.length;j++){var b=h.p[j];if(p.x>=b[0]&&p.x<=b[0]+b[2]&&p.y>=b[1]&&p.y<=b[1]+b[3])return h.id;}}
  return 0;
}
function ui(e){var t=e&&e.target;return !!(t&&t.closest&&t.closest('button,input,select,textarea,a,label,[data-tool-ui],#hud,#gameClock,#modal,#modalShade,#quickToolWheel,.edge-arrow,#nbBox'));}      // a button or a panel over the heap: the click belongs to it
function blocked(){
  try{if(typeof holding!=='undefined'&&holding)return true;}catch(e){}
  var c=document.body.classList;if(c.contains('pantry-open')||c.contains('garden-open')||c.contains('market-open'))return true;
  try{if(window.CooksterTavern&&CooksterTavern.isOpen===true)return true;}catch(e){}
  try{if(window.CooksterQuickWheel&&CooksterQuickWheel.isOpen&&CooksterQuickWheel.isOpen())return true;}catch(e){}
  return false;
}
function left(){return HEAPS.filter(function(h){return !gone[h.id];}).length;}
function take(id){
  var el=els[id],h=HEAPS[id-1];gone[id]=1;save();delete els[id];
  el.classList.remove('hov');el.style.transition='none';el.style.transformOrigin='50% 60%';
  // only a short glow and the heap is gone (no flying): it lights up a little and fades
  var an=el.animate([
    {filter:'brightness(1.25) drop-shadow(0 0 6px rgba(255,236,170,.95))',opacity:1,offset:0},
    {filter:'brightness(1.6) drop-shadow(0 0 12px rgba(255,240,190,1))',opacity:.9,offset:.35},
    {filter:'brightness(1.8) drop-shadow(0 0 16px rgba(255,240,190,.8))',opacity:0,offset:1}
  ],{duration:380,fill:'forwards',easing:'ease-out'});
  an.onfinish=function(){if(el.parentNode)el.parentNode.removeChild(el);};
  setTimeout(function(){if(el.parentNode)el.parentNode.removeChild(el);},900);
  try{if(window.CooksterNarration)CooksterNarration.sub(left()?'Smeće pokupljeno. Još hrpa: '+left()+'.':'Sve smeće je pokupljeno. Lišće ostaje metli.',2600);}catch(e){}
  try{window.dispatchEvent(new CustomEvent('cookster:trash-taken',{detail:{id:id,left:left()}}));}catch(e){}
}
['pointerdown','mousedown','click','pointerup'].forEach(function(t){
  window.addEventListener(t,function(e){
    if(e.button!==0&&t!=='click'&&t!=='pointerup')return;
    if(blocked()||ui(e))return;var id=heapAt(e);if(!id)return;
    e.stopImmediatePropagation();e.preventDefault();
    if(t==='pointerdown')take(id);
  },true);
});
window.addEventListener('pointermove',function(e){
  if(!sc)return;var id=(blocked()||ui(e))?0:heapAt(e);
  if(id!==hover){if(hover&&els[hover])els[hover].classList.remove('hov');hover=id;if(id&&els[id])els[id].classList.add('hov');}
},true);
function restart(){gone={};save();Object.keys(els).forEach(function(k){if(els[k].parentNode)els[k].parentNode.removeChild(els[k]);});els={};build();}
window.addEventListener('cookster:kitchen-restart',restart);
function init(){load();build();}
if(document.readyState==='complete')setTimeout(init,500);else window.addEventListener('load',function(){setTimeout(init,500);});
window.CooksterTrash={left:left,total:HEAPS.length,restart:restart,take:take};
})();
