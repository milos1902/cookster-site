/* Cookster — draw vessel occlusion and visible-food polygons, then export JSON. */
(function(){
  'use strict';

  const STORAGE_KEY='cookster.vessel-food-mask-calibration.v1';
  const BASE_VESSELS=[
    {id:'serpa_plava',label:'Plava šerpa',src:'assets/new_props/serpa_plava.png'},
    {id:'serpa_velika',label:'Velika šerpa',src:'assets/new_props/serpa_velika.png'},
    {id:'tiganj_veliki',label:'Veliki liveni tiganj',src:'assets/new_props/tiganj_veliki.png'},
    {id:'tiganj_mali',label:'Mali tiganj',src:'assets/new_props/tiganj_mali.png'},
    {id:'vangla_srednja',label:'Srednja vangla',src:'assets/new_props/vangla_srednja.png'},
    {id:'vangla_mala',label:'Mala vangla',src:'assets/new_props/vangla_mala.png'},
    {id:'vangla_velika',label:'Velika vangla',src:'assets/new_props/vangla_velika.png'},
    {id:'lavor_emajl_veliki',label:'Veliki emajlirani lavor',src:'assets/new_props/lavor_emajl_veliki.png'},
    {id:'oval_tanjir',label:'Veliki oval (tanjir)',src:'assets/calibration_props/oval/oval_prazan.webp'}
  ];
  // Every container that is added to the game later (KITCHEN_EQUIPMENT with vessel:true, or with capacityMl / fillStates) is listed here by itself.
  let VESSELS=BASE_VESSELS.slice();
  function syncVessels(){
    const list=BASE_VESSELS.slice();
    const pools=[];
    try{if(window.CooksterCatalog&&Array.isArray(window.CooksterCatalog.KITCHEN_EQUIPMENT))pools.push(window.CooksterCatalog.KITCHEN_EQUIPMENT);}catch(_){}
    try{if(typeof KITCHEN_EQUIPMENT!=='undefined'&&Array.isArray(KITCHEN_EQUIPMENT))pools.push(KITCHEN_EQUIPMENT);}catch(_){}
    for(const pool of pools)for(const d of pool){
      if(!d||!d.id||!d.src||list.some(v=>v.id===d.id))continue;
      if(d.vessel===true||(+d.capacityMl>0)||d.fillStates)list.push({id:d.id,label:d.label||d.id,src:d.src});
    }
    VESSELS=list;
    if(data&&data.vessels)VESSELS.forEach(v=>{if(!data.vessels[v.id])data.vessels[v.id]=emptyShape();});
    if(!VESSELS.some(v=>v.id===currentId))currentId=VESSELS[0].id;
  }
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
  let root=null,stage=null,img=null,svg=null,select=null,statusEl=null,card=null;

  function clone(value){return JSON.parse(JSON.stringify(value));}
  function emptyShape(){return {soft:1.5,mask:[],foodVisible:[],bottom:[],depth:{bottom:null,foodTop:null}};}
  function normalizePoint(p){
    return {
      x:+Math.max(0,Math.min(100,+p?.x||0)).toFixed(3),
      y:+Math.max(0,Math.min(100,+p?.y||0)).toFixed(3)
    };
  }
  function load(){
    syncVessels();
    try{data=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')||{};}catch(_){data={};}
    if(!data.vessels||typeof data.vessels!=='object')data.vessels={};
    VESSELS.forEach(v=>{
      if(!data.vessels[v.id])data.vessels[v.id]=emptyShape();
      ['mask','foodVisible','bottom'].forEach(k=>{
        if(!Array.isArray(data.vessels[v.id][k]))data.vessels[v.id][k]=[];
        data.vessels[v.id][k]=data.vessels[v.id][k].map(normalizePoint);
      });
      {const sv=data.vessels[v.id].soft;data.vessels[v.id].soft=Number.isFinite(+sv)&&sv!==null?Math.max(0,Math.min(6,+sv)):1.5;}
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
    pushLive();
  }
  // the game takes what is drawn at once (the vessel in the kitchen is drawn again with the new area of the food)
  let liveTimer=0;
  function pushLive(){
    if(liveTimer)return;
    liveTimer=requestAnimationFrame(()=>{
      liveTimer=0;
      const C=window.CooksterVesselFoodCalibration;if(!C||!C.setLive)return;
      const c=data.vessels&&data.vessels[currentId];if(!c)return;
      const xy=l=>(l||[]).map(p=>[p.x,p.y]),pt=p=>p?[p.x,p.y]:null;
      C.setLive(currentId,{soft:c.soft,mask:xy(c.mask),foodVisible:xy(c.foodVisible),bottom:xy(c.bottom),depth:{bottom:pt(c.depth&&c.depth.bottom),foodTop:pt(c.depth&&c.depth.foodTop)}});
      window.dispatchEvent(new CustomEvent('cookster:vessel-calibration',{detail:{id:currentId}}));
    });
  }
  function current(){
    if(!data.vessels[currentId])data.vessels[currentId]=emptyShape();
    return data.vessels[currentId];
  }
  function fillSelect(){
    if(!select)return;select.innerHTML='';
    VESSELS.forEach(v=>{const o=document.createElement('option');o.value=v.id;const sv=!!(data.vessels&&data.vessels[v.id]&&data.vessels[v.id].saved);o.textContent=(sv?'✔ ':'')+v.label;o.style.fontWeight=sv?'800':'400';o.dataset.saved=sv?'1':'';select.appendChild(o);});
    select.value=currentId;
    const b=root&&root.querySelector('#vfmmSave');if(b){const sv=!!current().saved;b.textContent=sv?'✔ Sačuvano (klikni da poništiš)':'💾 Sačuvaj ovu posudu';b.classList.toggle('vfmm-saved',sv);}
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
        const circle=svgEl('circle',{cx:p.x,cy:p.y,r:+(1.35/Math.pow(zoom,.85)).toFixed(3)},`vfmm-point ${kind} vfmm-dynamic`);
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
      const circle=svgEl('circle',{cx:point.x,cy:point.y,r:+(1.75/Math.pow(zoom,.85)).toFixed(3)},`vfmm-depth-point ${kind} vfmm-dynamic`);
      circle.dataset.kind=kind;
      circle.dataset.index='0';
      circle.addEventListener('pointerdown',onPointDown);
      svg.appendChild(circle);
      svg.appendChild(svgEl('text',{x:Math.min(74,Math.max(2,point.x+2)),y:Math.max(4,point.y-2)},`vfmm-depth-label ${kind} vfmm-dynamic`)).textContent=config.label;
    });
    const last=Array.isArray(current()[mode])?current()[mode].at(-1):null;
    if(last&&Array.isArray(current()[mode])){
      svg.appendChild(svgEl('circle',{cx:last.x,cy:last.y,r:+(2.3/Math.pow(zoom,.85)).toFixed(3)},'vfmm-crosshair vfmm-dynamic'));
    }
    setStatus(countText()+' Klikni za novu tačku. Prevuci postojeću tačku za pomeranje.');
  }
  function onStagePointerDown(e){
    if(e.button!==0||e.target!==stage&&e.target!==img&&e.target!==svg)return;
    const p=pointFromEvent(e);
    if(DEPTH_MODES[mode]){
      current().depth[DEPTH_MODES[mode].key]=p;
    }else{
      // a click on a line of the polygon puts the new point right there (between the two points of that line); elsewhere the point is added at the end
      const pts=current()[mode],n=pts.length;let at=-1;
      if(n>=3){
        const lim=2.2/Math.pow(zoom,.85);let best=lim;
        for(let i=0;i<n;i++){
          const a=pts[i],b=pts[(i+1)%n],dx=b.x-a.x,dy=b.y-a.y,l2=dx*dx+dy*dy;
          const t=l2?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/l2)):0;
          const d=Math.hypot(p.x-(a.x+dx*t),p.y-(a.y+dy*t));
          if(d<best){best=d;at=i+1;}
        }
      }
      if(at>0&&at<n)pts.splice(at,0,p);else pts.push(p);
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
    fillSelect();
    if(img){
      img.alt=vessel.label;
      img.src=vessel.src;
      img.onload=()=>{
        if(img.naturalWidth&&img.naturalHeight)stage.style.aspectRatio=`${img.naturalWidth}/${img.naturalHeight}`;
      };
    }
    const sf=root&&root.querySelector('#vfmmSoft');if(sf){sf.value=current().soft;root.querySelector('#vfmmSoftN').textContent=(+current().soft).toFixed(1);}
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
  // ---------- the vessel in the game, with food in it (to see at once how the drawn areas work) ----------
  function gameItem(){try{return (window.items||[]).find(it=>it&&it.dataset&&it.dataset.itemId===currentId&&it!==window.holding)||null;}catch(_){return null;}}
  function say(t){setStatus(t);try{showToast(t);}catch(_){}}
  function placeVessel(){
    let el=gameItem();
    if(!el){
      try{spawnKitchenEquipment(currentId,false,{cx:Math.round(Math.min(1100,Math.max(760,(window.innerWidth||1672)*.6)/(window.scale||1))),by:600});}catch(_){}
      el=gameItem();
    }
    if(!el){say('Ova posuda još nije u igri (nije u Kuhinjskim elementima).');return null;}
    return el;
  }
  function qty(){return Math.max(1,Math.min(6,+root.querySelector('#vfmmQty').value||3));}
  // pieces like the ones of a hand cut (key C): one picture with many pieces, every piece moves on its own (the colours are taken from the real art of the vegetable)
  function sampleAtlas(seed,col){
    const cv=document.createElement('canvas');cv.width=260;cv.height=70;const g=cv.getContext('2d'),P=[];
    for(let i=0;i<7;i++){const w=26+((i*7+seed)%9),h=26+((i*5+seed)%11);g.fillStyle=col||'#c33';g.beginPath();g.roundRect(i*36+3,5,w,h,6);g.fill();P.push([i*36,0,36,48,18,24,(i-3)*7,((i*5+seed)%9)-4,i*.5]);}
    return cv.toDataURL('image/webp',.9)+'#'+JSON.stringify({W:60,H:30,p:P});
  }
  function emptyVessel(){
    const el=gameItem();if(!el)return;
    try{
      if(isHeatableCookwareItem(el)){CooksterPan.reset(el);delete el.dataset.panIngredientMeta;}
      else{CooksterContainer.write(el,CooksterContainer.empty());el.dataset.srvItems='[]';el.dataset.srvOil='0';el.dataset.srvParsley='0';}
      renderCookwareContents(el);window.CooksterServe&&window.CooksterServe.render(el);
    }catch(e){say('Ne mogu da ispraznim: '+e.message);}
  }
  function fillVessel(kind){
    const el=placeVessel();if(!el)return;const n=qty();
    try{
      if(kind==='serve'){
        if(!(window.CooksterServe&&window.CooksterServe.isServing(el))){say('Ova posuda nema „složeno na tanjir“: probaj seckano ili komadiće.');return;}
        const A=[['assets/ingredients/zelena_peel/peeled.png','zelena_oljustena','Oljuštena zelena paprika',.5],['assets/ingredients/paprika_peel/peeled.png','crvena_oljustena','Oljuštena crvena paprika',.42]],l=[];
        for(let i=0;i<Math.min(8,n+1);i++){const a=A[i%2];l.push({x:+(.3+.4*((i*37)%10)/10).toFixed(3),y:+(.35+.3*((i*53)%10)/10).toFixed(3),s:a[0],f:'p',w:a[3],k:a[1],l:a[2]});}
        el.dataset.srvItems=JSON.stringify(l);el.dataset.srvSeed=el.dataset.srvSeed||'7';window.CooksterServe.render(el);return;
      }
      const keys=['paradajz_diced','paprika_diced'];
      if(isHeatableCookwareItem(el)){
        const m=CooksterPan.read(el);m.ingredients={};keys.forEach(k=>m.ingredients[k]=n);CooksterPan.write(el,m);
        if(kind==='pieces')keys.forEach((k,i)=>rememberPanIngredientMeta(el,{key:k,baseKey:k.replace('_diced',''),type:'vegetable',form:'diced',cutState:'diced',label:k,src:sampleAtlas(i*3,i?'#6a3':'#c33')}));
        else el.dataset.panIngredientMeta='{}';
      }else{
        const m=CooksterContainer.empty();m.items={};
        keys.forEach((k,i)=>{const b=k.replace('_diced',''),def=(window.CooksterCatalog&&(window.CooksterCatalog.VEGETABLES&&window.CooksterCatalog.VEGETABLES[b]))||(typeof VEGETABLES!=='undefined'?VEGETABLES[b]:null)||{};
          m.items[k]={count:n,type:'vegetable',label:def.dicedLabel||b,src:kind==='pieces'?sampleAtlas(i*3,i?'#6a3':'#c33'):(def.dicedSrc||''),form:'diced',baseKey:b,cutState:'diced'};});
        CooksterContainer.write(el,m);
      }
      renderCookwareContents(el);
    }catch(e){say('Ne mogu da stavim hranu: '+e.message);}
  }
  // zoom of the drawing: the wheel over the picture zooms (to the place of the mouse), the right or the middle button moves it; the game behind the tool never hears the wheel
  let zoom=1,panX=0,panY=0;
  function applyZoom(){
    if(!stage)return;
    stage.style.transformOrigin='0 0';
    stage.style.transform=zoom===1&&!panX&&!panY?'':`translate(${panX}px,${panY}px) scale(${zoom})`;
    const z=root&&root.querySelector('#vfmmZoomN');if(z)z.textContent=Math.round(zoom*100)+'%';
    draw();
  }
  function resetZoom(){zoom=1;panX=0;panY=0;applyZoom();}
  function wireZoom(){
    const wrap=stage.parentElement;
    wrap.style.overflow='hidden';wrap.style.position='relative';
    wrap.addEventListener('wheel',e=>{
      e.preventDefault();e.stopPropagation();
      const r=wrap.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top,old=zoom;
      zoom=Math.max(1,Math.min(10,zoom*(e.deltaY<0?1.2:1/1.2)));
      if(zoom===1){panX=0;panY=0;}
      else{
        // keep the point under the mouse where it was: its place in the picture before = after
        const baseL=stage.offsetLeft,baseT=stage.offsetTop;
        const px=(mx-baseL-panX)/old,py=(my-baseT-panY)/old;
        panX=mx-baseL-px*zoom;panY=my-baseT-py*zoom;
      }
      applyZoom();
    },{passive:false});
    let pan=null;
    wrap.addEventListener('pointerdown',e=>{
      if(e.button!==1&&e.button!==2)return;
      pan={x:e.clientX,y:e.clientY,px:panX,py:panY};wrap.setPointerCapture(e.pointerId);e.preventDefault();e.stopPropagation();
    });
    wrap.addEventListener('pointermove',e=>{if(!pan)return;panX=pan.px+(e.clientX-pan.x);panY=pan.py+(e.clientY-pan.y);applyZoom();e.preventDefault();});
    wrap.addEventListener('pointerup',()=>{pan=null;});
    wrap.addEventListener('contextmenu',e=>e.preventDefault());
    wrap.addEventListener('dblclick',e=>{if(e.shiftKey)resetZoom();});
  }
  function setDockText(){const b=root&&root.querySelector('#vfmmDock');if(b)b.textContent=root.classList.contains('vfmm-dock')?'⛶ Veliki prozor':'⬅ Alat sa strane (vidi se igra)';}
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
        <div class="vfmm-live"><span class="vfmm-label">Probaj u igri (odmah)</span>
          <button id="vfmmDock" type="button" class="vfmm-wide">⛶ Veliki prozor</button>
          <label class="vfmm-qty">Količina: <input id="vfmmQty" type="range" min="1" max="6" value="3"><b id="vfmmQtyN">3</b></label>
          <div class="vfmm-row"><button id="vfmmPlace" type="button">🍳 Postavi posudu na sto</button><button id="vfmmEmpty" type="button">🗑 Isprazni</button></div>
          <div class="vfmm-row"><button id="vfmmFillStock" type="button">🥕 Seckano (slike)</button><button id="vfmmFillPieces" type="button">🔪 Komadići (C rez)</button><button id="vfmmFillServe" type="button">🍽 Složeno na tanjir</button></div>
          <small>Svaka tačka koju staviš ili pomeriš se odmah primeni na posudu na stolu.</small></div>
        <div class="vfmm-zoomrow"><span class="vfmm-label">Zum slike</span><button id="vfmmZoomOut" type="button">−</button><b id="vfmmZoomN">100%</b><button id="vfmmZoomIn" type="button">+</button><button id="vfmmZoomReset" type="button">⌂</button><small>točkić miša = zum, desni/srednji taster = pomeranje</small></div>
        <button id="vfmmSave" type="button" class="vfmm-wide">💾 Sačuvaj ovu posudu</button>
        <label class="vfmm-qty">Meki rub zona: <input id="vfmmSoft" type="range" min="0" max="6" step="0.1" value="1.5"><b id="vfmmSoftN">1.5</b></label>
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
    fillSelect();
    button.addEventListener('click',()=>{syncVessels();load();fillSelect();root.classList.add('open');button.classList.add('active');if(!root.dataset.sized){root.dataset.sized='1';root.classList.add('vfmm-dock');}setDockText();renderVessel();});
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
    card=root.querySelector('.vfmm-card');card.setAttribute('data-tool-ui','1');
    const q=sel=>root.querySelector(sel);
    q('#vfmmDock').addEventListener('click',()=>{root.classList.toggle('vfmm-dock');setDockText();});
    q('#vfmmSoft').addEventListener('input',e=>{current().soft=+e.target.value;q('#vfmmSoftN').textContent=(+e.target.value).toFixed(1);persist();});
    q('#vfmmSave').addEventListener('click',()=>{current().saved=!current().saved;persist();fillSelect();say(current().saved?'Posuda je sačuvana (u listi je podebljana).':'Oznaka „sačuvano“ je skinuta.');});
    q('#vfmmQty').addEventListener('input',e=>{q('#vfmmQtyN').textContent=e.target.value;});
    q('#vfmmPlace').addEventListener('click',placeVessel);
    q('#vfmmEmpty').addEventListener('click',emptyVessel);
    q('#vfmmFillStock').addEventListener('click',()=>fillVessel('stock'));
    q('#vfmmFillPieces').addEventListener('click',()=>fillVessel('pieces'));
    q('#vfmmFillServe').addEventListener('click',()=>fillVessel('serve'));
    stage.addEventListener('pointerdown',onStagePointerDown);
    wireZoom();
    const zc=f=>{const r=stage.parentElement.getBoundingClientRect();stage.parentElement.dispatchEvent(new WheelEvent('wheel',{deltaY:f>1?-1:1,clientX:r.left+r.width/2,clientY:r.top+r.height/2,cancelable:true,bubbles:true}));};
    q('#vfmmZoomIn').addEventListener('click',()=>zc(2));q('#vfmmZoomOut').addEventListener('click',()=>zc(.5));q('#vfmmZoomReset').addEventListener('click',resetZoom);
    // nothing that happens in the tool reaches the game behind it (the wheel, the clicks)
    ['wheel','pointerdown','mousedown','click','dblclick','contextmenu','keydown'].forEach(n=>card.addEventListener(n,e=>e.stopPropagation(),n==='wheel'?{passive:false}:false));
    window.addEventListener('pointermove',onPointerMove,{passive:false});
    window.addEventListener('pointerup',endDrag);
    root.addEventListener('click',e=>{if(e.target===root){root.classList.remove('open');button.classList.remove('active');}});
  }
  function init(){load();buildUi();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.CooksterVesselFoodMaskCalibration={get:()=>clone(data),exportJson};
})();