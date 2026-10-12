/* Cookster - the menu of the tavern ("Jelovnik"), a book. Every player makes his own menu out of the dishes he cooks:
   right click on a finished dish (a vessel with something in it, js/serving.js) -> "Dodaj u meni" -> the book opens, the player chooses the part of the menu and the dish is written on the first free line:
   the picture of the plate (how the dish looks on the plate) on the left, the name of the dish on the line, the price on the short line.
   The book: the cover, then the sheets that turn (CSS 3D):  [Супе и чорбе | Кувана јела] -> [Роштиљ | Специјалитети куће] -> [Салате и хлеб | Десерти] -> [Пиће | празна страна].
   The pictures of the pages are in assets/ui/menu/ (page_*.webp, cover.webp): a page whose picture is missing is shown as the empty lined page with its title written over it.
   The menu is kept in the browser (cookster.menu.v1). The button "Jelovnik" in the HUD opens the book at any time.
   API: CooksterMenu.addFromVessel(el), .open(), .close(), .list(). (The guests do not order from the menu yet: that is the next step.) */
(function(){
'use strict';
const KEY='cookster.menu.v1',DIR='assets/ui/menu/',IW=1086,IH=1448;
// the pages in the order of the book (the geometry = where the lines are in the picture of the page, in the pixels of the picture 1086 x 1448; l = the line of the name, r = the line of the price)
const GEO_DEF={ys:[365,431,499,564,630,697,763,833,899,968,1035,1103,1172],l:[140,791],r:[831,951]};
const PAGES=[
  {id:'supe',title:'Супе и чорбе',img:'page_supe.webp',g:GEO_DEF},
  {id:'kuvana',title:'Кувана јела',img:'page_kuvana.webp',g:{ys:[361,430,495,564,629,698,764,831,899,968,1033,1100,1168],l:[140,793],r:[835,958]}},
  {id:'rostilj',title:'Роштиљ',img:'page_rostilj.webp',g:{ys:[354,420,487,555,621,689,754,822,888,957,1021,1090,1155],l:[140,788],r:[826,948]}},
  {id:'specijaliteti',title:'Специјалитети куће',img:'page_specijaliteti.webp',g:{ys:[368,436,504,576,642,710,777,844,913,981,1046,1118,1185],l:[130,798],r:[838,964]}},
  {id:'salate',title:'Салате и хлеб',img:'page_salate.webp',g:{ys:[370,437,507,575,641,709,776,845,912,980,1046,1114,1182],l:[130,800],r:[838,962]}},
  {id:'deserti',title:'Десерти',img:'page_deserti.webp',g:{ys:[357,425,493,561,629,696,764,832,900,968,1035,1104,1172],l:[135,792],r:[832,953]}},
  {id:'pice',title:'Пиће',img:'page_pice.webp',g:{ys:[362,431,499,567,635,703,770,837,904,971,1038,1105,1172],l:[143,783],r:[822,943]}},
  {id:'prazna',title:'Празна страна',img:'page_prazna.webp',g:GEO_DEF,plain:true}
];
const BY={};PAGES.forEach(p=>BY[p.id]=p);
const SPREAD={supe:1,kuvana:1,rostilj:2,specijaliteti:2,salate:3,deserti:3,pice:4,prazna:4};      // after how many turned sheets a page is seen (0 = the closed book)
// the sheets: front = the right page while it lies on the right, back = the left page after it was turned. The cover is the front of the first sheet.
const LEAVES=[{front:'cover',back:'supe'},{front:'kuvana',back:'rostilj'},{front:'specijaliteti',back:'salate'},{front:'deserti',back:'pice'}];
const BASE_RIGHT='prazna';
let book=[],t=0,pending=null,busy=false,seen=false;
function load(){try{const j=JSON.parse(localStorage.getItem(KEY)||'[]');book=Array.isArray(j)?j.filter(e=>e&&e.id):[];}catch(_){book=[];}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(book));}catch(_){try{showToast('Nema mesta u pregledaču za meni.');}catch(__){}}}
function freeSlot(pid){const used=new Set(book.filter(e=>e.cat===pid).map(e=>e.slot));for(let i=0;i<BY[pid].g.ys.length;i++)if(!used.has(i))return i;return -1;}
load();
book.forEach(e=>{if(!BY[e.cat]){e.cat='kuvana';e.slot=-1;}});                  // (the first version of the menu had no parts: it all goes to the "Кувана јела")
book.forEach(e=>{if(e.slot==null||e.slot<0||book.some(o=>o!==e&&o.cat===e.cat&&o.slot===e.slot)){const s=freeSlot(e.cat);if(s>=0)e.slot=s;}});
const css=document.createElement('style');
css.textContent=`
@font-face{font-family:'CooksterPen';src:url(assets/fonts/BadScript-Regular.ttf) format('truetype');font-display:swap}
#menuBookShade{position:fixed;inset:0;z-index:30500;background:rgba(10,5,2,.72);display:none;align-items:center;justify-content:center;--ph:760px}
#menuBookShade.open{display:flex}
#menuBook{position:relative;width:calc(var(--ph)*1.5);height:var(--ph);perspective:calc(var(--ph)*3.2);transition:transform .95s cubic-bezier(.5,.05,.25,1);font-family:'CooksterPen','Segoe Script','Lucida Handwriting',Georgia,serif}
#menuBook .mb-leaf,#menuBook .mb-base{position:absolute;left:50%;top:0;width:50%;height:100%}
#menuBook .mb-base{transition:opacity .5s ease .4s}
#menuBook .mb-base.closed{opacity:0;transition-delay:0s}
#menuBook .mb-leaf{transform-origin:left center;transform-style:preserve-3d;transition:transform .95s cubic-bezier(.5,.05,.25,1)}
#menuBook .mb-leaf.turned{transform:rotateY(-180deg)}
#menuBook .mb-face{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden}
#menuBook .mb-face:not(.mb-cover){transform:translateX(-4.6%)}      /* the picture of a page has a ragged edge of about 5%: both pages are moved to the middle so that the paper of the left and of the right page touch at the fold */
#menuBook .mb-back{transform:translateX(-4.6%) rotateY(180deg)!important}
/* a thin strip along the middle that covers the gap between the two pages (above the lying sheets, below the sheet that turns) */
#menuBook .mb-spine{position:absolute;left:50%;top:1.2%;bottom:1.2%;width:calc(var(--ph)*.012);margin-left:calc(var(--ph)*-.006);z-index:30;opacity:0;transition:opacity .5s ease;pointer-events:none;border-radius:3px;background:linear-gradient(90deg,#3a1d08,#6a3a18 50%,#3a1d08);box-shadow:0 0 5px rgba(0,0,0,.45)}
#menuBook .mb-spine.on{opacity:1}
#menuBook .mb-bg{position:absolute;inset:0;width:100%;height:100%;object-fit:fill;pointer-events:none;user-select:none}
#menuBook .mb-cover .mb-bg{filter:drop-shadow(0 14px 22px rgba(0,0,0,.65))}
#menuBook .mb-cover{cursor:pointer}
#menuBook .mb-title{display:none;position:absolute;left:0;right:0;top:9%;text-align:center;font:700 calc(var(--ph)*.052)/1.1 Georgia,'Times New Roman',serif;color:#3a2010;pointer-events:none}
#menuBook .mb-missing .mb-title{display:block}
#menuBook .mb-face::after{content:'';position:absolute;inset:0;pointer-events:none;opacity:0;background:linear-gradient(90deg,rgba(35,15,3,.0),rgba(35,15,3,.5))}
#menuBook .mb-back::after{background:linear-gradient(270deg,rgba(35,15,3,.0),rgba(35,15,3,.5))}
#menuBook .mb-leaf.flip .mb-face::after{animation:mbshade .95s ease-in-out}
@keyframes mbshade{0%{opacity:0}45%{opacity:1}100%{opacity:0}}
#menuBook .mb-e{position:absolute;left:0;right:0;pointer-events:none}
#menuBook .mb-e *{pointer-events:auto}
#menuBook input.mb-name,#menuBook input.mb-price{position:absolute;box-sizing:border-box;background:transparent;border:0;outline:0;color:#1b3fa6;text-shadow:0 0 .6px rgba(20,50,150,.7);font:400 calc(var(--ph)*.034)/1 'CooksterPen','Segoe Script','Lucida Handwriting',Georgia,serif;padding:0 .3em;height:100%;border-radius:4px;caret-color:#1b3fa6}
#menuBook input.mb-price{text-align:center;-moz-appearance:textfield}
#menuBook input.mb-price::-webkit-outer-spin-button,#menuBook input.mb-price::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
#menuBook input.mb-name:focus,#menuBook input.mb-price:focus{background:rgba(255,248,225,.5)}
#menuBook .mb-new input.mb-name{background:rgba(255,235,170,.55)}
#menuBook .mb-th{position:absolute;object-fit:contain;transition:transform .18s ease;transform-origin:left center;filter:drop-shadow(0 2px 3px rgba(60,30,5,.45))}
#menuBook .mb-th:hover{transform:scale(2.7);z-index:5}
#menuBook button.mb-x{position:absolute;border:0;background:transparent;color:#7a2a10;font:700 calc(var(--ph)*.02) Georgia,serif;cursor:pointer;opacity:.4;padding:0}
#menuBook button.mb-x:hover{opacity:1}
#menuBook .mb-turn{position:absolute;top:0;bottom:0;width:6%;cursor:pointer}
#menuBook .mb-turn.next{right:0}#menuBook .mb-turn.prev{left:0}
#menuBook .mb-turn:hover{background:linear-gradient(90deg,transparent,rgba(120,70,20,.18))}
#menuBook .mb-turn.prev:hover{background:linear-gradient(270deg,transparent,rgba(120,70,20,.18))}
#menuBookShade .mb-nav{position:absolute;top:50%;transform:translateY(-50%);width:54px;height:80px;border-radius:12px;border:3px solid #4a2410;background:rgba(231,199,120,.95);color:#3a2410;font:900 30px Georgia,serif;cursor:pointer}
#menuBookShade .mb-nav.l{left:max(8px,calc(50% - var(--ph)*.75 - 70px))}#menuBookShade .mb-nav.r{right:max(8px,calc(50% - var(--ph)*.75 - 70px))}
#menuBookShade .mb-nav[disabled]{opacity:.25;cursor:default}
#menuBookShade .mb-close{position:absolute;top:14px;right:18px;width:44px;height:44px;border-radius:50%;border:3px solid #4a2410;background:#e7c778;color:#3a2410;font:900 22px Georgia,serif;cursor:pointer}
#menuBookShade .mb-hint{position:absolute;bottom:16px;left:0;right:0;text-align:center;color:#f4e4c1;font:700 16px Georgia,serif;text-shadow:0 2px 6px #000}
#menuBookShade .mb-banner{position:absolute;top:10px;left:50%;transform:translateX(-50%);display:none;align-items:center;gap:14px;max-width:94vw;padding:10px 16px;border-radius:12px;background:rgba(244,228,193,.97);border:3px solid #4a2410;color:#3a2410;font:700 15px Georgia,serif;box-shadow:0 8px 24px rgba(0,0,0,.5);z-index:5}
#menuBookShade .mb-banner.show{display:flex}
#menuBookShade .mb-banner img{height:64px;width:90px;object-fit:contain}
#menuBookShade .mb-banner .mb-ch{display:flex;flex-wrap:wrap;gap:6px;max-width:520px}
#menuBookShade .mb-banner button{padding:6px 10px;border-radius:8px;border:2px solid #4a2410;background:#e7c778;color:#3a2410;font:700 14px Georgia,serif;cursor:pointer}
#menuBookShade .mb-banner button.no{background:#d9b4a0}
`;
document.head.appendChild(css);
const shade=document.createElement('div');shade.id='menuBookShade';shade.setAttribute('data-tool-ui','1');
shade.innerHTML='<div class="mb-banner"></div><div id="menuBook" role="dialog" aria-label="Jelovnik"></div><button type="button" class="mb-nav l" title="Prethodna strana">◀</button><button type="button" class="mb-nav r" title="Sledeća strana">▶</button><button type="button" class="mb-close" title="Zatvori knjigu">✕</button><div class="mb-hint"></div>';
document.body.appendChild(shade);
const bookEl=shade.querySelector('#menuBook'),banner=shade.querySelector('.mb-banner'),navL=shade.querySelector('.mb-nav.l'),navR=shade.querySelector('.mb-nav.r'),hint=shade.querySelector('.mb-hint');
// the game must not hear the keys that are typed in the book (E and Q would start cutting / the tool wheel)
shade.addEventListener('keydown',e=>{
  e.stopPropagation();
  if(e.key==='Escape'){close();return;}
  if(/^(INPUT|TEXTAREA)$/.test(e.target.tagName))return;
  if(e.key==='ArrowRight')turn(1);else if(e.key==='ArrowLeft')turn(-1);
});
['pointerdown','click','contextmenu','wheel'].forEach(n=>shade.addEventListener(n,e=>e.stopPropagation()));
shade.addEventListener('mousedown',e=>{e.stopPropagation();if(e.target===shade&&!pending)close();});
shade.querySelector('.mb-close').onclick=close;
navL.onclick=()=>turn(-1);navR.onclick=()=>turn(1);
const el=(tag,cls,html)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e;};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pc=(v,tot)=>(v/tot*100).toFixed(3)+'%';
// ---------- the faces (pages) ----------
const faces={};          // page id -> the element of the page (it is there only once)
function makeFace(pid,side){
  const f=el('div','mb-face mb-'+side);
  if(pid==='cover'){f.classList.add('mb-cover');f.innerHTML='<img class="mb-bg" alt="" src="'+DIR+'cover.webp">';f.onclick=()=>turn(1);return f;}
  const P=BY[pid],im=new Image();im.className='mb-bg';im.alt='';im.draggable=false;
  im.onerror=()=>{im.onerror=null;im.src=DIR+'page_prazna.webp';f.classList.add('mb-missing');};
  im.src=DIR+P.img;f.appendChild(im);
  f.appendChild(el('div','mb-title',esc(P.title)));
  const tz=el('div','mb-turn '+(side==='front'?'next':'prev'));tz.title=side==='front'?'Okreni list':'Nazad';tz.onclick=()=>turn(side==='front'?1:-1);f.appendChild(tz);
  faces[pid]=f;return f;
}
const leafEls=[];
function buildBook(){
  bookEl.innerHTML='';
  const base=el('div','mb-base');base.style.zIndex=1;base.appendChild(makeFace(BASE_RIGHT,'front'));
  // the page on the right of the last spread has no page to be turned to: no zone to turn forward there
  const bz=base.querySelector('.mb-turn');if(bz)bz.remove();
  bookEl.appendChild(base);
  LEAVES.forEach((L,i)=>{
    const lf=el('div','mb-leaf');lf.appendChild(makeFace(L.front,'front'));lf.appendChild(makeFace(L.back,'back'));
    bookEl.appendChild(lf);leafEls.push(lf);
  });
  bookEl.appendChild(el('div','mb-spine'));
  renderEntries();layout(true);
}
function layout(now){
  leafEls.forEach((lf,i)=>{
    const turned=i<t;lf.classList.toggle('turned',turned);
    if(now)lf.style.zIndex=turned?10+i:20-i;
  });
  const sp=bookEl.querySelector('.mb-spine');if(sp)sp.classList.toggle('on',t>0);
  const bs=bookEl.querySelector('.mb-base');if(bs)bs.classList.toggle('closed',t===0);
  const pw=bookEl.offsetWidth/2;bookEl.style.transform='translateX('+(t===0?-pw/2:0)+'px)';
  navL.disabled=t<=0;navR.disabled=t>=LEAVES.length;
  hint.textContent=t===0?'Klikni na knjigu da je otvoriš':'';
}
// ---------- turning ----------
function turn(d){
  if(busy)return;const to=t+d;if(to<0||to>LEAVES.length)return;
  busy=true;const i=d>0?t:to;                // the sheet that turns
  const lf=leafEls[i];lf.style.zIndex=50;lf.classList.add('flip');
  t=to;layout(false);
  setTimeout(()=>{lf.classList.remove('flip');lf.style.zIndex=(i<t?10+i:20-i);busy=false;},980);
}
function goTo(target,cb){                    // turns step by step to the spread (so the player sees the pages go by)
  const step=()=>{if(t===target){if(cb)cb();return;}if(busy){setTimeout(step,120);return;}turn(target>t?1:-1);setTimeout(step,300);};
  step();
}
// ---------- the dishes on the lines ----------
function renderEntries(){
  Object.keys(faces).forEach(pid=>{
    const f=faces[pid];f.querySelectorAll('.mb-e,.mb-th,.mb-x').forEach(n=>n.remove());
    const g=BY[pid].g;
    book.filter(e=>e.cat===pid&&e.slot>=0&&e.slot<g.ys.length).forEach(e=>{
      const y=g.ys[e.slot],row=el('div','mb-e'+(e.fresh?' mb-new':''));row.dataset.id=e.id;row.style.top=pc(y-50,IH);row.style.height=pc(50,IH);
      const nm=el('input','mb-name');nm.type='text';nm.maxLength=36;nm.placeholder='';nm.value=e.name||'';nm.title='Ime jela';
      nm.style.left=pc(g.l[0],IW);nm.style.width=pc(g.l[1]-g.l[0],IW);
      nm.oninput=()=>{e.name=nm.value;save();};
      const pr=el('input','mb-price');pr.type='number';pr.min=0;pr.max=99999;pr.step=10;pr.value=e.price!=null&&e.price!==''?e.price:'';pr.title='Cena (дин)';
      pr.style.left=pc(g.r[0],IW);pr.style.width=pc(g.r[1]-g.r[0],IW);
      pr.oninput=()=>{const v=pr.value;e.price=v===''?'':Math.max(0,Math.min(99999,Math.round(+v)||0));save();};
      row.append(nm,pr);f.appendChild(row);
      if(e.img){const th=el('img','mb-th');th.src=e.img;th.alt='';th.draggable=false;th.title=e.what||'';th.style.left=pc(52,IW);th.style.width=pc(84,IW);th.style.top=pc(y-70,IH);th.style.height=pc(84,IH);f.appendChild(th);}
      const x=el('button','mb-x','✕');x.type='button';x.title='Skloni sa menija';x.style.left=pc(g.r[1]+10,IW);x.style.top=pc(y-40,IH);
      x.onclick=()=>{if(!confirm('Skloniti „'+(e.name||'jelo bez imena')+'“ sa menija?'))return;book=book.filter(o=>o!==e);save();renderEntries();};
      f.appendChild(x);
    });
  });
}
// ---------- open / close ----------
function size(){const ph=Math.max(300,Math.min(innerHeight*.88,innerWidth*.92/1.5,1000));shade.style.setProperty('--ph',ph+'px');}
function open(){
  size();if(!leafEls.length)buildBook();
  shade.classList.add('open');
  if(!seen){seen=true;t=0;}
  layout(true);
}
function close(){shade.classList.remove('open');cancelPending();const a=document.activeElement;if(a&&shade.contains(a))a.blur();}
addEventListener('resize',()=>{if(shade.classList.contains('open')){size();layout(true);}});
// ---------- a new dish ("Dodaj u meni") ----------
function cancelPending(){pending=null;banner.classList.remove('show');}
function showBanner(){
  banner.innerHTML='';
  const im=el('img');im.src=pending.img;im.alt='';
  const box=el('div',null,'<div style="margin-bottom:6px">Novo jelo: <span style="font-weight:400">'+esc(pending.what||'')+'</span><br>U koji deo menija da ga upišem?</div>');
  const ch=el('div','mb-ch');
  PAGES.forEach(P=>{const b=el('button',null,esc(P.title));b.type='button';b.onclick=()=>placePending(P.id);ch.appendChild(b);});
  const no=el('button','no','Otkaži');no.type='button';no.onclick=cancelPending;ch.appendChild(no);
  box.appendChild(ch);banner.append(im,box);banner.classList.add('show');
}
function placePending(pid){
  if(!pending)return;const s=freeSlot(pid);
  if(s<0){try{showToast('Ta strana je puna: izaberi drugu.');}catch(_){}return;}
  const e=pending;e.cat=pid;e.slot=s;e.fresh=true;book.forEach(o=>delete o.fresh);book.push(e);e.fresh=true;
  pending=null;banner.classList.remove('show');save();renderEntries();
  goTo(SPREAD[pid],()=>{const n=bookEl.querySelector('.mb-e[data-id="'+e.id+'"] .mb-name');if(n)n.focus();});
  setTimeout(()=>{delete e.fresh;renderEntries();},4000);
}
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
function addFromVessel(el0){
  const S=window.CooksterServe;if(!el0||!S)return false;
  const items=S.listOf(el0);if(!items.length){try{showToast('Prvo složi jelo na tanjir.');}catch(_){}return false;}
  const oil=+el0.dataset.srvOil||0,pars=+el0.dataset.srvParsley||0,vessel=el0.dataset.itemId||'',sig=signature(vessel,items,oil,pars);
  open();
  const old=book.find(e=>e.sig===sig);
  if(old){try{showToast('To jelo je već na meniju.');}catch(_){}old.fresh=true;renderEntries();goTo(SPREAD[old.cat]);setTimeout(()=>{delete old.fresh;renderEntries();},3000);return true;}
  try{S.render(el0);}catch(_){}
  const body=el0.querySelector('.body');
  pending={id:'m'+Date.now().toString(36)+Math.floor(Math.random()*1e4).toString(36),name:'',price:'',img:body?thumb(body):'',sig,vessel,items:items.map(x=>({k:x.k,l:x.l,f:x.f})),oil:oil>0?oil:0,parsley:pars>0?1:0,what:describe(items,oil,pars)};
  if(t===0)turn(1);
  showBanner();return true;
}
function attachButton(){
  const hud=document.getElementById('hud');if(!hud||document.getElementById('menuBookBtn'))return;
  const b=document.createElement('button');b.id='menuBookBtn';b.type='button';b.textContent='📖 Jelovnik';b.title='Meni kafane';
  b.addEventListener('click',e=>{e.stopPropagation();open();});hud.appendChild(b);
}
attachButton();
window.CooksterMenu={addFromVessel,open,close,list:()=>JSON.parse(JSON.stringify(book)),key:KEY,pages:PAGES.map(p=>p.id),_state:()=>({t,busy})};
})();
