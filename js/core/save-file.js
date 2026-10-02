/* Portable snapshot validation. No storage or game mutations happen here. */
(function(){
  const MAX_BYTES=10*1024*1024;
  const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
  function fail(path){throw new Error('Neispravna struktura sačuvane igre: '+path+'.');}
  function tree(value,path='fajl',depth=0){
    if(depth>30)fail(path);
    if(typeof value==='number'&&!Number.isFinite(value))fail(path);
    if(Array.isArray(value)){if(value.length>20000)fail(path);value.forEach((v,i)=>tree(v,path+'.'+i,depth+1));}
    else if(object(value)){
      for(const [k,v] of Object.entries(value)){
        if(['__proto__','prototype','constructor'].includes(k))fail(path);
        tree(v,path+'.'+k,depth+1);
      }
    }
  }
  function shape(value,template,path){
    if(Array.isArray(template)){if(!Array.isArray(value))fail(path);}
    else if(object(template)){
      if(!object(value))fail(path);
      for(const [k,v] of Object.entries(template))shape(value[k],v,path+'.'+k);
    }else if(template!==null&&typeof value!==typeof template)fail(path);
    else if(template===null&&value!==null&&typeof value!=='string')fail(path);
  }
  function imageSource(src,path,allowEmpty=false){
    if(allowEmpty&&src==='')return;
    if(typeof src!=='string')fail(path);
    if(!/^assets\/[^\\]*$/.test(src)&&!/^data:image\/(?:png|jpeg|webp|gif);base64,[a-zA-Z0-9+/=]+$/.test(src))fail(path);
    if(src.startsWith('assets/')&&(src.includes('..')||/[:<>"'\x00-\x1f]/.test(src)))fail(path);
  }
  function fields(record,path,numbers=[],strings=[],booleans=[]){
    if(!object(record))fail(path);
    for(const key of numbers)if(record[key]!==undefined&&
      (typeof record[key]!=='number'||!Number.isFinite(record[key])||record[key]<0))fail(path+'.'+key);
    for(const key of strings)if(record[key]!==undefined&&typeof record[key]!=='string')fail(path+'.'+key);
    for(const key of booleans)if(record[key]!==undefined&&typeof record[key]!=='boolean')fail(path+'.'+key);
    if(record.src!==undefined)imageSource(record.src,path+'.src',true);
  }
  function amounts(record,path){
    if(!object(record)||!Object.values(record).every(v=>typeof v==='number'&&Number.isFinite(v)&&v>=0))fail(path);
  }
  function batches(records,path){
    if(!Array.isArray(records))fail(path);
    records.forEach((record,i)=>{
      const p=path+'.'+i;
      fields(record,p,['count','doneness','overcook','cookSpeed','burnSpeed'],['id','key','state'],['burnt']);
      if(typeof record.key!=='string'||!record.key||typeof record.count!=='number')fail(p);
    });
  }
  function cooking(record,path){
    fields(record,path,['heat','mix','doneness','overcook','cook'],[],['burnt','served']);
    amounts(record.ingredients,path+'.ingredients');
    amounts(record.staples,path+'.staples');
    if(record.batches!==undefined)batches(record.batches,path+'.batches');
  }
  function contents(record,path){
    if(!object(record)||!object(record.items))fail(path);
    for(const [key,v] of Object.entries(record.items)){
      fields(v,path+'.items.'+key,['count'],['type','label','src','form','baseKey','cutState']);
      if(typeof v.count!=='number')fail(path+'.items.'+key);
    }
    if(record.transfer!==undefined){
      fields(record.transfer,path+'.transfer',['mix','heat']);
      if(record.transfer.staples!==undefined)amounts(record.transfer.staples,path+'.transfer.staples');
      if(record.transfer.batches!==undefined)batches(record.transfer.batches,path+'.transfer.batches');
    }
  }
  function item(value,path){
    if(!object(value))fail(path);
    for(const key of ['id','instanceId','label','src'])if(typeof value[key]!=='string')fail(path+'.'+key);
    if(!value.id)fail(path+'.id');
    imageSource(value.src,path+'.src');
    for(const key of ['baseW','baseH','cx','by','vis','angle','tilt','zBase']){
      if(typeof value[key]!=='number'||!Number.isFinite(value[key])||Math.abs(value[key])>1e7)fail(path+'.'+key);
    }
    if(value.baseW<=0||value.baseH<=0||value.vis<=0)fail(path);
    if(!object(value.data))fail(path+'.data');
    for(const [key,v] of Object.entries(value.data)){
      if(!/^[a-zA-Z][a-zA-Z0-9]*$/.test(key)||typeof v!=='string')fail(path+'.data');
      if(['panContents','panIngredientMeta','containerContents','grinderQueue'].includes(key)){
        let parsed;try{parsed=JSON.parse(v);}catch(_){fail(path+'.data.'+key);}
        tree(parsed,path+'.data.'+key);
        const p=path+'.data.'+key;
        if(key==='panContents')cooking(parsed,p);
        if(key==='containerContents')contents(parsed,p);
        if(key==='panIngredientMeta'){
          if(!object(parsed))fail(p);
          for(const [k,record] of Object.entries(parsed))fields(record,p+'.'+k,[],['key','baseKey','type','form','cutState','label','src']);
        }
        if(key==='grinderQueue'&&(!Array.isArray(parsed)||!parsed.every(v=>typeof v==='string')))fail(p);
      }
    }
  }
  function validate(data){
    if(!object(data)||data.saveVersion!==1)throw new Error('Nepodržana verzija sačuvane igre (podržana je verzija 1).');
    tree(data);
    if(typeof data.savedAt!=='string'||!Number.isFinite(Date.parse(data.savedAt)))fail('savedAt');
    const d=window.CooksterStateDefaults;
    for(const key of ['player','kitchen','stove','market','garden','progression']){
      // burnTimer is a runtime-only field, never part of a snapshot.
      const templates={
        stove:{fireOn:false,fireboxOpen:false,ovenOpen:false,fireLevel:0,burnEndsAt:0},
        kitchen:{faucetOn:false},
        progression:{unlockedRecipes:[],kitchenEquipment:[]}
      };
      const template=templates[key]||d[key];
      shape(data[key],template,key);
    }
    if(data.kitchen.sinkProduce!==undefined){
      if(!Array.isArray(data.kitchen.sinkProduce))fail('kitchen.sinkProduce');
      data.kitchen.sinkProduce.forEach((v,i)=>fields(v,'kitchen.sinkProduce.'+i,
        ['count','washProgress'],['id','key','baseKey','type','label','src','form','cutState']));
    }
    if(data.progression.activeRecipe!==undefined&&data.progression.activeRecipe!==null&&typeof data.progression.activeRecipe!=='string')fail('progression.activeRecipe');
    if(!Number.isInteger(data.player.day)||data.player.day<1||data.player.money<0)fail('player');
    for(const key of ['unlockedRecipes','kitchenEquipment']){
      if(!data.progression[key].every(v=>typeof v==='string'))fail('progression.'+key);
    }
    for(const [key,v] of Object.entries(data.market.basket))fields(v,'market.basket.'+key,['count','spent','totalKg','totalBunches'],['label']);
    if(!Object.values(data.market.refusedDayByProduct).every(v=>typeof v==='number'&&v>=0))fail('market.refusedDayByProduct');
    for(const key of ['tomatoPlots','cucumberPlots']){
      if(!Object.values(data.garden[key]).every(object))fail('garden.'+key);
    }
    for(const key of ['crates'])if(!data.garden[key].every(object))fail('garden.'+key);
    data.market.pendingBags.forEach((v,i)=>fields(v,'market.pendingBags.'+i,
      ['count','quantityKg','quantityValue','quantityBunches'],['id','productKey','label','quantityMode']));
    if(data.creator!==undefined)shape(data.creator,d.creator,'creator');
    for(const key of ['choppedCalibration','vesselDepthCalibration'])if(data[key]!==undefined&&!object(data[key]))fail(key);
    if(!object(data.world)||![1,2,3,4].includes(data.world.version)||!Array.isArray(data.world.items))fail('world');
    data.world.items.forEach((v,i)=>item(v,'world.items.'+i));
    if(data.world.backpack!==undefined){
      if(!Array.isArray(data.world.backpack)||data.world.backpack.length>100)fail('world.backpack');
      data.world.backpack.forEach((v,i)=>{if(v!==null)item(v,'world.backpack.'+i);});
    }
    return data;
  }
  function parse(text){
    if(typeof text!=='string'||new Blob([text]).size>MAX_BYTES)throw new Error('Fajl je prevelik (najviše 10 MB).');
    let data;try{data=JSON.parse(text);}catch(_){throw new Error('Fajl nije ispravan JSON.');}
    return validate(data);
  }
  window.CooksterSaveFile={MAX_BYTES,validate,parse};
})();