/* Cookster: mesingane kuke na levom zidu (za kese sa pijace) + alat "Kuke" za podesavanje.
   Slika: assets/ui/wall/kuka.webp (101x160). Svaka kuka: x,y = SREDINA kuke u koordinatama scene (1672x941), h = visina u px, rz = rotacija,
   rx = nagib gore-dole, ry = nagib levo-desno (stepeni), p = perspektiva (px, manje = jaca).
   Alat: dugme "Kuke" (levo, spada u Alate): povuci kuku mišem, klizaci za velicinu/rotaciju/nagibe, strelice pomeraju za 1 px (Shift = 5 px),
   Dodaj / Duplikat / Obrisi / Kopiraj JSON / Resetuj. Podesavanja se cuvaju u localStorage 'cookster.wall-hooks.v1'.
   "Kopiraj JSON" daje listu koja se ugradi u DEFAULTS da vazi za sve igrace. */
(function(){
'use strict';
if(window.CooksterWallHooks)return;
var KEY='cookster.wall-hooks.v2',IMG_W=101,IMG_H=160,SRC='assets/ui/wall/kuka.webp?v=2';
var DEFAULTS=[{"x":110,"y":299.4,"h":34,"rz":-16,"rx":0,"ry":24.5,"p":100},{"x":95.2,"y":334.8,"h":34,"rz":-16,"rx":0,"ry":18.5,"p":100},{"x":82,"y":369,"h":34,"rz":-16,"rx":0,"ry":20,"p":100},{"x":66,"y":402,"h":34,"rz":-16,"rx":0,"ry":21.5,"p":100},{"x":50.8,"y":434.2,"h":34,"rz":-16,"rx":0,"ry":23,"p":100},{"x":35.2,"y":463.9,"h":34,"rz":-11,"rx":0,"ry":11,"p":100}];   // tvoj izvoz iz alata (10.11.)
var hooks=null;
function clone(o){return JSON.parse(JSON.stringify(o));}
function load(){
  try{var r=JSON.parse(localStorage.getItem(KEY)||'null');if(Array.isArray(r)&&r.length)return r.filter(function(h){return h&&isFinite(h.x)&&isFinite(h.y);}).map(norm);}catch(e){}
  return clone(DEFAULTS);
}
function norm(h){return {x:+h.x,y:+h.y,h:+h.h||34,rz:+h.rz||0,rx:+h.rx||0,ry:+h.ry||0,p:+h.p||500};}
function save(){try{localStorage.setItem(KEY,JSON.stringify(hooks));}catch(e){}}
hooks=load();
var els=[],sel=-1,open=false;

function paint(h,el){
  var H=h.h,W=H*IMG_W/IMG_H;
  el.style.height=H+'px';el.style.width=W+'px';el.style.left=(h.x-W/2)+'px';el.style.top=(h.y-H/2)+'px';
  el.style.transform='perspective('+h.p+'px) rotateX('+h.rx+'deg) rotateY('+h.ry+'deg) rotateZ('+h.rz+'deg)';
}
function render(){
  var sc=document.getElementById('scene');if(!sc)return;
  els.forEach(function(e){e.remove();});els=[];
  hooks.forEach(function(h,i){
    var el=document.createElement('img');el.className='wall-hook';el.draggable=false;el.src=SRC;el.alt='';
    el.style.cssText='position:absolute;z-index:3;transform-origin:50% 50%;filter:drop-shadow(1px 2px 1.5px rgba(30,12,0,.55));pointer-events:'+(open?'auto':'none')+';cursor:'+(open?'move':'default');
    paint(h,el);
    el.addEventListener('pointerdown',function(e){if(!open||e.button!==0)return;e.preventDefault();e.stopPropagation();select(i);
      var s0=screenToScene(e.clientX,e.clientY),x0=h.x,y0=h.y;el.setPointerCapture&&el.setPointerCapture(e.pointerId);
      function mv(ev){var s=screenToScene(ev.clientX,ev.clientY);h.x=+(x0+s.x-s0.x).toFixed(1);h.y=+(y0+s.y-s0.y).toFixed(1);paint(h,el);syncRows();}
      function up(){window.removeEventListener('pointermove',mv);window.removeEventListener('pointerup',up);save();}
      window.addEventListener('pointermove',mv);window.addEventListener('pointerup',up);},true);
    sc.appendChild(el);els.push(el);
  });
  mark();
}
function mark(){els.forEach(function(e,i){e.style.outline=(open&&i===sel)?'2px dashed #22c55e':'';e.style.outlineOffset='2px';});}

// ---------- alat ----------
var panel=null,btn=null,rows={};
var CTRL=[['h','Veličina (visina px)',8,140,1],['rz','Rotacija',-90,90,.5],['rx','Nagib gore-dole',-70,70,.5],['ry','Nagib levo-desno',-70,70,.5],['p','Perspektiva',100,1500,10]];
function select(i){sel=i;syncRows();mark();}
function syncRows(){
  var h=hooks[sel];if(!panel)return;
  panel.querySelector('.wh-st').textContent=h?('Kuka '+(sel+1)+' / '+hooks.length+' · x '+h.x+' · y '+h.y):('Nijedna kuka nije izabrana ('+hooks.length+' kuka). Klikni kuku.');
  CTRL.forEach(function(c){var r=rows[c[0]];r.range.disabled=r.num.disabled=!h;if(h){r.range.value=h[c[0]];r.num.value=h[c[0]];}});
}
function buildPanel(){
  if(panel)return;
  var css=document.createElement('style');
  css.textContent='#whPanel{position:fixed;left:10px;bottom:60px;z-index:2147483000;width:292px;padding:10px 12px;border-radius:12px;border:2px solid #351b0d;background:#fff4dc;color:#351b0d;font:13px system-ui,sans-serif;display:none;box-shadow:0 8px 24px rgba(0,0,0,.4)}'
   +'#whPanel b{font-size:14px}#whPanel .wh-st{margin:4px 0 8px;font-size:12px;color:#6b4a28}#whPanel label{display:block;margin:5px 0 0;font-weight:700;font-size:12px}'
   +'#whPanel .wh-r{display:flex;gap:6px;align-items:center}#whPanel input[type=range]{flex:1}#whPanel input[type=number]{width:62px}'
   +'#whPanel .wh-b{display:flex;flex-wrap:wrap;gap:5px;margin-top:9px}#whPanel button{padding:5px 8px;border:2px solid #351b0d;border-radius:8px;background:#e8c27a;color:#351b0d;font:700 12px system-ui,sans-serif;cursor:pointer}'
   +'#whBtn{position:fixed;left:10px;bottom:20px;z-index:2147483000;padding:7px 11px;border-radius:9px;border:2px solid #351b0d;background:#e8c27a;color:#351b0d;font:700 13px system-ui,sans-serif;cursor:pointer}';
  document.head.appendChild(css);
  panel=document.createElement('div');panel.id='whPanel';panel.setAttribute('data-tool-ui','1');
  panel.innerHTML='<b>🪝 Kuke</b><div class="wh-st"></div>';
  CTRL.forEach(function(c){
    var l=document.createElement('label');l.textContent=c[1];var w=document.createElement('div');w.className='wh-r';
    var rg=document.createElement('input');rg.type='range';rg.min=c[2];rg.max=c[3];rg.step=c[4];
    var nm=document.createElement('input');nm.type='number';nm.min=c[2];nm.max=c[3];nm.step=c[4];
    function set(v){var h=hooks[sel];if(!h)return;v=+v;if(!isFinite(v))return;h[c[0]]=v;rg.value=v;nm.value=v;paint(h,els[sel]);save();}
    rg.addEventListener('input',function(){set(rg.value);});nm.addEventListener('change',function(){set(nm.value);});
    w.append(rg,nm);panel.append(l,w);rows[c[0]]={range:rg,num:nm};
  });
  var bs=document.createElement('div');bs.className='wh-b';panel.appendChild(bs);
  function B(t,f){var b=document.createElement('button');b.type='button';b.textContent=t;b.onclick=f;bs.appendChild(b);}
  B('Dodaj',function(){var b=hooks[sel]||{x:60,y:380,h:34,rz:-16,rx:0,ry:0,p:500};hooks.push(norm({x:b.x+16,y:b.y+33,h:b.h,rz:b.rz,rx:b.rx,ry:b.ry,p:b.p}));sel=hooks.length-1;save();render();syncRows();});
  B('Duplikat',function(){if(!hooks[sel])return;var b=hooks[sel];hooks.push(norm({x:b.x+12,y:b.y+12,h:b.h,rz:b.rz,rx:b.rx,ry:b.ry,p:b.p}));sel=hooks.length-1;save();render();syncRows();});
  B('Obriši',function(){if(!hooks[sel])return;hooks.splice(sel,1);sel=Math.min(sel,hooks.length-1);save();render();syncRows();});
  B('Kopiraj JSON',function(){var t=JSON.stringify(hooks);try{navigator.clipboard.writeText(t);}catch(e){}window.prompt('JSON kuka (Ctrl+C):',t);});
  B('Izvezi fajl',function(){var d={version:1,tool:'cookster-wall-hooks',exportedAt:new Date().toISOString(),image:{w:IMG_W,h:IMG_H},scene:{w:1672,h:941},hooks:hooks};
    var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(d,null,2)],{type:'application/json'}));a.download='cookster-wall-hooks.json';document.body.appendChild(a);a.click();setTimeout(function(){a.remove();URL.revokeObjectURL(a.href);},500);});
  B('Resetuj',function(){hooks=clone(DEFAULTS);sel=0;save();render();syncRows();});
  B('Zatvori',function(){toggle(false);});
  document.body.appendChild(panel);
  btn=document.createElement('button');btn.id='whBtn';btn.type='button';btn.textContent='🪝 Kuke';btn.setAttribute('data-tool-ui','1');btn.onclick=function(){toggle(!open);};document.body.appendChild(btn);
  window.addEventListener('keydown',function(e){
    if(!open||sel<0||!hooks[sel]||/INPUT|TEXTAREA/.test((e.target&&e.target.tagName)||''))return;
    var d=e.shiftKey?5:1,h=hooks[sel],m=true;
    if(e.key==='ArrowLeft')h.x-=d;else if(e.key==='ArrowRight')h.x+=d;else if(e.key==='ArrowUp')h.y-=d;else if(e.key==='ArrowDown')h.y+=d;else m=false;
    if(m){e.preventDefault();paint(h,els[sel]);save();syncRows();}
  });
}
function toggle(v){
  open=!!v;buildPanel();panel.style.display=open?'block':'none';
  els.forEach(function(e){e.style.pointerEvents=open?'auto':'none';e.style.cursor=open?'move':'default';});
  if(open&&sel<0&&hooks.length)sel=0;syncRows();mark();
}
function init(){render();buildPanel();}
window.CooksterWallHooks={get:function(){return hooks;},render:render,open:function(){toggle(true);},DEFAULTS:DEFAULTS};
if(document.readyState==='complete')init();else window.addEventListener('load',init);
})();
