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
var G={lump:{cx:.533,cy:.438,w:.113,h:.093},ell:{cx:.549,cy:.451,rx:.337,ry:.253}};      // the geometry of the pictures (fractions of the pan picture)
var FRAMES=['assets/fat/mast_tiganj_1.webp?v=1','assets/fat/mast_tiganj_2.webp?v=1','assets/fat/mast_tiganj_3.webp?v=1'];FRAMES.forEach(function(f){var i=new Image();i.src=f;});
function layer(src,css){var d=document.createElement('div');d.className='mast-layer';d.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;background:url('+src+') 0 0/100% 100% no-repeat;'+css;return d;}
var MAX_LUMPS=8,FULL=2.4;      // any number of spoons can be put in (up to 8 lumps at once); about 2.4 melted lumps cover the whole floor of the pan
function newLump(pan,st){
  var im=document.createElement('img');im.className='mast-layer';im.src='assets/fat/mast_grudva.webp?v=1';im.draggable=false;
  im.style.cssText='position:absolute;pointer-events:none;z-index:5;left:'+((G.lump.cx-G.lump.w/2)*100)+'%;top:'+((G.lump.cy-G.lump.h/2)*100)+'%;width:'+(G.lump.w*100)+'%;height:'+(G.lump.h*100)+'%';
  pan.appendChild(im);var n=st.lumps.length;
  st.lumps.push({el:im,left:1,x:(Math.random()-.5)*.28*(n?1:0),y:(Math.random()-.5)*.2*(n?1:0),vx:0,vy:0});
}
function putInPan(pan){
  var st=pan._mast=pan._mast||{lumps:[],els:null,F:0,fade:0};
  pan.dataset.mast='1';      // lard in the pan: the game's own picture of oil (the yellow puddle) is hidden, only the pictures of the lard are seen
  if(!document.getElementById('mastCss')){var cs=document.createElement('style');cs.id='mastCss';cs.textContent='.item[data-mast="1"] .cookster-oil-surface{display:none!important}';document.head.appendChild(cs);}
  if(!st.els){
    st.els=[layer(FRAMES[0],'z-index:4;opacity:0'),layer(FRAMES[1],'z-index:4;opacity:0'),layer(FRAMES[2],'z-index:4;opacity:0')];
    st.els.forEach(function(e){pan.appendChild(e);});
  }
  st.fade=0;if(st.lumps.length<MAX_LUMPS)newLump(pan,st);else st.lumps[0].left=Math.min(1,st.lumps[0].left+.5);
  render(pan);
}
// every lump slides over the floor of the pan while it melts (a slow wandering on the hot iron), shrinks, but stays WHITE: it never darkens. The more lard has melted, the wider the puddle (three pictures cross-fade).
function render(pan){
  var st=pan._mast;if(!st||!st.els)return;var m=Math.min(1,st.F/FULL);
  st.els[0].style.opacity=(m<.02?0:(m<.5?m/.5:Math.max(0,1-(m-.5)/.45))).toFixed(2);
  st.els[1].style.opacity=(m<.3?0:m<.75?Math.min(1,(m-.3)/.3):Math.max(0,1-(m-.75)/.25)).toFixed(2);
  st.els[2].style.opacity=(m<.7?0:Math.min(1,(m-.7)/.3)).toFixed(2);
  st.lumps.forEach(function(L){
    var sc=Math.max(.22,L.left),op=L.left<.03?0:Math.min(1,L.left*1.8);
    L.el.style.transform='translate('+(L.x*100).toFixed(2)+'%,'+(L.y*100).toFixed(2)+'%) scale('+sc.toFixed(2)+')';L.el.style.opacity=op.toFixed(2);L.el.style.filter='none';
  });
}
function heatOf(pan){try{return +CooksterPan.read(pan).heat||0;}catch(e){return 0;}}
setInterval(function(){
  try{(typeof items!=='undefined'?items:[]).forEach(function(pan){
    var st=pan._mast;if(!st||!st.els)return;
    var h=heatOf(pan),any=false;
    st.lumps.forEach(function(L){
      if(L.left<=0)return;any=true;
      var d=Math.min(L.left,Math.max(0,h-.12)/MELT_SECONDS*.25*1.8);L.left-=d;st.F+=d;
      var add=d*LUMP_OIL;if(add>0&&typeof addOilAmountToVessel==='function')addOilAmountToVessel(pan,add);
      if(h>.15){L.vx+=(Math.random()-.5)*.012;L.vy+=(Math.random()-.5)*.009;L.vx*=.94;L.vy*=.94;L.x+=L.vx;L.y+=L.vy;
        var rx=G.ell.rx*.6,ry=G.ell.ry*.55,q=(L.x/rx)*(L.x/rx)+(L.y/ry)*(L.y/ry);if(q>1){var k=1/Math.sqrt(q);L.x*=k;L.y*=k;L.vx*=-.5;L.vy*=-.5;}}
    });
    if(!any){      // all the lard is liquid: the picture of the melted fat stays on the floor of the pan for as long as there is fat in it
      var oil=0;try{oil=vesselOilAmount(pan);}catch(x){}
      if(oil<=.02){st.els.forEach(function(e){if(e.parentNode)e.parentNode.removeChild(e);});st.lumps.forEach(function(L){if(L.el.parentNode)L.el.parentNode.removeChild(L.el);});delete pan.dataset.mast;pan._mast=null;return;}
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
window.CooksterMast={BUCKET:BUCKET,put:putInPan,melting:function(p){return p._mast?p._mast.lumps.reduce(function(a,L){return a+L.left;},0):0;}};
})();
