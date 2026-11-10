/* Cookster: the filling for the sarma is taken from the pan with a SPOON and put on the cabbage leaf.
   - with EMPTY hands a short click (no movement) on the filling in a pan (the food of the pan: minced meat for the filling 'mleveno_nadev_diced', rice with it) takes ONE portion: the pan loses
     PORTION doses of the filling (and the same share of the rice) and a small spoon with the filling stays at the cursor. A press with a movement is the stirring, as always.
   - a click on the lower part of an EMPTY leaf (List kupusa, js/sarma.js) puts the portion on it (the leaf shows the filling); Esc or a right click gives the portion back to the pan.
   One pack of the meat (6 doses) is 10 sarmas: one portion is 0.4 of a dose. */
(function(){
'use strict';
if(window.CooksterNadevSpoon)return;
var NK='mleveno_nadev_diced',RK='pirinac_diced',PORTION=.1,W=42,H=104;      // a big spoon (the wooden one), not the small stirring spoon
var NS={el:null,loaded:false,pan:null,rice:0,down:null};
function emptyHands(){try{return !(typeof holding!=='undefined'&&holding&&!holding._mini);}catch(e){return true;}}      // the small stirring spoon (holding._mini) is not a thing in the hand
function heat(v){try{return isHeatableCookwareItem(v);}catch(e){return true;}}
function units(v,k){      // a pan / a pot keep their food in the cooking model, a bowl in the container model
  try{if(heat(v))return Math.max(0,+((CooksterPan.read(v).ingredients||{})[k])||0);
    var e=(CooksterContainer.read(v).items||{})[k];return e?Math.max(0,+e.count||0):0;}catch(x){return 0;}
}
function setUnits(v,k,n){
  n=Math.max(0,n);
  try{
    if(heat(v)){var cur=units(v,k);if(n>cur)CooksterPan.addIngredient(v,k,n-cur);else if(n<cur)CooksterPan.removeIngredient(v,k,cur-n);}
    else{var m=CooksterContainer.read(v);m.items=m.items||{};if(m.items[k]){if(n<=0)delete m.items[k];else m.items[k]=Object.assign({},m.items[k],{count:n});}CooksterContainer.write(v,m);}
  }catch(x){}
}
function nadevPan(e){
  var v=null;try{v=foodVesselAt(e.clientX,e.clientY);}catch(x){}
  return v&&units(v,NK)>0.001?v:null;      // any rest of the filling can be taken (also a small one that is still seen as a few crumbs)
}
function spoon(){
  if(NS.el&&NS.el.isConnected)return NS.el;
  var d=document.createElement('div');d.id='nadevSpoon';d.style.cssText='position:absolute;left:0;top:0;width:'+W+'px;height:'+H+'px;pointer-events:none;display:none;z-index:11600;transform-origin:50% 16%';
  var im=document.createElement('img');im.src='assets/sarma/kasika_nadev.webp?v=2';im.draggable=false;im.style.cssText='width:100%;height:100%;object-fit:contain;pointer-events:none;filter:drop-shadow(0 1px 1px rgba(0,0,0,.45))';      // the picture of the spoon WITH the real filling in its bowl
  d.appendChild(im);scene.appendChild(d);NS.el=d;return d;
}
function place(){var p=screenToScene(mouse.x,mouse.y);spoon().style.transform='translate3d('+(p.x-W/2).toFixed(1)+'px,'+(p.y-H*.16).toFixed(1)+'px,0)';}
function show(on){spoon().style.display=on?'block':'none';document.body.classList.toggle('mini-spoon-on',!!on);if(on){try{miniSpoonHide();}catch(e){}}}
function giveBack(){
  if(!NS.loaded)return;var v=NS.pan;
  try{if(v&&v.isConnected){setUnits(v,NK,units(v,NK)+PORTION);if(NS.rice>0)setUnits(v,RK,units(v,RK)+NS.rice);renderCookwareContents(v);}}catch(e){}
  NS.loaded=false;window.CooksterNadevLoaded=false;show(false);
}
window.addEventListener('pointerdown',function(e){
  NS.pdHold=!emptyHands();NS.pdT=performance.now();      // was something in the hand when this press began? (then it is putting down, not scooping)
  if(e.button===2&&NS.loaded){giveBack();return;}
  if(e.button!==0)return;
  if(NS.loaded&&emptyHands()){
    var leaf=window.CooksterSarma&&CooksterSarma.leafAt(e);
    if(leaf&&!CooksterSarma.isFilled(leaf)){
      var r=leaf.getBoundingClientRect();
      if((e.clientY-r.top)/Math.max(1,r.height)>.4){      // the filling is put on the lower part of the leaf
        e.stopImmediatePropagation();e.preventDefault();CooksterSarma.fill(leaf);NS.loaded=false;window.CooksterNadevLoaded=false;show(false);
        try{playImpactSound(leaf,'drop');}catch(x){}
        try{showToast('Nadev je na listu. Sad dva klika na donji deo lista.');}catch(x){}
        return;
      }
    }
    var onPan=null;try{onPan=foodVesselAt(e.clientX,e.clientY);}catch(x){}
    if(onPan||leaf){e.stopImmediatePropagation();e.preventDefault();}      // nothing else happens while the spoon is full (no stirring, the leaf is not picked up)
    return;
  }
},true);
// the press is noted on 'mousedown' (the game stops the 'pointerdown' of its own stirring before it reaches us): where, when and over which pan
var freeAt=0,wasFree=true;
setInterval(function(){var f=emptyHands();if(f&&!wasFree)freeAt=performance.now();wasFree=f;},30);      // when the hands became empty (the click that put something down must not be taken for a scoop)
window.addEventListener('pointerdown',function(e){
  if(e.button!==0)return;NS.down=null;
  if(NS.pdHold)return;
  if(emptyHands()&&!NS.loaded&&performance.now()-freeAt>500){var v=nadevPan(e);if(v)NS.down={x:e.clientX,y:e.clientY,t:performance.now(),v:v};}
},true);
window.addEventListener('pointerup',function(e){
  var d=NS.down;NS.down=null;
  if(!d||e.button!==0||NS.loaded||!emptyHands())return;
  if(Math.hypot(e.clientX-d.x,e.clientY-d.y)>16||performance.now()-d.t>700)return;      // a movement or a long press: it was the stirring
  var v=d.v,have=units(v,NK);if(have<=0.001||!v.isConnected)return;
  var take=Math.min(PORTION,have);if(have-take<.04)take=have;      // the last small rest goes onto the spoon together with the last portion
  var rice=units(v,RK),share=take>=have-1e-6?rice:Math.min(rice,rice*take/have);
  try{setUnits(v,NK,have-take);if(share>0)setUnits(v,RK,rice-share);renderCookwareContents(v);}catch(x){return;}
  NS.loaded=true;NS.pan=v;NS.rice=share;window.CooksterNadevLoaded=true;place();show(true);
  try{playImpactSound(v,'pickup');}catch(x){}
},true);
window.addEventListener('pointermove',function(){if(NS.loaded){if(!emptyHands()){giveBack();return;}show(true);place();}},false);
window.addEventListener('keydown',function(e){if(e.key==='Escape')giveBack();},false);
window.CooksterNadevSpoon={consume:function(){NS.loaded=false;window.CooksterNadevLoaded=false;show(false);},PORTION:PORTION,loaded:function(){return NS.loaded;},giveBack:giveBack};
})();
