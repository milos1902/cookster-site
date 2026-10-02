/* Cookster v196 - shared cooking-system facade for pans and pots.
   Keeps engine code independent from a specific cookware sprite/id. */
(function(){
  function defFor(elOrId){
    const id=typeof elOrId==='string'?elOrId:(elOrId?.dataset?.itemId||elOrId?.id||'');
    return (window.CooksterCatalog?.KITCHEN_EQUIPMENT||[]).find(x=>x.id===id)||null;
  }
  function configFor(elOrId){return defFor(elOrId)?.cooking||{};}
  function isHeatable(elOrId){return configFor(elOrId).canHeat===true;}
  function capacity(elOrId){return Math.max(1,+configFor(elOrId).capacity||999);}

  function step(vessel,{dt=0,fireLevel=1,heating=false}={}){
    if(!vessel||!window.CooksterPan)return null;
    const before=CooksterPan.read(vessel);
    const model=CooksterPan.simulate(before,dt,fireLevel,heating);
    CooksterPan.write(vessel,model);
    const active=(model.batches||[]).filter(b=>(+b.count||0)>0);
    const machine=window.CooksterFoodStateMachine;
    const state=machine?.vesselState(model)||{
      phase:{id:model.burnt?'burnt':((+model.doneness||0)>=1?'cooked':'heating'),label:model.burnt?'Izgorelo':'Kuva se'},
      progress:Math.max(0,Math.min(1,+model.doneness||0)),
      visualStage:Math.max(1,Math.min(7,1+Math.floor((+model.doneness||0)*5)))
    };
    const beforeState=machine?.vesselState(before)||null;
    return {
      before,model,state,beforeState,
      count:Object.values(model.ingredients||{}).reduce((s,v)=>s+(+v||0),0),
      becameBurnt:(beforeState?.phase?.id!=='burnt'&&state.phase?.id==='burnt')||(!before.burnt&&!!model.burnt),
      becameCooked:beforeState?.phase?.rank<2&&state.phase?.rank>=2,
      ready:active.length>0&&active.every(b=>(+b.doneness||0)>=.82&&!b.burnt),
      allBurnt:active.length>0&&active.every(b=>!!b.burnt),
      batchFingerprint:active.map(b=>`${b.key}:${b.count}:${Math.floor((+b.doneness||0)*14)}:${Math.floor((+b.overcook||0)*3)}:${b.burnt?1:0}`).join('|')
    };
  }

  function stateFor(vessel){
    const model=window.CooksterPan?.read(vessel);
    return window.CooksterFoodStateMachine?.vesselState(model)||null;
  }

  window.CooksterCooking={defFor,configFor,isHeatable,capacity,step,stateFor};
})();
