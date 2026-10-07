(function(){
  'use strict';

  // The user's v2.67 export is the new authoritative initial geometry.
  const scene=document.getElementById('scene');
  const host=document.getElementById('uiElementLayer')||scene;
  if(!host||window.__COOKSTER_BOTTOM_BUTTONS__)return;

  const DESIGN_WIDTH=1672,DESIGN_HEIGHT=941;
  const CALIBRATION_KEY='cookster.ui-button-hotspots.v1';
  // Exact rectangles from the user's 1672x941 coordinate export.
  // [id, x, y, width, height, export layer, group, slot, center glow]
  const DEFAULT_ZONES=[
    ['button_87b2d209-c0ff-44a0-8e92-bc8aff4a362f',597,820,73,76,5,'center',1,false],
    ['button_d30f616c-20dd-461a-b741-c6e9b5322f67',676,820,76,76,6,'center',2,false],
    ['button_8d4fb093-99d9-4d2e-b4c8-5dd5f8e1f7f0',757,819,76,77,10,'center',3,true],
    ['button_d65e553a-dff4-4099-8c66-67e6e067f817',838,819,76,77,7,'center',4,false],
    ['button_bd98d20a-02d5-4d0f-a9f5-3150e0b839b7',919,819,76,77,8,'center',5,false],
    ['button_e94d7354-62d9-4db6-b561-3fd47904139f',1001,819,74,77,9,'center',6,false]
  ];
  const INITIAL_EXPORT_MARKER='cookster.ui-button-hotspots.imported.v2.67';
  function applyUploadedCalibrationOnce(){
    try{
      if(localStorage.getItem(INITIAL_EXPORT_MARKER)==='done')return;
      const existing=JSON.parse(localStorage.getItem(CALIBRATION_KEY)||'null');
      const rows=Array.isArray(existing)?existing:
        (Array.isArray(existing?.buttons)?existing.buttons:[]);
      const managedIds=new Set(DEFAULT_ZONES.map(([id])=>id));
      const preserved=rows.filter(row=>row&&typeof row.id==='string'&&!managedIds.has(row.id));
      const imported=DEFAULT_ZONES.map(([id,x,y,width,height,layer,group,slot,centerGlow])=>({
        id,label:`${group==='left'?'Leva':group==='right'?'Desna':'Srednja'} traka · dugme ${slot}`,
        x,y,width,height,shape:'rect',layer,group,slot,centerGlow
      }));
      const next=existing&&typeof existing==='object'&&!Array.isArray(existing)
        ?{...existing,version:1,
          coordinateSystem:{width:DESIGN_WIDTH,height:DESIGN_HEIGHT,origin:'top-left',space:'screen'},
          buttons:[...preserved,...imported]}
        :[...preserved,...imported];
      localStorage.setItem(CALIBRATION_KEY,JSON.stringify(next));
      localStorage.setItem(INITIAL_EXPORT_MARKER,'done');
    }catch(_){}
  }
  applyUploadedCalibrationOnce();
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const numberOr=(value,fallback)=>{
    const number=Number(value);
    return Number.isFinite(number)?number:fallback;
  };
  function readSavedCalibration(){
    try{
      const parsed=JSON.parse(localStorage.getItem(CALIBRATION_KEY)||'null');
      if(Array.isArray(parsed))return parsed;
      if(Array.isArray(parsed?.buttons))return parsed.buttons;
    }catch(_){}
    return [];
  }
  const savedZones=new Map(readSavedCalibration()
    .filter(record=>record&&typeof record.id==='string')
    .map(record=>[record.id,record]));
  const zones=DEFAULT_ZONES.map(([id,x,y,width,height,exportLayer,group,slot,centerGlow])=>{
    const saved=savedZones.get(id);
    if(!saved)return [id,x,y,width,height,exportLayer,group,slot,centerGlow];
    const w=clamp(numberOr(saved.width??saved.w,width),12,DESIGN_WIDTH);
    const h=clamp(numberOr(saved.height??saved.h,height),12,DESIGN_HEIGHT);
    return [
      id,
      clamp(numberOr(saved.x,x),0,DESIGN_WIDTH-w),
      clamp(numberOr(saved.y,y),0,DESIGN_HEIGHT-h),
      w,h,exportLayer,group,slot,centerGlow
    ];
  });
  const layer=document.createElement('div');
  layer.id='cooksterBottomButtonLayer';
  layer.setAttribute('role','group');
  layer.setAttribute('aria-label','Klik dugmad na donjim trakama');
  layer.style.setProperty('position','absolute','important');
  layer.style.setProperty('inset','0','important');
  layer.style.setProperty('z-index','2147483647','important');
  layer.style.setProperty('pointer-events','none','important');

  const timers=new WeakMap();
  const activePresses=new Map();
  const buttons=[];
  const clearPressed=button=>{
    const timer=timers.get(button);
    if(timer)clearTimeout(timer);
    timers.delete(button);
    button.classList.remove('is-pressed');
  };
  const setButtonRect=(button,x,y,width,height)=>{
    button.style.setProperty('left',(x/DESIGN_WIDTH*100)+'%','important');
    button.style.setProperty('top',(y/DESIGN_HEIGHT*100)+'%','important');
    button.style.setProperty('width',(width/DESIGN_WIDTH*100)+'%','important');
    button.style.setProperty('height',(height/DESIGN_HEIGHT*100)+'%','important');
  };
  const releaseAfterTap=button=>{
    const timer=timers.get(button);
    if(timer)clearTimeout(timer);
    timers.set(button,setTimeout(()=>clearPressed(button),125));
  };
  const activateButton=(button,event)=>{
    if(button.dataset.group==='right'){
      window.CooksterBackpackController?.activateSlot?.(
        Number(button.dataset.slot)-1,button,event
      );
    }else if(button.dataset.group==='center'){
      window.CooksterRecentItems?.activate?.(Number(button.dataset.slot)-1,button,event);
    }
  };

  zones.forEach(([id,x,y,width,height,exportLayer,group,slot,centerGlow])=>{
    const button=document.createElement('button');
    button.type='button';
    button.className='cookster-bottom-button'+(centerGlow?' has-center-glow':'');
    button.dataset.calibrationId=id;
    button.dataset.group=group;
    button.dataset.slot=String(slot);
    button.dataset.exportLayer=String(exportLayer);
    if(group==='right')button.dataset.backpackSlot=String(slot);
    button.setAttribute('aria-label',
      `${group==='left'?'Leva':group==='right'?'Desna':'Srednja'} traka, dugme ${slot}${centerGlow?', centralni glow':''}`);
    button.title=`${group==='left'?'Leva':group==='right'?'Desna':'Srednja'} traka · dugme ${slot}`;
    button.draggable=false;
    button.style.setProperty('position','absolute','important');
    setButtonRect(button,x,y,width,height);
    button.style.setProperty('transform','none','important');

    button.addEventListener('pointerdown',event=>{
      event.stopPropagation();
      clearPressed(button);
      button.classList.add('is-pressed');
      activePresses.set(event.pointerId,{
        button,
        x:event.clientX,
        y:event.clientY
      });
      try{button.setPointerCapture(event.pointerId)}catch(_){}
    });
    const finishPointer=event=>{
      const press=activePresses.get(event.pointerId);
      activePresses.delete(event.pointerId);
      releaseAfterTap(button);
      const rect=button.getBoundingClientRect();
      const isTap=press?.button===button
        &&Math.hypot(event.clientX-press.x,event.clientY-press.y)<=8;
      if(isTap&&event.clientX>=rect.left&&event.clientX<=rect.right
        &&event.clientY>=rect.top&&event.clientY<=rect.bottom)
      {
        event.stopPropagation();
        activateButton(button,event);
      }
    };
    button.addEventListener('pointerup',finishPointer);
    button.addEventListener('pointercancel',event=>{
      const press=activePresses.get(event.pointerId);
      activePresses.delete(event.pointerId);
      if(press?.button===button){
        event.stopPropagation();
        clearPressed(button);
      }
    });
    button.addEventListener('lostpointercapture',event=>{
      activePresses.delete(event.pointerId);
      releaseAfterTap(button);
    });
    button.addEventListener('click',event=>{
      event.stopPropagation();
      // Pointer taps are handled on pointerup so a captured pointer still
      // activates the flask reliably. Keep click for keyboard/programmatic use.
       if(event.detail===0)activateButton(button,event);
    });
    button.addEventListener('keydown',event=>{
      if(event.key==='Enter'||event.key===' '){
        event.preventDefault();
        clearPressed(button);
        button.classList.add('is-pressed');
      }
    });
    button.addEventListener('keyup',event=>{
      if(event.key==='Enter'||event.key===' ')releaseAfterTap(button);
    });

    buttons.push(button);
    layer.appendChild(button);
  });
  host.appendChild(layer);

  const backpackSlots=buttons.filter(button=>button.dataset.group==='right');
  const clearPickupInventory=()=>{
    buttons.filter(button=>button.dataset.group!=='right').forEach(button=>{
      button.querySelector('.cookster-inventory-icon')?.remove();
      delete button.dataset.inventoryKey;
      delete button.dataset.inventoryItemId;
    });
  };

  function setBackpackItems(records){
    const list=Array.isArray(records)?records:[];
    backpackSlots.forEach((button,index)=>{
      button.querySelector('.cookster-inventory-icon')?.remove();
      const record=list[index]||null;
      if(record?.src){
        const icon=document.createElement('img');
        icon.className='cookster-inventory-icon';
        icon.src=record.src;
        const iconScale=Math.max(.05,Math.min(1,+record.iconScale||1));
        if(iconScale<.999){
          icon.style.width=`${78*iconScale}%`;
          icon.style.height=`${78*iconScale}%`;
        }
        icon.alt='';
        icon.setAttribute('aria-hidden','true');
        button.appendChild(icon);
        button.dataset.backpackItemId=record.itemId||'';
        button.title=`Ranac · polje ${button.dataset.slot} · ${record.label||record.itemId||'Predmet'}`;
        button.setAttribute('aria-label',
          `Ranac, polje ${button.dataset.slot}: ${record.label||record.itemId||'Predmet'}`);
      }else{
        delete button.dataset.backpackItemId;
        button.title=`Ranac · polje ${button.dataset.slot}`;
        button.setAttribute('aria-label',`Ranac, polje ${button.dataset.slot}, prazno`);
      }
    });
  }

  function clearInventory(){
    clearPickupInventory();
  }

  clearPickupInventory();
  setBackpackItems(window.CooksterBackpackController?.getSlots?.()||[]);
  window.addEventListener('blur',()=>{
    activePresses.clear();
    buttons.forEach(clearPressed);
  });
  function updateZone(id,geometry){
    const zone=zones.find(record=>record[0]===id);
    const button=buttons.find(record=>record.dataset.calibrationId===id);
    if(!zone||!button)return false;
    const width=clamp(numberOr(geometry.width??geometry.w,zone[3]),12,DESIGN_WIDTH);
    const height=clamp(numberOr(geometry.height??geometry.h,zone[4]),12,DESIGN_HEIGHT);
    zone[1]=clamp(numberOr(geometry.x,zone[1]),0,DESIGN_WIDTH-width);
    zone[2]=clamp(numberOr(geometry.y,zone[2]),0,DESIGN_HEIGHT-height);
    zone[3]=width;zone[4]=height;
    setButtonRect(button,zone[1],zone[2],width,height);
    return true;
  }
  const bottomButtonApi={
    version:3,
    coordinateSystem:{width:DESIGN_WIDTH,height:DESIGN_HEIGHT,origin:'top-left',space:'screen'},
    calibrationKey:CALIBRATION_KEY,
    layer,
    buttons,
    updateZone,
    setCalibrationMode(enabled){
      buttons.forEach(button=>button.style.setProperty(
        'pointer-events',enabled?'none':'auto','important'
      ));
    },
    setBackpackItems,
    clearInventory,
    getInventory:()=>({equipment:[],food:[]})
  };
  Object.defineProperty(bottomButtonApi,'zones',{
    enumerable:true,
    get:()=>zones.map(([id,x,y,width,height,exportLayer,group,slot,centerGlow])=>({
      id,x,y,width,height,layer:exportLayer,group,slot,centerGlow,
      label:`${group==='left'?'Leva':group==='right'?'Desna':'Srednja'} traka · dugme ${slot}`,
      shape:'rect'
    }))
  });
  window.__COOKSTER_BOTTOM_BUTTONS__=bottomButtonApi;
})();