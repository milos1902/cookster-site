/* Cookster: desni klik na parče mesa na stolu / dasci -> „Vrati meso u frižider". Parče nestaje (meso je beskonačno), šnicle ostaju. */
(function(){
  'use strict';
  let menu=null;
  const hide=()=>{if(menu){menu.remove();menu=null;}};
  function meatItemAt(x,y){
    const V=window.CooksterCatalog&&CooksterCatalog.VEGETABLES||{};
    for(const el of document.elementsFromPoint(x,y)){
      const it=el.closest&&el.closest('.item');
      if(it&&it.dataset&&it.dataset.vegKey&&V[it.dataset.vegKey]&&V[it.dataset.vegKey].meat==='parce')return it;
    }
    return null;
  }
  window.addEventListener('contextmenu',e=>{
    const it=meatItemAt(e.clientX,e.clientY);
    if(!it){hide();return;}
    e.preventDefault();e.stopImmediatePropagation();hide();
    menu=document.createElement('div');menu.setAttribute('data-tool-ui','1');
    menu.style.cssText='position:fixed;z-index:99999;left:'+Math.min(e.clientX,innerWidth-230)+'px;top:'+Math.min(e.clientY,innerHeight-60)+'px;background:#3a2414;border:2px solid #8a6a43;border-radius:10px;padding:6px;box-shadow:0 4px 14px #000a';
    const b=document.createElement('button');b.type='button';b.textContent='🧊 Vrati meso u frižider';
    b.style.cssText='font:15px system-ui,sans-serif;padding:8px 14px;border-radius:8px;border:0;background:#f1d9a6;color:#3a1d0a;cursor:pointer';
    b.onclick=ev=>{ev.stopPropagation();try{removeItem(it);}catch(_){}hide();};
    menu.appendChild(b);document.body.appendChild(menu);
  },true);
  window.addEventListener('pointerdown',e=>{if(menu&&!menu.contains(e.target))hide();},true);
  window.addEventListener('keydown',e=>{if(e.key==='Escape')hide();},true);
})();
