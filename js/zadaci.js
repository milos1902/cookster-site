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
var K='assets/ui/karta/';
var css=document.createElement('style');
css.textContent=[
'@font-face{font-family:"Paytone One";src:url(assets/fonts/PaytoneOne-Regular.ttf) format("truetype");font-display:swap}',
'#zadaciBox{position:fixed;right:12px;top:104px;width:262px;z-index:1895;padding:12px 14px 12px;border-radius:14px;background:linear-gradient(#f6e9c8,#ead7a6);border:3px solid #8a5a2a;box-shadow:inset 0 0 0 2px #f3e3b9,0 5px 14px rgba(30,15,5,.45);font-family:"Paytone One","CooksterSerif",Georgia,serif;font-weight:400;color:#3a1f10;user-select:none}',
'#zadaciBox:before{content:"";position:absolute;inset:5px;border:2px dashed rgba(184,58,34,.55);border-radius:10px;pointer-events:none}',
'#zadaciBox .zt{font-size:19px;color:#7a1e14;letter-spacing:.04em;margin:0 0 6px;display:flex;justify-content:space-between;align-items:center}',
'#zadaciBox .zt small{font-size:15px;color:#3a1f10;display:flex;align-items:center;gap:4px}#zadaciBox .zt small img{height:20px}',
'#zadaciBox .zr{display:flex;align-items:center;gap:8px;padding:6px 0;border-top:1px solid rgba(138,90,42,.3);font-size:14px;line-height:1.15}',
'#zadaciBox .zr .zc{flex:0 0 22px;height:22px;border-radius:50%;border:2.5px solid #8a5a2a;background:#fff8e3;display:flex;align-items:center;justify-content:center;color:#fff;font:900 15px Arial}',
'#zadaciBox .zr.done .zc{background:#4f8a2e;border-color:#3b6a22}#zadaciBox .zr.done .zc:before{content:"✓"}',
'#zadaciBox .zr.done .zx{text-decoration:line-through;opacity:.55}',
'#zadaciBox .zr.on .zx{color:#7a1e14}',
'#zadaciBox .zx{flex:1}',
'#zadaciBox .zk{flex:0 0 auto;display:flex;align-items:center;gap:2px;font-size:14px}#zadaciBox .zk img{height:18px}',
'#zadaciBox .zr.done .zk{opacity:.45}',
'body.menu-open #zadaciBox,body.main-menu-open #zadaciBox,body.kt-open #zadaciBox,body.market-open #zadaciBox,body.pantry-open #zadaciBox,body.garden-open #zadaciBox{display:none}'
].join('\n');
document.head.appendChild(css);
var box=document.createElement('div');box.id='zadaciBox';box.setAttribute('data-tool-ui','1');document.body.appendChild(box);
var cur='';
function render(){
  if(!box)return;
  var first=-1;TASKS.forEach(function(t,i){if(first<0&&!S.done[t.id])first=i;});
  var h='<div class="zt">ZADACI<small><img src="'+K+'ikona_znanje.webp" alt="">'+S.zn+'</small></div>';
  TASKS.forEach(function(t,i){
    h+='<div class="zr'+(S.done[t.id]?' done':(i===first?' on':''))+'"><span class="zc"></span><span class="zx">'+t.text+'</span>'+(t.zn?'<span class="zk"><img src="'+K+'ikona_znanje.webp" alt="">+'+t.zn+'</span>':'')+'</div>';
  });
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
