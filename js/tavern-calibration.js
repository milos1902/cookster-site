/* Cookster - tool "Kalibracija kafane".
   Draw, on the picture of the tavern, with points joined by very thin lines:
     1. Pod       - where guests may walk
     2. Zabrana   - tables and edges that guests may not cross
     3. Maska stola   - the parts of the tables that cover a guest who walks behind the table
     4. Maska stolice - for every chair: the part of the chair that covers the guest who sits on it
     6. Sunđer: gde čisti, šta ne dira, i kako leži na podu (veličina, spljoštenost, rotacija...) na raznim mestima
     5. Maska stolice (hod) - for every chair: the part that covers a guest who walks behind it (removed when somebody sits)
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
  {id:'cleanFloor',label:'Sunđer čisti: pod',color:'#7fe3ff',help:'Obeleži pod koji sunđer sme da čisti (trljanjem). Može više oblika. Ono što sunđer NE sme da dira isključuje se u sledećem sloju.'},
  {id:'cleanExclude',label:'Sunđer NE čisti: izuzeci',color:'#ff7ad9',help:'Obeleži šta sunđer nikad ne dira: stolovi sa stolicama, šank, peć, burad... Isti oblik se koristi za dugme „Očisti sto“: čisti sto i sve unutar oblika koji ga obuhvata (pod ispod stola).'},
  {id:'sponge',label:'Sunđer: kako leži na podu',color:'#ffd84d',help:'Klikni na pod da dodaš tačku, pa klizačima podesi kako sunđer tu stoji (veličina, spljoštenost, rotacija, podignutost, senka). Između tačaka se vrednosti mešaju, pa dalje tačke obično imaju manju veličinu. Prevuci tačku da je pomeriš, desni klik je briše.'}
];
function seatLayer(l){return l==='chairMask'||l==='chairWalk'}
var spSel=0,cal=null,layer='floor',active={},seatSel=0,vis={floor:true,blocked:true,tableMask:true,chairMask:true,chairWalk:true,cleanFloor:true,cleanExclude:true,sponge:true};
var view={x:0,y:0,w:W,h:H},ui={},svg,gMain,drag=null,pan=null;

function clone(o){return JSON.parse(JSON.stringify(o))}
function polys(l,seat){
  if(seatLayer(l)){var k=seat===undefined?seatSel:seat;if(!cal[l])cal[l]={};if(!cal[l][k])cal[l][k]=[];return cal[l][k]}
  if(l==='sponge')return [];
  if(!cal[l])cal[l]=[];
  return cal[l];
}
function curPolys(){return polys(layer)}
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
  '#tavernCal .tc-chairs button.on{background:#e8a53a;color:#201409}'+
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
    '<div id="tcSpongeBox" style="display:none"><div class="tc-help" id="tcSpInfo"></div>'+
      '<label class="tc-sl">Veličina <b id="tcSv_scale"></b><input type="range" id="tcS_scale" min="0.3" max="2.4" step="0.01"></label>'+
      '<label class="tc-sl">Spljoštenost <b id="tcSv_flat"></b><input type="range" id="tcS_flat" min="0.3" max="1.5" step="0.01"></label>'+
      '<label class="tc-sl">Rotacija <b id="tcSv_angle"></b><input type="range" id="tcS_angle" min="-60" max="60" step="1"></label>'+
      '<label class="tc-sl">Podignutost <b id="tcSv_lift"></b><input type="range" id="tcS_lift" min="0" max="50" step="1"></label>'+
      '<label class="tc-sl">Senka <b id="tcSv_shadow"></b><input type="range" id="tcS_shadow" min="0" max="1" step="0.01"></label></div>'+
    '<div class="tc-row"><button class="tc-b" data-a="new">Novi oblik</button><button class="tc-b" data-a="prev">◀</button><button class="tc-b" data-a="next">▶</button>'+
      '<button class="tc-b" data-a="undo">Poništi tačku</button></div>'+
    '<div class="tc-row"><button class="tc-b" data-a="delpoly">Obriši oblik</button><button class="tc-b" data-a="dellayer">Obriši sloj</button><button class="tc-b" data-a="reset">Vrati početno (sloj)</button></div>'+
    '<div class="tc-row"><button class="tc-b" data-a="fit">Ceo prikaz</button><button class="tc-b" data-a="export">Izvezi JSON</button><button class="tc-b" data-a="import">Uvezi JSON</button></div>'+
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
  ['scale','flat','angle','lift','shadow'].forEach(function(k){
    var inp=ui.root.querySelector('#tcS_'+k);
    inp.addEventListener('input',function(){var q=cal.spongeCal&&cal.spongeCal[spSel];if(!q)return;q[k]=+inp.value;ui.root.querySelector('#tcSv_'+k).textContent=(+inp.value).toFixed(k==='angle'||k==='lift'?0:2);save();draw()});
  });
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
    if(!vis[L.id]||L.id==='sponge')return;
    var lists=[];
    if(seatLayer(L.id)){
      if(layer===L.id)lists=[{a:polys(L.id,seatSel),seat:seatSel,on:true}];
      Object.keys(cal[L.id]||{}).forEach(function(k){if(layer===L.id&&+k===seatSel)return;lists.push({a:cal[L.id][k],seat:+k,on:false})});
    }else lists=[{a:cal[L.id]||[],on:layer===L.id}];
    lists.forEach(function(ls){
      ls.a.forEach(function(poly,pi){
        var isAct=ls.on&&layer===L.id&&pi===ai;
        if(poly.length>=2){
          var pts=poly.map(function(q){return q[0]+','+q[1]}).join(' ');
          el(poly.length>=3?'polygon':'polyline',{points:pts,fill:poly.length>=3?L.color:'none','fill-opacity':isAct?.16:.07,stroke:L.color,'stroke-width':1,'vector-effect':'non-scaling-stroke','stroke-opacity':ls.on?1:.55,'pointer-events':'none'},gMain);
        }
        if(ls.on&&layer===L.id)poly.forEach(function(q,i){
          var c=el('circle',{cx:q[0],cy:q[1],r:isAct?R:R*.8,fill:isAct?'#fff':L.color,stroke:L.color,'stroke-width':1,'vector-effect':'non-scaling-stroke',style:'cursor:move'},gMain);
          c.dataset.p=pi;c.dataset.i=i;
        });
      });
    });
  });
  if(layer==='sponge'&&vis.sponge)drawSponge(s,R);
  if(seatLayer(layer)){                           // numbers of the chairs, to click them
    T.seats.forEach(function(st){
      var on=st.id===seatSel,g=el('g',{style:'cursor:pointer'},gMain);
      var c=el('circle',{cx:st.x,cy:st.y,r:(on?9:7)*s*1.6,fill:on?'#ffb347':'rgba(20,10,4,.7)',stroke:'#ffb347','stroke-width':1,'vector-effect':'non-scaling-stroke'},g);
      var t=el('text',{x:st.x,y:st.y+3.4*s*1.6,'text-anchor':'middle','font-size':8.5*s*1.6,fill:on?'#201409':'#ffd9a0','font-family':'system-ui,sans-serif','pointer-events':'none'},g);
      t.textContent=(st.table+1)+'.'+((st.id%4)+1);
      c.dataset.seat=st.id;
    });
  }
  ui.info.textContent=LAYERS.filter(function(L){return L.id===layer})[0].label+(layer==='sponge'?' · tačaka: '+(cal.spongeCal||[]).length:' · oblika: '+curPolys().length)+(seatLayer(layer)?' · sto '+(Math.floor(seatSel/4)+1)+', stolica '+((seatSel%4)+1):'')+' · zumiranje '+(W/view.w).toFixed(1)+'x';
}
// the sponge as it lies at every calibration point: its picture, the footprint (the part it cleans), the shadow
function drawSponge(s,R){
  var S=T.sponge,pts=cal.spongeCal||[];
  if(spSel>=pts.length)spSel=Math.max(0,pts.length-1);
  pts.forEach(function(q,i){
    var on=i===spSel,k=q.scale,g=el('g',{},gMain);
    el('ellipse',{cx:q.x,cy:q.y,rx:S.RADIUS*k*1.15,ry:S.RADIUS*k*S.FLAT*q.flat*1.15,fill:'#000','fill-opacity':q.shadow*.55,'pointer-events':'none'},g);
    var im=el('image',{href:S.SRC,x:-S.AX,y:-S.AY-q.lift,width:S.W,height:S.H,'pointer-events':'none',opacity:on?1:.8},g);
    g.setAttribute('transform','translate('+q.x+' '+q.y+') scale('+k+' '+(k*q.flat)+') rotate('+q.angle+')');
    el('ellipse',{cx:q.x,cy:q.y,rx:S.RADIUS*k,ry:S.RADIUS*k*S.FLAT*q.flat,fill:'none',stroke:on?'#fff':'#ffd84d','stroke-width':1,'stroke-dasharray':'4 3','vector-effect':'non-scaling-stroke','pointer-events':'none'},gMain);
    var c=el('circle',{cx:q.x,cy:q.y,r:on?R*1.15:R*.85,fill:on?'#fff':'#ffd84d',stroke:'#201409','stroke-width':1,'vector-effect':'non-scaling-stroke',style:'cursor:move'},gMain);
    c.dataset.sp=i;
    var t=el('text',{x:q.x+R*1.6,y:q.y-R*1.2,'font-size':R*3.4,fill:'#fff','font-family':'system-ui,sans-serif','pointer-events':'none','paint-order':'stroke',stroke:'#201409','stroke-width':3},gMain);
    t.textContent=(i+1);
  });
}
function refreshSponge(){
  var q=(cal&&cal.spongeCal||[])[spSel];
  ui.root.querySelector('#tcSpInfo').textContent=q?('Tačka '+(spSel+1)+' od '+cal.spongeCal.length+' · klikni na pod za novu, na broj za izbor.'):'Nema tačaka. Klikni na pod da dodaš prvu.';
  ['scale','flat','angle','lift','shadow'].forEach(function(k){
    var inp=ui.root.querySelector('#tcS_'+k);inp.disabled=!q;
    if(q){inp.value=q[k];ui.root.querySelector('#tcSv_'+k).textContent=(+q[k]).toFixed(k==='angle'||k==='lift'?0:2)}
  });
}
function refreshUi(){
  ui.root.querySelectorAll('.tc-layer').forEach(function(b){b.classList.toggle('on',b.dataset.layer===layer)});
  ui.root.querySelector('#tcHelp').textContent=LAYERS.filter(function(L){return L.id===layer})[0].help;
  ui.root.querySelector('#tcChairBox').style.display=seatLayer(layer)?'block':'none';
  ui.root.querySelector('#tcSpongeBox').style.display=layer==='sponge'?'block':'none';
  if(layer==='sponge')refreshSponge();
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
function nearestEdgeAll(polys,p,tol){
  var best=null;
  polys.forEach(function(poly,pi){
    var n=poly.length;if(n<2)return;
    var edges=n===2?1:n;                               // two points are one line, from three on the shape is closed
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
    if(t&&t.dataset&&t.dataset.p!==undefined)delPoint(+t.dataset.p,+t.dataset.i);
    if(t&&t.dataset&&t.dataset.sp!==undefined)delSponge(+t.dataset.sp);
    return;
  }
  if(e.button===1){pan={sx:e.clientX,sy:e.clientY,vx:view.x,vy:view.y,moved:true};svg.setPointerCapture(e.pointerId);e.preventDefault();return}
  if(e.button!==0)return;
  if(t&&t.dataset&&t.dataset.seat!==undefined){seatSel=+t.dataset.seat;refreshUi();draw();return}
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
  if(drag&&drag.sp!==undefined){
    var q0=toImg(e),sq=cal.spongeCal&&cal.spongeCal[drag.sp];
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
      if(layer==='sponge'){addSponge(Math.round(p.x),Math.round(p.y));return}
      var a=curPolys(),i=actIdx();
      p.x=Math.round(p.x*10)/10;p.y=Math.round(p.y*10)/10;
      // a click on a line puts the new point right there, on that line (in whichever shape the line belongs to)
      var hit=nearestEdgeAll(a,p,9*pxScale());
      if(hit){a[hit.pi].splice(hit.i+1,0,[hit.x,hit.y]);setAct(hit.pi);save();draw();return}
      if(i<0){a.push([]);i=a.length-1;setAct(i)}
      a[i].push([p.x,p.y]);save();draw();
    }
  }
}
function addSponge(x,y){
  if(!cal.spongeCal)cal.spongeCal=[];
  var q=T.spongeAt(x,y);                                 // a new point starts as the sponge looks there now
  cal.spongeCal.push({x:x,y:y,scale:+q.scale.toFixed(2),flat:+q.flat.toFixed(2),angle:Math.round(q.angle),lift:Math.round(q.lift),shadow:+q.shadow.toFixed(2)});
  spSel=cal.spongeCal.length-1;save();refreshSponge();draw();
}
function delSponge(i){
  if(!cal.spongeCal||cal.spongeCal.length<=1)return;      // at least one point stays
  cal.spongeCal.splice(i,1);spSel=Math.max(0,Math.min(spSel,cal.spongeCal.length-1));save();refreshSponge();draw();
}
function delPoint(pi,i){
  var a=curPolys();if(!a[pi])return;
  a[pi].splice(i,1);if(!a[pi].length&&a.length>0)a.splice(pi,1);
  save();draw();
}

// ---------- the buttons ----------
function actSponge(a){
  var P=cal.spongeCal||(cal.spongeCal=[]);
  if(a==='new'){addSponge(Math.round(view.x+view.w/2),Math.round(view.y+view.h/2))}
  else if(a==='prev'){if(P.length){spSel=(spSel-1+P.length)%P.length;refreshSponge();draw()}}
  else if(a==='next'){if(P.length){spSel=(spSel+1)%P.length;refreshSponge();draw()}}
  else if(a==='undo'||a==='delpoly'){delSponge(a==='undo'?P.length-1:spSel)}
  else if(a==='dellayer'){alert('Mora da ostane bar jedna tačka. Obriši tačke pojedinačno.')}
  else if(a==='reset'){if(confirm('Vratiti sunđer na početne tačke?')){cal.spongeCal=T.defaults().spongeCal;spSel=0;save();refreshSponge();draw()}}
}
function act(a){
  if(layer==='sponge'&&['new','prev','next','undo','delpoly','dellayer','reset'].indexOf(a)>=0){actSponge(a);return}
  var A=curPolys(),i=actIdx();
  if(a==='new'){if(!A.length||A[A.length-1].length)A.push([]);setAct(A.length-1);draw()}
  else if(a==='prev'){if(A.length){setAct((i-1+A.length)%A.length);draw()}}
  else if(a==='next'){if(A.length){setAct((i+1)%A.length);draw()}}
  else if(a==='undo'){if(A[i]&&A[i].length){A[i].pop();if(!A[i].length&&A.length>1)A.splice(i,1);save();draw()}}
  else if(a==='delpoly'){if(A[i]){A.splice(i,1);save();draw()}}
  else if(a==='dellayer'){if(confirm('Obrisati sve oblike u ovom sloju?')){A.length=0;save();draw()}}
  else if(a==='reset'){
    if(!confirm('Vratiti ovaj sloj na početno stanje?'))return;
    var d=T.defaults();
    if(seatLayer(layer)){if(!cal[layer])cal[layer]={};cal[layer][seatSel]=((d[layer]||{})[seatSel]||[]).slice()}else cal[layer]=d[layer];
    save();draw();
  }
  else if(a==='fit'){fitView();draw()}
  else if(a==='export'){exportJson()}
  else if(a==='import'){var b=ui.root.querySelector('#tcImportBox');b.style.display=b.style.display==='none'?'block':'none'}
  else if(a==='doimport'){
    try{
      var o=JSON.parse(ui.root.querySelector('#tcImportText').value);
      cal={version:1,floor:o.floor||[],blocked:o.blocked||[],tableMask:o.tableMask||[],chairMask:o.chairMask||{},chairWalk:o.chairWalk||{},cleanFloor:o.cleanFloor||o.floor||[],cleanExclude:o.cleanExclude||o.blocked||[],spongeCal:(o.spongeCal&&o.spongeCal.length)?o.spongeCal:T.defaults().spongeCal};
      save();draw();ui.root.querySelector('#tcImportBox').style.display='none';
    }catch(err){alert('JSON nije ispravan.')}
  }
  else if(a==='close'){close()}
}
function exportJson(){
  var data=JSON.stringify(Object.assign({format:'cookster-tavern-calibration',exportedAt:new Date().toISOString()},cal),null,1);
  var blob=new Blob([data],{type:'application/json'}),a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download='cookster_kafana_kalibracija.json';document.body.appendChild(a);a.click();
  setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},1000);
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
