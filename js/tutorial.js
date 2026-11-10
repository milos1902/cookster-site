/* Cookster: uputstvo koje vodi Baba Savka. Poruke izlaze u okviru gore, a animirana strelica (blago ide gore-dole) pokazuje gde da se klikne.
   Koraci se sami prebacuju kad igrac uradi trazeno (provera stanja u igri, ne klikovi na dugme "Dalje"). Uvek se moze preskociti.
   Ukljucuje se: dodaj ?uputstvo u adresu (npr. index.html?uputstvo), ili CooksterTutorial.start(). Dok uputstvo nije gotovo, ne pali se samo od sebe.
   Stanje: localStorage 'cookster.tutorial.v1' {i: korak, done: bool}. Prvi deo: srpska salata (do kupovine na pijaci). */
(function(){
'use strict';
if(window.CooksterTutorial)return;
var KEY='cookster.tutorial.v1';
var st={i:0,done:false};
try{var s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s.i==='number')st={i:s.i,done:!!s.done};}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(st));}catch(e){}}
var $=function(q){return document.querySelector(q);};
function body(c){return document.body.classList.contains(c);}
function rectOf(el){if(!el)return null;var r=el.getBoundingClientRect();return r.width>1&&r.height>1?r:null;}
function dockOpen(){var d=$('#cdock');return !!d&&d.classList.contains('cd-open');}
function plateRect(){return rectOf($('#cdock .cd-box'));}
function dockBtn(title){var bs=document.querySelectorAll('#cdock .cd-b');for(var i=0;i<bs.length;i++){if(((bs[i].getAttribute('aria-label')||'')+' '+(bs[i].title||'')).indexOf(title)>=0)return rectOf(bs[i]);}return null;}

