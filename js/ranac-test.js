/* Cookster: the RACK at the bottom centre (assets/ui/ranac/ranac_N.png, N = 3, 6 or 10 cards, all with the same card size).
   It replaces the old wooden 6-slot bar. The six transparent click buttons (recent items, js/ui-bottom-buttons.js) hang on the cards:
   each button is moved onto the centre of a card. With 3 cards only 3 buttons show, with 10 cards the first 6 (the rest comes with the logic later).
   The small button "Ranac: 3 / 6 / 10" cycles the number (for building the game; it will go when the logic is in). */
(function(){
'use strict';
if(window.CooksterRanacTest)return;
var DW=1672,DH=941;
var OPTS=[3,6,10],IDX=1,SCALE=0.24;      // SCALE: design px per picture px (same for all three: cards have the same size)
var META={3:{w:1034,h:874,tags:[274.0,518.5,762.5],top:169,bot:667},
          6:{w:1774,h:887,tags:[278.5,526.0,768.0,1009.0,1251.0,1498.5],top:172,bot:677},
          10:{w:2769,h:897,tags:[281.5,531.5,776.5,1020.5,1264.0,1508.0,1751.5,1995.0,2240.0,2490.0],top:174,bot:685}};
var BOTTOM=929,CX=836;      // the rack's cards end at this design y; the rack is centred at this design x
var css=document.createElement('style');
css.textContent=[
'#ranacTestBtn{position:fixed;left:1016px;top:860px;z-index:2000;padding:6px 12px;border:2px solid #351b0d;border-radius:10px;background:#e8c27a;color:#351b0d;font:800 14px Georgia,serif;cursor:pointer;box-shadow:0 2px 4px rgba(20,10,4,.5)}',
'#ranacTestBtn:hover{background:#f3d590}',
'img.ct-rack{position:absolute;pointer-events:none;z-index:1;filter:drop-shadow(1px 2px 1px rgba(25,12,3,.4)) drop-shadow(2px 4px 4px rgba(25,12,3,.22))}'
].join('\n');
document.head.appendChild(css);
var rack=document.createElement('img');rack.className='ct-rack';rack.alt='';rack.draggable=false;
var btn=document.createElement('button');btn.id='ranacTestBtn';btn.type='button';btn.setAttribute('data-tool-ui','1');
function pct(v,t){return (v/t*100)+'%';}
function layout(){
  var n=OPTS[IDX],m=META[n];
  var w=m.w*SCALE,h=m.h*SCALE,left=CX-w/2,top=BOTTOM-m.bot*SCALE;
  rack.src='assets/ui/ranac/ranac_'+n+'.png';
  rack.style.left=pct(left,DW);rack.style.top=pct(top,DH);rack.style.width=pct(w,DW);rack.style.height=pct(h,DH);
  var bs=((window.__COOKSTER_BOTTOM_BUTTONS__&&window.__COOKSTER_BOTTOM_BUTTONS__.buttons)||[]).filter(function(x){return x.dataset.group==='center';})
    .sort(function(a,b){return +a.dataset.slot-+b.dataset.slot;});
  bs.forEach(function(b,i){
    if(i>=m.tags.length){b.style.display='none';return;}
    b.style.display='';
    var cx=left+m.tags[i]*SCALE,bw=46*SCALE/.27,bh=84*SCALE/.27,cy=top+((m.top+m.bot)/2)*SCALE;
    b.style.setProperty('left',pct(cx-bw/2,DW),'important');b.style.setProperty('top',pct(cy-bh/2,DH),'important');
    b.style.setProperty('width',pct(bw,DW),'important');b.style.setProperty('height',pct(bh,DH),'important');
  });
  btn.textContent='Ranac: '+n;
}
function mount(){
  var bs=(window.__COOKSTER_BOTTOM_BUTTONS__&&window.__COOKSTER_BOTTOM_BUTTONS__.buttons)||[];
  var layer=bs.length?bs[0].parentElement:null;
  if(layer&&!rack.parentElement)layer.insertBefore(rack,layer.firstChild);
  layout();
}
btn.addEventListener('click',function(e){e.stopPropagation();IDX=(IDX+1)%OPTS.length;layout();});
document.body.appendChild(btn);
var tries=0;(function wait(){var bs=(window.__COOKSTER_BOTTOM_BUTTONS__&&window.__COOKSTER_BOTTOM_BUTTONS__.buttons)||[];
  if(bs.length===6){mount();return;}if(++tries<200)setTimeout(wait,100);})();
window.addEventListener('resize',function(){try{layout();}catch(e){}});
window.CooksterRanacTest={cycle:function(){btn.click();},count:function(){return OPTS[IDX];}};
})();
