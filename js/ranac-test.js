/* Cookster: TEST button for the rack (3 / 6 / 10 cards). It sits next to the tool bar in the middle of the bottom.
   A click cycles 3 -> 6 -> 10 and shows the matching rack above the tool bar (assets/ui/ranac/ranac_N.png, all with the same card size).
   Only for building the game: it does not change the tool bar or the recent items yet. data-tool-ui so the tool panels can be used. */
(function(){
'use strict';
if(window.CooksterRanacTest)return;
var OPTS=[3,6,10],SCALE=0.27,IDX=1;
var css=document.createElement('style');
css.textContent=[
'#ranacTestBtn{position:fixed;left:1016px;top:860px;z-index:2000;padding:6px 12px;border:2px solid #351b0d;border-radius:10px;background:#e8c27a;color:#351b0d;font:800 14px Georgia,serif;cursor:pointer;box-shadow:0 2px 4px rgba(20,10,4,.5)}',
'#ranacTestBtn:hover{background:#f3d590}',
'#ranacShow{position:fixed;left:836px;transform:translateX(-50%);bottom:124px;z-index:1950;pointer-events:none;filter:drop-shadow(1px 3px 2px rgba(25,12,3,.7)) drop-shadow(2px 6px 6px rgba(25,12,3,.45))}'
].join('\n');
document.head.appendChild(css);
var btn=document.createElement('button');btn.id='ranacTestBtn';btn.type='button';btn.setAttribute('data-tool-ui','1');
var img=document.createElement('img');img.id='ranacShow';img.alt='';img.draggable=false;
function show(){
  var n=OPTS[IDX];btn.textContent='Ranac: '+n;
  img.src='assets/ui/ranac/ranac_'+n+'.png';
  img.onload=function(){img.style.width=(img.naturalWidth*SCALE)+'px';};
}
btn.addEventListener('click',function(e){e.stopPropagation();IDX=(IDX+1)%OPTS.length;show();});
document.body.appendChild(btn);document.body.appendChild(img);show();
window.CooksterRanacTest={cycle:function(){btn.click();},count:function(){return OPTS[IDX];}};
})();
