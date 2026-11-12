/* Cookster: the NEW tool bar at the bottom centre (assets/ui/hud/hud_toolbar.png, 1600x260: a wooden and brass frame with 6 linen slots).
   The six transparent click buttons (js/ui-bottom-buttons.js, the "recent items") stay exactly as they are; this script only puts the picture behind them and places the
   buttons on the centres of the picture's slots (design coordinates 1672x941). Shows the last used items in the slots, as before.
   ?starihud in the address keeps the old look. */
(function(){
'use strict';
if(/[?&]starihud(=|&|$)/.test(location.search))return;
var DW=1672,DH=941;
var S=0.30;                     // design px per picture px
var CX=838,CY=872;              // centre of the bar on the design (the old bar was here)
var PW=1600,PH=260;
var SLOT_X=[226,457.5,690,921.5,1155.5,1386.5],SLOT_Y=136;      // slot centres in the picture
var BW=50,BH=36;                // the click buttons (design px), inside the slots
function apply(bs){
  var layer=bs[0].parentElement;if(!layer)return;
  var left=CX-PW*S/2,top=CY-SLOT_Y*S;
  var img=document.createElement('img');img.className='ct-art';img.src='assets/ui/hud/hud_toolbar.png';img.alt='';img.draggable=false;
  img.style.cssText='position:absolute;pointer-events:none;z-index:0;left:'+(left/DW*100)+'%;top:'+(top/DH*100)+'%;width:'+(PW*S/DW*100)+'%;height:'+(PH*S/DH*100)+'%';
  layer.insertBefore(img,layer.firstChild);
  var sorted=bs.slice().sort(function(a,b){return +a.dataset.slot-+b.dataset.slot;});
  sorted.forEach(function(b,i){
    var cx=left+SLOT_X[i]*S,cy=CY;
    b.style.setProperty('left',((cx-BW/2)/DW*100)+'%','important');
    b.style.setProperty('top',((cy-BH/2)/DH*100)+'%','important');
    b.style.setProperty('width',(BW/DW*100)+'%','important');
    b.style.setProperty('height',(BH/DH*100)+'%','important');
  });
}
var tries=0;
(function wait(){
  var bs=(window.__COOKSTER_BOTTOM_BUTTONS__&&window.__COOKSTER_BOTTOM_BUTTONS__.buttons)||[];
  var c=bs.filter(function(x){return x.dataset.group==='center';});
  if(c.length===6){apply(c);return;}
  if(++tries<200)setTimeout(wait,100);
})();
})();
