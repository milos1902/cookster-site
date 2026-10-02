/* Cookster v197 - deterministic pseudo-3D food mesh for mixed sliced ingredients.
   HTML/CSS equivalent of instanced mesh rendering: many lightweight sprite instances,
   positioned on an elliptical food surface with depth-based scale/z-order.
   Thermal state can differ per batch, so fresh food can coexist with browned food. */
(function(){
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,+v||0));
  const ALLOWED=new Set(['luk','paprika','paradajz','krastavac']);

  function hash(str){
    let h=2166136261>>>0;
    for(const ch of String(str||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}
    return h>>>0;
  }
  function rand(seed){
    let s=seed>>>0;
    return ()=>{
      s=(Math.imul(s,1664525)+1013904223)>>>0;
      return s/4294967296;
    };
  }
  function slicedEntries(counts){
    return [...ALLOWED].map(key=>({key,count:Math.max(0,Math.round(+counts?.[key]||0))})).filter(x=>x.count>0);
  }
  function isMixed(counts){return slicedEntries(counts).length>=2;}

  function thermalEntries(counts,batches,heat=0){
    const machine=window.CooksterFoodStateMachine;
    const active=(Array.isArray(batches)?batches:[])
      .filter(b=>ALLOWED.has(b?.key)&&(+b.count||0)>0)
      .map((b,idx)=>({
        key:b.key,
        count:Math.max(0,+b.count||0),
        id:b.id||`${b.key}_${idx}`,
        state:machine?.batchPhase(b,heat)?.id||'raw',
        stage:machine?.batchVisualStage(b,heat)||1
      }));
    if(active.length)return active;
    return slicedEntries(counts).map((e,idx)=>({...e,id:`${e.key}_${idx}`,state:'raw',stage:1}));
  }

  function append(layer,counts,stage,catalog,batches=[],heat=0){
    const entries=slicedEntries(counts);
    if(entries.length<2)return false;

    const thermal=thermalEntries(counts,batches,heat);
    const weighted=[];
    for(const entry of thermal){
      // Three light visual instances per logical ingredient; cap total below for DOM cost.
      const pieces=Math.max(1,Math.round(entry.count*3));
      for(let i=0;i<pieces;i++)weighted.push(entry);
    }
    if(!weighted.length)return false;
    const maxPieces=Math.min(20,Math.max(6,weighted.length));
    const seed=hash(thermal.map(e=>`${e.id}:${e.key}:${e.count}:${e.state}:${e.stage}`).join('|'));
    const r=rand(seed);

    // Deterministic shuffle gives a real interleaved mixture instead of ingredient bands.
    for(let i=weighted.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[weighted[i],weighted[j]]=[weighted[j],weighted[i]];}
    const bag=weighted.slice(0,maxPieces);

    const frag=document.createDocumentFragment();
    for(let i=0;i<bag.length;i++){
      const entry=bag[i],key=entry.key,def=catalog?.[key]||{};
      const src=def.slicedSrc||def.src;
      if(!src)continue;
      const a=2*Math.PI*(i*.61803398875+r()*.11);
      const radius=Math.sqrt((i+.65)/bag.length)*(.82+r()*.12);
      const x=50+Math.cos(a)*42*radius;
      const y=50+Math.sin(a)*31*radius;
      const depth=clamp((y-18)/64);
      const size=(key==='krastavac'?34:key==='paprika'?37:key==='luk'?33:36)*(0.76+depth*.34)*(0.92+r()*.16);
      const rot=-28+r()*56;

      const img=document.createElement('img');
      img.className=`food-mesh-instance food-mesh-${key}`;
      img.src=src;img.alt='';img.draggable=false;
      img.style.left=x.toFixed(2)+'%';
      img.style.top=y.toFixed(2)+'%';
      img.style.width=size.toFixed(2)+'%';
      img.style.setProperty('--mesh-rot',rot.toFixed(1)+'deg');
      img.style.setProperty('--mesh-depth',depth.toFixed(3));
      img.style.zIndex=String(12+Math.round(depth*42)+i%3);
      img.dataset.meshKey=key;
      img.dataset.foodState=entry.state||'raw';
      img.dataset.meshStage=String(entry.stage||stage||1);
      frag.appendChild(img);
    }
    layer.classList.add('food-mesh-25d');
    layer.appendChild(frag);
    return true;
  }

  window.CooksterFoodMesh={append,isMixed,slicedEntries,thermalEntries};
})();
