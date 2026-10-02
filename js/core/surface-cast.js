/* Cookster v165 - central 2D surface cast.
   This is the 2D equivalent of a 3D raycast for placement:
   ask once what surface is under the pointer, then let placement geometry
   compute the pose for that surface. */
(function(){
  const registry=new Map();

  function register(name, hitTest, priority=0){
    if(!name||typeof hitTest!=='function')return false;
    registry.set(name,{name,hitTest,priority:+priority||0});
    return true;
  }

  function unregister(name){
    return registry.delete(name);
  }

  function cast(point, allowed=null){
    if(!point||!Number.isFinite(point.x)||!Number.isFinite(point.y))
      return {surface:null,point:null,hit:false};

    const allowedSet=Array.isArray(allowed)?new Set(allowed):null;
    const tests=[...registry.values()]
      .filter(r=>!allowedSet||allowedSet.has(r.name))
      .sort((a,b)=>b.priority-a.priority);

    for(const r of tests){
      let result=false;
      try{ result=r.hitTest(point); }catch(err){
        console.warn('[CooksterSurfaceCast] hit test failed:',r.name,err);
        continue;
      }
      if(!result)continue;

      if(result===true){
        return {surface:r.name,point:{x:point.x,y:point.y},hit:true};
      }
      if(typeof result==='object'){
        return {
          ...result,
          surface:result.surface||r.name,
          point:result.point||{x:point.x,y:point.y},
          hit:true
        };
      }
    }
    return {surface:null,point:{x:point.x,y:point.y},hit:false};
  }

  function list(){
    return [...registry.values()]
      .sort((a,b)=>b.priority-a.priority)
      .map(r=>({name:r.name,priority:r.priority}));
  }

  window.CooksterSurfaceCast={register,unregister,cast,list};
})();
