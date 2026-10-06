/* Cookster - sauerkraut barrel ("kaca").
   The barrel is one item (kaca_prazna) with layers on top of it:
     - up to 10 whole cabbages are put in one by one (10 = a full barrel, 10 kg). The picture only changes to the full
       barrel from the 8th cabbage on, because the angle hides the inside until then;
     - the lid (kaca_poklopac) snaps on to the barrel: it is drawn as a layer (screw, beam, disc) which can be pushed down;
       the front of the barrel is drawn again on top of it as a mask, so the lid seems to go into the barrel;
     - the screw handle turns with a circular mouse movement, like the grinder; every turn pushes the lid down and raises
       the pressure bar: grey = too little, green = right, red = too much (the cabbage is spoiled and can only be thrown away);
     - after 4 days of the game (Dan counter) with the right pressure the cabbage is sour. It is taken out one at a time.
   State lives in el.dataset (kacaN, kacaLid, kacaP, kacaDay0, kacaRuined) so it is saved with the world. */
(function(){
  'use strict';
  const ID='kaca_prazna',LID_ID='kaca_poklopac';
  const DIR='assets/calibration_props/kaca_za_kupus/';
  const MAX=10,VISIBLE_FROM=8;
  const P_GOOD=35,P_RED=85,TURN_DEG=36;             // 360 degrees of turning = 10 points of pressure
  const SOUR_DAYS=[0,2,4];                         // days of fermentation for phase 1, 2, 3
  // TEST: the cabbage ferments in real seconds instead of game days: phase 2 after SOUR_SECS[1], sour after SOUR_SECS[2].
  // Set to null to go back to days (SOUR_DAYS).
  const SOUR_SECS=[0,10,20];
  // TEST: a barrel full of sour cabbage is always in the kitchen (it refills itself). Set to false to go back to normal play.
  const TEST_ALWAYS_SOUR=true;
  // closed-barrel picture (C) -> frame of the empty barrel picture (P): P = 1.08*C - (34,50)
  const toPx=cx=>(1.08*cx-34)/527*100,toPy=cy=>(1.08*cy-50)/560*100;
  const FRONT_POLY=[[0,558],[0,30],[126,30],[126,176],[150,210],[200,222],[250,229],[300,231],[350,229],[400,222],[440,210],[449,190],[449,30],[560,30],[560,558]]
    .map(([x,y])=>`${toPx(x).toFixed(2)}% ${toPy(y).toFixed(2)}%`).join(',');
  const LID_LEFT=-34/527*100,LID_TOP=-50/560*100,LID_W=560*1.08/527*100,LID_H=558*1.08/560*100;
  // opening of the open barrel in the empty-barrel picture (527x560): centre (280,135), radii (195,55)
  const WATER_CX=280/527*100,WATER_CY=135/560*100,WATER_RX=195/527*100,WATER_RY=55/560*100;
  const depthRest=n=>((MAX-n)/MAX)*150/560*100;      // how deep the lid sits on n cabbages (percent of the barrel's height)
  const pressTravel=p=>p/100*38/560*100;             // and how much it goes down while pressing

  // the barrel is deep and seen from the side: the first half of the water is not visible yet, then the surface rises into view
  const visWater=el=>Math.max(0,Math.min(100,(num(el,'kacaWater')-50)*2));
  const num=(el,k)=>+el.dataset[k]||0;
  const day=()=>{try{return CooksterState.player.day||1;}catch(_){return 1;}};
  const isKaca=el=>!!el&&el.dataset?.itemId===ID;

  function bodySrc(el){
    const n=num(el,'kacaN');
    // with the lid on, the cabbage is hidden under it, so the empty barrel is the picture behind the lid
    if(n<VISIBLE_FROM||el.dataset.kacaLid==='1')return DIR+'kaca_prazna.webp';
    return DIR+'kaca_faza_'+phase(el)+'.webp';
  }
  // The phase the cabbage has reached is kept (kacaPh): to take the lid off the handle is turned back to zero and that stops the clock,
  // but a cabbage that has soured stays sour.
  function settle(el){
    const ph=phaseNow(el),kept=+el.dataset.kacaPh||1;
    if(ph>kept)el.dataset.kacaPh=String(ph);
  }
  function phase(el){
    if(el.dataset.kacaRuined==='1')return 3;
    return Math.max(+el.dataset.kacaPh||1,phaseNow(el));
  }
  function phaseNow(el){
    if(el.dataset.kacaRuined==='1')return 3;
    const d0=el.dataset.kacaDay0;
    if(d0===undefined||d0==='')return 1;
    if(SOUR_SECS){if(!+el.dataset.kacaT0)el.dataset.kacaT0=String(Date.now());const t0=+el.dataset.kacaT0;const s=(Date.now()-t0)/1000;return s>=SOUR_SECS[2]?3:s>=SOUR_SECS[1]?2:1}
    const days=day()-(+d0);
    return days>=SOUR_DAYS[2]?3:days>=SOUR_DAYS[1]?2:1;
  }
  function daysLeft(el){
    const d0=el.dataset.kacaDay0;
    if(d0===undefined||d0==='')return null;
    if(SOUR_SECS){if(!+el.dataset.kacaT0)el.dataset.kacaT0=String(Date.now());return Math.max(0,Math.ceil(SOUR_SECS[2]-(Date.now()-(+el.dataset.kacaT0))/1000))}
    return Math.max(0,SOUR_DAYS[2]-(day()-(+d0)));
  }
  function bodyEl(el){return el.querySelector(':scope>.body');}

  // ---------- layers ----------
  // The lid frame is the picture of the closed barrel (C). Layers, bottom to top:
  //   shaft (the screw between the beam and the disc, as long as the disc is deep), disc (moves down), the front of the barrel
  //   as a mask, and the top (beam, screw head, turning arms) which stays where it is, its ends sitting in the slots of the posts.
  const C_W=560,C_H=558,SHAFT_TOP=118,SHAFT_BASE=148;   // shaft: from under the beam down to where the disc's screw base starts
  function build(el){
    if(el._kaca)return el._kaca;
    const mk=(tag,cls,css)=>{const e=document.createElement(tag);e.className=cls;if(css)e.style.cssText=css;return e;};
    const img=(src,cls)=>{const i=document.createElement('img');i.src=src;i.className=cls;i.alt='';i.draggable=false;i.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;user-select:none;-webkit-user-drag:none';return i;};
    const frame=z=>`position:absolute;left:${LID_LEFT}%;top:${LID_TOP}%;width:${LID_W}%;height:${LID_H}%;z-index:${z};display:none;pointer-events:none`;
    const shaftWrap=mk('div','kaca-shaft-wrap',frame(2));
    const shaft=mk('div','kaca-shaft',`position:absolute;left:${(274/C_W*100).toFixed(3)}%;top:${(SHAFT_TOP/C_H*100).toFixed(3)}%;width:${(30/C_W*100).toFixed(3)}%;height:20%;background:url(${DIR}kaca_shaft_tile.webp) 0 0/100% auto repeat-y`);
    shaftWrap.appendChild(shaft);
    const disc=mk('div','kaca-disc',frame(3));disc.appendChild(img(DIR+'kaca_lid_disc.webp','kaca-disc-img'));
    const front=img(DIR+'kaca_prazna.webp','kaca-front');
    front.style.zIndex='4';front.style.display='none';front.style.clipPath=`polygon(${FRONT_POLY})`;front.style.webkitClipPath=`polygon(${FRONT_POLY})`;
    const top=mk('div','kaca-top',frame(5));
    const topImg=img(DIR+'kaca_lid_top.webp','kaca-top-img');
    const armL=img(DIR+'kaca_lid_armL.webp','kaca-arm');armL.style.transformOrigin='52.14% 50%';
    const armR=img(DIR+'kaca_lid_armR.webp','kaca-arm');armR.style.transformOrigin='52.14% 50%';
    const hit=mk('div','kaca-lid-hit','position:absolute;left:17.9%;top:0;width:67.9%;height:23%;pointer-events:auto;cursor:grab');
    top.append(topImg,armL,armR,hit);
    // water in the open barrel: the surface is an ellipse as wide as the opening, pushed down by the depth and cut by the opening
    const waterClip=mk('div','kaca-water-clip',`position:absolute;inset:0;z-index:1;pointer-events:none;display:none;clip-path:ellipse(${WATER_RX}% ${WATER_RY}% at ${WATER_CX}% ${WATER_CY}%);-webkit-clip-path:ellipse(${WATER_RX}% ${WATER_RY}% at ${WATER_CX}% ${WATER_CY}%)`);
    const waterSurf=mk('div','kaca-water',`position:absolute;left:${WATER_CX-WATER_RX}%;top:${WATER_CY-WATER_RY}%;width:${WATER_RX*2}%;height:${WATER_RY*2}%;border-radius:50%;background:radial-gradient(ellipse at 50% 38%,rgba(190,236,246,.9) 0 14%,rgba(92,176,206,.92) 40%,rgba(36,104,138,.95) 100%);box-shadow:inset 0 4px 10px rgba(255,255,255,.35),inset 0 -6px 12px rgba(10,50,80,.45)`);
    waterClip.appendChild(waterSurf);
    el.append(waterClip,shaftWrap,disc,front,top);
    el._kaca={water:waterClip,waterSurf,lid:disc,shaftWrap,shaft,disc,top,armL,armR,hit,front,turn:0,all:[shaftWrap,disc,front,top]};
    return el._kaca;
  }

  function refresh(el){
    settle(el);
    if(!isKaca(el))return;
    const L=build(el),b=bodyEl(el),n=num(el,'kacaN'),closed=el.dataset.kacaLid==='1';
    const src=bodySrc(el);
    if(b&&b.getAttribute('src')!==src)b.src=src;
    const cs=el._contactShadow?.querySelector('img');if(cs&&cs.getAttribute('src')!==src)cs.src=src;
    if(L.front.getAttribute('src')!==src)L.front.src=src;
    for(const x of L.all)x.style.display=closed?'block':'none';
    const w=visWater(el);
    L.water.style.display=(w>0&&!closed&&n<VISIBLE_FROM)?'block':'none';
    L.waterSurf.style.transform=`translateY(${((1-w/100)*WATER_RY*2*1.04).toFixed(2)}%)`;
    if(closed){
      const p=num(el,'kacaP');
      const dPct=depthRest(n)+pressTravel(p);                 // how far the disc is down, percent of the barrel's height
      const dC=dPct/LID_H*C_H;                                // the same in pixels of the closed-barrel picture
      L.disc.style.top=(LID_TOP+dPct)+'%';
      L.shaft.style.height=((SHAFT_BASE-SHAFT_TOP+dC)/C_H*100)+'%';
      const c=Math.max(.2,Math.abs(Math.cos((L.turn||0)*Math.PI/180)));
      L.armL.style.transform=L.armR.style.transform=`scaleX(${c.toFixed(3)})`;
    }
  }

  // ---------- heads-up display: count, days left and the pressure bar ----------
  let hud=null,hudT=0;
  function ensureHud(){
    if(hud)return hud;
    const css=document.createElement('style');
    css.textContent=`.kaca-hud{position:fixed;display:none;z-index:15060;pointer-events:none;transform:translate(-50%,-100%);font:700 12px/1.15 system-ui,sans-serif;color:#fff;text-align:center;width:190px}
.kaca-hud .t{display:inline-block;padding:3px 8px;border-radius:8px;background:rgba(29,18,11,.86);margin-bottom:5px;box-shadow:0 2px 5px rgba(0,0,0,.3)}
.kaca-hud .bar{position:relative;height:14px;border:2px solid rgba(42,24,13,.95);border-radius:4px;overflow:hidden;background:linear-gradient(90deg,#9a9a9a 0 35%,#58b04a 35% 85%,#d63a2a 85% 100%);box-shadow:0 2px 6px rgba(0,0,0,.3)}
.kaca-hud .bar i{position:absolute;top:-2px;bottom:-2px;width:4px;margin-left:-2px;background:#fff;box-shadow:0 0 0 1px rgba(40,20,10,.7)}`;
    document.head.appendChild(css);
    hud=document.createElement('div');hud.className='kaca-hud';hud.innerHTML='<div class="t"></div><div class="bar"><i></i></div>';
    document.body.appendChild(hud);return hud;
  }
  function showHud(el,secs){
    ensureHud();hudT=performance.now()+secs*1000;hud._el=el;updateHud();
  }
  function updateHud(){
    if(!hud)return;
    const el=hud._el;
    if(!el||!el.isConnected||performance.now()>hudT){hud.style.display='none';return;}
    const r=el.getBoundingClientRect(),n=num(el,'kacaN'),closed=el.dataset.kacaLid==='1',p=num(el,'kacaP');
    let t=n+'/'+MAX+' kupusa';
    const wl=Math.round(num(el,'kacaWater'));if(wl>0)t+=wl>=100?' · puno vode':' · voda se sliva…';
    if(el.dataset.kacaRuined==='1')t='Pokvaren kupus — klikni da baciš';
    else if(closed){
      const left=daysLeft(el);
      if(phase(el)>=3)t+=' · ukiseljen!';else t+=left===null?' · stegni poklopac (zeleno)':left>0?` · kiseli se, još ${left} ${SOUR_SECS?'s':'d'}`:' · ukiseljen!';
    }
    hud.querySelector('.t').textContent=t;
    const bar=hud.querySelector('.bar');bar.style.display=closed?'block':'none';
    hud.querySelector('.bar i').style.left=p+'%';
    hud.style.left=(r.left+r.width/2)+'px';hud.style.top=(r.top-4)+'px';hud.style.display='block';
    requestAnimationFrame(updateHud);
  }
  let hudRaf=false;
  const origShow=showHud;

  // ---------- actions ----------
  function over(el,x,y,part){            // is the pointer over the opening (top part) or anywhere on the barrel?
    const r=el.getBoundingClientRect();
    if(x<r.left||x>r.right||y<r.top||y>r.bottom)return false;
    return part==='open'?y<r.top+r.height*.62:true;
  }
  function barrelAt(x,y,part){
    for(const el of (window.items||items)){
      if(isKaca(el)&&el!==holding&&over(el,x,y,part))return el;
    }
    return null;
  }
  function addCabbage(el,veg){
    const n=num(el,'kacaN');
    if(veg.dataset.kupusHalf==='1'){          // half a head: a half takes a slot of its own and comes out as a half again
      if(el.dataset.kacaLid==='1')return 'closed';
      if(n>=MAX)return 'full';
      el.dataset.kacaHalf=String(num(el,'kacaHalf')+1);el.dataset.kacaN=String(n+1);   // a half takes one slot
      removeItem(veg);holding=null;hidePlacementGhost();hideOriginGhost();updateHover();
      refresh(el);showHud(el,2);try{playImpactSound(el,'putIn');}catch(_){}
      CooksterSave.schedule();return 'ok';
    }
    if(el.dataset.kacaLid==='1'){return 'closed';}
    if(n>=MAX)return 'full';
    el.dataset.kacaN=String(n+1);
    el.dataset.kacaRuined='';el.dataset.kacaDay0=el.dataset.kacaDay0||'';
    removeItem(veg);holding=null;hidePlacementGhost();hideOriginGhost();updateHover();
    refresh(el);showHud(el,2);try{playImpactSound(el,'putIn');}catch(_){}
    CooksterSave.schedule();return 'ok';
  }
  function snapLid(el,lidItem){
    if(el.dataset.kacaLid==='1')return false;
    el.dataset.kacaLid='1';el.dataset.kacaP='0';el.dataset.kacaDay0='';el.dataset.kacaRuined='';
    removeItem(lidItem);holding=null;hidePlacementGhost();hideOriginGhost();updateHover();
    build(el).turn=0;refresh(el);showHud(el,3);try{playImpactSound(el,'close');}catch(_){}
    CooksterSave.schedule();return true;
  }
  function removeLid(el){
    if(el.dataset.kacaLid!=='1'||num(el,'kacaP')>0)return false;
    settle(el);el.dataset.kacaLid='';el.dataset.kacaDay0='';
    refresh(el);
    const def=kitchenEquipmentDef?.(LID_ID);
    if(def){
      const r=el.getBoundingClientRect(),p=screenToScene(r.left+r.width/2,r.top+r.height*.3);
      const lid=makeItem({id:LID_ID,instanceId:nextItemInstanceId(LID_ID),label:def.label,src:def.src,x:p.x-def.w/2,y:p.y-def.h,w:def.w,h:def.h,z:++zCounter,snapProfile:def.snapProfile||'flat'});
      if(lid){lid.dataset.surfaceZone=el.dataset.surfaceZone||'table';startHolding(lid);}
    }
    try{playImpactSound(el,'open');}catch(_){}
    CooksterSave.schedule();return true;
  }
  function takeCabbage(el){
    const n=num(el,'kacaN');
    if(n<=0||el.dataset.kacaLid==='1')return false;
    if(el.dataset.kacaRuined==='1'){          // spoiled: throw it all away
      el.dataset.kacaN='0';el.dataset.kacaHalf='0';el.dataset.kacaRuined='';el.dataset.kacaDay0='';el.dataset.kacaP='0';el.dataset.kacaWater='0';el.dataset.kacaPh='';
      refresh(el);showHud(el,2);CooksterSave.schedule();return true;
    }
    const ph=phase(el),veg=VEGETABLES.kupus;if(!veg)return false;
    el.dataset.kacaN=String(n-1);
    if(n-1<=0){el.dataset.kacaHalf='0';el.dataset.kacaDay0='';el.dataset.kacaP='0';el.dataset.kacaPh='';}
    const r=el.getBoundingClientRect(),p=screenToScene(r.left+r.width/2,r.top+r.height*.35);
    const src=ph>=2&&n>=1?DIR.replace('calibration_props/kaca_za_kupus/','market_veg/')+'kupus_faza_'+ph+'.webp':veg.src;
    const half=num(el,'kacaHalf')>0;
    if(half)el.dataset.kacaHalf=String(num(el,'kacaHalf')-1);
    const hw=half?Math.round(veg.w*.8):veg.w,hh=half?Math.round(veg.h*.7):veg.h;
    const loose=makeItem({id:'veg_kupus_'+Date.now(),label:ph>=3?(half?'Pola kiselog kupusa':'Kiseli kupus'):veg.label,src:half?DIR.replace('calibration_props/kaca_za_kupus/','market_veg/')+'kupus_pola_kiseli.webp':src,x:p.x-hw/2,y:p.y-hh,w:hw,h:hh,z:++zCounter,snapProfile:'produce'});
    if(half)loose.dataset.kupusHalf='1';
    loose.dataset.vegetable='1';loose.dataset.collisionProfile='vegetable';loose.dataset.vegKey='kupus';loose.dataset.cutState='whole';
    if(ph>=2)loose.dataset.fermentPhase=String(ph);
    setPose(loose,p.x,p.y,+el.dataset.vis||1);
    startHolding(loose);refresh(el);showHud(el,2);CooksterSave.schedule();return true;
  }

  // ---------- circular drag on the screw handle ----------
  let drag=null;
  function pivotOf(el){
    const L=el._kaca,r=L.top.getBoundingClientRect();
    return {x:r.left+r.width*(292/560),y:r.top+r.height*(48/558)};
  }
  function onDown(e){
    const t=e.target;
    const hit=t?.closest?.('.kaca-lid-hit');
    if(hit){
      const el=hit.closest('.item');
      if(isKaca(el)&&el.dataset.kacaLid==='1'&&!holding){
        e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
        if(e.button===2){if(!removeLid(el))showHud(el,2);return;}
        if(e.button!==0)return;
        if(el.dataset.kacaRuined==='1'){showHud(el,2);return;}
        const pv=pivotOf(el);
        drag={el,pointerId:e.pointerId,pv,last:Math.atan2(e.clientY-pv.y,e.clientX-pv.x)*180/Math.PI,acc:0};
        try{hit.setPointerCapture(e.pointerId);}catch(_){}
        showHud(el,60);
        return;
      }
    }
    // click in the opening of an open barrel: take one cabbage out
    if(e.button===0&&!holding&&!drag){
      const el=barrelAt(e.clientX,e.clientY,'open');
      if(el&&el.dataset.kacaLid!=='1'&&num(el,'kacaN')>0){
        e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
        takeCabbage(el);
      }
    }
  }
  function onMove(e){
    const d=drag;
    if(!d||e.pointerId!==d.pointerId)return;
    e.preventDefault();e.stopPropagation();
    const dx=e.clientX-d.pv.x,dy=e.clientY-d.pv.y;
    if(Math.hypot(dx,dy)<16)return;
    const a=Math.atan2(dy,dx)*180/Math.PI;
    let delta=a-d.last;while(delta>180)delta-=360;while(delta<-180)delta+=360;
    d.last=a;
    if(Math.abs(delta)>80)return;
    const L=d.el._kaca;
    L.turn=(L.turn||0)+delta;
    let p=num(d.el,'kacaP')+delta/360*10;
    p=Math.max(0,Math.min(100,p));
    d.el.dataset.kacaP=p.toFixed(2);
    if(p>=P_GOOD&&p<=P_RED&&(d.el.dataset.kacaDay0===''||d.el.dataset.kacaDay0===undefined)){d.el.dataset.kacaDay0=String(day());d.el.dataset.kacaT0=String(Date.now())}   // the bar is green: it starts to sour
    d.acc+=Math.abs(delta);
    if(d.acc>150){d.acc=0;try{playSfxVariant('woodDrop',.12);}catch(_){}}
    refresh(d.el);showHud(d.el,60);
  }
  function onUp(e){
    const d=drag;
    if(!d||e.pointerId!==d.pointerId)return;
    drag=null;
    const el=d.el,p=num(el,'kacaP');
    if(p>P_RED){
      el.dataset.kacaRuined='1';el.dataset.kacaDay0='';
      try{playImpactSound(el,'hit');}catch(_){}
    }else if(p>=P_GOOD){
      if(el.dataset.kacaDay0===''||el.dataset.kacaDay0===undefined){el.dataset.kacaDay0=String(day());el.dataset.kacaT0=String(Date.now())}
    }else{settle(el);el.dataset.kacaDay0=''}
    refresh(el);showHud(el,3);CooksterSave.schedule();
  }
  window.addEventListener('pointerdown',onDown,{capture:true});
  window.addEventListener('pointermove',onMove,{capture:true});
  window.addEventListener('pointerup',onUp,{capture:true});
  window.addEventListener('pointercancel',onUp,{capture:true});
  // hover: show the count while the pointer is over the barrel
  window.addEventListener('pointermove',e=>{
    if(drag)return;
    const el=barrelAt(e.clientX,e.clientY,'any');
    if(el){if(!hud||hud._el!==el||performance.now()>hudT)showHud(el,.6);else hudT=performance.now()+600;}
  },{passive:true});

  window.CooksterKaca={
    attach(el){if(isKaca(el)){build(el);refresh(el);}},
    refresh,
    // adds water to an open barrel (percent of the barrel); the water level is drawn inside the opening
    addWater(el,amount){
      const w=Math.min(100,num(el,'kacaWater')+amount);
      el.dataset.kacaWater=w.toFixed(2);refresh(el);showHud(el,1.5);return w;
    },
    // called when something is let go of in the world; returns true when the barrel used it
    tryDrop(item){
      if(!item)return false;
      const x=mouse.x,y=mouse.y;
      if(item.dataset?.itemId===LID_ID){
        const el=barrelAt(x,y,'any');
        return el?snapLid(el,item):false;
      }
      if(item.dataset?.vegetable==='1'&&item.dataset.vegKey==='kupus'&&(item.dataset.cutState||'whole')==='whole'&&(item.dataset.kupusHalf!=='1'||item.dataset.fermentPhase==='3')){
        const el=barrelAt(x,y,'open');
        if(!el)return false;
        const r=addCabbage(el,item);
        if(r==='ok')return true;
        showHud(el,2);return true;
      }
      return false;
    }
  };
  // days pass when dishes are served: keep the picture of every barrel up to date
  function testRefill(el){
    if(!TEST_ALWAYS_SOUR||el.dataset.kacaLid==='1'||num(el,'kacaN')>=MAX)return;
    el.dataset.kacaN=String(MAX);el.dataset.kacaRuined='';el.dataset.kacaPh='3';el.dataset.kacaP='0';
    el.dataset.kacaDay0=String(day());el.dataset.kacaT0=String(Date.now()-SOUR_SECS[2]*1000-1000);
  }
  setInterval(()=>{for(const el of (window.items||items))if(isKaca(el)){testRefill(el);refresh(el);}},2000);
  if(TEST_ALWAYS_SOUR)setTimeout(()=>{
    try{if(!(window.items||items).some(isKaca))spawnKitchenEquipment(ID);}catch(_){}
  },4000);
})();
