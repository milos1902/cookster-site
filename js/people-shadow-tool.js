/* Alat „Senke likova": senka konobara i gostiju koji hodaju po podu kafane.
   Slika pokazuje pod kafane i lika na njemu (klik ili prevlačenje na slici ga premešta, da vidiš senku na raznim mestima: što je bliže upaljenoj lampi, to je senka jača i drugačije usmerena).
   Podešava se: jačina, pomeraj, širina, visina i mekoća meke senke ispod stopala, i senka od lampi (jačina, dužina). Podaci su u istom fajlu kao „Predmeti na stolu"
   (localStorage cookster.table-items.v1, stavke konobar i gosti), scena ih čita u tavern-scene.js (peopleShadow / lampCast). Izvezi / Uvezi JSON. */
(function(){
'use strict';
var T=window.CooksterTavern,room=document.getElementById('tavernScene');
if(!T||!room||window.CooksterPeopleShadowTool||!T.tableItems||!T.peoplePreview)return;
var KINDS=[['konobar','Konobar'],['gosti','Gosti (koji hodaju)']];
var SL=[['sho','Jačina meke senke ispod stopala',0,1.5,.01],['shx','Pomeraj levo-desno',-1.5,1.5,.01],['shy','Pomeraj gore-dole',-.5,1,.01],['shw','Širina',.2,3,.01],['shh','Visina (debljina)',.05,1.2,.01],['shb','Mekoća ivice',0,20,1],
        ['lm','Senka od lampi — jačina',0,2.5,.01],['ll','Senka od lampi — dužina',.3,2.5,.01]];
var DEF={sho:T.tableItems.peoDef.sho,shx:T.tableItems.peoDef.shx,shy:T.tableItems.peoDef.shy,shw:T.tableItems.peoDef.shw,shh:T.tableItems.peoDef.shh,shb:T.tableItems.peoDef.shb,lm:1,ll:1};
var kind='konobar',pos={x:700,y:620},ui={},cv,g,drag=false,roomImg=new Image();
roomImg.src=T.roomSrc;
var CROP={w:760,h:428};
function data(){return T.tableItems.get()}
function save(){T.tableItems.set(data())}
function entry(create){var d=data();if(!d.items)d.items={};var it=d.items[kind];if(!it&&create)it=d.items[kind]={def:{},seat:{}};if(it){if(!it.def)it.def={};if(!it.seat)it.seat={}}return it}
function cur(){var it=entry(false),r=Object.assign({},DEF);if(it&&it.def)for(var k in it.def)if(k in DEF)r[k]=it.def[k];return r}
function setVal(k,v){entry(true).def[k]=v;save();refreshUi();draw()}
function box(){return{x:Math.max(0,Math.min(T.size.w-CROP.w,pos.x-CROP.w/2)),y:Math.max(0,Math.min(T.size.h-CROP.h,pos.y-CROP.h*.62))}}
function toScene(e){var r=cv.getBoundingClientRect(),b=box();return{x:b.x+(e.clientX-r.left)/r.width*CROP.w,y:b.y+(e.clientY-r.top)/r.height*CROP.h}}
function draw(){
  var b=box(),k=cv.width/CROP.w;g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,cv.width,cv.height);g.setTransform(k,0,0,k,-b.x*k,-b.y*k);
  if(roomImg.complete)g.drawImage(roomImg,0,0,T.size.w,T.size.h);
  T.peoplePreview(g,kind,pos.x,pos.y,cur());
  g.save();g.strokeStyle='#4dd2ff';g.lineWidth=1.2/k;g.beginPath();g.moveTo(pos.x-8,pos.y);g.lineTo(pos.x+8,pos.y);g.moveTo(pos.x,pos.y-8);g.lineTo(pos.x,pos.y+8);g.stroke();g.restore();
  // the lit lamps (where their light touches the floor)
  try{var C=window.CooksterTavernClean,L=C&&C.lightSources?C.lightSources():[];L.forEach(function(l){g.save();g.fillStyle='rgba(255,224,102,.9)';g.beginPath();g.arc(l.gx,l.gy,6/k*1.4,0,6.3);g.fill();g.restore()})}catch(e){}
}
function refreshUi(){
  var c=cur();SL.forEach(function(s){var i=ui.root.querySelector('#psS_'+s[0]);i.value=c[s[0]];ui.root.querySelector('#psV_'+s[0]).textContent=(+c[s[0]]).toFixed(s[0]==='shb'?0:2)});
  ui.root.querySelectorAll('[data-kind]').forEach(function(b){b.classList.toggle('on',b.dataset.kind===kind)});
  var n=0;try{n=window.CooksterTavernClean.lightSources().length}catch(e){}
  ui.root.querySelector('#psInfo').textContent=KINDS.filter(function(k){return k[0]===kind})[0][1]+' · x '+Math.round(pos.x)+', y '+Math.round(pos.y)+' · upaljenih svetala: '+n+(n?'':' (upali lampe desnim klikom da vidiš senke od lampi)');
}
function build(){
  var css=document.createElement('style');
  css.textContent='#psBtn{position:absolute;left:520px;bottom:14px;z-index:70;border:2px solid #351b0d;border-radius:9px;background:#e8c27a;color:#351b0d;font:700 14px/1 system-ui,sans-serif;padding:7px 14px;cursor:pointer;opacity:.85}#psBtn:hover{opacity:1}'+
  '#psTool{position:fixed;inset:0;z-index:2147483200;display:none;background:#140d08;color:#f3e3c2;font:13px/1.35 system-ui,sans-serif}#psTool.open{display:flex}'+
  '#psTool .side{width:300px;flex:none;overflow:auto;padding:44px 14px 12px;background:#201409;border-right:1px solid #5b3d1e}'+
  '#psTool h2{margin:0 0 8px;font-size:16px}#psTool .row{display:flex;flex-wrap:wrap;gap:5px;margin:7px 0}'+
  '#psTool button.b{padding:6px 9px;border:1px solid #7a5428;border-radius:6px;background:#3a2410;color:#f3e3c2;cursor:pointer;font:inherit}#psTool button.b.on{background:#a8651b}'+
  '#psTool label.sl{display:block;margin:8px 0 2px;color:#d9c69c}#psTool label.sl b{float:right;color:#f3e3c2}#psTool label.sl input{width:100%}'+
  '#psTool .help{margin:8px 0;padding:8px;border-radius:7px;background:#2c1b0c;color:#d9c69c}#psTool .stage{flex:1;display:flex;align-items:center;justify-content:center;background:#000;position:relative}'+
  '#psTool canvas{max-width:100%;max-height:100%;cursor:crosshair;touch-action:none}#psTool textarea{width:100%;height:90px;background:#140d08;color:#f3e3c2;border:1px solid #7a5428;border-radius:6px}'+
  '#psTool .tinfo{position:absolute;left:10px;bottom:8px;padding:4px 8px;background:rgba(0,0,0,.6);border-radius:6px;font-size:12px;pointer-events:none}';
  document.head.appendChild(css);
  var btn=document.createElement('button');btn.id='psBtn';btn.type='button';btn.textContent='🕯 senke likova';room.appendChild(btn);
  ui.root=document.createElement('div');ui.root.id='psTool';
  var sl=function(s){return '<label class="sl">'+s[1]+' <b id="psV_'+s[0]+'"></b><input type="range" id="psS_'+s[0]+'" min="'+s[2]+'" max="'+s[3]+'" step="'+s[4]+'"></label>'};
  ui.root.innerHTML='<div class="side"><h2>Senke likova</h2>'+
    '<div class="help">Senka konobara i gostiju koji hodaju po podu. Klikni ili prevuci na slici da premestiš lika (žute tačke su mesta ispod upaljenih lampi). Meka senka ispod stopala važi uvek, a senke od lampi se vide dok su lampe upaljene.</div>'+
    '<div class="row">'+KINDS.map(function(k){return '<button class="b" data-kind="'+k[0]+'">'+k[1]+'</button>'}).join('')+'</div>'+
    SL.map(sl).join('')+
    '<div class="row"><button class="b" id="psReset">Vrati početno za ovog lika</button></div>'+
    '<div class="row"><button class="b" id="psExport">Izvezi JSON</button><button class="b" id="psImport">Uvezi JSON</button></div>'+
    '<div id="psBox" style="display:none"><textarea id="psText"></textarea><div class="row"><button class="b" id="psDoImport">Primeni</button></div></div>'+
    '<div class="row" style="margin-top:12px"><button class="b" id="psClose" style="width:100%">Zatvori alat</button></div></div>'+
    '<div class="stage"><canvas id="psCv" width="1040" height="585"></canvas><div class="tinfo" id="psInfo"></div></div>';
  document.body.appendChild(ui.root);
  cv=ui.root.querySelector('#psCv');g=cv.getContext('2d');
  ui.root.querySelectorAll('[data-kind]').forEach(function(b){b.addEventListener('click',function(){kind=b.dataset.kind;refreshUi();draw()})});
  SL.forEach(function(s){ui.root.querySelector('#psS_'+s[0]).addEventListener('input',function(e){setVal(s[0],+e.target.value)})});
  ui.root.querySelector('#psReset').addEventListener('click',function(){var d=data();if(d.items&&d.items[kind]){delete d.items[kind];save()}refreshUi();draw()});
  ui.root.querySelector('#psExport').addEventListener('click',function(){
    var d=data(),o={format:'cookster-people-shadow',exportedAt:new Date().toISOString(),items:{}};['konobar','gosti'].forEach(function(k){if(d.items&&d.items[k])o.items[k]=d.items[k]});
    var txt=JSON.stringify(o,null,1),ta=ui.root.querySelector('#psText');ui.root.querySelector('#psBox').style.display='block';ta.value=txt;ta.focus();ta.select();
    try{var bl=new Blob([txt],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(bl);a.download='cookster_senke_likova.json';document.body.appendChild(a);a.click();setTimeout(function(){a.remove()},500)}catch(e){}
  });
  ui.root.querySelector('#psImport').addEventListener('click',function(){var b=ui.root.querySelector('#psBox');b.style.display=b.style.display==='none'?'block':'none'});
  ui.root.querySelector('#psDoImport').addEventListener('click',function(){try{var o=JSON.parse(ui.root.querySelector('#psText').value);if(!o.items)throw 0;var d=data();if(!d.items)d.items={};['konobar','gosti'].forEach(function(k){if(o.items[k])d.items[k]=o.items[k]});save();refreshUi();draw()}catch(e){alert('Ne valja JSON.')}});
  ui.root.querySelector('#psClose').addEventListener('click',close);
  cv.addEventListener('pointerdown',function(e){drag=true;cv.setPointerCapture(e.pointerId);var p=toScene(e);pos.x=p.x;pos.y=p.y;refreshUi();draw()});
  cv.addEventListener('pointermove',function(e){if(drag){var p=toScene(e);pos.x=p.x;pos.y=p.y;refreshUi();draw()}});
  cv.addEventListener('pointerup',function(){drag=false});
  ['keydown','keyup','keypress'].forEach(function(n){ui.root.addEventListener(n,function(e){e.stopPropagation()})});
  ['pointerdown','pointerup','mousedown','mouseup','click','wheel','contextmenu'].forEach(function(n){ui.root.addEventListener(n,function(e){e.stopPropagation()})});
  btn.addEventListener('click',function(e){e.stopPropagation();open()});
}
function open(){ui.root.classList.add('open');refreshUi();draw();ui.t=setInterval(function(){if(ui.root.classList.contains('open')){draw()}},120)}
function close(){ui.root.classList.remove('open');clearInterval(ui.t)}
build();
window.CooksterPeopleShadowTool={open:open,close:close};
})();
