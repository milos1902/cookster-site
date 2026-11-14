/* Cookster: napredak i lista zadataka (gore desno). Zadaci su ujedno uputstvo: vode igrača redom kroz igru.
   - CooksterProgress: znanje (bodovi za trošenje, kupuju se na karti znanja) i zvezdice (nivo). Čuva se u localStorage 'cookster.napredak.v1'.
   - Zadaci se prepoznaju sami iz stanja igre: čista kuhinja, vatra u šporetu, paradajz kupljen, salata i tikvice predate komšinici, kafana otključana.
   - Prikazuju se najviše 3 neurađena; kad se jedan završi (kvačica oko 1,5 s), izlazi sledeći.
   - Kad je salata ili tikvice gotovo, lista sama poziva komšinicu (CooksterNeighbor.expectOrder), umesto uputstva (tutorial.js).
   Probno: ?zadaci=0 sklanja listu; CooksterProgress.reset() počinje ispočetka. */
(function(){
'use strict';
if(window.CooksterProgress)return;
var KEY='cookster.napredak.v1',S={zn:0,star:1,done:{}};
try{var j=JSON.parse(localStorage.getItem(KEY)||'null');if(j&&typeof j==='object'){S.zn=+j.zn||0;S.star=Math.max(1,Math.min(5,+j.star||1));S.done=j.done||{};}}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}
// ---------- stanje igre ----------
function allItems(){try{return items.slice();}catch(e){return [];}}
function vessels(){return allItems().filter(function(e){try{return isContainerItem(e);}catch(x){return false;}});}
function contentKeys(v){var out=[];try{var m=CooksterPan.read(v);Object.keys(m.ingredients||{}).forEach(function(k){if(+m.ingredients[k]>0)out.push(k);});if(+(m.staples&&m.staples.oil)>0)out.push('ulje');if(+(m.staples&&m.staples.salt)>0)out.push('so');}catch(e){}try{var it=CooksterContainer.read(v).items||{};Object.keys(it).forEach(function(k){if((+it[k].count||0)>0)out.push(k);});}catch(e){}return out;}
function vesselHas(re){return vessels().some(function(v){return contentKeys(v).some(function(k){return re.test(k);});});}
function spiceIn(k){return vessels().some(function(v){try{return (+JSON.parse(v.dataset.spices||'{}')[k]||0)>0;}catch(e){return false;}});}
function hasVeg(key){
  if(allItems().some(function(e){return e.dataset&&e.dataset.vegKey===key;}))return true;
  try{return CooksterWallBags.slots().some(function(r){return r&&(r.productKey===key||(r.items||[]).some(function(x){return x.productKey===key;}));});}catch(e){return false;}
}
function delivered(id){try{return !!CooksterNeighbor.delivered(id);}catch(e){return false;}}
function kitchenClean(){try{return !!window.CooksterKitchenClean&&!CooksterKitchenClean.active();}catch(e){return false;}}
function fireOn(){try{return !!stoveState.fireOn&&(+stoveState.fireLevel||0)>0;}catch(e){return false;}}
function salataReady(){return vesselHas(/paradajz/)&&(spiceIn('so')||vesselHas(/^so$/))&&vesselHas(/^(ulje|oil)$/);}
function tikviceReady(){
  var pans=vessels().filter(function(e){return /^(tiganj|kal_01_okrugli_pleh)/.test(e.dataset.itemId||'')&&e.dataset.surfaceZone==='stove';});
  return pans.some(function(p){try{var m=CooksterPan.read(p);return !m.burnt&&(+m.doneness||0)>=.54&&Object.keys(m.ingredients||{}).some(function(k){return /tikvice/.test(k)&&m.ingredients[k]>0;});}catch(e){return false;}});
}
function callNeighbor(id,ready){if(ready()){try{CooksterNeighbor.expectOrder(id);}catch(e){}}}
// ---------- zadaci (redom, kao uputstvo) ----------
var TASKS=[
  {id:'ocisti',text:'Očisti kuhinju metlom i sunđerom',zn:2,done:kitchenClean},
  {id:'vatra',text:'Založi vatru u šporetu',zn:2,done:fireOn},
  {id:'paradajz',text:'Kupi paradajz na pijaci',zn:2,done:function(){return hasVeg('paradajz')||delivered('salad');}},
  {id:'salata',text:'Skuvaj srpsku salatu za komšinicu',zn:3,watch:function(){callNeighbor('salad',salataReady);},done:function(){return delivered('salad');}},
  {id:'tikvice',text:'Isprži tikvice za komšinicu',zn:5,watch:function(){callNeighbor('tikvice',tikviceReady);},done:function(){return delivered('tikvice');}},
  {id:'kafana',text:'Otključaj kafanu na karti znanja',zn:0,done:function(){try{return !CooksterTavernLock.locked();}catch(e){return false;}}}
];
var P=window.CooksterProgress={
  zn:function(){return S.zn;},star:function(){return S.star;},
  addZn:function(n){S.zn=Math.max(0,S.zn+(+n||0));save();render();},
  spendZn:function(n){S.zn=Math.max(0,S.zn-(+n||0));save();render();},
  setStar:function(n){S.star=Math.max(1,Math.min(5,n|0));save();},
  reset:function(){S={zn:0,star:1,done:{}};recent={};save();render();},
  tasks:TASKS,isDone:function(id){return !!S.done[id];}
};
if(/[?&]zadaci=0\b/.test(location.search))return;
var K='assets/ui/karta/',Z='assets/ui/napredak/zadaci/',recent={};
var css=document.createElement('style');
css.textContent=[
'@font-face{font-family:"Paytone One";src:url(assets/fonts/PaytoneOne-Regular.ttf) format("truetype");font-display:swap}',
'#zadaciBox{position:fixed;right:12px;top:104px;width:300px;height:316px;z-index:1895;background:url('+Z+'zadaci_okvir.png) 0 0/100% 100% no-repeat;filter:drop-shadow(0 5px 8px rgba(30,15,5,.45));font-family:"Paytone One","CooksterSerif",Georgia,serif;font-weight:400;color:#3a1f10;user-select:none}',
'#zadaciBox .zt{position:absolute;left:22%;right:22%;top:3.2%;height:11.5%;display:flex;align-items:center;justify-content:center;gap:8px;font-size:19px;color:#7a1e14;letter-spacing:.05em}#zadaciBox .zt small{font-size:14px;color:#3a1f10}',
'#zadaciBox .zl{position:absolute;left:7.5%;right:7.5%;top:21%;display:flex;flex-direction:column;gap:4px}',
'#zadaciBox .zr{position:relative;aspect-ratio:394/108;background:url('+Z+'zadatak_red_prazan.png) 0 0/100% 100% no-repeat;display:flex;align-items:center;padding:0 44px 0 62px;font-size:13px;line-height:1.1;transition:opacity .4s}',
'#zadaciBox .zr.on{background-image:url('+Z+'zadatak_red_glavni.png)}',
'#zadaciBox .zr.done{background-image:url('+Z+'zadatak_red_gotov.png)}',
'#zadaciBox .zr.done .zx{text-decoration:line-through;opacity:.55}',
'#zadaciBox .zr.on .zx{color:#7a1e14}',
'#zadaciBox .zk{position:absolute;right:11px;top:50%;transform:translateY(-50%);display:flex;align-items:center;gap:2px;font-size:14px}#zadaciBox .zk img{height:20px}',
'#zadaciBox .zr.done .zk{opacity:.45}',
'#zadaciBox .zb{position:absolute;right:6px;top:calc(100% + 4px);width:150px;height:51px;background:url('+Z+'brojac_okvir.png) 0 0/100% 100% no-repeat;display:flex;align-items:center;justify-content:center;gap:6px;font-size:21px}#zadaciBox .zb img{height:30px}',
'body.menu-open #zadaciBox,body.main-menu-open #zadaciBox,body.kt-open #zadaciBox,body.market-open #zadaciBox,body.pantry-open #zadaciBox,body.garden-open #zadaciBox{display:none}'
].join('\n');
document.head.appendChild(css);
var box=document.createElement('div');box.id='zadaciBox';box.setAttribute('data-tool-ui','1');document.body.appendChild(box);
var cur='';
function render(){
  if(!box)return;
  var now=Date.now(),n=0,vis=[];
  TASKS.forEach(function(t){if(S.done[t.id])n++;});
  TASKS.forEach(function(t){if(vis.length<3&&(!S.done[t.id]||(recent[t.id]&&now-recent[t.id]<1500)))vis.push(t);});
  var first=-1;vis.forEach(function(t,i){if(first<0&&!S.done[t.id])first=i;});
  var h='<div class="zt">ZADACI<small>'+n+'/'+TASKS.length+'</small></div><div class="zl">';
  vis.forEach(function(t,i){
    h+='<div class="zr'+(S.done[t.id]?' done':(i===first?' on':''))+'"><span class="zx">'+t.text+'</span>'+(t.zn?'<span class="zk"><img src="'+K+'ikona_znanje.webp" alt="">+'+t.zn+'</span>':'')+'</div>';
  });
  h+='</div><div class="zb"><img src="'+K+'ikona_znanje.webp" alt="">'+S.zn+'</div>';
  if(h!==cur){cur=h;box.innerHTML=h;}
}
function check(){
  var any=false;
  TASKS.forEach(function(t){
    if(S.done[t.id])return;
    if(t.watch){try{t.watch();}catch(e){}}
    var ok=false;try{ok=!!t.done();}catch(e){}
    if(ok){
      S.done[t.id]=true;recent[t.id]=Date.now();any=true;if(t.zn)S.zn+=t.zn;
      try{showToast('Zadatak gotov: '+t.text+(t.zn?'  (+'+t.zn+' znanja)':''));}catch(e){}
    }
  });
  if(any)save();
  render();
}
render();setInterval(check,700);
})();
