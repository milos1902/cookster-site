/* Cookster: alat „Senka daske" (dugme levo na ekranu): klizači za senku ispod daske (providnost, zamućenost, širina, visina, pomeranje). Pamti se u ovom pregledaču
   (cookster.board-shadow). Dugme „Vrati" vraća podrazumevane vrednosti. Sakriva se kad su Alati isključeni. */
(function(){
  'use strict';
  const KEY='cookster.board-shadow',DEF={x:-3,y:7,width:1.01,height:.3,opacity:.5,blur:3.5};
  let S={...DEF};try{const j=JSON.parse(localStorage.getItem(KEY)||'null');if(j)S={...DEF,...j};}catch(_){}
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S));}catch(_){}};
  function repose(){try{const b=getBoardEl();if(b)setPose(b,+b.dataset.cx,+b.dataset.by,+b.dataset.vis||1);}catch(_){}}
  window.CooksterBoardShadow={get:()=>S};
  const btn=document.createElement('button');btn.type='button';btn.setAttribute('data-tool-ui','1');btn.setAttribute('data-cookster-tool','1');btn.textContent='🎚 Senka daske';
  btn.style.cssText='position:fixed;left:14px;top:270px;z-index:8000;padding:7px 11px;border-radius:10px;border:2px solid #4a2a12;background:#f1d9a6;color:#3a1d0a;font:13px system-ui,sans-serif;cursor:pointer';
  const panel=document.createElement('div');panel.setAttribute('data-tool-ui','1');panel.setAttribute('data-cookster-tool','1');
  panel.style.cssText='position:fixed;left:14px;top:310px;z-index:8000;width:230px;display:none;background:rgba(40,28,20,.94);color:#f4e6cf;border:1px solid #8a6a43;border-radius:10px;padding:10px 12px;font:12px/1.3 system-ui,sans-serif;box-shadow:0 4px 14px #0008';
  const ROWS=[['opacity','Providnost',0,1,.01],['blur','Zamućenost',0,14,.1],['width','Širina',.5,1.4,.01],['height','Visina',.05,1.2,.01],['x','Levo/desno',-60,60,1],['y','Gore/dole',-40,60,1]];
  panel.innerHTML='<b>Senka daske</b>'+ROWS.map(r=>'<div style="margin-top:6px">'+r[1]+' <span data-v="'+r[0]+'" style="float:right;opacity:.8"></span><input data-k="'+r[0]+'" type="range" min="'+r[2]+'" max="'+r[3]+'" step="'+r[4]+'" style="width:100%"></div>').join('')+'<button type="button" data-reset style="margin-top:8px;padding:5px 9px;border-radius:6px;border:1px solid #8a6a43;background:#5a4026;color:#f4e6cf;cursor:pointer">Vrati</button>';
  const sync=()=>{panel.querySelectorAll('input[data-k]').forEach(i=>{i.value=S[i.dataset.k];});panel.querySelectorAll('[data-v]').forEach(s=>{s.textContent=(+S[s.dataset.v]).toFixed(2);});};
  panel.addEventListener('input',e=>{const k=e.target.dataset&&e.target.dataset.k;if(!k)return;S[k]=+e.target.value;save();sync();repose();});
  panel.querySelector('[data-reset]').onclick=()=>{S={...DEF};save();sync();repose();};
  btn.onclick=()=>{panel.style.display=panel.style.display==='block'?'none':'block';sync();};
  document.body.append(btn,panel);
  setInterval(()=>{const b=document.body.classList,hide=b.contains('pantry-open')||b.contains('garden-open')||b.contains('market-open');btn.style.display=hide?'none':'block';if(hide)panel.style.display='none';},700);
})();
