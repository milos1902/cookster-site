/* Cookster - the tools must not be clicked through.
   The game listens for clicks on the whole window and looks for the item under the mouse by its position, so a click on a panel of a tool
   (Svetlo i senke, Zvuk, Kalibracija kafane, Predmeti na stolu ...) also picked up / turned something that lies behind the panel.
   This file must be loaded first: listeners that are added to window / document for "starting" mouse events (pointerdown, mousedown, dblclick,
   contextmenu, wheel, touchstart) are skipped when the event comes from inside a tool panel. The panel itself works as before. */
(function(){
'use strict';
if(window.__toolShield)return;window.__toolShield=true;
var TOOLS='.ls,#tavernCal,#tavernCalOpen,#tiTool,#tiBtn,#vesselFoodMaskTool,#vesselFoodMaskBtn,#uiButtonCalibrationPanel,#uiButtonCalibrationDockButton,#uiButtonCalibrationOverlay,.vfmm-card,.kitchen-elements-card,[data-tool-ui]';
var TYPES={pointerdown:1,mousedown:1,dblclick:1,contextmenu:1,wheel:1,touchstart:1,auxclick:1};
function inTool(t){try{return !!(t&&t.closest&&t.closest(TOOLS))}catch(e){return false}}
var proto=EventTarget.prototype,add=proto.addEventListener,rem=proto.removeEventListener,wrapped=new WeakMap();
function isRoot(o){return o==null||o===window||o===document||o===document.documentElement||o===document.body}
function wrapFor(fn){
  return function(e){if(inTool(e.target))return;return typeof fn==='function'?fn.call(this,e):fn.handleEvent(e)};
}
proto.addEventListener=function(type,fn,opts){
  if(TYPES[type]&&fn&&isRoot(this)){
    var cap=(opts===true)||!!(opts&&opts.capture),key=type+(cap?'c':''),m=wrapped.get(fn);
    if(!m){m={};wrapped.set(fn,m)}
    var w=m[key]||(m[key]=wrapFor(fn));
    return add.call(this,type,w,opts);
  }
  return add.call(this,type,fn,opts);
};
proto.removeEventListener=function(type,fn,opts){
  if(TYPES[type]&&fn&&isRoot(this)){
    var cap=(opts===true)||!!(opts&&opts.capture),m=wrapped.get(fn),w=m&&m[type+(cap?'c':'')];
    if(w)return rem.call(this,type,w,opts);
  }
  return rem.call(this,type,fn,opts);
};
})();
