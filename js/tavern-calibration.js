/* Cookster - tool "Kalibracija kafane".
   Draw, on the picture of the tavern, with points joined by very thin lines:
     1. Pod       - where guests may walk
     2. Zabrana   - tables and edges that guests may not cross
     3. Maska stola   - the parts of the tables that cover a guest who walks behind the table
     4. Maska stolice - for every chair: the part of the chair that covers the guest who sits on it
     7. Mesta sedenja: gde gost sedi na svakoj stolici, gde stoji pre sedanja i kuda gleda (strelica)
     6. Sunđer: gde čisti, šta ne dira, i kako leži na podu (veličina, spljoštenost, rotacija...) na raznim mestima
     5. Maska stolice (hod) - for every chair: the part that covers a guest who walks behind it (removed when somebody sits)
     8. Konobar: gde sme da hoda, putanja kojom ide (otvorene linije) i mesto kod svakog stola gde prima narudžbinu
   The mouse wheel zooms (around the pointer), dragging the empty picture moves it. Everything is saved in the browser at once
   and is used by the guests at once. "Izvezi JSON" gives a file that can be built into the game. */
(function(){
'use strict';
var T=window.CooksterTavern,room=document.getElementById('tavernScene');
if(!T||!room||window.CooksterTavernCal)return;
var W=T.size.w,H=T.size.h,NS='http://www.w3.org/2000/svg';
var LAYERS=[
  {id:'floor',label:'Pod: gde gost sme da hoda',color:'#3ddc84',help:'Obeleži celu površinu poda po kojoj gost sme da se kreće. Može više oblika.'},
  {id:'blocked',label:'Zabrana: stolovi i ivice',color:'#ff4d4d',help:'Obeleži stolove (i stolice oko njih) i sve ivice preko kojih gost NE sme da pređe. Gosti ih zaobilaze.'},
  {id:'tableMask',label:'Maska stola',color:'#4da3ff',help:'Obeleži delove stolova koji treba da prekriju gosta koji hoda iza stola. Jedan oblik po stolu.'},
  {id:'chairMask',label:'Maska stolice',color:'#ffb347',help:'Izaberi sto i stolicu (ili klikni broj stolice na slici), pa nacrtaj deo stolice koji prekriva gosta kad sedne.'},
  {id:'chairWalk',label:'Maska stolice: dok gost hoda iza nje',color:'#c77dff',help:'Izaberi sto i stolicu, pa nacrtaj deo stolice koji prekriva gosta koji prolazi IZA stolice. Kad neko sedne na tu stolicu, ova maska nestaje, a gost prekriva stolicu.'},
  {id:'cleanExclude',label:'Sunđer NE čisti: stolovi (izuzeci)',color:'#ff7ad9',help:'Obeleži sto sa stolicama koje sunđer nikad ne dira (sto se čisti desnim klikom i dugmetom „Očisti sto“). Isti oblik određuje šta dugme čisti: sto i sve unutar oblika koji ga obuhvata (pod ispod stola).'},
  {id:'seats',label:'Mesta sedenja (gost na stolici)',color:'#ffe066',help:'Za svaku stolicu: žuta tačka je mesto gde gost sedi (donja sredina njegove slike), kvadrat je mesto gde stoji pre nego što sedne, a strelica pokazuje kuda gleda. Prevuci tačku, kvadrat ili vrh strelice. Pogled nadole = gleda prema nama; levo ili desno = leđima prema nama. Crveno = gost ne može da dođe do te stolice (zabrana zatvara prolaz).'},
  {id:'waiterFloor',label:'Konobar: gde sme da hoda',color:'#00d1c1',help:'Obeleži površinu poda po kojoj konobar sme da ide (stolovi iz „Zabrana“ se i dalje zaobilaze). Može više oblika. Na početku je kopija poda za goste.'},
  {id:'waiterRoute',label:'Konobar: putanja kojom ide',color:'#ff9f1c',open:true,help:'Nacrtaj OTVORENE linije kojima konobar ide (klik dodaje tačku, linija se ne zatvara). Linije koje se dodiruju (tačke bliže od 10 px) su spojene. Dugme „Napravi putanju automatski“ crta put od početnog mesta do svakog stola, pa ga možeš menjati. Ako nema putanje, konobar sam traži put po podu.'},
  {id:'waiterSpots',label:'Konobar: mesta kod stolova',color:'#e0aaff',help:'Za svaki sto: tačka je mesto gde konobar stoji dok prima narudžbinu, a strelica pokazuje kuda gleda. Prevuci tačku ili vrh strelice. „Početno mesto“ je gde konobar čeka (šank). Zelena tačka znači da je mesto na podu konobara, crvena da nije.'},
  {id:'serve',label:'Posluženje: hrana i piće po gostu',color:'#ffb86b',help:'Izaberi sto i gosta (stolicu), pa izaberi šta crtaš: „Jelo gosta“ (tanjir/posuda ispred njega), „Piće gosta“, ili „Zajedničko jelo stola“ (oval, pečenje... za ceo sto). Klik na sliku postavlja tačku (tačka je donja sredina jela). Prevuci tačku da je pomeriš, desni klik je briše. Tačke važe i kad dođe jedan, tri ili četiri gosta: koristi se tačka gosta koji sedi.'},
  {id:'surfaces',label:'Sunđer: površine i kako leži',color:'#7fe3ff',help:'Sunđer čisti sve što je u nekoj površini (pod, zidovi, šank...), osim stolova. Izaberi površinu, nacrtaj joj OBLIK, pa u TAČKAMA SUNĐERA podesi kako sunđer tu stoji. Kasnija površina u listi je iznad ranije (pod je prvi).'}
];
function seatLayer(l){return l==='chairMask'||l==='chairWalk'}
var spSel=0,surfSel=0,spMode='shape',cal=null,layer='floor',active={},seatSel=0,vis={floor:true,blocked:true,tableMask:true,chairMask:true,chairWalk:true,cleanExclude:true,surfaces:true,seats:true,waiterFloor:true,waiterRoute:true,waiterSpots:true,serve:true};
var serveKind='jelo';
var showPath=false;
var view={x:0,y:0,w:W,h:H},ui={},svg,gMain,drag=null,pan=null;

function clone(o){return JSON.parse(JSON.stringify(o))}
function polys(l,seat){
  if(seatLayer(l)){var k=seat===undefined?seatSel:seat;if(!cal[l])cal[l]={};if(!cal[l][k])cal[l][k]=[];return cal[l][k]}
  if(l==='seats'||l==='waiterSpots'||l==='serve')return [];
  if(l==='surfaces'){var sf=cal.surfaces&&cal.surfaces[surfSel];return(spMode==='shape'&&sf)?sf.polys:[]}
  if(!cal[l])cal[l]=[];
  return cal[l];
}
function curPolys(){return polys(layer)}
function curSurf(){return cal&&cal.surfaces&&cal.surfaces[surfSel]}
function curPts(){var f=curSurf();return f?f.points:[]}
function pointsMode(){return layer==='surfaces'&&spMode==='points'}
function actIdx(){var a=curPolys();var key=seatLayer(layer)?layer+':'+seatSel:layer;var i=active[key];if(i===undefined||i>=a.length)i=a.length-1;return i}
function setAct(i){active[seatLayer(layer)?layer+':'+seatSel:layer]=i}
function save(){
  try{localStorage.setItem(T.calKey,JSON.stringify(cal))}catch(_){}
  T.applyCalibration(clone(cal));
}
function el(tag,attrs,parent){var e=document.createElementNS(NS,tag);for(var k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e}

// ---------- building the tool ----------
function build(){
  var css=document.createElement('style');
  css.textContent='#tavernCal{position:fixed;inset:0;z-index:2147483200;display:none;background:#140d08;color:#f3e3c2;font:13px/1.35 system-ui,sans-serif}'+
  '#tavernCal.open{display:flex}'+
  '#tavernCal .tc-side{width:310px;flex:none;overflow:auto;padding:44px 14px 12px;background:#201409;border-right:1px solid #5b3d1e}'+
  '#tavernCal h2{margin:0 0 8px;font-size:16px}'+
  '#tavernCal .tc-layer{display:flex;align-items:center;gap:8px;width:100%;margin:3px 0;padding:7px 8px;border:1px solid #5b3d1e;border-radius:7px;background:#2c1b0c;color:#f3e3c2;cursor:pointer;text-align:left;font:inherit}'+
  '#tavernCal .tc-layer.on{background:#4a2f14;border-color:#e8c27a}'+
  '#tavernCal .tc-dot{width:12px;height:12px;border-radius:50%;flex:none}'+
  '#tavernCal .tc-help{margin:8px 0;padding:8px;border-radius:7px;background:#2c1b0c;color:#d9c69c}'+
  '#tavernCal .tc-row{display:flex;flex-wrap:wrap;gap:5px;margin:6px 0}'+
  '#tavernCal button.tc-b{padding:6px 9px;border:1px solid #7a5428;border-radius:6px;background:#3a2410;color:#f3e3c2;cursor:pointer;font:inherit}'+
  '#tavernCal button.tc-b:hover{background:#5a3a1a}'+
  '#tavernCal select{padding:5px;background:#2c1b0c;color:#f3e3c2;border:1px solid #7a5428;border-radius:6px;font:inherit}'+
  '#tavernCal .tc-chairs button{min-width:34px}'+
  '#tavernCal label.tc-sl{display:block;margin:7px 0 2px;color:#d9c69c}#tavernCal label.tc-sl b{float:right;color:#f3e3c2}#tavernCal label.tc-sl input{width:100%}'+
  '#tavernCal .tc-chairs button.on,#tavernCal button.tc-b.on{background:#e8a53a;color:#201409}'+
  '#tavernCal textarea{width:100%;height:110px;background:#140d08;color:#f3e3c2;border:1px solid #7a5428;border-radius:6px;font:11px monospace}'+
  '#tavernCal .tc-stage{flex:1;position:relative;overflow:hidden;background:#000}'+
  '#tavernCal svg{position:absolute;inset:0;width:100%;height:100%;touch-action:none;cursor:crosshair;user-select:none}'+
  '#tavernCal .tc-info{position:absolute;left:10px;bottom:8px;padding:4px 8px;background:rgba(0,0,0,.6);border-radius:6px;font-size:12px;pointer-events:none}'+
  '#tavernCal label.tc-chk{display:flex;align-items:center;gap:6px;margin:2px 0}'+
  '#tavernCalOpen{position:absolute;left:14px;bottom:14px;z-index:70;border:2px solid #351b0d;border-radius:9px;background:#e8c27a;color:#351b0d;font:700 14px/1 system-ui,sans-serif;padding:7px 14px;cursor:pointer;opacity:.85}'+
  '#tavernCalOpen:hover{opacity:1}';
  document.head.appendChild(css);
  var openBtn=document.createElement('button');openBtn.id='tavernCalOpen';openBtn.type='button';openBtn.textContent='✎ kalibracija';
  room.appendChild(openBtn);
  ui.root=document.createElement('div');ui.root.id='tavernCal';
  ui.root.innerHTML='<div class="tc-side"><h2>Kalibracija kafane</h2>'+
    '<div id="tcLayers"></div><div class="tc-help" id="tcHelp"></div>'+
    '<div id="tcChairBox" style="display:none"><div class="tc-row"><label>Sto <select id="tcTable"></select></label></div>'+
      '<div class="tc-row tc-chairs" id="tcChairs"></div></div>'+
    '<div id="tcServeBox" style="display:none"><div class="tc-row"><button class="tc-b" data-k="jelo">Jelo gosta</button><button class="tc-b" data-k="pice">Piće gosta</button><button class="tc-b" data-k="sto">Zajedničko jelo stola</button></div></div>'+
    '<div id="tcSurfBox" style="display:none">'+
      '<div class="tc-row"><select id="tcSurf" style="width:100%"></select></div>'+
      '<div class="tc-row"><button class="tc-b" data-s="new">+ Površina</button><button class="tc-b" data-s="up">↑ ispod</button><button class="tc-b" data-s="down">↓ iznad</button><button class="tc-b" data-s="del">Obriši</button></div>'+
      '<label class="tc-sl">Naziv<input id="tcSurfName" type="text" style="width:100%;padding:5px;background:#2c1b0c;color:#f3e3c2;border:1px solid #7a5428;border-radius:6px;font:inherit"></label>'+
      '<div class="tc-row"><label>Tip <select id="tcSurfKind"><option value="h">vodoravna (sunđer leži)</option><option value="v">uspravna (sunđer uspravan)</option></select></label></div>'+
      '<div class="tc-row"><label>Slika <select id="tcSurfImg"><option value="lezeci">ležeći</option><option value="uspravni1">uspravni 1 (uži)</option><option value="uspravni2">uspravni 2 (širi)</option></select></label></div>'+
      '<div class="tc-row"><button class="tc-b" id="tcModeShape">Oblik površine</button><button class="tc-b" id="tcModePts">Tačke sunđera</button></div>'+
      '<div id="tcPtsBox"><div class="tc-help" id="tcSpInfo"></div>'+
      '<label class="tc-sl">Veličina <b id="tcSv_scale"></b><input type="range" id="tcS_scale" min="0.3" max="2.4" step="0.01"></label>'+
      '<label class="tc-sl">Spljoštenost <b id="tcSv_flat"></b><input type="range" id="tcS_flat" min="0.3" max="1.5" step="0.01"></label>'+
      '<label class="tc-sl">Rotacija <b id="tcSv_angle"></b><input type="range" id="tcS_angle" min="-60" max="60" step="1"></label>'+
      '<label class="tc-sl">Zakošenost <b id="tcSv_skew"></b><input type="range" id="tcS_skew" min="-45" max="45" step="1"></label>'+
      '<label class="tc-sl">Podignutost <b id="tcSv_lift"></b><input type="range" id="tcS_lift" min="0" max="50" step="1"></label>'+
      '<label class="tc-sl">Senka <b id="tcSv_shadow"></b><input type="range" id="tcS_shadow" min="0" max="1" step="0.01"></label></div></div>'+
    '<div id="tcWaiterBox" style="display:none"><div class="tc-row"><button class="tc-b" data-a="autoroute">Napravi putanju automatski</button><button class="tc-b" data-a="togglepath">Probni hod: uključi/isključi</button></div></div>'+
    '<div class="tc-row"><button class="tc-b" data-a="new">Novi oblik</button><button class="tc-b" data-a="prev">◀</button><button class="tc-b" data-a="next">▶</button>'+
      '<button class="tc-b" data-a="undo">Poništi tačku</button></div>'+
    '<div class="tc-row"><button class="tc-b" data-a="delpoly">Obriši oblik</button><button class="tc-b" data-a="dellayer">Obriši sloj</button><button class="tc-b" data-a="reset">Vrati početno (sloj)</button></div>'+
    '<div class="tc-row"><button class="tc-b" data-a="fit">Ceo prikaz</button><button class="tc-b" data-a="export">Izvezi JSON</button><button class="tc-b" data-a="import">Uvezi JSON</button></div>'+
    '<div id="tcExportBox" style="display:none"><div class="tc-help">Ako se fajl nije preuzeo: klikni u polje, pritisni Ctrl+A pa Ctrl+C i nalepi tekst u chat (ili dugme „Kopiraj“).</div><textarea id="tcExportText" readonly></textarea><div class="tc-row"><button class="tc-b" data-a="copyexport">Kopiraj</button><button class="tc-b" data-a="closeexport">Zatvori</button></div></div>'+
    '<div id="tcImportBox" style="display:none"><textarea id="tcImportText" placeholder="Nalepi JSON ovde"></textarea><div class="tc-row"><button class="tc-b" data-a="doimport">Primeni</button></div></div>'+
    '<div class="tc-help"><b>Kako se crta:</b><br>• Klik na sliku dodaje tačku, tačke se povezuju tankim linijama (oblik se zatvara sam).<br>• Prevuci tačku da je pomeriš. Dupli klik ili desni klik na tačku je briše.<br>• Klik na liniju ubacuje novu tačku tačno na toj liniji, između dve tačke. Klik van linija dodaje tačku na kraj oblika.<br>• Točak miša približava i udaljava (oko pokazivača). Prevlačenje prazne slike pomera prikaz.<br>• "Novi oblik" počinje novi oblik u istom sloju; ◀ ▶ prelaze među oblicima.<br>• Sve se čuva odmah i gosti ga odmah koriste.</div>'+
    '<h2 style="margin-top:12px">Prikaz slojeva</h2><div id="tcVis"></div>'+
    '<div class="tc-row" style="margin-top:12px"><button class="tc-b" data-a="close" style="width:100%">Zatvori alat</button></div></div>'+
    '<div class="tc-stage"><div class="tc-info" id="tcInfo"></div></div>';
  document.body.appendChild(ui.root);
  var stage=ui.root.querySelector('.tc-stage');
  svg=document.createElementNS(NS,'svg');svg.setAttribute('preserveAspectRatio','xMidYMid meet');stage.insertBefore(svg,stage.firstChild);
  el('image',{href:T.roomSrc,x:0,y:0,width:W,height:H},svg);
  gMain=el('g',{},svg);
  ui.info=ui.root.querySelector('#tcInfo');

  var lbox=ui.root.querySelector('#tcLayers'),vbox=ui.root.querySelector('#tcVis');
  LAYERS.forEach(function(L){
    var b=document.createElement('button');b.type='button';b.className='tc-layer';b.dataset.layer=L.id;
    b.innerHTML='<span class="tc-dot" style="background:'+L.color+'"></span><span>'+L.label+'</span>';
    b.addEventListener('click',function(){layer=L.id;refreshUi();draw()});
    lbox.appendChild(b);
    var c=document.createElement('label');c.className='tc-chk';
    c.innerHTML='<input type="checkbox" checked><span class="tc-dot" style="background:'+L.color+'"></span>'+L.label;
    c.querySelector('input').addEventListener('change',function(e){vis[L.id]=e.target.checked;draw()});
    vbox.appendChild(c);
  });
  var tsel=ui.root.querySelector('#tcTable');
  for(var i=0;i<T.tables.length;i++){var o=document.createElement('option');o.value=i;o.textContent=(i+1);tsel.appendChild(o)}
  tsel.addEventListener('change',function(){seatSel=(+tsel.value)*4+(seatSel%4);refreshUi();draw()});
  var cbox=ui.root.querySelector('#tcChairs');
  for(var k=0;k<4;k++)(function(k){
    var b=document.createElement('button');b.type='button';b.className='tc-b';b.textContent='Stolica '+(k+1);b.dataset.k=k;
    b.addEventListener('click',function(){seatSel=Math.floor(seatSel/4)*4+k;refreshUi();draw()});cbox.appendChild(b);
  })(k);
  ['scale','flat','angle','skew','lift','shadow'].forEach(function(k){
    var inp=ui.root.querySelector('#tcS_'+k);
    inp.addEventListener('input',function(){var q=curPts()[spSel];if(!q)return;q[k]=+inp.value;ui.root.querySelector('#tcSv_'+k).textContent=(+inp.value).toFixed(k==='angle'||k==='lift'||k==='skew'?0:2);save();draw()});
  });
  ui.root.querySelector('#tcSurf').addEventListener('change',function(e){surfSel=+e.target.value;spSel=0;refreshUi();draw()});
  ui.root.querySelector('#tcSurfName').addEventListener('input',function(e){var f=curSurf();if(!f)return;f.name=e.target.value;var o=ui.root.querySelector('#tcSurf').options[surfSel];if(o)o.textContent=(surfSel+1)+'. '+f.name;save()});
  ui.root.querySelector('#tcSurfKind').addEventListener('change',function(e){var f=curSurf();if(!f)return;f.kind=e.target.value;f.img=f.kind==='h'?'lezeci':'uspravni1';refreshUi();save();draw()});
  ui.root.querySelector('#tcSurfImg').addEventListener('change',function(e){var f=curSurf();if(!f)return;f.img=e.target.value;save();draw()});
  ui.root.querySelector('#tcModeShape').addEventListener('click',function(){spMode='shape';refreshUi();draw()});
  ui.root.querySelector('#tcModePts').addEventListener('click',function(){spMode='points';refreshUi();draw()});
  ui.root.querySelectorAll('#tcServeBox [data-k]').forEach(function(b){b.addEventListener('click',function(){serveKind=b.dataset.k;refreshUi();draw()})});
  ui.root.querySelectorAll('[data-s]').forEach(function(b){b.addEventListener('click',function(){surfAct(b.dataset.s)})});
  ui.root.querySelectorAll('[data-a]').forEach(function(b){b.addEventListener('click',function(){act(b.dataset.a)})});
  ['wheel'].forEach(function(n){svg.addEventListener(n,onWheel,{passive:false})});
  svg.addEventListener('pointerdown',onDown);svg.addEventListener('pointermove',onMove);
  svg.addEventListener('pointerup',onUp);svg.addEventListener('pointercancel',onUp);
  svg.addEventListener('contextmenu',function(e){e.preventDefault()});
  svg.addEventListener('dblclick',function(e){var t=e.target;if(t&&t.dataset&&t.dataset.p!==undefined){delPoint(+t.dataset.p,+t.dataset.i);e.preventDefault()}if(t&&t.dataset&&t.dataset.sp!==undefined){delSponge(+t.dataset.sp);e.preventDefault()}});
  openBtn.addEventListener('click',function(e){e.stopPropagation();open()});
  addEventListener('resize',function(){if(ui.root.classList.contains('open'))draw()});
  ['keydown','keyup','keypress'].forEach(function(n){ui.root.addEventListener(n,function(e){e.stopPropagation()})});
  ['pointerdown','pointerup','mousedown','mouseup','click','wheel','contextmenu'].forEach(function(n){ui.root.addEventListener(n,function(e){e.stopPropagation()},n==='wheel'?{passive:false}:undefined)});
}

// ---------- view: zoom and pan ----------
function setView(x,y,w,h){
  var minW=W/14;if(w<minW){var f=minW/w;w=minW;h*=f}
  if(w>W){h=h*W/w;w=W}
  var r=ui.root.querySelector('.tc-stage').getBoundingClientRect(),asp=(r.width||1)/(r.height||1);
  h=w/asp;if(h>H*1.0){h=H;w=h*asp}
  x=Math.max(-40,Math.min(W-w+40,x));y=Math.max(-40,Math.min(H-h+40,y));
  view={x:x,y:y,w:w,h:h};svg.setAttribute('viewBox',x+' '+y+' '+w+' '+h);
}
function fitView(){
  var r=ui.root.querySelector('.tc-stage').getBoundingClientRect(),asp=(r.width||1)/(r.height||1);
  var w=W,h=W/asp;if(h<H){h=H;w=H*asp}
  view={x:(W-w)/2,y:(H-h)/2,w:w,h:h};svg.setAttribute('viewBox',view.x+' '+view.y+' '+view.w+' '+view.h);
}
function toImg(e){
  var pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;
  var m=svg.getScreenCTM();if(!m)return{x:0,y:0};var p=pt.matrixTransform(m.inverse());return{x:p.x,y:p.y};
}
function pxScale(){var r=svg.getBoundingClientRect();return view.w/Math.max(1,r.width)>view.h/Math.max(1,r.height)?view.w/Math.max(1,r.width):view.h/Math.max(1,r.height)}
function onWheel(e){
  e.preventDefault();
  var p=toImg(e),f=e.deltaY<0?1/1.18:1.18;
  var nw=view.w*f,nh=view.h*f;
  if(nw>W*1.02&&f>1){fitView();draw();return}
  var nx=p.x-(p.x-view.x)*f,ny=p.y-(p.y-view.y)*f;
  setView(nx,ny,nw,nh);draw();
}

// ---------- drawing the polygons ----------
function draw(){
  while(gMain.firstChild)gMain.removeChild(gMain.firstChild);
  var s=pxScale(),R=3.1*s,ai=actIdx();
  LAYERS.forEach(function(L){
    if(!vis[L.id]||L.id==='seats'||L.id==='waiterSpots'||L.id==='serve')return;
    var lists=[];
    if(seatLayer(L.id)){
      if(layer===L.id)lists=[{a:polys(L.id,seatSel),seat:seatSel,on:true}];
      Object.keys(cal[L.id]||{}).forEach(function(k){if(layer===L.id&&+k===seatSel)return;lists.push({a:cal[L.id][k],seat:+k,on:false})});
    }else if(L.id==='surfaces'){
      lists=(cal.surfaces||[]).map(function(sf,i){return{a:sf.polys,on:layer==='surfaces'&&spMode==='shape'&&i===surfSel,seat:undefined}});
    }else lists=[{a:cal[L.id]||[],on:layer===L.id}];
    lists.forEach(function(ls){
      ls.a.forEach(function(poly,pi){
        var isAct=ls.on&&layer===L.id&&pi===ai;
        if(poly.length>=2){
          var pts=poly.map(function(q){return q[0]+','+q[1]}).join(' ');
          var closed=poly.length>=3&&!L.open;
          var pe=el(closed?'polygon':'polyline',{points:pts,fill:closed?L.color:'none','fill-opacity':isAct?.16:.07,stroke:L.color,'stroke-width':1,'vector-effect':'non-scaling-stroke','stroke-opacity':ls.on?1:.55,'pointer-events':'none'},gMain);
          // a shape of another chair: a click on it selects that chair, so it can be edited or deleted
          if(!ls.on&&ls.seat!==undefined&&seatLayer(L.id)&&layer===L.id){pe.setAttribute('pointer-events','all');pe.dataset.seatpoly=ls.seat;pe.style.cursor='pointer'}
        }
        if(ls.on&&layer===L.id)poly.forEach(function(q,i){
          var c=el('circle',{cx:q[0],cy:q[1],r:isAct?R:R*.8,fill:isAct?'#fff':L.color,stroke:L.color,'stroke-width':1,'vector-effect':'non-scaling-stroke',style:'cursor:move'},gMain);
          c.dataset.p=pi;c.dataset.i=i;
        });
      });
    });
  });
  if(pointsMode()&&vis.surfaces)drawSponge(s,R);
  if(layer==='seats'&&vis.seats)drawSeats(s,R);
  if(layer==='serve'&&vis.serve)drawServe(s,R);
  if(showPath&&(layer==='waiterRoute'||layer==='waiterSpots'))drawTrial(s,R);
  if((layer==='waiterSpots'||layer==='waiterRoute')&&vis.waiterSpots)drawSpots(s,R);
  if(seatLayer(layer)&&layer!=='seats'){                           // numbers of the chairs, to click them
    T.seats.forEach(function(st){
      var on=st.id===seatSel,g=el('g',{style:'cursor:pointer'},gMain);
      var c=el('circle',{cx:st.x,cy:st.y,r:(on?9:7)*s*1.6,fill:on?'#ffb347':'rgba(20,10,4,.7)',stroke:'#ffb347','stroke-width':1,'vector-effect':'non-scaling-stroke'},g);
      var t=el('text',{x:st.x,y:st.y+3.4*s*1.6,'text-anchor':'middle','font-size':8.5*s*1.6,fill:on?'#201409':'#ffd9a0','font-family':'system-ui,sans-serif','pointer-events':'none'},g);
      t.textContent=(st.table+1)+'.'+((st.id%4)+1);
      c.dataset.seat=st.id;
    });
  }
  ui.info.textContent=LAYERS.filter(function(L){return L.id===layer})[0].label+(layer==='surfaces'?' · '+((curSurf()||{}).name||'')+(spMode==='points'?' · tačaka: '+curPts().length:' · oblika: '+curPolys().length):' · oblika: '+curPolys().length)+((seatLayer(layer)||layer==='serve')?' · sto '+(Math.floor(seatSel/4)+1)+', stolica '+((seatSel%4)+1):'')+' · zumiranje '+(W/view.w).toFixed(1)+'x';
}
// serving: for every guest the place of his dish and of his drink, and for every table the place of the dish for everyone
function serveData(){if(!cal.serve)cal.serve={seat:{},table:{}};if(!cal.serve.seat)cal.serve.seat={};if(!cal.serve.table)cal.serve.table={};return cal.serve}
var SERVE_COL={jelo:'#ff9f43',pice:'#4dd2ff',sto:'#d68bff'},SERVE_TXT={jelo:'J',pice:'P',sto:'S'};
function drawServe(s,R){
  var D=serveData();
  function pt(x,y,kind,label,on,key){
    var col=SERVE_COL[kind],g=el('g',{style:'cursor:move'},gMain);
    if(kind==='sto')el('rect',{x:x-R*1.9,y:y-R*1.9,width:R*3.8,height:R*3.8,transform:'rotate(45 '+x+' '+y+')',fill:on?'#fff':col,stroke:'#201409','stroke-width':1.5,'vector-effect':'non-scaling-stroke'},g).dataset.sv=key;
    else el('circle',{cx:x,cy:y,r:R*(on?1.9:1.5),fill:on?'#fff':col,stroke:'#201409','stroke-width':1.5,'vector-effect':'non-scaling-stroke'},g).dataset.sv=key;
    var t=el('text',{x:x+R*2.4,y:y+R*0.9,'font-size':R*3.2,fill:'#fff','font-family':'system-ui,sans-serif','pointer-events':'none','paint-order':'stroke',stroke:'#201409','stroke-width':3},g);
    t.textContent=SERVE_TXT[kind]+' '+label;
  }
  T.seats.forEach(function(st){
    var on=st.id===seatSel,g=el('g',{style:'cursor:pointer'},gMain);
    var c=el('circle',{cx:st.x,cy:st.y,r:(on?9:7)*s*1.6,fill:on?'#ffe066':'rgba(20,10,4,.7)',stroke:'#ffe066','stroke-width':1,'vector-effect':'non-scaling-stroke'},g);
    var t=el('text',{x:st.x,y:st.y+3.4*s*1.6,'text-anchor':'middle','font-size':8.5*s*1.6,fill:on?'#201409':'#ffe9a0','font-family':'system-ui,sans-serif','pointer-events':'none'},g);
    t.textContent=(st.table+1)+'.'+((st.id%4)+1);c.dataset.seat=st.id;
    var d=D.seat[st.id]||{},lab=(st.table+1)+'.'+((st.id%4)+1);
    if(d.jelo){pt(d.jelo.x,d.jelo.y,'jelo',lab,on&&serveKind==='jelo','seat|'+st.id+'|jelo');el('line',{x1:st.x,y1:st.y,x2:d.jelo.x,y2:d.jelo.y,stroke:SERVE_COL.jelo,'stroke-width':1,'stroke-dasharray':'3 3','vector-effect':'non-scaling-stroke','pointer-events':'none'},gMain)}
    if(d.pice){pt(d.pice.x,d.pice.y,'pice',lab,on&&serveKind==='pice','seat|'+st.id+'|pice');el('line',{x1:st.x,y1:st.y,x2:d.pice.x,y2:d.pice.y,stroke:SERVE_COL.pice,'stroke-width':1,'stroke-dasharray':'3 3','vector-effect':'non-scaling-stroke','pointer-events':'none'},gMain)}
  });
  T.tables.forEach(function(tb,ti){var q=D.table[ti];if(q)pt(q.x,q.y,'sto','Sto '+(ti+1),Math.floor(seatSel/4)===ti&&serveKind==='sto','table|'+ti)});
}
// the seats: where the guest sits (with his picture), where he stands before he sits, and where he looks
function drawSeats(s,R){
  var reach=T.seatReach?T.seatReach():[],list=cal.seats||[];
  list.forEach(function(q){
    var on=q.id===seatSel,ok=reach[q.id]!==false,col=ok?'#ffe066':'#ff4d4d',pose=T.poseFromDir(q.dir),info=T.poseInfo(pose),k=T.seatScale(q.y);
    if(info)el('image',{href:info.src,x:q.x-info.w*k/2,y:q.y-info.h*k,width:info.w*k,height:info.h*k,opacity:on?.9:.6,'pointer-events':'none'},gMain);
    var L=70+30*(q.y/H),ex=q.x+Math.cos(q.dir*Math.PI/180)*L,ey=q.y+Math.sin(q.dir*Math.PI/180)*L*.6+0;
    el('line',{x1:q.ax,y1:q.ay,x2:q.x,y2:q.y,stroke:col,'stroke-width':1,'stroke-dasharray':'3 3','vector-effect':'non-scaling-stroke','pointer-events':'none'},gMain);
    var ar=el('line',{x1:q.x,y1:q.y,x2:ex,y2:ey,stroke:col,'stroke-width':2.2,'vector-effect':'non-scaling-stroke','pointer-events':'none'},gMain);
    var ang=Math.atan2(ey-q.y,ex-q.x),hs=R*3.2;
    el('polygon',{points:ex+','+ey+' '+(ex-Math.cos(ang-.45)*hs)+','+(ey-Math.sin(ang-.45)*hs)+' '+(ex-Math.cos(ang+.45)*hs)+','+(ey-Math.sin(ang+.45)*hs),fill:col,'pointer-events':'none'},gMain);
    var h=el('circle',{cx:ex,cy:ey,r:R*1.3,fill:'rgba(0,0,0,.25)',stroke:col,'stroke-width':1,'vector-effect':'non-scaling-stroke',style:'cursor:crosshair'},gMain);h.dataset.st=q.id;h.dataset.part='d';
    var a=el('rect',{x:q.ax-R*1.2,y:q.ay-R*1.2,width:R*2.4,height:R*2.4,fill:on?'#fff':col,stroke:'#201409','stroke-width':1,'vector-effect':'non-scaling-stroke',style:'cursor:move'},gMain);a.dataset.st=q.id;a.dataset.part='a';
    var c=el('circle',{cx:q.x,cy:q.y,r:on?R*1.5:R*1.15,fill:on?'#fff':col,stroke:'#201409','stroke-width':1,'vector-effect':'non-scaling-stroke',style:'cursor:move'},gMain);c.dataset.st=q.id;c.dataset.part='p';
    var t=el('text',{x:q.x+R*1.8,y:q.y+R*0.6,'font-size':R*3.2,fill:'#fff','font-family':'system-ui,sans-serif','pointer-events':'none','paint-order':'stroke',stroke:'#201409','stroke-width':3},gMain);
    t.textContent=(Math.floor(q.id/4)+1)+'.'+((q.id%4)+1)+(ok?'':' nedostupno');
  });
}
// the waiter: the place where he stands at every table (and where he looks), and the place where he waits
function spotName(id){return id==='home'?'Početno mesto (šank)':'Sto '+(id+1)}
function drawSpots(s,R){
  (cal.waiterSpots||[]).forEach(function(q,qi){
    var ok=T.waiterWalkable(q.x,q.y),col=ok?'#3ddc84':'#ff4d4d',on=layer==='waiterSpots';
    var L=60+30*(q.y/H),ex=q.x+Math.cos(q.dir*Math.PI/180)*L,ey=q.y+Math.sin(q.dir*Math.PI/180)*L*.6;
    el('line',{x1:q.x,y1:q.y,x2:ex,y2:ey,stroke:col,'stroke-width':2.2,'vector-effect':'non-scaling-stroke','pointer-events':'none'},gMain);
    var ang=Math.atan2(ey-q.y,ex-q.x),hs=R*3.2;
    el('polygon',{points:ex+','+ey+' '+(ex-Math.cos(ang-.45)*hs)+','+(ey-Math.sin(ang-.45)*hs)+' '+(ex-Math.cos(ang+.45)*hs)+','+(ey-Math.sin(ang+.45)*hs),fill:col,'pointer-events':'none'},gMain);
    if(on){var h=el('circle',{cx:ex,cy:ey,r:R*1.3,fill:'rgba(0,0,0,.25)',stroke:col,'stroke-width':1,'vector-effect':'non-scaling-stroke',style:'cursor:crosshair'},gMain);h.dataset.ws=qi;h.dataset.part='d'}
    var c=el('circle',{cx:q.x,cy:q.y,r:R*1.6,fill:col,stroke:'#201409','stroke-width':1.5,'vector-effect':'non-scaling-stroke',style:on?'cursor:move':'','pointer-events':on?'all':'none'},gMain);
    if(on){c.dataset.ws=qi;c.dataset.part='p'}
    var t=el('text',{x:q.x+R*2.2,y:q.y+R*0.8,'font-size':R*3.4,fill:'#fff','font-family':'system-ui,sans-serif','pointer-events':'none','paint-order':'stroke',stroke:'#201409','stroke-width':3},gMain);
    t.textContent=spotName(q.id)+(ok?'':' · nije na podu');
  });
}
// the trial walk: the path the waiter would take from his home place to every table, along the route or over the floor
function drawTrial(s,R){
  var home=(cal.waiterSpots||[]).filter(function(q){return q.id==='home'})[0];if(!home)return;
  var cols=['#ffd60a','#4cc9f0','#f72585'];
  (cal.waiterSpots||[]).forEach(function(q){
    if(q.id==='home')return;
    var p=T.waiterPath({x:home.x,y:home.y},{x:q.x,y:q.y}),col=cols[q.id%3];
    el('polyline',{points:p.map(function(z){return z.x+','+z.y}).join(' '),fill:'none',stroke:col,'stroke-width':3,'stroke-dasharray':'8 5','vector-effect':'non-scaling-stroke','pointer-events':'none'},gMain);
  });
}
// the sponge as it sits at every calibration point of the chosen surface: its picture, the patch it cleans, the shadow
function drawSponge(s,R){
  var f=curSurf();if(!f)return;
  var C=T.spongeImg[f.img]||T.spongeImg.lezeci,pts=f.points||[],lying=f.kind==='h',RAD=T.spongeRadius;
  var w=C.w,h=C.w*C.ratio,ax=C.ax*w,ay=C.ay*h;
  if(spSel>=pts.length)spSel=Math.max(0,pts.length-1);
  pts.forEach(function(q,i){
    var on=i===spSel,k=q.scale,g=el('g',{},gMain);
    if(lying)el('ellipse',{cx:q.x,cy:q.y,rx:RAD*k*1.15,ry:RAD*k*C.flat*q.flat*1.15,fill:'#000','fill-opacity':q.shadow*.55,'pointer-events':'none'},g);
    el('image',{href:C.src,x:-ax,y:-ay-(lying?q.lift:0),width:w,height:h,'pointer-events':'none',opacity:on?1:.8},g);
    g.setAttribute('transform','translate('+q.x+' '+q.y+') scale('+k+' '+(k*q.flat)+') rotate('+q.angle+') skewX('+(q.skew||0)+')');
    el('ellipse',{cx:q.x,cy:q.y,rx:RAD*k,ry:RAD*k*C.flat*q.flat,fill:'none',stroke:on?'#fff':'#ffd84d','stroke-width':1,'stroke-dasharray':'4 3','vector-effect':'non-scaling-stroke','pointer-events':'none'},gMain);
    var c=el('circle',{cx:q.x,cy:q.y,r:on?R*1.15:R*.85,fill:on?'#fff':'#ffd84d',stroke:'#201409','stroke-width':1,'vector-effect':'non-scaling-stroke',style:'cursor:move'},gMain);
    c.dataset.sp=i;
    var t=el('text',{x:q.x+R*1.6,y:q.y-R*1.2,'font-size':R*3.4,fill:'#fff','font-family':'system-ui,sans-serif','pointer-events':'none','paint-order':'stroke',stroke:'#201409','stroke-width':3},gMain);
    t.textContent=(i+1);
  });
}
function refreshSponge(){
  var pts=curPts(),q=pts[spSel];
  ui.root.querySelector('#tcSpInfo').textContent=q?('Tačka '+(spSel+1)+' od '+pts.length+' · klikni na sliku za novu tačku, na broj za izbor.'):'Nema tačaka. Klikni na sliku da dodaš prvu.';
  ['scale','flat','angle','skew','lift','shadow'].forEach(function(k){
    var inp=ui.root.querySelector('#tcS_'+k);inp.disabled=!q;
    if(q){inp.value=q[k]||0;ui.root.querySelector('#tcSv_'+k).textContent=(+(q[k]||0)).toFixed(k==='angle'||k==='lift'||k==='skew'?0:2)}
  });
}
function refreshSurf(){
  var sel=ui.root.querySelector('#tcSurf'),list=cal.surfaces||[];
  if(surfSel>=list.length)surfSel=Math.max(0,list.length-1);
  sel.innerHTML='';
  list.forEach(function(f,i){var o=document.createElement('option');o.value=i;o.textContent=(i+1)+'. '+f.name;sel.appendChild(o)});
  sel.value=surfSel;
  var f=list[surfSel];
  if(f){ui.root.querySelector('#tcSurfName').value=f.name;ui.root.querySelector('#tcSurfKind').value=f.kind;ui.root.querySelector('#tcSurfImg').value=f.img}
  ui.root.querySelector('#tcModeShape').classList.toggle('on',spMode==='shape');
  ui.root.querySelector('#tcModePts').classList.toggle('on',spMode==='points');
  ui.root.querySelector('#tcPtsBox').style.display=spMode==='points'?'block':'none';
  if(spMode==='points')refreshSponge();
}
function surfAct(a){
  var list=cal.surfaces||(cal.surfaces=[]),f=curSurf();
  if(a==='new'){
    list.push({id:'p'+Date.now().toString(36),name:'Nova površina',kind:'v',img:'uspravni1',polys:[[]],points:[{x:Math.round(view.x+view.w/2),y:Math.round(view.y+view.h/2),scale:1,flat:1,angle:0,skew:0,lift:0,shadow:0}]});
    surfSel=list.length-1;spMode='shape';spSel=0;
  }else if(a==='del'){
    if(list.length<=1){alert('Mora da ostane bar jedna površina.');return}
    if(!f||!confirm('Obrisati površinu „'+f.name+'“?'))return;
    list.splice(surfSel,1);surfSel=Math.max(0,surfSel-1);spSel=0;
  }else if(a==='up'||a==='down'){
    var j=surfSel+(a==='up'?-1:1);if(j<0||j>=list.length)return;
    var t=list[surfSel];list[surfSel]=list[j];list[j]=t;surfSel=j;
  }
  save();refreshUi();draw();
}
function refreshUi(){
  ui.root.querySelectorAll('.tc-layer').forEach(function(b){b.classList.toggle('on',b.dataset.layer===layer)});
  ui.root.querySelector('#tcHelp').textContent=LAYERS.filter(function(L){return L.id===layer})[0].help;
  ui.root.querySelector('#tcChairBox').style.display=(seatLayer(layer)||layer==='seats'||layer==='serve')?'block':'none';
  ui.root.querySelector('#tcServeBox').style.display=layer==='serve'?'block':'none';
  ui.root.querySelectorAll('#tcServeBox [data-k]').forEach(function(b){b.classList.toggle('on',b.dataset.k===serveKind)});
  ui.root.querySelector('#tcSurfBox').style.display=layer==='surfaces'?'block':'none';
  ui.root.querySelector('#tcWaiterBox').style.display=(layer==='waiterRoute'||layer==='waiterSpots')?'block':'none';
  if(layer==='surfaces')refreshSurf();
  ui.root.querySelector('#tcTable').value=Math.floor(seatSel/4);
  ui.root.querySelectorAll('#tcChairs button').forEach(function(b){b.classList.toggle('on',+b.dataset.k===seatSel%4)});
}

// ---------- mouse ----------
function nearEdge(poly,p,tol){
  var best=null;
  for(var i=0;i<poly.length;i++){
    var a=poly[i],b=poly[(i+1)%poly.length],vx=b[0]-a[0],vy=b[1]-a[1],l2=vx*vx+vy*vy||1;
    var t=Math.max(0,Math.min(1,((p.x-a[0])*vx+(p.y-a[1])*vy)/l2)),qx=a[0]+vx*t,qy=a[1]+vy*t,d=Math.hypot(qx-p.x,qy-p.y);
    if(d<tol&&(!best||d<best.d))best={d:d,i:i};
  }
  return best;
}
function nearestEdgeAll(polys,p,tol,open){
  var best=null;
  polys.forEach(function(poly,pi){
    var n=poly.length;if(n<2)return;
    var edges=(n===2||open)?n-1:n;                               // two points are one line, from three on the shape is closed
    for(var i=0;i<edges;i++){
      var a=poly[i],b=poly[(i+1)%n],vx=b[0]-a[0],vy=b[1]-a[1],l2=vx*vx+vy*vy;if(!l2)continue;
      var t=Math.max(0,Math.min(1,((p.x-a[0])*vx+(p.y-a[1])*vy)/l2)),qx=a[0]+vx*t,qy=a[1]+vy*t,d=Math.hypot(qx-p.x,qy-p.y);
      if(d<tol&&(!best||d<best.d))best={d:d,pi:pi,i:i,x:Math.round(qx*10)/10,y:Math.round(qy*10)/10};
    }
  });
  return best;
}
function onDown(e){
  var t=e.target;
  if(e.button===2){                                  // right click on a point deletes it
    if(t&&t.dataset&&t.dataset.sv!==undefined){delServe(t.dataset.sv);return}
    if(t&&t.dataset&&t.dataset.p!==undefined)delPoint(+t.dataset.p,+t.dataset.i);
    if(t&&t.dataset&&t.dataset.sp!==undefined)delSponge(+t.dataset.sp);
    return;
  }
  if(e.button===1){pan={sx:e.clientX,sy:e.clientY,vx:view.x,vy:view.y,moved:true};svg.setPointerCapture(e.pointerId);e.preventDefault();return}
  if(e.button!==0)return;
  if(t&&t.dataset&&t.dataset.seat!==undefined){seatSel=+t.dataset.seat;refreshUi();draw();return}
  if(t&&t.dataset&&t.dataset.seatpoly!==undefined){seatSel=+t.dataset.seatpoly;refreshUi();draw();return}
  if(t&&t.dataset&&t.dataset.sv!==undefined){drag={sv:t.dataset.sv};svg.setPointerCapture(e.pointerId);e.preventDefault();return}
  if(t&&t.dataset&&t.dataset.ws!==undefined){drag={ws:+t.dataset.ws,part:t.dataset.part};svg.setPointerCapture(e.pointerId);e.preventDefault();return}
  if(t&&t.dataset&&t.dataset.st!==undefined){
    seatSel=+t.dataset.st;drag={st:seatSel,part:t.dataset.part};svg.setPointerCapture(e.pointerId);refreshUi();draw();e.preventDefault();return;
  }
  if(t&&t.dataset&&t.dataset.sp!==undefined){
    spSel=+t.dataset.sp;drag={sp:spSel};svg.setPointerCapture(e.pointerId);refreshSponge();draw();e.preventDefault();return;
  }
  if(t&&t.dataset&&t.dataset.p!==undefined){
    setAct(+t.dataset.p);drag={p:+t.dataset.p,i:+t.dataset.i};svg.setPointerCapture(e.pointerId);draw();e.preventDefault();return;
  }
  pan={sx:e.clientX,sy:e.clientY,vx:view.x,vy:view.y,moved:false,shift:e.shiftKey,ev:{clientX:e.clientX,clientY:e.clientY}};
  svg.setPointerCapture(e.pointerId);
}
function onMove(e){
  if(drag&&drag.sv!==undefined){var sq=serveRef(drag.sv),sp=toImg(e);if(sq){sq.x=Math.round(sp.x);sq.y=Math.round(sp.y);draw()}return}
  if(drag&&drag.ws!==undefined){
    var wp=toImg(e),wq=(cal.waiterSpots||[])[drag.ws];
    if(wq){if(drag.part==='p'){wq.x=Math.round(wp.x);wq.y=Math.round(wp.y)}else{wq.dir=Math.round(Math.atan2((wp.y-wq.y)/.6,wp.x-wq.x)*180/Math.PI)}draw()}
    return;
  }
  if(drag&&drag.st!==undefined){
    var sp0=toImg(e),sq0=(cal.seats||[]).filter(function(z){return z.id===drag.st})[0];
    if(sq0){
      if(drag.part==='p'){var dx=sp0.x-sq0.x,dy=sp0.y-sq0.y;sq0.x=Math.round(sp0.x);sq0.y=Math.round(sp0.y);sq0.ax+=Math.round(dx);sq0.ay+=Math.round(dy)}   // the place to stand moves along
      else if(drag.part==='a'){sq0.ax=Math.round(sp0.x);sq0.ay=Math.round(sp0.y)}
      else{sq0.dir=Math.round(Math.atan2((sp0.y-sq0.y)/.6,sp0.x-sq0.x)*180/Math.PI)}
      draw();
    }
    return;
  }
  if(drag&&drag.sp!==undefined){
    var q0=toImg(e),sq=curPts()[drag.sp];
    if(sq){sq.x=Math.round(q0.x);sq.y=Math.round(q0.y);draw()}
    return;
  }
  if(drag){
    var p=toImg(e),poly=curPolys()[drag.p];
    if(poly&&poly[drag.i]){poly[drag.i][0]=Math.round(p.x*10)/10;poly[drag.i][1]=Math.round(p.y*10)/10;draw()}
    return;
  }
  if(pan){
    var dx=e.clientX-pan.sx,dy=e.clientY-pan.sy;
    if(!pan.moved&&Math.hypot(dx,dy)>5)pan.moved=true;
    if(pan.moved){
      var r=svg.getBoundingClientRect(),sc=Math.max(view.w/r.width,view.h/r.height);
      setView(pan.vx-dx*sc,pan.vy-dy*sc,view.w,view.h);draw();
    }
  }
}
function onUp(e){
  if(drag){drag=null;save();draw();try{svg.releasePointerCapture(e.pointerId)}catch(_){}return}
  if(pan){
    var wasClick=!pan.moved&&pan.ev,shift=pan.shift;pan=null;try{svg.releasePointerCapture(e.pointerId)}catch(_){}
    if(wasClick){
      var p=toImg(e);
      if(layer==='seats'||layer==='waiterSpots')return;
      if(layer==='serve'){placeServe(Math.round(p.x),Math.round(p.y));return}
      if(pointsMode()){addSponge(Math.round(p.x),Math.round(p.y));return}
      var a=curPolys(),i=actIdx();
      p.x=Math.round(p.x*10)/10;p.y=Math.round(p.y*10)/10;
      // a click on a line puts the new point right there, on that line (in whichever shape the line belongs to)
      var hit=nearestEdgeAll(a,p,9*pxScale(),!!(LAYERS.filter(function(L){return L.id===layer})[0].open));
      if(hit){a[hit.pi].splice(hit.i+1,0,[hit.x,hit.y]);setAct(hit.pi);save();draw();return}
      if(i<0){a.push([]);i=a.length-1;setAct(i)}
      a[i].push([p.x,p.y]);save();draw();
    }
  }
}
function serveRef(key){var a=key.split('|'),D=serveData();return a[0]==='seat'?(D.seat[a[1]]||{})[a[2]]:D.table[a[1]]}
function delServe(key){var a=key.split('|'),D=serveData();if(a[0]==='seat'){if(D.seat[a[1]])delete D.seat[a[1]][a[2]]}else delete D.table[a[1]];save();draw()}
function placeServe(x,y){
  var D=serveData();
  if(serveKind==='sto')D.table[Math.floor(seatSel/4)]={x:x,y:y};
  else{if(!D.seat[seatSel])D.seat[seatSel]={};D.seat[seatSel][serveKind]={x:x,y:y}}
  save();draw();
}
function addSponge(x,y){
  var f=curSurf();if(!f)return;
  var q=T.idw(f.points,x,y);                             // a new point starts as the sponge looks there now
  f.points.push({x:x,y:y,scale:+q.scale.toFixed(2),flat:+q.flat.toFixed(2),angle:Math.round(q.angle),skew:Math.round(q.skew),lift:Math.round(q.lift),shadow:+q.shadow.toFixed(2)});
  spSel=f.points.length-1;save();refreshSponge();draw();
}
function delSponge(i){
  var P=curPts();if(P.length<=1)return;                  // at least one point stays
  P.splice(i,1);spSel=Math.max(0,Math.min(spSel,P.length-1));save();refreshSponge();draw();
}
function delPoint(pi,i){
  var a=curPolys();if(!a[pi])return;
  a[pi].splice(i,1);if(!a[pi].length&&a.length>0)a.splice(pi,1);
  save();draw();
}

// ---------- the buttons ----------
function actSponge(a){
  var P=curPts();
  if(a==='new'){addSponge(Math.round(view.x+view.w/2),Math.round(view.y+view.h/2))}
  else if(a==='prev'){if(P.length){spSel=(spSel-1+P.length)%P.length;refreshSponge();draw()}}
  else if(a==='next'){if(P.length){spSel=(spSel+1)%P.length;refreshSponge();draw()}}
  else if(a==='undo'||a==='delpoly'){delSponge(a==='undo'?P.length-1:spSel)}
  else if(a==='dellayer'){alert('Mora da ostane bar jedna tačka. Obriši tačke pojedinačno.')}
}
function act(a){
  if(layer==='seats'&&a==='reset'){
    if(confirm('Vratiti mesta sedenja na početna?')){cal.seats=JSON.parse(JSON.stringify(T.defaults().seats));save();draw()}
    return;
  }
  if(layer==='waiterSpots'&&a==='reset'){
    if(confirm('Vratiti mesta konobara na početna?')){cal.waiterSpots=JSON.parse(JSON.stringify(T.defaults().waiterSpots));save();draw()}
    return;
  }
  if(a==='autoroute'){
    if(!cal.waiterRoute||!cal.waiterRoute.length||confirm('Zameniti postojeću putanju konobara automatskom?')){cal.waiterRoute=T.waiterAutoRoute();save();showPath=true;refreshUi();draw()}
    return;
  }
  if(a==='togglepath'){showPath=!showPath;draw();return}
  if(layer==='seats'||layer==='waiterSpots'){return}
  if(layer==='surfaces'&&a==='reset'){
    if(confirm('Vratiti sve površine sunđera na početno stanje?')){cal.surfaces=JSON.parse(JSON.stringify(T.defaults().surfaces));surfSel=0;spSel=0;save();refreshUi();draw()}
    return;
  }
  if(pointsMode()&&['new','prev','next','undo','delpoly','dellayer'].indexOf(a)>=0){actSponge(a);return}
  var A=curPolys(),i=actIdx();
  if(a==='new'){if(!A.length||A[A.length-1].length)A.push([]);setAct(A.length-1);draw()}
  else if(a==='prev'){if(A.length){setAct((i-1+A.length)%A.length);draw()}}
  else if(a==='next'){if(A.length){setAct((i+1)%A.length);draw()}}
  else if(a==='undo'){if(A[i]&&A[i].length){A[i].pop();if(!A[i].length&&A.length>1)A.splice(i,1);save();draw()}}
  else if(a==='delpoly'){if(A[i]){A.splice(i,1);save();draw()}}
  else if(a==='dellayer'){
    if(seatLayer(layer)){if(confirm('Obrisati maske SVIH stolica u ovom sloju?')){cal[layer]={};save();draw()}}
    else if(confirm('Obrisati sve oblike u ovom sloju?')){A.length=0;save();draw()}
  }
  else if(a==='reset'){
    if(!confirm('Vratiti ovaj sloj na početno stanje?'))return;
    var d=T.defaults();
    if(layer==='serve'){cal.serve={seat:{},table:{}};save();draw();return}
    if(seatLayer(layer)){if(!cal[layer])cal[layer]={};cal[layer][seatSel]=((d[layer]||{})[seatSel]||[]).slice()}else cal[layer]=d[layer];
    save();draw();
  }
  else if(a==='fit'){fitView();draw()}
  else if(a==='export'){exportJson()}
  else if(a==='copyexport'){var ta2=ui.root.querySelector('#tcExportText');ta2.focus();ta2.select();try{document.execCommand('copy');ui.info.textContent='Tekst je kopiran.'}catch(_){}}
  else if(a==='closeexport'){ui.root.querySelector('#tcExportBox').style.display='none'}
  else if(a==='import'){var b=ui.root.querySelector('#tcImportBox');b.style.display=b.style.display==='none'?'block':'none'}
  else if(a==='doimport'){
    try{
      var o=JSON.parse(ui.root.querySelector('#tcImportText').value);
      cal={version:1,floor:o.floor||[],blocked:o.blocked||[],tableMask:o.tableMask||[],chairMask:o.chairMask||{},chairWalk:o.chairWalk||{},seats:(o.seats&&o.seats.length)?o.seats:T.defaults().seats,cleanExclude:o.cleanExclude||[],serve:o.serve||{seat:{},table:{}},waiterFloor:o.waiterFloor||JSON.parse(JSON.stringify(o.floor||[])),waiterRoute:o.waiterRoute||[],waiterSpots:(o.waiterSpots&&o.waiterSpots.length)?o.waiterSpots:T.defaults().waiterSpots,surfaces:(o.surfaces&&o.surfaces.length)?o.surfaces:T.defaults().surfaces};
      save();draw();ui.root.querySelector('#tcImportBox').style.display='none';
    }catch(err){alert('JSON nije ispravan.')}
  }
  else if(a==='close'){close()}
}
function exportJson(){
  var data=JSON.stringify(Object.assign({format:'cookster-tavern-calibration',exportedAt:new Date().toISOString()},cal),null,1);
  // a copy of the text in a field, in case the browser does not let the file download
  var box=ui.root.querySelector('#tcExportBox'),ta=ui.root.querySelector('#tcExportText');
  ta.value=data;box.style.display='block';ta.focus();ta.select();
  try{
    var blob=new Blob([data],{type:'application/json'}),a=document.createElement('a');
    a.href=URL.createObjectURL(blob);a.download='cookster_kafana_kalibracija.json';document.body.appendChild(a);a.click();
    setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},1000);
  }catch(_){ui.info.textContent='Preuzimanje nije uspelo, kopiraj tekst iz polja.'}
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(data).then(function(){ui.info.textContent='JSON je preuzet i kopiran u clipboard.'},function(){});
}
function open(){
  cal=clone(T.calibration());
  window.__tavernEditor=true;
  ui.root.classList.add('open');
  refreshUi();
  requestAnimationFrame(function(){fitView();draw()});
}
function close(){ui.root.classList.remove('open');window.__tavernEditor=false;T.applyCalibration(clone(cal));T.fit()}

build();
window.CooksterTavernCal={open:open,close:close};
})();
