/* Korpa za otpatke (ranije kanta; id je ostao `kanta_set_zatvorena` zbog Miloševih kalibracija i zvukova).
   Kad se pusti predmet iznad korpe, on naglo upadne i izađe mali oblačić dima. Korpa nema poklopac (nema otvaranja ni zatvaranja):
   slika se menja na svaka 3 ubačena predmeta: prazna → malo smeća → skoro puna → puna (`assets/calibration_props/kanta/korpa_0..3.webp`).
   Kad je puna (9 predmeta) desni klik na nju pokaže „Isprazni kantu": korpa se odmah isprazni (bez animacije; vađenje kese dolazi posle).
   Zvuci (alat „Zvuk"): throw (bacanje), empty (pražnjenje). */
(function(){
  'use strict';
  const ID='kanta_set_zatvorena',DIR='assets/calibration_props/kanta/',PIC=[0,1,2,3].map(i=>DIR+'korpa_'+i+'.webp'),MAX_THROWS=9,STEP=3;
  const isBin=el=>!!el&&el.dataset&&el.dataset.itemId===ID;
  const bins=()=>(window.items||items).filter(isBin);
  const num=(el,k)=>+el.dataset[k]||0;
  const snd=(el,a)=>{try{playImpactSound(el,a);}catch(_){}};
  const hit=(el,x,y,pad)=>{const r=el.getBoundingClientRect();pad=pad||8;return x>=r.left-pad&&x<=r.right+pad&&y>=r.top-pad&&y<=r.bottom+pad;};
  const binAt=(x,y)=>bins().find(b=>b.offsetParent!==null&&hit(b,x,y));
  const bodyOf=b=>b.querySelector('.body');
  PIC.forEach(s=>{const i=new Image();i.src=s;});
  // the picture follows the number of the thrown things (a saved game comes back with the right one too)
  function showLevel(b){
    const lvl=Math.min(PIC.length-1,Math.floor(num(b,'trashN')/STEP)),body=bodyOf(b);
    if(!body||b._lvl===lvl)return;
    b._lvl=lvl;body.src=PIC[lvl];
    const sh=b._contactShadow&&b._contactShadow.querySelector&&b._contactShadow.querySelector('img');if(sh)sh.src=PIC[lvl];
  }
  function smoke(b){
    const r=b.getBoundingClientRect();
    for(let i=0;i<4;i++){
      const d=document.createElement('div'),s=26+Math.random()*22;
      d.style.cssText=`position:fixed;left:${r.left+r.width*(.35+Math.random()*.3)-s/2}px;top:${r.top+r.height*.12}px;width:${s}px;height:${s}px;border-radius:50%;background:radial-gradient(circle,rgba(205,195,180,.85),rgba(150,140,125,0) 70%);pointer-events:none;z-index:20001`;
      document.body.appendChild(d);
      const dx=(Math.random()-.5)*34;
      try{d.animate([{transform:'translate(0,0) scale(.5)',opacity:.9},{transform:`translate(${dx}px,${-r.height*.5}px) scale(1.7)`,opacity:0}],{duration:650+Math.random()*250,easing:'ease-out',delay:i*60,fill:'forwards'});}catch(_){}
      setTimeout(()=>d.remove(),1400);
    }
  }
  function fall(item,b,x,y){
    const body=item.querySelector('.body')||item.querySelector('img');
    const g=document.querySelector('.ghost-item-copy img')||body;
    const src=body&&body.getAttribute('src'),r=g?g.getBoundingClientRect():{width:60,height:60};
    if(!src)return;
    const im=document.createElement('img');im.src=src;
    const w=Math.max(30,r.width),h=Math.max(30,r.height),br=b.getBoundingClientRect();
    im.style.cssText=`position:fixed;left:${x-w/2}px;top:${y-h/2}px;width:${w}px;height:${h}px;object-fit:contain;z-index:20001;pointer-events:none`;
    document.body.appendChild(im);
    const tx=br.left+br.width/2-x,ty=br.top+br.height*.25-y;
    try{im.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${tx}px,${ty}px) scale(.35)`,opacity:.0}],{duration:170,easing:'cubic-bezier(.5,0,1,.6)',fill:'forwards'}).onfinish=()=>im.remove();}catch(_){}
    setTimeout(()=>im.remove(),500);
  }
  function throwIn(item,b,x,y){
    if(num(b,'trashN')>=MAX_THROWS){try{showToast('Korpa je puna. Desni klik na nju: „Isprazni kantu".');}catch(_){}return true;}
    fall(item,b,x,y);
    try{removeItem(item);}catch(_){}
    try{holding=null;hidePlacementGhost();hideOriginGhost();updateHover();}catch(_){}
    b.dataset.trashN=String(num(b,'trashN')+1);
    snd(b,'throw');
    setTimeout(()=>smoke(b),150);
    setTimeout(()=>{showLevel(b);try{b.animate([{transform:'scale(1.04,.95)'},{transform:'scale(1)'}],{duration:140,easing:'ease-out'});}catch(_){}},180);      // the new picture appears when the thing has fallen in
    try{CooksterSave.schedule();}catch(_){}
    return true;
  }
  // a thrown item: wrap the drop of the game
  const origDrop=window.dropHolding;
  if(typeof origDrop==='function'){
    window.dropHolding=function(){
      const it=(typeof holding!=='undefined')?holding:null;
      if(it&&!isBin(it)&&it.dataset&&it.dataset.itemId){
        const b=binAt(mouse.x,mouse.y);
        if(b&&throwIn(it,b,mouse.x,mouse.y))return;
      }
      return origDrop.apply(this,arguments);
    };
  }
  // the picture of every basket matches its number (also after loading a game)
  function tick(){
    requestAnimationFrame(tick);
    for(const b of bins())showLevel(b);
  }
  requestAnimationFrame(tick);
  // right click on the basket: when it is full, "Isprazni kantu" appears under it
  let label=null;
  function hideLabel(){if(label){label.remove();label=null;}}
  function showLabel(b){
    hideLabel();
    const r=b.getBoundingClientRect(),n=num(b,'trashN');
    label=document.createElement('button');label.type='button';
    label.textContent=n>=MAX_THROWS?'Isprazni kantu':'Korpa nije puna ('+n+'/'+MAX_THROWS+')';
    label.style.cssText=`position:fixed;left:${r.left+r.width/2}px;top:${r.bottom+6}px;transform:translateX(-50%);z-index:20002;padding:7px 14px;border:2px solid #351b0d;border-radius:9px;background:#f0c36a;color:#2a1a0e;font:700 14px system-ui,sans-serif;cursor:pointer;box-shadow:0 3px 10px rgba(0,0,0,.4)`;
    ['pointerdown','mousedown','click','contextmenu'].forEach(ev=>label.addEventListener(ev,e=>e.stopPropagation()));
    label.addEventListener('click',()=>{
      if(num(b,'trashN')>=MAX_THROWS){
        b.dataset.trashN='0';showLevel(b);snd(b,'empty');smoke(b);       // emptied at once, without an animation (taking the bag out comes later)
        try{CooksterSave.schedule();}catch(_){}
      }
      hideLabel();
    });
    document.body.appendChild(label);
    setTimeout(()=>{if(label&&n<MAX_THROWS)hideLabel();},1800);
  }
  window.addEventListener('pointerdown',e=>{
    if(label&&!label.contains(e.target))hideLabel();
    if(e.button!==2)return;
    if(typeof holding!=='undefined'&&holding)return;
    const b=binAt(e.clientX,e.clientY);if(!b)return;
    e.preventDefault();e.stopImmediatePropagation();showLabel(b);
  },true);
  window.addEventListener('contextmenu',e=>{if(binAt(e.clientX,e.clientY)&&!(typeof holding!=='undefined'&&holding))e.preventDefault();},true);
  window.CooksterTrashBin={throwIn,MAX_THROWS};
})();
