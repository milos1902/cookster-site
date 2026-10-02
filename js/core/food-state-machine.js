/* Cookster v197 - food thermal state machine.
   Pure derived state: save files keep thermal numbers, while UI/gameplay read phases here. */
(function(){
  const PHASES=Object.freeze({
    RAW:Object.freeze({id:'raw',label:'Sirovo',rank:0}),
    HEATING:Object.freeze({id:'heating',label:'Zagreva se',rank:1}),
    COOKED:Object.freeze({id:'cooked',label:'Gotovo',rank:2}),
    BROWNED:Object.freeze({id:'browned',label:'Zapečeno',rank:3}),
    BURNT:Object.freeze({id:'burnt',label:'Izgorelo',rank:4})
  });

  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,+v||0));

  function batchPhase(batch,heat=0){
    if(!batch||(+batch.count||0)<=0)return PHASES.RAW;
    if(batch.burnt)return PHASES.BURNT;
    const d=Math.max(0,+batch.doneness||0);
    const over=Math.max(0,+batch.overcook||0);
    if(d>=1&&over>.20)return PHASES.BROWNED;
    if(d>=.82)return PHASES.COOKED;
    if(d>.02||heat>.16)return PHASES.HEATING;
    return PHASES.RAW;
  }

  // 0..78% is raw -> cooked; 78..100% is cooked -> browned/burnt danger.
  function batchProgress(batch){
    if(!batch||(+batch.count||0)<=0)return 0;
    if(batch.burnt)return 1;
    const d=clamp(batch.doneness);
    if(d<1)return d*.78;
    return .78+clamp((+batch.overcook||0)/2)*.22;
  }



  function transitionBatch(batch,heat=0){
    if(!batch)return {changed:false,from:'raw',to:'raw'};
    const from=String(batch.state||'raw');
    const to=batchPhase(batch,heat).id;
    batch.state=to;
    return {changed:from!==to,from,to};
  }

  function batchVisualStage(batch,heat=0){
    const phase=batchPhase(batch,heat);
    if(phase===PHASES.BURNT)return 7;
    if(phase===PHASES.BROWNED)return 6;
    if(phase===PHASES.COOKED)return 5;
    const d=clamp(batch?.doneness);
    return Math.max(1,Math.min(4,1+Math.floor(d*4)));
  }

  function vesselState(model){
    const batches=(model?.batches||[]).filter(b=>(+b.count||0)>0);
    if(!batches.length){
      return {phase:PHASES.RAW,progress:0,visualStage:1,label:PHASES.RAW.label};
    }
    let weight=0,progress=0,phase=PHASES.RAW;
    for(const b of batches){
      const n=Math.max(1,+b.count||1);
      weight+=n;
      progress+=batchProgress(b)*n;
      const p=batchPhase(b,model?.heat||0);
      if(p.rank>phase.rank)phase=p;
    }
    progress=weight?progress/weight:0;
    const visualStage=phase===PHASES.BURNT?7:
      phase===PHASES.BROWNED?6:
      phase===PHASES.COOKED?5:
      Math.max(1,Math.min(4,1+Math.floor(clamp(model?.doneness)*4)));
    return {phase,progress:clamp(progress),visualStage,label:phase.label};
  }

  window.CooksterFoodStateMachine={PHASES,batchPhase,batchProgress,transitionBatch,batchVisualStage,vesselState};
})();
