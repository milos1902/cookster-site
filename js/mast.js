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
  var K=1.25;      // a spoon takes MORE lard: the lump is bigger (about twice the old size when it starts: 1.25 x 1.6)
  im.style.cssText='position:absolute;pointer-events:none;z-index:5;left:'+((G.lump.cx-G.lump.w*K/2)*100)+'%;top:'+((G.lump.cy-G.lump.h*K/2)*100)+'%;width:'+(G.lump.w*K*100)+'%;height:'+(G.lump.h*K*100)+'%';
  pan.appendChild(im);var n=st.lumps.length;
  st.lumps.push({el:im,left:1.6,x:(Math.random()-.5)*.28*(n?1:0),y:(Math.random()-.5)*.2*(n?1:0),vx:0,vy:0});
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
var busy=false;
// the spoon is held with its bowl UP (not hanging down)
setInterval(function(){try{var sp=spoonHeld();if(sp&&!busy&&sp.dataset.angle!=='0'&&!sp.dataset.keepAngle){sp.dataset.angle='0';try{updatePlacementGhost();}catch(e){}}}catch(e){}},200);
function bodyOf(sp){return sp.querySelector('.body')||sp;}
// like the ladle: the spoon moves over the target, dips (or tips over) and comes back; "at" is the moment of the action (ms)
function animateSpoon(sp,target,mode,at,done){
  if(busy||typeof pouring==='undefined'||pouring){return false;}
  busy=true;pouring=true;
  var live=(typeof placementGhostMotion!=='undefined'&&placementGhostMotion&&placementGhostMotion.key===sp&&placementGhostMotion.pose)||null;
  var h0=live&&Number.isFinite(+live.cx)&&Number.isFinite(+live.by)?{cx:+live.cx,by:+live.by,vis:+live.vis||(+sp.dataset.vis||1)}:{cx:+sp.dataset.cx||0,by:+sp.dataset.by||0,vis:+sp.dataset.vis||1};
  var m0=screenToScene(mouse.x,mouse.y);
  try{if(sp._contactShadow)sp._contactShadow.style.visibility='hidden';}catch(e){}
  sp.dataset.noSunShadow='1';
  try{clearPourTarget();hidePlacementGhost();hideOriginGhost();}catch(e){}
  var vis=h0.vis||1,w=(+sp.dataset.baseW||58)*vis,h=(+sp.dataset.baseH||142)*vis;
  var tv=+target.dataset.vis||1,tcx=+target.dataset.cx||0,tby=+target.dataset.by||0,tmid=tby-(+target.dataset.baseH||100)*tv*.5;
  var tr=function(ms){return 'left '+ms+'ms cubic-bezier(.3,.1,.3,1), top '+ms+'ms cubic-bezier(.3,.1,.3,1), transform '+ms+'ms cubic-bezier(.3,.1,.3,1)';};
  var oldT=sp.style.transition||'';
  var go=function(cx,by,ang,ms){sp.style.transition=tr(ms);setPose(sp,cx,by,vis);sp.style.transformOrigin='50% 18%';sp.style.transform='perspective(1200px) rotateZ('+ang+'deg)';};      // the origin is the bowl of the spoon
  setPose(sp,h0.cx,h0.by,vis);sp.style.transformOrigin='50% 18%';sp.style.transform='rotateZ(0deg)';
  sp.style.visibility='visible';sp.classList.add('pouring-source');
  var bowlY=function(dy){return tmid+h*.82+dy;};      // by (the bottom of the spoon) so that the bowl (near the top of the picture) is over the target
  requestAnimationFrame(function(){requestAnimationFrame(function(){go(tcx,bowlY(-26*vis),0,300);});});      // over the target
  if(mode==='scoop'){
    setTimeout(function(){go(tcx,bowlY(4*vis),-18,260);},330);      // dips into the lard
    setTimeout(function(){at&&at();},620);      // the lard is on the spoon
    setTimeout(function(){go(tcx,bowlY(-26*vis),0,260);},700);      // up again
  }else{
    setTimeout(function(){go(tcx,bowlY(-30*vis),-75,340);},330);      // tips over the pan
    setTimeout(function(){at&&at();},560);      // the lard falls
    setTimeout(function(){go(tcx,bowlY(-26*vis),0,300);},950);      // upright again
  }
  setTimeout(function(){var m=screenToScene(mouse.x,mouse.y);go(h0.cx+(m.x-m0.x),h0.by+(m.y-m0.y),0,260);},mode==='scoop'?980:1280);
  setTimeout(function(){
    sp.style.transition=oldT;sp.classList.remove('pouring-source');delete sp.dataset.noSunShadow;try{if(sp._contactShadow)sp._contactShadow.style.visibility='';}catch(e){}
    pouring=false;busy=false;
    if(holding===sp)sp.style.visibility='';
    try{updatePlacementGhost();}catch(e){}
    if(holding===sp)sp.style.visibility='hidden';
    try{updatePourTarget();updateHover();}catch(e){}
    done&&done();
  },mode==='scoop'?1280:1580);
  return true;
}
window.addEventListener('pointerdown',function(e){
  if(e.button!==0)return;var sp=spoonHeld();if(!sp||busy)return;
  var it=(typeof itemAt==='function')?itemAt(e.clientX,e.clientY):null;
  if(!it)return;
  if(isBucket(it)&&!sp.dataset.mastLoad){
    e.stopImmediatePropagation();e.preventDefault();
    animateSpoon(sp,it,'scoop',function(){sp.dataset.mastLoad='1';showOnSpoon(sp,true);});return;
  }
  if(sp.dataset.mastLoad&&isPan(it)){
    e.stopImmediatePropagation();e.preventDefault();
    animateSpoon(sp,it,'pour',function(){delete sp.dataset.mastLoad;showOnSpoon(sp,false);putInPan(it);});return;
  }
},true);
['click','pointerup','mouseup'].forEach(function(t){window.addEventListener(t,function(e){var sp=spoonHeld();if(!sp)return;var it=(typeof itemAt==='function')?itemAt(e.clientX,e.clientY):null;if(isBucket(it)||(sp.dataset.mastLoad&&isPan(it))||busy){e.stopImmediatePropagation();}},true);});
/* ---- the small spoon at the cursor (like the small stirring spoon over a pan): with EMPTY hands the cursor over the bucket of lard shows ONE small spoon.
   A click scoops the lard (the spoon dips and comes up with a lump); the spoon stays at the cursor, loaded; a click on a pan tips it over and the lard falls in. Right click / Esc: the lard goes back. ---- */
