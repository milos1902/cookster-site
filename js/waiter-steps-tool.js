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
  '#wsTool textarea{width:100%;height:90px;background:#140d08;color:#f3e3c2;border:1px solid #7a5428;border-radius:6px;font:11px monospace}';
  document.head.appendChild(css);
  var btn=document.createElement('button');btn.id='wsBtn';btn.type='button';btn.textContent='🦶 koraci konobara';room.appendChild(btn);
  ui.root=document.createElement('div');ui.root.id='wsTool';ui.root.setAttribute('data-tool-ui','');
  ui.root.innerHTML='<div class="side"><h2>Koraci konobara</h2>'+
    '<div class="help">1) Izaberi hod. 2) Listaj slike (strelice ← → ili klikni na traku ispod) dok ne nađeš sliku u kojoj noga dodiruje pod. 3) Klikni „Noga dodiruje pod“ i izaberi zvuk. U jednom hodu su obično dva koraka (leva i desna noga). „Pusti“ pokazuje animaciju sa zvukom, a ispod možeš da je usporiš.</div>'+
    '<div class="row" id="wsSets">'+SETS.map(function(s){return '<button class="b" data-set="'+s[0]+'">'+s[1]+'</button>'}).join('')+'</div>'+
    '<div class="row"><button class="b big" id="wsMark"></button></div>'+
    '<h2 style="margin-top:12px">Označeni koraci</h2><div id="wsList"></div>'+
    '<div class="row"><button class="b" id="wsReset">Vrati početne</button><button class="b" id="wsExport">Izvezi JSON</button><button class="b" id="wsImport">Uvezi JSON</button></div>'+
    '<div id="wsBox" style="display:none"><textarea id="wsText"></textarea><div class="row"><button class="b" id="wsDoImport">Primeni</button></div></div>'+
    '<div class="row" style="margin-top:12px"><button class="b" id="wsClose" style="width:100%">Zatvori alat</button></div></div>'+
    '<div class="main"><div class="stage"><canvas id="wsCv" width="900" height="640"></canvas></div>'+
    '<div class="bar"><button class="b" id="wsPrev">◀</button><button class="b" id="wsPlay">▶ Pusti</button><button class="b" id="wsNext">▶</button>'+
    '<label style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="wsSnd" checked> zvuk</label>'+
    '<label class="sl" style="flex:1;min-width:180px;margin:0">Brzina: <b id="wsFps"></b><input type="range" id="wsFpsR" min="4" max="40" step="1" value="24"></label></div>'+
    '<canvas id="wsStrip" width="1400" height="96"></canvas></div>';
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
    e.stopPropagation();var t=e.target&&e.target.tagName;if(t==='TEXTAREA'||t==='SELECT'||t==='INPUT'&&e.target.type==='text')return;
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
build();
})();