// ---------- stanje igre (za provere koraka) ----------
function allItems(){try{return items.slice();}catch(e){return [];}}
function vegs(key){return allItems().filter(function(e){return e.dataset&&e.dataset.vegKey===key&&e.dataset.marketBag!=='1';});}
function itemRect(id){var e=allItems().filter(function(x){return x.dataset.itemId===id;})[0];return e?rectOf(e.querySelector('.body')||e):null;}
function wallBagRect(){var b=document.querySelectorAll('.wall-bag');for(var i=0;i<b.length;i++){var r=rectOf(b[i]);if(r)return r;}return null;}
function bagsAnywhere(){try{if(CooksterWallBags.slots().some(Boolean))return true;}catch(e){}return allItems().some(function(e){return e.dataset.marketBag==='1';});}
function vegsInBags(key){try{return CooksterWallBags.slots().some(function(r){return r&&(r.productKey===key||(r.items||[]).some(function(x){return x.productKey===key;}));});}catch(e){return false;}}
function vessels(){return allItems().filter(function(e){try{return isContainerItem(e);}catch(x){return false;}});}
function bowlRect(){var v=vessels().filter(function(e){return /cinija|vangla/.test(e.dataset.itemId||'');})[0];return v?rectOf(v.querySelector('.body')||v):null;}
function contentKeys(v){var out=[];try{var m=CooksterPan.read(v);Object.keys(m.ingredients||{}).forEach(function(k){if(+m.ingredients[k]>0)out.push(k);});if(+(m.staples&&m.staples.oil)>0)out.push('ulje');if(+(m.staples&&m.staples.salt)>0)out.push('so');}catch(e){}try{var it=CooksterContainer.read(v).items||{};Object.keys(it).forEach(function(k){if((+it[k].count||0)>0)out.push(k);});}catch(e){}return out;}
function vesselHas(re){return vessels().some(function(v){return contentKeys(v).some(function(k){return re.test(k);});});}
function pans(){return vessels().filter(function(e){return /^(tiganj|kal_01_okrugli_pleh)/.test(e.dataset.itemId||'');});}
function panOnStove(){return pans().filter(function(e){return e.dataset.surfaceZone==='stove';})[0]||null;}
function panRect(){var p=panOnStove()||pans()[0];return p?rectOf(p.querySelector('.body')||p):null;}
function panModel(){var p=panOnStove();try{return p?CooksterPan.read(p):null;}catch(e){return null;}}
var bought=false;
function boughtNow(){var h=document.getElementById('marketHaggleStep');if(h&&h.classList.contains('active'))bought=true;return bought;}      // cenkanje je otvoreno = kupovina je pritisnuta
// ---------- koraci ----------
// text: sta Savka kaze; target: funkcija koja vraca pravougaonik (ekran) na koji strelica pokazuje; done: kad je korak gotov; button: "Dalje" umesto provere
var STEPS=[
  {id:'hello',button:'Dalje',text:'Dobro došao u moju kuhinju, sine. Hajde da skuvamo srpsku salatu, pa ću ti usput pokazati gde je šta.'},
  {id:'dock',text:'Pređi mišem preko drvenog polja dole levo, tamo gde je sat. Otvoriće se ikonice.',target:plateRect,done:function(){return dockOpen()||body('market-open');}},
  {id:'market',text:function(){return dockOpen()?'Klikni na pijacu, ikonicu sa tezgom. Treba nam povrće.':'Zadrži miš na drvenom polju sa satom, da se ikonice otvore.';},
   target:function(){return dockOpen()?(dockBtn('Pijaca')||plateRect()):plateRect();},done:function(){return body('market-open');}},
  {id:'pick',requires:function(){return body('market-open')?null:'market';},
   text:'Ovo je pijaca. Za salatu nam treba paradajz: klikni na gomilu paradajza.',
   target:function(){return rectOf($('#marketHoverLayer .market-pile[data-key="paradajz"]'));},
   done:function(){var c=document.getElementById('marketCartCount');return !!c&&(parseInt(c.textContent,10)||0)>0;}},
  {id:'buy',requires:function(){return (body('market-open')||boughtNow())?null:'market';},
   text:'Dobro! Paradajz je u korpi. Sad pritisni „Kupi sve“.',
   side:'below',
   target:function(){return rectOf(document.getElementById('marketCartBuy'));},
   done:function(){return boughtNow();}},
  {id:'accept',requires:function(){return (body('market-open')||boughtNow()||bagsAnywhere())?null:'market';},
   text:'Prodavac traži cenu. Možeš da se cenkaš, a možeš i odmah da pritisneš „Prihvati cenu“.',
   target:function(){return rectOf(document.getElementById('marketAcceptBtn'));},
   done:function(){return !body('market-open')&&bagsAnywhere();}},
  {id:'bag',text:'Kupljeno je u kesi koja visi na kuki levo. Klikni na donji deo kese da izvadiš paradajz.',
   target:function(){return wallBagRect();},done:function(){return vegs('paradajz').length>0;}},
  {id:'board',text:'Spusti paradajz na dasku (levi klik na dasku).',
   target:function(){return itemRect('daska');},done:function(){return vegs('paradajz').some(function(e){return e.dataset.attachedToBoard==='1';});}},
  {id:'cut',text:'Dok je paradajz na dasci, pritisni C. Otvara se seckanje: prevuci levim dugmetom miša preko paradajza da ga preseciš, pa pritisni E kad si gotov.',
   target:function(){return itemRect('daska');},done:function(){return vegs('paradajz').some(function(e){return e.dataset.cutState==='sliced'||e.dataset.cutState==='diced';});}},
  {id:'bowl',text:'Uzmi isečeni paradajz i spusti ga u činiju.',
   target:function(){return bowlRect();},done:function(){return vesselHas(/paradajz/);}},
  {id:'salt',text:'Dodaj so: uzmi so sa stola i klikni na činiju.',
   target:function(){return itemRect('so');},done:function(){return vesselHas(/^so$/);}},
  {id:'oil',text:'Sad ulje: uzmi flašu ulja, drži dugme miša iznad činije dok ne poteče.',
   target:function(){return itemRect('kal_01_flasa_ulja');},done:function(){return vesselHas(/^(ulje|oil)$/);}},
  {id:'salad',button:'Dalje',text:'Srpska salata je gotova! Sad pržene tikvice: treba nam tiganj, vatra i tikvice sa pijace.'},
  {id:'z_dock',text:function(){return dockOpen()?'Klikni na pijacu, kupi tikvice.':'Pređi mišem preko drvenog polja sa satom, pa na pijacu.';},
   target:function(){return dockOpen()?(dockBtn('Pijaca')||plateRect()):plateRect();},done:function(){return body('market-open');}},
  {id:'z_pick',requires:function(){return body('market-open')?null:'z_dock';},text:'Klikni na gomilu tikvica.',
   target:function(){return rectOf($('#marketHoverLayer .market-pile[data-key="tikvice"]'));},
   done:function(){var c=document.getElementById('marketCartCount');return !!c&&(parseInt(c.textContent,10)||0)>0;}},
  {id:'z_buy',requires:function(){return (body('market-open')||boughtNow())?null:'z_dock';},side:'below',text:'Pritisni „Kupi sve“, pa prihvati cenu.',
   target:function(){return rectOf(document.getElementById('marketCartBuy'))||rectOf(document.getElementById('marketAcceptBtn'));},
   done:function(){return boughtNow()&&!body('market-open')&&(vegsInBags('tikvice')||allItems().some(function(e){return e.dataset.marketBag==='1'&&e.dataset.vegKey==='tikvice';}));}},
  {id:'z_bag',text:'Izvadi tikvicu iz kese sa kuke (klik na donji deo kese).',
   target:function(){return wallBagRect();},done:function(){return vegs('tikvice').length>0;}},
  {id:'z_cut',text:'Spusti tikvicu na dasku i pritisni C. Prevuci mišem preko nje da je preseciš, pa pritisni E kad si gotov.',
   target:function(){return itemRect('daska');},done:function(){return vegs('tikvice').some(function(e){return e.dataset.cutState==='sliced'||e.dataset.cutState==='diced';});}},
  {id:'z_pan',text:'Stavi tiganj na ploču šporeta.',
   target:function(){return panRect();},done:function(){return !!panOnStove();}},
  {id:'z_fire',text:'Zapali vatru: iz fioke ispod rerne uzmi cepanicu i ubaci je u ložište.',
   done:function(){try{return !!stoveState.fireOn;}catch(e){return false;}}},
  {id:'z_oil',text:'Dodaj ulje u tiganj (flaša ulja, drži dugme miša iznad tiganja).',
   target:function(){return itemRect('kal_01_flasa_ulja');},done:function(){var m=panModel();return !!m&&(+(m.staples&&m.staples.oil)||0)>0;}},
  {id:'z_add',text:'Spusti isečene tikvice u tiganj.',
   target:function(){return panRect();},done:function(){var m=panModel();return !!m&&Object.keys(m.ingredients||{}).some(function(k){return /tikvice/.test(k)&&m.ingredients[k]>0;});}},
  {id:'z_fry',text:'Mešaj kašikom i čekaj da porumene. Pazi da ne zagore!',
   target:function(){return panRect();},done:function(){var m=panModel();return !!m&&!m.burnt&&(+m.doneness||0)>=.54;}},
  {id:'end',button:'Zatvori',text:'Pržene tikvice su gotove. Sada si spreman, sine: ajde sad sam probaj Savkin gulaš iz knjige recepata.',final:true}
];

