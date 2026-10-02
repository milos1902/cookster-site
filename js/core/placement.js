/* Cookster v131 - universal placement surface resolver.
   Geometry stays in game.js adapters; item permissions live in the catalog. */
(function(){
  const registry=new Map();
  function register(name, candidate, priority=0){
    registry.set(name,{name,candidate,priority});
  }
  function allowedFor(el){
    const id=el?.dataset?.itemId||'';
    const catalog=[...(window.CooksterCatalog?.ITEMS||[]),...(window.CooksterCatalog?.KITCHEN_EQUIPMENT||[])];
    const def=catalog.find(x=>x.id===id);

    // Creator camera is a floor tripod.
    if(id==='kamera_stativ')return ['floor'];

    // Every movable item can be tested on the calibrated table and floor.
    // The former under-table plane is intentionally unavailable.
    if(el?.dataset?.crate==='1')return ['table','floor'];
    const allowed=def?.placement?.length?[...def.placement]:[];
    const produce=el?.dataset?.vegetable==='1'||el?.dataset?.fruit==='1';
    if(produce&&!allowed.includes('board'))allowed.push('board');
    if(produce&&!allowed.includes('floor'))allowed.push('floor');
    if(!allowed.includes('table'))allowed.push('table');
    if(!allowed.includes('floor'))allowed.push('floor');
    if(!allowed.includes('stove'))allowed.push('stove');
    const cookware=def?.type==='cookware'||['pot','pan','bowl'].includes(def?.subtype);
    if(cookware&&!allowed.includes('back'))allowed.push('back');
    return [...new Set(allowed)];
  }
  function resolve(el){
    const allowed=allowedFor(el);
    const pointer=window.CooksterPlacementPoint?.();
    const caster=window.CooksterSurfaceCast;

    // v165: one central surface decision first.
    // This prevents neighboring placement candidates from "taking over" the ghost.
    if(caster&&pointer){
      const hit=caster.cast(pointer,allowed);
      if(!hit.hit||!hit.surface)return {inSurface:false,surface:null};

      const reg=registry.get(hit.surface);
      if(!reg)return {inSurface:false,surface:hit.surface};

      const c=reg.candidate(el);
      if(c && c.inSurface!==false){
        c.surface=c.surface||hit.surface;
        c.castHit=hit;
        return c;
      }
      return {inSurface:false,surface:hit.surface,castHit:hit};
    }

    // Safe fallback for old pages/tests.
    const candidates=[...registry.values()]
      .filter(r=>allowed.includes(r.name))
      .sort((a,b)=>b.priority-a.priority);
    for(const r of candidates){
      const c=r.candidate(el);
      if(c && c.inSurface!==false){
        c.surface=c.surface||r.name;
        return c;
      }
    }
    return {inSurface:false,surface:null};
  }
  window.CooksterPlacement={register,resolve,allowedFor};
})();
