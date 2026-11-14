/* RANAC: šest džepova dole. Na početku igre je prazan. Predmet ulazi samo dugmetom "Stavi u ranac" (prozor Kuhinjski elementi) i staje na PRVO mesto (ostali se pomere udesno,
   ako je pun, poslednji ispada). Ništa se više ne dodaje samo od sebe kad se nešto uzme. Desni klik na džep: "Skloni iz ranca".
   Klik na džep uvek pravi novu kopiju tog predmeta u ruci (osim stvari koje postoje samo jednom: zvonce, šiljak, rail, kanta, bure, mlin, začini), pa ne mora da se ulazi u Kuhinjske elemente. */
(function(){
  'use strict';
  const KEY='cookster.rack.v2';let MAX=6;   // MAX = number of slots (3 at the start of the game later, then 6)
  // Every thing has its OWN place (slot) and keeps it: a taken thing leaves an EMPTY slot, the others do not move; a thing put back can go into that empty slot again.
  let recent=[];
  try{const r=JSON.parse(localStorage.getItem(KEY));if(Array.isArray(r))recent=r.slice(0,6).map(x=>typeof x==='string'?x:null);}catch(_){}
  while(recent.length<6)recent.push(null);
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(recent));}catch(_){}};
  const defOf=id=>{try{return kitchenEquipmentDef(id);}catch(_){return null;}};
  const firstEmpty=()=>{for(let i=0;i<MAX;i++)if(!recent[i])return i;return -1;};
  const count=()=>recent.slice(0,MAX).filter(Boolean).length;
  function push(id){
    if(!id||!defOf(id))return;
    if(recent.includes(id))return;
    let at=firstEmpty();if(at<0)at=MAX-1;      // full: the last pocket is replaced
    recent[at]=id;save();render(true);
  }
  // put: id goes to the slot i (if that pocket is taken, to the first empty one); move: a thing from the slot a to the slot b (if b is taken, they swap places)
  function put(id,i){
    if(!id||!defOf(id))return false;
    const old=recent.indexOf(id);if(old>=0)recent[old]=null;
    let at=Math.max(0,Math.min(MAX-1,i|0));
    if(recent[at]){const e=firstEmpty();if(e<0){if(old>=0)recent[old]=id;return false;}at=e;}
    recent[at]=id;save();render(true);return true;
  }
  function move(a,b){
    if(a<0||a>=MAX||b<0||b>=MAX||a===b||!recent[a])return;
    const t=recent[b];recent[b]=recent[a];recent[a]=t||null;save();render(true);
  }
  function remove(i){if(i<0||i>=MAX||!recent[i])return;recent[i]=null;save();render(true);}
  function setSlots(n){MAX=Math.max(1,Math.min(6,n|0));for(let i=MAX;i<6;i++)recent[i]=null;save();render(true);}
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
    const sig=recent.map(x=>x||'').join('|');
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
      if(popSlot===i){popSlot=-1;try{img.animate([{transform:'translate(-50%,-50%)',opacity:0},{transform:'translate(-50%,-50%)',opacity:1}],{duration:90,delay:250,easing:'linear',fill:'both'});}catch(_){}}
      b.removeAttribute('title');b.setAttribute('aria-label','Ranac: '+(def.label||def.id));
    });
  }
  // zuti sjaj: ide na dugme koje je kliknuto, dok ta stvar stoji u ruci; kad se spusti, nestaje
  let glowSlot=-1,glowAt=0;
  function clearGlow(){document.querySelectorAll('.cookster-slot-glow').forEach(g=>g.remove());glowSlot=-1;}
  // ---- animations: a thing flies from its pocket to the hand (take) and from the hand into the pocket (put back); the pocket picture pops in when something arrives
  const artOf=id=>{const d=defOf(id);return (window.CooksterItemArt&&CooksterItemArt[id])||(d&&d.src)||'';};
  let popSlot=-1;
  function fly(id,from,to,opts){
    try{
      if(!id||!from||!to||typeof document==='undefined')return;
      const sz=Math.max(40,Math.min(90,from.size||60));
      const im=document.createElement('img');im.src=artOf(id);im.alt='';im.draggable=false;
      im.style.cssText='position:fixed;left:'+(-sz/2)+'px;top:'+(-sz/2)+'px;width:'+sz+'px;height:'+sz+'px;object-fit:contain;pointer-events:none;z-index:99998;will-change:transform,opacity;filter:drop-shadow(2px 4px 4px rgba(25,12,3,.45))';
      document.body.appendChild(im);
      const g=window.gsap,dx=to.x-from.x,dy=to.y-from.y,lift=-Math.min(70,Math.hypot(dx,dy)*.22),end=()=>{im.remove();if(opts.done)opts.done();};
      setTimeout(()=>im.remove(),opts.ms+600);
      if(g){
        // GSAP: the picture goes along an arc (a quick lift in the middle) while it grows / shrinks and fades
        g.set(im,{x:from.x,y:from.y,scale:opts.s0,opacity:opts.o0});
        const d=opts.ms/1000;
        g.to(im,{x:to.x,duration:d,ease:'power2.out'});
        g.to(im,{y:from.y+dy*.5+lift,duration:d*.5,ease:'power2.out'});
        g.to(im,{y:to.y,duration:d*.5,delay:d*.5,ease:'power2.in'});
        g.to(im,{scale:opts.s1,opacity:opts.o1,duration:d,ease:'power2.out',onComplete:end});
        return;
      }
      const a=im.animate([
        {transform:'translate('+from.x+'px,'+from.y+'px) scale('+opts.s0+')',opacity:opts.o0},
        {transform:'translate('+(from.x+dx*.55)+'px,'+(from.y+dy*.55+lift)+'px) scale('+((opts.s0+opts.s1)/2*1.12)+')',opacity:1,offset:.55},
        {transform:'translate('+to.x+'px,'+to.y+'px) scale('+opts.s1+')',opacity:opts.o1}
      ],{duration:opts.ms,easing:'cubic-bezier(.25,.8,.3,1)',fill:'forwards'});
      a.onfinish=end;a.oncancel=()=>im.remove();
    }catch(_){}
  }
  function slotCenter(i){const b=buttons()[i];if(!b)return null;const r=b.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,size:Math.min(r.width,r.height)*.95};}
  function mousePt(sz){try{return {x:mouse.x,y:mouse.y,size:sz};}catch(_){return null;}}
  function setGlow(slot){
    clearGlow();return;      // no golden glow any more (the thing leaves the pocket with an animation instead)
    const b=buttons()[slot];if(!b)return;
    const g=document.createElement('img');
    g.className='cookster-slot-glow';g.src='assets/ui/custom_elements/osvetljeni_kvadratni_panel.png';g.alt='';g.draggable=false;
    g.style.cssText='position:absolute;left:-13%;top:-28%;width:126%;height:157%;z-index:0;pointer-events:none;object-fit:contain';
    b.prepend(g);glowSlot=slot;glowAt=performance.now();
  }
  // The rack is a STOCK, not a copier: a thing that is taken from a pocket leaves the rack (it is on the table now, or in the hand); a thing that is put back (a click on a pocket with the
  // thing in the hand) goes into that pocket again. A thing that is in the rack (or lies on the table) cannot be made a second time from the window "Kuhinjski elementi".
  // (Later the player will be able to get / buy more of the same thing, for example three pots: then a pocket holds a number.)
  const UNIQUE=/^(siljak_narudzbine|zvonce_konobar|ticket_rail|kanta_set_zatvorena|mlin_za_mes.|kaca_.*|zacin_.*)$/;
  function activate(slot){
    // something is in the hand: a click on a pocket puts it BACK into the rack (into that pocket)
    if(typeof holding!=='undefined'&&holding){
      const h=holding,hid=h.dataset&&h.dataset.itemId,hdef=hid&&defOf(hid);
      let hasFood=false;try{hasFood=Object.keys((window.CooksterPan&&CooksterPan.read&&CooksterPan.read(h)||{}).ingredients||{}).length>0;}catch(_){}
      if(!hdef||UNIQUE.test(hid)||hasFood||!window.CooksterReturnHeld){try{showToast(hasFood?'U njemu ima hrane: prvo ga spusti na sto.':'Ovo ne može u ranac: spusti ga na sto.');}catch(_){}return true;}
      if(!recent.includes(hid)&&firstEmpty()<0){try{showToast('Ranac je pun.');}catch(_){}return true;}
      const from=mousePt(60),at=(slot<MAX&&!recent[slot])?slot:firstEmpty(),sc1=slotCenter(at);
      window.CooksterReturnHeld();
      popSlot=at;      // set BEFORE put(): the new icon is drawn already hidden and appears only when the flying picture arrives (before, the copy showed at once and popped again at the next change)
      if(!put(hid,at)){popSlot=-1;return true;}
      if(from&&sc1)fly(hid,from,sc1,{s0:1.4,s1:.8,o0:.9,o1:.9,ms:260});
      try{showToast((hdef.label||hid)+' je u rancu.');}catch(_){}
      return true;
    }
    const id=recent[slot],def=id&&defOf(id);
    if(!def)return false;
    const sc0=slotCenter(slot);
    // the things that exist once (the bell, the spike, the rail, the bin, the barrel, the mill, the spices) are taken from where they are
    const there=UNIQUE.test(id)?(window.items||items).find(el=>el.dataset.itemId===id&&el!==holding):null;
    if(there){try{startHolding(there);}catch(_){}if(sc0)fly(id,sc0,mousePt(sc0.size),{s0:.9,s1:1.45,o0:1,o1:0,ms:300});recent[slot]=null;save();render(true);setGlow(Math.min(slot,MAX-1));return true;}
    const el=makeItem({...def,instanceId:nextItemInstanceId(id),x:700-def.w/2,y:560-def.h,z:++zCounter});
    if(!el)return false;
    el.dataset.surfaceZone='table';
    setPose(el,700,560,surfaceScaleFor(el,'table',560));
    // the new copy stands at (700,560) on the table: it must never be shown, only the copy that follows the mouse (that is the flash that was seen)
    el.dataset.noFlash='1';el.style.visibility='hidden';setTimeout(()=>{delete el.dataset.noFlash;},1500);
    startHolding(el);
    if(sc0)fly(id,sc0,mousePt(sc0.size),{s0:.9,s1:1.45,o0:1,o1:0,ms:300});      // the picture flies from the pocket to the hand and melts into the thing that follows the mouse
    recent[slot]=null;save();render(true);setGlow(Math.min(slot,MAX-1));      // the thing leaves the rack (it is in the hand)
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
  window.CooksterRecentItems={activate,push,put,move,remove,menu:(i,x,y)=>{if(recent[i])openMenu(i,x,y);},setSlots,has:id=>recent.includes(id),get:()=>recent.slice()};
})();
