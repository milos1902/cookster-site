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
  function readItems(el){try{return CooksterContainer.read(el).items||{};}catch(_){return {};}}
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
    try{return containerAt(mouse.x,mouse.y);}catch(_){return null;}
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
    const target=vesselUnder(jar);
    const goal=target?38:0;
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
    const target=vesselUnder(jar);
    if(!target||tilt<12)return;
    e.preventDefault();e.stopImmediatePropagation();
    const kind=spiceOf(jar);
    emit(jar,kind,target);dose(target,kind);
  },true);

  // ---------- jars stand on the back edge of the table ----------
  const SPOTS={paprika:[470,262],tucana:[540,262],biber:[610,262],so:[680,262],secer:[750,262],lovor:[820,262]};
  function ensureJars(){
    try{
      for(const k of SPICE_IDS){
        const id='zacin_'+k;
        if((window.items||items).some(i=>i.dataset.itemId===id))continue;
        const def=kitchenEquipmentDef(id);if(!def)continue;
        const el=makeItem({...def,instanceId:nextItemInstanceId(id),x:SPOTS[k][0]-def.w/2,y:SPOTS[k][1]-def.h,z:++zCounter});
        if(!el)continue;
        el.dataset.surfaceZone='table';
        setPose(el,SPOTS[k][0],SPOTS[k][1],surfaceScaleFor(el,'table',SPOTS[k][1]));
      }
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
  window.CooksterSpices={ensureJars,applyLook};
})();
