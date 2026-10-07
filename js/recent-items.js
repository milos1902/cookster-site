/* Zadnje korišćeno: šest kvadratića dole pokazuju poslednje predmete koje je igrač uzeo (najnoviji je prvi).
   Klik na kvadratić vraća taj predmet na sto (ili ga uzima u ruku ako je već u kuhinji), pa ne mora da se ulazi u Kuhinjske elemente. */
(function(){
  'use strict';
  const KEY='cookster.recent-items.v1',MAX=6;
  let recent=[];
  try{const r=JSON.parse(localStorage.getItem(KEY));if(Array.isArray(r))recent=r.filter(x=>typeof x==='string').slice(0,MAX);}catch(_){}
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(recent));}catch(_){}};
  const defOf=id=>{try{return kitchenEquipmentDef(id);}catch(_){return null;}};
  function push(id){
    if(!id||!defOf(id))return;
    if(recent[0]===id)return;
    recent=[id].concat(recent.filter(x=>x!==id)).slice(0,MAX);
    save();render(true);
  }
  function buttons(){
    const b=(window.__COOKSTER_BOTTOM_BUTTONS__&&window.__COOKSTER_BOTTOM_BUTTONS__.buttons)||[];
    return b.filter(x=>x.dataset.group==='center').sort((a,c)=>+a.dataset.slot-+c.dataset.slot);
  }
  let lastSig='';
  function render(force){
    const bs=buttons();if(!bs.length)return;
    const sig=recent.join('|');
    const ok=bs.every((b,i)=>!!b.querySelector('.cookster-recent-icon')===!!recent[i]);
    if(!force&&sig===lastSig&&ok)return;
    lastSig=sig;
    bs.forEach((b,i)=>{
      b.querySelector('.cookster-recent-icon')?.remove();
      const def=recent[i]&&defOf(recent[i]);
      if(!def){b.title='Zadnje korišćeno · prazno';return;}
      const img=document.createElement('img');
      img.className='cookster-recent-icon';img.src=def.src;img.alt='';img.draggable=false;
      img.setAttribute('aria-hidden','true');
      b.appendChild(img);
      b.title='Zadnje korišćeno · '+(def.label||def.id);
      b.setAttribute('aria-label','Zadnje korišćeno: '+(def.label||def.id));
    });
  }
  function activate(slot){
    const id=recent[slot],def=id&&defOf(id);
    if(!def)return false;
    // already in the kitchen: take that one in the hand
    const there=(window.items||items).find(el=>el.dataset.itemId===id&&el!==holding);
    if(typeof holding!=='undefined'&&holding){try{showToast('Prvo spusti ono što držiš.');}catch(_){}return true;}
    if(there){try{startHolding(there);}catch(_){}return true;}
    const el=makeItem({...def,instanceId:nextItemInstanceId(id),x:700-def.w/2,y:560-def.h,z:++zCounter});
    if(!el)return false;
    el.dataset.surfaceZone='table';
    setPose(el,700,560,surfaceScaleFor(el,'table',560));
    try{dropBounce(el);}catch(_){}
    startHolding(el);
    try{CooksterSave.schedule();}catch(_){}
    return true;
  }
  let lastHeld=null;
  function tick(){
    requestAnimationFrame(tick);
    const h=(typeof holding!=='undefined')?holding:null;
    if(h&&h!==lastHeld)push(h.dataset&&h.dataset.itemId);
    lastHeld=h;
    render(false);
  }
  requestAnimationFrame(tick);
  window.CooksterRecentItems={activate,push,get:()=>recent.slice()};
})();
