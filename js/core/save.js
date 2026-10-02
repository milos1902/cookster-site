/* Cookster v136 - manual save/load only.
   Normal startup always begins fresh.
   SAVE writes a snapshot. LOAD explicitly reloads once from that snapshot.
   No autosave, no beforeunload save, no automatic continuation. */
(function(){
  const KEY='cookster.save.v1';
  const LOAD_ONCE_KEY='cookster.load.once';

  const BACKUP_KEY=KEY+'.before-import';
  function snapshot(){
    const s=window.CooksterState;
    return {
      saveVersion:1,
      savedAt:new Date().toISOString(),
      player:{money:s.player.money,day:s.player.day},
      kitchen:{faucetOn:!!s.kitchen.faucetOn,sinkProduce:JSON.parse(JSON.stringify(s.kitchen.sinkProduce||[]))},
      stove:{
        fireOn:!!s.stove.fireOn,
        fireboxOpen:!!s.stove.fireboxOpen,
        ovenOpen:!!s.stove.ovenOpen,
        fireLevel:+s.stove.fireLevel||0,
        burnEndsAt:+s.stove.burnEndsAt||0
      },
      market:{
        paradajz:+s.market.paradajz||0,
        paprika:+s.market.paprika||0,
        basket:JSON.parse(JSON.stringify(s.market?.basket||{})),
        refusedDayByProduct:JSON.parse(JSON.stringify(s.market?.refusedDayByProduct||{})),
        pendingBags:JSON.parse(JSON.stringify(s.market?.pendingBags||[]))
      },
      garden:{seeds:{paradajz:+s.garden?.seeds?.paradajz||0,krastavac:+s.garden?.seeds?.krastavac||0},selectedSeed:s.garden?.selectedSeed||null,tomatoPlots:JSON.parse(JSON.stringify(s.garden?.tomatoPlots||{})),cucumberPlots:JSON.parse(JSON.stringify(s.garden?.cucumberPlots||{})),crates:JSON.parse(JSON.stringify(s.garden?.crates||[])),carryingCrateId:s.garden?.carryingCrateId||null},
      progression:{unlockedRecipes:[...(s.progression.unlockedRecipes||[])],activeRecipe:s.progression.activeRecipe||null,kitchenEquipment:[...(s.progression.kitchenEquipment||[])]},
      creator:JSON.parse(JSON.stringify(s.creator||{
        drafts:[],posts:[],
        instagram:{followers:0,totalViews:0,totalLikes:0,totalComments:0},
        youtube:{subscribers:0,totalViews:0,totalLikes:0,totalComments:0}
      })),
      ...(s.choppedCalibration?{choppedCalibration:JSON.parse(JSON.stringify(s.choppedCalibration))}:{}),
      ...(s.vesselDepthCalibration?{vesselDepthCalibration:JSON.parse(JSON.stringify(s.vesselDepthCalibration))}:{}),
      world:window.CooksterWorld?.snapshot?.() || s.world || null
    };
  }

  function save(){
    try{
      localStorage.setItem(KEY,JSON.stringify(snapshot()));
      return true;
    }catch(err){
      console.warn('[Cookster] Save failed:',err);
      return false;
    }
  }

  function load(){
    try{
      const raw=localStorage.getItem(KEY);
      if(!raw)return null;
      const data=JSON.parse(raw);
      if(!data || data.saveVersion!==1)return null;
      return window.CooksterSaveFile.validate(data);
    }catch(err){
      console.warn('[Cookster] Load failed:',err);
      return null;
    }
  }

  function clear(){
    try{
      localStorage.removeItem(KEY);
      sessionStorage.removeItem(LOAD_ONCE_KEY);
      return true;
    }catch(_){return false}
  }

  // Existing gameplay code may still call schedule(), but in manual-save mode
  // it intentionally does nothing.
  function schedule(){ return false; }

  function requestLoad(){
    if(!load())return false;
    try{sessionStorage.setItem(LOAD_ONCE_KEY,'1')}catch(_){return false;}
    location.reload();
    return true;
  }

  function exportFile(data=snapshot()){
    window.CooksterSaveFile.validate(data);
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const link=document.createElement('a');
    link.href=url;link.download='Cookster_napredak_'+new Date().toISOString().replace(/[:.]/g,'-')+'.json';
    document.body.appendChild(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),10000);
    return data;
  }
  window.CooksterSave={KEY,BACKUP_KEY,LOAD_ONCE_KEY,snapshot,save,load,clear,schedule,requestLoad,exportFile,exportSavedFile,importConfirmed};
  let shouldLoad=false;
  try{
    shouldLoad=sessionStorage.getItem(LOAD_ONCE_KEY)==='1';
    sessionStorage.removeItem(LOAD_ONCE_KEY);
  }catch(_){}

  if(shouldLoad){
    const loaded=load();
    if(loaded){
      const merge=(t,s)=>{
        for(const [k,v] of Object.entries(s||{})){
          if(['__proto__','prototype','constructor'].includes(k))continue;
          if(v&&typeof v==='object'&&!Array.isArray(v)){
            t[k]??={};
            merge(t[k],v);
          }else if(k!=='savedAt'&&k!=='saveVersion')t[k]=v;
        }
        return t;
      };
      merge(window.CooksterState,loaded);
      window.__COOKSTER_EXPLICIT_LOAD__=true;
    }
  }
  function exportSavedFile(){
    const data=load();
    if(!data)throw new Error('Nema ranijeg ručnog save-a u ovom folderu i pregledaču.');
    return exportFile(data);
  }

  function importConfirmed(data){
    window.CooksterSaveFile.validate(data);
    const serialized=JSON.stringify(data);
    const previous=localStorage.getItem(KEY);
    const previousFlag=sessionStorage.getItem(LOAD_ONCE_KEY);
    // Preserve the old manual save before attempting replacement.
    try{
      if(previous!==null)localStorage.setItem(BACKUP_KEY,previous);
      sessionStorage.setItem(LOAD_ONCE_KEY,'1');
      localStorage.setItem(KEY,serialized);
    }catch(err){
      try{
        if(previousFlag===null)sessionStorage.removeItem(LOAD_ONCE_KEY);
        else sessionStorage.setItem(LOAD_ONCE_KEY,previousFlag);
      }catch(_){}
      throw new Error('Uvoz nije uspeo. Postojeća sačuvana igra nije zamenjena.');
    }
    location.reload();
    return true;
  }
})();
