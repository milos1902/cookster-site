/* Cookster: rolling a sarma (the leaf "List kupusa (sarma)" of the Kitchen elements; the leaf lies on the table with the filling on its lower third).
   The steps (the pictures assets/sarma/f1..f8.webp, all on the same canvas, melt one into the next):
     1. two clicks on the LOWER part of the leaf: the bottom edge is folded over the filling (f1 -> f2 -> f3)
     2. a click on the LEFT half: the left side is folded in (f4)
     3. a click on the RIGHT half: the right side is folded in (f5)
     4. the mouse WHEEL up (about 12 clicks over the leaf; the scene does not zoom): the leaf is rolled up (f5 -> f8); wheel down unrolls it back to the packet
   A click on a part that is not asked for now goes to the game as always (the leaf is picked up). When the roll is finished: data-sarma-rolled="1". */
(function(){
'use strict';
if(window.CooksterSarma)return;
var ID='kal_01_list_kupusa',N=9,STEP=.085,HINTS={start:'Klikni dva puta na donji deo lista da preklopiš nadev.',left:'Klikni na levu stranu lista.',right:'Klikni na desnu stranu lista.',roll:'Okreći točkić miša nagore da umotaš sarmu.'};
// two looks of the sarma (every new leaf takes one of them by its number): the fat homemade sarma (assets/sarma/f0..f8) and the narrow one on an upright leaf (assets/sarma3/g0..g8)
var SETS=[{dir:'assets/sarma/f',pre:'f',scale:1},{dir:'assets/sarma3/g',pre:'g',scale:1.1}];
function hashStr(t){var h=2166136261;for(var i=0;i<t.length;i++){h^=t.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}h^=h>>>15;h=Math.imul(h,2246822519)>>>0;h^=h>>>13;return h>>>0;}
SETS.forEach(function(S){S.fr=[];for(var i=0;i<N;i++){var im=new Image();im.src=S.dir+i+'.webp?v=3';S.fr.push(im);}});
if(!document.getElementById('sarmaCss')){var css=document.createElement('style');css.id='sarmaCss';css.textContent='.contact-shadow-sprite.sarma-noshadow{display:none!important;visibility:hidden!important}.sarma-frames>img[data-off]{display:none!important}';document.head.appendChild(css);}
function toast(m){try{showToast(m);}catch(e){}}
function setup(el){
  if(el._sm)return;var set=SETS[hashStr(el.dataset.instanceId||'x')%SETS.length],FR=set.fr;
  var st=el._sm={set:set,filled:false,stage:0,roll:0,x:0,target:0,imgs:[],anim:0};
  var body=el.querySelector('.body');if(body){body.style.setProperty('display','none','important');body.removeAttribute('src');}      // the plain picture of the leaf is gone for good (it showed again behind the sarma when the item was picked up: the game copies the item for its ghost)
  var host=document.createElement('div');host.className='sarma-frames';host.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;transform-origin:50% 100%;transform:scale('+set.scale+')';
  for(var i=0;i<N;i++){var m=document.createElement('img');m.src=FR[i].src;m.draggable=false;m.alt='';m.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;object-fit:contain;opacity:0;filter:drop-shadow(1px 2px 2px rgba(30,15,0,.4))';host.appendChild(m);st.imgs.push(m);}
  el.appendChild(host);draw(el);
}
function draw(el){
  var st=el._sm,x=st.x;
  try{if(el._contactShadow)el._contactShadow.classList.add('sarma-noshadow');el.dataset.noSunShadow='1';}catch(e){}      // the shadow of the game stays at the foot of the box, far below the rolled sarma: the pictures carry their own soft shadow
  // the pictures are NOT cross-faded over a long way (two different folds at once looked like a ghost): one picture at a time, with a very short soft cut around the middle between two pictures
  var lo=Math.floor(x),f=x-lo,W=.16,a=f<.5-W?0:f>.5+W?1:(f-(.5-W))/(2*W);
  for(var i=0;i<N;i++){var o=i===lo?1-a:(i===lo+1?a:0);st.imgs[i].style.opacity=o.toFixed(3);if(o<.01)st.imgs[i].setAttribute('data-off','1');else st.imgs[i].removeAttribute('data-off');}      // the game forces opacity 1 on the pictures of its ghost copy (the item in the hand): a hidden frame must be display:none so it cannot show behind
  el.dataset.sarmaRolled=(st.filled&&st.stage>=4&&st.roll>=.995)?'1':'';el.dataset.sarmaFilled=st.filled?'1':'';
}
function targetOf(st){return !st.filled?0:(st.stage<4?1+st.stage:5+3*st.roll);}
function go(el){      // the picture melts to the target (clicks: a short soft move; the wheel: at once)
  var st=el._sm;st.target=targetOf(st);cancelAnimationFrame(st.anim);
  (function step(){var d=st.target-st.x;if(Math.abs(d)<.01){st.x=st.target;draw(el);return;}st.x+=Math.sign(d)*Math.min(Math.abs(d),.12);draw(el);st.anim=requestAnimationFrame(step);})();
}
function over(e){var it=(typeof itemAt==='function')?itemAt(e.clientX,e.clientY):null;return it&&it.dataset&&it.dataset.itemId===ID?it:null;}
function relPos(el,e){var r=el.getBoundingClientRect();return {x:(e.clientX-r.left)/Math.max(1,r.width),y:(e.clientY-r.top)/Math.max(1,r.height)};}
// clicks
['pointerdown','mousedown','click','pointerup'].forEach(function(t){
  window.addEventListener(t,function(e){
    if(e.button!==0)return;
    try{if(typeof holding!=='undefined'&&holding)return;}catch(x){}
    var it=over(e);if(!it)return;setup(it);var st=it._sm,p=relPos(it,e),want=null;
    if(!st.filled){if(t==='pointerdown'&&p.y>.5&&!window.CooksterNadevLoaded)toast(HINTS.fill);return;}      // an empty leaf: it is picked up as always; the filling is put with the spoon
    if(st.stage===0||st.stage===1){if(p.y>.5)want='bottom';}
    else if(st.stage===2){if(p.x<.5)want='left';else if(t==='pointerdown')toast(HINTS.left);}
    else if(st.stage===3){if(p.x>=.5)want='right';else if(t==='pointerdown')toast(HINTS.right);}
    if(!want)return;      // not a fold click: the game does what it does (the leaf is picked up)
    e.stopImmediatePropagation();e.preventDefault();
    if(t!=='pointerdown')return;
    st.stage++;go(it);
    toast(st.stage===1?'Još jednom na donji deo.':st.stage===2?'Nadev je preklopljen. '+HINTS.left:st.stage===3?'Leva strana je preklopljena. '+HINTS.right:'Obe strane su preklopljene. '+HINTS.roll);
  },true);
});
// the wheel: rolls the packet (only when the sides are folded)
window.addEventListener('wheel',function(e){
  try{if(typeof holding!=='undefined'&&holding)return;}catch(x){}
  var it=over(e);if(!it)return;setup(it);
  e.preventDefault();e.stopImmediatePropagation();
  var st=it._sm;
  if(!st.filled){toast(HINTS.fill);return;}
  if(st.stage<4){toast(st.stage<2?HINTS.start:st.stage===2?HINTS.left:HINTS.right);return;}
  var dy=e.deltaMode===1?e.deltaY*33:e.deltaY;
  st.roll=Math.max(0,Math.min(1,st.roll+(-dy/100)*STEP));st.x=targetOf(st);st.target=st.x;draw(it);
},{capture:true,passive:false});
setInterval(function(){try{items.forEach(function(el){if(el.dataset&&el.dataset.itemId===ID&&!el._sm)setup(el);});}catch(e){}},500);
window.CooksterSarma={ID:ID,stage:function(el){return el._sm?el._sm.stage:0;},
  leafAt:function(e){var it=over(e);if(it)setup(it);return it;},
  isFilled:function(el){return !!(el&&el._sm&&el._sm.filled);},
  fill:function(el){setup(el);var st=el._sm;if(st.filled)return false;st.filled=true;st.stage=0;st.roll=0;go(el);return true;}};
})();
