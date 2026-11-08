/* A whole vegetable (a head of cabbage, a pepper, an eggplant...) is taken out of any vessel by a click on it: it comes into the hand as it went in
   (fresh, sour, half, roasted, peeled...). A click on the rest of the vessel still lifts the vessel.
   Works for both models of a vessel: the cooking model (CooksterPan: everything that can be heated) and the container model (CooksterContainer). */
(function(){
  'use strict';
  const SEL='.whole-produce-piece[data-entry-key],.whole-roasted-pepper[data-entry-key]';
  function wrapOf(v){return v&&(v._vesselContent||v._panContent)||null;}
  function pieceAt(x,y){
    let best=null;
    for(const v of (window.items||items)){
      const w=wrapOf(v);
      if(!v||!w||v.offsetParent===null)continue;
      const hosts=v._wholeLayer?[w,v._wholeLayer]:[w];      // whole pieces of plates / boards lie in their own layer (without the cut)
      for(const img of hosts.flatMap(h=>[...h.querySelectorAll(SEL)])){
        const r=img.getBoundingClientRect();
        if(x<r.left||x>r.right||y<r.top||y>r.bottom)continue;
        const z=+img.style.zIndex||0;
        if(!best||z>best.z)best={v,img,z};
      }
    }
    return best;
  }
  const heatable=v=>typeof isHeatableCookwareItem==='function'&&isHeatableCookwareItem(v);
  // what the vessel remembers about this ingredient (picture, label, form)
  function entryOf(v,key){
    if(heatable(v)){
      const n=+((CooksterPan.read(v).ingredients||{})[key])||0;
      if(n<=0)return null;
      const meta=(typeof readPanIngredientMeta==='function'?readPanIngredientMeta(v):{})[key]||{};
      return {count:n,...meta};
    }
    const e=(CooksterContainer.read(v).items||{})[key];
    return e&&(+e.count||0)>0?e:null;
  }
  function removeOne(v,key){
    if(heatable(v)){CooksterPan.removeIngredient(v,key,1);try{renderCookwareContents(v);}catch(_){}try{updateCookingStatus(v);}catch(_){}return;}
    const model=CooksterContainer.read(v),e=model.items[key];
    e.count=(+e.count)-1;if(e.count<=0)delete model.items[key];
    CooksterContainer.write(v,model);try{renderVesselContents(v);}catch(_){}
  }
  // the state of a roasted vegetable is written back on the item, so the hand shows (and later cuts / peels) it as it was
  function restoreState(el,key){
    const d=el.dataset;
    let m;
    if((m=/^paprika_pecena_(\d)$/.exec(key))||key==='paprika_pecena'){
      d.vegKey='paprika';d.roastPhase=String(m?+m[1]:4);d.roastProgress=(+d.roastPhase>=4?'.80':'.5');d.steamedPepper='1';
      if(+d.roastPhase>=4){d.readyToPeel='1';d.peelHits='0';}
    }else if(key==='paprika_pecena_oljustena'){
      d.vegKey='paprika';d.roastPhase='4';d.roastProgress='.80';d.steamedPepper='1';d.peeled='1';d.peelHits='2';d.readyToPeel='0';
    }else if(key==='paprika_zelena_pecena_neoljustena'){
      d.vegKey='paprika_zelena';d.roastPhase='3';d.roastProgress='1';d.readyToPeel='1';d.peelHits='0';
    }else if(key==='paprika_zelena_pecena_oljustena'){
      d.vegKey='paprika_zelena';d.roastPhase='3';d.roastProgress='1';d.peeled='1';d.peelHits='2';d.readyToPeel='0';
    }
  }
  function take(hit,e){
    const v=hit.v,key=hit.img.dataset.entryKey,entry=entryOf(v,key);
    if(!entry)return false;
    const whole=entry.form==='whole'||entry.form==='whole_roasted'||/_celo|_pola_|^paprika_pecena|^paprika_zelena_pecena/.test(key);
    if(!whole)return false;
    const base=entry.baseKey||String(key).replace(/_(pecena|zagorela|rostilj_zagorela|rostilj|krike(?:_rare|_med|_wd)?)_celo$/,'').replace(/_celo$/,''),def=VEGETABLES[base];if(!def)return false;
    // a slice of meat comes out as cooked as it is: what it was before (key ..._pecena_celo / ..._zagorela_celo) or what it has become in the vessel (stage 4 fried, 6 burnt)
    let outSrc=entry.src||def.src,outLabel=entry.label||def.label,meatDone='';
    if(def.meat==='snicla'&&/_krike(_rare|_med|_wd)?_celo$/.test(key)){outSrc=entry.src||outSrc;outLabel='Naseckana šnicla sa roštilja';meatDone='sliced';}
    else if(def.meat==='snicla'&&/_rostilj(_zagorela)?_celo$/.test(key)){      // from the grill: comes out as the grilled picture
      const bt=/_rostilj_zagorela_celo$/.test(key);
      outSrc=(bt?def.grilledWellDoneSrc:def.grilledSrc)||outSrc;outLabel=bt?'Zagorela šnicla sa roštilja':'Šnicla sa roštilja';meatDone=bt?'grilledBurnt':'grilled';
    }else if(def.meat==='snicla'){
      let st=/_zagorela_celo$/.test(key)?6:(/_pecena_celo$/.test(key)?4:1);
      if(heatable(v)){
        try{
          const m=CooksterPan.read(v);
          st=Math.max(st,(window.CooksterFoodStateMachine&&CooksterFoodStateMachine.vesselState(m)&&CooksterFoodStateMachine.vesselState(m).visualStage)||panTextureStage(Math.max(0,+m.doneness||0),!!m.burnt));
        }catch(_){}
      }
      if(st>=6&&def.wellDoneSrc){outSrc=def.wellDoneSrc;outLabel='Zagorela šnicla';meatDone='burnt';}
      else if(st>=4&&def.friedSrc){outSrc=def.friedSrc;outLabel='Pečena šnicla';meatDone='fried';}
      else{outSrc=def.src;outLabel=def.label;}
    }
    removeOne(v,key);
    const half=key==='kupus_pola_kiseli',sour=/kiseli/.test(key);
    const sl=meatDone==='sliced'&&def.grilledSliced;
    const w=sl?def.grilledSliced.w:half?Math.round(def.w*.8):def.w,h=sl?def.grilledSliced.h:half?Math.round(def.h*.7):def.h;
    const p=screenToScene(e.clientX,e.clientY);
    const loose=makeItem({id:'veg_'+base+'_'+Date.now(),label:outLabel,src:outSrc,x:p.x-w/2,y:p.y-h,w,h,z:++zCounter,snapProfile:'produce'});
    if(meatDone)loose.dataset.meatDone=meatDone;
    if(meatDone==='sliced'){loose.dataset.grillSliced='1';loose.dataset.cutState='sliced';}
    loose.dataset.vegetable='1';loose.dataset.collisionProfile='vegetable';loose.dataset.vegKey=base;loose.dataset.cutState='whole';
    if(sour)loose.dataset.fermentPhase='3';
    if(half)loose.dataset.kupusHalf='1';
    restoreState(loose,key);
    loose.dataset.surfaceZone=v.dataset.surfaceZone==='stove'?'table':(v.dataset.surfaceZone||'table');
    setPose(loose,p.x,p.y,+v.dataset.vis||1);
    startHolding(loose);
    try{CooksterSave.schedule();}catch(_){}
    return true;
  }
  window.CooksterVesselTake={pieceAt};
  window.addEventListener('pointerdown',e=>{
    if(e.button!==0||(typeof holding!=='undefined'&&holding)||(typeof isCutting!=='undefined'&&isCutting))return;
    const hit=pieceAt(e.clientX,e.clientY);
    if(!hit)return;
    if(take(hit,e)){e.preventDefault();e.stopImmediatePropagation();}
  },true);
})();
