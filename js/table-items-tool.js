/* Alat „Predmeti na stolu" (posebno dugme u kafani, odvojeno od alata „Kalibracija kafane").
   Za svaki predmet koji stoji na stolu (činija sa kupusom, flaše, čaše, soda) i za SVAKU stolicu na sva tri stola: gde stoji (sredina predmeta),
   koliko je velik, i boja (nijansa, zasićenost, osvetljenost, kontrast). „Za sve stolice" menja osnovne vrednosti koje važe gde nije podešeno posebno.
   Podaci: localStorage cookster.table-items.v1 (isto čita scena u tavern-scene.js); Izvezi/Uvezi JSON. */
(function(){
'use strict';
var T=window.CooksterTavern,room=document.getElementById('tavernScene');
if(!T||!room||window.CooksterTableItemsTool||!T.tableItems)return;
var ITEMS=[['dish','Činija sa kupusom'],['pice_vino_crno_flasa','Flaša crnog vina'],['pice_vino_belo_flasa','Flaša belog vina'],['pice_soda_sifon','Soda voda (sifon)'],['pice_casa_spricer','Čaša za špricer'],['pice_casa_belo_vino','Čaša belog vina'],['pice_casa_crno_vino','Čaša crnog vina']];
var imgs={},key='dish',table=0,seat=0,scope='seat',ui={},cv,g,img=null,imgKey=null,room_img=new Image(),drag=false;
room_img.src=T.roomSrc;
var CROP={w:760,h:428},view={z:1,cx:null,cy:null};                                 // part of the hall that is shown (scene pixels), around the table
function data(){return T.tableItems.get()}
function save(){T.tableItems.set(data())}
function entry(create){var d=data();if(!d.items)d.items={};var it=d.items[key];if(!it&&create)it=d.items[key]={def:{},seat:{}};if(it){if(!it.def)it.def={};if(!it.seat)it.seat={}}return it}
function seatsOf(t){return T.seats.filter(function(s){return s.table===t})}
function seatId(){var l=seatsOf(table);return l[seat]?l[seat].id:0}
function defaultPos(){
  var sp=null;try{sp=T.serveSpot(table,key==='dish'?'jelo':'pice',seatId())}catch(e){}
  var tb=T.tables[table];return sp?{x:sp.x,y:sp.y}:{x:tb.x,y:tb.y+8};
}
function cur(){                                          // what is valid for this chair now
  var it=entry(false),p=defaultPos(),o=(it&&it.seat[seatId()])||null,d=(it&&it.def)||{},r={x:p.x,y:p.y,s:1,rot:0,sk:0,tilt:0,hl:0,h:0,sat:1,b:1,c:1,sho:T.tableItems.shDef.sho,shx:T.tableItems.shDef.shx,shy:T.tableItems.shDef.shy,shw:T.tableItems.shDef.shw,shh:T.tableItems.shDef.shh,shb:T.tableItems.shDef.shb},k;
  for(k in d)r[k]=d[k];if(o)for(k in o)r[k]=o[k];return r;
}
function setVal(k,v){
  var it=entry(true);
  if(k==='x'||k==='y'||scope==='seat'){var id=seatId();if(!it.seat[id])it.seat[id]={};it.seat[id][k]=v}
  else it.def[k]=v;
  save();refreshUi();draw();
}
function setPos(x,y){var it=entry(true),id=seatId();if(!it.seat[id])it.seat[id]={};it.seat[id].x=Math.round(x);it.seat[id].y=Math.round(y);save();draw()}
function vw(){return CROP.w/view.z}function vh(){return CROP.h/view.z}
function box(){
  var tb=T.tables[table],cx=view.cx==null?tb.x:view.cx,cy=view.cy==null?tb.y-CROP.h*.05:view.cy;
  return{x:Math.max(0,Math.min(T.size.w-vw(),cx-vw()/2)),y:Math.max(0,Math.min(T.size.h-vh(),cy-vh()/2))};
}
function toScene(e){var r=cv.getBoundingClientRect(),b=box();return{x:b.x+(e.clientX-r.left)/r.width*vw(),y:b.y+(e.clientY-r.top)/r.height*vh()}}
function draw(){
  var b=box(),k=cv.width/vw();g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,cv.width,cv.height);g.setTransform(k,0,0,k,-b.x*k,-b.y*k);
  if(room_img.complete)g.drawImage(room_img,0,0,T.size.w,T.size.h);
  // the chairs of this table
  seatsOf(table).forEach(function(s,i){
    g.save();g.fillStyle=i===seat?'#ffe066':'rgba(20,10,4,.6)';g.strokeStyle='#ffe066';g.lineWidth=1.2/k;g.beginPath();g.arc(s.x,s.y,7,0,6.3);g.fill();g.stroke();
    g.fillStyle=i===seat?'#201409':'#ffe9a0';g.font='9px system-ui';g.textAlign='center';g.fillText(String(i+1),s.x,s.y+3);g.restore();
  });
  // everything that was already placed at the chairs of this table stays where it is (so nothing gets lost when another chair is chosen)
  function pic(k){var src=T.tableItems.src(k);if(!src)return null;if(!imgs[k]){imgs[k]=new Image();imgs[k].onload=draw;imgs[k].src=src}return imgs[k]}
  function paint(k,c){
    var im=pic(k);if(!im||!im.complete||!im.naturalWidth)return;
    var sc=T.tableItems.base(k,c.y)*c.s,w=im.naturalWidth*sc,h=im.naturalHeight*sc;
    T.tableItems.shadow(g,c.x,c.y+h/2,w,c);
    g.save();T.tableItems.pose(g,c.x,c.y,c);T.tableItems.draw(g,T.tableItems.img(im,c),-w/2,-h/2,w,h,c);g.restore();
  }
  var d0=data().items||{},selId=seatId();
  ITEMS.forEach(function(itm){
    var k=itm[0],it=d0[k];if(!it||!it.seat)return;
    seatsOf(table).forEach(function(s2){
      if(k===key&&s2.id===selId)return;
      var o=it.seat[s2.id];if(!o||o.x==null)return;
      var c2={s:1,rot:0,sk:0,tilt:0,hl:0,h:0,sat:1,b:1,c:1};for(var q in (it.def||{}))c2[q]=it.def[q];for(var q2 in o)c2[q2]=o[q2];
      paint(k,c2);
    });
  });
  var c=cur();
  paint(key,c);
  g.save();g.strokeStyle='#4dd2ff';g.lineWidth=1.2/k;g.beginPath();g.moveTo(c.x-6,c.y);g.lineTo(c.x+6,c.y);g.moveTo(c.x,c.y-6);g.lineTo(c.x,c.y+6);g.stroke();g.restore();
}
function refreshUi(){
  var c=cur();
  ['s','tilt','rot','sk','hl','h','sat','b','c','sho','shx','shy','shw','shh','shb'].forEach(function(k){var i=ui.root.querySelector('#tiS_'+k);i.value=c[k];ui.root.querySelector('#tiV_'+k).textContent=(+c[k]).toFixed(k==='h'||k==='rot'||k==='sk'||k==='tilt'?0:2)});
  ui.root.querySelectorAll('[data-seat]').forEach(function(b){b.classList.toggle('on',+b.dataset.seat===seat)});
  ui.root.querySelectorAll('[data-scope]').forEach(function(b){b.classList.toggle('on',b.dataset.scope===scope)});
  ui.root.querySelector('#tiInfo').textContent=ITEMS.filter(function(i){return i[0]===key})[0][1]+' · sto '+(table+1)+', stolica '+(seat+1)+' · x '+Math.round(c.x)+', y '+Math.round(c.y);
}
function build(){
  var css=document.createElement('style');
  css.textContent='#tiBtn{position:absolute;left:150px;bottom:14px;z-index:70;border:2px solid #351b0d;border-radius:9px;background:#e8c27a;color:#351b0d;font:700 14px/1 system-ui,sans-serif;padding:7px 14px;cursor:pointer;opacity:.85}#tiBtn:hover{opacity:1}'+
  '#tiTool{position:fixed;inset:0;z-index:2147483200;display:none;background:#140d08;color:#f3e3c2;font:13px/1.35 system-ui,sans-serif}#tiTool.open{display:flex}'+
  '#tiTool .side{width:300px;flex:none;overflow:auto;padding:44px 14px 12px;background:#201409;border-right:1px solid #5b3d1e}'+
  '#tiTool h2{margin:0 0 8px;font-size:16px}#tiTool select{width:100%;padding:6px;background:#2c1b0c;color:#f3e3c2;border:1px solid #7a5428;border-radius:6px;font:inherit}'+
  '#tiTool .row{display:flex;flex-wrap:wrap;gap:5px;margin:7px 0}#tiTool button.b{padding:6px 9px;border:1px solid #7a5428;border-radius:6px;background:#3a2410;color:#f3e3c2;cursor:pointer;font:inherit}#tiTool button.b.on{background:#e8a53a;color:#201409}'+
  '#tiTool label.sl{display:block;margin:8px 0 2px;color:#d9c69c}#tiTool label.sl b{float:right;color:#f3e3c2}#tiTool label.sl input{width:100%}'+
  '#tiTool .help{margin:8px 0;padding:8px;border-radius:7px;background:#2c1b0c;color:#d9c69c}#tiTool .stage{flex:1;display:flex;align-items:center;justify-content:center;background:#000;position:relative}'+
  '#tiTool canvas{max-width:100%;max-height:100%;cursor:crosshair;touch-action:none}#tiTool textarea{width:100%;height:90px;background:#140d08;color:#f3e3c2;border:1px solid #7a5428;border-radius:6px;font:11px monospace}'+
  '#tiTool .tinfo{position:absolute;left:10px;bottom:8px;padding:4px 8px;background:rgba(0,0,0,.6);border-radius:6px;font-size:12px;pointer-events:none}';
  document.head.appendChild(css);
  var btn=document.createElement('button');btn.id='tiBtn';btn.type='button';btn.textContent='🍷 predmeti na stolu';room.appendChild(btn);
  ui.root=document.createElement('div');ui.root.id='tiTool';
  var sl=function(k,l,min,max,st){return '<label class="sl">'+l+' <b id="tiV_'+k+'"></b><input type="range" id="tiS_'+k+'" min="'+min+'" max="'+max+'" step="'+st+'"></label>'};
  ui.root.innerHTML='<div class="side"><h2>Predmeti na stolu</h2>'+
    '<div class="help">Izaberi predmet, sto i stolicu (gosta). Točkić miša zumira sliku. Klikni ili prevuci na slici gde predmet stoji (tačka je SREDINA predmeta). Ispod podesi veličinu i boje. „Za ovu stolicu“ važi samo tu, „Za sve stolice“ menja osnovne vrednosti za sve gde nije posebno podešeno.</div>'+
    '<select id="tiItem">'+ITEMS.map(function(i){return '<option value="'+i[0]+'">'+i[1]+'</option>'}).join('')+'</select>'+
    '<div class="row"><select id="tiTable" style="width:auto"><option value="0">Sto 1</option><option value="1">Sto 2</option><option value="2">Sto 3</option></select></div>'+
    '<div class="row" id="tiSeats"><button class="b" data-seat="0">Stolica 1</button><button class="b" data-seat="1">Stolica 2</button><button class="b" data-seat="2">Stolica 3</button><button class="b" data-seat="3">Stolica 4</button></div>'+
    '<div class="row"><button class="b" data-scope="seat">Za ovu stolicu</button><button class="b" data-scope="all">Za sve stolice</button></div>'+
    sl('s','Veličina',0.3,3,0.01)+sl('tilt','Nagib ka stolu (spusti / podigni)',-70,70,1)+sl('rot','Rotacija levo-desno',-45,45,1)+sl('sk','Zakošenost',-45,45,1)+sl('hl','Svetli tonovi',-0.8,0.8,0.01)+
    sl('h','Nijansa',-180,180,1)+sl('sat','Zasićenost',0,2.5,0.01)+sl('b','Osvetljenost',0.2,2,0.01)+sl('c','Kontrast',0.4,2,0.01)+'<h2 style="margin-top:12px">Senka</h2>'+sl('sho','Jačina senke',0,1,0.01)+sl('shx','Pomak senke levo-desno',-1,1,0.01)+sl('shy','Pomak senke gore-dole',-0.4,0.6,0.01)+sl('shw','Širina senke',0.1,2,0.01)+sl('shh','Visina senke',0.03,0.9,0.01)+sl('shb','Zamućenost senke',0,20,0.5)+
    '<h2 style="margin-top:12px">Kopiranje</h2><div class="row"><button class="b" id="tiCopy">Kopiraj ovu stolicu</button><button class="b" id="tiPaste">Nalepi ovde</button></div>'+
    '<div class="row"><button class="b" id="tiPasteAll">Nalepi na sve stolice</button></div>'+
    '<div class="row"><label><input type="checkbox" id="tiWithPos"> i položaj (inače ostaje svoj)</label></div>'+
    '<div class="row"><select id="tiToItem" style="width:100%">'+ITEMS.map(function(i){return '<option value="'+i[0]+'">'+i[1]+'</option>'}).join('')+'</select><button class="b" id="tiToItemBtn">Primeni isto na izabrani predmet (sve stolice)</button></div>'+
    '<div class="help" id="tiClipInfo">Ništa nije kopirano.</div>'+
    '<div class="row"><button class="b" id="tiResetSeat">Vrati ovu stolicu</button><button class="b" id="tiResetItem">Vrati ceo predmet</button></div>'+
    '<div class="row"><button class="b" id="tiExport">Izvezi JSON</button><button class="b" id="tiImport">Uvezi JSON</button></div>'+
    '<div id="tiBox" style="display:none"><textarea id="tiText"></textarea><div class="row"><button class="b" id="tiDoImport">Primeni</button></div></div>'+
    '<div class="row" style="margin-top:12px"><button class="b" id="tiClose" style="width:100%">Zatvori alat</button></div></div>'+
    '<div class="stage"><canvas id="tiCv" width="1040" height="600"></canvas><div class="tinfo" id="tiInfo"></div></div>';
  document.body.appendChild(ui.root);
  cv=ui.root.querySelector('#tiCv');g=cv.getContext('2d');
  ui.root.querySelector('#tiItem').addEventListener('change',function(e){key=e.target.value;refreshUi();draw()});
  ui.root.querySelector('#tiTable').addEventListener('change',function(e){table=+e.target.value;seat=0;view={z:1,cx:null,cy:null};refreshUi();draw()});
  ui.root.querySelectorAll('[data-seat]').forEach(function(b){b.addEventListener('click',function(){seat=+b.dataset.seat;refreshUi();draw()})});
  ui.root.querySelectorAll('[data-scope]').forEach(function(b){b.addEventListener('click',function(){scope=b.dataset.scope;refreshUi()})});
  ['s','tilt','rot','sk','hl','h','sat','b','c','sho','shx','shy','shw','shh','shb'].forEach(function(k){ui.root.querySelector('#tiS_'+k).addEventListener('input',function(e){setVal(k,+e.target.value)})});
  var clip=null,STYLE=['s','tilt','rot','sk','hl','h','sat','b','c','sho','shx','shy','shw','shh','shb'];
  function styleOf(c,withPos){var o={};STYLE.forEach(function(k){o[k]=c[k]});if(withPos){o.x=c.x;o.y=c.y}return o}
  ui.root.querySelector('#tiCopy').addEventListener('click',function(){clip=cur();ui.root.querySelector('#tiClipInfo').textContent='Kopirano: '+ITEMS.filter(function(i){return i[0]===key})[0][1]+', sto '+(table+1)+', stolica '+(seat+1)+'.'});
  function pasteTo(id,withPos){var it=entry(true);it.seat[id]=Object.assign(it.seat[id]||{},styleOf(clip,withPos))}
  ui.root.querySelector('#tiPaste').addEventListener('click',function(){if(!clip)return;pasteTo(seatId(),ui.root.querySelector('#tiWithPos').checked);save();refreshUi();draw()});
  ui.root.querySelector('#tiPasteAll').addEventListener('click',function(){if(!clip)return;var wp=ui.root.querySelector('#tiWithPos').checked;T.seats.forEach(function(s){pasteTo(s.id,wp)});save();refreshUi();draw()});
  ui.root.querySelector('#tiToItemBtn').addEventListener('click',function(){
    if(!clip)return;var tk=ui.root.querySelector('#tiToItem').value,d=data();if(!d.items)d.items={};
    var it=d.items[tk]||(d.items[tk]={def:{},seat:{}});it.def=Object.assign(it.def||{},styleOf(clip,false));if(!it.seat)it.seat={};save();refreshUi();draw();
  });
  ui.root.querySelector('#tiResetSeat').addEventListener('click',function(){var it=entry(false);if(it){delete it.seat[seatId()];save();refreshUi();draw()}});
  ui.root.querySelector('#tiResetItem').addEventListener('click',function(){if(confirm('Vratiti ceo predmet na početno?')){delete data().items[key];save();refreshUi();draw()}});
  ui.root.querySelector('#tiExport').addEventListener('click',function(){
    var txt=JSON.stringify(Object.assign({format:'cookster-table-items',exportedAt:new Date().toISOString()},data()),null,1),ta=ui.root.querySelector('#tiText');
    ui.root.querySelector('#tiBox').style.display='block';ta.value=txt;ta.focus();ta.select();
    try{var bl=new Blob([txt],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(bl);a.download='cookster_predmeti_na_stolu.json';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},800)}catch(e){}
  });
  ui.root.querySelector('#tiImport').addEventListener('click',function(){var b=ui.root.querySelector('#tiBox');b.style.display=b.style.display==='none'?'block':'none'});
  ui.root.querySelector('#tiDoImport').addEventListener('click',function(){try{var o=JSON.parse(ui.root.querySelector('#tiText').value);if(!o.items)throw 0;T.tableItems.set({items:o.items});refreshUi();draw()}catch(e){alert('JSON nije ispravan.')}});
  ui.root.querySelector('#tiClose').addEventListener('click',close);
  cv.addEventListener('pointerdown',function(e){drag=true;cv.setPointerCapture(e.pointerId);var p=toScene(e);setPos(p.x,p.y);refreshUi()});
  cv.addEventListener('pointermove',function(e){if(drag){var p=toScene(e);setPos(p.x,p.y);refreshUi()}});
  cv.addEventListener('pointerup',function(){drag=false});
  // the mouse wheel zooms the picture towards the pointer
  cv.addEventListener('wheel',function(e){
    e.preventDefault();var p=toScene(e),z0=view.z;view.z=Math.max(1,Math.min(6,view.z*(e.deltaY<0?1.2:1/1.2)));
    var r=cv.getBoundingClientRect(),fx=(e.clientX-r.left)/r.width,fy=(e.clientY-r.top)/r.height;
    view.cx=p.x-(fx-.5)*vw();view.cy=p.y-(fy-.5)*vh();draw();
  },{passive:false});
  ['keydown','keyup','keypress'].forEach(function(n){ui.root.addEventListener(n,function(e){e.stopPropagation()})});
  ['pointerdown','pointerup','mousedown','mouseup','click','wheel','contextmenu'].forEach(function(n){ui.root.addEventListener(n,function(e){e.stopPropagation()})});
  btn.addEventListener('click',function(e){e.stopPropagation();open()});
}
function open(){ui.root.classList.add('open');refreshUi();draw()}
function close(){ui.root.classList.remove('open')}
build();
window.CooksterTableItemsTool={open:open,close:close};
})();
