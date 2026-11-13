/* Cookster: the RACK at the bottom centre: a cloth belt with six pockets (assets/ui/ranac/ranac_dzepovi.png, 2000x667).
   It replaces the old wooden bar and the card racks. The six transparent click buttons (recent items, js/ui-bottom-buttons.js) lie over the pockets:
   each button is moved onto the centre of a pocket, and the picture of the item shows inside it (the belt is under the buttons, z-index 0). */
(function(){
'use strict';
if(window.CooksterRanacTest)return;
var DW=1672,DH=941;
var SCALE=0.30;                                   // design px per picture px (width 600)
var IW=2000,IH=667,CONTENT_BOTTOM=538;            // picture size; the lowest drawn pixel of the belt
var POCKET_X=[298,580,862,1143,1424,1706],POCKET_Y=352;   // centres of the pockets in the picture
var BOTTOM=935,CX=836;                            // the belt's lowest edge sits at this design y; the belt is centred at this design x
var css=document.createElement('style');
css.textContent='img.ct-rack{position:absolute;pointer-events:none;z-index:0;filter:drop-shadow(1px 2px 1px rgba(25,12,3,.4)) drop-shadow(2px 4px 4px rgba(25,12,3,.22))}';
document.head.appendChild(css);
var rack=document.createElement('img');rack.className='ct-rack';rack.alt='';rack.draggable=false;rack.src='assets/ui/ranac/ranac_dzepovi.png';
function pct(v,t){return (v/t*100)+'%';}
function layout(){
  var w=IW*SCALE,h=IH*SCALE,left=CX-w/2,top=BOTTOM-CONTENT_BOTTOM*SCALE;
  rack.style.left=pct(left,DW);rack.style.top=pct(top,DH);rack.style.width=pct(w,DW);rack.style.height=pct(h,DH);
  var bs=((window.__COOKSTER_BOTTOM_BUTTONS__&&window.__COOKSTER_BOTTOM_BUTTONS__.buttons)||[]).filter(function(x){return x.dataset.group==='center';})
    .sort(function(a,b){return +a.dataset.slot-+b.dataset.slot;});
  bs.forEach(function(b,i){
    if(i>=POCKET_X.length)return;
    var cx=left+POCKET_X[i]*SCALE,cy=top+POCKET_Y*SCALE,bw=70,bh=68;
    b.style.setProperty('left',pct(cx-bw/2,DW),'important');b.style.setProperty('top',pct(cy-bh/2,DH),'important');
    b.style.setProperty('width',pct(bw,DW),'important');b.style.setProperty('height',pct(bh,DH),'important');
  });
}
function mount(){
  var bs=(window.__COOKSTER_BOTTOM_BUTTONS__&&window.__COOKSTER_BOTTOM_BUTTONS__.buttons)||[];
  var layer=bs.length?bs[0].parentElement:null;
  if(layer&&!rack.parentElement)layer.insertBefore(rack,layer.firstChild);
  layout();
}
var tries=0;(function wait(){var bs=(window.__COOKSTER_BOTTOM_BUTTONS__&&window.__COOKSTER_BOTTOM_BUTTONS__.buttons)||[];
  if(bs.length===6){mount();return;}if(++tries<200)setTimeout(wait,100);})();
window.addEventListener('resize',function(){try{layout();}catch(e){}});
window.CooksterRanacTest={layout:layout};
})();
