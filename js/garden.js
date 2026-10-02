(function(){
  const scene=document.getElementById('scene');
  const gardenScene=document.getElementById('gardenScene');
  const stage=document.getElementById('gardenStage');
  const back=document.getElementById('gardenBack');
  const crateSource=document.getElementById('gardenCrateSource');
  const crateLayer=document.getElementById('gardenCrateLayer');
  const bedLayer=document.getElementById('gardenBedLayer');
  let plantLayer=document.getElementById('gardenPlantLayer');
  if(!plantLayer){
    plantLayer=document.createElement('div');
    plantLayer.id='gardenPlantLayer';
    stage.appendChild(plantLayer);
  }
  let harvestLayer=document.getElementById('gardenHarvestLayer');
  if(!harvestLayer){
    harvestLayer=document.createElement('div');
    harvestLayer.id='gardenHarvestLayer';
    stage.appendChild(harvestLayer);
  }
  if(!scene||!gardenScene||!stage||!bedLayer)return;

  const gardenState=CooksterState.garden??=( {seeds:{paradajz:0,krastavac:0},tomatoPlots:{}} );
  gardenState.seeds??={paradajz:0,krastavac:0};
  gardenState.tomatoPlots??={};
  gardenState.cucumberPlots??={};
  gardenState.crates??=[];
  gardenState.carryingCrateId??=null;
  gardenState.selectedSeed??=null;
  const TOMATO_TOTAL_MS=120000;
  const TOMATO_STAGE_MS=TOMATO_TOTAL_MS/5;
  const TOMATO_FADE_MS=5000;
  const TOMATO_STAGE_SRC=Array.from({length:6},(_,i)=>`assets/garden/tomato_growth/tomato_stage_${i+1}.png`);
  const CUCUMBER_STAGE_SRC=Array.from({length:6},(_,i)=>`assets/garden/cucumber_growth/cucumber_stage_${i+1}.png`);
  const TOMATO_LINES=Object.freeze({
    1:{a:{x:38.49,y:54.26},b:{x:38.55,y:83.28},scaleNear:.34,scaleFar:.18},
    2:{a:{x:28.11,y:52.32},b:{x:35.22,y:45.63},scaleNear:.18,scaleFar:.12},
    3:{a:{x:44.08,y:52.75},b:{x:44.02,y:45.20},scaleNear:.18,scaleFar:.12},
    4:{a:{x:49.36,y:46.06},b:{x:53.67,y:52.54},scaleNear:.18,scaleFar:.12},
    5:{a:{x:57.98,y:45.42},b:{x:66.91,y:52.64},scaleNear:.18,scaleFar:.12},
    6:{a:{x:49.18,y:54.58},b:{x:61.75,y:81.77},scaleNear:.34,scaleFar:.18},
    7:{a:{x:59.99,y:53.83},b:{x:83.97,y:78.43},scaleNear:.34,scaleFar:.18},
    8:{a:{x:70.55,y:53.18},b:{x:96.90,y:70.23},scaleNear:.30,scaleFar:.17}
  });
  const TOMATO_SLOT_COUNT=5;
  const TOMATO_CRATE_CAPACITY=10;
  const RIPE_STAGE=5;
  /* Two clickable ripe fruits per plant = ten harvest clicks per planted bed. */
  const RIPE_FRUIT_POINTS=Object.freeze([
    {x:51,y:47},{x:79,y:60}
  ]);

  function slotsForBed(bed){
    const line=TOMATO_LINES[bed];
    if(!line)return [];
    return Array.from({length:TOMATO_SLOT_COUNT},(_,i)=>{
      const t=(i+.5)/TOMATO_SLOT_COUNT;
      const x=line.a.x+(line.b.x-line.a.x)*t;
      const y=line.a.y+(line.b.y-line.a.y)*t;
      /* Screen-space perspective: lower on screen = closer = larger. */
      const depth=Math.max(0,Math.min(1,(y-44)/41));
      const s=(line.scaleFar??.12)+depth*((line.scaleNear??.37)-(line.scaleFar??.12));
      return {x,y,s};
    });
  }


  const windowHotspot=document.createElement('button');
  windowHotspot.type='button';
  windowHotspot.className='garden-window-hotspot';
  windowHotspot.setAttribute('aria-label','Изађи у башту');
  scene.appendChild(windowHotspot);

  function openGarden(e){
    e?.stopPropagation?.();
    const incoming=window.CooksterWorld?.exportHeldCrateToGarden?.();
    if(incoming)addGardenCrateState(incoming,{left:12,top:72});
    renderGardenCrates();
    gardenScene.classList.add('open');
    gardenScene.setAttribute('aria-hidden','false');
    document.body.classList.add('garden-open');
    renderTomatoGrowth();
  }
  function closeGarden(e){
    e?.stopPropagation?.();
    transferCarriedCrateToKitchen();
    gardenScene.classList.remove('open');
    gardenScene.setAttribute('aria-hidden','true');
    document.body.classList.remove('garden-open');
  }
  windowHotspot.addEventListener('pointerdown',e=>e.stopPropagation());
  windowHotspot.addEventListener('click',openGarden);
  back?.addEventListener('click',closeGarden);

  /*
    v187 background is 1672×941. Each bed is its own irregular percentage polygon.
    Polygons follow the visible cultivated rows in the actual background rather
    than using large rectangular boxes.
  */
  const beds=[
    {label:'Леја 1', poly:'34.4% 55.4%,42.8% 54.7%,47.0% 85.1%,29.8% 85.4%'},
    {label:'Леја 2', poly:'26.4% 53.2%,31.4% 54.0%,37.6% 46.8%,34.9% 46.3%'},
    {label:'Леја 3', poly:'35.6% 53.3%,46.7% 53.6%,45.8% 46.7%,41.4% 46.2%'},
    {label:'Леја 4', poly:'48.6% 47.0%,51.5% 54.0%,60.1% 53.6%,53.9% 46.3%'},
    {label:'Леја 5', poly:'56.6% 46.8%,64.2% 53.8%,71.8% 52.9%,61.2% 45.8%'},
    {label:'Леја 6', poly:'46.4% 55.0%,53.5% 54.7%,70.6% 83.6%,54.5% 86.6%'},
    {label:'Леја 7', poly:'56.8% 55.3%,63.5% 54.2%,90.3% 78.2%,77.7% 83.6%'},
    {label:'Леја 8', poly:'67.3% 55.0%,73.1% 53.6%,100% 70.0%,95.6% 77.7%'}
  ];

  beds.forEach((b,i)=>{
    const hit=document.createElement('button');
    hit.type='button';
    hit.className='garden-bed-hit';
    hit.dataset.bed=String(i+1);
    hit.dataset.bedLabel=b.label;
    hit.style.clipPath=`polygon(${b.poly})`;
    hit.style.webkitClipPath=`polygon(${b.poly})`;
    hit.setAttribute('aria-label',b.label);
    hit.addEventListener('click',e=>{
      e.stopPropagation();
      openTomatoPlanting(i+1);
    });
    bedLayer.appendChild(hit);
  });


  function ownedSeedCount(crop='paradajz'){ return Math.max(0,+gardenState.seeds[crop]||0); }
  function reservedSeedCount(crop='paradajz'){
    const store=crop==='krastavac'?gardenState.cucumberPlots:gardenState.tomatoPlots;
    return Object.values(store||{}).filter(p=>p?.packetReserved&&!p?.packetUsed&&!p?.plantedAt).length;
  }
  function seedCount(crop='paradajz'){ return Math.max(0,ownedSeedCount(crop)-reservedSeedCount(crop)); }
  function toast(msg){ if(typeof window.showToast==='function')window.showToast(msg); }
  function cropLabel(crop){
    return crop==='krastavac'?'Краставац':'Парадајз';
  }

  function plotIsActive(plot){
    return !!plot&&(!!plot.plantedAt||!!plot.packetUsed||!!plot.packetReserved||(Array.isArray(plot.slots)&&plot.slots.length>0));
  }
  function selectedCropForBed(bed){
    const tp=gardenState.tomatoPlots[String(bed)];
    const cp=gardenState.cucumberPlots[String(bed)];
    if(plotIsActive(tp))return 'paradajz';
    if(plotIsActive(cp))return 'krastavac';
    return gardenState.selectedSeed||null;
  }

  function closeSeedMenu(){
    document.getElementById('gardenSeedMenu')?.remove();
  }

  function buildSeedMenu(clientX,clientY){
    closeSeedMenu();
    const available=[
      {crop:'paradajz',icon:'🍅',label:'Парадајз',count:seedCount('paradajz')},
      {crop:'krastavac',icon:'🥒',label:'Краставац',count:seedCount('krastavac')}
    ].filter(x=>x.count>0);

    const menu=document.createElement('div');
    menu.id='gardenSeedMenu';
    menu.className='garden-seed-menu';

    const r=stage.getBoundingClientRect();
    const x=((clientX-r.left)/r.width)*100;
    const y=((clientY-r.top)/r.height)*100;
    menu.style.left=Math.max(1,Math.min(84,x))+'%';
    menu.style.top=Math.max(1,Math.min(78,y))+'%';

    const title=document.createElement('div');
    title.className='garden-seed-menu-title';
    title.textContent='Семе';
    menu.appendChild(title);

    if(!available.length){
      const empty=document.createElement('div');
      empty.className='garden-seed-empty';
      empty.textContent='Немаш купљено семе.';
      menu.appendChild(empty);
    }else{
      available.forEach(item=>{
        const btn=document.createElement('button');
        btn.type='button';
        btn.className='garden-seed-option';
        if(gardenState.selectedSeed===item.crop)btn.classList.add('selected');
        const label=document.createElement('span');
        label.textContent=`${item.icon} ${item.label}`;
        const count=document.createElement('b');
        count.textContent=String(item.count);
        btn.append(label,count);
        btn.addEventListener('click',e=>{
          e.stopPropagation();
          gardenState.selectedSeed=item.crop;
          CooksterSave.schedule();
          toast(`Изабрано семе: ${item.label}.`);
          closeSeedMenu();
        });
        menu.appendChild(btn);
      });
    }
    stage.appendChild(menu);
  }

  stage.addEventListener('contextmenu',e=>{
    if(e.target.closest('.garden-loose-crate'))return;
    e.preventDefault();
    e.stopPropagation();
    buildSeedMenu(e.clientX,e.clientY);
  });
  stage.addEventListener('pointerdown',e=>{
    if(e.button===0 && !e.target.closest('#gardenSeedMenu'))closeSeedMenu();
  });

  function plotFor(bed,crop='paradajz'){
    const store=crop==='krastavac'?gardenState.cucumberPlots:gardenState.tomatoPlots;
    const key=String(bed);
    return store[key]??=( {crop,plantedAt:0,slots:[],packetReserved:false,packetUsed:false,harvested:0,picked:[]} );
  }

  function activePlantingCount(){
    return Object.values(gardenState.tomatoPlots||{}).filter(p=>p?.packetUsed&&!p?.plantedAt).length;
  }

  function openTomatoPlanting(bed){
    const crop=selectedCropForBed(bed);
    if(!crop){toast('Десни клик у башти → изабери семе које желиш да садиш.');return;}
    const plot=plotFor(bed,crop);
    const label=crop==='krastavac'?'краставца':'парадајза';
    if(plot.plantedAt){toast(`Леја ${bed} је већ засађена.`);return;}
    if(!plot.packetUsed&&!plot.packetReserved){
      if(seedCount(crop)<1){toast(`Немаш слободно семе ${label}.`);return;}
      // Packet is reserved for this partially planted bed, but it is consumed
      // only when the fifth physical planting point is completed.
      plot.packetReserved=true;CooksterSave.schedule();
    }
    showSeedSlots(bed,crop);
  }

  function showSeedSlots(bed,crop){
    const plot=plotFor(bed,crop),positions=slotsForBed(bed);
    plantLayer.querySelectorAll('.tomato-seed-slot').forEach(el=>el.remove());
    positions.forEach((pos,idx)=>{
      if(plot.slots.includes(idx))return;
      const dot=document.createElement('button');
      dot.type='button';dot.className='tomato-seed-slot';dot.dataset.bed=bed;dot.dataset.slot=idx;dot.dataset.crop=crop;
      dot.style.left=pos.x+'%';dot.style.top=pos.y+'%';
      dot.addEventListener('click',e=>{
        e.stopPropagation();if(plot.slots.includes(idx))return;
        plot.slots.push(idx);dot.classList.add('planted');setTimeout(()=>dot.remove(),120);CooksterSave.schedule();
        if(plot.slots.length>=TOMATO_SLOT_COUNT){
          if(!plot.packetUsed){
            gardenState.seeds[crop]=Math.max(0,ownedSeedCount(crop)-1);
            plot.packetUsed=true;
          }
          plot.packetReserved=false;
          plot.plantedAt=Date.now();toast(`Леја ${bed} је засађена. Тест раста траје 2 минута.`);renderTomatoGrowth();
        }
      });
      plantLayer.appendChild(dot);
    });
  }



  function crateVisualCount(count){
    if(count<=0)return 0;
    if(count>=10)return 10;
    return Math.min(10,Math.max(2,Math.ceil(count/2)*2));
  }

  function gardenCrateRecord(id){
    return (gardenState.crates||[]).find(c=>String(c.id)===String(id))||null;
  }
  function syncGardenCrateState(crate){
    if(!crate)return null;
    const rec=gardenCrateRecord(crate.dataset.gardenCrate);
    if(!rec)return null;
    rec.crop=crate.dataset.crop||null;
    rec.count=Math.max(0,Math.min(TOMATO_CRATE_CAPACITY,+crate.dataset.count||+crate.dataset.tomatoCount||0));
    rec.left=parseFloat(crate.style.left)||0;
    rec.top=parseFloat(crate.style.top)||0;
    return rec;
  }
  function updateGardenCrateVisual(crate){
    if(!crate)return;
    const count=Math.max(0,Math.min(TOMATO_CRATE_CAPACITY,+crate.dataset.count||+crate.dataset.tomatoCount||0));
    crate.dataset.count=String(count);
    crate.dataset.tomatoCount=String(count); // compatibility with older garden saves/builds
    const img=crate.querySelector('img');
    if(img){
      const crop=crate.dataset.crop||'';
      if(crop==='krastavac'){
        const stage=count<=0?'empty':count<=3?'low':count<=7?'medium':'full';
        img.src=`assets/crate_states_cucumber/${stage}.png`;
      }else if(crop==='paradajz'){
        img.src=`assets/gajbica_paradajz_${crateVisualCount(count)}.png`;
      }else{
        img.src='assets/gajbica_paradajz_0.png';
      }
    }
    crate.classList.toggle('full',count>=TOMATO_CRATE_CAPACITY);
    crate.classList.toggle('carried',gardenState.carryingCrateId===crate.dataset.gardenCrate);
    syncGardenCrateState(crate);
  }

  function nearestHarvestCrate(clientX,clientY,crop){
    const crates=[...crateLayer.querySelectorAll('.garden-loose-crate')]
      .filter(el=>{
        const count=+el.dataset.count||+el.dataset.tomatoCount||0;
        const assigned=el.dataset.crop||'';
        return count<TOMATO_CRATE_CAPACITY&&(!assigned||assigned===crop);
      });
    if(!crates.length)return null;
    let best=null,bestD=Infinity;
    for(const crate of crates){
      const r=crate.getBoundingClientRect();
      const cx=r.left+r.width/2,cy=r.top+r.height/2;
      const d=Math.hypot(clientX-cx,clientY-cy);
      if(d<bestD){bestD=d;best=crate;}
    }
    return bestD<=360?best:null;
  }

  function cropStore(crop){
    return crop==='krastavac'?gardenState.cucumberPlots:gardenState.tomatoPlots;
  }

  function clearFinishedBed(bed,crop='paradajz'){
    const key=String(bed);
    plantLayer.querySelectorAll(`.tomato-plant[data-bed="${bed}"][data-crop="${crop}"],.tomato-seed-slot[data-bed="${bed}"][data-crop="${crop}"]`).forEach(el=>el.remove());
    harvestLayer.querySelectorAll(`.ripe-fruit-hit[data-bed="${bed}"][data-crop="${crop}"]`).forEach(el=>el.remove());
    delete cropStore(crop)[key];
    CooksterSave.schedule();
  }

  function harvestProduce(bed,slotIdx,fruitIdx,e,crop='paradajz'){
    e.stopPropagation();
    const plot=cropStore(crop)[String(bed)];
    if(!plot?.plantedAt || tomatoStage(plot.plantedAt)!==RIPE_STAGE)return;

    plot.picked??=[];
    const fruitId=`${slotIdx}:${fruitIdx}`;
    if(plot.picked.includes(fruitId))return;

    const crate=nearestHarvestCrate(e.clientX,e.clientY,crop);
    if(!crate){
      toast(`Стави празну или непуну гајбу за ${crop==='krastavac'?'краставце':'парадајз'} поред зрелих плодова.`);
      return;
    }

    if(!crate.dataset.crop)crate.dataset.crop=crop;
    if(crate.dataset.crop!==crop){
      toast('Ова гајба већ садржи другу културу.');
      return;
    }

    plot.picked.push(fruitId);
    plot.harvested=(+plot.harvested||0)+1;

    const next=Math.min(TOMATO_CRATE_CAPACITY,(+crate.dataset.count||+crate.dataset.tomatoCount||0)+1);
    crate.dataset.count=String(next);
    crate.dataset.tomatoCount=String(next);
    updateGardenCrateVisual(crate);
    e.currentTarget.remove();
    CooksterSave.schedule();

    const noun=crop==='krastavac'?'Краставац':'Парадајз';
    const totalYield=TOMATO_SLOT_COUNT*RIPE_FRUIT_POINTS.length;
    const remaining=Math.max(0,totalYield-plot.picked.length);

    if(plot.picked.length>=totalYield){
      toast(`Леја ${bed} је потпуно убрана.`);
      clearFinishedBed(bed,crop);
      return;
    }
    if(next>=TOMATO_CRATE_CAPACITY){
      toast(`Гајбица је пуна. На леји је остало још ${remaining} плодова — донеси другу гајбу.`);
      return;
    }
    toast(`${noun} убран — гајбица ${next}/${TOMATO_CRATE_CAPACITY}.`);
  }

  function harvestTargetKey(bed,crop,slotIdx,fruitIdx){
    return `${crop}:${bed}:${slotIdx}:${fruitIdx}`;
  }

  function syncHarvestTargets(){
    const stageRect=stage.getBoundingClientRect();
    const existing=new Map([...harvestLayer.querySelectorAll('.ripe-fruit-hit')].map(el=>[el.dataset.key,el]));
    const wanted=new Set();

    for(const [crop,store] of [['paradajz',gardenState.tomatoPlots],['krastavac',gardenState.cucumberPlots]]){
      for(const [bedKey,plot] of Object.entries(store||{})){
        const bed=+bedKey;
        if(!plot?.plantedAt || tomatoStage(plot.plantedAt)!==RIPE_STAGE)continue;
        plot.picked??=[];

        for(let slotIdx=0;slotIdx<TOMATO_SLOT_COUNT;slotIdx++){
          const wrap=plantLayer.querySelector(`.tomato-plant[data-bed="${bed}"][data-slot="${slotIdx}"][data-crop="${crop}"]`);
          if(!wrap)continue;
          const r=wrap.getBoundingClientRect();

          RIPE_FRUIT_POINTS.forEach((pt,fruitIdx)=>{
            const fruitId=`${slotIdx}:${fruitIdx}`;
            if(plot.picked.includes(fruitId))return;

            const key=harvestTargetKey(bed,crop,slotIdx,fruitIdx);
            wanted.add(key);
            let hit=existing.get(key);
            if(!hit){
              hit=document.createElement('button');
              hit.type='button';
              hit.className='ripe-fruit-hit';
              hit.dataset.key=key;
              hit.dataset.bed=String(bed);
              hit.dataset.crop=crop;
              hit.dataset.slot=String(slotIdx);
              hit.dataset.fruit=String(fruitIdx);
              hit.setAttribute('aria-label',crop==='krastavac'?'Убери краставац':'Убери парадајз');
              hit.addEventListener('click',e=>harvestProduce(bed,slotIdx,fruitIdx,e,crop));
              harvestLayer.appendChild(hit);
            }

            const cx=(r.left-stageRect.left)+(pt.x/100)*r.width;
            const cy=(r.top-stageRect.top)+(pt.y/100)*r.height;
            hit.style.left=`${cx}px`;
            hit.style.top=`${cy}px`;
          });
        }
      }
    }

    for(const [key,el] of existing){
      if(!wanted.has(key))el.remove();
    }
  }

  function ensureRipeFruitTargets(){
    syncHarvestTargets();
  }

  function clearRipeFruitTargets(){
    /* Targets are rebuilt centrally by syncHarvestTargets(). */
  }

  function tomatoStage(plantedAt,now=Date.now()){
    if(!plantedAt)return 0;
    const age=Math.max(0,now-plantedAt);
    if(age>=TOMATO_TOTAL_MS)return 5;
    return Math.max(0,Math.min(5,Math.floor(age/TOMATO_STAGE_MS)));
  }

  function ensurePlantSprite(bed,slotIdx,crop='paradajz'){
    let wrap=plantLayer.querySelector(`.tomato-plant[data-bed="${bed}"][data-slot="${slotIdx}"][data-crop="${crop}"]`);
    if(wrap)return wrap;
    const pos=slotsForBed(bed)[slotIdx];
    wrap=document.createElement('div');
    wrap.className='tomato-plant';
    wrap.dataset.bed=String(bed);
    wrap.dataset.slot=String(slotIdx);
    wrap.dataset.crop=crop;
    wrap.style.left=pos.x+'%';
    wrap.style.top=pos.y+'%';
    wrap.style.setProperty('--plant-scale',String(pos.s));
    wrap.style.zIndex=String(100+Math.round(pos.y*10));
    plantLayer.appendChild(wrap);
    return wrap;
  }

  function setPlantStage(wrap,stageIndex,crop='paradajz'){
    const current=+(wrap.dataset.stage??-1);
    if(current===stageIndex)return;
    const img=document.createElement('img');
    img.src=(crop==='krastavac'?CUCUMBER_STAGE_SRC:TOMATO_STAGE_SRC)[stageIndex];
    img.alt='';
    img.className='tomato-stage-img tomato-stage-enter';
    wrap.appendChild(img);
    requestAnimationFrame(()=>requestAnimationFrame(()=>img.classList.remove('tomato-stage-enter')));
    const olds=[...wrap.querySelectorAll('.tomato-stage-img')].filter(x=>x!==img);
    olds.forEach(old=>{
      old.classList.add('tomato-stage-exit');
      setTimeout(()=>old.remove(),TOMATO_FADE_MS+120);
    });
    wrap.dataset.stage=String(stageIndex);
    /* Ripe click targets are synchronized in a dedicated overlay layer. */
  }

  function renderTomatoGrowth(){
    for(const [crop,store] of [['paradajz',gardenState.tomatoPlots],['krastavac',gardenState.cucumberPlots]]){
      for(const [bedKey,plot] of Object.entries(store||{})){
        const bed=+bedKey;if(!plot?.plantedAt)continue;
        const st=tomatoStage(plot.plantedAt);
        slotsForBed(bed).forEach((_,idx)=>setPlantStage(ensurePlantSprite(bed,idx,crop),st,crop));
      }
    }
    syncHarvestTargets();
  }

  let growthRaf=0,lastGrowthPaint=0;
  function growthLoop(ts){
    if(ts-lastGrowthPaint>1000){
      lastGrowthPaint=ts;
      if(gardenScene.classList.contains('open')){
        try{renderTomatoGrowth();}
        catch(err){console.error('[Cookster Garden] growth render failed:',err);}
      }
    }
    growthRaf=requestAnimationFrame(growthLoop);
  }
  growthRaf=requestAnimationFrame(growthLoop);
  window.addEventListener('resize',()=>{
    if(gardenScene.classList.contains('open'))requestAnimationFrame(syncHarvestTargets);
  });

  let crateSeq=(gardenState.crates||[]).length;

  function normalizeGardenCrateRecord(raw={},pos={}){
    const crop=(raw.crop==='paradajz'||raw.crop==='krastavac')?raw.crop:null;
    return {
      id:String(raw.id||`garden_crate_${Date.now()}_${++crateSeq}`),
      crop,
      count:Math.max(0,Math.min(TOMATO_CRATE_CAPACITY,+raw.count||0)),
      left:Number.isFinite(+raw.left)?+raw.left:(Number.isFinite(+pos.left)?+pos.left:11+Math.min(54,(crateSeq%7)*7.2)),
      top:Number.isFinite(+raw.top)?+raw.top:(Number.isFinite(+pos.top)?+pos.top:78-Math.min(14,(crateSeq%4)*3.5))
    };
  }

  function addGardenCrateState(raw={},pos={}){
    const incoming=normalizeGardenCrateRecord(raw,pos);
    let rec=gardenCrateRecord(incoming.id);
    if(rec)Object.assign(rec,incoming);
    else{gardenState.crates.push(incoming);rec=incoming;}
    renderGardenCrates();
    CooksterSave.schedule();
    return rec;
  }

  function applyGardenCratePerspective(el){
    if(!el)return;
    const y=parseFloat(el.style.top)||0;
    const depth=Math.max(0,Math.min(1,(y-38)/58));
    el.style.transform=`scale(${(.80+depth*.36).toFixed(3)})`;
    el.style.zIndex=String(30+Math.round(depth*55));
  }

  function createGardenCrateElement(rec){
    const el=document.createElement('div');
    el.className='garden-loose-crate';
    el.dataset.gardenCrate=String(rec.id);
    el.dataset.crop=rec.crop||'';
    el.dataset.count=String(rec.count||0);
    el.dataset.tomatoCount=String(rec.count||0);
    el.style.left=(+rec.left||0)+'%';
    el.style.top=(+rec.top||0)+'%';

    const img=document.createElement('img');
    img.src='assets/gajbica_paradajz_0.png';
    img.alt='Гајба';img.draggable=false;
    el.appendChild(img);

    const badge=document.createElement('span');
    badge.className='garden-crate-carry-badge';
    badge.textContent='У РУЦИ';
    el.appendChild(badge);

    crateLayer.appendChild(el);
    updateGardenCrateVisual(el);
    applyGardenCratePerspective(el);

    let drag=null;
    el.addEventListener('pointerdown',e=>{
      if(e.button!==0)return;
      e.stopPropagation();el.setPointerCapture(e.pointerId);el.classList.add('dragging');
      const er=el.getBoundingClientRect();
      drag={id:e.pointerId,dx:e.clientX-er.left,dy:e.clientY-er.top};
    });
    el.addEventListener('pointermove',e=>{
      if(!drag||e.pointerId!==drag.id)return;
      const r=stage.getBoundingClientRect(),w=el.offsetWidth,h=el.offsetHeight;
      let x=(e.clientX-r.left-drag.dx)/r.width*100;
      let y=(e.clientY-r.top-drag.dy)/r.height*100;
      x=Math.max(0,Math.min(100-w/r.width*100,x));
      y=Math.max(0,Math.min(100-h/r.height*100,y));
      el.style.left=x+'%';el.style.top=y+'%';
      applyGardenCratePerspective(el);
      syncGardenCrateState(el);
    });
    function end(e){
      if(!drag||e.pointerId!==drag.id)return;
      drag=null;el.classList.remove('dragging');
      syncGardenCrateState(el);CooksterSave.schedule();
    }
    el.addEventListener('pointerup',end);
    el.addEventListener('pointercancel',end);

    el.addEventListener('contextmenu',e=>{
      e.preventDefault();e.stopPropagation();
      const id=el.dataset.gardenCrate;
      gardenState.carryingCrateId=gardenState.carryingCrateId===id?null:id;
      renderGardenCrates();
      CooksterSave.schedule();
      toast(gardenState.carryingCrateId
        ? 'Гајба је у руци — кликни ← КУХИЊА да је однесеш.'
        : 'Гајба је спуштена.');
    });
    return el;
  }

  function renderGardenCrates(){
    const records=gardenState.crates||[];
    const validIds=new Set(records.map(r=>String(r.id)));
    [...crateLayer.querySelectorAll('.garden-loose-crate')].forEach(el=>{
      if(!validIds.has(el.dataset.gardenCrate))el.remove();
    });

    for(const rec of records){
      let el=[...crateLayer.querySelectorAll('.garden-loose-crate')].find(x=>x.dataset.gardenCrate===String(rec.id));
      if(!el)el=createGardenCrateElement(rec);
      el.dataset.crop=rec.crop||'';
      el.dataset.count=String(Math.max(0,+rec.count||0));
      el.dataset.tomatoCount=el.dataset.count;
      el.style.left=(+rec.left||0)+'%';
      el.style.top=(+rec.top||0)+'%';
      applyGardenCratePerspective(el);
      updateGardenCrateVisual(el);
    }
    if(gardenState.carryingCrateId&&!validIds.has(String(gardenState.carryingCrateId)))gardenState.carryingCrateId=null;
  }

  function spawnCrate(crop=null,count=0){
    const rec=addGardenCrateState({crop,count});
    toast('Празна гајба је изнета у башту.');
    return rec;
  }

  function transferCarriedCrateToKitchen(){
    const id=gardenState.carryingCrateId;
    if(!id)return false;
    const rec=gardenCrateRecord(id);
    if(!rec){gardenState.carryingCrateId=null;return false;}
    const imported=window.CooksterWorld?.importGardenCrate?.({id:rec.id,crop:rec.crop,count:rec.count});
    if(!imported)return false;
    gardenState.crates=gardenState.crates.filter(c=>String(c.id)!==String(id));
    gardenState.carryingCrateId=null;
    crateLayer.querySelectorAll('.garden-loose-crate').forEach(el=>{
      if(el.dataset.gardenCrate===String(id))el.remove();
    });
    CooksterSave.schedule();
    return true;
  }

  crateSource?.addEventListener('click',e=>{e.stopPropagation();spawnCrate();});
  renderGardenCrates();

  window.CooksterGarden={open:openGarden,close:closeGarden,spawnCrate,renderCrates:renderGardenCrates,openSeedMenu:buildSeedMenu,closeSeedMenu};
})();