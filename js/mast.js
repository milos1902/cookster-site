/* Cookster: lard (domaca mast). The bucket of lard ("Kanta sa mascu", Kitchen elements) stays on the table (it is never empty).
   With the WOODEN SPOON in the hand a click on the bucket scoops a lump of lard: it appears on the spoon (data-mast-load="1").
   A click on a pan (a frying pan or a pot) with the loaded spoon puts the lump into the pan: it lies there as a white heap and, while the pan is hot, it SLOWLY melts:
   the heap shrinks into a shiny puddle and the melted lard is added to the oil of the pan (addOilAmountToVessel), as if oil had been poured in. A cold pan keeps the lump. */
(function(){
'use strict';
if(window.CooksterMast)return;
var BUCKET='kal_01_mast_kanta',LUMP_OIL=2.0,MELT_SECONDS=22;      // one lump = 2 "measures" of oil, melts in about 22 s of a good heat
function spoonHeld(){try{return typeof holding!=='undefined'&&holding&&holding.dataset&&holding.dataset.itemId==='kasika_mesanje'?holding:null;}catch(e){return null;}}
function blob(css){var d=document.createElement('div');d.className='mast-blob';d.style.cssText='position:absolute;pointer-events:none;border-radius:50% 46% 52% 48%/55% 50% 50% 45%;background:radial-gradient(ellipse at 38% 30%,#fffdf2 0%,#f3ead0 55%,#d9cda6 100%);box-shadow:inset -2px -3px 4px rgba(120,100,50,.35),0 1px 2px rgba(0,0,0,.25);'+css;return d;}
function showOnSpoon(sp,on){
  var o=sp.querySelector('.mast-on-spoon');
  if(on&&!o){o=blob('left:27%;top:5%;width:46%;height:17%;z-index:3');o.classList.add('mast-on-spoon');sp.appendChild(o);}
  if(!on&&o&&o.parentNode)o.parentNode.removeChild(o);
}
function isBucket(it){return !!it&&it.dataset&&it.dataset.itemId===BUCKET;}
function isPan(it){try{return !!it&&typeof isHeatableCookwareItem==='function'&&isHeatableCookwareItem(it);}catch(e){return false;}}
function putInPan(pan){
  var st=pan._mast=pan._mast||{left:0,el:null,puddle:null,oilGiven:0};
  st.left=Math.min(1.5,st.left+1);      // a second lump on the first one is allowed
  if(!st.el){
    st.puddle=blob('left:34%;top:50%;width:0;height:0;opacity:0;z-index:4;background:radial-gradient(ellipse,rgba(255,240,170,.55),rgba(255,224,130,.25) 70%,rgba(255,224,130,0) 100%);box-shadow:none');
    st.el=blob('left:38%;top:52%;width:24%;height:13%;z-index:5');
    pan.appendChild(st.puddle);pan.appendChild(st.el);
  }
  render(pan);
}
function render(pan){
  var st=pan._mast;if(!st||!st.el)return;var l=Math.max(0,Math.min(1,st.left)),m=1-l;
  st.el.style.width=(24*(.35+.65*l))+'%';st.el.style.height=(13*(.35+.65*l))+'%';st.el.style.left=(38+12*(1-(.35+.65*l)))+'%';st.el.style.opacity=l>.02?'1':'0';
  var pw=8+30*Math.min(1,m*1.4),ph=pw*.5;st.puddle.style.width=pw+'%';st.puddle.style.height=ph+'%';st.puddle.style.left=(50-pw/2)+'%';st.puddle.style.top=(58-ph/2)+'%';
  st.puddle.style.opacity=(Math.min(.9,m*1.6)*(l<.02?Math.max(0,1-(st.fade||0)):1)).toFixed(2);
}
function heatOf(pan){try{return +CooksterPan.read(pan).heat||0;}catch(e){return 0;}}
setInterval(function(){
  try{(typeof items!=='undefined'?items:[]).forEach(function(pan){
    var st=pan._mast;if(!st||!st.el)return;
    var h=heatOf(pan);
    if(st.left>0){
      var rate=Math.max(0,h-.12)/MELT_SECONDS*.25*1.8;      // per 250 ms tick
      var d=Math.min(st.left,rate);st.left-=d;
      var add=d*LUMP_OIL;if(add>0&&typeof addOilAmountToVessel==='function')addOilAmountToVessel(pan,add);
    }else{
      st.fade=(st.fade||0)+.02;      // the puddle slowly disappears into the pan (the oil of the pan has it now)
      if(st.fade>=1){[st.el,st.puddle].forEach(function(e){if(e&&e.parentNode)e.parentNode.removeChild(e);});pan._mast=null;return;}
    }
    render(pan);
  });}catch(e){}
},250);
window.addEventListener('pointerdown',function(e){
  if(e.button!==0)return;var sp=spoonHeld();if(!sp)return;
  var it=(typeof itemAt==='function')?itemAt(e.clientX,e.clientY):null;
  if(!it)return;
  if(isBucket(it)&&!sp.dataset.mastLoad){
    e.stopImmediatePropagation();e.preventDefault();
    sp.dataset.mastLoad='1';showOnSpoon(sp,true);return;
  }
  if(sp.dataset.mastLoad&&isPan(it)){
    e.stopImmediatePropagation();e.preventDefault();
    delete sp.dataset.mastLoad;showOnSpoon(sp,false);putInPan(it);return;
  }
},true);
['click','pointerup','mouseup'].forEach(function(t){window.addEventListener(t,function(e){var sp=spoonHeld();if(!sp)return;var it=(typeof itemAt==='function')?itemAt(e.clientX,e.clientY):null;if(isBucket(it)){e.stopImmediatePropagation();}},true);});
window.CooksterMast={BUCKET:BUCKET,put:putInPan,melting:function(p){return p._mast?p._mast.left:0;}};
})();
