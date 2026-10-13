/* Cookster - water in vessels.
   A vessel keeps how full of water it is in dataset.water (0..1, saved with the game). The water is drawn inside the area of the food that was calibrated in the tool "Maska posude"
   (js/core/vessel-food-calibration.js: the visible area of the food, and the points of the bottom and of the top of the food = how high the water can stand).
   Only vessels that have such a calibration show water. js/sink-zoom.js fills the vessels that stand in the sink; pouring (game.js) moves the water between vessels. */
(function(){
'use strict';
if(window.CooksterVesselWater)return;
var TEX='assets/water/povrsina.webp?v=1';
var css=document.createElement('style');
css.textContent='@keyframes vwDrift{from{background-position:0 0,0 0}to{background-position:0 0,768px 384px}}'+
 '.vessel-water-ov{position:absolute;inset:0;pointer-events:none;overflow:hidden}'+
 '.vessel-water-ov .vw-fill{position:absolute;left:0;right:0;bottom:0;background:linear-gradient(rgba(60,150,190,.30),rgba(20,80,120,.52)),url('+TEX+');background-size:100% 100%,46% auto;opacity:.78;animation:vwDrift 26s linear infinite}'+
 '.vessel-water-ov .vw-top{position:absolute;left:0;right:0;height:3.2%;background:linear-gradient(rgba(255,255,255,.62),rgba(255,255,255,0));mix-blend-mode:screen}';
document.head.appendChild(css);
var WKEY='cookster.vessel-water-cal.v1',WCAL={};
try{WCAL=JSON.parse(localStorage.getItem(WKEY)||'{}')||{};}catch(e){WCAL={};}
function prof(id){
  // the calibration of the water (tool "Voda u posudi") wins over the calibration of the food
  var w=WCAL[id];
  if(w&&w.poly&&w.poly.length>=3&&w.lo&&w.hi)return {foodVisible:w.poly,depth:{bottom:w.lo,foodTop:w.hi},mask:w.front&&w.front.length>=3?w.front:null,tilt:+w.tilt||0,own:true};
  var C=window.CooksterVesselFoodCalibration,p=C&&C.get&&C.get(id);
  if(!p||!p.foodVisible||p.foodVisible.length<3||!p.depth||!p.depth.bottom||!p.depth.foodTop)return null;
  return p;
}
function has(id){return !!prof(id);}
function clamp(v){return Math.max(0,Math.min(1,+v||0));}
// a layer with the water, as big as the picture of the vessel (the coordinates of the calibration are percents of that picture)
function overlay(id,f,src,withFront,pOverride){
  var p=pOverride||prof(id);f=clamp(f);if(!p||f<=.004)return null;
  var d=document.createElement('div');d.className='vessel-water-ov';
  var poly='polygon('+p.foodVisible.map(function(q){return q[0]+'% '+q[1]+'%'}).join(',')+')';
  d.style.clipPath=poly;d.style.webkitClipPath=poly;
  var by=p.depth.bottom[1],ty=p.depth.foodTop[1],y=by+(ty-by)*f;      // the surface of the water (percent of the height of the picture)
  var tl=+p.tilt||0;
  // the surface of the water can be tilted (the angle set in the tool): the layer is wider than the vessel and turns round the middle of the surface
  var fill=document.createElement('div');fill.className='vw-fill';fill.style.top=y+'%';fill.style.left='-60%';fill.style.right='-60%';fill.style.bottom='-80%';
  fill.style.transformOrigin='50% 0';fill.style.transform='rotate('+tl+'deg)';fill.style.backgroundSize='100% 100%,'+(46/2.2)+'% auto';
  var top=document.createElement('div');top.className='vw-top';top.style.top=(y-1.2)+'%';top.style.left='-60%';top.style.right='-60%';top.style.transformOrigin='50% 1.2%';top.style.transform='rotate('+tl+'deg)';
  /* the middle of the layer is on the x of the calibrated point of the level: shift it so that the turning point is that point */
  var cx=(p.depth.bottom[0]+p.depth.foodTop[0])/2;var shift=(cx-50);fill.style.marginLeft=shift+'%';top.style.marginLeft=shift+'%';
  d.appendChild(fill);d.appendChild(top);
  if(src){
    // the water never leaves the outline of the vessel (the picture of the vessel is the mask), and where the front wall of the vessel is drawn over the food, it is over the water too
    var m='url("'+src+'")';d.style.webkitMaskImage=m;d.style.maskImage=m;d.style.webkitMaskSize='100% 100%';d.style.maskSize='100% 100%';
    if(withFront&&p.mask&&p.mask.length>=3){
      var fr=document.createElement('img');fr.src=src;fr.alt='';fr.draggable=false;
      var mp='polygon('+p.mask.map(function(q){return q[0]+'% '+q[1]+'%'}).join(',')+')';
      fr.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;clip-path:'+mp+';-webkit-clip-path:'+mp;
      d.appendChild(fr);
    }
  }
  return d;
}
function get(el){return clamp(el&&el.dataset&&el.dataset.water);}
// the vessel in the kitchen
function sync(el){
  if(!el||!el.dataset)return;
  var id=el.dataset.itemId,f=get(el),key=f<=.004||!has(id)?'':String(Math.round(f*100));
  if(el._waterKey===key)return;
  el._waterKey=key;
  if(el._waterOv){el._waterOv.remove();el._waterOv=null;}
  if(!key)return;
  var body=el.querySelector('.body'),src=body&&body.getAttribute('src');
  var d=overlay(id,f,src,false);if(!d)return;
  // vessels with a front wall (a picture over the food, z-index 6): the water goes under it; the pans have none: the water is over the food
  d.style.zIndex=el._vesselFrontMask&&el._vesselFrontMask.style.display!=='none'?'5':'8';el.appendChild(d);el._waterOv=d;
}
function set(el,f){
  f=clamp(f);
  if(f<=.004)delete el.dataset.water;else el.dataset.water=f.toFixed(3);
  sync(el);
}
window.CooksterVesselWater={reload:function(){try{WCAL=JSON.parse(localStorage.getItem(WKEY)||'{}')||{};}catch(e){}},has:has,get:get,set:set,sync:sync,overlay:overlay,clamp:clamp};

/* ---------- the tool "Voda u posudi": where the water of a vessel is ----------
   For every vessel: the shape of the surface of the water (the opening of the vessel), the point where the water stands when the vessel is nearly empty and the point when it is full,
   and (not necessary) the front wall that hides the water. Points are percents of the picture of the vessel. It is saved in this browser (cookster.vessel-water-cal.v1). */
function equipment(){
  var l=[];try{(window.CooksterCatalog&&CooksterCatalog.KITCHEN_EQUIPMENT||[]).forEach(function(d){if(d&&d.id&&d.src&&(d.vessel===true||d.type==='container'||d.type==='cookware'))l.push({id:d.id,label:d.label||d.id,src:d.src});});}catch(e){}
  return l;
}
function saveW(){try{localStorage.setItem(WKEY,JSON.stringify(WCAL));}catch(e){}}
function refreshKitchen(id){try{(window.items||[]).forEach(function(it){if(it&&it.dataset&&it.dataset.itemId===id){it._waterKey=null;sync(it);}});}catch(e){}}
function ellipsePoly(cx,cy,rx,ry){var o=[];for(var i=0;i<12;i++){var a=i/12*Math.PI*2;o.push([+(cx+rx*Math.cos(a)).toFixed(1),+(cy+ry*Math.sin(a)).toFixed(1)]);}return o;}
function startFor(id){
  var C=window.CooksterVesselFoodCalibration,p=C&&C.get&&C.get(id);
  if(p&&p.foodVisible&&p.foodVisible.length>=3&&p.depth&&p.depth.bottom&&p.depth.foodTop)return {poly:p.foodVisible.map(function(q){return q.slice()}),lo:p.depth.bottom.slice(),hi:p.depth.foodTop.slice(),front:p.mask&&p.mask.length>=3?p.mask.map(function(q){return q.slice()}):[]};
  return {poly:ellipsePoly(50,30,36,20),lo:[50,45],hi:[50,18],front:[]};
}
function buildTool(){
  var hud=document.getElementById('hud');if(!hud||document.getElementById('vesselWaterBtn'))return;
  var btn=document.createElement('button');btn.id='vesselWaterBtn';btn.type='button';btn.textContent='💧 Voda u posudi';btn.title='Nacrtaj gde je voda u svakoj posudi';hud.appendChild(btn);
  var st=document.createElement('style');st.textContent=
   '#vwTool{position:fixed;inset:0;z-index:21000;display:none;background:rgba(10,6,3,.55)}#vwTool.open{display:block}'+
   '#vwTool .vw-card{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(1100px,96vw);height:min(720px,94vh);background:#2a1a0c;border:2px solid #7a5428;border-radius:12px;color:#f3e3c2;font:13px/1.35 system-ui,sans-serif;display:flex;gap:12px;padding:12px}'+
   '#vwTool .vw-side{width:290px;overflow:auto}#vwTool .vw-main{flex:1;position:relative;display:flex;align-items:center;justify-content:center;background:#1a0f06;border-radius:8px;overflow:hidden}'+
   '#vwTool .vw-stage{position:relative;max-width:100%;max-height:100%}#vwTool .vw-stage img.vw-pic{display:block;max-width:100%;max-height:calc(94vh - 40px);-webkit-user-drag:none;user-select:none;image-rendering:auto}'+
   '#vwTool svg{position:absolute;inset:0;width:100%;height:100%;cursor:crosshair}'+
   '#vwTool button,#vwTool select{border:1px solid #351b0d;border-radius:7px;background:#e8c27a;color:#351b0d;font:700 12px/1 system-ui,sans-serif;padding:7px 9px;margin:2px 4px 2px 0;cursor:pointer}#vwTool select{width:100%;font-weight:600}#vwTool button.on{background:#fff0b8;box-shadow:0 0 0 2px #ffd86a}'+
   '#vwTool label{display:block;margin:7px 0}#vwTool input[type=range]{width:100%}#vwTool small{display:block;color:#d9c69c;margin:5px 0}#vwTool hr{border:0;border-top:1px solid #7a5428;margin:8px 0}';
  document.head.appendChild(st);
  var root=document.createElement('div');root.id='vwTool';root.setAttribute('data-tool-ui','1');
  root.innerHTML='<div class="vw-card"><div class="vw-side"><b style="font-size:15px">💧 Voda u posudi</b><button id="vwClose" style="float:right">×</button>'+
   '<label>Posuda <select id="vwSel"></select></label>'+
   '<div><button data-m="poly" class="on">Površina vode</button><button data-m="lo">Nivo: prazno</button><button data-m="hi">Nivo: puno</button><button data-m="front">Prednja ivica</button></div>'+
   '<small><b style="color:#7fe3ff">Površina</b>: oblik otvora posude, unutar kog sme da bude voda (prevuci tačke; klik na liniju ubacuje tačku, dvoklik briše). <b style="color:#ffe27a">Prazno / puno</b>: klikni mesto gde je površina vode kad je skoro prazna i kad je puna (samo visina se računa). <b style="color:#ef5350">Prednja ivica</b> (nije obavezno): deo zida posude koji treba da bude IZNAD vode.</small>'+
   '<label>Probni nivo vode <input id="vwLvl" type="range" min="0" max="100" value="60"><b id="vwLvlN">60%</b></label><label>Nagib vode (ugao površine) <input id="vwTilt" type="range" min="-35" max="35" step="0.5" value="0"><b id="vwTiltN">0°</b></label>'+
   '<div><button id="vwSave">💾 Sačuvaj ovu posudu</button><button id="vwReset">↺ Početno</button><button id="vwCopy">Kopiraj sve (JSON)</button></div><small id="vwStatus"></small></div>'+
   '<div class="vw-main"><div class="vw-stage" id="vwStage"><img class="vw-pic" id="vwPic" alt=""><div id="vwOv" style="position:absolute;inset:0;pointer-events:none"></div><svg id="vwSvg" viewBox="0 0 100 100" preserveAspectRatio="none"></svg></div></div></div>';
  document.body.appendChild(root);
  var sel=root.querySelector('#vwSel'),pic=root.querySelector('#vwPic'),svg=root.querySelector('#vwSvg'),ov=root.querySelector('#vwOv'),stage=root.querySelector('#vwStage'),lvl=root.querySelector('#vwLvl');
  var tiltEl=root.querySelector('#vwTilt'),cur=null,mode='poly',work={},drag=null,COL={poly:'#42d6e8',lo:'#ffe27a',hi:'#7aff9a',front:'#ef5350'};
  var list=equipment();
  function fill(){sel.innerHTML='';list.forEach(function(v){var o=document.createElement('option');o.value=v.id;var sv=!!WCAL[v.id];o.textContent=(sv?'✔ ':'')+v.label;o.style.fontWeight=sv?'800':'400';sel.appendChild(o);});if(cur)sel.value=cur;}
  function load(id){cur=id;var w=WCAL[id];work=JSON.parse(JSON.stringify(w||startFor(id)));if(!work.front)work.front=[];var v=list.find(function(x){return x.id===id});pic.src=v?v.src:'';draw();}
  function se(t,a){var e=document.createElementNS('http://www.w3.org/2000/svg',t);for(var k in a)e.setAttribute(k,a[k]);return e;}
  function profile(){return {foodVisible:work.poly,depth:{bottom:work.lo,foodTop:work.hi},mask:work.front&&work.front.length>=3?work.front:null,tilt:+work.tilt||0};}
  function draw(){
    while(svg.firstChild)svg.removeChild(svg.firstChild);
    ['front','poly'].forEach(function(k){var P=work[k]||[];if(P.length<2)return;var c=COL[k],on=mode===k;
      if(P.length>=3)svg.appendChild(se('polygon',{points:P.map(function(p){return p[0]+','+p[1]}).join(' '),fill:c,'fill-opacity':on?.14:.05,stroke:c,'stroke-width':on?.4:.2,'vector-effect':'non-scaling-stroke','pointer-events':'none'}));
      if(!on)return;
      P.forEach(function(p,i){var a=P[(i+1)%P.length],l=se('line',{x1:p[0],y1:p[1],x2:a[0],y2:a[1],stroke:'transparent','stroke-width':'12','vector-effect':'non-scaling-stroke'});l.dataset.k=k;l.dataset.e=i;svg.appendChild(l);});
      P.forEach(function(p,i){var c2=se('circle',{cx:p[0],cy:p[1],r:.9,fill:'#fff',stroke:c,'stroke-width':'.3','vector-effect':'non-scaling-stroke'});c2.dataset.k=k;c2.dataset.i=i;svg.appendChild(c2);});});
    ['lo','hi'].forEach(function(k){var p=work[k];svg.appendChild(se('line',{x1:0,y1:p[1],x2:100,y2:p[1],stroke:COL[k],'stroke-width':mode===k?.5:.25,'stroke-dasharray':'2 1.5','vector-effect':'non-scaling-stroke','pointer-events':'none'}));
      var c3=se('circle',{cx:p[0],cy:p[1],r:1.1,fill:COL[k],stroke:'#000','stroke-width':.3,'vector-effect':'non-scaling-stroke'});c3.dataset.k=k;c3.dataset.pt='1';svg.appendChild(c3);});
    ov.innerHTML='';var o=overlay(cur,+lvl.value/100,pic.getAttribute('src'),true,profile());if(o)ov.appendChild(o);
    root.querySelector('#vwLvlN').textContent=lvl.value+'%';root.querySelector('#vwTiltN').textContent=(+work.tilt||0)+'°';tiltEl.value=+work.tilt||0;
  }
  function pct(e){var r=stage.getBoundingClientRect();return [Math.max(0,Math.min(100,(e.clientX-r.left)/r.width*100)),Math.max(0,Math.min(100,(e.clientY-r.top)/r.height*100))];}
  svg.addEventListener('pointerdown',function(e){
    if(e.button!==0)return;var t=e.target;
    if(t.dataset&&t.dataset.pt){drag={pt:t.dataset.k};svg.setPointerCapture(e.pointerId);e.preventDefault();return;}
    if(t.tagName==='circle'&&t.dataset.i!==undefined){drag={k:t.dataset.k,i:+t.dataset.i};svg.setPointerCapture(e.pointerId);e.preventDefault();return;}
    if(t.tagName==='line'&&t.dataset.e!==undefined){var k=t.dataset.k,i=+t.dataset.e;work[k].splice(i+1,0,pct(e));draw();drag={k:k,i:i+1};svg.setPointerCapture(e.pointerId);e.preventDefault();return;}
    if(mode==='lo'||mode==='hi'){work[mode]=pct(e);draw();return;}
    if(mode==='front'||mode==='poly'){work[mode].push(pct(e));draw();}
  });
  svg.addEventListener('pointermove',function(e){if(!drag)return;var p=pct(e);if(drag.pt)work[drag.pt]=p;else work[drag.k][drag.i]=p;draw();});
  svg.addEventListener('pointerup',function(){drag=null;});
  svg.addEventListener('dblclick',function(e){var t=e.target;if(t.tagName==='circle'&&t.dataset.i!==undefined&&work[t.dataset.k].length>(t.dataset.k==='poly'?3:0)){work[t.dataset.k].splice(+t.dataset.i,1);draw();}});
  root.querySelectorAll('[data-m]').forEach(function(b){b.addEventListener('click',function(){mode=b.dataset.m;root.querySelectorAll('[data-m]').forEach(function(x){x.classList.toggle('on',x===b)});draw();});});
  lvl.addEventListener('input',draw);
  tiltEl.addEventListener('input',function(){work.tilt=+tiltEl.value;draw();});
  sel.addEventListener('change',function(){load(sel.value);});
  pic.addEventListener('load',draw);
  root.querySelector('#vwSave').addEventListener('click',function(){WCAL[cur]=JSON.parse(JSON.stringify(work));saveW();refreshKitchen(cur);fill();root.querySelector('#vwStatus').textContent='Sačuvano za ovu posudu (podebljana je u listi sa ✔).';});
  root.querySelector('#vwReset').addEventListener('click',function(){delete WCAL[cur];saveW();refreshKitchen(cur);fill();load(cur);root.querySelector('#vwStatus').textContent='Vraćeno na početno.';});
  root.querySelector('#vwCopy').addEventListener('click',function(){var t=JSON.stringify(WCAL,null,2);if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(function(){root.querySelector('#vwStatus').textContent='JSON je kopiran: nalepi ga u chat.';},function(){root.querySelector('#vwStatus').textContent='Ne mogu da kopiram.';});});
  root.querySelector('#vwClose').addEventListener('click',function(){root.classList.remove('open');});
  btn.addEventListener('click',function(){root.classList.add('open');list=equipment();fill();load(cur||(list[0]&&list[0].id));});
  window.addEventListener('keydown',function(e){if(root.classList.contains('open')&&e.key==='Escape'){e.stopPropagation();root.classList.remove('open');}},true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',buildTool,{once:true});else setTimeout(buildTool,0);

})();
