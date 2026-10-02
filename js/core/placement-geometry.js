/* Cookster v164 surface-aware perspective + no-snap ghost — pointer is the exact placement anchor.
   Cookster v132 - placement geometry engine.
   Pure-ish geometry lives here; game.js injects scene-specific helpers/state. */
(function(){
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const rectContains=(p,r)=>p.x>=r.left&&p.x<=r.right&&p.y>=r.top&&p.y<=r.bottom;

  const SURFACES={
    table:{left:94,right:1262,top:236,bottom:704},
    tablePoly:[{x:322,y:243},{x:1211,y:243},{x:1243,y:548},{x:1212,y:612},{x:365,y:612},{x:320,y:548}],
    backPoly:[{x:322,y:166},{x:1221,y:166},{x:1211,y:243},{x:322,y:243}],
    sink:{left:1342,right:1607,top:29,bottom:212},
    sinkRimPoly:[{x:1342,y:29},{x:1592,y:29},{x:1607,y:207},{x:1346,y:207}],
    sinkBasinPoly:[{x:1370,y:55},{x:1572,y:55},{x:1580,y:166},{x:1391,y:166}],
    floorPoly:null,
    floor:{left:72,right:1530,top:710,bottom:920},
    stove:{left:1195,right:1608,top:226,bottom:432}
  };

  // The saved calibration is authoritative for every active placement plane.
  function applyPhaseOneCalibration(){
    let all={};
    try{
      const x=new XMLHttpRequest();
      x.open('GET','assets/scene-calibration.json',false);x.send(null);
      if(x.status>=200&&x.status<300)all=JSON.parse(x.responseText)||{};
    }catch(_){all={}}
    try{
      const saved=JSON.parse(localStorage.getItem('cookster.scene-volumes.v3')||'null')||{};
      all={...all,...saved};
    }catch(_){}
    if(!Object.keys(all).length)return;
    const poly=id=>{
      const raw=all[id]?.points||all[id]?.v?.slice?.(0,4);
      if(!Array.isArray(raw)||raw.length<3)return null;
      return raw.map(q=>({x:+q[0],y:+q[1]})).filter(q=>Number.isFinite(q.x)&&Number.isFinite(q.y));
    };
    const bounds=p=>p.reduce((r,q)=>({
      left:Math.min(r.left,q.x),right:Math.max(r.right,q.x),
      top:Math.min(r.top,q.y),bottom:Math.max(r.bottom,q.y)
    }),{left:Infinity,right:-Infinity,top:Infinity,bottom:-Infinity});
    const table=poly('table'),floor=poly('floor'),sink=poly('sink'),sinkRim=poly('sink-rim');
    if(table){SURFACES.tablePoly=table;SURFACES.table=bounds(table)}
    if(floor){SURFACES.floorPoly=floor;SURFACES.floor=bounds(floor)}
    if(sink){SURFACES.sinkBasinPoly=sink;SURFACES.sink=bounds(sink)}
    if(sinkRim)SURFACES.sinkRimPoly=sinkRim;
  }

  function create(ctx){
    applyPhaseOneCalibration();
    const point=()=>ctx.screenToScene(ctx.mouse.x,ctx.mouse.y);
    const dims=(el,vis,fw=60,fh=60)=>({
      w:(+el.dataset.baseW||el.offsetWidth||fw)*vis,
      h:(+el.dataset.baseH||el.offsetHeight||fh)*vis
    });
    const angle=el=>+(el.dataset.angle||0);

    function tableBounds(){return {...SURFACES.table}}
    function floorBounds(){return {...SURFACES.floor}}
    function stoveBounds(){return {...SURFACES.stove}}
    function sinkBounds(){return {...SURFACES.sink}}

    function floor(el){
      if(!el)return null;
      const sp=point(), b=floorBounds();
      if(SURFACES.floorPoly ? !ctx.pointInPoly(sp.x,sp.y,SURFACES.floorPoly) : !rectContains(sp,b))return null;
      const base=+el.dataset.basePerspective||1;
      const floorT=clamp((sp.y-b.top)/Math.max(1,b.bottom-b.top),0,1);
      // A board leaving any table edge has physically fallen to the lower floor
      // plane, so it must become smaller there. It then grows gradually only as
      // it moves toward the foreground. This prevents the old left/right edge
      // enlargement caused by reusing the tabletop perspective curve.
      const vis=el.dataset.itemId==='daska'
        ? (.68+floorT*.30)
        : (el.dataset.crate==='1'?.90:(ctx.perspectiveAt(sp.y)/base)*1.06);
      const {w,h}=dims(el,vis);
      const cx=sp.x;
      const by=sp.y;
      return {board:null,storage:el.dataset.crate==='1',zone:'floor',profiled:!!ctx.snapProfileFor(el),cx,by,vis,w,h,left:cx-w/2,top:by-h,right:cx+w/2,bottom:by,angle:angle(el),inSurface:true};
    }

    function table(el){
      const sp=point(), bounds=tableBounds(), poly=SURFACES.tablePoly, pr=ctx.snapProfileFor(el);
      if(pr){
        if(!ctx.pointInPoly(sp.x,sp.y,poly))return {inSurface:false};
        const anchorY=sp.y;
        const vis=ctx.profiledScaleAt(el,anchorY),{w,h}=dims(el,vis);
        const cx=sp.x;
        const top=anchorY-h*pr.anchorY;
        return {board:null,profiled:true,zone:'table',cx,by:anchorY,vis,w,h,left:cx-w/2,top,right:cx+w/2,bottom:anchorY,angle:angle(el),inSurface:true};
      }
      const base=+el.dataset.basePerspective||1;
      const rawBy=sp.y;
      const vis=ctx.perspectiveAt(rawBy)/base,{w,h}=dims(el,vis);
      const cx=sp.x;
      const by=rawBy;
      return {board:null,zone:'table',cx,by,vis,w,h,left:cx-w/2,top:by-h,right:cx+w/2,bottom:by,angle:angle(el),inSurface:ctx.pointInPoly(sp.x,sp.y,poly)};
    }

    function sink(el){
      if(!el)return null;
      const sp=point();
      const inside=ctx.pointInPoly(sp.x,sp.y,SURFACES.sinkBasinPoly);
      const rim=ctx.pointInPoly(sp.x,sp.y,SURFACES.sinkRimPoly);
      if(!inside&&!rim)return null;
      const base=+el.dataset.basePerspective||1;
      const by=sp.y;
      const vis=(inside?.68:.76)/base;
      const {w,h}=dims(el,vis,120,90);
      const cx=sp.x;
      return {board:null,zone:inside?'sink-basin':'sink-rim',sink:true,profiled:false,cx,by,vis,w,h,left:cx-w/2,top:by-h,right:cx+w/2,bottom:by,angle:angle(el),inSurface:true};
    }

    function back(el){
      if(!el)return null;
      const sp=point();
      if(!ctx.pointInPoly(sp.x,sp.y,SURFACES.backPoly))return null;
      const base=+el.dataset.basePerspective||1;
      const by=sp.y;
      const vis=.62/base;
      const {w,h}=dims(el,vis,120,90);
      const cx=sp.x;
      return {board:null,zone:'back',back:true,profiled:false,cx,by,vis,w,h,left:cx-w/2,top:by-h,right:cx+w/2,bottom:by,angle:angle(el),inSurface:true};
    }

    function board(el){
      const board=ctx.getBoardEl();
      if(!board||!el||el.dataset.itemId==='daska')return null;
      const sp=point(), poly=ctx.getBoardPoly(board);
      if(!ctx.pointInPoly(sp.x,sp.y,poly))return null;
      const base=+el.dataset.basePerspective||1;
      const by=sp.y;
      const vis=ctx.perspectiveAt(by)/base,{w,h}=dims(el,vis);
      const cx=sp.x;
      return {board,cx,by,vis,w,h,zone:'board',left:cx-w/2,top:by-h,right:cx+w/2,bottom:by,angle:angle(el),inSurface:true};
    }

    function stoveItem(el){
      if(!el)return null;
      const sp=point(),b=stoveBounds();
      if(!rectContains(sp,b))return null;
      const base=+el.dataset.basePerspective||1;
      const by=sp.y;
      const vis=.92/base*ctx.perspectiveAt(by);
      const {w,h}=dims(el,vis,96,72);
      const cx=sp.x;
      return {board:null,zone:'stove',stove:true,profiled:false,cx,by,vis,w,h,left:cx-w/2,top:by-h,right:cx+w/2,bottom:by,angle:angle(el),inSurface:true};
    }

    function stovePan(el){
      if(!ctx.isPanItem(el))return null;
      const sp=point(),b=stoveBounds();
      if(!rectContains(sp,b))return null;
      const base=+el.dataset.basePerspective||1;
      const vis=.92/base*ctx.perspectiveAt(sp.y);
      const {w,h}=dims(el,vis,170,160);
      const cx=sp.x;
      const by=sp.y;
      return {board:null,zone:'stove',stove:true,profiled:false,cx,by,vis,w,h,left:cx-w/2,top:by-h,right:cx+w/2,bottom:by,angle:angle(el),inSurface:true};
    }

    function stoveProduce(el){
      if(!el||el.dataset.vegetable!=='1'||el.dataset.vegKey!=='paprika'||el.dataset.cutState!=='whole')return null;
      const sp=point(),b=stoveBounds();
      if(!rectContains(sp,b))return null;
      const base=+el.dataset.basePerspective||1;
      const by=sp.y;
      const vis=ctx.perspectiveAt(by)/base,{w,h}=dims(el,vis,96,60);
      const cx=sp.x;
      return {board:null,zone:'stove',stove:true,profiled:false,cx,by,vis,w,h,left:cx-w/2,top:by-h,right:cx+w/2,bottom:by,angle:angle(el),inSurface:true};
    }

    function stoveSponge(el){
      if(!ctx.isSponge(el))return null;
      const sp=point(),b=stoveBounds();
      if(!rectContains(sp,b))return null;
      const base=+el.dataset.basePerspective||1;
      const by=sp.y;
      const vis=ctx.perspectiveAt(by)/base,{w,h}=dims(el,vis,74,45);
      const cx=sp.x;
      return {board:null,zone:'stove',stove:true,profiled:false,cx,by,vis,w,h,left:cx-w/2,top:by-h,right:cx+w/2,bottom:by,angle:angle(el),inSurface:true};
    }

    function stove(el){return ctx.isSponge(el)?stoveSponge(el):stovePan(el)}

    return {SURFACES,tableBounds,floorBounds,stoveBounds,sinkBounds,floor,table,board,sink,back,stove,stoveItem,stovePan,stoveProduce,stoveSponge};
  }

  window.CooksterPlacementGeometry={SURFACES,create};
})();
