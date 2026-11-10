/* Cookster: kese na kukama levog zida + alat "Kese" za podesavanje.
   Slika: assets/ui/wall/kesa.webp (198x300; petlja ruckica je gore, na 47.7% sirine). Svaka kesa: x,y = tacka O KOJU VISI (vrh petlje, na kuglici kuke) u koordinatama scene,
   h = visina px, rz = njihanje/rotacija oko te tacke, rx = nagib gore-dole, ry = nagib levo-desno (stepeni), p = perspektiva.
   Alat "🛍 Kese": povuci kesu misem, klizaci, strelice (1 px, Shift 5), Dodaj/Duplikat/Obrisi/Kopiraj JSON/Izvezi fajl/Resetuj. Cuva u localStorage 'cookster.wall-bags.v1'.
   Dok alat nije povezan sa pijacom, kese se vide samo dok je alat otvoren (checkbox "Prikazi kese"). */
(function(){
'use strict';
if(window.CooksterWallBags)return;
var KEY='cookster.wall-bags.v3',IMG_W=198,IMG_H=300,APEX=.477,SRC='assets/ui/wall/kesa.webp?v=2';
var DEFAULTS=[{"x":113.4,"y":297.2,"h":73,"rz":-11.5,"rx":0,"ry":12.3,"p":500},{"x":97.8,"y":333.5,"h":76,"rz":-13,"rx":0,"ry":9.3,"p":500},{"x":84.6,"y":368.4,"h":85,"rz":-11.5,"rx":0,"ry":10,"p":500},{"x":67.4,"y":402.2,"h":92,"rz":-12.5,"rx":0,"ry":10.8,"p":500},{"x":52.1,"y":433.6,"h":101,"rz":-14.5,"rx":0,"ry":11.5,"p":500},{"x":36.3,"y":463,"h":119,"rz":-12.5,"rx":0,"ry":1,"p":500}]   // tvoj izvoz iz alata (10.11.)
function defaults(){return JSON.parse(JSON.stringify(DEFAULTS));}
function norm(b){return {x:+b.x,y:+b.y,h:+b.h||72,rz:+b.rz||0,rx:+b.rx||0,ry:+b.ry||0,p:+b.p||500};}
var bags=[],els=[],sel=-1,open=false,showAll=true;
// kese koje stvarno vise (po jedna na kuku): slots[i] = zapis kese sa pijace ili null. Cuva se posebno u pregledacu.
var SLOTS_KEY='cookster.hanging-bags.v1',slots=[];
function loadSlots(){try{var r=JSON.parse(localStorage.getItem(SLOTS_KEY)||'null');if(Array.isArray(r))return r;}catch(e){}return [];}
function saveSlots(){try{localStorage.setItem(SLOTS_KEY,JSON.stringify(slots));}catch(e){}}
// slika kese po povrcu: assets/ui/wall/kesa_<productKey>.webp ako postoji, inace osnovna (salata)
var VEG_IMG={};   // kesa_<kljuc>.webp: sargarepa, paradajz, paprika_zelena, paprika_crvena, luk, krastavac, kupus, patlidzan, tikvice, rotkvice (fale: persun, beli_luk, mesano)
function imgFor(rec){var k=rec&&rec.productKey;return (k&&VEG_IMG[k])?VEG_IMG[k]:SRC;}
function probe(k){if(VEG_IMG[k]!==undefined)return;VEG_IMG[k]=null;var im=new Image(),u='assets/ui/wall/kesa_'+k+'.webp?v=1';im.onload=function(){VEG_IMG[k]=u;render();};im.src=u;}
function mixText(r){return (r.items||[]).map(function(x){return (x.label||x.productKey)+' '+qtyText(x);}).join(', ');}
function qtyText(r){var m=r.quantityMode==='bunch',v=m?(+r.quantityBunches||+r.quantityValue||1):(+r.quantityKg||+r.quantityValue||1);return m?(Math.round(v)+' vezica'):(v===.5?'500 g':(String(v).replace('.',',')+' kg'));}
function load(){
  try{var r=JSON.parse(localStorage.getItem(KEY)||'null');if(Array.isArray(r)&&r.length)return r.filter(function(b){return b&&isFinite(b.x)&&isFinite(b.y);}).map(norm);}catch(e){}
  return defaults();
}
function save(){try{localStorage.setItem(KEY,JSON.stringify(bags));}catch(e){}}
function paint(b,el){
  var H=b.h,W=H*IMG_W/IMG_H;
  el.style.height=H+'px';el.style.width=W+'px';el.style.left=(b.x-W*APEX)+'px';el.style.top=b.y+'px';
  el.style.transformOrigin=(APEX*100)+'% 0%';
  el.style.transform='perspective('+b.p+'px) rotateX('+b.rx+'deg) rotateY('+b.ry+'deg) rotateZ('+b.rz+'deg)';
}
function render(){
  var sc=document.getElementById('scene');if(!sc)return;
  els.forEach(function(e){e.remove();});els=[];
  bags.forEach(function(b,i){
    var el=document.createElement('img');el.className='wall-bag';el.draggable=false;el.src=SRC;el.alt='';
    el.style.cssText='position:absolute;z-index:4;filter:drop-shadow(1px 2px 2px rgba(30,12,0,.5));display:'+(((open&&showAll)||slots[i])?'block':'none')+';pointer-events:'+((open||slots[i])?'auto':'none')+';cursor:'+(open?'move':(slots[i]?'pointer':'default'));
    if(slots[i]){el.src=imgFor(slots[i]);el.title=slots[i].mixed?('Mesano povrce: '+mixText(slots[i])+' — dole: jedno povrce, gore (rucke): cela kesa'):((slots[i].label||'Kesa')+' · '+qtyText(slots[i])+' · '+countOf(slots[i])+' kom. — dole: jedno povrce, gore (rucke): cela kesa');}
    paint(b,el);
    el.addEventListener('click',function(e){if(open||!slots[i])return;e.preventDefault();e.stopPropagation();var r=el.getBoundingClientRect();((e.clientY-r.top)/Math.max(1,r.height)<.26)?takeWhole(i):take(i);});
    el.addEventListener('pointerdown',function(e){if(!open||e.button!==0)return;e.preventDefault();e.stopPropagation();select(i);
      var s0=screenToScene(e.clientX,e.clientY),x0=b.x,y0=b.y;
      function mv(ev){var s=screenToScene(ev.clientX,ev.clientY);b.x=+(x0+s.x-s0.x).toFixed(1);b.y=+(y0+s.y-s0.y).toFixed(1);paint(b,el);syncRows();}
      function up(){window.removeEventListener('pointermove',mv);window.removeEventListener('pointerup',up);save();}
      window.addEventListener('pointermove',mv);window.addEventListener('pointerup',up);},true);
    sc.appendChild(el);els.push(el);
  });
  mark();
}
function mark(){els.forEach(function(e,i){e.style.outline=(open&&i===sel)?'2px dashed #22c55e':'';e.style.outlineOffset='2px';});}

var panel=null,btn=null,rows={};
var CTRL=[['h','Veličina (visina px)',20,240,1],['rz','Rotacija (njihanje)',-60,60,.5],['rx','Nagib gore-dole',-70,70,.5],['ry','Nagib levo-desno',-70,70,.5],['p','Perspektiva',100,1500,10]];
function select(i){sel=i;syncRows();mark();}
function syncRows(){
  var b=bags[sel];if(!panel)return;
  panel.querySelector('.wb-st').textContent=b?('Kesa '+(sel+1)+' / '+bags.length+' · x '+b.x+' · y '+b.y):('Nijedna kesa nije izabrana ('+bags.length+' kesa). Klikni kesu.');
  CTRL.forEach(function(c){var r=rows[c[0]];r.range.disabled=r.num.disabled=!b;if(b){r.range.value=b[c[0]];r.num.value=b[c[0]];}});
}
function buildPanel(){
  if(panel)return;
  var css=document.createElement('style');
  css.textContent='#wbPanel{position:fixed;left:10px;bottom:60px;z-index:2147483000;width:292px;padding:10px 12px;border-radius:12px;border:2px solid #351b0d;background:#fff4dc;color:#351b0d;font:13px system-ui,sans-serif;display:none;box-shadow:0 8px 24px rgba(0,0,0,.4)}'
   +'#wbPanel b{font-size:14px}#wbPanel .wb-st{margin:4px 0 8px;font-size:12px;color:#6b4a28}#wbPanel label{display:block;margin:5px 0 0;font-weight:700;font-size:12px}'
   +'#wbPanel .wb-r{display:flex;gap:6px;align-items:center}#wbPanel input[type=range]{flex:1}#wbPanel input[type=number]{width:62px}'
   +'#wbPanel .wb-b{display:flex;flex-wrap:wrap;gap:5px;margin-top:9px}#wbPanel button{padding:5px 8px;border:2px solid #351b0d;border-radius:8px;background:#e8c27a;color:#351b0d;font:700 12px system-ui,sans-serif;cursor:pointer}'
   +'#wbBtn{position:fixed;left:10px;bottom:20px;z-index:2147483000;padding:7px 11px;border-radius:9px;border:2px solid #351b0d;background:#e8c27a;color:#351b0d;font:700 13px system-ui,sans-serif;cursor:pointer}';
  document.head.appendChild(css);
  panel=document.createElement('div');panel.id='wbPanel';panel.setAttribute('data-tool-ui','1');
  panel.innerHTML='<b>🛍 Kese</b><div class="wb-st"></div><label style="font-weight:600"><input type="checkbox" class="wb-show" checked> Prikaži kese</label>';
  panel.querySelector('.wb-show').addEventListener('change',function(e){showAll=e.target.checked;render();});
  CTRL.forEach(function(c){
    var l=document.createElement('label');l.textContent=c[1];var w=document.createElement('div');w.className='wb-r';
    var rg=document.createElement('input');rg.type='range';rg.min=c[2];rg.max=c[3];rg.step=c[4];
    var nm=document.createElement('input');nm.type='number';nm.min=c[2];nm.max=c[3];nm.step=c[4];
    function set(v){var b=bags[sel];if(!b)return;v=+v;if(!isFinite(v))return;b[c[0]]=v;rg.value=v;nm.value=v;paint(b,els[sel]);save();}
    rg.addEventListener('input',function(){set(rg.value);});nm.addEventListener('change',function(){set(nm.value);});
    w.append(rg,nm);panel.append(l,w);rows[c[0]]={range:rg,num:nm};
  });
  var bs=document.createElement('div');bs.className='wb-b';panel.appendChild(bs);
  function B(t,f){var x=document.createElement('button');x.type='button';x.textContent=t;x.onclick=f;bs.appendChild(x);}
  B('Dodaj',function(){var b=bags[sel]||{x:60,y:380,h:72,rz:0,rx:0,ry:0,p:500};bags.push(norm({x:b.x+16,y:b.y+33,h:b.h,rz:b.rz,rx:b.rx,ry:b.ry,p:b.p}));sel=bags.length-1;save();render();syncRows();});
  B('Duplikat',function(){if(!bags[sel])return;var b=bags[sel];bags.push(norm({x:b.x+12,y:b.y+12,h:b.h,rz:b.rz,rx:b.rx,ry:b.ry,p:b.p}));sel=bags.length-1;save();render();syncRows();});
  B('Obriši',function(){if(!bags[sel])return;bags.splice(sel,1);sel=Math.min(sel,bags.length-1);save();render();syncRows();});
  B('Kopiraj JSON',function(){var t=JSON.stringify(bags);try{navigator.clipboard.writeText(t);}catch(e){}window.prompt('JSON kesa (Ctrl+C):',t);});
  B('Izvezi fajl',function(){var d={version:1,tool:'cookster-wall-bags',exportedAt:new Date().toISOString(),image:{w:IMG_W,h:IMG_H,apexX:APEX},scene:{w:1672,h:941},bags:bags};
    var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(d,null,2)],{type:'application/json'}));a.download='cookster-wall-bags.json';document.body.appendChild(a);a.click();setTimeout(function(){a.remove();URL.revokeObjectURL(a.href);},500);});
  B('Resetuj',function(){bags=defaults();sel=0;save();render();syncRows();});
  B('Zatvori',function(){toggle(false);});
  document.body.appendChild(panel);
  btn=document.createElement('button');btn.id='wbBtn';btn.type='button';btn.textContent='🛍 Kese';btn.setAttribute('data-tool-ui','1');btn.onclick=function(){toggle(!open);};document.body.appendChild(btn);
  window.addEventListener('keydown',function(e){
    if(!open||sel<0||!bags[sel]||/INPUT|TEXTAREA/.test((e.target&&e.target.tagName)||''))return;
    var d=e.shiftKey?5:1,b=bags[sel],m=true;
    if(e.key==='ArrowLeft')b.x-=d;else if(e.key==='ArrowRight')b.x+=d;else if(e.key==='ArrowUp')b.y-=d;else if(e.key==='ArrowDown')b.y+=d;else m=false;
    if(m){e.preventDefault();paint(b,els[sel]);save();syncRows();}
  });
}
function toggle(v){
  open=!!v;buildPanel();panel.style.display=open?'block':'none';
  if(open&&sel<0&&bags.length)sel=0;
  render();syncRows();
}
// klik na okacenu kesu: komad povrca ODMAH izlazi u ruku (kao iz kese na stolu); kesa se prazni, a prazna nestaje sa kuke
function countOf(r){var c=+r.count;if(isFinite(c)&&c>=0)return c;try{var m=r.quantityMode==='bunch'?'bunch':'kg',v=m==='bunch'?(+r.quantityBunches||+r.quantityValue||1):(+r.quantityKg||+r.quantityValue||1);return marketBagUnitCount(r.productKey,v,m);}catch(e){return 1;}}
function vegKeyOf(r){try{return MARKET_PRODUCT_TO_VEG[r.productKey]||(VEGETABLES[r.productKey]?r.productKey:'');}catch(e){return '';}}
// klik na RUCKE kese (gornja cetvrtina, uz kuku): cela kesa u ruku (moze na sto); mesana kesa se tada prosipa na sto
function takeWhole(i){
  var rec=slots[i];if(!rec)return;
  try{if(typeof holding!=='undefined'&&holding){showToast('Prvo spusti predmet iz ruke.');return;}}catch(e){}
  slots[i]=null;saveSlots();render();
  try{
    if(rec.mixed){(rec.items||[]).forEach(function(r,k){if(countOf(r)>0)makeMarketBag(r,k);});showToast('Iz mesane kese je izvadjeno '+(rec.items||[]).length+' kesa na sto.');CooksterSave.schedule();return;}
    var el=makeMarketBag(rec,0);if(!el)return;
    var sp=screenToScene(mouse.x,mouse.y);el.style.visibility='hidden';
    setPose(el,sp.x,sp.y,surfaceScaleFor(el,'table',sp.y));startHolding(el);CooksterSave.schedule();
  }catch(e){}
}
function take(i){
  var rec=slots[i];if(!rec)return;
  try{if(typeof holding!=='undefined'&&holding){showToast('Prvo spusti predmet iz ruke.');return;}}catch(e){}
  var src=rec;
  if(rec.mixed){src=null;(rec.items||[]).forEach(function(r){if(!src&&countOf(r)>0)src=r;});if(!src){slots[i]=null;saveSlots();render();return;}}
  var veg=null,vk=vegKeyOf(src);try{veg=VEGETABLES[vk];}catch(e){}
  if(!veg){try{showToast((src.label||'Ova namirnica')+' jos nema svoj kuhinjski sprite.');}catch(e){}return;}
  var left=countOf(src)-1;src.count=Math.max(0,left);
  if(src.count<=0){
    if(rec.mixed){rec.items=rec.items.filter(function(r){return countOf(r)>0;});if(!rec.items.length)slots[i]=null;}
    else slots[i]=null;
  }
  saveSlots();render();
  try{
    var sp=screenToScene(mouse.x,mouse.y);
    var loose=makeItem({id:'veg_'+vk+'_'+Date.now(),label:veg.label,src:veg.src,x:sp.x-veg.w/2,y:sp.y-veg.h,w:veg.w,h:veg.h,z:++zCounter,snapProfile:'produce'});
    loose.dataset.vegetable='1';loose.dataset.collisionProfile='vegetable';loose.dataset.vegKey=vk;loose.dataset.cutState='whole';loose.dataset.surfaceZone='table';
    loose.style.visibility='hidden';
    setPose(loose,sp.x,sp.y,surfaceScaleFor(loose,'table',sp.y));startHolding(loose);
    showToast(veg.label+' — izvađen iz kese.');CooksterSave.schedule();
  }catch(e){}
}
// okaci kese na slobodne kuke; ako ih ima vise nego kuka, visak ide u JEDNU mesanu kesu na poslednjoj slobodnoj kuki (ili u vec okacenu mesanu)
function mixedOf(items){return {id:'mixed_'+Date.now(),mixed:true,productKey:'mesano',label:'Mesano povrce',items:items};}
function hang(records){
  var list=(records||[]).filter(Boolean),free=[];
  for(var i=0;i<bags.length;i++)if(!slots[i])free.push(i);
  var mi=-1;for(var j=0;j<slots.length;j++)if(slots[j]&&slots[j].mixed){mi=j;break;}
  var direct=Math.min(list.length,free.length>0&&list.length>free.length?free.length-1:free.length);
  for(var d=0;d<direct;d++){slots[free[d]]=list[d];if(list[d].productKey)probe(list[d].productKey);}
  var over=list.slice(direct);
  if(over.length){
    if(mi>=0){slots[mi].items=(slots[mi].items||[]).concat(over);}
    else if(free.length>direct){slots[free[direct]]=mixedOf(over);}
    else{      // nema slobodne kuke: poslednja kesa se pretvara u mesanu zajedno sa novima
      var last=bags.length-1,prev=slots[last];slots[last]=mixedOf((prev?[prev]:[]).concat(over));
    }
    probe('mesano');
  }
  saveSlots();render();return [];
}
function init(){bags=load();slots=loadSlots();slots.length=Math.min(slots.length,bags.length);slots.forEach(function(r){if(r&&r.productKey)probe(r.productKey);});render();buildPanel();}
window.CooksterWallBags={get:function(){return bags;},render:render,open:function(){toggle(true);},hang:hang,take:take,takeWhole:takeWhole,slots:function(){return slots;}};
if(document.readyState==='complete')init();else window.addEventListener('load',init);
})();
