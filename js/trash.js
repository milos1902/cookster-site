/* Cookster: the rubbish on the floor of the dirty kitchen (cans, rags, paper balls, bottles, broken pots): 20 single things (assets/effects/smece/o1..o20.webp),
   every one cut out of the picture made in ChatGPT and lying at its own place of the 1672 x 941 scene.
   With EMPTY hands: the cursor over a thing makes it pop up a little and settle back (no glow); a click takes it: it rushes towards the middle of the screen (towards the eyes of the player), grows fast and does not stop there,
   it flies through and is gone. The leaves are NOT here: they stay on the floor (they are in the dirty picture) and are swept with the broom.
   State: localStorage 'cookster.trash.v2' (the numbers of the things already taken); "Nova igra" brings all of them back (event cookster:kitchen-restart from kitchen-clean.js). ?cistakuhinja = no rubbish. */
(function(){
'use strict';
if(window.CooksterTrash)return;
var KEY='cookster.trash.v2';
// id, x, y, w, h of the picture (the thing and its shadow)
var T=[[1,324,0,115,135],[2,413,25,149,98],[3,524,52,131,118],[4,584,32,148,114],[5,226,70,136,104],[6,362,86,179,113],[7,104,336,200,157],[8,192,240,133,130],[9,48,455,193,145],[10,139,640,88,75],
 [11,196,616,119,91],[12,1243,668,139,117],[13,178,679,111,65],[14,254,697,146,128],[15,970,676,226,177],[16,1169,734,164,150],[17,1303,758,196,137],[18,1369,678,156,129],[19,1514,693,87,95],[20,1540,674,90,73]]
 .map(function(a){return {id:a[0],x:a[1],y:a[2],w:a[3],h:a[4],a:null};});
var els={},gone={},sc=null,hover=0;
function load(){try{var a=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(a))a.forEach(function(i){gone[i]=1;});}catch(e){}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(Object.keys(gone).map(Number)));}catch(e){}}
function noRubbish(){try{return localStorage.getItem('cookster.kitchen-dirt.v1')==='clean';}catch(e){return false;}}
function build(){
  sc=document.getElementById('scene');if(!sc||els[T[0].id]||noRubbish())return;
  var css=document.createElement('style');css.textContent='.trash-obj{position:absolute;pointer-events:none;z-index:27}';
  document.head.appendChild(css);
  T.forEach(function(o){
    if(gone[o.id])return;
    var im=new Image();im.className='trash-obj';im.draggable=false;im.alt='';im.setAttribute('aria-hidden','true');
    im.style.cssText='left:'+o.x+'px;top:'+o.y+'px;width:'+o.w+'px;height:'+o.h+'px';
    im.onload=function(){      // the alpha of the picture: the click counts only on the thing itself (not on the empty corner of its picture)
      try{var c=document.createElement('canvas');c.width=o.w;c.height=o.h;var g=c.getContext('2d');g.drawImage(im,0,0,o.w,o.h);o.a=g.getImageData(0,0,o.w,o.h).data;}catch(e){o.a=null;}
    };
    im.src='assets/effects/smece/o'+o.id+'.webp?v=1';
    sc.appendChild(im);els[o.id]=im;
  });
}
function scenePt(e){var R=sc.getBoundingClientRect(),k=R.width/1672;return {x:(e.clientX-R.left)/k,y:(e.clientY-R.top)/k};}
function opaqueAt(o,px,py){      // is there a (solid enough) pixel of the thing around this point (5 px around, so it is easy to hit)
  if(!o.a)return true;var cx=Math.round(px-o.x),cy=Math.round(py-o.y);
  for(var dy=-5;dy<=5;dy+=2)for(var dx=-5;dx<=5;dx+=2){var x=cx+dx,y=cy+dy;if(x<0||y<0||x>=o.w||y>=o.h)continue;if(o.a[(y*o.w+x)*4+3]>110)return true;}
  return false;
}
function thingAt(e){
  if(!sc)return 0;var p=scenePt(e);
  for(var i=T.length-1;i>=0;i--){var o=T[i];if(gone[o.id]||!els[o.id])continue;
    if(p.x>=o.x&&p.x<=o.x+o.w&&p.y>=o.y&&p.y<=o.y+o.h&&opaqueAt(o,p.x,p.y))return o.id;}
  return 0;
}
function ui(e){var t=e&&e.target;return !!(t&&t.closest&&t.closest('button,input,select,textarea,a,label,[data-tool-ui],#hud,#gameClock,#modal,#modalShade,#quickToolWheel,.edge-arrow,#nbBox'));}      // a button or a panel over the thing: the click belongs to it
function blocked(){
  try{if(typeof holding!=='undefined'&&holding)return true;}catch(e){}
  var c=document.body.classList;if(c.contains('pantry-open')||c.contains('garden-open')||c.contains('market-open'))return true;
  try{if(window.CooksterTavern&&CooksterTavern.isOpen===true)return true;}catch(e){}
  return false;
}
function pop(el){try{el.animate([{transform:'scale(1)',offset:0},{transform:'scale(1.13)',offset:.4,easing:'ease-out'},{transform:'scale(1)',offset:1}],{duration:300,easing:'ease-in-out'});}catch(e){}}
function left(){return T.filter(function(o){return !gone[o.id];}).length;}
function take(id){
  var el=els[id],o=T[id-1];gone[id]=1;save();delete els[id];
  el.getAnimations().forEach(function(a){a.cancel();});el.style.transition='none';el.style.zIndex='9000';el.style.transformOrigin='50% 50%';
  // towards the middle of the screen (the eyes), faster and faster, growing; it does not stop in the middle: it flies through and is gone
  var c=scenePt({clientX:innerWidth/2,clientY:innerHeight/2}),dx=c.x-(o.x+o.w/2),dy=c.y-(o.y+o.h/2);
  var an=el.animate([
    {transform:'translate(0,0) scale(1)',opacity:1,offset:0},
    {transform:'translate('+(dx*.62)+'px,'+(dy*.62)+'px) scale(2.2)',opacity:1,offset:.5},
    {transform:'translate('+dx+'px,'+dy+'px) scale(7)',opacity:1,offset:.82},
    {transform:'translate('+dx+'px,'+dy+'px) scale(16)',opacity:0,offset:1}
  ],{duration:650,fill:'forwards',easing:'cubic-bezier(.55,0,.9,.55)'});
  an.onfinish=function(){if(el.parentNode)el.parentNode.removeChild(el);};
  setTimeout(function(){if(el.parentNode)el.parentNode.removeChild(el);},1000);
  try{window.dispatchEvent(new CustomEvent('cookster:trash-taken',{detail:{id:id,left:left()}}));}catch(e){}
}
['pointerdown','mousedown','click','pointerup'].forEach(function(t){
  window.addEventListener(t,function(e){
    if(e.button!==0&&t!=='click'&&t!=='pointerup')return;
    if(blocked()||ui(e))return;var id=thingAt(e);if(!id)return;
    e.stopImmediatePropagation();e.preventDefault();
    if(t==='pointerdown')take(id);
  },true);
});
window.addEventListener('pointermove',function(e){
  if(!sc)return;var id=(blocked()||ui(e))?0:thingAt(e);
  if(id!==hover){hover=id;if(id&&els[id])pop(els[id]);}      // no glow (it caught the shadows too): the thing only pops up a little and settles back
},true);
function restart(){gone={};save();Object.keys(els).forEach(function(k){if(els[k].parentNode)els[k].parentNode.removeChild(els[k]);});els={};T.forEach(function(o){o.a=null;});build();}
window.addEventListener('cookster:kitchen-restart',restart);
function init(){load();build();}
if(document.readyState==='complete')setTimeout(init,500);else window.addEventListener('load',function(){setTimeout(init,500);});
window.CooksterTrash={left:left,total:T.length,restart:restart,take:take};
})();
