/* Začini (staklenke) i izgled posude za kupus.
   - Staklenke sa začinima stoje na gornjoj ivici stola. Kad se jedna drži iznad posude, nagne se; kad se protrese mišem levo-desno,
     sipa se (crvene/sive/bele tačkice) i začin se upiše u posudu (dataset.spices, npr. {"tucana":2}).
   - Posuda za kupus (`posuda_za_kupus`) menja celu sliku: kad je u njoj samo seckan kiseli kupus -> posuda_kupus.webp,
     a kad ima i (mlevenu ili tucanu) paprikuu -> posuda_kupus_paprika.webp. */
(function(){
  'use strict';
  const DIR='assets/calibration_props/posuda_za_kupus/';
  const BOWL_ID='posuda_za_kupus',CABBAGE_KEY='kupus_diced_kiseli';
  const COLORS={paprika:['#b3200f','#d4301a'],tucana:['#c4290f','#e8a010'],biber:['#2b1d14','#4a3426'],so:['#ffffff','#e8ecf2'],secer:['#fffdf5','#f1ead8'],lovor:['#5e7d3a','#8a9a52']};
  const SPICE_IDS=['paprika','tucana','biber','so','secer','lovor'];
  const TEST_PAPRIKA=new Set(['paprika','tucana']);
  const SHAKES_PER_DOSE=1;                                 // one swing of the mouse (a change of direction) = one dose
  const MAX_DOSES=12;
  const spiceOf=el=>{const m=/^zacin_(.+)$/.exec(el?.dataset?.itemId||'');return m&&COLORS[m[1]]?m[1]:null;};

  // ---------- picture of the bowl ----------
  // what a vessel holds, from whichever model it uses (a vessel that can be heated keeps its food in the cooking model)
  function readItems(el){
    try{
      if(typeof isHeatableCookwareItem==='function'&&isHeatableCookwareItem(el)){
        const m=CooksterPan.read(el),o={};
        for(const [k,n] of Object.entries(m.ingredients||{}))o[k]={count:+n||0};
        if((+m.staples?.oil||0)>0)o.ulje={count:+m.staples.oil};
        return o;
      }
      return CooksterContainer.read(el).items||{};
    }catch(_){return {};}
  }
  function applyLook(el){
    if(!el||el.dataset?.itemId!==BOWL_ID)return;
    const body=el.querySelector('.body');if(!body)return;
    if(!el._origBodySrc)el._origBodySrc=body.getAttribute('src');
    const keys=Object.entries(readItems(el)).filter(([k,e])=>(+e.count||0)>0&&k!=='ulje').map(([k])=>k);
    let spices={};try{spices=JSON.parse(el.dataset.spices||'{}');}catch(_){}
    if(!keys.length&&el.dataset.spices){delete el.dataset.spices;spices={};}
    const only=keys.length===1&&keys[0]===CABBAGE_KEY;
    const paprika=Object.keys(spices).some(k=>TEST_PAPRIKA.has(k)&&spices[k]>0);
    const src=only?DIR+(paprika?'posuda_kupus_paprika.webp':'posuda_kupus.webp'):el._origBodySrc;
    if(body.getAttribute('src')!==src)body.src=src;
    el.classList.toggle('bowl-photo-look',only);
    if(el._vesselContent)el._vesselContent.style.display=only?'none':'';
  }
  const origRender=window.renderVesselContents;
  if(typeof origRender==='function'){
    window.renderVesselContents=function(el){
      const r=origRender.apply(this,arguments);
      try{applyLook(el);}catch(_){}
      return r;
    };
  }

  // ---------- spice jars: tilt over a vessel, shake to sprinkle ----------
  let tilt=0,lastX=0,lastDir=0,travel=0,shakes=0,lastJar=null,lastEmit=0;
  function vesselUnder(jar){
    try{const c=containerAt(mouse.x,mouse.y);if(c)return c;
      const s=screenToScene(mouse.x,mouse.y);return window.CooksterFlour&&CooksterFlour.troughAt?CooksterFlour.troughAt(s.x,s.y):null;}catch(_){return null;}
  }
  // a vessel under the cursor, or the nearest one whose edge is closer than NEAR px: the jar starts to tilt before it is above the middle
  const NEAR=110;
  function vesselNear(jar){
    const c=vesselUnder(jar);if(c)return c;
    let best=null,bd=NEAR;
    try{for(const it of (window.items||items)){
      if(!it||it===jar||!isContainerItem(it))continue;
      const wrap=(isPanItem(it)?it._panContent:it._vesselContent)||it,r=wrap.getBoundingClientRect();
      if(!r.width)continue;
      const dx=Math.max(r.left-mouse.x,0,mouse.x-r.right),dy=Math.max(r.top-mouse.y,0,mouse.y-r.bottom),d=Math.hypot(dx,dy);
      if(d<bd){bd=d;best=it;}
    }}catch(_){}
    if(best)return best;
    try{const s=screenToScene(mouse.x,mouse.y);return window.CooksterFlour&&CooksterFlour.troughAt?CooksterFlour.troughAt(s.x,s.y):null;}catch(_){return null;}
  }
  // where the lid (the open mouth) of the tilted jar is on the screen: the visible jar is the placement ghost, turned by `tilt` around its pivot
  function lidPoint(jar){
    const g=[...document.querySelectorAll('.ghost-item-copy')].find(x=>x.querySelector('img[src*="calibration_props/zacini/"]'));
    if(!g){const r=jar.getBoundingClientRect();return{x:r.left+r.width*.7,y:r.top+r.height*.2};}
    const rot=g.style.rotate;g.style.rotate='';
    const r=g.getBoundingClientRect(),w=r.width,h=r.height;
    g.style.rotate=rot;
    const ox=w*.5,oy=h*.9,a=tilt*Math.PI/180,vx=w*.5-ox,vy=0-oy;
    return{x:r.left+ox+vx*Math.cos(a)-vy*Math.sin(a),y:r.top+oy+vx*Math.sin(a)+vy*Math.cos(a)};
  }
  function emit(jar,kind,target){
    try{playImpactSound(jar,'sprinkle');}catch(_){}
    const t=target.getBoundingClientRect(),lp=lidPoint(jar),sx=lp.x,sy=lp.y;
    const col=COLORS[kind];
    for(let i=0;i<10;i++){
      const d=document.createElement('div');
      const s=2.5+Math.random()*3;
      d.style.cssText=`position:fixed;left:${sx}px;top:${sy}px;width:${s}px;height:${s}px;border-radius:50%;background:${col[i%2]};z-index:20000;pointer-events:none;transition:transform .55s cubic-bezier(.3,.1,.6,1),opacity .55s`;
      document.body.appendChild(d);
      const tx=t.left+t.width*(.3+Math.random()*.4)-sx,ty=t.top+t.height*(.35+Math.random()*.25)-sy;
      requestAnimationFrame(()=>{d.style.transform=`translate(${tx}px,${ty}px)`;d.style.opacity='.15';});
      setTimeout(()=>d.remove(),650);
    }
  }
  function dose(target,kind){
    let sp={};try{sp=JSON.parse(target.dataset.spices||'{}');}catch(_){}
    if((sp[kind]||0)>=MAX_DOSES)return;
    sp[kind]=(sp[kind]||0)+1;target.dataset.spices=JSON.stringify(sp);
    try{renderVesselContents(target);}catch(_){applyLook(target);}
    counter(target,kind,sp[kind]);
    try{window.dispatchEvent(new CustomEvent('cookster:spice',{detail:{kind:kind,name:NAMES[kind]||kind,n:sp[kind],vessel:String(target.dataset.label||'posuda').replace(/ · .*/,'')}}));}catch(_){}   // snimanje recepta (js/recorder.js)
    try{CooksterSave.schedule();}catch(_){}
  }
  const NAMES={paprika:'mlevena paprika',tucana:'tucana paprika',biber:'biber',so:'so',secer:'šećer',lovor:'lovor'};
  let tag=null,tagTimer=0;
  function counter(target,kind,n){
    if(!tag){tag=document.createElement('div');tag.style.cssText='position:fixed;z-index:20001;pointer-events:none;transform:translate(-50%,-100%);padding:3px 9px;border-radius:8px;background:rgba(40,22,8,.85);color:#fff3d6;font:700 13px system-ui,sans-serif;white-space:nowrap';document.body.appendChild(tag);}
    const r=target.getBoundingClientRect();
    tag.textContent=(NAMES[kind]||kind)+' ×'+n;tag.style.left=(r.left+r.width/2)+'px';tag.style.top=(r.top-4)+'px';tag.style.display='block';
    clearTimeout(tagTimer);tagTimer=setTimeout(()=>{tag.style.display='none';},1400);
  }
  function tick(){
    requestAnimationFrame(tick);
    const jar=(typeof holding!=='undefined'&&holding&&spiceOf(holding))?holding:null;
    if(lastJar&&lastJar!==jar){lastJar.style.rotate='';tilt=0;}
    lastJar=jar;
    if(!jar){
      lastX=0;
      // a jar's placement ghost must never stay behind in a bowl once the jar is let go
      document.querySelectorAll('.ghost-item-copy').forEach(g=>{if(g.querySelector('img[src*="calibration_props/zacini/"]'))g.remove();});
      return;
    }
    const target=vesselNear(jar);
    // the jar tilts away from the side it comes from (from the left: pours to the right, from the right: pours to the left)
    const tr=target?target.getBoundingClientRect():null;
    const goal=target?38*(mouse.x>tr.left+tr.width/2?-1:1):0;
    tilt+=(goal-tilt)*.18;
    jar.style.rotate=tilt.toFixed(1)+'deg';
    document.querySelectorAll('.ghost-item-copy').forEach(g=>{if(g.querySelector('img[src*="calibration_props/zacini/"]'))g.style.rotate=tilt.toFixed(1)+'deg';});
  }
  requestAnimationFrame(tick);

  // While the jar is tilted over a vessel every left click is one measure; the jar is put down only when it is upright (not over a vessel).
  window.addEventListener('pointerdown',e=>{
    if(e.button!==0)return;
    const jar=(typeof holding!=='undefined'&&holding&&spiceOf(holding))?holding:null;
    if(!jar)return;
    const target=vesselNear(jar);
    if(!target||Math.abs(tilt)<12)return;
    e.preventDefault();e.stopImmediatePropagation();
    const kind=spiceOf(jar);
    if(target.dataset&&target.dataset.itemId==='nacve'){
      if(kind!=='secer'){try{showToast('To ne ide u naćve.');}catch(_){}return;}
      emit(jar,kind,target);try{CooksterFlour.addSugar(target);}catch(_){}return;
    }
    emit(jar,kind,target);dose(target,kind);
  },true);

  // ---------- jars stand on the back edge of the table ----------
  const SPOTS={paprika:[470,262],tucana:[540,262],biber:[610,262],so:[680,262],secer:[750,262],lovor:[820,262]};
  function ensureJars(){
    try{
      // the jars are not put on the table any more: they stand in the left drawer of the table (js/kitchen-fixtures.js); the ones that are already on the table (old saves) stay there
      // jars saved with another scale are brought to the scale the game itself uses for their place
      for(const el of (window.items||items)){
        if(!spiceOf(el)||!+el.dataset.cx)continue;
        const v=surfaceScaleFor(el,el.dataset.surfaceZone||'table',+el.dataset.by);
        if(Math.abs((+el.dataset.vis||1)-v)>.01)setPose(el,+el.dataset.cx,+el.dataset.by,v);
      }
      CooksterSave.schedule();
    }catch(_){}
  }
  setTimeout(ensureJars,4500);

  /* ---------- tackice zacina u jelu ----------
     Svaka doza (dataset.spices) ostavlja sitne tackice u boji zacina na samom jelu, na stalnim slucajnim mestima (ne skacu pri crtanju).
     Mesanje kasikom (--stir-mix) ih utapa u jelo: sto je jelo promesanije, to su tackice blede. Prazna posuda nema tackica. */
  const DOTS={
    paprika:{c:['#d8280f','#c21f0c','#e63a14'],n:0,s:1.0,shape:'round',a:.95},
    tucana:{c:['#b3200f','#e0561a','#8e1a0c'],n:11,s:1.45,shape:'flake',a:.95},
    biber:{c:['#1d1511','#2b201a','#120c09'],n:12,s:1.0,shape:'round',a:.95},
    so:{c:['#f7f4ea','#ffffff','#ece7d8'],n:13,s:1.0,shape:'round',a:.92},
    secer:{c:['#fffdf2','#f4ecd2','#fff8dc'],n:13,s:.9,shape:'round',a:.9},
    lovor:{c:['#5f7f2b','#7d8f35','#4c6a22'],n:5,s:2.1,shape:'leaf',a:.95}
  };
  function readSpices(v){try{return JSON.parse(v.dataset.spices||'{}')||{};}catch(_){return {};}}
  function pointsFor(v,kind,doses){
    const cfg=DOTS[kind];v._spiceDots=v._spiceDots||{};
    const want=cfg.n*doses,arr=v._spiceDots[kind]=v._spiceDots[kind]||[];
    while(arr.length<want){
      // stalno slucajno mesto unutar elipse (jelo je otprilike elipsa u posudi)
      let x,y,t=0;do{x=Math.random();y=Math.random();t++;}while(((x-.5)/.46)**2+((y-.5)/.42)**2>1&&t<20);
      arr.push({x,y,r:.7+Math.random()*.6,c:cfg.c[(Math.random()*cfg.c.length)|0],rot:Math.random()*180});
    }
    if(arr.length>want)arr.length=want;
    return arr;
  }
  // the fine ground sweet paprika (aleva) dyes ALL the food of the dish reddish (meat, rice, onion ... also raw and fried): a little for one dose, a bit more for five
  function paprikaTint(wrap,vessel){
    if(!document.getElementById('paprikaTintCss')){const c=document.createElement('style');c.id='paprikaTintCss';
      c.textContent='.paprika-tint>:not(.spice-dots){filter:sepia(calc(var(--pt,0)*1.0)) saturate(calc(1 + var(--pt,0)*2.4)) hue-rotate(calc(var(--pt,0)*-55deg)) brightness(calc(1 - var(--pt,0)*.06))!important}';document.head.appendChild(c);}
    const d=+(readSpices(vessel).paprika||0);
    if(d<=0){wrap.classList.remove('paprika-tint');wrap.style.removeProperty('--pt');return;}
    const t=.16+.5*(1-Math.exp(-(d-1)/4.5));      // 1 dose: .16 (very little), 5 doses: .5, many: ~.66
    wrap.classList.add('paprika-tint');wrap.style.setProperty('--pt',Math.min(.7,t).toFixed(3));
  }
  function renderSpiceDots(wrap,vessel){
    if(!wrap)return;
    vessel=vessel||wrap.closest?.('.item');
    try{if(vessel)paprikaTint(wrap,vessel);}catch(_){}
    const old=wrap._dotsEl;
    const visible=wrap.classList.contains('visible');
    if(!vessel||!visible){
      if(vessel&&vessel._hadFood&&!visible){vessel._hadFood=false;delete vessel.dataset.spices;vessel._spiceDots=null;}   // posuda je ispraznjena: i zacini odlaze
      if(old&&old.parentNode)old.remove();wrap._dotsEl=null;return;
    }
    vessel._hadFood=true;
    const sp=readSpices(vessel),kinds=Object.keys(sp).filter(k=>DOTS[k]&&(+sp[k]||0)>0);
    if(!kinds.length){if(old&&old.parentNode)old.remove();wrap._dotsEl=null;return;}
    const W=wrap.offsetWidth||0,H=wrap.offsetHeight||0;if(W<8||H<8){return;}
    const mix=Math.max(0,Math.min(1,+wrap.style.getPropertyValue('--stir-mix')||0));
    const sig=kinds.map(k=>k+':'+sp[k]).join('|')+'@'+Math.round(W)+'x'+Math.round(H);
    let el=old&&old.isConnected?old:null;
    if(!el||el._sig!==sig){
      if(el)el.remove();
      el=document.createElement('div');el.className='spice-dots';el._sig=sig;
      el.style.cssText='position:absolute;inset:0;pointer-events:none;z-index:3;overflow:hidden';
      const base=Math.max(2.4,Math.min(W,H*1.6)*0.02);
      for(const k of kinds){
        const cfg=DOTS[k],pts=pointsFor(vessel,k,Math.min(+sp[k],MAX_DOSES));
        for(const p of pts){
          const d=document.createElement('i'),sz=base*cfg.s*p.r;
          const w=cfg.shape==='leaf'?sz*1.9:(cfg.shape==='flake'?sz*1.3:sz),h=cfg.shape==='leaf'?sz*.8:sz;
          d.style.cssText='position:absolute;display:block;left:'+(p.x*100).toFixed(2)+'%;top:'+(p.y*100).toFixed(2)+'%;width:'+w.toFixed(1)+'px;height:'+h.toFixed(1)+'px;background:'+p.c
            +';border-radius:'+(cfg.shape==='round'?'50%':(cfg.shape==='leaf'?'60% 40% 60% 40%':'35%'))+';opacity:'+cfg.a+';transform:translate(-50%,-50%) rotate('+p.rot.toFixed(0)+'deg);box-shadow:0 0 0 .5px rgba(0,0,0,.18)';
          el.appendChild(d);
        }
      }
      wrap.appendChild(el);wrap._dotsEl=el;
    }
    el.style.opacity='1';      // the flecks of the coarse pepper are NOT washed out by stirring: they mix with everything, but they stay
  }
  // renderFoodContents (game.js) je jedino mesto koje crta sadrzaj posude: iza njega se crtaju tackice
  (function(){
    const orig=window.renderFoodContents;
    if(typeof orig!=='function'||orig.__dots)return;
    const wrapped=function(wrap,counts,stage,metaItems,batches,heat,mixLevel,vesselArg){
      const r=orig.apply(this,arguments);
      try{renderSpiceDots(wrap,vesselArg||null);}catch(_){}
      return r;
    };
    wrapped.__dots=true;window.renderFoodContents=wrapped;
  })();
  window.CooksterSpices={ensureJars,applyLook};
})();
