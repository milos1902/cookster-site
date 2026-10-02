/* Screen-space editor for the 16 lower-tray click zones. */
(function(){
  'use strict';

  const api=window.__COOKSTER_BOTTOM_BUTTONS__;
  const dock=document.querySelector('[aria-label="Алати"]');
  const uiLayer=document.getElementById('uiElementLayer');
  if(!api||!dock||!uiLayer||window.__COOKSTER_UI_BUTTON_CALIBRATION__)return;

  const W=api.coordinateSystem.width,H=api.coordinateSystem.height;
  const KEY=api.calibrationKey||'cookster.ui-button-hotspots.v1';
  let zones=api.zones.map(zone=>({...zone}));
  const managedIds=new Set(zones.map(zone=>zone.id));
  let storedValue=null;
  try{storedValue=JSON.parse(localStorage.getItem(KEY)||'null');}catch(_){}
  const storedRows=Array.isArray(storedValue)?storedValue:
    (Array.isArray(storedValue?.buttons)?storedValue.buttons:[]);
  const preservedRows=storedRows.filter(row=>!managedIds.has(row?.id));
  let active=false,selectedId='',gesture=null,spacePressed=false;
  let zoom=1,viewOffsetX=0,viewOffsetY=0,focusPoint={x:W/2,y:H*.88};

  const buttonStyle='min-height:28px;padding:4px 8px;border:1px solid #76512d;border-radius:6px;background:#f4dbab;color:#392317;font:700 12px system-ui;cursor:pointer';
  const dockButton=document.createElement('button');
  dockButton.id='uiButtonCalibrationDockButton';
  dockButton.type='button';
  dockButton.textContent='dugmad';
  dockButton.title='Pomeranje, veličina i zum klik-zona na donjim trakama';
  dockButton.style.cssText='pointer-events:auto;min-width:118px;height:28px;padding:2px 10px;border-radius:2px;border:1px solid #8a8a8a;background:#f3f3f3;color:#1d1d1d;font:400 12px "Segoe UI",Arial,sans-serif;cursor:pointer;box-shadow:none;text-align:left';
  dock.appendChild(dockButton);

  const panel=document.createElement('section');
  panel.id='uiButtonCalibrationPanel';
  panel.style.cssText='display:none;position:fixed;z-index:2147483647;left:12px;top:90px;width:310px;max-width:calc(100vw - 24px);max-height:calc(100vh - 110px);overflow:auto;box-sizing:border-box;padding:10px;border:1px solid #54351f;border-radius:8px;background:#fff7e5;color:#352317;box-shadow:0 5px 16px #0006;font:12px/1.35 system-ui,sans-serif';
  panel.innerHTML=`
    <header data-drag-handle style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin:-2px 0 8px;cursor:move;user-select:none">
      <strong style="font-size:14px">Kalibracija dugmadi</strong>
      <button type="button" data-close aria-label="Zatvori" style="${buttonStyle};min-width:32px;font-size:16px">×</button>
    </header>
    <div style="margin-bottom:7px">Izaberi zonu i prevuci je levo/desno. Koordinate su vezane za ekran igre (${W} × ${H}).</div>
    <div style="display:grid;grid-template-columns:1fr 34px 34px 54px;align-items:center;gap:4px;margin:7px 0">
      <strong data-zoom-value>Zum: 100%</strong>
      <button type="button" data-zoom-out aria-label="Umanji prikaz" title="Umanji prikaz" style="${buttonStyle};min-width:0;padding:2px">−</button>
      <button type="button" data-zoom-in aria-label="Uvećaj prikaz" title="Uvećaj prikaz" style="${buttonStyle};min-width:0;padding:2px">+</button>
      <button type="button" data-zoom-reset title="Vrati prikaz na 100%" style="${buttonStyle};min-width:0;padding:2px">100%</button>
    </div>
    <small style="display:block;margin-bottom:8px;color:#6c503b">Točkić zumira oko kursora; drži Space i prevuci za pomeranje uvećanog prikaza. Zum ne menja koordinate.</small>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin:8px 0">
      <label>X<input data-geom="x" type="number" step="1" style="width:100%;box-sizing:border-box"></label>
      <label>Y<input data-geom="y" type="number" step="1" style="width:100%;box-sizing:border-box"></label>
      <label>Širina<input data-geom="width" type="number" min="12" step="1" style="width:100%;box-sizing:border-box"></label>
      <label>Visina<input data-geom="height" type="number" min="12" step="1" style="width:100%;box-sizing:border-box"></label>
    </div>
    <div data-count style="font-weight:800;margin:7px 0"></div>
    <div data-list style="display:grid;gap:4px;max-height:145px;overflow:auto;margin:6px 0"></div>
    <button type="button" data-export style="${buttonStyle};width:100%;margin:6px 0">Izvezi JSON</button>
    <textarea data-json readonly spellcheck="false" placeholder="JSON koordinata pojaviće se ovde." style="display:none;width:100%;height:130px;box-sizing:border-box;padding:6px;border:1px solid #a88b65;border-radius:4px;font:11px/1.3 monospace"></textarea>
    <small style="display:block;margin-top:5px;color:#6c503b">Kontura je 1 px. Prevuci unutrašnjost za pomeranje; uhvati malu ručicu na ivici za promenu veličine.</small>`;
  document.body.appendChild(panel);

  const overlay=document.createElement('div');
  overlay.id='uiButtonCalibrationOverlay';
  overlay.style.cssText='position:fixed;left:0;top:0;width:1672px;height:941px;transform-origin:0 0;z-index:2147483646;display:none;pointer-events:none;touch-action:none;user-select:none';
  document.body.appendChild(overlay);

  const q=selector=>panel.querySelector(selector);
  const list=q('[data-list]'),count=q('[data-count]'),zoomReadout=q('[data-zoom-value]');
  const jsonOutput=q('[data-json]');
  const geomInputs=Object.fromEntries([...panel.querySelectorAll('[data-geom]')].map(input=>[input.dataset.geom,input]));
  const selected=()=>zones.find(zone=>zone.id===selectedId)||null;
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const round=value=>Math.round(Number(value)||0);

  function bounds(){
    const scale=Math.min(innerWidth/W,innerHeight/H);
    const left=(innerWidth-W*scale)/2+viewOffsetX-scale*(zoom-1)*focusPoint.x;
    const top=(innerHeight-H*scale)/2+viewOffsetY-scale*(zoom-1)*focusPoint.y;
    const transform=`scale(${scale*zoom})`;
    uiLayer.style.left=left+'px';
    uiLayer.style.top=top+'px';
    uiLayer.style.transform=transform;
    overlay.style.left=left+'px';
    overlay.style.top=top+'px';
    overlay.style.transform=transform;
    zoomReadout.textContent=`Zum: ${Math.round(zoom*100)}%`;
  }
  function changeZoom(factor,anchor){
    if(anchor)focusPoint=anchor;
    zoom=clamp(zoom*factor,1,4);
    bounds();
  }
  function resetZoom(){
    zoom=1;viewOffsetX=0;viewOffsetY=0;focusPoint={x:W/2,y:H*.88};
    bounds();
  }
  function syncZone(zone){
    api.updateZone(zone.id,{x:zone.x,y:zone.y,width:zone.width,height:zone.height});
  }
  function save(){
    const updated=zones.map(zone=>({
      id:zone.id,label:zone.label,x:round(zone.x),y:round(zone.y),
      width:round(zone.width),height:round(zone.height),shape:'rect',
      layer:Number(zone.layer)||1,group:zone.group,slot:zone.slot,centerGlow:!!zone.centerGlow
    }));
    const rows=[...preservedRows,...updated];
    const value=storedValue&&typeof storedValue==='object'&&!Array.isArray(storedValue)
      ?{...storedValue,version:1,coordinateSystem:{width:W,height:H,origin:'top-left',space:'screen'},buttons:rows}
      :rows;
    try{
      localStorage.setItem(KEY,JSON.stringify(value));
      storedValue=value;
    }catch(_){}
  }
  function exportString(){
    return JSON.stringify({
      version:1,
      coordinateSystem:{width:W,height:H,origin:'top-left',space:'screen'},
      buttons:zones.map(zone=>({
        id:zone.id,label:zone.label,x:round(zone.x),y:round(zone.y),
        width:round(zone.width),height:round(zone.height),shape:'rect',layer:Number(zone.layer)||1
      }))
    },null,2);
  }
  function selectZone(id){
    selectedId=id;
    const zone=selected();
    for(const [key,input] of Object.entries(geomInputs)){
      input.value=zone?String(round(zone[key])):'';
      input.disabled=!zone;
    }
    render();
  }
  function render(){
    overlay.replaceChildren();
    zones.forEach(zone=>{
      const element=document.createElement('div');
      const isSelected=zone.id===selectedId;
      element.dataset.zoneId=zone.id;
      element.title=`${zone.label} · ${round(zone.x)}, ${round(zone.y)} · ${round(zone.width)}×${round(zone.height)}`;
      element.style.cssText=[
        'position:absolute',
        `left:${zone.x}px`,`top:${zone.y}px`,
        `width:${zone.width}px`,`height:${zone.height}px`,
        'box-sizing:border-box',
        `border:1px solid ${isSelected?'rgba(255,235,122,.98)':'rgba(32,238,225,.82)'}`,
        `background:${isSelected?'rgba(255,170,0,.10)':'rgba(0,220,220,.055)'}`,
        'box-shadow:none','border-radius:3px','overflow:visible',
        'color:#fff','font:700 10px/1.1 system-ui',
        'text-shadow:0 1px 2px #000','display:grid','place-items:center',
        'cursor:move','touch-action:none'
      ].join(';');
      const label=document.createElement('span');
      label.textContent=zone.label;
      label.style.cssText='pointer-events:none;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:1px 2px;background:rgba(20,20,20,.42);border-radius:2px';
      element.appendChild(label);
      if(isSelected){
        const handles=[
          ['nw','left:-4px;top:-4px;cursor:nwse-resize'],
          ['n','left:calc(50% - 4px);top:-4px;cursor:ns-resize'],
          ['ne','right:-4px;top:-4px;cursor:nesw-resize'],
          ['e','right:-4px;top:calc(50% - 4px);cursor:ew-resize'],
          ['se','right:-4px;bottom:-4px;cursor:nwse-resize'],
          ['s','left:calc(50% - 4px);bottom:-4px;cursor:ns-resize'],
          ['sw','left:-4px;bottom:-4px;cursor:nesw-resize'],
          ['w','left:-4px;top:calc(50% - 4px);cursor:ew-resize']
        ];
        handles.forEach(([side,position])=>{
          const handle=document.createElement('i');
          handle.dataset.resizeHandle=side;
          handle.style.cssText=`position:absolute;${position};box-sizing:border-box;width:8px;height:8px;border:1px solid #fff09b;border-radius:50%;background:rgba(70,60,25,.8);z-index:2;touch-action:none`;
          element.appendChild(handle);
        });
      }
      overlay.appendChild(element);
    });
    count.textContent=`Dugmad: ${zones.length} · izabrano: ${selected()?.label||'—'}`;
    if(jsonOutput.style.display!=='none')jsonOutput.value=exportString();
    renderList();
  }
  function renderList(){
    list.replaceChildren();
    zones.forEach((zone,index)=>{
      const button=document.createElement('button');
      button.type='button';
      button.textContent=`${index+1}. ${zone.label} · ${round(zone.width)}×${round(zone.height)}`;
      button.style.cssText=`${buttonStyle};text-align:left;padding:4px 6px;border-width:1px;${zone.id===selectedId?'background:#ffe08c':''}`;
      button.onclick=()=>selectZone(zone.id);
      list.appendChild(button);
    });
  }
  function point(event){
    const rect=overlay.getBoundingClientRect();
    return {
      x:clamp((event.clientX-rect.left)*W/(rect.width||W),0,W),
      y:clamp((event.clientY-rect.top)*H/(rect.height||H),0,H)
    };
  }
  function onDown(event){
    if(!active||(event.button!==0&&event.button!==1))return;
    event.preventDefault();event.stopPropagation();
    try{overlay.setPointerCapture(event.pointerId);}catch(_){}
    if(event.button===1||spacePressed){
      gesture={kind:'pan',pointerId:event.pointerId,startClientX:event.clientX,startClientY:event.clientY,originX:viewOffsetX,originY:viewOffsetY};
      return;
    }
    const position=point(event);
    focusPoint=position;
    const element=event.target.closest?.('[data-zone-id]');
    const zone=element?zones.find(candidate=>candidate.id===element.dataset.zoneId):null;
    if(!zone)return;
    const handle=event.target.closest?.('[data-resize-handle]')?.dataset.resizeHandle||'';
    selectedId=zone.id;
    gesture={
      kind:handle?'resize':'move',pointerId:event.pointerId,id:zone.id,handle,
      startX:position.x,startY:position.y,
      origin:{x:+zone.x,y:+zone.y,width:+zone.width,height:+zone.height}
    };
    for(const [key,input] of Object.entries(geomInputs)){
      input.value=String(round(zone[key]));input.disabled=false;
    }
    render();
  }
  function onMove(event){
    if(!gesture||event.pointerId!==gesture.pointerId)return;
    event.preventDefault();event.stopPropagation();
    if(gesture.kind==='pan'){
      viewOffsetX=gesture.originX+event.clientX-gesture.startClientX;
      viewOffsetY=gesture.originY+event.clientY-gesture.startClientY;
      bounds();
      return;
    }
    const position=point(event),dx=position.x-gesture.startX,dy=position.y-gesture.startY;
    const zone=zones.find(candidate=>candidate.id===gesture.id);
    if(!zone)return;
    if(gesture.kind==='move'){
      zone.x=round(clamp(gesture.origin.x+dx,0,W-zone.width));
      zone.y=round(clamp(gesture.origin.y+dy,0,H-zone.height));
    }else{
      const handle=gesture.handle,origin=gesture.origin;
      let left=origin.x,top=origin.y,right=origin.x+origin.width,bottom=origin.y+origin.height;
      if(handle.includes('w'))left=clamp(origin.x+dx,0,right-12);
      if(handle.includes('e'))right=clamp(origin.x+origin.width+dx,left+12,W);
      if(handle.includes('n'))top=clamp(origin.y+dy,0,bottom-12);
      if(handle.includes('s'))bottom=clamp(origin.y+origin.height+dy,top+12,H);
      zone.x=round(left);zone.y=round(top);zone.width=round(right-left);zone.height=round(bottom-top);
    }
    syncZone(zone);
    for(const [key,input] of Object.entries(geomInputs))input.value=String(round(zone[key]));
    render();
  }
  function onUp(event){
    if(!gesture||event.pointerId!==gesture.pointerId)return;
    event.preventDefault();event.stopPropagation();
    if(gesture.kind!=='pan')save();
    gesture=null;
    render();
  }
  function onWheel(event){
    if(!active)return;
    event.preventDefault();event.stopPropagation();
    changeZoom(event.deltaY<0?1.12:1/1.12,point(event));
  }

  overlay.addEventListener('pointerdown',onDown);
  overlay.addEventListener('pointermove',onMove);
  overlay.addEventListener('pointerup',onUp);
  overlay.addEventListener('pointercancel',onUp);
  overlay.addEventListener('wheel',onWheel,{passive:false});
  for(const type of ['click','dblclick','contextmenu'])overlay.addEventListener(type,event=>{
    event.preventDefault();event.stopPropagation();
  });
  panel.addEventListener('pointerdown',event=>event.stopPropagation());
  panel.addEventListener('click',event=>event.stopPropagation());
  panel.addEventListener('wheel',event=>event.stopPropagation(),{passive:true});
  q('[data-close]').onclick=close;
  q('[data-zoom-in]').onclick=()=>changeZoom(1.2);
  q('[data-zoom-out]').onclick=()=>changeZoom(1/1.2);
  q('[data-zoom-reset]').onclick=resetZoom;
  q('[data-export]').onclick=()=>{
    const json=exportString();
    jsonOutput.value=json;jsonOutput.style.display='block';
    const blob=new Blob([json],{type:'application/json'}),url=URL.createObjectURL(blob),anchor=document.createElement('a');
    anchor.href=url;anchor.download='cookster-dugmad-koordinate.json';anchor.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  for(const [key,input] of Object.entries(geomInputs))input.addEventListener('change',()=>{
    const zone=selected();if(!zone)return;
    const min=key==='width'||key==='height'?12:0;
    const max=key==='x'?W-zone.width:key==='y'?H-zone.height:key==='width'?W-zone.x:H-zone.y;
    zone[key]=round(clamp(Number(input.value)||0,min,max));
    input.value=String(zone[key]);
    syncZone(zone);save();render();
  });
  function close(){
    if(!active)return;
    active=false;gesture=null;spacePressed=false;
    resetZoom();
    api.setCalibrationMode(false);
    panel.style.display='none';overlay.style.display='none';overlay.style.pointerEvents='none';
    dock.style.zIndex='13000';dockButton.textContent='dugmad';
  }
  function open(){
    active=true;
    panel.style.display='block';overlay.style.display='block';overlay.style.pointerEvents='auto';
    api.setCalibrationMode(true);
    viewOffsetX=0;viewOffsetY=0;zoom=1;focusPoint={x:W/2,y:H*.88};
    dock.style.zIndex='2147483000';dockButton.textContent='zatvori dugmad';
    bounds();render();
    (window.__cooksterToolPanels||[]).forEach(peer=>{
      if(peer){peer.open=false;peer.style.display='none';}
    });
    const scenePanel=document.getElementById('sceneZoneCalibration');
    if(scenePanel){scenePanel.classList.remove('open');scenePanel.style.display='none';}
    document.body.classList.remove('scene-zone-calibration-active');
  }
  const dockObserver=new MutationObserver(()=>{
    if(active&&getComputedStyle(dock).display==='none')close();
  });
  dockObserver.observe(dock,{attributes:true,attributeFilter:['style']});
  dockButton.onclick=()=>active?close():open();
  dock.addEventListener('click',event=>{if(active&&event.target!==dockButton)close();});
  const panelDrag=q('[data-drag-handle]');
  panelDrag.addEventListener('pointerdown',event=>{
    if(event.target.closest('button'))return;
    const rect=panel.getBoundingClientRect();
    panel._drag={dx:event.clientX-rect.left,dy:event.clientY-rect.top,id:event.pointerId};
    try{panelDrag.setPointerCapture(event.pointerId);}catch(_){}
  });
  panelDrag.addEventListener('pointermove',event=>{
    const drag=panel._drag;if(!drag||drag.id!==event.pointerId)return;
    panel.style.left=clamp(event.clientX-drag.dx,0,innerWidth-panel.offsetWidth)+'px';
    panel.style.top=clamp(event.clientY-drag.dy,0,innerHeight-48)+'px';
  });
  const stopPanelDrag=event=>{if(panel._drag?.id===event.pointerId)panel._drag=null;};
  panelDrag.addEventListener('pointerup',stopPanelDrag);
  panelDrag.addEventListener('pointercancel',stopPanelDrag);
  window.addEventListener('keydown',event=>{
    if(!active||event.code!=='Space'||/^(INPUT|TEXTAREA|SELECT)$/.test(event.target?.tagName||''))return;
    spacePressed=true;event.preventDefault();
  });
  window.addEventListener('keyup',event=>{if(event.code==='Space')spacePressed=false;});
  window.addEventListener('blur',()=>{spacePressed=false;});
  window.addEventListener('resize',bounds);
  window.addEventListener('scroll',bounds,true);
  window.__COOKSTER_UI_BUTTON_CALIBRATION__={
    open,close,
    getData:()=>JSON.parse(exportString()),
    getView:()=>({zoom,focus:{...focusPoint},pan:{x:viewOffsetX,y:viewOffsetY}})
  };
})();