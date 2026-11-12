/* Kuhinjski elementi, parchment style. Takes over the old window (the old card is hidden by css/ke-pergament.css) only for the equipment list; drinks keep the old window.
   Page picture: assets/ui/pergament/strana_kuhinjski_elementi_prazna.webp (1600x1100). The description card on the right shows the thing under the mouse (the last one,
   it stays so the button can be reached); its red button "Stavi u ranac" puts the thing into the rack (CooksterRecentItems.push). ?starihud keeps the old window. */
(function(){
if(/[?&]starihud/.test(location.search))return;
var P='assets/ui/pergament/',ART={},SEL=null,TAB='own',FILT='all',Q='';
['daska_serviranje','kal_01_okrugli_pleh','kal_02_cediljka','kal_02_cinija_mala','kal_02_drvena_kasika','kal_02_duboki_tanjir','kal_02_oklagija','tiganj_mali','vangla_mala'].forEach(function(k){ART[k]='assets/ui/predmeti/'+k+'.png';});
['oval_tanjir','kal_01_okrugli_pleh_poklopac','kal_01_pravougaoni_pleh','kal_02_tanjir_ravni','vangla_srednja','kal_02_cinija_velika','serpa_velika','lavor_emajl_veliki','tiganj_veliki','zacin_biber','zacin_tucana','zacin_lovor','kal_01_tegla_mala','zacin_paprika','kal_01_mleveno_nadev','kal_01_tegla_velika'].forEach(function(k){ART[k]='assets/ui/predmeti/n_'+k+'.png';});
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
  var bg=el('img','pg-bg');bg.src=P+'strana_kuhinjski_elementi_prazna.webp';bg.alt='';root.appendChild(bg);
  root.addEventListener('click',function(e){e.stopPropagation();});
  sc.appendChild(root);
  sc.addEventListener('click',function(e){if(e.target===sc)close();});
}
function close(){try{closeKitchenElements();}catch(_){sc.classList.remove('open');}}
function render(){
  if(!root)build();
  Array.prototype.slice.call(root.children).forEach(function(c){if(!c.classList.contains('pg-bg'))root.removeChild(c);});
  var A=function(c,x,y,w,h,txt){var e=el('div','pg-a '+c,css(x,y,w,h),txt);root.appendChild(e);return e;};
  var t1=A('pg-tab'+(TAB==='own'?' on':''),96,194,334,64,'Moja kuhinja');t1.style.background=TAB==='own'?'#b24a2c':'#ecd9b5';t1.style.color=TAB==='own'?'#fff3dc':'#7a4a2a';t1.style.borderRadius='1.2cqw 1.2cqw 0 0';
  t1.onclick=function(){TAB='own';render();};
  var t2=A('pg-tab'+(TAB==='shop'?' on':''),440,194,316,64,'Prodavnica');t2.style.background=TAB==='shop'?'#b24a2c':'#ecd9b5';t2.style.color=TAB==='shop'?'#fff3dc':'#7a4a2a';t2.style.borderRadius='1.2cqw 1.2cqw 0 0';
  t2.onclick=function(){TAB='shop';render();};
  var pw=[[94,120],[234,122],[376,124],[530,138],[690,138]];
  FILTS.forEach(function(f,i){var p=A('pg-pill'+(FILT===f[0]?' on':''),pw[i][0],280,pw[i][1],44,f[1]);p.style.background=FILT===f[0]?'#b24a2c':'#f1dfbb';p.onclick=function(){FILT=f[0];render();};});
  var s=A('pg-search',1084,202,424,46);var inp=el('input');inp.placeholder='Traži';inp.value=Q;inp.oninput=function(){Q=inp.value.trim().toLowerCase();list();};s.appendChild(inp);
  var m=A('pg-money',1262,90,146,50);m.textContent=(typeof money!=='undefined'?money:0)+' дин';
  A('pg-btn',1470,90,60,56).onclick=close;
  var b=A('pg-back',94,990,188,46,'Nazad');b.onclick=close;
  var L=A('pg-list',94,340,966,620);L.id='kePgList';
  var cd=el('div','pg-card');root.appendChild(cd);
  list();
}
function list(){
  var L=document.getElementById('kePgList');if(!L)return;L.innerHTML='';
  var ds=defs();
  if(!ds.length)L.appendChild(el('div','pg-empty','',TAB==='own'?'Nema takvih elemenata.':'Prodavnica je prazna.'));
  var own=ownedKitchenEquipment();
  ds.forEach(function(d){
    var onT=false;try{onT=!d.infinite&&equipmentIsInKitchen(d.id);}catch(_){}
    var t=el('div','pg-tile'+(onT&&TAB==='own'?' dim':'')+(SEL&&SEL.id===d.id?' sel':''));
    var im=el('img','im');im.src=ART[d.id]||d.src;im.alt='';im.draggable=false;t.appendChild(im);
    t.setAttribute('aria-label',d.label);      // no name on the card: only the picture (the name is on the big card on the right)
    if(TAB==='shop'){t.classList.add('shop');t.appendChild(el('div','tg','',(typeof FREE_MODE!=='undefined'&&FREE_MODE)?'BESPLATNO':(d.price||0)+' дин'));}
    t.onmouseenter=function(){SEL=d;card();Array.prototype.forEach.call(L.children,function(c){c.classList.toggle('sel',c===t);});};
    t.onclick=function(){act(d,onT);};
    L.appendChild(t);
  });
  if(!SEL||ds.indexOf(SEL)<0)SEL=ds[0]||null;
  card();
}
function act(d,onT){
  if(TAB==='shop'){var pr=+d.price||0;if(money<pr){showToast('Nema dovoljno novca.');return;}
    setMoney(money-pr);CooksterState.progression.kitchenEquipment.push(d.id);showToast('Kupljeno: '+d.label+'.');try{renderKitchenElements();}catch(_){}render();return;}
  if(onT){showToast('Već je na radnoj površini.');return;}
  if(spawnKitchenEquipment(d.id)){close();try{updateHover();}catch(_){}}
}
function card(){
  var c=root.querySelector('.pg-card');if(!c)return;c.innerHTML='';
  var d=SEL;c.classList.toggle('empty',!d);
  var bg=el('img','cbg');bg.src=P+'kartica_opis_ikone.png';bg.alt='';c.appendChild(bg);
  if(!d)return;
  var im=el('img','cim');im.src=ART[d.id]||d.src;im.alt='';c.appendChild(im);
  c.appendChild(el('div','cnm','',d.label));
  c.appendChild(el('div','cds','',d.desc||d.description||''));
  var cap=d.capacityMl?d.capacityMl+' ml':'—';
  c.appendChild(el('div','cr','top:59.4%;',cap));
  var onT=false;try{onT=!d.infinite&&equipmentIsInKitchen(d.id);}catch(_){}
  c.appendChild(el('div','cr','top:66.4%;',TAB==='shop'?'U prodavnici':(onT?'Na stolu':'U elementima')));
  var g=el('div','cgo','','Stavi u ranac');
  g.onclick=function(){if(TAB==='shop'){showToast('Prvo kupi ovaj element.');return;}
    try{CooksterRecentItems.push(d.id);showToast('U ranac: '+d.label+'.');}catch(_){}};
  c.appendChild(g);
}
function sync(){
  var open=sc.classList.contains('open')&&(typeof kitchenPanelMode==='undefined'||kitchenPanelMode==='equipment');
  document.body.classList.toggle('ke-pg-on',open);
  if(open)render();
}
function init(){
  sc=document.getElementById('kitchenElementsScene');if(!sc)return;
  new MutationObserver(sync).observe(sc,{attributes:true,attributeFilter:['class']});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&document.body.classList.contains('ke-pg-on'))close();});
  sync();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
