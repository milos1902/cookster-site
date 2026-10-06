/* Cela glavica kupusa (ili druga cela namirnica) se iz posude vadi klikom na nju u posudi: izađe u ruku kao što je i ušla
   (sveža, kisela ili polovina). Klik na ostatak posude i dalje podiže posudu. */
(function(){
  'use strict';
  function pieceAt(x,y){
    let best=null;
    for(const v of (window.items||items)){
      if(!v||!v._vesselContent||v.offsetParent===null)continue;
      for(const img of v._vesselContent.querySelectorAll('.whole-produce-piece[data-entry-key]')){
        const r=img.getBoundingClientRect();
        if(x<r.left||x>r.right||y<r.top||y>r.bottom)continue;
        const z=+img.style.zIndex||0;
        if(!best||z>best.z)best={v,img,z};
      }
    }
    return best;
  }
  function take(hit,e){
    const v=hit.v,key=hit.img.dataset.entryKey;
    const model=CooksterContainer.read(v),entry=model.items&&model.items[key];
    if(!entry||(+entry.count||0)<=0||entry.form!=='whole'&&!/_celo|_pola_/.test(key))return false;
    const base=entry.baseKey,def=VEGETABLES[base];if(!def)return false;
    entry.count=(+entry.count)-1;
    if(entry.count<=0)delete model.items[key];
    CooksterContainer.write(v,model);
    try{renderVesselContents(v);}catch(_){}
    const half=key==='kupus_pola_kiseli',sour=/kiseli/.test(key);
    const w=half?Math.round(def.w*.8):def.w,h=half?Math.round(def.h*.7):def.h;
    const p=screenToScene(e.clientX,e.clientY);
    const loose=makeItem({id:'veg_'+base+'_'+Date.now(),label:entry.label||def.label,src:entry.src||def.src,x:p.x-w/2,y:p.y-h,w,h,z:++zCounter,snapProfile:'produce'});
    loose.dataset.vegetable='1';loose.dataset.collisionProfile='vegetable';loose.dataset.vegKey=base;loose.dataset.cutState='whole';
    if(sour)loose.dataset.fermentPhase='3';
    if(half)loose.dataset.kupusHalf='1';
    loose.dataset.surfaceZone=v.dataset.surfaceZone||'table';
    setPose(loose,p.x,p.y,+v.dataset.vis||1);
    startHolding(loose);
    try{CooksterSave.schedule();}catch(_){}
    return true;
  }
  window.addEventListener('pointerdown',e=>{
    if(e.button!==0||(typeof holding!=='undefined'&&holding)||(typeof isCutting!=='undefined'&&isCutting))return;
    const hit=pieceAt(e.clientX,e.clientY);
    if(!hit)return;
    if(take(hit,e)){e.preventDefault();e.stopImmediatePropagation();}
  },true);
})();
