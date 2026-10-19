/* Cookster: the tool "Grom" (the thunder). The player sees the sound of the thunder as a picture (the waveform) and puts the flashes of the lightning on it himself:
   a click on the picture = a new flash; drag left / right = when it flashes; drag up / down (or the slider) = how strong (small flash ... big flash); double click or the button = delete.
   "Pusti" plays the sound and flashes at the chosen places (the same as in the game). The flashes are kept for every sound (localStorage); the game (js/weather.js) uses them. */
(function(){
if(window.CooksterThunderTool)return;
var libSel=null,KEY='cookster.thunder.v1',DB={},cur=null,sel=-1,wv=null,W=720,H=150,panel=null,cv=null,cx=null,sl=null,info=null,selEl=null,playing=null,drag=null;
try{DB=JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch(e){DB={};}
function save(){try{localStorage.setItem(KEY,JSON.stringify(DB));}catch(e){}}
function list(){try{return CooksterSound.thunderList();}catch(e){return [];}}
function marks(){return cur&&DB[cur.src]?DB[cur.src]:null;}
function ensure(){if(!cur)return null;if(!DB[cur.src])DB[cur.src]=[];return DB[cur.src];}
function tx(t){return 10+(W-20)*t/(wv?wv.dur:1);}
function xt(x){return Math.max(0,Math.min(wv?wv.dur:1,(x-10)/(W-20)*(wv?wv.dur:1)));}
function draw(ph){
  if(!cx)return;cx.clearRect(0,0,W,H);cx.fillStyle='#1c120a';cx.fillRect(0,0,W,H);
  if(wv){cx.fillStyle='#8e6a3a';var n=wv.peaks.length;for(var i=0;i<n;i++){var h=Math.max(1,wv.peaks[i]*(H-30)),x=10+(W-20)*i/n;cx.fillRect(x,H/2-h/2,Math.max(1,(W-20)/n),h);}
    cx.fillStyle='#d9c08e';cx.font='11px system-ui';for(var s=0;s<=wv.dur;s+=.5){var X=tx(s);cx.fillRect(X,H-12,1,s%1===0?8:4);if(s%1===0)cx.fillText(s+'s',X+2,H-14);}}
  var m=marks()||[];
  m.forEach(function(p,i){var x=tx(p.t),h=14+(H-40)*p.a;cx.strokeStyle=i===sel?'#fff':'#9fd0ff';cx.lineWidth=i===sel?3:2;cx.beginPath();cx.moveTo(x,8);cx.lineTo(x,8+h);cx.stroke();
    cx.fillStyle=i===sel?'#fff':'#9fd0ff';cx.beginPath();cx.arc(x,8+h,5+4*p.a,0,6.283);cx.fill();cx.fillStyle='#fff';cx.font='10px system-ui';cx.fillText(Math.round(p.a*100)+'%',x+7,14);});
  if(ph!=null){var X=tx(ph);cx.strokeStyle='#ff7a3a';cx.lineWidth=1;cx.beginPath();cx.moveTo(X,0);cx.lineTo(X,H);cx.stroke();}
  if(info){var u=m.length;info.textContent=cur?(u?u+' bljeskova. Klik = novi bljesak, prevuci = pomeri / jačina, dvoklik = obriši.':(DB[cur.src]?'Nema bljeskova (u igri neće biti bljeska). Klikni na sliku da dodaš.':'Još nisi postavio bljeskove: igra sama bira najglasnija mesta. Klikni da postaviš svoje, ili „Predloži iz zvuka“.')):'Nema zvuka za grom: ubaci ga u alatu Zvuk (Ambijent napolju → Napolje: grom).';}
  if(sl){sl.disabled=sel<0||!marks();if(sel>=0&&marks()&&marks()[sel])sl.value=marks()[sel].a;}
}
function pick(){var x=event;}
function load(src){wv=null;draw();CooksterWeather.wave(src,W-20).then(function(w){wv=w;draw();});}
function setCur(i){var l=list();cur=l[i]||null;sel=-1;if(cur)load(cur.src);else{wv=null;draw();}}
function build(){
  if(panel)return;
  panel=document.createElement('div');panel.id='thPanel';panel.setAttribute('data-tool-ui','1');
  panel.style.cssText='position:fixed;left:50%;bottom:70px;transform:translateX(-50%);z-index:2147483600;width:'+(W+28)+'px;background:rgba(36,22,10,.96);border:2px solid #351b0d;border-radius:12px;padding:10px 14px;color:#f3e3c2;font:12px/1.35 system-ui,sans-serif;display:none;box-shadow:0 10px 40px rgba(0,0,0,.6)';
  panel.innerHTML='<b style="font-size:14px">⚡ Grom — gde će da bljesne</b> <span id="thClose" style="float:right;cursor:pointer;font-size:16px">✕</span><div style="margin:6px 0 4px">Zvuk: <select id="thSel" style="background:#2a1a0e;color:#f3e3c2;border:1px solid #6a4a22;border-radius:6px;padding:2px 6px"></select></div>';
  cv=document.createElement('canvas');cv.width=W;cv.height=H;cv.style.cssText='display:block;width:'+W+'px;height:'+H+'px;border-radius:8px;cursor:crosshair;touch-action:none';panel.appendChild(cv);cx=cv.getContext('2d');
  var lib=document.createElement('div');lib.style.cssText='display:flex;gap:6px;align-items:center;margin:6px 0 2px;flex-wrap:wrap';panel.insertBefore(lib,cv);
  function lbtn(t,fn){var b=document.createElement('button');b.type='button';b.textContent=t;b.style.cssText='background:#4a3a1e;color:#fff1cf;border:1px solid #351b0d;border-radius:8px;padding:4px 9px;cursor:pointer;font:700 11px system-ui';b.addEventListener('click',fn);lib.appendChild(b);return b;}
  lbtn('⬇ Uvezi zvukove za nevreme iz alata Zvuk',function(){var s=[];try{s=CooksterSound.stormSounds();}catch(e){}var n=0;s.forEach(function(k){if(CooksterSound.addThunder(k))n++;});fill();setCur(0);msg(s.length?('Uvezeno: '+s.length+' zvuk(ova).'):'U alatu Zvuk (Ambijent napolju → Napolje: nevreme) nema zvukova.');});
  libSel=document.createElement('select');libSel.style.cssText='background:#2a1a0e;color:#f3e3c2;border:1px solid #6a4a22;border-radius:6px;padding:2px 6px;max-width:220px';lib.appendChild(libSel);
  lbtn('+ Dodaj iz biblioteke',function(){var k=libSel.value;if(k&&CooksterSound.addThunder(k)){fill();setCur(Math.max(0,list().findIndex(function(x){return x.key===k;})));msg('Dodat zvuk.');}});
  lbtn('− Ukloni ovaj zvuk iz groma',function(){if(cur&&CooksterSound.removeThunder(cur.key)){fill();setCur(0);msg('Uklonjen iz groma.');}});
  var row=document.createElement('div');row.style.cssText='display:flex;gap:6px;align-items:center;margin-top:8px;flex-wrap:wrap';panel.appendChild(row);
  function btn(t,fn){var b=document.createElement('button');b.type='button';b.textContent=t;b.style.cssText='background:#6a4a22;color:#fff1cf;border:1px solid #351b0d;border-radius:8px;padding:5px 10px;cursor:pointer;font:700 12px system-ui';b.addEventListener('click',fn);row.appendChild(b);return b;}
  btn('▶ Pusti zvuk i bljesak',play);btn('■ Stop',stop);btn('⚡ Probni bljesak',function(){if(sel>=0&&marks())CooksterWeather.flash(marks()[sel].a);else CooksterWeather.flash(.7);});
  btn('Predloži iz zvuka',function(){if(!cur)return;CooksterWeather.autoPeaks(cur.src).then(function(p){DB[cur.src]=p.map(function(q){return {t:+q.t.toFixed(3),a:+q.a.toFixed(2)};});save();sel=-1;draw();});});
  btn('Obriši izabrani',function(){var m=marks();if(m&&sel>=0){m.splice(sel,1);sel=-1;save();draw();}});
  btn('Obriši sve',function(){if(cur){DB[cur.src]=[];sel=-1;save();draw();}});
  btn('Vrati na automatski',function(){if(cur){delete DB[cur.src];sel=-1;save();draw();}});
  var r2=document.createElement('div');r2.style.cssText='margin-top:8px;display:flex;gap:8px;align-items:center';panel.appendChild(r2);
  r2.appendChild(document.createTextNode('Jačina izabranog bljeska (mali ← → veliki):'));
  sl=document.createElement('input');sl.type='range';sl.min=0;sl.max=1;sl.step=.01;sl.style.cssText='flex:1';sl.disabled=true;r2.appendChild(sl);
  sl.addEventListener('input',function(){var m=marks();if(m&&sel>=0&&m[sel]){m[sel].a=+sl.value;save();draw();}});
  info=document.createElement('div');info.style.cssText='margin-top:6px;opacity:.85';panel.appendChild(info);
  document.body.appendChild(panel);
  panel.querySelector('#thClose').addEventListener('click',function(){show(false);});
  selEl=panel.querySelector('#thSel');selEl.addEventListener('change',function(){stop();setCur(+selEl.value);});
  function pos(e){var r=cv.getBoundingClientRect();return {x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height};}
  function hit(p){var m=marks()||[],best=-1,bd=14;m.forEach(function(q,i){var d=Math.abs(tx(q.t)-p.x);if(d<bd){bd=d;best=i;}});return best;}
  cv.addEventListener('pointerdown',function(e){if(!cur||!wv)return;var p=pos(e),i=hit(p);try{cv.setPointerCapture(e.pointerId);}catch(x){}
    if(i<0){var m=ensure();m.push({t:+xt(p.x).toFixed(3),a:+(Math.max(.05,Math.min(1,(H-p.y)/(H-30)))).toFixed(2)});m.sort(function(a,b){return a.t-b.t;});i=m.findIndex(function(q){return Math.abs(tx(q.t)-p.x)<2;});}
    sel=i;drag=i>=0;save();draw();});
  cv.addEventListener('pointermove',function(e){if(!drag||sel<0)return;var m=marks(),p=pos(e),q=m[sel];if(!q)return;q.t=+xt(p.x).toFixed(3);q.a=+(Math.max(.05,Math.min(1,1-(p.y-8-14)/(H-40)))).toFixed(2);draw();});
  cv.addEventListener('pointerup',function(){if(drag){drag=false;var m=marks();if(m){var q=m[sel];m.sort(function(a,b){return a.t-b.t;});sel=m.indexOf(q);}save();draw();}});
  cv.addEventListener('dblclick',function(e){var p=pos(e),i=hit(p),m=marks();if(m&&i>=0){m.splice(i,1);sel=-1;save();draw();}});
}
function play(){
  stop();if(!cur)return;var m=(marks()||[]).slice().sort(function(a,b){return a.t-b.t;});if(!DB[cur.src]){}
  var a=new Audio(cur.src);a.volume=cur.vol;var done={},t0=null;playing=a;a.play().catch(function(){});
  (function loop(){if(playing!==a)return;var t=a.currentTime;draw(t);
    m.forEach(function(p,i){if(!done[i]&&t>=p.t-.02){done[i]=1;CooksterWeather.flash(p.a);}});
    if(!a.ended)requestAnimationFrame(loop);else{playing=null;draw();}})();
}
function stop(){if(playing){try{playing.pause();}catch(e){}playing=null;}draw();}
function msg(s){if(info){info.textContent=s;setTimeout(function(){draw();},2500);}}
function fill(){if(libSel&&!libSel.options.length){try{CooksterSound.soundLibrary().forEach(function(x){var o=document.createElement('option');o.value=x.key;o.textContent=x.name+(x.custom?' ✦':'');libSel.appendChild(o);});}catch(e){}}var l=list();selEl.innerHTML='';l.forEach(function(x,i){var o=document.createElement('option');o.value=i;o.textContent=CooksterSound.soundName(x.key);selEl.appendChild(o);});if(!l.length){var o=document.createElement('option');o.textContent='(nema zvuka)';selEl.appendChild(o);}}
function show(v){build();panel.style.display=v?'block':'none';if(v){fill();setCur(0);}else stop();}
var btnOpen=null;
function mkBtn(){if(btnOpen||!document.body)return;btnOpen=document.createElement('button');btnOpen.type='button';btnOpen.id='thBtn';btnOpen.setAttribute('data-tool-ui','1');btnOpen.textContent='⚡ Grom';
  btnOpen.style.cssText='position:fixed;right:12px;bottom:172px;z-index:2147483500;border:2px solid #351b0d;border-radius:12px;background:#f1d9a0;color:#351b0d;font:700 12px/1 system-ui,sans-serif;padding:8px 12px;cursor:pointer';
  btnOpen.addEventListener('click',function(){build();show(panel.style.display==='none');});document.body.appendChild(btnOpen);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mkBtn);else mkBtn();
window.CooksterThunderTool={get:function(src){return DB[src]||null;},show:show,all:function(){return DB;}};
})();
