/* Cookster v198.1 - fixed two-burner stove slots.
   Heat is only transferred when heatable cookware is snapped to one of the
   two visible hotplates. Cookware may still be parked elsewhere on the stove.

   Coordinates are calibrated directly against the 1672x941 stove artwork:
     left hotplate  centre ~= (1344.5, 320.8)
     right hotplate centre ~= (1489.2, 338.1)

   A placement candidate snaps only when its NATURAL visual centre overlaps
   a burner capture ellipse. This prevents cookware at the far edge of the
   stove from being magnetised to a burner. */
(function(){
  const SURFACE=Object.freeze({left:1195,right:1608,top:226,bottom:432});

  // rx/ry are only the friendly capture areas. The final pose always uses cx/cy.
  const ZONES=Object.freeze([
    Object.freeze({
      id:'left',label:'leva velika ringla',
      cx:1346.614068,cy:318.345446,rx:17.187500,ry:12.656250,size:'large'
    }),
    Object.freeze({
      id:'right',label:'desna mala ringla',
      cx:1491.116655,cy:336.391896,rx:10.937500,ry:8.281250,size:'small'
    })
  ]);

  const clamp=(v,a,b)=>Math.max(a,Math.min(b,+v||0));

  const CENTER_KEY='cookster.stove-zone-centers.v1';
  let calibratedCenters={};
  try{
    const raw=JSON.parse(localStorage.getItem(CENTER_KEY)||'{}');
    if(raw&&typeof raw==='object')calibratedCenters=raw;
  }catch(_){}
  const SCENE_GEOMETRY_KEY='cookster.scene-volumes.v3';
  function sceneGeometryData(){
    const live=window.__COOKSTER_SCENE_VOLUMES__;
    if(live&&typeof live==='object')return live;
    try{
      const raw=JSON.parse(localStorage.getItem(SCENE_GEOMETRY_KEY)||'{}');
      return raw&&typeof raw==='object'?raw:{};
    }catch(_){return {}}
  }
  function burnerGeometry(id){
    const key=id==='left'?'stove-burner-left':'stove-burner-right';
    const g=sceneGeometryData()[key];
    if(!g)return null;
    const pts=Array.isArray(g.points)?g.points:(Array.isArray(g.v)?g.v.slice(0,4):[]);
    if(pts.length<3)return null;
    const xy=pts.map(p=>Array.isArray(p)?{x:+p[0],y:+p[1]}:{x:+p.x,y:+p.y})
      .filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y));
    if(xy.length<3)return null;

    let area2=0,cx6=0,cy6=0;
    for(let i=0;i<xy.length;i++){
      const a=xy[i],b=xy[(i+1)%xy.length],cross=a.x*b.y-b.x*a.y;
      area2+=cross;cx6+=(a.x+b.x)*cross;cy6+=(a.y+b.y)*cross;
    }
    let cx,cy;
    if(Math.abs(area2)>1e-6){
      cx=cx6/(3*area2);cy=cy6/(3*area2);
    }else{
      cx=xy.reduce((s,p)=>s+p.x,0)/xy.length;
      cy=xy.reduce((s,p)=>s+p.y,0)/xy.length;
    }
    const xs=xy.map(p=>p.x),ys=xy.map(p=>p.y);
    const rx=Math.max(12,(Math.max(...xs)-Math.min(...xs))/2);
    const ry=Math.max(10,(Math.max(...ys)-Math.min(...ys))/2);
    return {cx,cy,rx,ry};
  }
  function liveZone(z){
    if(!z)return null;
    const g=burnerGeometry(z.id);
    if(g)return {...z,...g};
    const c=calibratedCenters[z.id];
    return c&&Number.isFinite(+c.cx)&&Number.isFinite(+c.cy)?{...z,cx:+c.cx,cy:+c.cy}:z;
  }
  function get(id){return liveZone(ZONES.find(z=>z.id===id)||null);}
  function setCenter(id,cx,cy){
    const base=ZONES.find(z=>z.id===id);
    if(!base||!Number.isFinite(+cx)||!Number.isFinite(+cy))return null;
    calibratedCenters[id]={cx:+cx,cy:+cy};
    try{localStorage.setItem(CENTER_KEY,JSON.stringify(calibratedCenters));}catch(_){}
    return get(id);
  }
  function centers(){
    const out={};
    for(const z of ZONES){const q=get(z.id);out[z.id]={cx:q.cx,cy:q.cy};}
    return out;
  }

  function nearest(x,y){
    let best=null,score=Infinity;
    for(const base of ZONES){
      const z=liveZone(base);
      const dx=(+x||0)-z.cx;
      const dy=(+y||0)-z.cy;
      // Normalize by the capture ellipse so both burners compare fairly.
      const d=(dx*dx)/(z.rx*z.rx)+(dy*dy)/(z.ry*z.ry);
      if(d<score){score=d;best=z;}
    }
    return best;
  }

  function inside(z,x,y,margin=1){
    if(!z)return false;
    const dx=((+x||0)-z.cx)/(z.rx*margin);
    const dy=((+y||0)-z.cy)/(z.ry*margin);
    return dx*dx+dy*dy<=1;
  }

  function vesselBodyCenterRatio(el){
    const id=el?.dataset?.itemId||'';
    const preset=window.CooksterVesselVisualPresets?.[id];
    if(preset&&Number.isFinite(+preset.left)&&Number.isFinite(+preset.top)&&
       Number.isFinite(+preset.width)&&Number.isFinite(+preset.height)){
      return {
        x:(+preset.left+(+preset.width)/2)/100,
        y:(+preset.top+(+preset.height)/2)/100
      };
    }
    // Fallback for cookware without a calibrated body rectangle.
    return {x:.5,y:.5};
  }

  function candidateVisualCenter(cand,el=null){
    if(!cand)return null;
    const w=Math.max(1,+cand.w||1),h=Math.max(1,+cand.h||1);
    const c=vesselBodyCenterRatio(el);
    return {
      x:(+cand.cx||0)+(c.x-.5)*w,
      y:(+cand.by||0)-(1-c.y)*h
    };
  }

  function zoneForCandidate(cand,el=null){
    const p=candidateVisualCenter(cand,el);
    if(!p)return null;
    // If capture ellipses ever overlap, nearest() resolves deterministically.
    const hits=ZONES.map(liveZone).filter(z=>inside(z,p.x,p.y));
    if(!hits.length)return null;
    if(hits.length===1)return hits[0];
    return hits.sort((a,b)=>{
      const da=((p.x-a.cx)/a.rx)**2+((p.y-a.cy)/a.ry)**2;
      const db=((p.x-b.cx)/b.rx)**2+((p.y-b.cy)/b.ry)**2;
      return da-db;
    })[0];
  }

  function elementVisualCenter(el){
    if(!el?.dataset)return null;
    const vis=Math.max(.01,+el.dataset.vis||1);
    const w=Math.max(1,(+el.dataset.baseW||el.offsetWidth||100)*vis);
    const h=Math.max(1,(+el.dataset.baseH||el.offsetHeight||80)*vis);
    const c=vesselBodyCenterRatio(el);
    return {
      x:(+el.dataset.cx||0)+(c.x-.5)*w,
      y:(+el.dataset.by||0)-(1-c.y)*h
    };
  }

  function zoneForElement(el){
    const p=elementVisualCenter(el);
    if(!p)return null;
    const hits=ZONES.map(liveZone).filter(z=>inside(z,p.x,p.y,.72));
    return hits.length?nearest(p.x,p.y):null;
  }

  function snapToZone(cand,el,zoneId){
    // Burner snapping intentionally disabled.
    if(!cand)return cand;
    const free={...cand,burnerSnap:false};
    delete free.stoveZone;
    delete free.stoveZoneLabel;
    return free;
  }

  function snappedCandidate(cand,el){
    // Burner snapping intentionally disabled: stove placement stays free.
    if(!cand)return cand;
    const free={...cand,burnerSnap:false};
    delete free.stoveZone;
    delete free.stoveZoneLabel;
    return free;
  }

  function occupied(zoneId,items,ignore=null){
    if(!zoneId)return false;
    return (items||[]).some(el=>{
      if(!el||el===ignore||!el.dataset)return false;
      if(el.classList?.contains('held'))return false;
      return el.dataset.surfaceZone==='stove' &&
        el.dataset.stoveZone===zoneId &&
        (el.dataset.container==='1'||el.dataset.onStoveTop==='1');
    });
  }

  function assign(el,zoneId){
    if(!el?.dataset)return null;
    const z=get(zoneId);
    if(!z)return null;
    el.dataset.stoveZone=z.id;
    return z;
  }

  // Claim exactly the burner the vessel is already on. Never silently move a
  // vessel to the other burner just because the preferred burner is occupied.
  function claim(el,items){
    if(!el?.dataset||el.dataset.surfaceZone!=='stove')return null;
    let z=get(el.dataset.stoveZone);
    if(!z)z=zoneForElement(el);
    if(!z){release(el);return null;}
    if(occupied(z.id,items,el)){release(el);return null;}
    return assign(el,z.id);
  }

  function release(el){
    if(el?.dataset)delete el.dataset.stoveZone;
  }

  function migrate(el){
    if(!el?.dataset||el.dataset.surfaceZone!=='stove')return null;
    const existing=get(el.dataset.stoveZone);
    if(existing)return existing;
    const z=zoneForElement(el);
    return z?assign(el,z.id):null;
  }

  window.CooksterStoveZones={
    SURFACE,ZONES,CENTER_KEY,SCENE_GEOMETRY_KEY,get,nearest,inside,setCenter,centers,
    candidateVisualCenter,zoneForCandidate,zoneForElement,
    snapToZone,snappedCandidate,occupied,assign,claim,release,migrate
  };
})();
