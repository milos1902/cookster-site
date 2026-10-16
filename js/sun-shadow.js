/* Cookster: shadows of the things cast by the sun (the kitchen only).
   A thing of its own: it has nothing to do with the contact shadows (el._contactShadow, they stay as they are, they only show the touch with the surface).
   Every item gets a dark flattened copy of its picture in a layer of its own (.sun-shadow in #scene), leaned away from the window, toward the place where the shaft lands.
   The length, strength, softness and flatness are set in the tool "Vreme i svetlo" (cfg.sh in js/day-light.js). */
(function(){
if(window.CooksterSunShadow)return;
var map=new Map(),META=null,BAKED_URL='assets/shadows/meta.json?v=1';
/* the baked shadows (assets/shadows, made by tools/bake_sun_shadows.py): for the things that have them, three pictures (Jutro / Podne / Veče) are laid one over another and cross-faded by the time of the day */
try{fetch(BAKED_URL).then(function(r){return r.json();}).then(function(j){META=j;}).catch(function(){});}catch(e){}
function keyWeights(cfg,m){      // weights of the three baked pictures at the minute m
  var T={};cfg.keys.forEach(function(k){T[k.name]=k.t;});var tj=T['Jutro']||360,tp=T['Podne']||720,tv=T['Veče']||1140,w={jutro:0,podne:0,vece:0};
  if(m<=tj)w.jutro=1;else if(m<tp){var t=(m-tj)/(tp-tj);w.jutro=1-t;w.podne=t;}else if(m<tv){var t2=(m-tp)/(tv-tp);w.podne=1-t2;w.vece=t2;}else w.vece=1;
  return w;
}
function sceneEl(){return document.getElementById('scene');}
function make(el,scene){
  var d=document.createElement('div');d.className='sun-shadow';
  d.style.cssText='position:absolute;pointer-events:none;transform-origin:50% 100%;display:none';
  var im=document.createElement('img');im.alt='';im.draggable=false;im.style.cssText='display:block;width:100%;height:100%;filter:brightness(0)';
  d.appendChild(im);
  d._baked={};['jutro','podne','vece'].forEach(function(k){var b=document.createElement('img');b.alt='';b.draggable=false;b.style.cssText='position:absolute;display:none;pointer-events:none;max-width:none';b.dataset.k=k;d.appendChild(b);d._baked[k]=b;});
  scene.appendChild(d);return d;
}
function tick(){
  var D=window.CooksterDay,scene=sceneEl();if(!D||!scene)return;
  var cfg=D.config(),sh=cfg.sh||{},P=D.phase(),list=(typeof items!=='undefined'&&items)||[],hold=(typeof holding!=='undefined')?holding:null;
  var w=cfg.win,mx=(w.x1+w.x2)/2,my=(w.y1+w.y2)/2,dx=P.lx-mx,dy=P.ly-my,L=Math.hypot(dx,dy)||1;dx/=L;dy/=L;
  var str=sh.on?1:0,seen=new Set();
  list.forEach(function(el){
    if(!el||!el.isConnected)return;
    var rec=map.get(el),body=el.querySelector(':scope>img.body');
    var vis=str>.02&&P.sho>.01&&el!==hold&&body&&el.offsetWidth>0&&el.style.display!=='none'&&el.style.visibility!=='hidden'&&!el.classList.contains('in-oven');
    if(!vis){if(rec)rec.style.display='none';return;}
    if(!rec){rec=make(el,scene);map.set(el,rec);}
    seen.add(el);
    var im=rec.firstChild,bm=META&&sh.baked!==0?META[el.dataset.itemId||'']:null;
    if(bm){      // the baked shadow: no live shear, only the pictures (the position is that of the thing)
      var kk=el.offsetWidth/bm.sw,wts=keyWeights(cfg,D.minute()%1440),oo=D.itemSh(el.dataset.itemId||'')||{};
      im.style.display='none';
      ['jutro','podne','vece'].forEach(function(k){var b=rec._baked[k],m=bm.keys[k],wk=wts[k];
        if(!m||wk<.01){b.style.display='none';return;}
        if(b.getAttribute('src')!==m.file)b.src=m.file;
        b.style.display='block';b.style.left=(-m.ox*kk)+'px';b.style.top=(-m.oy*kk)+'px';b.style.width=(m.w*kk)+'px';b.style.height=(m.h*kk)+'px';b.style.opacity=wk.toFixed(3);});
      rec.style.left=el.offsetLeft+'px';rec.style.top=el.offsetTop+'px';rec.style.width=el.offsetWidth+'px';rec.style.height=el.offsetHeight+'px';
      rec.style.zIndex=String(Math.max(1,(parseInt(el.style.zIndex,10)||20)-2));rec.style.transform='none';
      rec.style.opacity=(P.sho*(oo.o==null?1:+oo.o)*str).toFixed(3);rec.style.display='block';return;
    }
    Object.keys(rec._baked).forEach(function(k){rec._baked[k].style.display='none';});im.style.display='block';
    if(im.getAttribute('src')!==body.getAttribute('src'))im.src=body.getAttribute('src');
    var o=D.itemSh(el.dataset.itemId||'')||{},def=function(v,d){return v==null?d:+v;},
        len=P.shl*def(o.l,1),ar=(P.sha+def(o.a,0))*Math.PI/180,sx=Math.cos(ar)*len,sy=Math.max(.15,Math.sin(ar))*len*.7*P.shh*def(o.h,1);      // every key of the day has its own length, strength and direction; between the keys it flows with the clock
    rec.style.left=el.offsetLeft+'px';rec.style.top=el.offsetTop+'px';rec.style.width=el.offsetWidth+'px';rec.style.height=el.offsetHeight+'px';
    rec.style.zIndex=String(Math.max(1,(parseInt(el.style.zIndex,10)||20)-2));
    rec.style.transform='translate('+(P.shx+def(o.x,0)).toFixed(1)+'px,'+(P.shy+def(o.y,0)).toFixed(1)+'px) rotate('+(P.shr+def(o.r,0)).toFixed(1)+'deg) scaleX('+(P.shw*def(o.w,1)).toFixed(3)+') matrix(1,0,'+(-sx*(1-P.shk)).toFixed(3)+','+(-sy*(1-P.shk)+P.shk).toFixed(3)+',0,0)';
    rec.style.opacity=(P.sho*def(o.o,1)*str).toFixed(3);
    im.style.filter='brightness(0) blur('+Math.max(0,P.shb+def(o.b,0)).toFixed(1)+'px)';
    rec.style.display='block';
  });
  map.forEach(function(rec,el){if(!el.isConnected){rec.remove();map.delete(el);}else if(!seen.has(el))rec.style.display='none';});
}
setInterval(tick,100);
window.CooksterSunShadow={tick:tick};
})();
