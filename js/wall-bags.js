/* Cookster: kese na kukama levog zida + alat "Kese" za podesavanje.
   Slika: assets/ui/wall/kesa.webp (198x300; petlja ruckica je gore, na 47.7% sirine). Svaka kesa: x,y = tacka O KOJU VISI (vrh petlje, na kuglici kuke) u koordinatama scene,
   h = visina px, rz = njihanje/rotacija oko te tacke, rx = nagib gore-dole, ry = nagib levo-desno (stepeni), p = perspektiva.
   Alat "🛍 Kese": povuci kesu misem, klizaci, strelice (1 px, Shift 5), Dodaj/Duplikat/Obrisi/Kopiraj JSON/Izvezi fajl/Resetuj. Cuva u localStorage 'cookster.wall-bags.v1'.
   Dok alat nije povezan sa pijacom, kese se vide samo dok je alat otvoren (checkbox "Prikazi kese"). */
(function(){
'use strict';
if(window.CooksterWallBags)return;
var KEY='cookster.wall-bags.v2',IMG_W=198,IMG_H=300,APEX=.477,SRC='assets/ui/wall/kesa.webp?v=2';
var DEFAULTS=[{"x":113.4,"y":297.2,"h":73,"rz":-11.5,"rx":0,"ry":12.3,"p":500},{"x":97.8,"y":333.5,"h":76,"rz":-13,"rx":0,"ry":9.3,"p":500},{"x":84.6,"y":368.4,"h":80,"rz":-11.5,"rx":0,"ry":10,"p":500},{"x":67.4,"y":402.2,"h":85,"rz":-12.5,"rx":0,"ry":10.8,"p":500},{"x":52.1,"y":433.6,"h":94,"rz":-14.5,"rx":0,"ry":11.5,"p":500},{"x":37.1,"y":460.6,"h":103,"rz":-12.5,"rx":0,"ry":1,"p":500}];   // tvoj izvoz iz alata (10.11.)
function defaults(){return JSON.parse(JSON.stringify(DEFAULTS));}
function norm(b){return {x:+b.x,y:+b.y,h:+b.h||72,rz:+b.rz||0,rx:+b.rx||0,ry:+b.ry||0,p:+b.p||500};}
var bags=[],els=[],sel=-1,open=false,showAll=true;
function load(){
  try{var r=JSON.parse(localStorage.getItem(KEY)||'null');if(Array.isArray(r)&&r.length)return r.filter(function(b){return b&&isFinite(b.x)&&isFinite(b.y);}).map(norm);}catch(e){}
  return defaults();
}
function save(){try{localStorage.setItem(KEY,JSON.stringify(bags));}catch(e){}}
function paint(b,el){
  var H=b.h,W=H*IMG_W/IMG_H;
  el.style.height=H+'px';el.style.width=W+'px';el.style.left=(b.x-W*APEX)+'px';el.style.top=b.y+'px';
  el.style.transformOrigin=(APEX*100)+'% 0%';
  el.style.transform='perspective('+b.p+'px) rotateX('+b.rx+'deg) rotateY('+b.ry+'deg) rotateZ('+b.rz+'deg)';
}
function render(){
  var sc=document.getElementById('scene');if(!sc)return;
  els.forEach(function(e){e.remove();});els=[];
  bags.forEach(function(b,i){
    var el=document.createElement('img');el.className='wall-bag';el.draggable=false;el.src=SRC;el.alt='';
    el.style.cssText='position:absolute;z-index:4;filter:drop-shadow(1px 2px 2px rgba(30,12,0,.5));display:'+((open&&showAll)?'block':'none')+';pointer-events:'+(open?'auto':'none')+';cursor:'+(open?'move':'default');
    paint(b,el);
    el.addEventListener('pointerdown',function(e){if(!open||e.button!==0)return;e.preventDefault();e.stopPropagation();select(i);
      var s0=screenToScene(e.clientX,e.clientY),x0=b.x,y0=b.y;
      function mv(ev){var s=screenToScene(ev.clientX,ev.clientY);b.x=+(x0+s.x-s0.x).toFixed(1);b.y=+(y0+s.y-s0.y).toFixed(1);paint(b,el);syncRows();}
      function up(){window.removeEventListener('pointermove',mv);window.removeEventListener('pointerup',up);save();}
      window.addEventListener('pointermove',mv);window.addEventListener('pointerup',up);},true);
    sc.appendChild(el);els.push(el);
  });
  mark();
}
function mark(){els.forEach(function(e,i){e.style.outline=(open&&i===sel)?'2px dashed #22c55e':'';e.style.outlineOffset='2px';});}

var panel=null,btn=null,rows={};
var CTRL=[['h','Veličina (visina px)',20,240,1],['rz','Rotacija (njihanje)',-60,60,.5],['rx','Nagib gore-dole',-70,70,.5],['ry','Nagib levo-desno',-70,70,.5],['p','Perspektiva',100,1500,10]];
function select(i){sel=i;syncRows();mark();}
function syncRows(){
  var b=bags[sel];if(!panel)return;
  panel.querySelector('.wb-st').textContent=b?('Kesa '+(sel+1)+' / '+bags.length+' · x '+b.x+' · y '+b.y):('Nijedna kesa nije izabrana ('+bags.length+' kesa). Klikni kesu.');
  CTRL.forEach(function(c){var r=rows[c[0]];r.range.disabled=r.num.disabled=!b;if(b){r.range.value=b[c[0]];r.num.value=b[c[0]];}});
}
function buildPanel(){
  if(panel)return;
  var css=document.createElement('style');
  css.textContent='#wbPanel{position:fixed;left:10px;bottom:60px;z-index:2147483000;width:292px;padding:10px 12px;border-radius:12px;border:2px solid #351b0d;background:#fff4dc;color:#351b0d;font:13px system-ui,sans-serif;display:none;box-shadow:0 8px 24px rgba(0,0,0,.4)}'
   +'#wbPanel b{font-size:14px}#wbPanel .wb-st{margin:4px 0 8px;font-size:12px;color:#6b4a28}#wbPanel label{display:block;margin:5px 0 0;font-weight:700;font-size:12px}'
   +'#wbPanel .wb-r{display:flex;gap:6px;align-items:center}#wbPanel input[type=range]{flex:1}#wbPanel input[type=number]{width:62px}'
   +'#wbPanel .wb-b{display:flex;flex-wrap:wrap;gap:5px;margin-top:9px}#wbPanel button{padding:5px 8px;border:2px solid #351b0d;border-radius:8px;background:#e8c27a;color:#351b0d;font:700 12px system-ui,sans-serif;cursor:pointer}'
   +'#wbBtn{position:fixed;left:10px;bottom:20px;z-index:2147483000;padding:7px 11px;border-radius:9px;border:2px solid #351b0d;background:#e8c27a;color:#351b0d;font:700 13px system-ui,sans-serif;cursor:pointer}';
  document.head.appendChild(css);
  panel=document.createElement('div');panel.id='wbPanel';panel.setAttribute('data-tool-ui','1');
  panel.innerHTML='<b>🛍 Kese</b><div class="wb-st"></div><label style="font-weight:600"><input type="checkbox" class="wb-show" checked> Prikaži kese</label>';
  panel.querySelector('.wb-show').addEventListener('change',function(e){showAll=e.target.checked;render();});
  CTRL.forEach(function(c){
    var l=document.createElement('label');l.textContent=c[1];var w=document.createElement('div');w.className='wb-r';
    var rg=document.createElement('input');rg.type='range';rg.min=c[2];rg.max=c[3];rg.step=c[4];
    var nm=document.createElement('input');nm.type='number';nm.min=c[2];nm.max=c[3];nm.step=c[4];
    function set(v){var b=bags[sel];if(!b)return;v=+v;if(!isFinite(v))return;b[c[0]]=v;rg.value=v;nm.value=v;paint(b,els[sel]);save();}
    rg.addEventListener('input',function(){set(rg.value);});nm.addEventListener('change',function(){set(nm.value);});
    w.append(rg,nm);panel.append(l,w);rows[c[0]]={range:rg,num:nm};
  });
  var bs=document.createElement('div');bs.className='wb-b';panel.appendChild(bs);
  function B(t,f){var x=document.createElement('button');x.type='button';x.textContent=t;x.onclick=f;bs.appendChild(x);}
  B('Dodaj',function(){var b=bags[sel]||{x:60,y:380,h:72,rz:0,rx:0,ry:0,p:500};bags.push(norm({x:b.x+16,y:b.y+33,h:b.h,rz:b.rz,rx:b.rx,ry:b.ry,p:b.p}));sel=bags.length-1;save();render();syncRows();});
  B('Duplikat',function(){if(!bags[sel])return;var b=bags[sel];bags.push(norm({x:b.x+12,y:b.y+12,h:b.h,rz:b.rz,rx:b.rx,ry:b.ry,p:b.p}));sel=bags.length-1;save();render();syncRows();});
  B('Obriši',function(){if(!bags[sel])return;bags.splice(sel,1);sel=Math.min(sel,bags.length-1);save();render();syncRows();});
  B('Kopiraj JSON',function(){var t=JSON.stringify(bags);try{navigator.clipboard.writeText(t);}catch(e){}window.prompt('JSON kesa (Ctrl+C):',t);});
  B('Izvezi fajl',function(){var d={version:1,tool:'cookster-wall-bags',exportedAt:new Date().toISOString(),image:{w:IMG_W,h:IMG_H,apexX:APEX},scene:{w:1672,h:941},bags:bags};
    var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(d,null,2)],{type:'application/json'}));a.download='cookster-wall-bags.json';document.body.appendChild(a);a.click();setTimeout(function(){a.remove();URL.revokeObjectURL(a.href);},500);});
  B('Resetuj',function(){bags=defaults();sel=0;save();render();syncRows();});
  B('Zatvori',function(){toggle(false);});
  document.body.appendChild(panel);
  btn=document.createElement('button');btn.id='wbBtn';btn.type='button';btn.textContent='🛍 Kese';btn.setAttribute('data-tool-ui','1');btn.onclick=function(){toggle(!open);};document.body.appendChild(btn);
  window.addEventListener('keydown',function(e){
    if(!open||sel<0||!bags[sel]||/INPUT|TEXTAREA/.test((e.target&&e.target.tagName)||''))return;
    var d=e.shiftKey?5:1,b=bags[sel],m=true;
    if(e.key==='ArrowLeft')b.x-=d;else if(e.key==='ArrowRight')b.x+=d;else if(e.key==='ArrowUp')b.y-=d;else if(e.key==='ArrowDown')b.y+=d;else m=false;
    if(m){e.preventDefault();paint(b,els[sel]);save();syncRows();}
  });
}
function toggle(v){
  open=!!v;buildPanel();panel.style.display=open?'block':'none';
  if(open&&sel<0&&bags.length)sel=0;
  render();syncRows();
}
function init(){bags=load();render();buildPanel();}
window.CooksterWallBags={get:function(){return bags;},render:render,open:function(){toggle(true);}};
if(document.readyState==='complete')init();else window.addEventListener('load',init);
})();
