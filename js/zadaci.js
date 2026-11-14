/* Cookster: napredak i lista zadataka (gore desno), prvi deo.
   - CooksterProgress: znanje (bodovi za trošenje, kupuju se na karti znanja) i zvezdice (nivo). Čuva se u localStorage 'cookster.napredak.v1'.
   - Lista zadataka: svaki urađen zadatak daje znanje (novac za salatu i tikvice već daje komšinica, js/neighbor.js).
   - Zadaci se prepoznaju sami iz stanja igre (komšinica je primila salatu / tikvice, kafana otključana).
   Probno: ?zadaci=0 sklanja listu; CooksterProgress.reset() počinje ispočetka. */
(function(){
'use strict';
if(window.CooksterProgress)return;
var KEY='cookster.napredak.v1',S={zn:0,star:1,done:{}};
try{var j=JSON.parse(localStorage.getItem(KEY)||'null');if(j&&typeof j==='object'){S.zn=+j.zn||0;S.star=Math.max(1,Math.min(5,+j.star||1));S.done=j.done||{};}}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}
function delivered(id){try{return !!CooksterNeighbor.delivered(id);}catch(e){return false;}}
var TASKS=[
  {id:'salata',text:'Skuvaj srpsku salatu za komšinicu',zn:3,done:function(){return delivered('salad');}},
  {id:'tikvice',text:'Skuvaj tikvice za komšinicu',zn:5,done:function(){return delivered('tikvice');}},
  {id:'kafana',text:'Otključaj kafanu na karti znanja',zn:0,done:function(){try{return !CooksterTavernLock.locked();}catch(e){return false;}}}
];
var P=window.CooksterProgress={
  zn:function(){return S.zn;},star:function(){return S.star;},
  addZn:function(n){S.zn=Math.max(0,S.zn+(+n||0));save();render();},
  spendZn:function(n){S.zn=Math.max(0,S.zn-(+n||0));save();render();},
  setStar:function(n){S.star=Math.max(1,Math.min(5,n|0));save();},
  reset:function(){S={zn:0,star:1,done:{}};save();render();},
  tasks:TASKS,isDone:function(id){return !!S.done[id];}
};
if(/[?&]zadaci=0\b/.test(location.search))return;
var K='assets/ui/karta/',Z='assets/ui/napredak/zadaci/';
var css=document.createElement('style');
css.textContent=[
'@font-face{font-family:"Paytone One";src:url(assets/fonts/PaytoneOne-Regular.ttf) format("truetype");font-display:swap}',
// tvoja tabla (zadaci_okvir.png 339x357): naslov je u ploči na vrhu, unutra su tri reda (zadatak_red_*.png 394x108)
'#zadaciBox{position:fixed;right:12px;top:104px;width:300px;height:316px;z-index:1895;background:url('+Z+'zadaci_okvir.png) 0 0/100% 100% no-repeat;filter:drop-shadow(0 5px 8px rgba(30,15,5,.45));font-family:"Paytone One","CooksterSerif",Georgia,serif;font-weight:400;color:#3a1f10;user-select:none}',
'#zadaciBox .zt{position:absolute;left:22%;right:22%;top:3.2%;height:11.5%;display:flex;align-items:center;justify-content:center;font-size:19px;color:#7a1e14;letter-spacing:.05em}',
'#zadaciBox .zl{position:absolute;left:7.5%;right:7.5%;top:21%;display:flex;flex-direction:column;gap:4px}',
'#zadaciBox .zr{position:relative;aspect-ratio:394/108;background:url('+Z+'zadatak_red_prazan.png) 0 0/100% 100% no-repeat;display:flex;align-items:center;padding:0 44px 0 62px;font-size:13px;line-height:1.1}',
'#zadaciBox .zr.on{background-image:url('+Z+'zadatak_red_glavni.png)}',
'#zadaciBox .zr.done{background-image:url('+Z+'zadatak_red_gotov.png)}',
'#zadaciBox .zr.done .zx{text-decoration:line-through;opacity:.55}',
'#zadaciBox .zr.on .zx{color:#7a1e14}',
'#zadaciBox .zk{position:absolute;right:11px;top:50%;transform:translateY(-50%);display:flex;align-items:center;gap:2px;font-size:14px}#zadaciBox .zk img{height:20px}',
'#zadaciBox .zr.done .zk{opacity:.45}',
// brojač znanja (brojac_okvir.png 364x123) ispod table
'#zadaciBox .zb{position:absolute;right:6px;top:calc(100% + 4px);width:150px;height:51px;background:url('+Z+'brojac_okvir.png) 0 0/100% 100% no-repeat;display:flex;align-items:center;justify-content:center;gap:6px;font-size:21px}#zadaciBox .zb img{height:30px}',
'body.menu-open #zadaciBox,body.main-menu-open #zadaciBox,body.kt-open #zadaciBox,body.market-open #zadaciBox,body.pantry-open #zadaciBox,body.garden-open #zadaciBox{display:none}'
].join('\n');
document.head.appendChild(css);
var box=document.createElement('div');box.id='zadaciBox';box.setAttribute('data-tool-ui','1');document.body.appendChild(box);
var cur='';
function render(){
  if(!box)return;
  var first=-1;TASKS.forEach(function(t,i){if(first<0&&!S.done[t.id])first=i;});
  var h='<div class="zt">ZADACI</div><div class="zl">';
  TASKS.forEach(function(t,i){
    h+='<div class="zr'+(S.done[t.id]?' done':(i===first?' on':''))+'"><span class="zx">'+t.text+'</span>'+(t.zn?'<span class="zk"><img src="'+K+'ikona_znanje.webp" alt="">+'+t.zn+'</span>':'')+'</div>';
  });
  h+='</div><div class="zb"><img src="'+K+'ikona_znanje.webp" alt="">'+S.zn+'</div>';
  if(h!==cur){cur=h;box.innerHTML=h;}
}
function check(){
  var any=false;
  TASKS.forEach(function(t){
    if(!S.done[t.id]&&t.done()){
      S.done[t.id]=true;any=true;if(t.zn)S.zn+=t.zn;
      try{showToast('Zadatak gotov: '+t.text+(t.zn?'  (+'+t.zn+' znanja)':''));}catch(e){}
    }
  });
  if(any)save();
  render();
}
render();setInterval(check,700);
})();
