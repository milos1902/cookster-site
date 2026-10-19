/* Cookster: the editor of the shadow of one thing (the tool "Vreme i svetlo" → "Crtaj senku predmeta").
   Round the chosen thing there are ~20 points of its outline: the blue ones on the left half are FIXED to the thing (the shadow starts exactly under it),
   on the right side there are 5 orange handles that can be dragged: they make the far edge of the shadow. Every key of the day (Jutro / Podne / Veče) has its own handles.
   The shadow is made in js/sun-shadow.js, it is darkest near the thing and melts into transparency at the far end. */
(function(){
if(window.CooksterShadowEdit)return;
var on=false,svg=null,grp=null,drag=null,KM={'Jutro':'jutro','Podne':'podne'}      // only the morning and the noon have shadows to draw;
function scene(){return document.getElementById('scene');}
function findEl(id){var L=(typeof items!=='undefined'&&items)||[];for(var i=0;i<L.length;i++){var e=L[i];if(e&&e.isConnected&&e.offsetWidth>0&&(e.dataset.itemId||'')===id)return e;}return null;}
function build(){
  var sc=scene();if(!sc)return false;if(svg&&svg.parentNode===sc)return true;
  svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('width',1672);svg.setAttribute('height',941);
  svg.style.cssText='position:absolute;left:0;top:0;z-index:99990;pointer-events:none;overflow:visible;display:none';svg.setAttribute('data-tool-ui','1');
  grp=document.createElementNS('http://www.w3.org/2000/svg','g');svg.appendChild(grp);sc.appendChild(svg);return true;
}
function el(n,a){var e=document.createElementNS('http://www.w3.org/2000/svg',n);for(var k in a)e.setAttribute(k,a[k]);return e;}
function toScene(ev){var r=scene().getBoundingClientRect(),k=r.width/1672;return {x:(ev.clientX-r.left)/k,y:(ev.clientY-r.top)/k};}
function draw(){
  if(!on||!build()){if(svg)svg.style.display='none';return;}
  var D=window.CooksterDay,S=D&&D.sel?D.sel():null,key=S&&KM[S.key],e=S&&S.item?findEl(S.item):null;
  if(!D||!D.panelOpen()||!key||!e||!window.CooksterSunShadow){svg.style.display='none';return;}
  var g=CooksterSunShadow.geom(e,key);if(!g){svg.style.display='none';return;}
  svg.style.display='block';
  if(drag)return;      // while dragging the handles are not rebuilt (they follow the mouse)
  while(grp.firstChild)grp.removeChild(grp.firstChild);
  var L=e.offsetLeft,T=e.offsetTop,pts=g.pts.map(function(p){return (L+p[0]).toFixed(1)+','+(T+p[1]).toFixed(1);}).join(' ');
  grp.appendChild(el('polygon',{points:pts,fill:'rgba(255,170,40,.10)',stroke:'rgba(255,200,80,.8)','stroke-width':1.2,'stroke-dasharray':'4 3'}));
  g.pts.forEach(function(p,i){
    var c=el('circle',{cx:L+p[0],cy:T+p[1],r:8,fill:i<4?'#58a6ff':'#ff9a1f',stroke:'#fff','stroke-width':2,style:'cursor:grab;pointer-events:auto'});c.setAttribute('data-tool-ui','1');
    c.addEventListener('pointerdown',function(ev){ev.preventDefault();ev.stopPropagation();drag={i:i,c:c,e:e,key:key};try{c.setPointerCapture(ev.pointerId);}catch(x){}});
    c.addEventListener('pointermove',function(ev){if(!drag||drag.c!==c)return;var q=toScene(ev);c.setAttribute('cx',q.x);c.setAttribute('cy',q.y);CooksterSunShadow.setHandle(e,key,i,(q.x-e.offsetLeft)/e.offsetWidth,(q.y-e.offsetTop)/e.offsetHeight);});
    c.addEventListener('pointerup',function(ev){if(drag&&drag.c===c){drag=null;try{c.releasePointerCapture(ev.pointerId);}catch(x){}}});
    grp.appendChild(c);});
}
(function loop(){requestAnimationFrame(loop);if(on)draw();else if(svg)svg.style.display='none';})();
window.CooksterShadowEdit={set:function(v){on=!!v;if(!on&&svg)svg.style.display='none';},isOn:function(){return on;}};
})();
