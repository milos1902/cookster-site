/* Cookster — draw vessel occlusion and visible-food polygons, then export JSON. */
(function(){
  'use strict';

  const STORAGE_KEY='cookster.vessel-food-mask-calibration.v1';
  const VESSELS=[
    {id:'serpa_plava',label:'Plava šerpa',src:'assets/new_props/serpa_plava.png'},
    {id:'serpa_velika',label:'Velika šerpa',src:'assets/new_props/serpa_velika.png'},
    {id:'tiganj_veliki',label:'Veliki liveni tiganj',src:'assets/new_props/tiganj_veliki.png'},
    {id:'tiganj_mali',label:'Mali tiganj',src:'assets/new_props/tiganj_mali.png'},
    {id:'vangla_srednja',label:'Srednja vangla',src:'assets/new_props/vangla_srednja.png'},
    {id:'vangla_mala',label:'Mala vangla',src:'assets/new_props/vangla_mala.png'},
    {id:'vangla_velika',label:'Velika vangla',src:'assets/new_props/vangla_velika.png'},
    {id:'lavor_emajl_veliki',label:'Veliki emajlirani lavor',src:'assets/new_props/lavor_emajl_veliki.png'}
  ];
  const MODE_LABELS={
    mask:'Maska koja prekriva hranu',
    foodVisible:'Deo gde se hrana vidi',
    bottom:'Zona dna šerpe',
    depthBottom:'Tačka dna posude',
    depthTop:'Tačka vrha hrane'
  };
  const DEPTH_MODES={
    depthBottom:{key:'bottom',label:'DNO POSUDE'},
    depthTop:{key:'foodTop',label:'VRH HRANE'}
  };
  let data={},currentId=VESSELS[0].id,mode='mask',drag=null;
  let root=null,stage=null,img=null,svg=null,select=null,statusEl=null;

  function clone(value){return JSON.parse(JSON.stringify(value));}
  function emptyShape(){return {mask:[],foodVisible:[],bottom:[],depth:{bottom:null,foodTop:null}};}
  function normalizePoint(p){
    return {
      x:+Math.max(0,Math.min(100,+p?.x||0)).toFixed(3),
      y:+Math.max(0,Math.min(100,+p?.y||0)).toFixed(3)
    };
  }
  function load(){
    try{data=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')||{};}catch(_){data={};}
    if(!data.vessels||typeof data.vessels!=='object')data.vessels={};
    VESSELS.forEach(v=>{
      if(!data.vessels[v.id])data.vessels[v.id]=emptyShape();
      ['mask','foodVisible','bottom'].forEach(k=>{
        if(!Array.isArray(data.vessels[v.id][k]))data.vessels[v.id][k]=[];
        data.vessels[v.id][k]=data.vessels[v.id][k].map(normalizePoint);
      });
      if(!data.vessels[v.id].depth||typeof data.vessels[v.id].depth!=='object')
        data.vessels[v.id].depth={bottom:null,foodTop:null};
      ['bottom','foodTop'].forEach(k=>{
        const point=data.vessels[v.id].depth[k];
        data.vessels[v.id].depth[k]=point&&typeof point==='object'?normalizePoint(point):null;
      });
    });
  }
  function persist(){
    data.format='cookster-vessel-food-visibility-calibration';
    data.version=1;
    data.coordinateSpace={
      type:'vessel-image-local-percent',
      x:'0..100 left-to-right',
      y:'0..100 top-to-bottom',
      note:'Tačke su procenti slike posude, nezavisni od veličine prikaza.'
    };
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(data));}catch(_){}
  }
  function current(){
    if(!data.vessels[currentId])data.vessels[currentId]=emptyShape();
    return data.vessels[currentId];
  }
  function setStatus(message){
    if(statusEl)statusEl.textContent=message;
  }
  function countText(){
    const c=current();
    if(DEPTH_MODES[mode]){
      const point=c.depth?.[DEPTH_MODES[mode].key];
      return `${MODE_LABELS[mode]} · ${point?'postavljena':'nije postavljena'}. Klik postavlja tačku, prevlačenje je pomera.`;
    }
    return `${MODE_LABELS[mode]} · ${c[mode].length} tač.`;
  }
  function pointFromEvent(e){
    const r=stage.getBoundingClientRect();
    return normalizePoint({x:(e.clientX-r.left)/r.width*100,y:(e.clientY-r.top)/r.height*100});
  }
  function svgEl(name,attrs,className){
    const el=document.createElementNS('http://www.w3.org/2000/svg',name);
    Object.entries(attrs||{}).forEach(([k,v])=>el.setAttribute(k,v));
    if(className)el.setAttribute('class',className);
    return el;
  }
  function draw(){
    if(!svg)return;
    svg.querySelectorAll('.vfmm-dynamic').forEach(el=>el.remove());
    const grid=svgEl('g',{},'vfmm-dynamic');
    [25,50,75].forEach(n=>{
      grid.appendChild(svgEl('line',{x1:n,y1:0,x2:n,y2:100},'vfmm-grid'));
      grid.appendChild(svgEl('line',{x1:0,y1:n,x2:100,y2:n},'vfmm-grid'));
    });
    svg.appendChild(grid);
    ['mask','foodVisible','bottom'].forEach(kind=>{
      const points=current()[kind]||[];
      if(points.length>=3){
        svg.appendChild(svgEl('polygon',{points:points.map(p=>`${p.x},${p.y}`).join(' ')},`vfmm-polygon ${kind} vfmm-dynamic`));
      }
      if(points.length>=2){
        svg.appendChild(svgEl('polyline',{points:points.map(p=>`${p.x},${p.y}`).join(' ')},`vfmm-line ${kind} vfmm-dynamic`));
      }
      points.forEach((p,index)=>{
        const circle=svgEl('circle',{cx:p.x,cy:p.y,r:1.35},`vfmm-point ${kind} vfmm-dynamic`);
        circle.dataset.kind=kind;
        circle.dataset.index=String(index);
        circle.addEventListener('pointerdown',onPointDown);
        svg.appendChild(circle);
      });
    });
    Object.entries(DEPTH_MODES).forEach(([kind,config])=>{
      const point=current().depth?.[config.key];
      if(!point)return;
      svg.appendChild(svgEl('line',{x1:0,y1:point.y,x2:100,y2:point.y},`vfmm-depth-line ${kind} vfmm-dynamic`));
      const circle=svgEl('circle',{cx:point.x,cy:point.y,r:1.75},`vfmm-depth-point ${kind} vfmm-dynamic`);
      circle.dataset.kind=kind;
      circle.dataset.index='0';
      circle.addEventListener('pointerdown',onPointDown);
      svg.appendChild(circle);
      svg.appendChild(svgEl('text',{x:Math.min(74,Math.max(2,point.x+2)),y:Math.max(4,point.y-2)},`vfmm-depth-label ${kind} vfmm-dynamic`)).textContent=config.label;
    });
    const last=Array.isArray(current()[mode])?current()[mode].at(-1):null;
    if(last&&Array.isArray(current()[mode])){
      svg.appendChild(svgEl('circle',{cx:last.x,cy:last.y,r:2.3},'vfmm-crosshair vfmm-dynamic'));
    }
    setStatus(countText()+' Klikni za novu tačku. Prevuci postojeću tačku za pomeranje.');
  }
  function onStagePointerDown(e){
    if(e.button!==0||e.target!==stage&&e.target!==img&&e.target!==svg)return;
    const p=pointFromEvent(e);
    if(DEPTH_MODES[mode]){
      current().depth[DEPTH_MODES[mode].key]=p;
    }else{
      current()[mode].push(p);
    }
    persist();draw();
    e.preventDefault();
  }
  function onPointDown(e){
    if(e.button!==0)return;
    const el=e.currentTarget;
    drag={kind:el.dataset.kind,index:+el.dataset.index,pointerId:e.pointerId};
    el.setPointerCapture?.(e.pointerId);
    e.stopPropagation();e.preventDefault();
  }
  function onPointerMove(e){
    if(!drag)return;
    const p=pointFromEvent(e);
    if(DEPTH_MODES[drag.kind]){
      current().depth[DEPTH_MODES[drag.kind].key]=p;
      persist();draw();
    }else{
      const points=current()[drag.kind];
      if(points?.[drag.index]){points[drag.index]=p;persist();draw();}
    }
    e.preventDefault();
  }
  function endDrag(){drag=null;}
  function renderVessel(){
    const vessel=VESSELS.find(v=>v.id===currentId)||VESSELS[0];
    if(select)select.value=vessel.id;
    if(img){
      img.alt=vessel.label;
      img.src=vessel.src;
      img.onload=()=>{
        if(img.naturalWidth&&img.naturalHeight)stage.style.aspectRatio=`${img.naturalWidth}/${img.naturalHeight}`;
      };
    }
    draw();
  }
  function setMode(next){
    mode=next;
    root.querySelectorAll('.vfmm-mode').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
    draw();
  }
  function clearCurrentMode(){
    if(DEPTH_MODES[mode])current().depth[DEPTH_MODES[mode].key]=null;
    else current()[mode]=[];
    persist();draw();
  }
  function clearCurrentVessel(){
    data.vessels[currentId]=emptyShape();
    persist();draw();
  }
  function clearAll(){
    VESSELS.forEach(v=>data.vessels[v.id]=emptyShape());
    persist();draw();
    setStatus('Obrisane su sve kalibracije. Možeš početi iznova.');
  }
  function exportJson(){
    persist();
    const payload=JSON.stringify({
      format:data.format,
      version:data.version,
      exportedAt:new Date().toISOString(),
      coordinateSpace:data.coordinateSpace,
      vessels:clone(data.vessels)
    },null,2);
    const blob=new Blob([payload],{type:'application/json'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download='cookster_vessel_food_visibility_calibration.json';
    document.body.appendChild(a);a.click();
    setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},1000);
    if(navigator.clipboard?.writeText){
      navigator.clipboard.writeText(payload).then(
        ()=>setStatus('JSON je preuzet i kopiran u clipboard — možeš ga poslati ovde.'),
        ()=>setStatus('JSON je preuzet. Pošalji fajl ovde ili nalepi njegov sadržaj.')
      );
    }else setStatus('JSON je preuzet. Pošalji fajl ovde ili nalepi njegov sadržaj.');
  }
  function buildUi(){
    if(document.getElementById('vesselFoodMaskTool'))return;
    const hud=document.getElementById('hud');
    if(!hud)return;
    const button=document.createElement('button');
    button.id='vesselFoodMaskBtn';button.type='button';
    button.textContent='📐 Maska posude';button.title='Nacrtaj masku i vidljivi deo hrane za svaku posudu';
    hud.appendChild(button);
    root=document.createElement('div');
    root.id='vesselFoodMaskTool';
     root.innerHTML=`<div class="vfmm-card" role="dialog" aria-modal="true" aria-labelledby="vfmmTitle">
      <header class="vfmm-head"><div><h2 id="vfmmTitle">📐 Kalibracija vidljivosti hrane u posudi</h2>
       <p>Izaberi posudu, nacrtaj masku, vidljivu hranu i posebnu zonu dna šerpe. Tačke su u procentima originalne slike.</p></div>
      <button id="vesselFoodMaskClose" type="button" aria-label="Zatvori">×</button></header>
      <div class="vfmm-body"><aside class="vfmm-controls">
        <label><span class="vfmm-label">Posuda</span><select id="vesselFoodMaskVessel"></select></label>
        <div><span class="vfmm-label">Šta trenutno crtaš?</span><div class="vfmm-mode-list">
          <button class="vfmm-mode active" data-mode="mask" type="button">🔴 Maska koja prekriva hranu<small>Deo slike koji treba da bude iznad hrane.</small></button>
          <button class="vfmm-mode" data-mode="foodVisible" type="button">🟢 Deo gde se hrana vidi<small>Unutrašnji prostor u kom hrana sme da bude vidljiva.</small></button>
           <button class="vfmm-mode" data-mode="bottom" type="button">🔵 Zona dna šerpe<small>Obuhvati celo dno koje treba prvo popuniti povrćem.</small></button>
          <button class="vfmm-mode" data-mode="depthBottom" type="button">🟡 Tačka dna posude<small>Najniža tačka dna — jedna tačka po posudi.</small></button>
          <button class="vfmm-mode" data-mode="depthTop" type="button">🟣 Tačka vrha hrane<small>Dokle najviše sme da ide hrana — jedna tačka po posudi.</small></button>
        </div></div>
        <div class="vfmm-actions"><button id="vesselFoodMaskUndo" type="button">↶ Poništi tačku</button><button id="vesselFoodMaskClearMode" type="button">🗑 Obriši ovu zonu</button><button id="vesselFoodMaskClearVessel" type="button">↺ Obriši ovu posudu</button><button id="vesselFoodMaskClearAll" type="button">🗑 Obriši sve posude</button></div>
         <div class="vfmm-legend"><span><i class="vfmm-dot mask"></i> Maska — crveno</span><span><i class="vfmm-dot food"></i> Vidljiva hrana — zeleno</span><span><i class="vfmm-dot bottom"></i> Dno šerpe — plavo</span></div>
         <div class="vfmm-help"><b>Kako se koristi:</b><br>1. Za crvenu, zelenu i plavu zonu klikni po slici da dodaješ tačke.<br>2. Poligoni se povezuju redom i zatvaraju automatski.<br>3. Za žuto i ljubičasto klikni jednom — to su pojedinačne tačke dubine.<br>4. Prevuci bilo koju tačku da je pomeriš, pa pređi na sledeću posudu.</div>
        <div class="vfmm-status" id="vesselFoodMaskStatus"></div>
      </aside><main class="vfmm-canvas-wrap"><div class="vfmm-stage" id="vesselFoodMaskStage"><img id="vesselFoodMaskImage" alt=""><svg id="vesselFoodMaskSvg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Platno za crtanje"></svg></div></main></div>
      <footer class="vfmm-footer"><strong>Kalibracije se čuvaju automatski u ovom pregledaču.</strong><button id="vesselFoodMaskExport" type="button">⬇ Izvezi JSON</button></footer>
    </div>`;
    document.body.appendChild(root);
    stage=root.querySelector('#vesselFoodMaskStage');img=root.querySelector('#vesselFoodMaskImage');svg=root.querySelector('#vesselFoodMaskSvg');select=root.querySelector('#vesselFoodMaskVessel');statusEl=root.querySelector('#vesselFoodMaskStatus');
    VESSELS.forEach(v=>{const o=document.createElement('option');o.value=v.id;o.textContent=v.label;select.appendChild(o);});
    button.addEventListener('click',()=>{root.classList.add('open');button.classList.add('active');renderVessel();});
    root.querySelector('#vesselFoodMaskClose').addEventListener('click',()=>{root.classList.remove('open');button.classList.remove('active');});
    select.addEventListener('change',e=>{currentId=e.target.value;renderVessel();});
    root.querySelectorAll('.vfmm-mode').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
     root.querySelector('#vesselFoodMaskUndo').addEventListener('click',()=>{
       if(DEPTH_MODES[mode])current().depth[DEPTH_MODES[mode].key]=null;
       else current()[mode].pop();
       persist();draw();
     });
    root.querySelector('#vesselFoodMaskClearMode').addEventListener('click',clearCurrentMode);
    root.querySelector('#vesselFoodMaskClearVessel').addEventListener('click',clearCurrentVessel);
    root.querySelector('#vesselFoodMaskClearAll').addEventListener('click',clearAll);
    root.querySelector('#vesselFoodMaskExport').addEventListener('click',exportJson);
    stage.addEventListener('pointerdown',onStagePointerDown);
    window.addEventListener('pointermove',onPointerMove,{passive:false});
    window.addEventListener('pointerup',endDrag);
    root.addEventListener('click',e=>{if(e.target===root){root.classList.remove('open');button.classList.remove('active');}});
  }
  function init(){load();buildUi();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.CooksterVesselFoodMaskCalibration={get:()=>clone(data),exportJson};
})();