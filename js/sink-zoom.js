/* Cookster - the sink close-up.
   A click on the sink (with nothing in the hand) zooms the kitchen into the sink, then the picture of the sink close-up (assets/sink/sudopera_krupno.webp) fades in.
   Back: the button "Nazad", the Escape key, or a click on the dark edge. The game behind keeps running. */
(function(){
'use strict';
if(window.CooksterSinkZoom)return;
var SRC='assets/sink/sudopera_krupno.webp?v=1',DUR=900;
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
  tap:{spout:[49.5,30.2],land:[49.4,56],left:[42.2,15.4],right:[56.2,15.4],r:2.7,squash:.55}};
var cal=null;
function loadCal(){
  try{var d=JSON.parse(localStorage.getItem(CAL_KEY)||'null');if(d&&d.rim&&d.floor&&d.mask){d.vessels=d.vessels||{};d.tap=Object.assign({},CAL_DEF.tap,d.tap||{});return d;}}catch(e){}
  return JSON.parse(JSON.stringify(CAL_DEF));
}
cal=loadCal();
function saveCal(){try{localStorage.setItem(CAL_KEY,JSON.stringify(cal));}catch(e){}}
var NS='http://www.w3.org/2000/svg';
function se(tag,a){var e=document.createElementNS(NS,tag);for(var k in a)e.setAttribute(k,a[k]);return e;}
var ed=document.createElement('div');ed.className='sz-edit';ed.setAttribute('data-tool-ui','1');ed.style.display='none';
ed.innerHTML='<b>Kalibracija sudopere (krupan plan)</b>'+
 '<div class="sz-row"><button data-m="rim" class="on">Otvor (gore)</button><button data-m="floor">Dno</button><button data-m="mask">Gde se posude vide</button><button data-m="tap">Slavina</button></div>'+
 '<div id="szTapBox" style="display:none"><small class="sz-help">Slavina: <b style="display:inline;color:#7fe3ff">plavo</b> = vrh slavine (odakle teče voda), <b style="display:inline;color:#ffe27a">žuto</b> = gde voda pada, <b style="display:inline;color:#7aff9a">zeleno</b> = levi i desni ventil (centar glave). Prevuci tačke.</small><label>Veličina ventila <input id="szTapR" type="range" min="1" max="7" step="0.1" value="2.6"><b id="szTapRN">2.6</b></label><label>Nagib (spljoštenost) ventila <input id="szTapSq" type="range" min="0.25" max="1" step="0.01" value="0.55"><b id="szTapSqN">0.55</b></label><div class="sz-row"><button id="szTapTest">Probaj: odvrni / zavrni</button></div></div>'+
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
    var T=cal.tap,pts=[['spout','#42d6e8'],['land','#ffe27a'],['left','#7aff9a'],['right','#7aff9a']];
    pts.forEach(function(q){var pp=T[q[0]];
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
svg.addEventListener('pointermove',function(e){if(!drag)return;if(drag.t){cal.tap[drag.t]=pct(e);saveCal();draw();return;}cal[drag.k][drag.i]=pct(e);saveCal();draw();});
svg.addEventListener('pointerup',function(){drag=null;});
svg.addEventListener('dblclick',function(e){var t=e.target;if(t.tagName==='circle'&&cal[t.dataset.k].length>3){cal[t.dataset.k].splice(+t.dataset.i,1);saveCal();draw();}});
ed.querySelectorAll('[data-m]').forEach(function(b){b.addEventListener('click',function(){mode=b.dataset.m;ed.querySelector('#szTapBox').style.display=mode==='tap'?'block':'none';ed.querySelectorAll('[data-m]').forEach(function(x){x.classList.toggle('on',x===b)});draw();});});
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
    if(v.open>0.003||v.target){drawHead(g,k,v,w,h);}
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
function patch(cx,cy,R,feather){
  // a round piece of the picture with a soft edge (cx,cy,R in pixels of the picture)
  var S=Math.max(4,Math.round(R*2)),c=document.createElement('canvas');c.width=c.height=S;var g=c.getContext('2d');
  g.drawImage(img,cx-R,cy-R,R*2,R*2,0,0,S,S);
  var gr=g.createRadialGradient(S/2,S/2,0,S/2,S/2,S/2);gr.addColorStop(0,'#000');gr.addColorStop(Math.max(0,1-feather),'#000');gr.addColorStop(1,'rgba(0,0,0,0)');
  g.globalCompositeOperation='destination-in';g.fillStyle=gr;g.fillRect(0,0,S,S);return c;
}
function drawHead(g,k,v,w,h){
  var T=cal.tap,c=T[k],cx=c[0]/100*w,cy=c[1]/100*h,R=T.r/100*w,q=T.squash;
  var iw=img.naturalWidth||1,ih=img.naturalHeight||1,sx=c[0]/100*iw,sy=c[1]/100*ih,sr=T.r/100*iw*1.12,side=k==='left'?-1:1;
  // 1. hide the head that is in the picture: a piece of the wall and the rim of the sink from the side of the valve is laid over it
  g.drawImage(patch(sx+side*sr*2.7,sy,sr,.35),cx-R*1.12,cy-R*1.12,R*2.24,R*2.24);
  // 2. the head turns: a flat disc, seen from above at an angle, turns round its middle (a little motion blur while it moves)
  var spinning=Math.abs(v.target-v.open)>.01,n=spinning?4:1,lift=Math.sin(Math.min(1,v.open)*Math.PI)*0.0025*w,pc=patch(sx,sy,sr,.3);
  for(var i=0;i<n;i++){
    g.save();g.globalAlpha=spinning?(i===n-1?1:.3):1;g.translate(cx,cy-lift);
    g.scale(1,q);g.rotate(v.ang-(n-1-i)*.14*Math.sign(v.target-v.open||1)*(k==='left'?1:-1));g.scale(1,1/q);
    g.drawImage(pc,-R*1.12,-R*1.12,R*2.24,R*2.24);g.restore();
  }
}
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
  // where it lands: rings and drops
  if(streamLen>.9){
    g.save();g.lineWidth=Math.max(1,w*.0014);
    for(var r=0;r<3;r++){var ph=((t*1.3+r/3)%1);g.globalAlpha=.55*(1-ph)*flow;g.strokeStyle='#eaf7ff';g.beginPath();g.ellipse(lx,ly,w*(.012+.05*ph)*(.6+flow*.6),w*(.012+.05*ph)*.33*(.6+flow*.6),0,0,Math.PI*2);g.stroke();}
    g.restore();
    if(Math.random()<flow*.7)drops.push({x:lx+(Math.random()-.5)*w*.014,y:ly,vx:(Math.random()-.5)*w*.12,vy:-w*(.08+Math.random()*.12),life:0});
  }
  for(var d=drops.length-1;d>=0;d--){var p=drops[d];p.life+=1/60;p.vy+=w*.5/60;p.x+=p.vx/60;p.y+=p.vy/60;
    if(p.life>.5){drops.splice(d,1);continue;}
    g.fillStyle='rgba(230,246,255,'+(.8*(1-p.life*2))+')';g.beginPath();g.arc(p.x,p.y,Math.max(1,w*.0016),0,Math.PI*2);g.fill();}
}
// when the close-up opens: if the water of the kitchen is already running, the left valve is open
var openBase=open;open=function(){openBase();layoutHits();try{if(typeof faucetOn!=='undefined'&&faucetOn){valve.left.open=valve.left.target=1;kickFx();}}catch(e){}};
var closeBase=close;close=function(){closeBase();};
ed.querySelector('#szTapR').addEventListener('input',function(e){cal.tap.r=+e.target.value;ed.querySelector('#szTapRN').textContent=cal.tap.r.toFixed(1);saveCal();draw();layoutHits();});
ed.querySelector('#szTapSq').addEventListener('input',function(e){cal.tap.squash=+e.target.value;ed.querySelector('#szTapSqN').textContent=cal.tap.squash.toFixed(2);saveCal();});
ed.querySelector('#szTapTest').addEventListener('click',function(){var on=!(valve.left.target||valve.right.target);valve.left.target=on?1:0;valve.right.target=on?1:0;syncGame();kickFx();});

setInterval(function(){syncEditing();layoutHits();},500);
// a button that opens the sink close-up while the scene calibration is on (the calibration layer covers the sink, so a click on it cannot open it)
var calBtn=document.createElement('button');calBtn.type='button';calBtn.textContent='🚰 Sudopera krupno (kalibracija)';calBtn.setAttribute('data-tool-ui','1');
calBtn.style.cssText='position:fixed;right:14px;bottom:70px;z-index:19990;display:none;border:2px solid #351b0d;border-radius:9px;background:#e8c27a;color:#351b0d;font:700 13px/1 system-ui,sans-serif;padding:9px 12px;cursor:pointer';
document.body.appendChild(calBtn);
calBtn.addEventListener('click',function(e){e.stopPropagation();open();});
setInterval(function(){calBtn.style.display=(calActive()&&!opened)?'block':'none';},600);

window.CooksterSinkZoom={open:open,close:close,isOpen:function(){return opened;},cal:function(){return cal;}};
})();