// ---------- izgled ----------
var css=document.createElement('style');
css.textContent=[
'#tutBubble{position:fixed;left:50%;top:78px;transform:translate(-50%,-16px);z-index:2147483300;width:min(470px,92vw);padding:12px 16px 12px 70px;background:#fbf0d6;border:3px solid #8a4a1c;border-radius:14px;box-shadow:0 8px 22px rgba(0,0,0,.45);color:#3b2412;font:600 16px/1.4 Georgia,"Times New Roman",serif;opacity:0;pointer-events:none;transition:opacity .35s ease,transform .35s ease;display:none}',
'#tutBubble.on{opacity:1;transform:translate(-50%,0);pointer-events:auto}',
'#tutBubble .tb-av{position:absolute;left:10px;top:50%;transform:translateY(-50%);width:50px;height:50px;border-radius:50%;background:#e9c58c;border:3px solid #8a4a1c;display:flex;align-items:center;justify-content:center;font:900 22px Georgia,serif;color:#7a2a12}',
'#tutBubble .tb-name{font:800 12px system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#a0743c;margin-bottom:2px}',
'#tutBubble .tb-row{display:flex;gap:10px;align-items:center;justify-content:flex-end;margin-top:8px}',
'#tutBubble button{border:0;border-radius:8px;padding:6px 14px;cursor:pointer;font:800 13px system-ui,sans-serif}',
'#tutBubble .tb-next{background:#d9a441;color:#2a1a0e}#tutBubble .tb-next:hover{background:#f0c36a}',
'#tutBubble .tb-skip{background:transparent;color:#8a5a2c;text-decoration:underline;font-weight:600}',
'#tutArrow{position:fixed;z-index:2147483200;width:46px;height:58px;pointer-events:none;display:none;filter:drop-shadow(0 3px 3px rgba(0,0,0,.45))}',
'#tutArrow svg{width:100%;height:100%;display:block}',
'#tutArrow.down svg{animation:tutBobDown .85s ease-in-out infinite}',
'#tutArrow.up svg{animation:tutBobUp .85s ease-in-out infinite;transform:rotate(180deg)}',
'@keyframes tutBobDown{0%,100%{transform:translateY(-8px)}50%{transform:translateY(6px)}}',
'@keyframes tutBobUp{0%,100%{transform:rotate(180deg) translateY(-8px)}50%{transform:rotate(180deg) translateY(6px)}}'
].join('\n');
document.head.appendChild(css);
var bub=document.createElement('div');bub.id='tutBubble';
bub.innerHTML='<div class="tb-av">S</div><div class="tb-name">Baba Savka</div><div class="tb-text"></div><div class="tb-row"><button type="button" class="tb-skip">Preskoči uputstvo</button><button type="button" class="tb-next" style="display:none">Dalje</button></div>';
document.body.appendChild(bub);
var arrow=document.createElement('div');arrow.id='tutArrow';
arrow.innerHTML='<svg viewBox="0 0 46 58"><path d="M14 2h18v26h11L23 55 3 28h11z" fill="#f2b631" stroke="#5a2a0e" stroke-width="3" stroke-linejoin="round"/><path d="M18 6h10v26" fill="none" stroke="#fff3b8" stroke-width="2.5" stroke-linecap="round" opacity=".7"/></svg>';
document.body.appendChild(arrow);
var elText=bub.querySelector('.tb-text'),btnNext=bub.querySelector('.tb-next'),btnSkip=bub.querySelector('.tb-skip');

