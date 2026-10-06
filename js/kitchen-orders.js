/* Cookster - the orders in the kitchen.
   When the waiter has taken an order in the tavern, he walks to the kitchen: the next time the kitchen is on the screen he walks in from the left,
   leaves a little paper on the table (the number of the table and what was ordered) and walks out again. A click on the paper opens it big.
   The papers are saved in the browser (cookster.kitchen-orders.v1), so they are there after a reload.
   The picture of the paper: assets/ui/order_note.webp (if it is missing, a plain paper drawn with CSS is used). */
(function(){
'use strict';
var scene=document.getElementById('scene');
if(!scene||window.CooksterOrders)return;
var W=1672,H=941,KEY='cookster.kitchen-orders.v1',WAITER='assets/tavern/waiter/waiter_walks',NOTE_IMG='assets/ui/order_note.webp?v=2';
var ITEM={name:'Kiseli kupus',extra:'ulje, tucana paprika',cyr:'Кисели купус',cyrExtra:'уље, туцана паприка'};           // the only dish for now
var TRIP_MS=3500;                                                      // how long the waiter needs from the tavern to the kitchen
var FLOOR_Y=585,STOP_X=281,SPEED=250,STAGE=120;                         // where he walks in the kitchen (scene pixels), how fast, the length of a step
var pending=[],notes=[],anim=null,uid=0,imgs=[];

function save(){try{localStorage.setItem(KEY,JSON.stringify({pending:pending,notes:notes,uid:uid}))}catch(_){}}
function load(){
  try{
    var o=JSON.parse(localStorage.getItem(KEY)||'null');
    if(o&&Array.isArray(o.pending)&&Array.isArray(o.notes)){
      pending=o.pending.filter(function(p){return p&&isFinite(p.id)&&isFinite(p.table)});
      notes=o.notes.filter(function(n){return n&&isFinite(n.id)&&isFinite(n.table)&&isFinite(n.x)&&isFinite(n.y)});
      uid=isFinite(o.uid)?o.uid:Math.max(0,pending.concat(notes).reduce(function(m,n){return Math.max(m,n.id)},0));
    }
  }catch(_){}
}
function mk(tag,cls){var e=document.createElement(tag);if(cls)e.className=cls;return e}

// ---------- looks ----------
var css=document.createElement('style');
css.textContent=
'#kitchenWaiter{position:absolute;left:0;top:0;width:'+W+'px;height:'+H+'px;pointer-events:none;z-index:46}'+
'.ko-note{position:absolute;height:var(--h,200px);aspect-ratio:820/1478;z-index:3000;cursor:pointer;color:#17275c;font:700 calc(var(--h,200px)*.03)/1 "Segoe Print","Bradley Hand","Comic Sans MS",cursive;'+
  'background:url('+NOTE_IMG+') center/100% 100% no-repeat,linear-gradient(160deg,#f6e7c4,#e8cf9b);filter:drop-shadow(0 5px 7px rgba(40,20,5,.5));transition:transform .15s}'+
'.ko-note:hover{transform:scale(1.07) rotate(var(--r,0deg))}'+
// the handwriting goes into the rows of the table printed on the paper (row 1 and 2: the number of the table, the dish, the amount)
'.ko-c{position:absolute;white-space:nowrap;transform:translateY(-50%)}'+
'.ko-c.c1{left:5.1%;width:13.3%;text-align:center;top:39.6%;font-size:.86em}'+
'.ko-c.c2{left:20%;width:56%;text-align:left;top:39.6%}'+
'.ko-c.c3{left:77.7%;width:17%;text-align:center;top:39.6%}'+
'.ko-c.r2{top:44.1%;font-size:.82em;font-weight:600}'+
'.ko-ghost{position:fixed!important;z-index:2147483000;pointer-events:none;transition:none!important;filter:drop-shadow(0 10px 12px rgba(30,15,5,.55))}'+
'.ko-ghost.ko-ready{filter:drop-shadow(0 0 10px #ffd84d) drop-shadow(0 10px 12px rgba(30,15,5,.55))}'+
'.ko-drop{animation:koDrop .45s cubic-bezier(.3,.7,.3,1) both}'+
'@keyframes koDrop{from{opacity:0;translate:0 -70px}to{opacity:1;translate:0 0}}'+
'.ko-modal{position:fixed;inset:0;z-index:2147483000;background:rgba(10,5,2,.62);display:flex;align-items:center;justify-content:center;cursor:pointer}'+
'.ko-modal .ko-note{position:relative;--h:min(82vh,760px);--r:-1.5deg;cursor:default;transition:none;transform:rotate(-1.5deg)}'+
'.ko-modal .ko-note:hover{transform:rotate(-1.5deg)}'+
'.ko-done{position:absolute;left:50%;bottom:-54px;transform:translateX(-50%);padding:9px 18px;border:2px solid #351b0d;border-radius:9px;background:#e8c27a;color:#351b0d;font:700 15px system-ui,sans-serif;cursor:pointer;white-space:nowrap}';
document.head.appendChild(css);
var cv=mk('canvas');cv.id='kitchenWaiter';cv.width=W;cv.height=H;scene.appendChild(cv);
var X=cv.getContext('2d');
for(var i=1;i<=3;i++){var im=new Image();im.src=WAITER+i+'.webp?v=4';imgs[i]=im}
var foodImg=new Image();foodImg.src='assets/tavern/waiter/waiter_foods2.webp';

// stop the clicks on a paper from reaching the game
['pointerdown','pointerup','mousedown','mouseup','click','dblclick','contextmenu','touchstart','wheel'].forEach(function(n){
  scene.addEventListener(n,function(e){if(e.target&&e.target.closest&&e.target.closest('.ko-note'))e.stopPropagation()},false);
});

function noteEl(n,big){
  var d=mk('div','ko-note');d.dataset.id=n.id;
  d.innerHTML='<span class="ko-c c1">Сто '+n.table+'</span><span class="ko-c c2">'+ITEM.cyr+'</span><span class="ko-c c3">1</span><span class="ko-c c2 r2">'+ITEM.cyrExtra+'</span>';
  d.style.setProperty('--h',big?'':'130px');
  if(!big){d.style.left=n.x+'px';d.style.top=n.y+'px';d.style.transform='rotate('+n.rot+'deg)';d.style.setProperty('--r',n.rot+'deg')}
  return d;
}
function placeNote(n,drop){
  var d=noteEl(n,false);if(drop)d.classList.add('ko-drop');
  d.addEventListener('animationend',function(){d.classList.remove('ko-drop')});
  d.addEventListener('pointerdown',function(e){if(e.button===0)startNoteDrag(e,n,d)});
  scene.appendChild(d);
}
// A paper is taken with the mouse: a short click opens it, dragging carries it. Let it go over the spike and it is hung on it, anywhere else it stays where it is let go.
function spikeAt(x,y){
  var list=window.items||[];
  for(var i=0;i<list.length;i++){
    var el=list[i];if(!el||!el.dataset||el.dataset.itemId!==SPIKE_ID)continue;
    var r=el.getBoundingClientRect(),px=r.width*.25;
    if(x>=r.left-px&&x<=r.right+px&&y>=r.top&&y<=r.bottom+r.height*.05)return el;
  }
  return null;
}
function startNoteDrag(e,n,d){
  e.preventDefault();e.stopPropagation();
  var sx=e.clientX,sy=e.clientY,moved=false,ghost=null,r0=d.getBoundingClientRect(),ox=sx-r0.left,oy=sy-r0.top;
  function over(ev){
    var t=spikeAt(ev.clientX,ev.clientY);
    ghost.classList.toggle('ko-ready',!!t);
  }
  function mv(ev){
    if(!moved){
      if(Math.hypot(ev.clientX-sx,ev.clientY-sy)<6)return;
      moved=true;
      ghost=noteEl(n,true);ghost.classList.add('ko-ghost');ghost.style.setProperty('--h',Math.round(r0.height*.96)+'px');
      ghost.style.setProperty('--r',n.rot+'deg');ghost.style.transform='rotate('+n.rot+'deg)';
      document.body.appendChild(ghost);d.style.opacity='.25';
    }
    ghost.style.left=(ev.clientX-ox)+'px';ghost.style.top=(ev.clientY-oy)+'px';over(ev);
  }
  function up(ev){
    removeEventListener('pointermove',mv,true);removeEventListener('pointerup',up,true);removeEventListener('pointercancel',up,true);
    d.style.opacity='';
    if(!moved){openNote(n);return}
    ghost.remove();
    var sp=spikeAt(ev.clientX,ev.clientY);
    if(sp){hangOnSpike(sp,n);return}
    try{
      var p=screenToScene(ev.clientX-ox+r0.width/2,ev.clientY-oy+r0.height/2);   // where the middle of the paper is now, in the scene
      n.x=Math.round(Math.max(0,Math.min(W-80,p.x-36)));n.y=Math.round(Math.max(0,Math.min(H-130,p.y-65)));
      d.style.left=n.x+'px';d.style.top=n.y+'px';save();
    }catch(_){}
  }
  addEventListener('pointermove',mv,true);addEventListener('pointerup',up,true);addEventListener('pointercancel',up,true);
}

// ---------- the spike for the orders ----------
var SPIKE_ID='siljak_narudzbine',BELL_ID='zvonce_konobar',PROP_DIR='assets/calibration_props/narudzbine/';
var SPIKE_IMG={prazan:'siljak_prazan.webp',visi:'siljak_visi.webp',pada:'siljak_pada.webp',visipada:'siljak_visi_pada.webp'};
function setSpikeSrc(el,key){
  var b=el.querySelector('.body');if(!b)return;
  var src=PROP_DIR+SPIKE_IMG[key]+'?v=1';b.src=src;
  var sh=el._contactShadow&&el._contactShadow.querySelector('img');if(sh)sh.src=src;
}
function spikeLabel(el){
  var n=+el.dataset.spikeN||0,h=null;
  try{h=el.dataset.spikeHang?JSON.parse(el.dataset.spikeHang):null}catch(_){}
  el.dataset.label=n&&h?'Šiljak za narudžbine · visi: Sto '+h.table+', '+ITEM.name+' (ukupno '+n+')':'Šiljak za narudžbine (prazan)';
}
// the paper that hung there falls onto the base
function fallPaper(el,done){
  var b=el.querySelector('.body');if(!b||typeof b.animate!=='function'){done();return}
  var r=b.getBoundingClientRect(),img=new Image();
  img.src=PROP_DIR+'siljak_papir.webp?v=1';img.alt='';
  Object.assign(img.style,{position:'fixed',left:(r.left+r.width*.212)+'px',top:(r.top+r.height*.1152)+'px',width:(r.width*.541)+'px',height:(r.height*.644)+'px',
    pointerEvents:'none',zIndex:'2147482000',transformOrigin:'50% 15%'});
  document.body.appendChild(img);
  var a=img.animate([
    {transform:'none',opacity:1},
    {transform:'translate('+r.width*.02+'px,'+r.height*.10+'px) rotate(14deg)',opacity:1,offset:.45},
    {transform:'translate('+r.width*.05+'px,'+r.height*.2+'px) rotate(62deg) scale(.8)',opacity:0}
  ],{duration:620,easing:'cubic-bezier(.4,0,.8,.6)',fill:'forwards'});
  var fin=function(){img.remove();done()};
  a.onfinish=fin;a.oncancel=fin;setTimeout(function(){if(img.isConnected)fin()},900);
}
function hangOnSpike(el,n){
  var count=+el.dataset.spikeN||0;
  notes=notes.filter(function(q){return q.id!==n.id});save();
  var node=scene.querySelector('.ko-note[data-id="'+n.id+'"]');if(node)node.remove();
  function hang(){
    el.dataset.spikeN=String(count+1);el.dataset.spikeHang=JSON.stringify({id:n.id,table:n.table});
    setSpikeSrc(el,count===0?'visi':'visipada');spikeLabel(el);
    var b=el.querySelector('.body');
    try{if(b)b.animate([{translate:'0 -8px',opacity:.4},{translate:'0 0',opacity:1}],{duration:260,easing:'ease-out'})}catch(_){}
    try{if(window.CooksterSave)CooksterSave.schedule()}catch(_){}
    try{playTone(660,.35,.12)}catch(_){}
  }
  if(count>=1){setSpikeSrc(el,'pada');fallPaper(el,hang)}else hang();
}
setInterval(function(){                               // a spike that was restored from a save gets its name back
  (window.items||[]).forEach(function(el){if(el&&el.dataset&&el.dataset.itemId===SPIKE_ID&&!el.dataset.label.match(/Šiljak/))spikeLabel(el)});
},1000);

// ---------- the bell ----------
var actx=null;
function playTone(freq,vol,secs){
  var AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
  actx=actx||new AC();if(actx.state==='suspended')actx.resume();
  var t=actx.currentTime,g=actx.createGain();g.connect(actx.destination);
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0008,t+secs);
  [1,2.4,3.9].forEach(function(m,i){var o=actx.createOscillator();o.type='sine';o.frequency.value=freq*m;
    var og=actx.createGain();og.gain.value=[1,.5,.22][i];o.connect(og);og.connect(g);o.start(t);o.stop(t+secs+.05)});
}
function ringBell(el){
  try{playTone(1320,.5,1.5)}catch(_){}
  try{el.animate([{rotate:'0deg'},{rotate:'-7deg'},{rotate:'6deg'},{rotate:'-4deg'},{rotate:'2deg'},{rotate:'0deg'}],{duration:520,easing:'ease-out'})}catch(_){}
  callWaiter();
}
window.addEventListener('pointerdown',function(e){
  if(e.button!==0)return;
  if(e.target&&e.target.closest&&e.target.closest('.ko-note,.ko-modal'))return;
  try{if(typeof holding!=='undefined'&&holding)return}catch(_){}
  // the items do not always get the click themselves, so the bell is found by where the pointer is
  var it=null,r=null,list=window.items||[];
  for(var i=list.length-1;i>=0;i--){
    var c=list[i];if(!c||!c.dataset||c.dataset.itemId!==BELL_ID)continue;
    var cr=c.getBoundingClientRect();
    if(e.clientX>=cr.left&&e.clientX<=cr.right&&e.clientY>=cr.top&&e.clientY<=cr.bottom){it=c;r=cr;break}
  }
  if(!it)return;
  if(e.clientY>r.top+r.height*.66)return;                 // the wooden base picks the bell up, the brass rings it
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
  ringBell(it);
},true);
function openNote(n){
  var m=mk('div','ko-modal'),d=noteEl(n,true),b=mk('button','ko-done');
  b.type='button';b.textContent='✓ Gotovo (ukloni papirić)';
  d.appendChild(b);m.appendChild(d);document.body.appendChild(m);
  function stop(e){e.stopPropagation()}
  ['pointerdown','pointerup','mousedown','mouseup','wheel','contextmenu','keydown'].forEach(function(t){m.addEventListener(t,stop)});
  m.addEventListener('click',function(e){e.stopPropagation();m.remove()});
  b.addEventListener('click',function(e){
    e.stopPropagation();m.remove();
    notes=notes.filter(function(q){return q.id!==n.id});save();
    var el=scene.querySelector('.ko-note[data-id="'+n.id+'"]');if(el)el.remove();
  });
}
function spotFor(i){return{x:Math.round(700+(i%4)*118+Math.random()*16),y:Math.round(330+Math.floor(i/4)*70+Math.random()*14),rot:Math.round((Math.random()*14-7)*10)/10}}

// ---------- the waiter walks in ----------
function kitchenVisible(){return !document.body.classList.contains('pantry-open')}
function drawWaiter(x,y,frame,flip,lean,food){
  var im=food?foodImg:imgs[frame];if(!im||!im.complete||!im.naturalWidth)return;
  var w=im.naturalWidth,h=im.naturalHeight;
  X.save();
  X.fillStyle='rgba(20,8,2,.3)';X.beginPath();X.ellipse(x,y+3,95,18,0,0,Math.PI*2);X.fill();
  X.translate(x,y);if(lean)X.rotate(lean);if(flip)X.scale(-1,1);
  X.drawImage(im,-w/2,-h,w,h);
  X.restore();
}
// a finished bowl of sour cabbage (the picture of the bowl has turned into the dish) is taken to the table of the oldest note
function takeDish(){
  var list=window.items||[],bowl=null;
  for(var i=0;i<list.length;i++){var b=list[i];if(b.dataset&&b.dataset.itemId==='posuda_za_kupus'&&b.classList.contains('bowl-photo-look')){bowl=b;break}}
  if(!bowl)return null;
  var table=notes.length?notes[0].table:1,sp={};
  try{sp=JSON.parse(bowl.dataset.spices||'{}')}catch(e){}
  var kind=(sp.tucana>0||sp.paprika>0)?'paprika':'plain';
  var ev=window.CooksterQuality?window.CooksterQuality.evaluate(bowl,'kiseli_kupus'):null;
  if(notes.length){var n0=notes.shift();var el=scene.querySelector('.ko-note[data-id="'+n0.id+'"]');if(el)el.remove();save()}
  try{removeItem(bowl)}catch(e){}
  return{table:table,kind:kind,ev:ev};
}
function start(){
  var o=pending[0];if(!o)return;
  anim={o:o,t:0,x:STOP_X,phase:'in',dropped:false,last:performance.now()};
  requestAnimationFrame(tick);
}
// the bell: the waiter comes into the kitchen and waits for a moment (what he takes away comes later)
var called=false;
var calledAt=0;
function callWaiter(){called=true;calledAt=Date.now()+3000+Math.random()*2000}   // he comes 3-5 seconds after the bell
function startCall(){
  called=false;
  anim={o:null,call:true,t:0,x:STOP_X,phase:'in',last:performance.now()};
  requestAnimationFrame(tick);
}
function speech(text,x,y){
  X.save();X.font='700 22px system-ui,sans-serif';
  var w=X.measureText(text).width+30,h=40,bx=x-w/2,by=y-h;
  X.fillStyle='rgba(250,238,206,.96)';X.strokeStyle='#5b3d1e';X.lineWidth=3;
  X.beginPath();if(X.roundRect)X.roundRect(bx,by,w,h,12);else X.rect(bx,by,w,h);X.fill();X.stroke();
  X.beginPath();X.moveTo(x-10,by+h);X.lineTo(x,by+h+16);X.lineTo(x+10,by+h);X.closePath();X.fill();X.stroke();
  X.fillStyle='#3a2410';X.textAlign='center';X.fillText(text,x,by+28);
  X.restore();
}
function tick(now){
  if(!anim)return;
  var dt=Math.min(.05,(now-anim.last)/1000);anim.last=now;anim.t+=dt;
  X.clearRect(0,0,W,H);
  var frame=2,flip=false,lean=0,SEQ=[1,2,3,2];
  var alpha=1;
  if(anim.phase==='in'){
    // he just appears on the orange spot on the floor, with a quick fade (0.2 s)
    alpha=Math.min(1,anim.t/.2);
    if(anim.t>=.2){anim.phase=anim.call?'listen':'wait';anim.t=0}
  }else if(anim.phase==='listen'){
    if(!anim.checked&&anim.t>1.2){anim.checked=true;var dish=takeDish();if(dish)anim.carry=dish}
    if(anim.t>2.4){anim.phase='out';anim.t=0}
  }else if(anim.phase==='wait'){
    if(anim.t>.35){anim.phase='put';anim.t=0}
  }else if(anim.phase==='put'){
    lean=Math.sin(Math.min(1,anim.t/.7)*Math.PI)*.07;
    if(!anim.dropped&&anim.t>.3){
      anim.dropped=true;
      var o=anim.o,sp=spotFor(notes.length),n={id:o.id,table:o.table,name:ITEM.name,extra:ITEM.extra,x:sp.x,y:sp.y,rot:sp.rot};
      notes.push(n);placeNote(n,true);save();
    }
    if(anim.t>.9){anim.phase='out';anim.t=0}
  }else if(anim.phase==='out'){
    alpha=Math.max(0,1-anim.t/.2);
    if(anim.t>=.2){
      if(!anim.call){pending.shift();save()}
      if(anim.carry&&window.CooksterTavern&&window.CooksterTavern.deliver)window.CooksterTavern.deliver(anim.carry.table-1,anim.carry.kind,anim.carry.ev);
      anim=null;X.clearRect(0,0,W,H);return;
    }
  }
  X.globalAlpha=alpha;
  drawWaiter(anim.x,FLOOR_Y,frame,flip,lean,!!anim.carry);X.globalAlpha=1;
  if(anim.phase==='listen'&&anim.t>.3)speech(anim.carry?'Odnosim kupus!':'Izvolite?',anim.x,FLOOR_Y-440);
  requestAnimationFrame(tick);
}
setInterval(function(){
  if(!anim&&kitchenVisible()){
    if(called){if(Date.now()>=calledAt)startCall();}
    else if(pending.length&&Date.now()>=pending[0].readyAt)start();
  }
},300);

load();
notes.forEach(function(n){placeNote(n,false)});

window.CooksterOrders={
  // the waiter has taken an order at a table (1, 2, 3...): after a while he arrives in the kitchen
  add:function(table){pending.push({id:++uid,table:table,readyAt:Date.now()+TRIP_MS});save()},
  busy:function(){return pending.length>0||!!anim||called},          // the waiter is away from the tavern
  debug:function(){return{pending:pending.slice(),notes:notes.slice(),animating:!!anim,called:called}},
  ringBell:callWaiter,
  reset:function(){pending=[];notes=[];anim=null;save();scene.querySelectorAll('.ko-note').forEach(function(e){e.remove()});X.clearRect(0,0,W,H)}
};
})();
