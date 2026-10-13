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
var CAL_DEF={rim:[[29.3,27.1],[68.8,27.1],[72.2,70.7],[26.9,70.7]],floor:[[32.2,43.2],[66.6,43.2],[67.3,70.2],[31.6,70.2]],mask:[[26,18],[74,18],[74,72.5],[26,72.5]],vessels:{}};
var cal=null;
function loadCal(){
  try{var d=JSON.parse(localStorage.getItem(CAL_KEY)||'null');if(d&&d.rim&&d.floor&&d.mask){d.vessels=d.vessels||{};return d;}}catch(e){}
  return JSON.parse(JSON.stringify(CAL_DEF));
}
cal=loadCal();
function saveCal(){try{localStorage.setItem(CAL_KEY,JSON.stringify(cal));}catch(e){}}
var NS='http://www.w3.org/2000/svg';
function se(tag,a){var e=document.createElementNS(NS,tag);for(var k in a)e.setAttribute(k,a[k]);return e;}
var ed=document.createElement('div');ed.className='sz-edit';ed.setAttribute('data-tool-ui','1');ed.style.display='none';
ed.innerHTML='<b>Kalibracija sudopere (krupan plan)</b>'+
 '<div class="sz-row"><button data-m="rim" class="on">Otvor (gore)</button><button data-m="floor">Dno</button><button data-m="mask">Gde se posude vide</button></div>'+
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
  info();
}
function pct(e){var r=stage.getBoundingClientRect();return [Math.max(0,Math.min(100,(e.clientX-r.left)/r.width*100)),Math.max(0,Math.min(100,(e.clientY-r.top)/r.height*100))];}
var drag=null;
svg.addEventListener('pointerdown',function(e){
  if(!root.classList.contains('editing')||e.button!==0)return;
  var t=e.target;e.stopPropagation();
  if(t.tagName==='circle'){drag={k:t.dataset.k,i:+t.dataset.i};svg.setPointerCapture(e.pointerId);e.preventDefault();return;}
  if(t.tagName==='line'&&t.dataset.edge!==undefined){var k=t.dataset.k,i=+t.dataset.edge;cal[k].splice(i+1,0,pct(e));saveCal();draw();drag={k:k,i:i+1};svg.setPointerCapture(e.pointerId);e.preventDefault();}
});
svg.addEventListener('pointermove',function(e){if(!drag)return;cal[drag.k][drag.i]=pct(e);saveCal();draw();});
svg.addEventListener('pointerup',function(){drag=null;});
svg.addEventListener('dblclick',function(e){var t=e.target;if(t.tagName==='circle'&&cal[t.dataset.k].length>3){cal[t.dataset.k].splice(+t.dataset.i,1);saveCal();draw();}});
ed.querySelectorAll('[data-m]').forEach(function(b){b.addEventListener('click',function(){mode=b.dataset.m;ed.querySelectorAll('[data-m]').forEach(function(x){x.classList.toggle('on',x===b)});draw();});});
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
setInterval(syncEditing,500);
// a button that opens the sink close-up while the scene calibration is on (the calibration layer covers the sink, so a click on it cannot open it)
var calBtn=document.createElement('button');calBtn.type='button';calBtn.textContent='🚰 Sudopera krupno (kalibracija)';calBtn.setAttribute('data-tool-ui','1');
calBtn.style.cssText='position:fixed;right:14px;bottom:70px;z-index:19990;display:none;border:2px solid #351b0d;border-radius:9px;background:#e8c27a;color:#351b0d;font:700 13px/1 system-ui,sans-serif;padding:9px 12px;cursor:pointer';
document.body.appendChild(calBtn);
calBtn.addEventListener('click',function(e){e.stopPropagation();open();});
setInterval(function(){calBtn.style.display=(calActive()&&!opened)?'block':'none';},600);

window.CooksterSinkZoom={open:open,close:close,isOpen:function(){return opened;},cal:function(){return cal;}};
})();
