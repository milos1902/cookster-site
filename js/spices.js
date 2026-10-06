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
  const SHAKES_PER_DOSE=3;                                 // direction changes of the mouse needed for one dose
  const MAX_DOSES=6;
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
  function emit(jar,kind,target){
    const r=jar.getBoundingClientRect(),t=target.getBoundingClientRect();
    const sx=r.left+r.width*(.5+.30*Math.sin(tilt*Math.PI/180)),sy=r.top+r.height*.12;
    const col=COLORS[kind];
    for(let i=0;i<7;i++){
      const d=document.createElement('div');
      const s=2+Math.random()*3;
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
    try{CooksterSave.schedule();}catch(_){}
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
    const kind=spiceOf(jar),target=vesselUnder(jar);
    const goal=target?38:0;
    tilt+=(goal-tilt)*.18;
    jar.style.rotate=tilt.toFixed(1)+'deg';
    const dx=mouse.x-lastX;lastX=mouse.x;
    if(!target){lastDir=0;travel=0;shakes=0;return;}
    if(Math.abs(dx)>2.5){
      const dir=dx>0?1:-1;
      if(lastDir&&dir!==lastDir){
        shakes++;emit(jar,kind,target);
        if(shakes>=SHAKES_PER_DOSE){shakes=0;dose(target,kind);}
      }
      lastDir=dir;
    }
  }
  requestAnimationFrame(tick);

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
        setPose(el,SPOTS[k][0],SPOTS[k][1],1);
      }
      CooksterSave.schedule();
    }catch(_){}
  }
  setTimeout(ensureJars,4500);
  window.CooksterSpices={ensureJars,applyLook};
})();