var MS={el:null,loaded:false,busy:false,x:0,y:0,over:false},MW=34,MH=84;
function msEl(){
  if(MS.el&&MS.el.isConnected)return MS.el;
  var d=document.createElement('div');d.id='mastSpoon';d.style.cssText='position:absolute;left:0;top:0;width:'+MW+'px;height:'+MH+'px;pointer-events:none;display:none;z-index:11600;transform-origin:50% 16%';
  var im=document.createElement('img');im.src='assets/new_props/kasika_1.png?v=2';im.draggable=false;im.style.cssText='width:100%;height:100%;object-fit:contain;pointer-events:none;filter:drop-shadow(0 1px 1px rgba(0,0,0,.45))';
  var lump=blob('left:20%;top:5%;width:60%;height:19%;z-index:3;display:none');lump.id='mastSpoonLump';
  d.appendChild(im);d.appendChild(lump);scene.appendChild(d);MS.el=d;return d;
}
function msPlace(extra){
  var d=msEl(),p=screenToScene(mouse.x,mouse.y);MS.x=p.x;MS.y=p.y;
  d.style.transform='translate3d('+(p.x-MW/2).toFixed(1)+'px,'+(p.y-MH*.16).toFixed(1)+'px,0) rotateZ('+(extra||0)+'deg)';
}
function msShow(on){var d=msEl();d.style.display=on?'block':'none';document.body.classList.toggle('mini-spoon-on',!!on);}
function msLoad(on){MS.loaded=on;var l=document.getElementById('mastSpoonLump');if(l)l.style.display=on?'block':'none';}
// the small spoon belongs only to the SURFACE of the lard (the opening of the bucket): on the rest of the bucket (the wall, the handle) the cursor works as always, so the bucket can be taken
function overBucket(e){
  var it=(typeof itemAt==='function')?itemAt(e.clientX,e.clientY):null;if(!isBucket(it))return null;
  var r=it.getBoundingClientRect(),nx=(e.clientX-(r.left+r.width*.5))/(r.width*.36),ny=(e.clientY-(r.top+r.height*.3))/(r.height*.16);
  return nx*nx+ny*ny<=1?it:null;
}
function overPan(e){var it=(typeof itemAt==='function')?itemAt(e.clientX,e.clientY):null;return isPan(it)?it:null;}
function emptyHands(){try{return !(typeof holding!=='undefined'&&holding);}catch(e){return true;}}
window.addEventListener('pointermove',function(e){
  if(MS.busy){return;}
  if(!emptyHands()){if(MS.el&&MS.el.style.display!=='none')msShow(false);return;}
  var show=MS.loaded||!!overBucket(e)||(MS.loaded&&!!overPan(e));
  if(show){try{miniSpoonHide();}catch(x){}msShow(true);msPlace(0);}
  else if(MS.el&&MS.el.style.display!=='none')msShow(false);
},false);
function animate(frames,ms,done){
  var d=msEl();try{var a=d.animate(frames,{duration:ms,easing:'ease-in-out',fill:'forwards'});a.onfinish=function(){try{a.cancel();}catch(x){}done&&done();};}catch(x){done&&done();}
}
function tf(x,y,r){return 'translate3d('+(x-MW/2).toFixed(1)+'px,'+(y-MH*.16).toFixed(1)+'px,0) rotateZ('+r+'deg)';}      // the bowl of the spoon is at the cursor, the bowl UP
window.addEventListener('pointerdown',function(e){
  if(e.button===2&&MS.loaded&&emptyHands()){msLoad(false);return;}
  if(e.button!==0||MS.busy||!emptyHands())return;
  var bk=overBucket(e);
  if(bk&&!MS.loaded){      // scoop: dips into the lard and comes up with a lump
    e.stopImmediatePropagation();e.preventDefault();MS.busy=true;msShow(true);var x=MS.x,y=MS.y;
    animate([{transform:tf(x,y-14,0)},{transform:tf(x,y+4,-16),offset:.45},{transform:tf(x,y-14,0)}],520,function(){});
    setTimeout(function(){msLoad(true);},260);
    setTimeout(function(){MS.busy=false;msPlace(0);},540);return;
  }
  var pan=overPan(e);
  if(pan&&MS.loaded){      // tips over the pan: the lard falls out
    e.stopImmediatePropagation();e.preventDefault();MS.busy=true;var x2=MS.x,y2=MS.y;
    animate([{transform:tf(x2,y2,0)},{transform:tf(x2,y2-10,-80),offset:.4},{transform:tf(x2,y2-10,-95),offset:.7},{transform:tf(x2,y2,0)}],900,function(){});
    setTimeout(function(){msLoad(false);putInPan(pan);},420);
    setTimeout(function(){MS.busy=false;msPlace(0);},920);return;
  }
  if(MS.loaded&&(overBucket(e)))e.stopImmediatePropagation();
},true);
window.addEventListener('keydown',function(e){if(e.key==='Escape'&&MS.loaded)msLoad(false);},false);
['click','pointerup','mouseup'].forEach(function(t){window.addEventListener(t,function(e){if(!emptyHands()||MS.busy)return;if(overBucket(e)||(MS.loaded&&overPan(e)))e.stopImmediatePropagation();},true);});
window.CooksterMast={BUCKET:BUCKET,put:putInPan,melting:function(p){return p._mast?p._mast.lumps.reduce(function(a,L){return a+L.left;},0):0;}};
})();
