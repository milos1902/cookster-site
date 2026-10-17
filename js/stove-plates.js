/* Cookster: the big round plate on the top of the stove glow red-hot when the fire burns for a while, and cool down slowly after the fire is out.
   heat 0..1: goes up while the fire burns (about 40 s to be fully hot at the strongest fire), goes down in about 30 s. The glow is a soft ring (under the things that stand on the plates);
   at night js/day-light.js adds a little light round them (CooksterStovePlates.heat()). */
(function(){
if(window.CooksterStovePlates)return;
var PL=[{x:1343,y:322,rx:80,ry:60}]      // only the big plate on the left,heat=0,els=[],last=0,lastRef=0,lastShown=-1;
function build(){var sc=document.getElementById('scene');if(!sc)return false;if(els.length&&els[0].parentNode===sc)return true;els=[];
  PL.forEach(function(p){var d=document.createElement('div');d.className='stove-plate-glow';
    d.style.cssText='position:absolute;left:'+(p.x-p.rx)+'px;top:'+(p.y-p.ry)+'px;width:'+(p.rx*2)+'px;height:'+(p.ry*2)+'px;border-radius:50%;pointer-events:none;z-index:2;opacity:0;mix-blend-mode:screen;'+
      'background:radial-gradient(ellipse at 50% 50%,rgba(255,70,20,.28) 0,rgba(255,80,20,.20) 38%,rgba(255,120,30,.62) 66%,rgba(255,90,20,.35) 84%,rgba(255,60,10,0) 100%)';
    sc.appendChild(d);els.push(d);});return true;}
function burning(){try{return stoveState.fireOn&&(+stoveState.fireLevel||0)>0?Math.min(1,(+stoveState.fireLevel||0)/FIRE_MAX_LEVEL):0;}catch(e){return 0;}}
function frame(now){requestAnimationFrame(frame);var dt=Math.min(.1,(now-last)/1000||.016);last=now;
  var b=burning(),target=b>0?Math.min(1,.45+.55*b):0;
  if(b>0){if(heat<target)heat=Math.min(target,heat+dt/(40/Math.max(.4,b)));else heat=Math.max(target,heat-dt/60);}else heat=Math.max(0,heat-dt/30);
  if(!build())return;
  if(Math.abs(heat-lastShown)>.002){lastShown=heat;var o=Math.max(0,Math.min(1,heat*1.15)).toFixed(3);els.forEach(function(e,i){e.style.opacity=o;});}
  if(now-lastRef>500&&(heat>0||lastShown>0)&&Math.abs(heat-(lastRef?lastRef:0))>0){lastRef=now;try{if(window.CooksterDay&&CooksterDay.refreshLight)CooksterDay.refreshLight();}catch(e){}}}
requestAnimationFrame(frame);
window.CooksterStovePlates={heat:function(){return heat;}};
})();
