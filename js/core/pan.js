/* Cookster v196 - backwards-compatible cookware cooking model.
   Each ingredient addition is a batch with its own thermal state.
   Aggregate fields (doneness/overcook/burnt) are retained for old saves/UI. */
(function(){
  const LEGACY_DATASET_KEYS=[
    'tomatoCount','countParadajz','countPaprika','countLuk',
    'cookProgress','stirProgress','textureProgress','heat','burnt','served'
  ];

  let batchSeq=0;

  // v198.5.25: panContents is serialized for save compatibility, but gameplay
  // frequently reads it several times in one visual update. Cache the last
  // normalized model per DOM vessel and return a cheap structural clone.
  const MODEL_CACHE=new WeakMap();
  function cloneModel(d){
    const src=(d&&typeof d==='object')?d:empty();
    return {
      ingredients:{...(src.ingredients||{})},
      batches:(Array.isArray(src.batches)?src.batches:[]).map(b=>({...b})),
      staples:{...(src.staples||{oil:0,salt:0})},
      heat:+src.heat||0,
      doneness:+src.doneness||0,
      overcook:+src.overcook||0,
      mix:+src.mix||0,
      burnt:!!src.burnt,
      served:!!src.served
    };
  }
  function empty(){
    return {
      ingredients:{},
      batches:[],
      staples:{oil:0,salt:0},
      heat:0,
      doneness:0,
      overcook:0,
      mix:0,
      burnt:false,
      served:false
    };
  }

  function baseIngredientKey(key){
    key=String(key||'');
    if(key==='paprika_pecena_oljustena_mlevena')return 'paprika';
    if(key==='patlidzan_pecen_oljusten_mleveno')return 'patlidzan';
    if(key==='patlidzan_pecen_seckan_neoljusten')return 'patlidzan';
    if(key==='beli_luk_mleveno')return 'beli_luk';
    if(key.endsWith('_mlevena')||key.endsWith('_mleveno'))return key.slice(0,-8);
    if(key.endsWith('_celo'))return key.slice(0,-5);
    if(key.endsWith('_diced'))return key.slice(0,-6);
    if(/^paprika_pecena_seckana_(?:oljustena|neoljustena)$/.test(key))return 'paprika';
    if(/^paprika_pecena(?:_\d+)?$/.test(key))return 'paprika';
    return key;
  }

  function cookingSpeeds(key){
    const base=baseIngredientKey(key);
    const cfg=window.CooksterCatalog?.VEGETABLES?.[base]?.cooking||{};
    return {
      cookSpeed:Math.max(.1,+cfg.cookSpeed||1),
      burnSpeed:Math.max(.1,+cfg.burnSpeed||1)
    };
  }

  function makeBatch(key,count=1,seed={}){
    const speeds=cookingSpeeds(key);
    return {
      id:String(seed.id||`batch_${Date.now()}_${++batchSeq}`),
      key:String(key||'ingredient'),
      count:Math.max(0,+count||0),
      doneness:Math.max(0,+seed.doneness||0),
      overcook:Math.max(0,+seed.overcook||0),
      burnt:!!seed.burnt,
      state:String(seed.state||'raw'),
      cookSpeed:Math.max(.1,+seed.cookSpeed||speeds.cookSpeed),
      burnSpeed:Math.max(.1,+seed.burnSpeed||speeds.burnSpeed)
    };
  }

  function summarize(d){
    const active=(d.batches||[]).filter(b=>(+b.count||0)>0);
    const total=active.reduce((s,b)=>s+(+b.count||0),0);
    if(total<=0){
      d.doneness=0;d.overcook=0;d.burnt=false;
      return d;
    }
    d.doneness=active.reduce((s,b)=>s+(+b.doneness||0)*(+b.count||0),0)/total;
    d.overcook=Math.max(0,...active.map(b=>+b.overcook||0));
    d.burnt=active.some(b=>!!b.burnt);
    return d;
  }

  function reconcileBatches(d,legacySeed=null){
    const target={};
    for(const [k,v] of Object.entries(d.ingredients||{})){
      const n=Math.max(0,+v||0);
      if(n>0)target[k]=n;
    }
    d.batches=(Array.isArray(d.batches)?d.batches:[])
      .map(b=>makeBatch(b.key,b.count,b))
      .filter(b=>b.count>0 && target[b.key]>0);

    for(const [key,targetCount] of Object.entries(target)){
      let current=d.batches.filter(b=>b.key===key).reduce((s,b)=>s+b.count,0);
      if(current<targetCount){
        d.batches.push(makeBatch(key,targetCount-current,legacySeed||{}));
      }else if(current>targetCount){
        let remove=current-targetCount;
        for(let i=d.batches.length-1;i>=0&&remove>0;i--){
          const b=d.batches[i];if(b.key!==key)continue;
          const take=Math.min(remove,b.count);b.count-=take;remove-=take;
        }
      }
    }
    d.batches=d.batches.filter(b=>b.count>0);
    return summarize(d);
  }

  function normalize(raw){
    const src=(raw&&typeof raw==='object')?raw:{};
    const d=empty();
    d.ingredients=(src.ingredients&&typeof src.ingredients==='object')?{...src.ingredients}:{};
    d.staples=(src.staples&&typeof src.staples==='object')?{...src.staples}:{oil:0,salt:0};
    d.staples.oil=Math.max(0,+d.staples.oil||0);
    d.staples.salt=Math.max(0,+d.staples.salt||0);
    for(const k of Object.keys(d.ingredients)){
      d.ingredients[k]=Math.max(0,+d.ingredients[k]||0);
      if(d.ingredients[k]<=0)delete d.ingredients[k];
    }
    d.heat=Math.max(0,+src.heat||0);
    d.mix=Math.max(0,Math.min(1,+src.mix||0));
    d.served=!!src.served;

    const legacySeed={
      doneness:Math.max(0,+((src.doneness!==undefined)?src.doneness:src.cook)||0),
      overcook:Math.max(0,+src.overcook||0),
      burnt:!!src.burnt
    };
    d.batches=Array.isArray(src.batches)?src.batches:[];
    reconcileBatches(d,legacySeed);
    return d;
  }

  function migrateLegacyDataset(pan){
    const d=empty();
    const map={paradajz:'countParadajz',paprika:'countPaprika',luk:'countLuk'};
    for(const [k,field] of Object.entries(map)){
      const v=+(pan.dataset[field]||0);
      if(v>0)d.ingredients[k]=v;
    }
    if(!Object.keys(d.ingredients).length){
      const old=+(pan.dataset.tomatoCount||0);
      if(old>0)d.ingredients.paradajz=old;
    }
    d.heat=+(pan.dataset.heat||0);
    const seed={
      doneness:+(pan.dataset.cookProgress||0),
      burnt:pan.dataset.burnt==='1',
      overcook:0
    };
    d.served=pan.dataset.served==='1';
    return reconcileBatches(d,seed);
  }

  function read(pan){
    if(!pan)return empty();
    const raw=pan.dataset.panContents||'';
    const cached=MODEL_CACHE.get(pan);
    if(cached&&cached.raw===raw)return cloneModel(cached.model);

    let parsed=null;
    try{if(raw)parsed=JSON.parse(raw);}catch(_){}
    const model=parsed&&typeof parsed==='object'?normalize(parsed):migrateLegacyDataset(pan);
    MODEL_CACHE.set(pan,{raw,model:cloneModel(model)});
    return cloneModel(model);
  }

  function write(pan,data){
    if(!pan)return null;
    const d=normalize(data);
    const raw=JSON.stringify(d);
    pan.dataset.panContents=raw;
    MODEL_CACHE.set(pan,{raw,model:cloneModel(d)});
    for(const k of LEGACY_DATASET_KEYS)delete pan.dataset[k];
    return d;
  }

  function mutate(pan,fn){
    const d=read(pan);
    fn(d);
    reconcileBatches(d);
    return write(pan,d);
  }

  function addIngredient(pan,key,amount=1){
    amount=Math.max(0,+amount||0);
    if(amount<=0)return read(pan);
    const d=read(pan);
    const existed=(+d.ingredients[key]||0)>0;
    d.ingredients[key]=Math.max(0,(+d.ingredients[key]||0)+amount);
    // v198.5.20: a DIFFERENT newly-added ingredient is always a fresh pile.
    // Nothing visually merges until the player actually stirs with the spoon.
    // Adding more of the same ingredient only disturbs an already-mixed dish a little.
    d.mix=existed
      ? Math.max(0,Math.min(1,d.mix*.82))
      : 0;
    // New food enters as a fresh thermal batch, even if the same ingredient
    // was already cooking. This prevents inherited doneness.
    d.batches.push(makeBatch(key,amount));
    summarize(d);
    return write(pan,d);
  }

  function removeIngredient(pan,key,amount=1){
    amount=Math.max(0,+amount||0);
    if(amount<=0)return read(pan);
    const d=read(pan);
    const current=Math.max(0,+d.ingredients[key]||0);
    const target=Math.max(0,current-amount);
    if(target>0)d.ingredients[key]=target; else delete d.ingredients[key];
    reconcileBatches(d);
    return write(pan,d);
  }

  function addStaple(pan,key,amount=1){
    return mutate(pan,d=>{d.staples[key]=Math.max(0,(+d.staples[key]||0)+amount);});
  }

  function simulate(data,dt,fireLevel=1,heating=false){
    const d=normalize(data);
    dt=Math.max(0,Math.min(.25,+dt||0));
    fireLevel=Math.max(1,Math.min(3,+fireLevel||1));
    const targetHeat=fireLevel===1?.58:(fireLevel===2?.78:1);
    if(heating)d.heat+=(targetHeat-d.heat)*Math.min(1,dt*.95);
    else d.heat=Math.max(0,d.heat-dt*.24);

    if(heating){
      const baseCookSeconds=fireLevel===1?45:(fireLevel===2?36:28);
      for(const b of d.batches){
        if(b.burnt||b.count<=0)continue;
        if(b.doneness<1){
          b.doneness=Math.min(1,b.doneness+(dt/baseCookSeconds)*b.cookSpeed);
          b.overcook=0;
        }else{
          b.overcook+=dt*b.burnSpeed;
          if(b.overcook>=2)b.burnt=true;
        }
      }
    }
    // Cooling lowers heat, but it must NOT erase already-earned browning.
    // `overcook` is a cooked-state history value, not a transient temperature.
    // Stirring may still reduce local overcook intentionally before burning.
    // Explicit per-batch FSM state is persisted for saves/debugging while
    // still being derivable from thermal values for backward compatibility.
    for(const b of d.batches){
      if(window.CooksterFoodStateMachine?.transitionBatch)window.CooksterFoodStateMachine.transitionBatch(b,d.heat);
      else b.state=b.burnt?'burnt':(b.doneness>=1?'cooked':(b.doneness>0?'heating':'raw'));
    }
    summarize(d);
    return d;
  }

  function stir(pan,angularEffort=0,activeSeconds=0){
    if(!pan)return null;
    const effort=Math.max(0,Math.min(.9,+angularEffort||0));
    if(effort<=0)return read(pan);

    const d=read(pan);
    const active=(d.batches||[]).filter(b=>(+b.count||0)>0&&!b.burnt);
    if(!active.length)return d;

    // v198.5.10: two seconds of VALID stirring motion fully blends the dish.
    const mixDt=Math.max(0,Math.min(.12,+activeSeconds||0));
    if(mixDt>0)d.mix=Math.min(1,d.mix+mixDt/2.0);
    else d.mix=Math.min(1,d.mix+effort/(Math.PI*2*1.55)); // legacy fallback

    for(const b of active){
      // Stirring blends the contents but never rewinds cooking progress.
      // Doneness/overcook are advanced only by the cooking simulation.
      if(window.CooksterFoodStateMachine?.transitionBatch)
        window.CooksterFoodStateMachine.transitionBatch(b,d.heat);
    }
    summarize(d);
    return write(pan,d);
  }

  function aggregateByBase(data){
    const d=normalize(data),out={};
    for(const [key,count] of Object.entries(d.ingredients)){
      const base=baseIngredientKey(key);
      out[base]=(out[base]||0)+(+count||0);
    }
    return out;
  }

  function reset(pan){return write(pan,empty());}
  function counts(pan){return {...read(pan).ingredients};}
  function total(pan){return Object.values(read(pan).ingredients).reduce((a,b)=>a+(+b||0),0);}
  function averageDoneness(pan){return read(pan).doneness;}

  window.CooksterPan={
    empty,normalize,read,write,mutate,addIngredient,removeIngredient,addStaple,reset,counts,total,
    simulate,stir,aggregateByBase,baseIngredientKey,averageDoneness
  };
})();
