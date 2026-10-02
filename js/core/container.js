/* Cookster v198.5.21 — universal container contents + transferable thermal state */
(function(){
  let batchSeq=0;
  function empty(){
    return {
      items:{},
      transfer:{
        mix:0,
        heat:0,
        staples:{oil:0,salt:0},
        batches:[]
      }
    };
  }
  function normalizeBatch(raw){
    if(window.CooksterTransferThermal?.normalizeBatch)
      return window.CooksterTransferThermal.normalizeBatch(raw);
    const b=raw&&typeof raw==='object'?raw:{};
    return {
      id:String(b.id||`container_batch_${Date.now()}_${++batchSeq}`),
      key:String(b.key||'ingredient'),
      count:Math.max(0,+b.count||0),
      doneness:Math.max(0,+b.doneness||0),
      overcook:Math.max(0,+b.overcook||0),
      burnt:!!b.burnt,
      state:String(b.state||'raw'),
      cookSpeed:Math.max(.1,+b.cookSpeed||1),
      burnSpeed:Math.max(.1,+b.burnSpeed||1)
    };
  }
  function normalize(raw){
    const out=empty();
    const obj=raw&&typeof raw==='object'?raw:{};
    const src=obj.items&&typeof obj.items==='object'?obj.items:{};
    for(const [key,val] of Object.entries(src)){
      if(!val||typeof val!=='object')continue;
      const count=Math.max(0,+val.count||0); if(count<=0)continue;
      out.items[key]={
        count,
        type:String(val.type||'ingredient'),
        label:String(val.label||key),
        src:String(val.src||''),
        form:String(val.form||''),
        baseKey:String(val.baseKey||''),
        cutState:String(val.cutState||'')
      };
    }

    const t=obj.transfer&&typeof obj.transfer==='object'?obj.transfer:{};
    out.transfer.mix=Math.max(0,Math.min(1,+t.mix||0));
    out.transfer.heat=Math.max(0,+t.heat||0);
    out.transfer.staples={
      oil:Math.max(0,+t.staples?.oil||0),
      salt:Math.max(0,+t.staples?.salt||0)
    };
    out.transfer.batches=(Array.isArray(t.batches)?t.batches:[])
      .map(normalizeBatch)
      .filter(b=>b.count>0);
    return out;
  }
  function read(el){
    if(!el)return empty();
    try{return normalize(el.dataset.containerContents?JSON.parse(el.dataset.containerContents):null)}
    catch(_){return empty()}
  }
  function write(el,model){
    const clean=normalize(model);
    if(el)el.dataset.containerContents=JSON.stringify(clean);
    return clean;
  }
  function add(el,key,meta={},amount=1){
    const model=read(el),k=String(key||'ingredient'),addCount=Math.max(0,+amount||0);
    if(addCount<=0)return model;
    const prev=model.items[k]||{count:0,type:'ingredient',label:k,src:'',form:'',baseKey:'',cutState:''};
    const existed=(+prev.count||0)>0;
    const hadOther=Object.entries(model.items).some(([other,v])=>other!==k&&v?.type!=='staple'&&(+v?.count||0)>0);

    model.items[k]={
      count:(+prev.count||0)+addCount,
      type:String(meta.type||prev.type||'ingredient'),
      label:String(meta.label||prev.label||k),
      src:(window.CooksterPiles&&(window.CooksterPiles.is(meta.src)||window.CooksterPiles.is(prev.src)))
        ?window.CooksterPiles.join(prev.src,meta.src)
        :String(meta.src||prev.src||''),
      form:String(meta.form||prev.form||''),
      baseKey:String(meta.baseKey||prev.baseKey||''),
      cutState:String(meta.cutState||prev.cutState||'')
    };

    if(model.items[k].type==='staple'){
      const stapleKey=k==='ulje'?'oil':k==='so'?'salt':k;
      if(stapleKey==='oil'||stapleKey==='salt')
        model.transfer.staples[stapleKey]=Math.max(0,(+model.transfer.staples[stapleKey]||0)+addCount);
    }else{
      model.transfer.batches.push(normalizeBatch({
        key:k,count:addCount,doneness:0,overcook:0,burnt:false,state:'raw'
      }));
      if(hadOther)model.transfer.mix=0;
      else if(existed)model.transfer.mix=Math.max(0,Math.min(1,model.transfer.mix*.82));
    }
    return write(el,model);
  }
  function total(el){return Object.values(read(el).items).reduce((s,v)=>s+(+v.count||0),0);}
  window.CooksterContainer={empty,normalize,read,write,add,total};
})();
