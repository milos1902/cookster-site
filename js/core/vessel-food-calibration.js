/* Cookster — imported vessel food visibility calibration.
   Source: the latest populated profiles from calibration exports (3)–(8).
   The large-pot insertion and juggling behavior remains project-specific. */
(function(){
  'use strict';
  // Retire the old inline geometry snapshots before the gameplay runtime
  // starts. They belong to the previous calibration system and must not be
  // allowed to become an alternate source for the large pot.
  try{
    delete window.__COOKSTER_IMPORTED_GEOMETRY__;
    delete window.__COOKSTER_IMPORTED_CALIBRATION__;
  }catch(_){}
  const points=s=>s.split(';').map(p=>p.split(',').map(Number));
  // Rough starting profiles (a guess from the picture) for the vessels that have not been calibrated yet, so that the food stays inside the opening.
  // They are made from the ellipse of the opening (centre, radii, percent of the picture) and the top of the heap.
  // Replace any of them by calibrating the vessel in the tool "Maska posude" and putting the exported profile into PROFILES.
  const ellipse=(cx,cy,rx,ry,n,from=0,to=Math.PI*2)=>{const o=[];for(let i=0;i<=n;i++){const a=from+(to-from)*i/n;o.push([+(cx+rx*Math.cos(a)).toFixed(2),+(cy+ry*Math.sin(a)).toFixed(2)])}return o};
  function guessProfile(cx,cy,rx,ry,top,wallBottom=100){
    // food: the upper half of the opening reaches up to the top of the heap, the lower half is the opening itself
    const upper=[[cx-rx*.92,cy],[cx-rx*.8,top+(cy-top)*.45],[cx-rx*.5,top+(cy-top)*.12],[cx,top],[cx+rx*.5,top+(cy-top)*.12],[cx+rx*.8,top+(cy-top)*.45],[cx+rx*.92,cy]];
    const lower=ellipse(cx,cy,rx*.92,ry*.92,10,0,Math.PI).map(p=>p);
    // the front wall hides what is below the front rim
    const rim=ellipse(cx,cy,rx,ry,10,Math.PI,0);          // from the right side ... see below
    const front=ellipse(cx,cy,rx,ry,10,0,Math.PI);          // right -> bottom -> left (the front rim line)
    const mask=front.concat([[Math.max(0,cx-rx*1.02),Math.min(wallBottom,cy+ry+(wallBottom-cy-ry)*.5)],[Math.max(0,cx-rx*.7),wallBottom],[Math.min(100,cx+rx*.7),wallBottom],[Math.min(100,cx+rx*1.02),Math.min(wallBottom,cy+ry+(wallBottom-cy-ry)*.5)]]);
    return {
      guess:true,
      mask:mask.map(p=>[+p[0].toFixed(2),+p[1].toFixed(2)]),
      foodVisible:upper.concat(lower.slice().reverse().map(p=>[p[0],p[1]])).map(p=>[+p[0].toFixed(2),+p[1].toFixed(2)]),
      bottom:ellipse(cx,cy+ry*.15,rx*.6,ry*.5,12),
      depth:{bottom:[cx,+(cy+ry*.2).toFixed(2)],foodTop:[cx,+(top+(cy-top)*.2).toFixed(2)]}
    };
  }
  const PROFILES={
    tiganj_veliki:{
      // Latest user export: vessel-image-local-percent (blue bottom / green foodVisible).
      mask:[],
      foodVisible:points('20.329,55.911;16.908,45.83;16.513,34.629;21.382,24.827;27.961,18.386;36.513,13.066;47.697,9.985;58.75,9.985;68.882,12.645;79.013,16.846;86.118,23.847;90.855,33.368;91.776,43.45;89.408,54.091;83.5,63.4;76.5,69.2;63.355,73.6;50.461,74.8;36.382,71.6;26.0,65.2;21.0,60.0'),   // the lower edge was ~4 % too high: a dark band without food showed under the food at the front rim
      bottom:points('21.645,53.951;21.118,46.67;24.408,34.909;32.697,25.807;41.645,20.627;54.408,18.246;66.118,20.067;76.513,24.267;83.355,31.688;87.961,41.489;87.829,51.291;84.671,58.852;80.329,63.192;66.908,69.633;55.329,71.034;40.461,69.213;30.461,64.733;23.882,59.692'),
      depth:{bottom:points('53.882,56.612')[0],foodTop:points('60.855,5.084')[0]}
    },
    kal_02_cinija_mala:guessProfile(50.2,20.4,42.4,12.1,0,100),
    kal_02_cinija_velika:guessProfile(50.3,19.8,43.3,15.6,0,100),
    kal_02_tanjir_ravni:guessProfile(48.6,42.8,29.2,22.8,18,100),
    kal_02_duboki_tanjir:guessProfile(53,52,29,24,22,100),
    kal_01_okrugli_pleh:guessProfile(49.3,42.8,46,38,8,100),
  };
  const copy=v=>JSON.parse(JSON.stringify(v));
  const polygon=points=>`polygon(${points.map(p=>`${p[0]}% ${p[1]}%`).join(',')})`;
  // the edge of a drawn area fades softly (a blurred white polygon as the mask) instead of a sharp cut; the picture has 10% of room around, so the blur is not cut at the border
  const SOFT=1.5,softCache=new Map();
  function softMask(points,sd){
    const key=points.map(p=>p[0]+','+p[1]).join(' ')+'|'+sd;
    let u=softCache.get(key);
    if(!u){
      const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 120 120" preserveAspectRatio="none"><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${sd}"/></filter><polygon filter="url(#b)" fill="#fff" points="${key.split('|')[0]}"/></svg>`;
      u=`url("data:image/svg+xml,${encodeURIComponent(svg)}")`;softCache.set(key,u);
    }
    return u;
  }
  function applySoft(el,points,sd){
    if(!(sd>0)){el.style.clipPath=polygon(points);el.style.webkitClipPath=el.style.clipPath;for(const k of ['maskImage','webkitMaskImage'])el.style[k]='none';return;}
    const u=softMask(points,sd);
    el.style.clipPath='none';el.style.webkitClipPath='none';
    for(const pre of ['','webkit']){
      const k=n=>pre?pre+n[0].toUpperCase()+n.slice(1):n;
      el.style[k('maskImage')]=u;el.style[k('maskSize')]='120% 120%';el.style[k('maskPosition')]='50% 50%';el.style[k('maskRepeat')]='no-repeat';
    }
  }
  function frameFor(vesselOrId){
    const profile=get(vesselOrId);
    if(!profile?.foodVisible?.length)return null;
    let left=100,top=100,right=0,bottom=0;
    for(const [x,y] of profile.foodVisible){
      left=Math.min(left,x);top=Math.min(top,y);
      right=Math.max(right,x);bottom=Math.max(bottom,y);
    }
    return {
      left,top,width:Math.max(1,right-left),height:Math.max(1,bottom-top),
      clipX:50,clipY:50,frontTop:50,roastBottom:66
    };
  }

  try{
    [
      'cookster.chopped-calibration.v1',
      'cookster.vessel-food-area.v1',
      'cookster.vessel-depth-calibration.v1'
    ].forEach(key=>localStorage.removeItem(key));
  }catch(_){}
  try{
    const saveKey='cookster.save.v1';
    const saved=JSON.parse(localStorage.getItem(saveKey)||'null');
    if(saved&&typeof saved==='object'&&
       (Object.prototype.hasOwnProperty.call(saved,'choppedCalibration')||
        Object.prototype.hasOwnProperty.call(saved,'vesselDepthCalibration'))){
      delete saved.choppedCalibration;
      delete saved.vesselDepthCalibration;
      localStorage.setItem(saveKey,JSON.stringify(saved));
    }
  }catch(_){}

  function baseGet(vesselOrId){
    const id=typeof vesselOrId==='string'
      ?vesselOrId
      :(vesselOrId?.dataset?.itemId||'');
    const pr=PROFILES[id]||null;
    // a vessel whose profile is only a guess, but which Miloš calibrated in the tool "Maska hrane u posudi" (js/data/vessel-food-zones.js, loaded later: it is read here, when it is needed),
    // uses his area of the food: otherwise the pieces of the hand cut (js/piece-sim.js) are crowded into a small guessed ellipse and look tiny and dark
    if(pr&&pr.guess){
      const z=window.__COOKSTER_VESSEL_FOOD_ZONES__&&window.__COOKSTER_VESSEL_FOOD_ZONES__[id];
      if(z&&Array.isArray(z.foodVisible)&&z.foodVisible.length>=3&&z.depth&&z.depth.bottom&&z.depth.foodTop){
        const c=zoneCache[id];if(c&&c.z===z)return c.p;
        const p={mask:pr.mask,foodVisible:z.foodVisible,bottom:Array.isArray(z.bottom)&&z.bottom.length>=3?z.bottom:pr.bottom,depth:{bottom:z.depth.bottom,foodTop:z.depth.foodTop}};
        zoneCache[id]={z,p};return p;
      }
    }
    return pr;
  }
  const zoneCache={};
  let GENERIC=null;

  // what Miloš draws in the tool "Maska posude" is used by the game at once (and every time the game starts, from the same browser memory):
  // LIVE[id] = {mask,foodVisible,bottom,depth:{bottom,foodTop}} in [x,y] pairs; every part that is drawn (a polygon of 3+ points, a point) replaces that part of the built-in profile
  const LIVE={},DEF={},liveCache={};
  const pair=p=>Array.isArray(p)?[+p[0],+p[1]]:(p&&Number.isFinite(+p.x)?[+p.x,+p.y]:null);
  const area2=pl=>{let a=0;for(let i=0;i<pl.length;i++){const p=pl[i],q=pl[(i+1)%pl.length];a+=p[0]*q[1]-q[0]*p[1];}return Math.abs(a)/2;};
  const poly3=(l,min)=>{const r=Array.isArray(l)&&l.length>=3?l.map(pair).filter(Boolean):null;return r&&r.length>=3&&area2(r)>=min?r:null;};      // (a polygon of 3 points that is a tiny sliver is not a drawing)
  function convert(shape){
    const o={};if(!shape)return o;
    const m=poly3(shape.mask,150),f=poly3(shape.foodVisible,100),b=poly3(shape.bottom,50),db=pair(shape.depth&&shape.depth.bottom),dt=pair(shape.depth&&shape.depth.foodTop);
    if(m)o.mask=m;if(f)o.foodVisible=f;if(b)o.bottom=b;
    if(db||dt)o.depth={bottom:db,foodTop:dt};
    if(shape.soft!=null&&Number.isFinite(+shape.soft))o.soft=Math.max(0,Math.min(6,+shape.soft));
    return o;
  }
  function setLive(id,shape){
    if(!id)return;
    const o=convert(shape);
    if(Object.keys(o).length)LIVE[id]=o;else delete LIVE[id];
    delete liveCache[id];
  }
  function importDefaults(){
    const e=window.__COOKSTER_VESSEL_FOOD_CAL_EXPORT__;
    if(e)Object.keys(e).forEach(id=>{const o=convert(e[id]);if(Object.keys(o).length)DEF[id]=o;});
  }
  // 2026-10-13: everything saved earlier is erased except the big frying pan (tiganj_veliki), once per browser
  function resetOldSaved(){
    try{
      if(localStorage.getItem('cookster.vessel-food-mask-calibration.reset-2026-10-13'))return;
      const d=JSON.parse(localStorage.getItem('cookster.vessel-food-mask-calibration.v1')||'null');
      if(d&&d.vessels){Object.keys(d.vessels).forEach(id=>{if(id!=='tiganj_veliki')delete d.vessels[id];});localStorage.setItem('cookster.vessel-food-mask-calibration.v1',JSON.stringify(d));}
      localStorage.setItem('cookster.vessel-food-mask-calibration.reset-2026-10-13','1');
    }catch(_){}
  }
  function importSaved(){
    resetOldSaved();
    try{
      const d=JSON.parse(localStorage.getItem('cookster.vessel-food-mask-calibration.v1')||'null');
      if(d&&d.vessels)Object.keys(d.vessels).forEach(id=>setLive(id,d.vessels[id]));
    }catch(_){}
  }
  function get(vesselOrId){
    const id=typeof vesselOrId==='string'?vesselOrId:(vesselOrId?.dataset?.itemId||'');
    const lv=LIVE[id],df=DEF[id];
    // a vessel without any older profile that the player starts to draw in the tool: what is not drawn yet is a rough guess, so every drawn part works at once
    const base=baseGet(id)||((lv||df)?(GENERIC||(GENERIC=guessProfile(50,45,40,25,10,100))):null);
    if(!lv&&!df)return base&&base.soft==null?{...base,soft:SOFT}:base;
    const c=liveCache[id];if(c&&c.base===base)return c.p;
    const pick=k=>(lv&&lv[k])||(df&&df[k])||(base&&base[k])||null;
    const dep=k=>(lv&&lv.depth&&lv.depth[k])||(df&&df.depth&&df.depth[k])||(base&&base.depth&&base.depth[k])||null;
    // a vessel that has only a GUESSED profile but whose area of the food was drawn by Miloš: the guessed front mask (made for the guessed area) is dropped, otherwise it cuts off the lower part of his area (a notch under the food)
    const ownFood=(lv&&lv.foodVisible)||(df&&df.foodVisible);
    const mask=(lv&&lv.mask)||(df&&df.mask)||((base&&base.guess&&ownFood)?null:(base&&base.mask))||null;
    const soft=(lv&&lv.soft!=null)?lv.soft:(df&&df.soft!=null)?df.soft:SOFT;
    const p={mask,foodVisible:pick('foodVisible'),bottom:pick('bottom'),soft,depth:{bottom:dep('bottom'),foodTop:dep('foodTop')}};
    // a profile that is not complete cannot be used (the game then keeps what it had)
    const ok=p.foodVisible&&p.depth.bottom&&p.depth.foodTop;
    liveCache[id]={base,p:ok?p:base};return liveCache[id].p;
  }
  function applyToVessel(vessel,wrap,front,preset){
    const profile=get(vessel);
    if(!profile||!vessel)return false;
    const frame=preset||frameFor(vessel);
    vessel.dataset.foodVisibilityCalibration='imported';
    vessel.dataset.foodDepthBottom=`${profile.depth.bottom[0]},${profile.depth.bottom[1]}`;
    vessel.dataset.foodDepthTop=`${profile.depth.foodTop[0]},${profile.depth.foodTop[1]}`;

    if(front&&!(profile.mask&&profile.mask.length>=3)){
      // no mask drawn for this vessel: the front wall is not drawn over the food at all
      front.style.display='none';front.dataset.foodVisibilityMask='none';
    }else if(front){
      applySoft(front,profile.mask,profile.soft);
      front.style.display='';
      front.dataset.foodVisibilityMask='imported';
    }
    if(wrap&&frame?.width&&frame?.height){
      const local=profile.foodVisible.map(([x,y])=>[
        +(((x-frame.left)/frame.width)*100).toFixed(3),
        +(((y-frame.top)/frame.height)*100).toFixed(3)
      ]);
      applySoft(wrap,local,profile.soft);
      wrap.dataset.foodVisibilityArea='imported';
    }
    return true;
  }
  function depthProgress(vessel,n){
    const profile=get(vessel);
    if(!profile?.depth?.bottom||!profile.depth.foodTop)return null;
    const steps=6;
    const t=Math.max(0,Math.min(1,(Math.max(1,+n||1)-1)/(steps-1)));
    return {step:Math.round(t*(steps-1)),t};
  }
  function pointAtDepth(vessel,t){
    const profile=get(vessel);
    const frame=frameFor(vessel);
    if(!profile?.depth?.bottom||!profile.depth.foodTop||!frame)return null;
    const f=Math.max(0,Math.min(1,+t||0));
    const x=profile.depth.bottom[0]+
      (profile.depth.foodTop[0]-profile.depth.bottom[0])*f;
    const y=profile.depth.bottom[1]+
      (profile.depth.foodTop[1]-profile.depth.bottom[1])*f;
    return {
      x:+(((x-frame.left)/frame.width)*100).toFixed(3),
      y:+(((y-frame.top)/frame.height)*100).toFixed(3)
    };
  }
  function horizontalRangeAtDepth(vessel,t){
    const profile=get(vessel);
    const frame=frameFor(vessel);
    if(!profile?.foodVisible?.length||!profile?.depth?.bottom||
       !profile.depth.foodTop||!frame)return null;
    const f=Math.max(0,Math.min(1,+t||0));
    const fullY=profile.depth.bottom[1]+
      (profile.depth.foodTop[1]-profile.depth.bottom[1])*f;
    const xs=[];
    const points=profile.foodVisible;
    for(let i=0;i<points.length;i++){
      const a=points[i],b=points[(i+1)%points.length];
      const ay=+a[1]||0,by=+b[1]||0;
      const ax=+a[0]||0,bx=+b[0]||0;
      if(Math.abs(ay-by)<1e-8){
        if(Math.abs(fullY-ay)<1e-5){xs.push(ax,bx);}
        continue;
      }
      const crosses=(ay<=fullY&&fullY<by)||(by<=fullY&&fullY<ay);
      if(crosses)xs.push(ax+(bx-ax)*((fullY-ay)/(by-ay)));
    }
    const point=pointAtDepth(vessel,f);
    if(!point)return null;
    if(xs.length<2)return {left:point.x-20,right:point.x+20,y:point.y};
    const left=Math.min(...xs),right=Math.max(...xs);
    return {
      left:+(((left-frame.left)/frame.width)*100).toFixed(3),
      right:+(((right-frame.left)/frame.width)*100).toFixed(3),
      y:point.y
    };
  }
  function bottomSlots(vessel,count=3){
    const profile=get(vessel);
    const frame=frameFor(vessel);
    const source=profile?.bottom;
    if(!Array.isArray(source)||source.length<3||!frame)return null;
    const points=source.map(p=>Array.isArray(p)?p:[p.x,p.y]).filter(p=>Number.isFinite(+p[0])&&Number.isFinite(+p[1]));
    if(points.length<3)return null;
    const local=points.map(([x,y])=>[
      (x-frame.left)/frame.width*100,
      (y-frame.top)/frame.height*100
    ]);
    const n=Math.max(1,Math.round(+count||3));
    const minY=Math.min(...local.map(p=>p[1])),maxY=Math.max(...local.map(p=>p[1]));
    const cols=n<=2?n:Math.ceil(Math.sqrt(n));
    const rows=Math.max(1,Math.ceil(n/cols));
    const intersectionsAt=(y)=>{
      const xs=[];
      for(let i=0;i<local.length;i++){
        const a=local[i],b=local[(i+1)%local.length];
        if(Math.abs(a[1]-b[1])<1e-8)continue;
        const crosses=(a[1]<=y&&y<b[1])||(b[1]<=y&&y<a[1]);
        if(crosses)xs.push(a[0]+(b[0]-a[0])*((y-a[1])/(b[1]-a[1])));
      }
      return xs;
    };
    const slots=[];
    for(let i=0;i<n;i++){
      const row=Math.floor(i/cols),col=i%cols;
      const y=minY+(maxY-minY)*(rows===1?.52:(.22+.56*(row/Math.max(1,rows-1))));
      const xs=intersectionsAt(y);
      const left=xs.length>=2?Math.min(...xs):Math.min(...local.map(p=>p[0]));
      const right=xs.length>=2?Math.max(...xs):Math.max(...local.map(p=>p[0]));
      slots.push({
        x:+(left+(right-left)*((col+.5)/cols)).toFixed(3),
        y:+y.toFixed(3)
      });
    }
    return slots;
  }
  importDefaults();importSaved();
  window.CooksterVesselFoodCalibration={
    setLive,
    hasOwnMask:id=>!!((LIVE[id]&&LIVE[id].mask)||(DEF[id]&&DEF[id].mask)),
    get:v=>copy(get(v)),
    frame:v=>copy(frameFor(v)),
    applyToVessel,
    depthProgress,
    pointAtDepth,
    horizontalRangeAtDepth,
    bottomSlots,
    profiles:copy(PROFILES)
  };
})();