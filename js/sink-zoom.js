/* Cookster - the sink close-up.
   A click on the sink (with nothing in the hand) zooms the kitchen into the sink, then the picture of the sink close-up (assets/sink/sudopera_krupno.webp) fades in.
   Back: the button "Nazad", the Escape key, or a click on the dark edge. The game behind keeps running. */
(function(){
'use strict';
if(window.CooksterSinkZoom)return;
var SRC='assets/sink/sudopera_krupno.webp?v=2',DUR=900;
var css=document.createElement('style');
css.textContent=
'#sinkZoom{position:fixed;inset:0;z-index:20000;display:none;background:rgba(10,6,3,0);transition:background .5s ease;touch-action:none}'+
'#sinkZoom.on{display:block}#sinkZoom.dark{background:rgba(10,6,3,.82)}'+
'#sinkZoom .sz-stage{position:absolute;left:50%;top:50%;width:min(100vw,calc(100vh*16/9));aspect-ratio:16/9;transform-origin:50% 50%;will-change:transform,opacity;overflow:hidden;border-radius:6px;box-shadow:0 12px 50px rgba(0,0,0,.6)}'+
'#sinkZoom .sz-pic{position:absolute;inset:0;width:100%;height:100%;display:block;-webkit-user-drag:none;user-select:none}'+
'#sinkZoom .sz-back{position:absolute;right:16px;top:60px;z-index:2;border:2px solid #351b0d;border-radius:9px;background:#e8c27a;color:#351b0d;font:700 14px/1 system-ui,sans-serif;padding:9px 14px;cursor:pointer;opacity:0;transition:opacity .4s ease}'+
'#sinkZoom.ready .sz-back{opacity:.92}#sinkZoom .sz-back:hover{opacity:1}';
document.head.appendChild(css);
var root=document.createElement('div');root.id='sinkZoom';root.setAttribute('data-tool-ui','1');
root.innerHTML='<div class="sz-stage"><img class="sz-pic" alt="Sudopera" draggable="false"><button type="button" class="sz-back" data-tool-ui="1">⬅ Nazad</button></div>';
document.body.appendChild(root);
var stage=root.querySelector('.sz-stage'),img=root.querySelector('.sz-pic'),back=root.querySelector('.sz-back');
img.src=SRC;
var opened=false,busy=false;
// where the sink is on the screen now (to start the zoom from there)
function sinkRect(){
  try{
    var g=calibratedSinkGeometry(),b=sinkGeometryBounds(g.vertices),a=sceneToScreen(b.left,b.top),c=sceneToScreen(b.right,b.bottom);
    return {x:(a.x+c.x)/2,y:(a.y+c.y)/2,w:Math.max(40,c.x-a.x),h:Math.max(30,c.y-a.y)};
  }catch(e){return {x:innerWidth*.9,y:innerHeight*.15,w:innerWidth*.12,h:innerHeight*.12};}
}
function fromTransform(){
  var r=sinkRect(),sw=stage.offsetWidth||innerWidth,sh=stage.offsetHeight||innerHeight;
  var s=Math.max(.05,Math.min(r.w/sw*1.6,r.h/sh*1.6));
  return 'translate(-50%,-50%) translate('+(r.x-innerWidth/2).toFixed(1)+'px,'+(r.y-innerHeight/2).toFixed(1)+'px) scale('+s.toFixed(3)+')';
}
function open(){
  if(opened||busy)return;busy=true;opened=true;
  root.classList.add('on');
  stage.style.transition='none';stage.style.opacity='0';stage.style.transform=fromTransform();
  void stage.offsetWidth;
  // the zoom: the picture grows out of the place of the sink to the whole screen while the kitchen fades to dark
  stage.style.transition='transform '+DUR+'ms cubic-bezier(.22,.8,.2,1),opacity '+Math.round(DUR*.55)+'ms ease';
  root.classList.add('dark');stage.style.opacity='1';stage.style.transform='translate(-50%,-50%) scale(1)';
  setTimeout(function(){busy=false;root.classList.add('ready');},DUR);
}
function close(){
  if(!opened||busy)return;busy=true;root.classList.remove('ready','dark');
  stage.style.transition='transform '+Math.round(DUR*.75)+'ms cubic-bezier(.5,0,.8,.4),opacity '+Math.round(DUR*.6)+'ms ease '+Math.round(DUR*.2)+'ms';
  stage.style.opacity='0';stage.style.transform=fromTransform();
  setTimeout(function(){root.classList.remove('on');opened=false;busy=false;},DUR);
}
back.addEventListener('click',function(e){e.stopPropagation();close();});
root.addEventListener('pointerdown',function(e){if(e.target===root)close();});
['wheel','contextmenu'].forEach(function(t){root.addEventListener(t,function(e){e.preventDefault();e.stopPropagation();},{passive:false});});
window.addEventListener('keydown',function(e){if(opened&&e.key==='Escape'){e.stopPropagation();close();}},true);

/* ---------- calibration of the sink close-up (tool "Kalibracija scene") ----------
   All points are percents of the picture (x: 0..100 left to right, y: 0..100 top to bottom), so they do not depend on the size of the screen.
     rim   = the opening of the sink at the top (the four corners of the rim of the basin)
     floor = the bottom of the basin (where a vessel stands); the depth of the sink is the distance between the rim and the floor
     mask  = the part of the picture where vessels are seen (the front rim of the sink hides what is below it)
   Vessels: pick one, put it into the sink, drag it and set its size; the size is saved for every vessel. */
var CAL_KEY='cookster.sink-zoom-cal.v1';
// Miloš's own calibration of 2026-10-13 (rim, floor, mask and the size and height of every vessel) is built in; what is changed in the tool in the browser wins over it
var CAL_DEF={rim:[[29.3, 27.1], [68.8, 27.1], [72.2, 70.7], [26.08, 70.72]],floor:[[32.8, 41.66], [65.38, 41.98], [67.56, 70.4], [30.56, 72.55]],mask:[[21.0, 17.55], [76.7, 17.33], [84.15, 79.55], [12.7, 80.52]],vessels:{"serpa_velika": {"x": 49.08, "y": 63.01, "w": 18.6, "h": -5.8}, "tiganj_veliki": {"x": 49.08, "y": 63.01, "w": 16.4, "h": -7.6}, "tiganj_mali": {"x": 49.08, "y": 63.01, "w": 14, "h": -7.8}, "vangla_srednja": {"x": 49.08, "y": 63.01, "w": 12.6, "h": -2}, "vangla_mala": {"x": 49.08, "y": 63.01, "w": 10.2, "h": -1}, "lavor_emajl_veliki": {"x": 49.08, "y": 63.01, "w": 23.8, "h": -7.4}, "vangla_velika": {"x": 49.08, "y": 63.01, "w": 15.6, "h": -2.4}, "kal_01_okrugli_pleh": {"x": 49.08, "y": 63.01, "w": 19, "h": -5}, "kal_01_pravougaoni_pleh": {"x": 49.08, "y": 63.01, "w": 18.6, "h": -3.6}, "kal_02_cinija_mala": {"x": 49.08, "y": 63.01, "w": 10.6, "h": 0}, "kal_02_cinija_velika": {"x": 49.08, "y": 63.01, "w": 14.6, "h": -2.6}, "posuda_za_kupus": {"x": 49.08, "y": 63.01, "w": 11.2, "h": 0}, "kal_02_duboki_tanjir": {"x": 49.08, "y": 63.01, "w": 13.2, "h": 0}, "kal_02_tanjir_ravni": {"x": 49.08, "y": 63.01, "w": 13, "h": 0}},
  // the faucet: where the water comes out (spout), where it lands, the two valves (cross handles) and their size
  tap:{spout:[49.52,30.79],land:[49.52,59.42],left:[42.2,15.4],right:[56.2,15.4],r:4.2,squash:.9,bell:25.9,v:3}};
var cal=null;
function loadCal(){
  try{var d=JSON.parse(localStorage.getItem(CAL_KEY)||'null');if(d&&d.rim&&d.floor&&d.mask){d.vessels=d.vessels||{};var oldV=d.tap&&d.tap.v||0;d.tap=Object.assign({},CAL_DEF.tap,d.tap||{});if(oldV<3){d.tap=JSON.parse(JSON.stringify(CAL_DEF.tap));}/* the first positions of the valves were a guess: new pictures need the new centres */return d;}}catch(e){}
  return JSON.parse(JSON.stringify(CAL_DEF));
}
cal=loadCal();
function saveCal(){try{localStorage.setItem(CAL_KEY,JSON.stringify(cal));}catch(e){}}
var NS='http://www.w3.org/2000/svg';
function se(tag,a){var e=document.createElementNS(NS,tag);for(var k in a)e.setAttribute(k,a[k]);return e;}
var ed=document.createElement('div');ed.className='sz-edit';ed.setAttribute('data-tool-ui','1');ed.style.display='none';
ed.innerHTML='<b>Kalibracija sudopere (krupan plan)</b>'+
 '<div class="sz-row"><button data-m="rim" class="on">Otvor (gore)</button><button data-m="floor">Dno</button><button data-m="mask">Gde se posude vide</button><button data-m="tap">Slavina</button></div>'+
 '<div id="szTapBox" style="display:none"><small class="sz-help">Slavina: <b style="display:inline;color:#7fe3ff">plavo</b> = vrh slavine (odakle teče voda), <b style="display:inline;color:#ffe27a">žuto</b> = gde voda pada, <b style="display:inline;color:#7aff9a">zeleno</b> = levi i desni ventil (centar glave). Prevuci tačke.</small><label>Veličina ventila <input id="szTapR" type="range" min="1" max="7" step="0.1" value="2.6"><b id="szTapRN">2.6</b></label><label>Nagib (spljoštenost) ventila <input id="szTapSq" type="range" min="0.25" max="1" step="0.01" value="0.55"><b id="szTapSqN">0.55</b></label><label>Visina postolja (dno, % slike) <input id="szTapBell" type="range" min="18" max="34" step="0.1" value="24.8"><b id="szTapBellN">24.8</b></label><label>Pljusak: veličina <input id="szSpS" type="range" min="3" max="30" step="0.1" value="11.5"><b id="szSpSN">11.5</b></label><label>Pljusak: nagib napred-nazad <input id="szSpT" type="range" min="0.2" max="1.6" step="0.01" value="1"><b id="szSpTN">1.00</b></label><small class="sz-help"><b style="display:inline;color:#ff8ad8">Roze</b> tačka = gde je pljusak (prevuci gde hoćeš).</small><label>Probni ugao glave <input id="szTapAng" type="range" min="0" max="360" step="1" value="0"><b id="szTapAngN">0</b></label><div class="sz-row"><button id="szTapTest">Probaj: odvrni / zavrni</button></div></div>'+
 '<small class="sz-help">Prevuci belu tačku da je pomeriš. Klik na liniju ubacuje novu tačku tačno tu. Dvoklik na tačku je briše (najmanje 3).</small>'+
 '<div class="sz-info" id="szDepth"></div><hr>'+
 '<label>Posuda <select id="szVessel"></select></label>'+
 '<div class="sz-row"><button id="szPut">Postavi u sudoperu</button><button id="szRemove">Skloni</button></div>'+
 '<label>Veličina posude <input id="szScale" type="range" min="4" max="60" step="0.2" value="20"><b id="szScaleN">20</b></label>'+
 '<label>Visina posude (gore / dole u dubinu) <input id="szLift" type="range" min="-30" max="30" step="0.2" value="0"><b id="szLiftN">0</b></label>'+
 '<div class="sz-row"><button id="szSaveV">Sačuvaj ovu posudu</button><button id="szCopy">Kopiraj sve (JSON)</button><button id="szReset">Vrati početno</button></div>'+
 '<div class="sz-info" id="szStatus"></div>';
var ecss=document.createElement('style');
ecss.textContent='#sinkZoom .sz-edit{position:absolute;left:12px;top:56px;z-index:5;width:300px;max-height:calc(100vh - 80px);overflow:auto;background:rgba(36,22,10,.92);border:2px solid #7a5428;border-radius:10px;color:#f3e3c2;font:13px/1.35 system-ui,sans-serif;padding:10px}'+
 '#sinkZoom .sz-edit b{display:block;margin-bottom:6px}#sinkZoom .sz-edit label{display:block;margin:6px 0}#sinkZoom .sz-edit select,#sinkZoom .sz-edit input[type=range]{width:100%;margin-top:3px}'+
 '#sinkZoom .sz-edit label b{display:inline;margin-left:6px}'+
 '#sinkZoom .sz-edit button{border:1px solid #351b0d;border-radius:7px;background:#e8c27a;color:#351b0d;font:700 12px/1 system-ui,sans-serif;padding:7px 9px;cursor:pointer;margin:2px 4px 2px 0}'+
 '#sinkZoom .sz-edit button.on{background:#fff0b8;box-shadow:0 0 0 2px #ffd86a}'+
 '#sinkZoom .sz-edit .sz-help,#sinkZoom .sz-edit .sz-info{display:block;color:#d9c69c;margin:5px 0}#sinkZoom .sz-edit hr{border:0;border-top:1px solid #7a5428;margin:8px 0}'+
 '#sinkZoom .sz-svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:3}#sinkZoom.editing .sz-svg{pointer-events:auto;cursor:crosshair}'+
 '#sinkZoom .sz-ves{position:absolute;height:auto;z-index:2;pointer-events:none;transform:translate(-50%,-100%)}#sinkZoom.editing .sz-ves{pointer-events:auto;cursor:move}';
document.head.appendChild(ecss);
root.appendChild(ed);
var svg=se('svg',{viewBox:'0 0 100 100',preserveAspectRatio:'none','class':'sz-svg'});stage.appendChild(svg);
var ves=null,mode='rim',vesId='',COL={rim:'#42d6e8',floor:'#ffad42',mask:'#ef5350'};
function equipment(){
  var l=[];try{(window.CooksterCatalog&&CooksterCatalog.KITCHEN_EQUIPMENT||[]).forEach(function(d){if(d&&d.id&&d.src&&(d.vessel===true||d.type==='container'||d.type==='cookware'))l.push({id:d.id,label:d.label||d.id,src:d.src,w:d.w||150});});}catch(e){}
  return l;
}
var selEl=ed.querySelector('#szVessel');
function fillSelect(){
  selEl.innerHTML='';
  equipment().forEach(function(v){var o=document.createElement('option');o.value=v.id;var sv=cal.vessels[v.id];o.textContent=(sv?'✔ ':'')+v.label;o.style.fontWeight=sv?'800':'400';selEl.appendChild(o);});
  if(vesId)selEl.value=vesId;else vesId=selEl.value;
}
function info(){
  var d=ed.querySelector('#szDepth');
  var ry=cal.rim.reduce(function(s,p){return s+p[1]},0)/cal.rim.length,fy=cal.floor.reduce(function(s,p){return s+p[1]},0)/cal.floor.length;
  d.textContent='Dubina sudopere: '+Math.abs(fy-ry).toFixed(1)+'% visine slike (sredina dna je '+(fy>ry?'ispod':'iznad')+' sredine otvora).';
}
function draw(){
  while(svg.firstChild)svg.removeChild(svg.firstChild);
  ['mask','floor','rim'].forEach(function(k){
    var P=cal[k],c=COL[k],on=k===mode;
    svg.appendChild(se('polygon',{points:P.map(function(p){return p[0]+','+p[1]}).join(' '),fill:c,'fill-opacity':on?.16:.06,stroke:c,'stroke-width':on?.35:.18,'vector-effect':'non-scaling-stroke','pointer-events':'none'}));
    if(!on)return;
    P.forEach(function(p,i){
      var a=P[(i+1)%P.length],l=se('line',{x1:p[0],y1:p[1],x2:a[0],y2:a[1],stroke:'transparent','stroke-width':'14','vector-effect':'non-scaling-stroke'});l.dataset.k=k;l.dataset.edge=i;svg.appendChild(l);
    });
    P.forEach(function(p,i){
      var cc=se('circle',{cx:p[0],cy:p[1],r:.7,fill:'#fff',stroke:c,'stroke-width':'.25','vector-effect':'non-scaling-stroke'});cc.setAttribute('transform','');cc.dataset.k=k;cc.dataset.i=i;svg.appendChild(cc);
    });
  });
  if(mode==='tap'){
    var T=cal.tap,pts=[['spout','#42d6e8'],['land','#ffe27a'],['splash','#ff8ad8'],['left','#7aff9a'],['right','#7aff9a']];
    pts.forEach(function(q){var pp=q[0]==='splash'?splashCfg().pos:T[q[0]];
      var cc=se('circle',{cx:pp[0],cy:pp[1],r:q[0]==='left'||q[0]==='right'?T.r:.8,fill:q[0]==='left'||q[0]==='right'?'rgba(122,255,154,.18)':'#fff',stroke:q[1],'stroke-width':'.3','vector-effect':'non-scaling-stroke'});
      cc.dataset.t=q[0];svg.appendChild(cc);});
    svg.appendChild(se('line',{x1:T.spout[0],y1:T.spout[1],x2:T.land[0],y2:T.land[1],stroke:'#42d6e8','stroke-width':'.3','stroke-dasharray':'1 1','vector-effect':'non-scaling-stroke','pointer-events':'none'}));
  }
  info();
}
function pct(e){var r=stage.getBoundingClientRect();return [Math.max(0,Math.min(100,(e.clientX-r.left)/r.width*100)),Math.max(0,Math.min(100,(e.clientY-r.top)/r.height*100))];}
var drag=null;
svg.addEventListener('pointerdown',function(e){
  if(!root.classList.contains('editing')||e.button!==0)return;
  var t=e.target;e.stopPropagation();
  if(t.tagName==='circle'&&t.dataset.t){drag={t:t.dataset.t};svg.setPointerCapture(e.pointerId);e.preventDefault();return;}
  if(t.tagName==='circle'){drag={k:t.dataset.k,i:+t.dataset.i};svg.setPointerCapture(e.pointerId);e.preventDefault();return;}
  if(t.tagName==='line'&&t.dataset.edge!==undefined){var k=t.dataset.k,i=+t.dataset.edge;cal[k].splice(i+1,0,pct(e));saveCal();draw();drag={k:k,i:i+1};svg.setPointerCapture(e.pointerId);e.preventDefault();}
});
svg.addEventListener('pointermove',function(e){if(!drag)return;if(drag.t){if(drag.t==='splash')setSp('pos',pct(e));else cal.tap[drag.t]=pct(e);saveCal();draw();kickFx();return;}cal[drag.k][drag.i]=pct(e);saveCal();draw();});
svg.addEventListener('pointerup',function(){drag=null;});
svg.addEventListener('dblclick',function(e){var t=e.target;if(t.tagName==='circle'&&cal[t.dataset.k].length>3){cal[t.dataset.k].splice(+t.dataset.i,1);saveCal();draw();}});
ed.querySelectorAll('[data-m]').forEach(function(b){b.addEventListener('click',function(){mode=b.dataset.m;if(mode==='tap'){var sc=splashCfg();ed.querySelector('#szSpS').value=sc.size;ed.querySelector('#szSpSN').textContent=sc.size.toFixed(1);ed.querySelector('#szSpT').value=sc.tilt;ed.querySelector('#szSpTN').textContent=sc.tilt.toFixed(2);}ed.querySelector('#szTapBox').style.display=mode==='tap'?'block':'none';ed.querySelectorAll('[data-m]').forEach(function(x){x.classList.toggle('on',x===b)});draw();});});
// the vessel in the sink
function ensureVes(){
  var v=equipment().find(function(x){return x.id===vesId});if(!v)return null;
  if(!ves){ves=document.createElement('img');ves.className='sz-ves';ves.draggable=false;stage.appendChild(ves);
    ves.addEventListener('pointerdown',function(e){if(!root.classList.contains('editing'))return;e.stopPropagation();e.preventDefault();ves.setPointerCapture(e.pointerId);ves._drag=true;});
    ves.addEventListener('pointermove',function(e){if(!ves._drag)return;var p=pct(e);ves._x=p[0];ves._y=p[1]+(+ed.querySelector('#szLift').value);placeVes();});
    ves.addEventListener('pointerup',function(){ves._drag=false;});}
  if(ves.getAttribute('src')!==v.src)ves.src=v.src;
  return v;
}
function placeVes(){
  if(!ves)return;
  var w=+ed.querySelector('#szScale').value,lift=+ed.querySelector('#szLift').value,yy=ves._y-lift;   // the height: a vessel lifted up goes up on the picture, a negative value sinks it down into the sink
  ves.style.left=ves._x+'%';ves.style.top=yy+'%';ves.style.width=w+'%';
  // only what is inside the mask is seen
  var m=cal.mask;ves.style.clipPath='none';
  var pts=m.map(function(p){return (p[0]-ves._x)/w*100+50+'% '+((p[1]-yy)/(w*(ves.naturalHeight/Math.max(1,ves.naturalWidth))*16/9)*100+100)+'%'}).join(',');
  ves.style.clipPath='polygon('+pts+')';
  ed.querySelector('#szScaleN').textContent=w.toFixed(1)+'%';ed.querySelector('#szLiftN').textContent=(lift>0?'+':'')+lift.toFixed(1);
}
function showVes(){
  var v=ensureVes();if(!v)return;
  var sv=cal.vessels[vesId],f=cal.floor,cx=f.reduce(function(s,p){return s+p[0]},0)/f.length,cy=f.reduce(function(s,p){return s+p[1]},0)/f.length;
  ves._x=sv?sv.x:cx;ves._y=sv?sv.y:cy+(f.reduce(function(s,p){return Math.max(s,p[1])},0)-cy)*.4;
  ed.querySelector('#szLift').value=sv&&sv.h?sv.h:0;ed.querySelector('#szScale').value=sv?sv.w:Math.max(8,Math.min(50,v.w/1672*100*1.2));
  ves.style.display='block';ves.onload=placeVes;placeVes();
}
selEl.addEventListener('change',function(){vesId=selEl.value;if(ves&&ves.style.display!=='none')showVes();});
ed.querySelector('#szPut').addEventListener('click',function(){vesId=selEl.value;showVes();});
ed.querySelector('#szRemove').addEventListener('click',function(){if(ves)ves.style.display='none';});
ed.querySelector('#szScale').addEventListener('input',placeVes);ed.querySelector('#szLift').addEventListener('input',placeVes);
function status(t){ed.querySelector('#szStatus').textContent=t;}
ed.querySelector('#szSaveV').addEventListener('click',function(){
  if(!ves||ves.style.display==='none'){status('Prvo postavi posudu u sudoperu.');return;}
  cal.vessels[vesId]={x:+ves._x.toFixed(2),y:+ves._y.toFixed(2),w:+(+ed.querySelector('#szScale').value).toFixed(2),h:+(+ed.querySelector('#szLift').value).toFixed(2)};saveCal();fillSelect();status('Sačuvano za ovu posudu (u listi je podebljana sa ✔).');
});
ed.querySelector('#szCopy').addEventListener('click',function(){
  var txt=JSON.stringify(cal,null,2);
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt).then(function(){status('JSON je kopiran: nalepi ga ovde u chat.');},function(){status('Ne mogu da kopiram; otvori konzolu: window.CooksterSinkZoom.cal()');});
  else status('Kopiranje nije dostupno u ovom pregledaču.');
});
ed.querySelector('#szReset').addEventListener('click',function(){cal=JSON.parse(JSON.stringify(CAL_DEF));saveCal();fillSelect();draw();status('Vraćeno na početne oblike.');});
function calActive(){return document.body.classList.contains('scene-zone-calibration-active')||(function(){var p=document.getElementById('sceneZoneCalibration');return !!p&&p.offsetParent!==null;})();}
function syncEditing(){var on=opened&&root.classList.contains('ready')&&calActive();root.classList.toggle('editing',on);ed.style.display=on?'block':'none';if(on){if(!selEl.options.length)fillSelect();draw();}else if(ves&&!opened)ves.style.display='none';}

/* ---------- the faucet in the close-up: two valves that unscrew, and the water ----------
   Click on a valve (cross handle): it turns (unscrews) and water starts to run from the spout; click again: it screws back and the water stops.
   The left and the right valve each give half of the flow; both open = a strong stream. The water of the kitchen (sound, state of the tap) follows. */
var fx=document.createElement('canvas');fx.className='sz-fx';fx.style.cssText='position:absolute;inset:0;width:100%;height:100%;z-index:3;pointer-events:none';
stage.insertBefore(fx,svg);
var valve={left:{open:0,target:0,ang:0},right:{open:0,target:0,ang:0}};
var fxRun=false,tLast=0,flow=0,streamLen=0,ripT=0,drops=[];
var hit=se('g',{});svg.appendChild(hit);
function layoutHits(){
  while(hit.firstChild)hit.removeChild(hit.firstChild);
  ['left','right'].forEach(function(k){
    var c=se('circle',{cx:cal.tap[k][0],cy:cal.tap[k][1],r:cal.tap.r*1.15,fill:'transparent','pointer-events':opened&&!root.classList.contains('editing')?'all':'none',cursor:'pointer'});
    c.style.cursor='pointer';c.addEventListener('pointerdown',function(e){e.stopPropagation();toggleValve(k);});hit.appendChild(c);
  });
}
function toggleValve(k){valve[k].target=valve[k].target?0:1;syncGame();kickFx();}
function totalFlow(){return Math.min(1,(valve.left.open+valve.right.open)*.6);}
function syncGame(){
  try{var on=valve.left.target||valve.right.target;if(typeof faucetOn!=='undefined'&&!!faucetOn!==!!on&&typeof setFaucet==='function')setFaucet(!!on);}catch(e){}
}
function kickFx(){if(!fxRun){fxRun=true;tLast=performance.now();requestAnimationFrame(frame);}}
function px(n){return n/100;}
function frame(now){
  var dt=Math.min(.05,(now-tLast)/1000);tLast=now;
  var w=stage.clientWidth,h=stage.clientHeight;
  if(fx.width!==w*2||fx.height!==h*2){fx.width=w*2;fx.height=h*2;}
  var g=fx.getContext('2d');g.setTransform(2,0,0,2,0,0);g.clearRect(0,0,w,h);
  var moving=false;
  ['left','right'].forEach(function(k,idx){
    var v=valve[k],d=v.target-v.open;
    if(Math.abs(d)>.002){v.open+=Math.sign(d)*Math.min(Math.abs(d),dt*2.2);moving=true;}else v.open=v.target;
    v.ang=v.open*Math.PI*1.5*(idx?-1:1);
    drawHead(g,k,v,w,h);
  });
  flow+=(totalFlow()-flow)*Math.min(1,dt*7);
  var on=flow>.02;
  streamLen+=((on?1:0)-streamLen)*Math.min(1,dt*(on?9:14));
  if(streamLen>.01&&flow>.01)drawWater(g,w,h,now);
  else if(streamLen>.01){streamLen*=.8;}
  g.setTransform(1,0,0,1,0,0);
  if(moving||streamLen>.02||flow>.02||drops.length)requestAnimationFrame(frame);else fxRun=false;
}
// the head of a valve: a piece of the picture (a disc around its centre) turned like the cross of a real valve, seen from above at an angle
var SPR={},NO_COVER=true;
['glava_levo','glava_desno','postolje_levo','postolje_desno'].forEach(function(n){var i=new Image();i.onload=function(){kickFx();};i.src='assets/sink/ventil_'+n+'.webp?v=1';SPR[n]=i;});
var patchCache={};
// a piece of the picture with soft edges (all in pixels of the picture): used to wipe the old valve out of the picture (the wall and the rim of the sink beside it are copied over it)
function softPatch(sx,sy,sw,sh,feather){
  var key=[sx|0,sy|0,sw|0,sh|0,feather|0].join(',');if(patchCache[key]&&patchCache[key].src===img.src)return patchCache[key].c;
  var c=document.createElement('canvas');c.width=Math.max(4,sw|0);c.height=Math.max(4,sh|0);var g=c.getContext('2d');
  g.drawImage(img,sx,sy,sw,sh,0,0,c.width,c.height);
  var m=document.createElement('canvas');m.width=c.width;m.height=c.height;var mg=m.getContext('2d');
  mg.shadowColor='#000';mg.shadowBlur=feather;mg.shadowOffsetX=10000;mg.fillStyle='#000';mg.fillRect(feather-10000,feather-10000+0,c.width-feather*2,c.height-feather*2);
  g.globalCompositeOperation='destination-in';g.drawImage(m,0,0);
  patchCache[key]={src:img.src,c:c};return c;
}
function drawHead(g,k,v,w,h){
  var T=cal.tap,c=T[k],cx=c[0]/100*w,cy=c[1]/100*h,R=T.r/100*w,q=T.squash,side=k==='left'?-1:1;
  var iw=img.naturalWidth||1,ih=img.naturalHeight||1,sc=iw/w,bellB=T.bell/100*h;
  var hs=SPR['glava_'+(k==='left'?'levo':'desno')],bs=SPR['postolje_'+(k==='left'?'levo':'desno')];
  if(!hs||!hs.complete||!hs.naturalWidth||!bs||!bs.complete||!bs.naturalWidth)return;
  var hh=2*R*hs.naturalHeight/hs.naturalWidth,bh=bellB-(cy+R*.3),bw=bh*bs.naturalWidth/bs.naturalHeight;
  // 1. wipe the old valve out of the picture: the strip of the wall and the sink beside it is laid over it
  var cw=Math.max(R*1.25,bw*.62)*2,top=cy-hh*.75,bot=bellB+h*.012,ch=bot-top;
  var src=softPatch((cx+side*cw*1.25-cw/2)*sc,top*sc,cw*sc,ch*sc,Math.round(cw*sc*.12));
  if(!NO_COVER)g.drawImage(src,cx-cw/2,top,cw,ch);   // (the new picture of the sink has no valves: nothing to wipe)
  // 2. the base (the bell) and, on it, the head; the head turns and rises a little while it is unscrewed
  g.drawImage(bs,cx-bw/2,bellB-bh,bw,bh);
  var spinning=Math.abs(v.target-v.open)>.01,n=spinning?4:1,lift=Math.sin(Math.min(1,v.open)*Math.PI*.5)*h*.014,dir=Math.sign(v.target-v.open||1)*(side<0?1:-1);
  for(var i=0;i<n;i++){
    g.save();g.globalAlpha=spinning?(i===n-1?1:.3):1;g.translate(cx,cy-lift);
    g.scale(1,q);g.rotate(v.ang+prevAng(k)-(n-1-i)*.16*dir);g.scale(1,1/q);
    g.drawImage(hs,-R,-hh/2,R*2,hh);g.restore();
  }
}
function splashCfg(){var T=cal.tap;return {pos:T.sp&&T.sp.pos||T.land,size:T.sp&&T.sp.size||11.5,tilt:T.sp&&T.sp.tilt||1};}
function setSp(k,v){var T=cal.tap;T.sp=Object.assign({},T.sp||{},splashCfg(),{});T.sp.pos=T.sp.pos.slice();T.sp[k]=v;}
function prevAng(k){return (previewAng||0)*Math.PI/180*(k==='left'?1:-1);}
var previewAng=0;
function drawWater(g,w,h,now){
  var T=cal.tap,sx=T.spout[0]/100*w,sy=T.spout[1]/100*h,lx=T.land[0]/100*w,ly=T.land[1]/100*h;
  var len=ly-sy,ey=sy+len*streamLen,t=now/1000,wid=(w*.0035)*(.5+flow*1.3);
  // the stream: a smooth bright ribbon with moving highlights
  g.save();
  var gr=g.createLinearGradient(0,sy,0,ey);gr.addColorStop(0,'rgba(215,240,255,.92)');gr.addColorStop(1,'rgba(160,215,245,.8)');
  g.fillStyle=gr;g.beginPath();
  var N=14;
  for(var i=0;i<=N;i++){var f=i/N,y=sy+(ey-sy)*f,ww=wid*(1-.3*f)*(1+.1*Math.sin(t*22+f*9));g.lineTo(sx-ww+Math.sin(t*7+f*5)*wid*.12,y);}
  for(var j=N;j>=0;j--){var f2=j/N,y2=sy+(ey-sy)*f2,w2=wid*(1-.3*f2)*(1+.1*Math.sin(t*22+f2*9));g.lineTo(sx+w2+Math.sin(t*7+f2*5)*wid*.12,y2);}
  g.closePath();g.fill();
  g.globalAlpha=.7;g.strokeStyle='#fff';g.lineWidth=Math.max(1,wid*.28);
  for(var k=0;k<3;k++){var off=((t*(2.4+k*.6)+k*.33)%1);g.beginPath();g.moveTo(sx-wid*.25+k*wid*.2,sy+(ey-sy)*off*.9);g.lineTo(sx-wid*.25+k*wid*.2,sy+(ey-sy)*Math.min(1,off*.9+.12));g.stroke();}
  g.restore();
  // where it lands: the splash (a row of 8 pictures: the pictures 3 to 8 are repeated)
  if(streamLen>.9&&SPLASH.complete&&SPLASH.naturalWidth){
    var fw=SPLASH.naturalWidth/8,fh=SPLASH.naturalHeight,fi=2+Math.floor(t*13)%6,sc=splashCfg(),sw=w*sc.size/100*(.7+flow*.5),shh=sw*fh/fw;
    g.save();g.globalAlpha=Math.min(1,flow*1.6);g.translate(sc.pos[0]/100*w,sc.pos[1]/100*h);g.scale(1,sc.tilt);g.drawImage(SPLASH,fi*fw,0,fw,fh,-sw/2,-shh*.63,sw,shh);g.restore();
  }
  for(var d=drops.length-1;d>=0;d--){var p=drops[d];p.life+=1/60;p.vy+=w*.5/60;p.x+=p.vx/60;p.y+=p.vy/60;
    if(p.life>.5){drops.splice(d,1);continue;}
    g.fillStyle='rgba(230,246,255,'+(.8*(1-p.life*2))+')';g.beginPath();g.arc(p.x,p.y,Math.max(1,w*.0016),0,Math.PI*2);g.fill();}
}
// when the close-up opens: if the water of the kitchen is already running, the left valve is open
var openBase=open;open=function(){openBase();layoutHits();setTimeout(kickFx,50);try{if(typeof faucetOn!=='undefined'&&faucetOn){valve.left.open=valve.left.target=1;kickFx();}}catch(e){}};
var closeBase=close;close=function(){closeBase();};
ed.querySelector('#szTapR').addEventListener('input',function(e){cal.tap.r=+e.target.value;ed.querySelector('#szTapRN').textContent=cal.tap.r.toFixed(1);saveCal();draw();layoutHits();kickFx();});
ed.querySelector('#szTapSq').addEventListener('input',function(e){cal.tap.squash=+e.target.value;ed.querySelector('#szTapSqN').textContent=cal.tap.squash.toFixed(2);saveCal();kickFx();});
ed.querySelector('#szTapBell').addEventListener('input',function(e){cal.tap.bell=+e.target.value;ed.querySelector('#szTapBellN').textContent=cal.tap.bell.toFixed(1);saveCal();kickFx();});
ed.querySelector('#szSpS').addEventListener('input',function(e){setSp('size',+e.target.value);ed.querySelector('#szSpSN').textContent=(+e.target.value).toFixed(1);saveCal();kickFx();});
ed.querySelector('#szSpT').addEventListener('input',function(e){setSp('tilt',+e.target.value);ed.querySelector('#szSpTN').textContent=(+e.target.value).toFixed(2);saveCal();kickFx();});
ed.querySelector('#szTapAng').addEventListener('input',function(e){previewAng=+e.target.value;ed.querySelector('#szTapAngN').textContent=previewAng;kickFx();});
ed.querySelector('#szTapTest').addEventListener('click',function(){var on=!(valve.left.target||valve.right.target);valve.left.target=on?1:0;valve.right.target=on?1:0;syncGame();kickFx();});

setInterval(function(){syncEditing();layoutHits();},500);
// a button that opens the sink close-up while the scene calibration is on (the calibration layer covers the sink, so a click on it cannot open it)
var calBtn=document.createElement('button');calBtn.type='button';calBtn.textContent='🚰 Sudopera krupno (kalibracija)';calBtn.setAttribute('data-tool-ui','1');
calBtn.style.cssText='position:fixed;right:14px;bottom:70px;z-index:19990;display:none;border:2px solid #351b0d;border-radius:9px;background:#e8c27a;color:#351b0d;font:700 13px/1 system-ui,sans-serif;padding:9px 12px;cursor:pointer';
document.body.appendChild(calBtn);
calBtn.addEventListener('click',function(e){e.stopPropagation();open();});
setInterval(function(){calBtn.style.display=(calActive()&&!opened)?'block':'none';},600);


/* ---------- things lying in the sink ----------
   1. A vessel from the hand: a click on the sink with a vessel in the hand puts it into the sink and opens the close-up, where it stands where you calibrated it.
      A click on it in the close-up takes it back into the hand. (They are kept in this browser: cookster.sink-items.v1)
   2. The dirty bowls from the tavern ("Pranje"): they lie in the sink too (and the running tap washes them one by one, like in the kitchen). */
var ITEMS_KEY='cookster.sink-items.v1',sunk=[];
try{sunk=JSON.parse(localStorage.getItem(ITEMS_KEY)||'[]')||[];}catch(e){sunk=[];}
function saveSunk(){try{localStorage.setItem(ITEMS_KEY,JSON.stringify(sunk.slice(0,8)));}catch(e){}}
var layer=document.createElement('div');layer.className='sz-sink';layer.style.cssText='position:absolute;inset:0;z-index:2;pointer-events:none';stage.insertBefore(layer,fx);
var ICSS=document.createElement('style');ICSS.textContent='#sinkZoom .sz-it{position:absolute;transform:translate(-50%,-100%);height:auto;-webkit-user-drag:none;user-select:none}#sinkZoom:not(.editing) .sz-it.take{pointer-events:auto;cursor:grab}#sinkZoom:not(.editing) .sz-it.take:hover{filter:brightness(1.12)}';
document.head.appendChild(ICSS);
function clipFor(el,x,yy,w){
  var ratio=el.naturalHeight/Math.max(1,el.naturalWidth)*16/9,hh=w*ratio;
  return 'polygon('+cal.mask.map(function(p){return ((p[0]-x)/w*100+50).toFixed(2)+'% '+(((p[1]-yy)/hh)*100+100).toFixed(2)+'%'}).join(',')+')';
}
function slotX(i,n,w){var f=cal.floor,l=Math.min.apply(null,f.map(function(p){return p[0]})),r=Math.max.apply(null,f.map(function(p){return p[0]}));
  var cx=(l+r)/2,step=Math.min(w*.95,(r-l-w)/Math.max(1,n-1));return cx+(i-(n-1)/2)*step;}
function itemGeom(id,def){
  var v=cal.vessels[id],f=cal.floor,cy=f.reduce(function(s,p){return s+p[1]},0)/f.length;
  return {w:v?v.w:def,y:v?v.y:cy+6,h:v?(v.h||0):0};
}
var dishCount=-1,sig='';
function srcOf(saved){
  var D=window.CooksterVesselDirt;
  if(saved.data&&saved.data.dirt==='1'&&D&&D.has&&D.has(saved.id))return D.has(saved.id).replace(/\?v=\d+$/,'');
  return saved.src;
}
function waterOf(sv){return window.CooksterVesselWater?CooksterVesselWater.clamp(sv.data&&sv.data.water):0;}
function renderSink(force){
  var dishes=0;try{dishes=window.CooksterSinkDishes?CooksterSinkDishes.count():0;}catch(e){}
  var s2=sunk.map(function(x){return x.id+(x.data&&x.data.dirt||'')+Math.round(waterOf(x)*50)}).join('|')+'#'+dishes;
  if(!force&&s2===sig)return;sig=s2;
  layer.innerHTML='';
  var total=sunk.length+Math.min(dishes,6),k=0;
  sunk.forEach(function(sv,i){
    var g=itemGeom(sv.id,14),w=document.createElement('div');w.className='sz-it take';w.title='klik: uzmi posudu · desni klik: isprazni vodu';
    var im=document.createElement('img');im.draggable=false;im.style.cssText='display:block;width:100%;height:auto;-webkit-user-drag:none';w.appendChild(im);
    var x=slotX(k++,total,g.w);w._x=x;sv._x=x;sv._g=g;
    var wf=waterOf(sv);if(wf>.004){var ov=CooksterVesselWater.overlay(sv.id,wf,srcOf(sv),true);if(ov)w.appendChild(ov);}
    im.onload=function(){place(w,im,x,g)};im.src=srcOf(sv);if(im.complete&&im.naturalWidth)place(w,im,x,g);
    w.addEventListener('pointerdown',function(e){e.stopPropagation();e.preventDefault();if(e.button===2)return;takeOut(i);});
    w.addEventListener('contextmenu',function(e){e.preventDefault();e.stopPropagation();if(sv.data&&sv.data.water){delete sv.data.water;saveSunk();renderSink(true);}});
    layer.appendChild(w);
  });
  var gd=itemGeom('posuda_za_kupus',11);
  for(var d=0;d<Math.min(dishes,6);d++){
    var w2=document.createElement('div');w2.className='sz-it';var im2=document.createElement('img');im2.draggable=false;im2.style.cssText='display:block;width:100%;height:auto';w2.appendChild(im2);
    (function(w2,im2,x){im2.onload=function(){place(w2,im2,x,gd)};im2.src='assets/calibration_props/posuda_za_kupus/posuda_prljava.webp';if(im2.complete&&im2.naturalWidth)place(w2,im2,x,gd);})(w2,im2,slotX(k++,total,gd.w));
    layer.appendChild(w2);
  }
}
function place(w,im,x,g){var yy=g.y-g.h;w.style.left=x+'%';w.style.top=yy+'%';w.style.width=g.w+'%';w.style.clipPath=clipFor(im,x,yy,g.w);}
function takeOut(i){
  var sv=sunk[i];if(!sv)return;
  var bridge=window.CooksterPantryBridge;if(!bridge||bridge.heldItem&&bridge.heldItem()){return;}
  sunk.splice(i,1);saveSunk();close();
  setTimeout(function(){try{bridge.take(sv);}catch(e){}renderSink(true);},DUR*.8);
}
// a vessel from the hand goes into the sink and the close-up opens
function putHeld(){
  var bridge=window.CooksterPantryBridge;if(!bridge||!bridge.heldItem)return false;
  var el=bridge.heldItem();if(!el)return false;
  if(sunk.length>=6){try{showToast('Sudopera je puna.');}catch(e){}return false;}
  var saved=bridge.detachHeld();if(!saved)return false;
  sunk.push(saved);saveSunk();renderSink(true);open();return true;
}
setInterval(function(){if(opened)renderSink(false);},500);
var openBase2=open;open=function(){renderSink(true);openBase2();};
window.CooksterSinkZoom_putHeld=putHeld;

/* the sink fills the vessels that stand under the stream, and washes (soaks) the dirty ones that have water in them */
var SPLASH=new Image();SPLASH.src='assets/water/pljusak.webp?v=1';
var lastSave=0;
function fillTick(){
  if(!opened||!window.CooksterVesselWater)return;
  var Wt=CooksterVesselWater,changed=false,dt=.1;
  if(flow>.05){
    var lx=cal.tap.land[0];
    sunk.forEach(function(sv){
      if(!Wt.has(sv.id))return;var g=sv._g||itemGeom(sv.id,14),x=sv._x;if(x==null)return;
      if(Math.abs(x-lx)>g.w*.6)return;                               // only a vessel under the stream
      sv.data=sv.data||{};var f=Wt.clamp(sv.data.water)+dt*.09*flow;f=Math.min(1,f);
      if(Math.abs(f-Wt.clamp(sv.data.water))>.0005){sv.data.water=f.toFixed(3);changed=true;}
    });
  }
  sunk.forEach(function(sv){
    if(!sv.data||sv.data.dirt!=='1'||Wt.clamp(sv.data.water)<.25)return;
    var rate=flow>.05?dt/12:dt/45;                                   // a dirty vessel with water in it is washed: faster under the running tap
    sv.data.soak=(+sv.data.soak||0)+rate;changed=true;
    if(sv.data.soak>=1){delete sv.data.dirt;delete sv.data.hadFood;delete sv.data.soak;try{showToast('Posuda je oprana.');}catch(e){}}
  });
  if(changed){renderSink(false);var now=performance.now();if(now-lastSave>1000){lastSave=now;saveSunk();}}
}
setInterval(fillTick,100);


window.CooksterSinkZoom={open:open,close:close,isOpen:function(){return opened;},cal:function(){return cal;},putHeld:putHeld};
})();
