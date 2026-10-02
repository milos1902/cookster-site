/* Cookster v196 - sandbox recipe matching + batch-aware evaluation. */
(function(){
  function stars(n){ n=Math.max(0,Math.min(5,Math.round(n))); return '★'.repeat(n)+'☆'.repeat(5-n); }
  function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }

  function ingredientStatus(count,spec){
    const min=Math.max(0,+spec.min||0);
    const ideal=Math.max(min,+spec.ideal||min);
    const max=Math.max(ideal,+spec.max||ideal);
    count=Math.max(0,+count||0);

    let status='ideal',score=1;
    if(count===0){status='missing';score=0;}
    else if(count<min){status='too_low';score=min>0?clamp((count/min)*.65,0,.65):.65;}
    else if(count<ideal){status='acceptable_low';score=.80+.20*((count-min)/Math.max(1e-6,ideal-min));}
    else if(count===ideal){status='ideal';score=1;}
    else if(count<=max){status='acceptable_high';score=1-.20*((count-ideal)/Math.max(1e-6,max-ideal));}
    else{
      const excess=count-max;
      status=excess>=Math.max(2,ideal*.75)?'far_too_high':'too_high';
      score=clamp(.65-.65*(excess/Math.max(1,max)),0,.65);
    }
    return {count,min,ideal,max,weight:+spec.weight||1,status,score};
  }

  function evaluateIngredients(counts,recipe){
    const details={};
    let weighted=0,totalWeight=0;
    for(const [key,rawSpec] of Object.entries(recipe.ingredients||{})){
      const spec=(typeof rawSpec==='number')?{min:rawSpec,ideal:rawSpec,max:rawSpec,weight:1}:rawSpec;
      const d=ingredientStatus(counts[key]||0,spec||{});
      details[key]=d;weighted+=d.score*d.weight;totalWeight+=d.weight;
    }
    return {details,score:totalWeight?weighted/totalWeight:1};
  }

  function canonicalCounts(model){
    if(window.CooksterPan?.aggregateByBase)return CooksterPan.aggregateByBase(model);
    return {...(model?.ingredients||{})};
  }

  function batchCookingScore(model,ideal=[.85,1]){
    const batches=Array.isArray(model?.batches)?model.batches:[];
    if(!batches.length){
      const d=+model?.doneness||0;
      if(model?.burnt)return 0;
      if(d>=ideal[0]&&d<=ideal[1])return 1;
      if(d<ideal[0])return clamp(d/Math.max(.01,ideal[0]),0,1);
      return clamp(1-(d-ideal[1])/.25,0,1);
    }
    let sum=0,total=0;
    for(const b of batches){
      const count=Math.max(0,+b.count||0);if(!count)continue;
      const d=Math.max(0,+b.doneness||0);
      let score=0;
      if(!b.burnt){
        if(d>=ideal[0]&&d<=ideal[1])score=1;
        else if(d<ideal[0])score=clamp(d/Math.max(.01,ideal[0]),0,1);
        else score=clamp(1-(d-ideal[1])/.25,0,1);
      }
      sum+=score*count;total+=count;
    }
    return total?sum/total:0;
  }

  function recipeMatch(counts,recipe){
    const required=Object.keys(recipe?.ingredients||{});
    if(!required.length)return {score:0,coverage:0,extraRatio:1};
    const present=Object.entries(counts).filter(([,v])=>(+v||0)>0);
    const presentTotal=present.reduce((s,[,v])=>s+(+v||0),0);
    const requiredPresent=required.filter(k=>(+counts[k]||0)>0).length;
    const coverage=requiredPresent/required.length;
    const extra=present.filter(([k])=>!required.includes(k)).reduce((s,[,v])=>s+(+v||0),0);
    const extraRatio=presentTotal?extra/presentTotal:0;
    const balance=evaluateIngredients(counts,recipe).score;
    const score=clamp(coverage*.55+balance*.35+(1-extraRatio)*.10,0,1);
    return {score,coverage,extraRatio,balance};
  }

  function processPreparationScore(rawCounts,recipe,model=null){
    if(recipe?.id==='ajvar'){
      const required={
        paprika:'paprika_pecena_oljustena_mlevena',
        patlidzan:'patlidzan_pecen_oljusten_mleveno',
        beli_luk:'beli_luk_mleveno'
      };
      let total=0,prepared=0;
      for(const [base,correct] of Object.entries(required)){
        for(const [key,count] of Object.entries(rawCounts||{})){
          if(CooksterPan.baseIngredientKey(key)!==base)continue;
          total+=(+count||0);
          if(key===correct)prepared+=(+count||0);
        }
      }
      const purity=total?clamp(prepared/total,0,1):0;
      return clamp(purity*.75+Math.min(1,(+model?.mix||0)/.65)*.25,0,1);
    }
    const expected=new Set(recipe?.expectedProcesses||[]);
    if(!expected.has('slice'))return 1;
    const required=Object.keys(recipe?.ingredients||{});
    let total=0,sliced=0;
    for(const key of required){
      const baseTotal=Object.entries(rawCounts||{}).reduce((sum,[rawKey,count])=>
        sum+(CooksterPan.baseIngredientKey(rawKey)===key?(+count||0):0),0);
      total+=baseTotal;
      // In the canonical container model, the bare vegetable key means it was
      // explicitly sliced. Whole/roasted variants retain suffixed identities.
      sliced+=Math.min(baseTotal,+rawCounts?.[key]||0);
    }
    return total?clamp(sliced/total,0,1):0;
  }

  // Recipe rules live in the catalog; this evaluator is shared by every recipe.
  // Provenance is stored in ingredient keys, so grinding a raw pepper cannot
  // satisfy a later roast/peel step.
  function recipeProgress(pan,recipe,world=null){
    if(!recipe||!window.CooksterPan)return null;
    const model=pan?CooksterPan.read(pan):CooksterPan.empty();
    const raw=model.ingredients||{},staples=model.staples||{};
    const specs=recipe.ingredients||{};
    const forms=(recipe.steps||[]).find(s=>s.kind==='prepared')?.forms||{};
    const queue=world?.queue||{};
    const loose=world?.loose||{};
    const label=key=>window.CooksterCatalog?.VEGETABLES?.[key]?.label||key;
    const required=key=>Math.max(0,+specs[key]?.min||0);
    const stages=(recipe.steps||[]).map(rule=>{
      let fraction=0,detail='',invalid=false;
      if(rule.kind==='roast'||rule.kind==='peel'){
        const keys=rule.ingredients||Object.keys(specs);
        const parts=keys.map(key=>{
          const target=required(key);
          const available=(+loose[key]?.[rule.kind]||0)+(+queue[forms[key]]||0)+(+raw[forms[key]]||0);
          return {key,target,available};
        });
        fraction=parts.length?parts.reduce((sum,p)=>sum+clamp(p.available/Math.max(.01,p.target),0,1),0)/parts.length:0;
        detail=parts.map(p=>`${label(p.key)} ${Math.min(p.available,p.target).toFixed(1)}/${p.target}`).join(' · ');
      }else if(rule.kind==='prepared'){
        const parts=Object.entries(rule.forms||{}).map(([base,key])=>({
          base,key,target:required(base),amount:+raw[key]||0
        }));
        fraction=parts.length?parts.reduce((sum,p)=>sum+clamp(p.amount/Math.max(.01,p.target),0,1),0)/parts.length:0;
        const wrong=Object.entries(raw).filter(([key,n])=>(+n||0)>0&&
          (forms[CooksterPan.baseIngredientKey(key)]!==key||
            !Object.hasOwn(forms,CooksterPan.baseIngredientKey(key))));
        invalid=wrong.length>0;
        detail=invalid
          ?`Pogrešno pripremljeno ili dodatno: ${wrong.map(([key])=>label(CooksterPan.baseIngredientKey(key))).join(', ')}. Ukloni to iz šerpe.`
          :parts.map(p=>`${label(p.base)} ${Math.min(p.amount,p.target).toFixed(1)}/${p.target}`).join(' · ');
      }else if(rule.kind==='proportions'){
        const portions=Object.entries(specs).map(([key,spec])=>{
          const amount=Object.entries(raw).reduce((n,[rawKey,count])=>
            n+(CooksterPan.baseIngredientKey(rawKey)===key?(+count||0):0),0);
          return {key,amount,min:+spec.min||0,max:+spec.max||Infinity};
        });
        const excessive=portions.filter(p=>p.amount>p.max+1e-6);
        invalid=excessive.length>0;
        fraction=portions.length?portions.reduce((n,p)=>n+clamp(p.amount/Math.max(.01,p.min),0,1),0)/portions.length:0;
        detail=invalid?`Previše: ${excessive.map(p=>`${label(p.key)} ${p.amount.toFixed(1)} (najviše ${p.max})`).join(' · ')}`:
          portions.map(p=>`${label(p.key)} ${p.amount.toFixed(1)} (${p.min}–${p.max})`).join(' · ');
      }else if(rule.kind==='season'){
        const entries=Object.entries(recipe.staples||{});
        fraction=entries.length?entries.reduce((sum,[key,n])=>sum+clamp((+staples[key]||0)/Math.max(.01,+n||0),0,1),0)/entries.length:1;
        detail=entries.map(([key,n])=>`${key==='oil'?'Ulje':key==='salt'?'So':key} ${Math.min(+staples[key]||0,+n||0)}/${n}`).join(' · ');
      }else if(rule.kind==='stir'){
        fraction=clamp((+model.mix||0)/Math.max(.01,+rule.minimum||.65),0,1);
        detail=`Mešanje ${Math.round((+model.mix||0)*100)}% / ${Math.round((+rule.minimum||.65)*100)}%`;
      }else if(rule.kind==='cook'){
        const batches=(model.batches||[]).filter(b=>(+b.count||0)>0);
        const min=Math.max(.01,+rule.minimum||.8);
        fraction=batches.length?batches.reduce((sum,b)=>sum+clamp((+b.doneness||0)/min,0,1)*(+b.count||0),0)/
          batches.reduce((sum,b)=>sum+(+b.count||0),0):0;
        invalid=!!model.burnt||batches.some(b=>b.burnt||(+b.doneness||0)>1.02);
        // All batches must be cooked: an average must not mask freshly added raw food.
        const allCooked=batches.length>0&&batches.every(b=>(+b.doneness||0)>=min);
        if(!allCooked)fraction=Math.min(fraction,.99);
        detail=invalid?'Jelo je zagorelo — neće biti originalni recept.':
          `Najmanje pečen deo ${Math.round((batches.length?Math.min(1,...batches.map(b=>+b.doneness||0)):0)*100)}% / ${Math.round(min*100)}%`;
      }
      fraction=clamp(fraction,0,1);
      return {kind:rule.kind,label:rule.label,progress:fraction,done:fraction>=1&&!invalid,invalid,detail};
    });
    const complete=stages.filter(s=>s.done).length;
    return {recipeId:recipe.id,steps:stages,completed:complete,total:stages.length,
      percent:stages.length?Math.round(stages.reduce((n,s)=>n+(s.invalid?0:s.progress),0)/stages.length*100):0,
      ready:stages.length>0&&complete===stages.length,
      next:stages.find(s=>!s.done)||null};
  }

  function findMatchingRecipe(cookware){
    if(!cookware||!window.CooksterPan)return null;
    const model=CooksterPan.read(cookware),counts=canonicalCounts(model);
    const unlocked=new Set(window.CooksterState?.progression?.unlockedRecipes||[]);
    const candidates=Object.values(window.CooksterCatalog?.RECIPES||{}).filter(r=>r.id==='ajvar'||!unlocked.size||unlocked.has(r.id));
    let best=null;
    for(const recipe of candidates){
      if(!recipeProgress(cookware,recipe).ready)continue;
      const match=recipeMatch(counts,recipe);
      if(!best||match.score>best.match.score)best={recipe,match};
    }
    // Sandbox threshold: recipes recognize a dish; they never prevent cooking.
    return best&&best.match.coverage>=.66&&best.match.score>=.52?best:null;
  }

  function scorePan(pan,recipe=null,forceImprovised=false){
    if(!pan||!window.CooksterPan)return null;
    const model=CooksterPan.read(pan);
    const rawCounts={...model.ingredients};
    const counts=canonicalCounts(model);
    const staples={...model.staples};
    const resolved=forceImprovised?null:recipe?{recipe,match:recipeMatch(counts,recipe)}:findMatchingRecipe(pan);
    const activeRecipe=resolved?.recipe||null;

    let ingredientBalance=null,prep=.58;
    if(activeRecipe){
      ingredientBalance=evaluateIngredients(counts,activeRecipe);
      const stapleReq=activeRecipe.staples||{};
      const stapleRatios=Object.entries(stapleReq).map(([k,v])=>v?Math.min(1,(staples[k]||0)/v):1);
      const staplePrep=stapleRatios.length?stapleRatios.reduce((a,b)=>a+b,0)/stapleRatios.length:1;
      const processPrep=processPreparationScore(rawCounts,activeRecipe,model);
      const matchQuality=resolved?.match?.score??1;
      prep=clamp((ingredientBalance.score*.62+staplePrep*.18+processPrep*.20)*(.82+.18*matchQuality),0,1);
    }else{
      const variety=Object.values(counts).filter(v=>(+v||0)>0).length;
      const seasoning=Math.min(1,((+staples.oil||0)+(+staples.salt||0))/2);
      prep=clamp(.42+Math.min(.28,variety*.07)+seasoning*.18,0,1);
    }

    const ideal=activeRecipe?(activeRecipe.idealDoneness||activeRecipe.idealCook||[.85,1]):[.72,.98];
    const cooking=batchCookingScore(model,ideal);
    const hygiene=Math.max(0,1-document.querySelectorAll('.spill-stain').length*.12);
    const taste=clamp(prep*.56+cooking*.44,0,1);
    const total=clamp(taste*.40+prep*.20+cooking*.20+hygiene*.20,0,1);
    const burntBatches=(model.batches||[]).filter(b=>b.burnt).reduce((s,b)=>s+(+b.count||0),0);
    const processQuality=activeRecipe?processPreparationScore(rawCounts,activeRecipe,model):null;

    return {
      recipeId:activeRecipe?.id||'improv',
      name:activeRecipe?.name||'Импровизовано јело',
      recognized:!!activeRecipe,
      matchScore:resolved?.match?.score||0,
      processQuality,
      counts,rawCounts,staples,
      doneness:+model.doneness||0,
      burnt:burntBatches>0,
      burntCount:burntBatches,
      ingredientBalance:ingredientBalance?{
        score:ingredientBalance.score,
        percent:Math.round(ingredientBalance.score*100),
        details:ingredientBalance.details
      }:null,
      scores:{
        taste:Math.round(taste*5),
        preparation:Math.round(prep*5),
        cooking:Math.round(cooking*5),
        hygiene:Math.round(hygiene*5)
      },
      total,stars:Math.round(total*5),
      reward:Math.max(0,Math.round(total*(activeRecipe?500:320)))
    };
  }

  function isHeatableCookware(el){
    if(!el)return false;
    const id=el.dataset.itemId||'';
    const def=(window.CooksterCatalog?.KITCHEN_EQUIPMENT||[]).find(x=>x.id===id);
    return !!def?.cooking?.canHeat;
  }

  function findBestCookware(){
    const vessels=[...document.querySelectorAll('.item')].filter(isHeatableCookware);
    return vessels.sort((a,b)=>CooksterPan.total(b)-CooksterPan.total(a))[0]||null;
  }
  function findBestPan(){return findBestCookware();}

  window.CooksterRecipes={
    scorePan,findBestPan,findBestCookware,findMatchingRecipe,recipeMatch,canonicalCounts,batchCookingScore,processPreparationScore,recipeProgress,
    stars,ingredientStatus,evaluateIngredients
  };
})();
