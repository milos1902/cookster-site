/* Cookster: rolling a sarma. A cabbage leaf ("List kupusa (sarma)" in the Kitchen elements) lies on the table with the filling on its lower third.
   The mouse WHEEL over the leaf rolls it (the wheel does not zoom the scene while the cursor is over the leaf): forward (up) = about 12 clicks go through the 8 pictures of the rolling
   (assets/sarma/f1..f8.webp: the flat leaf with the filling, the fold, the sides, the roll, the finished sarma), the pictures melt one into the next; back (down) = it unrolls.
   All 8 pictures have the same canvas, so nothing jumps. When the roll is finished the item gets data-sarma-rolled="1". */
(function(){
'use strict';
if(window.CooksterSarma)return;
var ID='kal_01_list_kupusa',STEP=.085,N=8;      // one notch of the wheel = 8.5 % of the rolling
var FR=[];for(var i=1;i<=N;i++){var im=new Image();im.src='assets/sarma/f'+i+'.webp?v=1';FR.push(im);}
function setup(el){
  if(el._sm)return;var st=el._sm={p:0,imgs:[]};
  var body=el.querySelector('.body');if(body)body.style.visibility='hidden';
  var host=document.createElement('div');host.className='sarma-frames';host.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none';
  for(var i=0;i<N;i++){var m=document.createElement('img');m.src=FR[i].src;m.draggable=false;m.alt='';m.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;object-fit:contain;opacity:0;filter:drop-shadow(1px 2px 2px rgba(30,15,0,.4))';host.appendChild(m);st.imgs.push(m);}
  el.appendChild(host);draw(el);
}
function draw(el){
  var st=el._sm,x=st.p*(N-1);      // 0..7: the position between the pictures
  for(var i=0;i<N;i++){var d=Math.abs(x-i);st.imgs[i].style.opacity=d>=1?'0':(1-d).toFixed(3);}
  el.dataset.sarmaRolled=st.p>=.995?'1':'';
}
function over(e){var it=(typeof itemAt==='function')?itemAt(e.clientX,e.clientY):null;return it&&it.dataset&&it.dataset.itemId===ID?it:null;}
window.addEventListener('wheel',function(e){
  try{if(typeof holding!=='undefined'&&holding)return;}catch(x){}
  var it=over(e);if(!it)return;setup(it);
  e.preventDefault();e.stopImmediatePropagation();
  var dy=e.deltaMode===1?e.deltaY*33:e.deltaY,st=it._sm;
  st.p=Math.max(0,Math.min(1,st.p+(-dy/100)*STEP));draw(it);
},{capture:true,passive:false});
setInterval(function(){try{items.forEach(function(el){if(el.dataset&&el.dataset.itemId===ID&&!el._sm)setup(el);});}catch(e){}},500);
window.CooksterSarma={set:function(el,p){setup(el);el._sm.p=p;draw(el);},ID:ID};
})();
