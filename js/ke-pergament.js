/* Kuhinjski elementi, parchment style. Takes over the old window (the old card is hidden by css/ke-pergament.css) only for the equipment list; drinks keep the old window.
   Page picture: assets/ui/pergament/strana_kuhinjski_elementi_prazna.webp (1600x1100). The description card on the right shows the thing under the mouse (the last one,
   it stays so the button can be reached); its red button "Stavi u ranac" puts the thing into the rack (CooksterRecentItems.push). ?starihud keeps the old window. */
(function(){
if(/[?&]starihud/.test(location.search))return;
var P='assets/ui/pergament/',ART={},SEL=null,TAB='own',FILT='all',Q='';
['daska_serviranje','kal_01_okrugli_pleh','kal_02_cediljka','kal_02_cinija_mala','kal_02_drvena_kasika','kal_02_duboki_tanjir','kal_02_oklagija','tiganj_mali','vangla_mala'].forEach(function(k){ART[k]='assets/ui/predmeti/'+k+'.png';});
['oval_tanjir','kal_01_okrugli_pleh_poklopac','kal_01_pravougaoni_pleh','kal_02_tanjir_ravni','vangla_srednja','kal_02_cinija_velika','serpa_velika','lavor_emajl_veliki','tiganj_veliki','zacin_biber','zacin_tucana','zacin_lovor','kal_01_tegla_mala','zacin_paprika','kal_01_mleveno_nadev','kal_01_tegla_velika'].forEach(function(k){ART[k]='assets/ui/predmeti/n_'+k+'.png';});
window.CooksterItemArt=ART;        // the same pictures in the rack (js/recent-items.js)
var FILTS=[['all','Sve'],['pots','Posuđe'],['tools','Alati'],['spice','Začini'],['other','Ostalo']];
function kind(d){var c=d.category||d.type;if(/^zacin_/.test(d.id))return'spice';if(c==='cookware'||c==='container')return'pots';if(c==='tool'||/kasika|oklagija|cediljka|noz|daska$/.test(d.id))return'tools';return'other';}
function css(x,y,w,h){return'left:'+x/16+'%;top:'+y/11+'%;width:'+w/16+'%;height:'+h/11+'%;';}
var root,sc;
function el(t,c,s,txt){var e=document.createElement(t);if(c)e.className=c;if(s)e.style.cssText=s;if(txt!=null)e.textContent=txt;return e;}
function defs(){
  var all=(typeof KITCHEN_EQUIPMENT!=='undefined'?KITCHEN_EQUIPMENT:[]).filter(function(d){return d.category!=='drink'&&d.id!=='kal_01_list_kupusa';});
  var own=ownedKitchenEquipment();
  var l=all.filter(function(d){return TAB==='own'?own.indexOf(d.id)>=0:(!d.starter&&own.indexOf(d.id)<0);});
  if(FILT!=='all')l=l.filter(function(d){return kind(d)===FILT;});
  if(Q)l=l.filter(function(d){return (d.label||'').toLowerCase().indexOf(Q)>=0;});
  return l;
}
function build(){
  root=el('div');root.id='kePg';
  var bg=el('img','pg-bg');bg.src=P+'strana_kuhinjski_elementi_prazna.webp?v=2';bg.alt='';root.appendChild(bg);
  root.addEventListener('click',function(e){e.stopPropagation();});
  sc.appendChild(root);
  sc.addEventListener('click',function(e){if(e.target===sc)close();});
}
function close(){try{closeKitchenElements();}catch(_){sc.classList.remove('open');}}
function render(){
  if(!root)build();
  Array.prototype.slice.call(root.children).forEach(function(c){if(!c.classList.contains('pg-bg'))root.removeChild(c);});
  var A=function(c,x,y,w,h,txt){var e=el('div','pg-a '+c,css(x,y,w,h),txt);root.appendChild(e);return e;};
  // The page picture already has the tabs and the pills drawn (first tab and first pill red). Here only text lies over them; to show another choice the drawn
  // red / pale piece is copied from the same page picture over the right place (crop), so nothing new is drawn.
  var PG=P+'strana_kuhinjski_elementi_prazna.webp?v=2';
  function crop(x,y,w,h,sx,sy,sw,sh){var e=A('pg-crop',x,y,w,h);e.style.background='url('+PG+') '+(sx/(1600-sw)*100)+'% '+(sy/(1100-sh)*100)+'%/'+(1600/sw*100)+'% '+(1100/sh*100)+'% no-repeat';return e;}
  var RT=[94,194,340,66],PT=[438,194,318,66],RP=[90,276,128,52],PP=[230,276,130,52];
  if(TAB==='shop'){crop(96,194,334,64,PT[0],PT[1],PT[2],PT[3]);crop(440,194,316,64,RT[0],RT[1],RT[2],RT[3]);}
  var t1=A('pg-tab'+(TAB==='own'?' on':''),96,194,334,64,'Moja kuhinja');
  t1.onclick=function(){TAB='own';render();};
  var t2=A('pg-tab'+(TAB==='shop'?' on':''),440,194,316,64,'Prodavnica');
  t2.onclick=function(){TAB='shop';render();};
  var pw=[[94,120],[234,122],[376,124],[530,138],[690,138]];
  FILTS.forEach(function(f,i){
    if(FILT===f[0]&&i>0)crop(pw[i][0]-4,276,pw[i][1]+8,52,RP[0],RP[1],RP[2],RP[3]);
    if(i===0&&FILT!=='all')crop(pw[0][0]-4,276,pw[0][1]+8,52,PP[0],PP[1],PP[2],PP[3]);
    var p=A('pg-pill'+(FILT===f[0]?' on':''),pw[i][0],280,pw[i][1],44,f[1]);p.onclick=function(){FILT=f[0];render();};});
  var s=A('pg-search',1084,202,424,46);var inp=el('input');inp.placeholder='Traži';inp.value=Q;inp.oninput=function(){Q=inp.value.trim().toLowerCase();list();};s.appendChild(inp);
  var m=A('pg-money',1262,90,146,50);m.textContent=(typeof money!=='undefined'?money:0)+' дин';
  A('pg-btn',1470,90,60,56).onclick=close;
  var b=A('pg-back',94,990,188,46,'Nazad');b.onclick=close;
  var L=A('pg-list',94,340,966,620);L.id='kePgList';
  var cd=el('div','pg-card');root.appendChild(cd);buildRack(cd);
  list();
}
function list(){
  var L=document.getElementById('kePgList');if(!L)return;L.innerHTML='';
  var ds=defs();
  if(!ds.length)L.appendChild(el('div','pg-empty','',TAB==='own'?'Nema takvih elemenata.':'Prodavnica je prazna.'));
  var own=ownedKitchenEquipment();
  ds.forEach(function(d){
    var onT=false;try{onT=!d.infinite&&equipmentIsInKitchen(d.id);}catch(_){}
    var inR=rackIds().indexOf(d.id)>=0;
    if(inR&&TAB==='own')onT=true;
    var t=el('div','pg-tile'+(onT&&TAB==='own'?' dim':'')+(SEL&&SEL.id===d.id?' sel':''));
    var im=el('img','im');im.src=ART[d.id]||d.src;im.alt='';im.draggable=false;t.appendChild(im);
    t.setAttribute('aria-label',d.label);      // no name on the card: only the picture (the name is on the big card on the right)
    if(inR&&TAB==='own')t.appendChild(el('div','tg','','U RANCU'));
    if(TAB==='shop'){t.classList.add('shop');t.appendChild(el('div','tg','',(typeof FREE_MODE!=='undefined'&&FREE_MODE)?'BESPLATNO':(d.price||0)+' дин'));}
    t.onmouseenter=function(){SEL=d;card();Array.prototype.forEach.call(L.children,function(c){c.classList.toggle('sel',c===t);});};
    t.onclick=function(){if(Date.now()-justDragged<350)return;act(d,onT);};
    t.addEventListener('pointerdown',function(e){if(TAB!=='own'||e.button!==0||onT)return;beginDrag(e,{from:'list',id:d.id,label:d.label});});
    L.appendChild(t);
  });
  if(!SEL||ds.indexOf(SEL)<0)SEL=ds[0]||null;
  card();
}
function act(d,onT){
  if(TAB==='shop'){var pr=+d.price||0;if(money<pr){showToast('Nema dovoljno novca.');return;}
    setMoney(money-pr);CooksterState.progression.kitchenEquipment.push(d.id);showToast('Kupljeno: '+d.label+'.');try{renderKitchenElements();}catch(_){}render();return;}
  if(onT){showToast(rackIds().indexOf(d.id)>=0?'Već je u rancu.':'Već je na radnoj površini.');return;}
  if(spawnKitchenEquipment(d.id)){close();try{updateHover();}catch(_){}}
}
function card(){
  var c=root.querySelector('.pg-card');if(!c)return;
  Array.prototype.slice.call(c.children).forEach(function(x){if(!x.classList.contains('pg-rack'))c.removeChild(x);});
  var d=SEL;c.classList.toggle('empty',!d);
  var bg=el('img','cbg');bg.src=P+'kartica_opis_ranac.png';bg.alt='';c.insertBefore(bg,c.firstChild);
  if(!d)return;
  var im=el('img','cim');im.src=ART[d.id]||d.src;im.alt='';c.insertBefore(im,c.querySelector('.pg-rack'));
  c.insertBefore(el('div','cnm','',d.label),c.querySelector('.pg-rack'));
  c.insertBefore(el('div','cds','',d.desc||d.description||''),c.querySelector('.pg-rack'));
  var cap=d.capacityMl?d.capacityMl+' ml':'—';
  c.insertBefore(el('div','cr','top:59.4%;',cap),c.querySelector('.pg-rack'));
  var onT=false;try{onT=!d.infinite&&equipmentIsInKitchen(d.id);}catch(_){}
  c.insertBefore(el('div','cr','top:66.4%;',TAB==='shop'?'U prodavnici':(rackIds().indexOf(d.id)>=0?'U rancu':(onT?'Na stolu':'U elementima'))),c.querySelector('.pg-rack'));
}
// ---- the rack in the card: six transparent squares (3 above, 3 below) = the six pockets of the rack at the bottom of the screen.
// Drag a card from the list onto a square: the thing goes into the rack (at that place). Drag a thing from a square onto another square: it moves; drag it out onto the list (or the right
// mouse button on it: "Skloni iz ranca"): it leaves the rack. The rack at the bottom changes by itself (js/recent-items.js).
var RK_X=[32.0,51.0,70.0],RK_Y=[71.3,82.9];      // the squares drawn in the card picture (percent of the card)
function buildRack(cd){
  var rk=el('div','pg-rack');cd.appendChild(rk);
  for(var i=0;i<6;i++){
    var sl=el('div','rk-slot','left:'+RK_X[i%3]+'%;top:'+RK_Y[(i/3)|0]+'%;');sl.dataset.i=String(i);
    sl.addEventListener('pointerdown',function(e){var i=+this.dataset.i,id=rackIds()[i];if(!id||e.button!==0)return;beginDrag(e,{from:'slot',idx:i,id:id});});
    sl.addEventListener('contextmenu',function(e){e.preventDefault();e.stopPropagation();try{CooksterRecentItems.menu(+this.dataset.i,e.clientX,e.clientY);}catch(_){}});
    rk.appendChild(sl);
  }
  refreshRack();
}
function rackIds(){try{return CooksterRecentItems.get();}catch(_){return [];}}
function artOf(id){var d=null;try{d=kitchenEquipmentDef(id);}catch(_){}return ART[id]||(d&&d.src)||'';}
var rackKey='';
function refreshRack(){
  var ids=rackIds(),key=ids.join('|');if(key===rackKey&&document.querySelector('#kePg .rk-slot img'))return;rackKey=key;
  var slots=document.querySelectorAll('#kePg .rk-slot');
  Array.prototype.forEach.call(slots,function(sl,i){
    sl.innerHTML='';var id=ids[i];sl.classList.toggle('full',!!id);
    if(id){var im=el('img');im.src=artOf(id);im.alt='';im.draggable=false;sl.appendChild(im);}
  });
}
var DRAG=null,justDragged=0;
function beginDrag(e,info){
  var x0=e.clientX,y0=e.clientY,started=false,ghost=null;
  function slotAt(x,y){var t=document.elementFromPoint(x,y);return t&&t.closest?t.closest('.rk-slot'):null;}
  function mv(ev){
    if(!started){if(Math.abs(ev.clientX-x0)+Math.abs(ev.clientY-y0)<7)return;started=true;DRAG=info;
      ghost=el('img','rk-ghost');ghost.src=artOf(info.id);ghost.draggable=false;document.body.appendChild(ghost);document.body.classList.add('rk-dragging');}
    ghost.style.left=ev.clientX+'px';ghost.style.top=ev.clientY+'px';
    var sl=slotAt(ev.clientX,ev.clientY);
    Array.prototype.forEach.call(document.querySelectorAll('#kePg .rk-slot'),function(q){q.classList.toggle('over',q===sl);});
    var L=document.getElementById('kePgList');var inList=!!(L&&L.contains(document.elementFromPoint(ev.clientX,ev.clientY)));
    document.body.classList.toggle('rk-removing',info.from==='slot'&&inList);
  }
  function up(ev){
    document.removeEventListener('pointermove',mv,true);document.removeEventListener('pointerup',up,true);document.removeEventListener('pointercancel',up,true);
    if(!started)return;
    justDragged=Date.now();
    var sl=slotAt(ev.clientX,ev.clientY),L=document.getElementById('kePgList'),inList=!!(L&&L.contains(document.elementFromPoint(ev.clientX,ev.clientY)));
    try{
      if(info.from==='list'){if(sl){var full=rackIds().length>=6&&rackIds().indexOf(info.id)<0;if(full)showToast('Ranac je pun.');else if(CooksterRecentItems.put(info.id,+sl.dataset.i))showToast('U ranac: '+(info.label||'')+'.');}}
      else{if(sl)CooksterRecentItems.move(info.idx,+sl.dataset.i);else if(inList){CooksterRecentItems.remove(info.idx);showToast('Skinuto iz ranca.');}}
    }catch(_){}
    if(ghost)ghost.remove();DRAG=null;document.body.classList.remove('rk-dragging','rk-removing');
    Array.prototype.forEach.call(document.querySelectorAll('#kePg .rk-slot'),function(q){q.classList.remove('over');});
    rackKey='';refreshRack();
  }
  document.addEventListener('pointermove',mv,true);document.addEventListener('pointerup',up,true);document.addEventListener('pointercancel',up,true);
}
function sync(){
  var open=sc.classList.contains('open')&&(typeof kitchenPanelMode==='undefined'||kitchenPanelMode==='equipment');
  document.body.classList.toggle('ke-pg-on',open);
  if(open)render();
}
function init(){
  sc=document.getElementById('kitchenElementsScene');if(!sc)return;
  new MutationObserver(sync).observe(sc,{attributes:true,attributeFilter:['class']});
  // game.js catches the wheel on this whole window (capture, on the scene) and scrolls only the columns of the old card, so the list would never move. This listener is added first,
  // on the scene itself (core/tool-shield.js only wraps listeners on window/document), so it runs before that one and scrolls the list.
  sc.addEventListener('wheel',function(e){
    if(!document.body.classList.contains('ke-pg-on'))return;
    var L=document.getElementById('kePgList');if(!L||!L.contains(e.target))return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();L.scrollTop+=e.deltaY;
  },{capture:true,passive:false});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&document.body.classList.contains('ke-pg-on'))close();});
  setInterval(function(){if(document.body.classList.contains('ke-pg-on'))refreshRack();},250);
  sync();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
