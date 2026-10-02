/* Cookster v198.5.23 — thermal state preservation across vessel transfers.
   IMPORTANT:
   - Never recreate transferred food as "raw".
   - Never serialize a second independent "currentColor" that can drift.
   - Persist the real cooking batch state and derive visuals from it.
*/
(function(){
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,+v||0));
  let batchSeq=0;

  function normalizeBatch(raw={}){
    const b=(raw&&typeof raw==='object')?raw:{};
    return {
      id:String(b.id||`transfer_batch_${Date.now()}_${++batchSeq}`),
      key:String(b.key||'ingredient'),
      count:Math.max(0,+b.count||0),
      doneness:Math.max(0,+b.doneness||0),
      overcook:Math.max(0,+b.overcook||0),
      burnt:!!b.burnt,
      state:String(b.state||'raw'),
      cookSpeed:Math.max(.1,+b.cookSpeed||1),
      burnSpeed:Math.max(.1,+b.burnSpeed||1)
    };
  }

  function cloneBatches(batches){
    return (Array.isArray(batches)?batches:[])
      .map(normalizeBatch)
      .filter(b=>b.count>0);
  }

  function summarizeBatches(batches,heat=0){
    const clean=cloneBatches(batches);
    const total=clean.reduce((s,b)=>s+b.count,0);

    if(total<=0){
      return {
        batches:clean,
        heat:Math.max(0,+heat||0),
        doneness:0,
        overcook:0,
        burnt:false,
        total:0
      };
    }

    return {
      batches:clean,
      heat:Math.max(0,+heat||0),
      doneness:clean.reduce((s,b)=>s+b.doneness*b.count,0)/total,
      overcook:Math.max(0,...clean.map(b=>b.overcook)),
      burnt:clean.some(b=>b.burnt),
      total
    };
  }

  function fallbackPhase(summary){
    if(summary.burnt)return {id:'burnt',label:'Izgorelo',rank:4};
    if(summary.doneness>=1&&summary.overcook>.20)return {id:'browned',label:'Zapečeno',rank:3};
    if(summary.doneness>=.82)return {id:'cooked',label:'Gotovo',rank:2};
    if(summary.doneness>.02||summary.heat>.16)return {id:'heating',label:'Zagreva se',rank:1};
    return {id:'raw',label:'Sirovo',rank:0};
  }

  function fallbackVisualStage(summary,phase){
    if(phase.id==='burnt')return 7;
    if(phase.id==='browned')return 6;
    if(phase.id==='cooked')return 5;
    return Math.max(1,Math.min(4,1+Math.floor(clamp(summary.doneness)*4)));
  }

  function visualState(batches,heat=0){
    const summary=summarizeBatches(batches,heat);
    const machine=window.CooksterFoodStateMachine;

    if(machine?.vesselState){
      const state=machine.vesselState(summary);
      return {
        ...summary,
        phase:state.phase,
        progress:Math.max(0,Math.min(1,+state.progress||0)),
        visualStage:Math.max(1,Math.min(7,+state.visualStage||1)),
        label:state.label||state.phase?.label||''
      };
    }

    const phase=fallbackPhase(summary);
    return {
      ...summary,
      phase,
      progress:clamp(summary.doneness),
      visualStage:fallbackVisualStage(summary,phase),
      label:phase.label
    };
  }

  function stageForKey(batches,key,heat=0){
    const filtered=cloneBatches(batches).filter(b=>b.key===key);
    return visualState(filtered,heat).visualStage;
  }

  window.CooksterTransferThermal={
    normalizeBatch,
    cloneBatches,
    summarizeBatches,
    visualState,
    stageForKey
  };
})();
