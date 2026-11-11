/* Cookster: the FILLING for the sarma is taken from the pan with a big SPOON and put on the cabbage leaf.
   - RIGHT click on the filling in a pan (empty hands; the filling is 'mleveno_nadev_diced', the rice goes with it) takes ONE portion: the pan loses PORTION doses (and the same share of the rice),
     a big spoon with the filling stays at the cursor. One pack of the meat is 6 doses = 10 sarmas, so one portion is 0.1 of a dose.
   - the LEFT click is ONLY for stirring and for putting the portion on a leaf: it never takes the filling.
   - a left click on the lower part of an EMPTY leaf (List kupusa, js/sarma.js) puts the portion on it;
     a left click on the pan with the full spoon gives the portion back (the next left click stirs); a right click or Esc gives it back too.
   Written new (the old js/nadev-spoon.js, where a short left click took the filling and got in the way of the stirring, was deleted). */
(function(){
'use strict';
if(window.CooksterNadevSpoon)return;
var NK='mleveno_nadev_diced',RK='pirinac_diced',PORTION=.1,W=42,H=104;
var S={el:null,loaded:false,pan:null,rice:0,rc:false};
function toast(m){try{showToast(m);}catch(e){}}
function emptyHands(){try{return !(typeof holding!=='undefined'&&holding&&!holding._mini);}catch(e){return true;}}      // the small stirring spoon is not "something in the hand"
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
function panAt(x,y){var v=null;try{v=foodVesselAt(x,y);}catch(e){}return v;}
function nadevPanAt(x,y){var v=panAt(x,y);return v&&units(v,NK)>0.001?v:null;}      // any rest of the filling can be taken
function spoonEl(){
  if(S.el&&S.el.isConnected)return S.el;
  var d=document.createElement('div');d.id='nadevSpoon';d.style.cssText='position:absolute;left:0;top:0;width:'+W+'px;height:'+H+'px;pointer-events:none;display:none;z-index:11600;transform-origin:50% 16%';
  var im=document.createElement('img');im.src='assets/sarma/kasika_nadev.webp?v=2';im.draggable=false;im.style.cssText='width:100%;height:100%;object-fit:contain;pointer-events:none;filter:drop-shadow(0 1px 1px rgba(0,0,0,.45))';
  d.appendChild(im);scene.appendChild(d);S.el=d;return d;
}
function place(x,y){var p=screenToScene(x,y);spoonEl().style.transform='translate3d('+(p.x-W/2).toFixed(1)+'px,'+(p.y-H*.16).toFixed(1)+'px,0)';}
function show(on){
  spoonEl().style.display=on?'block':'none';document.body.classList.toggle('mini-spoon-on',!!on);
  if(on){try{miniSpoonHide();}catch(e){}}      // the small stirring spoon (and its ghost copy) go away while the big one is at the cursor
}
function take(pan,x,y){
  var have=units(pan,NK);if(have<=0.001||!pan.isConnected)return false;
  var t=Math.min(PORTION,have);if(have-t<.04)t=have;      // the last small rest goes onto the spoon with the last portion
  var rice=units(pan,RK),share=t>=have-1e-6?rice:Math.min(rice,rice*t/have);
  try{setUnits(pan,NK,have-t);if(share>0)setUnits(pan,RK,rice-share);renderCookwareContents(pan);}catch(e){return false;}
  S.loaded=true;S.pan=pan;S.rice=share;window.CooksterNadevLoaded=true;place(x,y);show(true);
  try{playImpactSound(pan,'pickup');}catch(e){}
  return true;
}
function giveBack(){
  if(!S.loaded)return;var v=S.pan;
  try{if(v&&v.isConnected){setUnits(v,NK,units(v,NK)+PORTION);if(S.rice>0)setUnits(v,RK,units(v,RK)+S.rice);renderCookwareContents(v);}}catch(e){}
  S.loaded=false;window.CooksterNadevLoaded=false;show(false);
}
function consume(){S.loaded=false;window.CooksterNadevLoaded=false;show(false);}
window.addEventListener('pointerdown',function(e){
  if(e.button===2){      // RIGHT click: takes a portion, or gives it back when the spoon is full
    if(S.loaded){giveBack();S.rc=true;e.stopImmediatePropagation();e.preventDefault();return;}
    if(!emptyHands())return;
    var v=nadevPanAt(e.clientX,e.clientY);
    if(v&&take(v,e.clientX,e.clientY)){S.rc=true;e.stopImmediatePropagation();e.preventDefault();}
    return;
  }
  if(e.button!==0||!S.loaded||!emptyHands())return;      // LEFT click: only matters while the spoon is full
  var leaf=window.CooksterSarma&&CooksterSarma.leafAt(e);
  if(leaf&&!CooksterSarma.isFilled(leaf)){
    var r=leaf.getBoundingClientRect();
    if((e.clientY-r.top)/Math.max(1,r.height)>.4){      // the filling is put on the lower part of the leaf
      e.stopImmediatePropagation();e.preventDefault();CooksterSarma.fill(leaf);consume();
      try{playImpactSound(leaf,'drop');}catch(x){}
      toast('Nadev je na listu. Sad dva klika na donji deo lista.');
      return;
    }
  }
  if(panAt(e.clientX,e.clientY)){e.stopImmediatePropagation();e.preventDefault();giveBack();toast('Nadev je vraćen u tiganj. Levim klikom mešaš.');}
},true);
window.addEventListener('contextmenu',function(e){if(S.rc){S.rc=false;e.preventDefault();e.stopImmediatePropagation();}},true);
window.addEventListener('pointermove',function(e){
  if(!S.loaded)return;
  if(!emptyHands()){giveBack();return;}      // something else was taken in the hand
  show(true);place(e.clientX,e.clientY);
},true);
window.addEventListener('keydown',function(e){if(e.key==='Escape')giveBack();},false);
window.CooksterNadevSpoon={consume:consume,PORTION:PORTION,loaded:function(){return S.loaded;},giveBack:giveBack};
})();