var running=false,cur=null,shownId='',raf=0,last=0,tickT=0;
function stepText(s){return typeof s.text==='function'?s.text():s.text;}
function showBubble(s){
  var t=stepText(s);
  if(elText.textContent!==t)elText.textContent=t;
  if(shownId!==s.id){
    shownId=s.id;
    bub.style.display='block';bub.classList.remove('on');void bub.offsetWidth;requestAnimationFrame(function(){bub.classList.add('on');});   // poruka izlazi (blago klizi i bledi)
    btnNext.style.display=s.button?'':'none';btnNext.textContent=s.button||'Dalje';
  }
}
function placeArrow(r,side){
  if(!r){arrow.style.display='none';return;}
  var W=window.innerWidth,H=window.innerHeight,aw=46,ah=58,gap=4,cx=r.left+r.width/2;
  var up=side==='below'||(r.top-ah-gap)<96;      // nema mesta iznad (zauzeto porukom): strelica ide ispod i pokazuje nagore
  arrow.className=up?'up':'down';
  var left=Math.max(4,Math.min(W-aw-4,cx-aw/2));
  var top=up?Math.min(H-ah-4,r.bottom+gap):Math.max(4,r.top-ah-gap);
  arrow.style.left=left+'px';arrow.style.top=top+'px';arrow.style.display='block';
}
function go(i){
  st.i=Math.max(0,Math.min(STEPS.length-1,i));save();cur=STEPS[st.i];shownId='';
  if(cur.id==='z_dock'||cur.id==='hello')bought=false;      // nova kupovina
}
function frame(){
  if(!running)return;
  raf=requestAnimationFrame(frame);
  if(!cur){arrow.style.display='none';return;}
  if(body('menu-open')||body('main-menu-open')){bub.classList.remove('on');arrow.style.display='none';return;}
  showBubble(cur);
  placeArrow(cur.target?cur.target():null,cur.side);
  var now=performance.now();if(now-last<150)return;last=now;
  if(cur.requires){var back=cur.requires();if(back){for(var k=0;k<STEPS.length;k++)if(STEPS[k].id===back){go(k);return;}}}
  if(cur.done&&cur.done()){
    if(st.i>=STEPS.length-1){finish();return;}
    go(st.i+1);
  }
}
function finish(){
  st.done=true;save();running=false;cancelAnimationFrame(raf);
  bub.classList.remove('on');arrow.style.display='none';setTimeout(function(){bub.style.display='none';},400);
}
btnNext.addEventListener('click',function(){
  if(!cur)return;
  if(cur.final||st.i>=STEPS.length-1){finish();return;}
  go(st.i+1);
});
btnSkip.addEventListener('click',function(){finish();try{showToast('Uputstvo je preskočeno. Možeš ga opet pokrenuti iz knjige recepata.');}catch(e){}});
// kupovina: "Kupi sve" je pritisnuto (posle toga se otvara cenkanje)
['pointerdown','click'].forEach(function(ev){document.addEventListener(ev,function(e){var b=e.target&&e.target.closest&&e.target.closest('#marketCartBuy');if(b&&cur&&(cur.id==='buy'||cur.id==='z_buy'))bought=true;},true);});

function start(from){
  if(running)return;
  bought=false;st.done=false;
  go(typeof from==='number'?from:(st.done?0:st.i));running=true;last=0;raf=requestAnimationFrame(frame);
}
window.CooksterTutorial={
  start:function(fresh){if(fresh){st={i:0,done:false};save();}running=false;start(fresh?0:st.i);},
  skip:finish,
  get running(){return running;},
  get step(){return cur&&cur.id;}
};
// automatski start samo uz ?uputstvo (dok uputstvo nije gotovo), a posle glavnog menija
function autoStart(){
  if(/[?&]uputstvo(=|&|$)/.test(location.search)&&!st.done)window.CooksterTutorial.start(false);
}
window.addEventListener('cookster:menu-closed',autoStart);
if(/[?&]nomenu\b/.test(location.search)||document.readyState==='complete')setTimeout(autoStart,2500);
else window.addEventListener('load',function(){setTimeout(autoStart,2500);});
})();
