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
var ID='kal_01_list_kupusa',N=8,STEP=.085,HINTS={start:'Klikni dva puta na donji deo lista da preklopiš nadev.',left:'Klikni na levu stranu lista.',right:'Klikni na desnu stranu lista.',roll:'Okreći točkić miša nagore da umotaš sarmu.'};
var FR=[];for(var i=1;i<=N;i++){var im=new Image();im.src='assets/sarma/f'+i+'.webp?v=1';FR.push(im);}
function toast(m){try{showToast(m);}catch(e){}}
function setup(el){
  if(el._sm)return;var st=el._sm={stage:0,roll:0,x:0,target:0,imgs:[],anim:0};
  var body=el.querySelector('.body');if(body)body.style.visibility='hidden';
  var host=document.createElement('div');host.className='sarma-frames';host.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none';
  for(var i=0;i<N;i++){var m=document.createElement('img');m.src=FR[i].src;m.draggable=false;m.alt='';m.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;object-fit:contain;opacity:0;filter:drop-shadow(1px 2px 2px rgba(30,15,0,.4))';host.appendChild(m);st.imgs.push(m);}
  el.appendChild(host);draw(el);
}
function draw(el){
  var st=el._sm,x=st.x;
  for(var i=0;i<N;i++){var d=Math.abs(x-i);st.imgs[i].style.opacity=d>=1?'0':(1-d).toFixed(3);}
  el.dataset.sarmaRolled=(st.stage>=4&&st.roll>=.995)?'1':'';
}
function targetOf(st){return st.stage<4?st.stage:4+3*st.roll;}
function go(el){      // the picture melts to the target (clicks: a short soft move; the wheel: at once)
  var st=el._sm;st.target=targetOf(st);cancelAnimationFrame(st.anim);
  (function step(){var d=st.target-st.x;if(Math.abs(d)<.01){st.x=st.target;draw(el);return;}st.x+=Math.sign(d)*Math.min(Math.abs(d),.09+Math.abs(d)*.12);draw(el);st.anim=requestAnimationFrame(step);})();
}
function over(e){var it=(typeof itemAt==='function')?itemAt(e.clientX,e.clientY):null;return it&&it.dataset&&it.dataset.itemId===ID?it:null;}
function relPos(el,e){var r=el.getBoundingClientRect();return {x:(e.clientX-r.left)/Math.max(1,r.width),y:(e.clientY-r.top)/Math.max(1,r.height)};}
// clicks
['pointerdown','mousedown','click','pointerup'].forEach(function(t){
  window.addEventListener(t,function(e){
    if(e.button!==0)return;
    try{if(typeof holding!=='undefined'&&holding)return;}catch(x){}
    var it=over(e);if(!it)return;setup(it);var st=it._sm,p=relPos(it,e),want=null;
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
  if(st.stage<4){toast(st.stage<2?HINTS.start:st.stage===2?HINTS.left:HINTS.right);return;}
  var dy=e.deltaMode===1?e.deltaY*33:e.deltaY;
  st.roll=Math.max(0,Math.min(1,st.roll+(-dy/100)*STEP));st.x=targetOf(st);st.target=st.x;draw(it);
},{capture:true,passive:false});
setInterval(function(){try{items.forEach(function(el){if(el.dataset&&el.dataset.itemId===ID&&!el._sm)setup(el);});}catch(e){}},500);
window.CooksterSarma={ID:ID,stage:function(el){return el._sm?el._sm.stage:0;}};
})();
