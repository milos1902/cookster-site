/* Kanta za otpatke (`kanta_set_zatvorena`): kad se bilo koji predmet prinese kanti, ona se otvori (slika `kanta_set_otvorena`).
   Kad se pusti, predmet naglo upadne, iz kante izađe mali oblačić dima i kanta se naglo zatvori.
   Posle 10 bacanja je puna: desni klik na nju pokaže „Isprazni kantu". Zvuci (alat „Zvuk"): open, close, throw (bacanje), empty (pražnjenje). */
(function(){
  'use strict';
  const ID='kanta_set_zatvorena',OPEN_SRC='assets/calibration_props/kanta_set_otvorena.png',MAX_THROWS=10;
  const isBin=el=>!!el&&el.dataset&&el.dataset.itemId===ID;
  const bins=()=>(window.items||items).filter(isBin);
  const num=(el,k)=>+el.dataset[k]||0;
  const snd=(el,a)=>{try{playImpactSound(el,a);}catch(_){}};
  const hit=(el,x,y,pad)=>{const r=el.getBoundingClientRect();pad=pad||8;return x>=r.left-pad&&x<=r.right+pad&&y>=r.top-pad&&y<=r.bottom+pad;};
  const binAt=(x,y)=>bins().find(b=>b.offsetParent!==null&&hit(b,x,y));
  const bodyOf=b=>b.querySelector('.body');
  function setOpen(b,open){
    const body=bodyOf(b);if(!body)return;
    if(!b._closedSrc)b._closedSrc=body.getAttribute('src');
    if(!!b._open===open)return;
    b._open=open;
    if(open){
      body.src=OPEN_SRC;                       // the open picture is taller (the lid is up): it grows upward from the bottom of the bin
      Object.assign(body.style,{height:'114.7%',width:'95%',top:'auto',bottom:'0',left:'2.5%'});
      snd(b,'open');
    }else{
      body.src=b._closedSrc;
      ['height','width','top','bottom','left'].forEach(k=>body.style[k]='');
      snd(b,'close');
      try{b.animate([{transform:'scale(1.05,.94)'},{transform:'scale(1)'}],{duration:140,easing:'ease-out'});}catch(_){}
    }
  }
  function smoke(b){
    const r=b.getBoundingClientRect();
    for(let i=0;i<4;i++){
      const d=document.createElement('div'),s=26+Math.random()*22;
      d.style.cssText=`position:fixed;left:${r.left+r.width*(.35+Math.random()*.3)-s/2}px;top:${r.top+r.height*.12}px;width:${s}px;height:${s}px;border-radius:50%;background:radial-gradient(circle,rgba(220,214,204,.85),rgba(160,152,144,.0) 70%);z-index:20000;pointer-events:none`;
      document.body.appendChild(d);
      const dx=(Math.random()-.5)*34;
      try{d.animate([{transform:'translate(0,0) scale(.5)',opacity:.9},{transform:`translate(${dx}px,${-r.height*.5}px) scale(1.7)`,opacity:0}],{duration:650+Math.random()*250,easing:'ease-out',delay:i*45,fill:'forwards'}).onfinish=()=>d.remove();}catch(_){}
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
    if(num(b,'trashN')>=MAX_THROWS){try{showToast('Kanta je puna. Desni klik na nju: „Isprazni kantu".');}catch(_){}return true;}
    setOpen(b,true);
    fall(item,b,x,y);
    try{removeItem(item);}catch(_){}
    try{holding=null;hidePlacementGhost();hideOriginGhost();updateHover();}catch(_){}
    b.dataset.trashN=String(num(b,'trashN')+1);
    snd(b,'throw');
    setTimeout(()=>smoke(b),150);
    setTimeout(()=>{b._keepOpen=false;setOpen(b,false);},380);
    b._keepOpen=true;
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
  // the bin opens while something is held over it
  function tick(){
    requestAnimationFrame(tick);
    const it=(typeof holding!=='undefined')?holding:null;
    for(const b of bins()){
      if(b._keepOpen)continue;
      const over=!!it&&!isBin(it)&&hit(b,mouse.x,mouse.y);
      if(over&&num(b,'trashN')<MAX_THROWS)setOpen(b,true);else if(b._open)setOpen(b,false);
    }
  }
  requestAnimationFrame(tick);
  // right click on the bin: when it is full, "Isprazni kantu" appears under it
  let label=null;
  function hideLabel(){if(label){label.remove();label=null;}}
  function showLabel(b){
    hideLabel();
    const r=b.getBoundingClientRect(),n=num(b,'trashN');
    label=document.createElement('button');label.type='button';
    label.textContent=n>=MAX_THROWS?'Isprazni kantu':'Kanta nije puna ('+n+'/'+MAX_THROWS+')';
    label.style.cssText=`position:fixed;left:${r.left+r.width/2}px;top:${r.bottom+6}px;transform:translateX(-50%);z-index:20002;padding:7px 14px;border:2px solid #351b0d;border-radius:9px;background:#e8c27a;color:#351b0d;font:700 14px system-ui,sans-serif;cursor:${n>=MAX_THROWS?'pointer':'default'};white-space:nowrap`;
    ['pointerdown','mousedown','click','contextmenu'].forEach(ev=>label.addEventListener(ev,e=>e.stopPropagation()));
    label.addEventListener('click',()=>{
      if(num(b,'trashN')>=MAX_THROWS){b.dataset.trashN='0';snd(b,'empty');smoke(b);try{CooksterSave.schedule();}catch(_){}}
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
