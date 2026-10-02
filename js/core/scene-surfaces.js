/* Cookster v198.5.171 — invisible scene planes and depth masks.
   These polygons describe the painted scene without drawing debug geometry. */
(function(){
  let bundledCalibration={};
  try{
    const x=new XMLHttpRequest();
    x.open('GET','assets/scene-calibration.json',false);
    x.send(null);
    if(x.status>=200&&x.status<300)bundledCalibration=JSON.parse(x.responseText)||{};
  }catch(_){bundledCalibration={}}
  try{
    const saved=JSON.parse(localStorage.getItem('cookster.scene-volumes.v3')||'null')||{};
    bundledCalibration={...bundledCalibration,...saved};
  }catch(_){}
  const P={
    table:[{x:322,y:243},{x:1211,y:243},{x:1243,y:548},{x:1212,y:612},{x:365,y:612},{x:320,y:548}],
    back:[{x:322,y:166},{x:1221,y:166},{x:1211,y:243},{x:322,y:243}],
    sinkRim:[{x:1342,y:29},{x:1592,y:29},{x:1607,y:207},{x:1346,y:207}],
    sinkBasin:[{x:1370,y:55},{x:1572,y:55},{x:1580,y:166},{x:1391,y:166}],
    sinkFront:[{x:1358,y:164},{x:1579,y:164},{x:1594,y:212},{x:1347,y:212}],
    leftLeg:[{x:370,y:548},{x:418,y:548},{x:403,y:820},{x:365,y:820}],
    rightLeg:[{x:1135,y:548},{x:1186,y:548},{x:1197,y:820},{x:1152,y:820}]
  };
  const bounds=poly=>poly.reduce((r,p)=>({left:Math.min(r.left,p.x),right:Math.max(r.right,p.x),top:Math.min(r.top,p.y),bottom:Math.max(r.bottom,p.y)}),{left:Infinity,right:-Infinity,top:Infinity,bottom:-Infinity});
  function contains(x,y,poly){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const a=poly[i],b=poly[j],cross=((a.y>y)!==(b.y>y))&&(x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x);if(cross)inside=!inside;
  }return inside;}
  function overlapRect(poly,r){const b=bounds(poly);return !(r.right<b.left||r.left>b.right||r.bottom<b.top||r.top>b.bottom);}
  function calibratedZone(id){
    const raw=window.__COOKSTER_SCENE_VOLUMES__?.[id]||bundledCalibration?.[id]||null;
    if(!raw)return null;
    const points=Array.isArray(raw.points)?raw.points:null;
    const vertices=Array.isArray(raw.v)?raw.v:null;
    const clean=list=>(list||[])
      .map(q=>({x:+q[0],y:+q[1]}))
      .filter(q=>Number.isFinite(q.x)&&Number.isFinite(q.y));
    if(vertices?.length>=8){
      return {
        kind:'volume',
        depth:Math.max(0,+raw.depth||0),
        top:clean(vertices.slice(0,4)),
        bottom:clean(vertices.slice(4,8)),
        vertices:clean(vertices)
      };
    }
    const surface=clean(points);
    return surface.length>=3?{kind:raw.kind||'surface',depth:Math.max(0,+raw.depth||0),top:surface,bottom:surface,vertices:surface}:null;
  }
  const api={polygons:P,contains,overlapRect,calibratedZone,
    zoneAt(x,y){
      if(contains(x,y,P.sinkBasin))return 'sink-basin';
      if(contains(x,y,P.sinkRim))return 'sink-rim';
      if(contains(x,y,P.back))return 'back';
      if(contains(x,y,P.table))return 'table';
      return null;
    }
  };
  window.CooksterSceneSurfaces=api;

  // Occluder masks intentionally remain inactive in phase 1. This module only
  // exposes geometry helpers until table/floor continuity has been validated.
})();
