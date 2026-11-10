/* Cookster: velika okrugla ploca na sporetu se usijava kad vatra gori i polako se hladi kad se ugasi.
   Slika usijane ploce (assets/ui/stove/ploca_usijana.webp, samo ploca sa mekom ivicom; sve ostalo na sporetu je originalna slika) se preliva preko hladne:
   heat 0..1 raste dok vatra gori (oko 40 s do pune usijanosti na najjacoj vatri), pada za oko 30-60 s. Sloj je ISPOD predmeta koji stoje na ploci.
   Noću js/day-light.js dodaje malo svetla oko ploce (CooksterStovePlates.heat()). */
(function(){
if(window.CooksterStovePlates)return;
var IMG='assets/ui/stove/ploca_usijana.webp?v=1',X=1250,Y=256,W=184,H=136;      // polozaj i velicina slike ploce u sceni
var MAXO=.7,heat=0,el=null,last=0,lastRef=0,lastShown=-1;
function build(){var sc=document.getElementById('scene');if(!sc)return false;if(el&&el.parentNode===sc)return true;
  el=document.createElement('img');el.className='stove-plate-hot';el.src=IMG;el.alt='';el.draggable=false;
  el.style.cssText='position:absolute;left:'+X+'px;top:'+Y+'px;width:'+W+'px;height:'+H+'px;pointer-events:none;z-index:2;opacity:0';
  sc.appendChild(el);return true;}
function burning(){try{return stoveState.fireOn&&(+stoveState.fireLevel||0)>0?Math.min(1,(+stoveState.fireLevel||0)/FIRE_MAX_LEVEL):0;}catch(e){return 0;}}
function frame(now){requestAnimationFrame(frame);var dt=Math.min(.1,(now-last)/1000||.016);last=now;
  var b=burning(),target=b>0?Math.min(1,.45+.55*b):0;
  if(b>0){if(heat<target)heat=Math.min(target,heat+dt/(40/Math.max(.4,b)));else heat=Math.max(target,heat-dt/60);}else heat=Math.max(0,heat-dt/30);
  if(!build())return;
  if(Math.abs(heat-lastShown)>.002){lastShown=heat;el.style.opacity=(MAXO*Math.max(0,Math.min(1,heat*1.1))).toFixed(3);}
  if(now-lastRef>500&&(heat>0||lastShown>0)&&Math.abs(heat-(lastRef?lastRef:0))>0){lastRef=now;try{if(window.CooksterDay&&CooksterDay.refreshLight)CooksterDay.refreshLight();}catch(e){}}}
requestAnimationFrame(frame);
window.CooksterStovePlates={heat:function(){return heat;}};
})();
