/* Cookster - the menu of the tavern ("Jelovnik"). Every player makes his own menu out of the dishes he cooks:
   right click on a finished dish (a vessel with something in it, js/serving.js) -> "Dodaj u meni" -> the book opens: the picture of the plate (how the dish looks on the plate), the name of the dish and its price.
   The menu is kept in the browser (cookster.menu.v1). The button "Jelovnik" in the HUD opens the book at any time.
   API: CooksterMenu.addFromVessel(el), .open(), .list(). (The guests do not order from the menu yet: that is the next step.) */
(function(){
'use strict';
const KEY='cookster.menu.v1';
let book=[];
function load(){try{const j=JSON.parse(localStorage.getItem(KEY)||'[]');book=Array.isArray(j)?j.filter(e=>e&&e.id):[];}catch(_){book=[];}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(book));}catch(_){try{showToast('Nema mesta u pregledaču za meni.');}catch(__){}}}
load();
const css=document.createElement('style');
css.textContent=`
#menuBookShade{position:fixed;inset:0;z-index:30500;background:rgba(0,0,0,.55);display:none;align-items:center;justify-content:center}
#menuBookShade.open{display:flex}
#menuBook{position:relative;width:min(760px,94vw);max-height:90vh;display:flex;flex-direction:column;padding:22px 26px 18px 40px;border-radius:10px 16px 16px 10px;background:linear-gradient(90deg,#8a4a1e 0,#6b3512 22px,#f4e4c1 24px,#efdcb0 100%);border:4px solid #4a2410;box-shadow:0 18px 50px rgba(0,0,0,.6),inset 0 0 40px rgba(120,70,20,.25);color:#3a2410;font-family:Georgia,'Times New Roman',serif}
#menuBook h2{margin:0;text-align:center;font-size:30px;letter-spacing:.04em}
#menuBook .mb-sub{text-align:center;margin:2px 0 10px;font-size:14px;font-style:italic;color:#6b4423}
#menuBook .mb-list{overflow:auto;padding:4px 6px 4px 2px;display:flex;flex-direction:column;gap:12px}
#menuBook .mb-empty{padding:30px 10px;text-align:center;font-size:16px;color:#6b4423}
#menuBook .mb-row{display:flex;align-items:center;gap:14px;padding:10px 12px;border-radius:10px;background:rgba(255,250,235,.55);border:2px solid rgba(110,70,30,.35)}
#menuBook .mb-row.mb-new{border-color:#c4501a;box-shadow:0 0 0 3px rgba(230,120,40,.35)}
#menuBook .mb-pic{flex:0 0 150px;height:112px;border-radius:50%/42%;background:radial-gradient(ellipse at center,rgba(255,255,255,.55),rgba(120,80,40,.18));display:flex;align-items:center;justify-content:center;overflow:hidden}
#menuBook .mb-pic img{max-width:100%;max-height:100%;object-fit:contain}
#menuBook .mb-f{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px}
#menuBook input{font:700 18px Georgia,serif;color:#3a2410;background:rgba(255,255,255,.7);border:2px solid rgba(110,70,30,.5);border-radius:7px;padding:7px 9px;width:100%;box-sizing:border-box}
#menuBook .mb-pr{display:flex;align-items:center;gap:8px;font-weight:700}
#menuBook .mb-pr input{width:110px}
#menuBook .mb-sm{font-size:12px;color:#7a5530;line-height:1.3}
#menuBook button.mb-x{flex:0 0 auto;border:0;background:transparent;font-size:22px;cursor:pointer;color:#8a2a10}
#menuBook .mb-bot{display:flex;justify-content:flex-end;margin-top:12px}
#menuBook .mb-close{padding:9px 20px;border-radius:10px;border:3px solid #4a2410;background:#e7c778;color:#3a2410;font:900 16px Georgia,serif;cursor:pointer}
`;
document.head.appendChild(css);
const shade=document.createElement('div');shade.id='menuBookShade';shade.setAttribute('data-tool-ui','1');
shade.innerHTML='<div id="menuBook" role="dialog" aria-label="Jelovnik"><h2>Јеловник</h2><div class="mb-sub">Кафана код Кукстера</div><div class="mb-list"></div><div class="mb-bot"><button type="button" class="mb-close">Zatvori knjigu</button></div></div>';
document.body.appendChild(shade);
const listEl=shade.querySelector('.mb-list');
// the game must not hear the keys that are typed in the book (E and Q would start cutting / the tool wheel)
shade.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape')close();});
['pointerdown','mousedown','click','contextmenu','wheel'].forEach(n=>shade.addEventListener(n,e=>e.stopPropagation()));
shade.addEventListener('mousedown',e=>{if(e.target===shade)close();});
shade.querySelector('.mb-close').onclick=close;
let freshId=null;
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function render(){
  listEl.innerHTML='';
  if(!book.length){listEl.innerHTML='<div class="mb-empty">Meni je prazan.<br>Skuvaj jelo, složi ga na tanjir, pa desni klik na tanjir → „Dodaj u meni“.</div>';return;}
  book.forEach(e=>{
    const row=document.createElement('div');row.className='mb-row'+(e.id===freshId?' mb-new':'');row.dataset.id=e.id;
    row.innerHTML=`<div class="mb-pic">${e.img?`<img alt="" src="${e.img}">`:''}</div>
      <div class="mb-f"><input class="mb-name" type="text" maxlength="40" placeholder="Ime jela" value="${esc(e.name||'')}">
      <div class="mb-pr"><span>Cena:</span><input class="mb-price" type="number" min="0" max="99999" step="10" placeholder="0" value="${e.price!=null&&e.price!==''?e.price:''}"><span>дин</span></div>
      <div class="mb-sm">${esc(e.what||'')}</div></div>
      <button type="button" class="mb-x" title="Skloni sa menija">✕</button>`;
    row.querySelector('.mb-name').oninput=ev=>{e.name=ev.target.value;save();};
    row.querySelector('.mb-price').oninput=ev=>{const v=ev.target.value;e.price=v===''?'':Math.max(0,Math.min(99999,Math.round(+v)||0));save();};
    row.querySelector('.mb-x').onclick=()=>{if(!confirm('Skloniti „'+(e.name||'jelo bez imena')+'“ sa menija?'))return;book=book.filter(o=>o!==e);save();render();};
    listEl.appendChild(row);
  });
}
function open(focusId){
  freshId=focusId||null;render();shade.classList.add('open');
  if(focusId){const row=listEl.querySelector('.mb-row[data-id="'+focusId+'"]');if(row){row.scrollIntoView({block:'center'});const n=row.querySelector('.mb-name');if(n)setTimeout(()=>n.focus(),60);}}
}
function close(){shade.classList.remove('open');freshId=null;const a=document.activeElement;if(a&&shade.contains(a))a.blur();}
// the picture of the plate: a small copy of what the player sees (the picture of the vessel with the food on it)
function thumb(img){
  try{
    const w=img.naturalWidth||img.width,h=img.naturalHeight||img.height;if(!w||!h)return '';
    const k=Math.min(1,260/Math.max(w,h)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(w*k));c.height=Math.max(1,Math.round(h*k));
    c.getContext('2d').drawImage(img,0,0,c.width,c.height);
    const webp=c.toDataURL('image/webp',.88);return webp.startsWith('data:image/webp')?webp:c.toDataURL('image/png');
  }catch(_){return '';}
}
// a dish is the same dish when the same things lie on the same vessel (the order and the places do not matter)
function signature(vessel,items,oil,pars){
  return vessel+'|'+items.map(x=>(x.k||'x')+':'+(x.f||'p')).sort().join(',')+'|o'+(oil>0?1:0)+'|p'+(pars>0?1:0);
}
function describe(items,oil,pars){
  const cnt={},order=[];items.forEach(x=>{const n=x.l||x.k||'sastojak';if(!cnt[n]){cnt[n]=0;order.push(n);}cnt[n]++;});
  const parts=order.map(n=>cnt[n]>1?cnt[n]+'× '+n.toLowerCase():n.toLowerCase());
  if(oil>0)parts.push('ulje');if(pars>0)parts.push('peršun');
  return parts.join(', ');
}
function addFromVessel(el){
  const S=window.CooksterServe;if(!el||!S)return false;
  const items=S.listOf(el);if(!items.length){try{showToast('Prvo složi jelo na tanjir.');}catch(_){}return false;}
  const oil=+el.dataset.srvOil||0,pars=+el.dataset.srvParsley||0,vessel=el.dataset.itemId||'',sig=signature(vessel,items,oil,pars);
  const old=book.find(e=>e.sig===sig);
  if(old){try{showToast('To jelo je već na meniju.');}catch(_){}open(old.id);return true;}
  try{S.render(el);}catch(_){}
  const body=el.querySelector('.body');
  const entry={id:'m'+Date.now().toString(36)+Math.floor(Math.random()*1e4).toString(36),name:'',price:'',img:body?thumb(body):'',sig,vessel,items:items.map(x=>({k:x.k,l:x.l,f:x.f})),oil:oil>0?oil:0,parsley:pars>0?1:0,what:describe(items,oil,pars)};
  book.push(entry);save();open(entry.id);return true;
}
function attachButton(){
  const hud=document.getElementById('hud');if(!hud||document.getElementById('menuBookBtn'))return;
  const b=document.createElement('button');b.id='menuBookBtn';b.type='button';b.textContent='📖 Jelovnik';b.title='Meni kafane';
  b.addEventListener('click',e=>{e.stopPropagation();open();});hud.appendChild(b);
}
attachButton();
window.CooksterMenu={addFromVessel,open,close,list:()=>JSON.parse(JSON.stringify(book)),key:KEY};
})();
