/* Cookster: shadows of the things cast by the sun (the kitchen only).
   A thing of its own: it has nothing to do with the contact shadows (el._contactShadow, they stay as they are, they only show the touch with the surface).
   Every item gets a dark flattened copy of its picture in a layer of its own (.sun-shadow in #scene), leaned away from the window, toward the place where the shaft lands.
   The length, strength, softness and flatness are set in the tool "Vreme i svetlo" (cfg.sh in js/day-light.js). */
(function(){
if(window.CooksterSunShadow)return;
var map=new Map();
function sceneEl(){return document.getElementById('scene');}
function make(el,scene){
  var d=document.createElement('div');d.className='sun-shadow';
  d.style.cssText='position:absolute;pointer-events:none;transform-origin:50% 100%;display:none';
  var im=document.createElement('img');im.alt='';im.draggable=false;im.style.cssText='display:block;width:100%;height:100%;filter:brightness(0)';
  d.appendChild(im);scene.appendChild(d);return d;
}
function tick(){
  var D=window.CooksterDay,scene=sceneEl();if(!D||!scene)return;
  var cfg=D.config(),sh=cfg.sh||{},P=D.phase(),list=(typeof items!=='undefined'&&items)||[],hold=(typeof holding!=='undefined')?holding:null;
  var w=cfg.win,mx=(w.x1+w.x2)/2,my=(w.y1+w.y2)/2,dx=P.lx-mx,dy=P.ly-my,L=Math.hypot(dx,dy)||1;dx/=L;dy/=L;
  var str=sh.on?Math.max(0,Math.min(1,P.sun)):0,seen=new Set();
  list.forEach(function(el){
    if(!el||!el.isConnected)return;
    var rec=map.get(el),body=el.querySelector(':scope>img.body');
    var vis=str>.02&&el!==hold&&body&&el.offsetWidth>0&&el.style.display!=='none'&&el.style.visibility!=='hidden'&&!el.classList.contains('in-oven');
    if(!vis){if(rec)rec.style.display='none';return;}
    if(!rec){rec=make(el,scene);map.set(el,rec);}
    seen.add(el);
    var im=rec.firstChild;if(im.getAttribute('src')!==body.getAttribute('src'))im.src=body.getAttribute('src');
    var h=Math.max(-1,Math.min(1,(D.minute()%1440-720)/400)),      // -1 early morning .. 0 noon .. +1 evening: the sun walks, the shadow walks with it
        len=(+sh.len||0)*(.25+1.75*h*h),      // long in the morning and the evening, short at noon
        sx=dx*len*(1+.25*h),sy=(.35+.4*(h+1)/2)*len*(+sh.flat||.7)*(dy<0?-1:1);
    rec.style.left=el.offsetLeft+'px';rec.style.top=el.offsetTop+'px';rec.style.width=el.offsetWidth+'px';rec.style.height=el.offsetHeight+'px';
    rec.style.zIndex=String(Math.max(1,(parseInt(el.style.zIndex,10)||20)-2));
    rec.style.transform='matrix(1,0,'+(-sx).toFixed(3)+','+(-sy).toFixed(3)+',0,0)';
    rec.style.opacity=((+sh.op||0)*str).toFixed(3);
    im.style.filter='brightness(0) blur('+(+sh.blur||0)+'px)';
    rec.style.display='block';
  });
  map.forEach(function(rec,el){if(!el.isConnected){rec.remove();map.delete(el);}else if(!seen.has(el))rec.style.display='none';});
}
setInterval(tick,100);
window.CooksterSunShadow={tick:tick};
})();
