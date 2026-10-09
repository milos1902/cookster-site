/* Alat „Koraci konobara" (posebno dugme u kafani).
   Za svaki hod konobara (ka kameri, od kamere, bočno) listaš slike hoda jednu po jednu, označiš sliku u kojoj noga dodiruje pod i izabereš zvuk koraka
   (i jačinu) za tu sliku. Možeš da pustiš animaciju sa zvukom i da je usporiš. Podaci: localStorage cookster.waiter-steps.v1 (isto čita scena u tavern-scene.js);
   Izvezi/Uvezi JSON. „Nasumičan korak" znači zvuk koji je izabran u alatu „Zvuk" (cilj Konobar → Koraci konobara). */
(function(){
'use strict';
var T=window.CooksterTavern,room=document.getElementById('tavernScene');
if(!T||!room||!T.waiterSteps||window.CooksterWaiterStepsTool)return;
window.CooksterWaiterStepsTool=true;
var WS=T.waiterSteps,SETS=[['walkd','Hod ka kameri'],['walku','Hod od kamere'],['walks','Bočni hod (udesno)']];
var set='walkd',frame=0,playing=false,fps=24,soundOn=true,imgs={},ui={},lastT=0,acc=0,sel=-1;
function n(){return WS.count(set)}
function list(){var d=WS.get();if(!d.sets[set])d.sets[set]=[];return d.sets[set]}
function save(){WS.set(WS.get())}
function img(s,i){var k=s+i;if(!imgs[k]){var im=new Image();im.onload=function(){if(ui.root&&ui.root.classList.contains('open'))paint()};im.src=WS.url(s,i+1);imgs[k]=im}return imgs[k]}
function sounds(){
  var o=[['','Nasumičan korak (alat „Zvuk“)']];
  for(var i=1;i<=WS.stepClips;i++)o.push(['waiterStep'+i,'Korak '+i+' (iz tvog snimka)']);
  try{Object.keys(importedAudio).forEach(function(id){var v=importedAudio[id];o.push(['custom:'+id,'Biblioteka: '+((v&&v.name)||id)])})}catch(e){}
  return o;
}
function mark(f){var l=list();for(var i=0;i<l.length;i++)if(l[i].f===f)return i;return -1}
function playEntry(e){WS.play(e)}
function setFrame(f,fromPlay){
  var N=n();f=((f%N)+N)%N;
  if(fromPlay&&soundOn){list().forEach(function(e){if(e.f===f)playEntry(e)})}
  frame=f;paint();refresh();
}
function paint(){
  var cv=ui.cv,g=ui.g;if(!cv)return;
  g.fillStyle='#2a2a2a';g.fillRect(0,0,cv.width,cv.height);
  var im=img(set,frame);
  // floor line
  g.strokeStyle='#555';g.beginPath();g.moveTo(0,cv.height-30);g.lineTo(cv.width,cv.height-30);g.stroke();
  if(im.complete&&im.naturalWidth){var s=(cv.height-30)/470;g.drawImage(im,(cv.width-640*s)/2,0,640*s,470*s)}
  var m=mark(frame)>=0;
  g.fillStyle=m?'#e8a53a':'#aaa';g.font='bold 20px system-ui';g.fillText('Slika '+(frame+1)+' / '+n()+(m?'   ● NOGA DODIRUJE POD':''),12,26);
  // the strip
  var st=ui.strip,sg=st.getContext('2d'),N=n(),w=st.width/N;
  sg.fillStyle='#111';sg.fillRect(0,0,st.width,st.height);
  for(var i=0;i<N;i++){
    var tm=img(set,i);
    if(tm.complete&&tm.naturalWidth)sg.drawImage(tm,i*w,0,w,st.height-16);
    if(mark(i)>=0){sg.fillStyle='#e8a53a';sg.fillRect(i*w,st.height-16,w-1,16);sg.fillStyle='#201409';sg.font='bold 11px system-ui';sg.fillText('●',i*w+w/2-4,st.height-4)}
    if(i===frame){sg.strokeStyle='#fff';sg.lineWidth=2;sg.strokeRect(i*w+1,1,w-3,st.height-3)}
  }
}
function refresh(){
  ui.root.querySelectorAll('[data-set]').forEach(function(b){b.classList.toggle('on',b.dataset.set===set)});
  ui.root.querySelector('#wsPlay').textContent=playing?'⏸ Stani':'▶ Pusti';
  ui.root.querySelector('#wsMark').textContent=mark(frame)>=0?'✖ Skini oznaku sa slike '+(frame+1):'● Noga dodiruje pod na slici '+(frame+1);
  ui.root.querySelector('#wsFps').textContent=fps+' slika u sekundi';
  var l=list().slice().sort(function(a,b){return a.f-b.f}),box=ui.root.querySelector('#wsList'),opts=sounds();
  box.innerHTML='';
  if(!l.length){box.innerHTML='<div class="help">Nijedan korak nije označen. Izaberi sliku u kojoj noga dodiruje pod i klikni „Noga dodiruje pod“.</div>'}
  l.forEach(function(e){
    var row=document.createElement('div');row.className='ent'+(e.f===frame?' cur':'');
    row.innerHTML='<div class="r1"><b>Slika '+(e.f+1)+'</b><button class="b" data-a="go">idi</button><button class="b" data-a="test">▶ čuj</button><button class="b" data-a="del">✖</button></div>'+
      '<select>'+opts.map(function(o){return '<option value="'+o[0]+'"'+(o[0]===(e.snd||'')?' selected':'')+'>'+o[1]+'</option>'}).join('')+'</select>'+
      '<label class="sl">Jačina <b>'+Math.round((e.vol==null?1:e.vol)*100)+'%</b><input type="range" min="0" max="1" step="0.01" value="'+(e.vol==null?1:e.vol)+'"></label>';
    row.querySelector('select').addEventListener('change',function(ev){e.snd=ev.target.value;save();playEntry(e)});
    row.querySelector('input').addEventListener('input',function(ev){e.vol=+ev.target.value;row.querySelector('label b').textContent=Math.round(e.vol*100)+'%';save()});
    row.querySelector('[data-a=go]').addEventListener('click',function(){playing=false;setFrame(e.f)});
    row.querySelector('[data-a=test]').addEventListener('click',function(){playEntry(e)});
    row.querySelector('[data-a=del]').addEventListener('click',function(){var L=list();L.splice(L.indexOf(e),1);save();paint();refresh()});
    box.appendChild(row);
  });
}
function loop(now){
  if(!ui.root.classList.contains('open')){playing=false;return}
  if(playing){
    if(!lastT)lastT=now;acc+=now-lastT;lastT=now;var step=1000/fps;
    while(acc>=step){acc-=step;setFrame(frame+1,true)}
    requestAnimationFrame(loop);
  }else lastT=0;
}
function play(on){playing=on;lastT=0;acc=0;refresh();if(on)requestAnimationFrame(loop)}
function build(){
  var css=document.createElement('style');
  css.textContent='#wsBtn{position:absolute;left:318px;bottom:14px;z-index:70;border:2px solid #351b0d;border-radius:9px;background:#e8c27a;color:#351b0d;font:700 14px/1 system-ui,sans-serif;padding:7px 14px;cursor:pointer;opacity:.85}#wsBtn:hover{opacity:1}'+
  '#wsTool{position:fixed;inset:0;z-index:2147483200;display:none;background:#140d08;color:#f3e3c2;font:13px/1.35 system-ui,sans-serif}#wsTool.open{display:flex}'+
  '#wsTool .side{width:330px;flex:none;overflow:auto;padding:44px 14px 12px;background:#201409;border-right:1px solid #5b3d1e}'+
  '#wsTool h2{margin:0 0 8px;font-size:16px}#wsTool select{width:100%;padding:5px;background:#2c1b0c;color:#f3e3c2;border:1px solid #7a5428;border-radius:6px;font:inherit}'+
  '#wsTool .row{display:flex;flex-wrap:wrap;gap:5px;margin:7px 0}#wsTool button.b{padding:6px 9px;border:1px solid #7a5428;border-radius:6px;background:#3a2410;color:#f3e3c2;cursor:pointer;font:inherit}#wsTool button.b.on{background:#e8a53a;color:#201409}#wsTool button.big{flex:1;font-weight:700}'+
  '#wsTool label.sl{display:block;margin:6px 0 2px;color:#d9c69c}#wsTool label.sl b{float:right;color:#f3e3c2}#wsTool label.sl input{width:100%}'+
  '#wsTool .help{margin:8px 0;padding:8px;border-radius:7px;background:#2c1b0c;color:#d9c69c}#wsTool .ent{margin:8px 0;padding:8px;border-radius:8px;background:#2c1b0c;border:1px solid #4a2f14}#wsTool .ent.cur{border-color:#e8a53a}'+
  '#wsTool .r1{display:flex;gap:5px;align-items:center;margin-bottom:5px}#wsTool .r1 b{flex:1}'+
  '#wsTool .main{flex:1;display:flex;flex-direction:column;background:#000;min-width:0}#wsTool .stage{flex:1;display:flex;align-items:center;justify-content:center;min-height:0}#wsTool canvas#wsCv{max-width:100%;max-height:100%}'+
  '#wsTool .bar{padding:8px 12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;background:#1a0f06}#wsTool canvas#wsStrip{width:100%;height:96px;cursor:pointer;display:block;background:#111}'+
  '#wsTool .main{position:relative}#wsCut{display:none;position:absolute;inset:0;overflow:auto;background:#140d08;padding:12px;z-index:3}#wsCut.open{display:block}'+
  '#wsCut .cutbar{display:flex;gap:10px;align-items:center;margin-bottom:8px}#wsCut .cutbar b{flex:1;font-size:16px}#wsWave{width:100%;height:190px;background:#0b0704;border:1px solid #4a2f14;display:block;touch-action:none;cursor:crosshair}'+
  '#wsSegs .seg{display:flex;gap:8px;align-items:center;margin:4px 0;padding:5px 8px;border-radius:7px;background:#2c1b0c;border:1px solid #4a2f14}#wsSegs .seg.sel{border-color:#e8a53a}#wsSegs .seg input[type=number]{width:74px;padding:3px;background:#140d08;color:#f3e3c2;border:1px solid #7a5428;border-radius:5px}'+
  '#wsTool textarea{width:100%;height:90px;background:#140d08;color:#f3e3c2;border:1px solid #7a5428;border-radius:6px;font:11px monospace}';
  document.head.appendChild(css);
  var btn=document.createElement('button');btn.id='wsBtn';btn.type='button';btn.textContent='🦶 koraci konobara';room.appendChild(btn);
  ui.root=document.createElement('div');ui.root.id='wsTool';ui.root.setAttribute('data-tool-ui','');
  ui.root.innerHTML='<div class="side"><h2>Koraci konobara</h2>'+
    '<div class="help">1) Izaberi hod. 2) Listaj slike (strelice ← → ili klikni na traku ispod) dok ne nađeš sliku u kojoj noga dodiruje pod. 3) Klikni „Noga dodiruje pod“ i izaberi zvuk. U jednom hodu su obično dva koraka (leva i desna noga). „Pusti“ pokazuje animaciju sa zvukom, a ispod možeš da je usporiš.</div>'+
    '<div class="row" id="wsSets">'+SETS.map(function(s){return '<button class="b" data-set="'+s[0]+'">'+s[1]+'</button>'}).join('')+'</div>'+
    '<div class="row"><button class="b big" id="wsMark"></button></div>'+
    '<h2 style="margin-top:12px">Označeni koraci</h2><div id="wsList"></div>'+
    '<div class="row"><button class="b big" id="wsCutOpen">✂ Iseci zvuk iz velikog audio fajla</button></div>'+
    '<div class="row"><button class="b" id="wsReset">Vrati početne</button><button class="b" id="wsExport">Izvezi JSON</button><button class="b" id="wsImport">Uvezi JSON</button></div>'+
    '<div id="wsBox" style="display:none"><textarea id="wsText"></textarea><div class="row"><button class="b" id="wsDoImport">Primeni</button></div></div>'+
    '<div class="row" style="margin-top:12px"><button class="b" id="wsClose" style="width:100%">Zatvori alat</button></div></div>'+
    '<div class="main"><div class="stage"><canvas id="wsCv" width="900" height="640"></canvas></div>'+
    '<div class="bar"><button class="b" id="wsPrev">◀</button><button class="b" id="wsPlay">▶ Pusti</button><button class="b" id="wsNext">▶</button>'+
    '<label style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="wsSnd" checked> zvuk</label>'+
    '<label class="sl" style="flex:1;min-width:180px;margin:0">Brzina: <b id="wsFps"></b><input type="range" id="wsFpsR" min="4" max="40" step="1" value="24"></label></div>'+
    '<canvas id="wsStrip" width="1400" height="96"></canvas>'+
    '<div id="wsCut"><div class="cutbar"><b>✂ Sečenje zvuka</b><input type="file" id="wsFile" accept="audio/*"><button class="b" id="wsCutClose">Nazad na slike</button></div>'+
    '<div class="help" id="wsCutHelp">Izaberi veliki audio fajl (na primer snimak hodanja). Klikni „Nađi korake automatski“, ili klikni na talas da dodaš isečak tu. Početak i kraj isečka vučeš mišem. Zatim „Dodaj u biblioteku“ — isečci se pojave u izboru zvuka za svaki korak (i u alatu „Zvuk“).</div>'+
    '<canvas id="wsWave" width="1400" height="190"></canvas>'+
    '<div class="bar"><label class="sl" style="flex:1;min-width:160px;margin:0">Zumiranje <b id="wsZv"></b><input type="range" id="wsZoom" min="1" max="40" step="0.5" value="1"></label>'+
    '<label class="sl" style="flex:1;min-width:160px;margin:0">Pomeranje <b></b><input type="range" id="wsScroll" min="0" max="1000" step="1" value="0"></label></div>'+
    '<div class="bar"><label class="sl" style="flex:1;min-width:160px;margin:0">Osetljivost <b id="wsSv"></b><input type="range" id="wsSens" min="1" max="30" step="1" value="6"></label>'+
    '<label class="sl" style="flex:1;min-width:160px;margin:0">Dužina isečka <b id="wsLv"></b><input type="range" id="wsLen" min="80" max="900" step="10" value="320"></label>'+
    '<button class="b" id="wsAuto">Nađi korake automatski</button><button class="b" id="wsClear">Obriši sve isečke</button></div>'+
    '<div id="wsSegs"></div>'+
    '<div class="bar"><button class="b" id="wsPlayAll">▶ Preslušaj sve redom</button><button class="b big" id="wsAddLib">Dodaj izabrane u biblioteku</button><span id="wsCutMsg" style="color:#e8a53a"></span></div></div></div>';
  document.body.appendChild(ui.root);
  ui.cv=ui.root.querySelector('#wsCv');ui.g=ui.cv.getContext('2d');ui.strip=ui.root.querySelector('#wsStrip');
  ui.root.querySelectorAll('[data-set]').forEach(function(b){b.addEventListener('click',function(){set=b.dataset.set;frame=0;play(false);paint();refresh()})});
  ui.root.querySelector('#wsMark').addEventListener('click',function(){var i=mark(frame);if(i>=0)list().splice(i,1);else list().push({f:frame,snd:'',vol:1});save();paint();refresh()});
  ui.root.querySelector('#wsPrev').addEventListener('click',function(){play(false);setFrame(frame-1)});
  ui.root.querySelector('#wsNext').addEventListener('click',function(){play(false);setFrame(frame+1)});
  ui.root.querySelector('#wsPlay').addEventListener('click',function(){play(!playing)});
  ui.root.querySelector('#wsSnd').addEventListener('change',function(e){soundOn=e.target.checked});
  ui.root.querySelector('#wsFpsR').addEventListener('input',function(e){fps=+e.target.value;refresh()});
  ui.strip.addEventListener('pointerdown',function(e){play(false);var r=ui.strip.getBoundingClientRect();setFrame(Math.floor((e.clientX-r.left)/r.width*n()))});
  ui.root.querySelector('#wsReset').addEventListener('click',function(){if(confirm('Vratiti početne korake za sva tri hoda?')){WS.reset();paint();refresh()}});
  ui.root.querySelector('#wsExport').addEventListener('click',function(){
    var txt=JSON.stringify(Object.assign({format:'cookster-waiter-steps',exportedAt:new Date().toISOString()},WS.get()),null,1),ta=ui.root.querySelector('#wsText');
    ui.root.querySelector('#wsBox').style.display='block';ta.value=txt;ta.focus();ta.select();
    try{var bl=new Blob([txt],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(bl);a.download='cookster_koraci_konobara.json';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},500)}catch(e){}
  });
  ui.root.querySelector('#wsImport').addEventListener('click',function(){var b=ui.root.querySelector('#wsBox');b.style.display=b.style.display==='none'?'block':'none'});
  ui.root.querySelector('#wsDoImport').addEventListener('click',function(){try{var o=JSON.parse(ui.root.querySelector('#wsText').value);if(!o.sets)throw 0;WS.set({sets:o.sets});paint();refresh()}catch(e){alert('JSON nije ispravan.')}});
  ui.root.querySelector('#wsClose').addEventListener('click',close);
  ui.root.addEventListener('keydown',function(e){
    e.stopPropagation();var t=e.target&&e.target.tagName;if(t==='TEXTAREA'||t==='SELECT'||(t==='INPUT'&&e.target.type!=='range'&&e.target.type!=='checkbox'))return;
    if(e.key==='ArrowRight'){play(false);setFrame(frame+1);e.preventDefault()}
    else if(e.key==='ArrowLeft'){play(false);setFrame(frame-1);e.preventDefault()}
    else if(e.key===' '){play(!playing);e.preventDefault()}
    else if(e.key==='Enter'||e.key.toLowerCase()==='m'){ui.root.querySelector('#wsMark').click();e.preventDefault()}
    else if(e.key==='Escape')close();
  });
  ['keyup','keypress'].forEach(function(nm){ui.root.addEventListener(nm,function(e){e.stopPropagation()})});
  ['pointerdown','pointerup','mousedown','mouseup','click','wheel','contextmenu'].forEach(function(nm){ui.root.addEventListener(nm,function(e){e.stopPropagation()})});
  btn.addEventListener('click',function(e){e.stopPropagation();open()});
}
function open(){ui.root.classList.add('open');ui.root.tabIndex=-1;ui.root.focus();paint();refresh()}
function close(){play(false);ui.root.classList.remove('open')}

// ---------- sečenje zvuka: od jednog velikog audio fajla do pojedinačnih koraka ----------
var cut={buf:null,name:'',segs:[],sel:-1,zoom:1,off:0,drag:null,src:null,ctx:null};
function cutEl(id){return ui.root.querySelector(id)}
function msg(t){cutEl('#wsCutMsg').textContent=t;clearTimeout(msg.t);msg.t=setTimeout(function(){cutEl('#wsCutMsg').textContent=''},3500)}
function actx(){if(!cut.ctx){var C=window.AudioContext||window.webkitAudioContext;cut.ctx=new C()}return cut.ctx}
function dur(){return cut.buf?cut.buf.duration:1}
function viewSpan(){return dur()/cut.zoom}
function t2x(t){var cv=cutEl('#wsWave');return (t-cut.off)/viewSpan()*cv.width}
function x2t(x){var cv=cutEl('#wsWave');return cut.off+x/cv.width*viewSpan()}
function chan(){var b=cut.buf,n=b.length,o=new Float32Array(n),c=b.numberOfChannels,i,k;for(k=0;k<c;k++){var d=b.getChannelData(k);for(i=0;i<n;i++)o[i]+=d[i]/c}return o}
function drawWave(){
  var cv=cutEl('#wsWave'),g=cv.getContext('2d');g.fillStyle='#0b0704';g.fillRect(0,0,cv.width,cv.height);
  if(!cut.buf){g.fillStyle='#aaa';g.font='16px system-ui';g.fillText('Izaberi audio fajl…',20,cv.height/2);return}
  var d=cut.mono||(cut.mono=chan()),sr=cut.buf.sampleRate,mid=cv.height/2;
  g.strokeStyle='#e8a53a';g.beginPath();
  for(var x=0;x<cv.width;x++){
    var a=Math.floor(x2t(x)*sr),b=Math.floor(x2t(x+1)*sr),mx=0;if(b<=a)b=a+1;var st=Math.max(1,Math.floor((b-a)/40));
    for(var i=a;i<b&&i<d.length;i+=st){var v=Math.abs(d[i]);if(v>mx)mx=v}
    g.moveTo(x,mid-mx*mid*.95);g.lineTo(x,mid+mx*mid*.95);
  }
  g.stroke();
  cut.segs.forEach(function(s,i){
    var x0=t2x(s.t),x1=t2x(s.t+s.len);
    g.fillStyle=i===cut.sel?'rgba(232,165,58,.38)':'rgba(90,160,255,.30)';g.fillRect(x0,0,x1-x0,cv.height);
    g.fillStyle=i===cut.sel?'#ffd27a':'#7fb2ff';g.fillRect(x0-1,0,3,cv.height);g.fillRect(x1-1,0,3,cv.height);
    g.fillStyle='#fff';g.font='bold 13px system-ui';g.fillText(String(i+1),x0+4,16);
  });
  g.fillStyle='#888';g.font='11px system-ui';g.fillText((cut.off).toFixed(2)+' s',4,cv.height-4);g.fillText((cut.off+viewSpan()).toFixed(2)+' s',cv.width-60,cv.height-4);
}
function segList(){
  var box=cutEl('#wsSegs');box.innerHTML='';
  cut.segs.sort(function(a,b){return a.t-b.t});
  cut.segs.forEach(function(s,i){
    var row=document.createElement('div');row.className='seg'+(i===cut.sel?' sel':'');
    row.innerHTML='<b style="width:22px">'+(i+1)+'</b><label>početak (s) <input type="number" step="0.01" min="0" value="'+s.t.toFixed(3)+'"></label><label>dužina (ms) <input type="number" step="10" min="30" value="'+Math.round(s.len*1000)+'"></label>'+
      '<button class="b" data-a="p">▶</button><label><input type="checkbox" '+(s.use===false?'':'checked')+'> uzmi</label><button class="b" data-a="d">✖</button>';
    var inp=row.querySelectorAll('input');
    inp[0].addEventListener('change',function(){s.t=Math.max(0,Math.min(dur()-.03,+inp[0].value));drawWave()});
    inp[1].addEventListener('change',function(){s.len=Math.max(.03,Math.min(dur()-s.t,(+inp[1].value)/1000));drawWave()});
    inp[2].addEventListener('change',function(){s.use=inp[2].checked});
    row.querySelector('[data-a=p]').addEventListener('click',function(){cut.sel=i;previewSeg(s);drawWave();segList()});
    row.querySelector('[data-a=d]').addEventListener('click',function(){cut.segs.splice(i,1);cut.sel=-1;drawWave();segList()});
    row.addEventListener('click',function(ev){if(ev.target.tagName==='BUTTON'||ev.target.tagName==='INPUT')return;cut.sel=i;drawWave();segList()});
    box.appendChild(row);
  });
}
// the piece as samples: a very short fade in (no click), a longer fade out, the loudest spot brought to the same level
function segSamples(s){
  var d=cut.mono||(cut.mono=chan()),sr=cut.buf.sampleRate,a=Math.floor(s.t*sr),n=Math.min(d.length-a,Math.floor(s.len*sr)),o=new Float32Array(Math.max(1,n)),pk=0.0001,i;
  for(i=0;i<n;i++){o[i]=d[a+i];if(Math.abs(o[i])>pk)pk=Math.abs(o[i])}
  var fi=Math.floor(sr*.004),fo=Math.min(n,Math.floor(sr*.06));
  for(i=0;i<n;i++){var gnn=.9/pk;if(i<fi)gnn*=i/fi;if(i>n-fo)gnn*=(n-i)/fo;o[i]*=gnn}
  return o;
}
function previewSeg(s){
  try{
    var c=actx();if(c.state==='suspended')c.resume();if(cut.src){try{cut.src.stop()}catch(e){}}
    var smp=segSamples(s),b=c.createBuffer(1,smp.length,cut.buf.sampleRate);b.copyToChannel(smp,0);
    var so=c.createBufferSource();so.buffer=b;so.connect(c.destination);so.start();cut.src=so;
  }catch(e){}
}
function wavUrl(smp,sr){
  var n=smp.length,buf=new ArrayBuffer(44+n*2),v=new DataView(buf),i;
  function w(o,t){for(var k=0;k<t.length;k++)v.setUint8(o+k,t.charCodeAt(k))}
  w(0,'RIFF');v.setUint32(4,36+n*2,true);w(8,'WAVEfmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,sr,true);v.setUint32(28,sr*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);w(36,'data');v.setUint32(40,n*2,true);
  for(i=0;i<n;i++)v.setInt16(44+i*2,Math.max(-1,Math.min(1,smp[i]))*32000,true);
  var bytes=new Uint8Array(buf),bin='',ch=0x8000;for(i=0;i<bytes.length;i+=ch)bin+=String.fromCharCode.apply(null,bytes.subarray(i,i+ch));
  return 'data:audio/wav;base64,'+btoa(bin);
}
function autoFind(){
  if(!cut.buf)return;
  var d=cut.mono||(cut.mono=chan()),sr=cut.buf.sampleRate,win=Math.floor(sr*.005),env=[],i,m=0;
  for(i=0;i<d.length;i+=win){var mx=0;for(var k=i;k<i+win&&k<d.length;k++){var v=Math.abs(d[k]);if(v>mx)mx=v}env.push(mx);if(mx>m)m=mx}
  var th=(+cutEl('#wsSens').value)/100,len=(+cutEl('#wsLen').value)/1000,last=-1000,ons=[];
  for(i=8;i<env.length;i++){
    var prev=0;for(var j=1;j<=8;j++)prev+=env[i-j];prev=prev/8+1e-6;
    if(env[i]>prev*3&&env[i]>m*th&&i-last>40){ons.push(i*.005);last=i}
  }
  cut.segs=ons.map(function(t,k){var nx=ons[k+1],l=Math.min(len,(nx!=null?nx-t-.01:len));return{t:Math.max(0,t-.02),len:Math.max(.05,l+.02),use:true}});
  cut.sel=-1;drawWave();segList();msg('Nađeno '+cut.segs.length+' udaraca. Proveri ih (▶) i obriši one koji nisu koraci.');
}
async function addLib(){
  var use=cut.segs.filter(function(s){return s.use!==false});if(!use.length){msg('Nema izabranih isečaka.');return}
  var base=(cut.name||'zvuk').replace(/\.[^.]+$/,'').slice(0,24),added=[];
  use.forEach(function(s,i){
    var id='snd_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,6)+i;
    importedAudio[id]={name:'Korak '+base+' '+(i+1),src:wavUrl(segSamples(s),cut.buf.sampleRate)};added.push(id);
  });
  var ok=await persistAudioLibrary();
  if(!ok){added.forEach(function(id){delete importedAudio[id]});msg('Nema mesta u pregledaču.');return}
  msg('Dodato '+added.length+' zvukova u biblioteku. Biraš ih u listi zvukova za svaki korak.');refresh();
}
async function loadFile(f){
  if(!f)return;
  try{
    var ab=await f.arrayBuffer();cut.buf=await actx().decodeAudioData(ab);cut.name=f.name;cut.mono=null;cut.segs=[];cut.sel=-1;cut.zoom=1;cut.off=0;
    cutEl('#wsZoom').value=1;cutEl('#wsScroll').value=0;drawWave();segList();msg(f.name+': '+cut.buf.duration.toFixed(1)+' s');autoFind();
  }catch(e){msg('Ne mogu da otvorim taj fajl.')}
}
function setupCut(){
  cutEl('#wsCutOpen').addEventListener('click',function(){cutEl('#wsCut').classList.add('open');play(false);drawWave()});
  cutEl('#wsCutClose').addEventListener('click',function(){cutEl('#wsCut').classList.remove('open');refresh()});
  cutEl('#wsFile').addEventListener('change',function(e){loadFile(e.target.files[0])});
  cutEl('#wsAuto').addEventListener('click',autoFind);
  cutEl('#wsClear').addEventListener('click',function(){cut.segs=[];cut.sel=-1;drawWave();segList()});
  cutEl('#wsAddLib').addEventListener('click',addLib);
  cutEl('#wsPlayAll').addEventListener('click',function(){cut.segs.slice().sort(function(a,b){return a.t-b.t}).forEach(function(s,i){setTimeout(function(){previewSeg(s)},i*650)})});
  function lbl(){cutEl('#wsSv').textContent=cutEl('#wsSens').value+'%';cutEl('#wsLv').textContent=cutEl('#wsLen').value+' ms';cutEl('#wsZv').textContent=cut.zoom+'×'}
  ['#wsSens','#wsLen'].forEach(function(id){cutEl(id).addEventListener('input',lbl)});lbl();
  cutEl('#wsZoom').addEventListener('input',function(e){cut.zoom=+e.target.value;cut.off=Math.min(cut.off,Math.max(0,dur()-viewSpan()));lbl();drawWave()});
  cutEl('#wsScroll').addEventListener('input',function(e){cut.off=(+e.target.value/1000)*Math.max(0,dur()-viewSpan());drawWave()});
  var wv=cutEl('#wsWave');
  wv.addEventListener('pointerdown',function(e){
    if(!cut.buf)return;wv.setPointerCapture(e.pointerId);
    var r=wv.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*wv.width,t=x2t(x),hit=-1,edge=0;
    cut.segs.forEach(function(s,i){var a=t2x(s.t),b=t2x(s.t+s.len);if(Math.abs(x-a)<10){hit=i;edge=-1}else if(Math.abs(x-b)<10){hit=i;edge=1}else if(hit<0&&x>a&&x<b){hit=i;edge=0}});
    if(hit>=0){cut.sel=hit;cut.drag={i:hit,edge:edge,t0:t,s0:cut.segs[hit].t,l0:cut.segs[hit].len};if(edge===0)previewSeg(cut.segs[hit])}
    else{cut.segs.push({t:Math.max(0,t-.02),len:Math.min((+cutEl('#wsLen').value)/1000,dur()-t),use:true});cut.sel=cut.segs.length-1;cut.drag=null;previewSeg(cut.segs[cut.sel]);segList()}
    drawWave();
  });
  wv.addEventListener('pointermove',function(e){
    var d=cut.drag;if(!d)return;var r=wv.getBoundingClientRect(),t=x2t((e.clientX-r.left)/r.width*wv.width),s=cut.segs[d.i];if(!s)return;
    if(d.edge===-1){var end=d.s0+d.l0;s.t=Math.max(0,Math.min(end-.03,t));s.len=end-s.t}
    else if(d.edge===1){s.len=Math.max(.03,Math.min(dur()-s.t,t-s.t))}
    else{s.t=Math.max(0,Math.min(dur()-s.len,d.s0+(t-d.t0)))}
    drawWave();
  });
  wv.addEventListener('pointerup',function(){if(cut.drag){cut.drag=null;segList()}});
  ui.root.addEventListener('dragover',function(e){e.preventDefault()});
  ui.root.addEventListener('drop',function(e){e.preventDefault();var f=e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files[0];if(f){cutEl('#wsCut').classList.add('open');loadFile(f)}});
}
build();setupCut();
})();
