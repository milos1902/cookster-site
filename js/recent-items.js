/* RANAC: šest džepova dole. Na početku igre je prazan. Predmet ulazi samo dugmetom "Stavi u ranac" (prozor Kuhinjski elementi) i staje na PRVO mesto (ostali se pomere udesno,
   ako je pun, poslednji ispada). Ništa se više ne dodaje samo od sebe kad se nešto uzme. Desni klik na džep: "Skloni iz ranca".
   Klik na džep uvek pravi novu kopiju tog predmeta u ruci (osim stvari koje postoje samo jednom: zvonce, šiljak, rail, kanta, bure, mlin, začini), pa ne mora da se ulazi u Kuhinjske elemente. */
(function(){
  'use strict';
  const KEY='cookster.rack.v2';let MAX=6;   // MAX = number of slots (3 at the start of the game later, then 6)
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
  // put: id goes to the slot i (the others move aside; the last one drops out when the rack is full); move: a thing from the slot a to the slot b
  function put(id,i){
    if(!id||!defOf(id))return false;
    const rest=recent.filter(x=>x!==id),at=Math.max(0,Math.min(rest.length,i|0));
    rest.splice(at,0,id);recent=rest.slice(0,MAX);save();render(true);return true;
  }
  function move(a,b){
    if(a<0||a>=recent.length||b<0||a===b)return;
    const id=recent[a];recent.splice(a,1);recent.splice(Math.min(b,recent.length),0,id);recent=recent.slice(0,MAX);save();render(true);
  }
  function remove(i){if(i<0||i>=recent.length)return;recent.splice(i,1);save();render(true);}
  function setSlots(n){MAX=Math.max(1,Math.min(6,n|0));recent=recent.slice(0,MAX);save();render(true);}
  let menu=null;
  function closeMenu(){if(menu){menu.remove();menu=null;}}
  function openMenu(i,x,y){
    closeMenu();
    menu=document.createElement('div');menu.setAttribute('data-tool-ui','1');
    menu.style.cssText='position:fixed;z-index:70000;left:'+x+'px;top:'+y+'px;padding:8px 14px;border:2px solid #8a5a30;border-radius:10px;background:#f4e4bf;color:#4a2a14;font:700 14px Georgia,serif;cursor:pointer;box-shadow:1px 3px 6px rgba(25,12,3,.45)';
    menu.textContent='Skloni iz ranca';
    menu.addEventListener('click',e=>{e.stopPropagation();remove(i);closeMenu();});
    menu.addEventListener('contextmenu',e=>{e.preventDefault();e.stopPropagation();});
    document.body.appendChild(menu);
  }
  document.addEventListener('pointerdown',e=>{if(menu&&!menu.contains(e.target))closeMenu();},true);
  window.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
  function bindMenu(b,i){
    if(b.dataset.rackMenu)return;b.dataset.rackMenu='1';
    b.addEventListener('contextmenu',e=>{e.preventDefault();e.stopPropagation();if(recent[i])openMenu(i,e.clientX,e.clientY);});
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
      bindMenu(b,i);
      b.style.display=i<MAX?'':'none';
      b.querySelector('.cookster-recent-icon')?.remove();
      const def=recent[i]&&defOf(recent[i]);
      if(!def){b.removeAttribute('title');b.setAttribute('aria-label','Ranac: prazno mesto');return;}
      const img=document.createElement('img');
      img.className='cookster-recent-icon';img.src=(window.CooksterItemArt&&CooksterItemArt[def.id])||def.src;img.alt='';img.draggable=false;
      img.setAttribute('aria-hidden','true');
      b.appendChild(img);
      b.removeAttribute('title');b.setAttribute('aria-label','Ranac: '+(def.label||def.id));
    });
  }
  // zuti sjaj: ide na dugme koje je kliknuto, dok ta stvar stoji u ruci; kad se spusti, nestaje
  let glowSlot=-1,glowAt=0;
  function clearGlow(){document.querySelectorAll('.cookster-slot-glow').forEach(g=>g.remove());glowSlot=-1;}
  function setGlow(slot){
    clearGlow();
    const b=buttons()[slot];if(!b)return;
    const g=document.createElement('img');
    g.className='cookster-slot-glow';g.src='assets/ui/custom_elements/osvetljeni_kvadratni_panel.png';g.alt='';g.draggable=false;
    g.style.cssText='position:absolute;left:-13%;top:-28%;width:126%;height:157%;z-index:0;pointer-events:none;object-fit:contain';
    b.prepend(g);glowSlot=slot;glowAt=performance.now();
  }
  function activate(slot){
    const id=recent[slot],def=id&&defOf(id);
    if(!def)return false;
    // a click always makes a NEW copy (two bowls, three glasses...); only the things that exist once (the bell, the spike, the rail, the bin, the barrel, the mill, the spices) are taken from where they are
    const UNIQUE=/^(siljak_narudzbine|zvonce_konobar|ticket_rail|kanta_set_zatvorena|mlin_za_mes.|kaca_.*|zacin_.*)$/;
    // something is in the hand: a click on a square puts it BACK (it is a copy that came from a square); if the clicked square holds another thing, that one is taken next
    if(typeof holding!=='undefined'&&holding){
      const h=holding,hid=h.dataset&&h.dataset.itemId,hdef=hid&&defOf(hid);
      let hasFood=false;try{hasFood=Object.keys((window.CooksterPan&&CooksterPan.read&&CooksterPan.read(h)||{}).ingredients||{}).length>0;}catch(_){}
      if(!hdef||UNIQUE.test(hid)||hasFood||!window.CooksterReturnHeld){try{showToast(hasFood?'U njemu ima hrane: prvo ga spusti na sto.':'Ovo ne može da se vrati u kvadratić: spusti ga na sto.');}catch(_){}return true;}
      window.CooksterReturnHeld();
      try{showToast((hdef.label||hid)+' je vraćen u kvadratić.');}catch(_){}
      if(hid===id)return true;
    }
    const there=UNIQUE.test(id)?(window.items||items).find(el=>el.dataset.itemId===id&&el!==holding):null;
    if(there){try{startHolding(there);}catch(_){}setGlow(slot);return true;}
    const el=makeItem({...def,instanceId:nextItemInstanceId(id),x:700-def.w/2,y:560-def.h,z:++zCounter});
    if(!el)return false;
    el.dataset.surfaceZone='table';
    setPose(el,700,560,surfaceScaleFor(el,'table',560));
    // the new copy stands at (700,560) on the table: it must never be shown, only the copy that follows the mouse (that is the flash that was seen)
    el.dataset.noFlash='1';el.style.visibility='hidden';setTimeout(()=>{delete el.dataset.noFlash;},1500);
    startHolding(el);setGlow(slot);
    try{CooksterSave.schedule();}catch(_){}
    return true;
  }
  let lastHeld=null;
  function tick(){
    requestAnimationFrame(tick);
    const h=(typeof holding!=='undefined')?holding:null;
    lastHeld=h;
    if(glowSlot>=0&&!h&&performance.now()-glowAt>300)clearGlow();
    render(false);
  }
  requestAnimationFrame(tick);
  window.CooksterRecentItems={activate,push,put,move,remove,menu:(i,x,y)=>{if(recent[i])openMenu(i,x,y);},setSlots,get:()=>recent.slice()};
})();
