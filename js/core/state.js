/* Cookster v130 - single source of truth for persistent/core state. */
(function(){
  const defaults = {
    saveVersion: 1,
    player: { money: 1000, day: 1 },
    interaction: { holdingId: null, hoveringId: null, picking: false, placing: false },
    kitchen: { faucetOn: false, sinkProduce: [] },
    actions: { cutting: null, cleaning: null, washing: null },
    stove: { fireOn:false, fireboxOpen:false, ovenOpen:false, fireLevel:0, burnTimer:0, burnEndsAt:0 },
    market: { paradajz:0, paprika:0, basket:{}, refusedDayByProduct:{}, pendingBags:[] },
    garden: { seeds:{paradajz:0, krastavac:0}, selectedSeed:null, tomatoPlots:{}, cucumberPlots:{}, crates:[], carryingCrateId:null },
    progression: { unlockedRecipes:['sataras','ajvar'], activeRecipe:null, kitchenEquipment:['serpa_velika','tiganj_veliki','tiganj_mali','vangla_srednja','vangla_mala'] },
    creator: {
      drafts: [],
      posts: [],
      instagram: { followers:0, totalViews:0, totalLikes:0, totalComments:0 },
      youtube: { subscribers:0, totalViews:0, totalLikes:0, totalComments:0 }
    },
  };
  const clone = obj => JSON.parse(JSON.stringify(obj));
  const merge = (target, source) => {
    if(!source || typeof source!=='object') return target;
    for(const [k,v] of Object.entries(source)){
      if(v && typeof v==='object' && !Array.isArray(v)){
        if(!target[k] || typeof target[k]!=='object') target[k]={};
        merge(target[k],v);
      } else target[k]=v;
    }
    return target;
  };
  window.CooksterState = merge(clone(defaults), window.__COOKSTER_BOOT_STATE__ || {});
  window.CooksterStateDefaults = defaults;
})();
