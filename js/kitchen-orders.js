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
var ITEM={name:'Kiseli kupus',extra:'ulje, tucana paprika',cyr:'Кисели купус',cyrExtra:'уље, туцана паприка'};           // the default dish
// everything a guest can order: a dish (the bowl), or drinks (the bottles and glasses from "Piće" that the player puts on the table)
var ITEM_NAMES={pice_vino_crno_flasa:'flaša crnog vina',pice_vino_belo_flasa:'flaša belog vina',pice_soda_sifon:'soda',pice_casa_spricer:'čaša za špricer',pice_casa_belo_vino:'čaša belog vina',pice_casa_crno_vino:'čaša crnog vina'};
var ORDERS={
  kupus:{name:'Kiseli kupus',extra:'ulje, tucana paprika',cyr:'Кисели купус',cyrExtra:'уље, туцана паприка'},
  kilo:{name:'Kilo na kilo',extra:'belo vino, soda, čaša',cyr:'Кило на кило',cyrExtra:'бело вино, сода, чаша',items:['pice_vino_belo_flasa','pice_soda_sifon','pice_casa_spricer']},
  crno_casa:{name:'Čaša crnog vina',extra:'',cyr:'Чаша црног вина',cyrExtra:'',items:['pice_casa_crno_vino']},
  belo_casa:{name:'Čaša belog vina',extra:'',cyr:'Чаша белог вина',cyrExtra:'',items:['pice_casa_belo_vino']},
  crno_flasa:{name:'Flaša crnog vina',extra:'',cyr:'Флаша црног вина',cyrExtra:'',items:['pice_vino_crno_flasa']},
  belo_flasa:{name:'Flaša belog vina',extra:'',cyr:'Флаша белог вина',cyrExtra:'',items:['pice_vino_belo_flasa']}
};
// a bottle of wine comes with a glass for a spritzer (men) or a wine glass (women)
function makeOrder(key,woman){
  var b=ORDERS[key]||ORDERS.kupus,o={key:key,name:b.name,extra:b.extra,cyr:b.cyr,cyrExtra:b.cyrExtra};
  if(b.items){
    o.items=b.items.slice();
    if(key==='crno_flasa'||key==='belo_flasa'){o.items.push(woman?(key==='crno_flasa'?'pice_casa_crno_vino':'pice_casa_belo_vino'):'pice_casa_spricer');o.extra=woman?'čaša vina':'čaša za špricer';o.cyrExtra=woman?'чаша вина':'чаша за шприцер'}
  }
  return o;
}
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
'.ko-c.rw{font-size:.84em}.ko-c.rw small{font-size:.8em;font-weight:600}'+
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
var drinkImg=new Image(),drinkOk=false;drinkImg.onload=function(){drinkOk=true};drinkImg.src='assets/tavern/waiter/waiter_drinks2.webp';

// stop the clicks on a paper from reaching the game
['pointerdown','pointerup','mousedown','mouseup','click','dblclick','contextmenu','touchstart','wheel'].forEach(function(n){
  scene.addEventListener(n,function(e){if(e.target&&e.target.closest&&e.target.closest('.ko-note'))e.stopPropagation()},false);
});

// one paper holds the whole order of the table: one row for every thing that was ordered (older single-line papers are wrapped)
function noteLines(n){
  if(n.lines&&n.lines.length)return n.lines;
  return[{name:n.name,extra:n.extra,cyr:n.cyr,cyrExtra:n.cyrExtra,items:n.items||null,key:n.key,seatId:n.seatId}];
}
function noteEl(n,big){
  var d=mk('div','ko-note');d.dataset.id=n.id;
  var L=noteLines(n),h='<span class="ko-c c1">Сто '+n.table+'</span>';
  L.forEach(function(l,i){var top=(39.6+4.5*i).toFixed(1)+'%',ex=l.cyrExtra?' <small>'+l.cyrExtra+'</small>':'';
    h+='<span class="ko-c c2 rw" style="top:'+top+'">'+(l.cyr||ITEM.cyr)+ex+'</span><span class="ko-c c3" style="top:'+top+'">1</span>'});
  d.innerHTML=h;
  d.style.setProperty('--h',big?'':'130px');
  if(!big){d.style.left=n.x+'px';d.style.top=n.y+'px';d.style.transform='rotate('+n.rot+'deg)';d.style.setProperty('--r',n.rot+'deg')}
  return d;
}
// a sound chosen in the tool "Zvuk" replaces the built-in one
function snd(name,action,fallback){var ok=false;try{ok=!!(window.CooksterSound&&window.CooksterSound.play(name,action))}catch(e){}if(!ok&&fallback){try{fallback()}catch(e){}}return ok}
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
  snd('note','pickup');
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
      d.style.left=n.x+'px';d.style.top=n.y+'px';save();snd('note','drop');
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
  el.dataset.label=n&&h?'Šiljak za narudžbine · visi: Sto '+h.table+', '+(h.name||ITEM.name)+' (ukupno '+n+')':'Šiljak za narudžbine (prazan)';
}
// the paper that hung there falls onto the base
function fallPaper(el,done){
  try{playImpactSound(el,'fall')}catch(e){}
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
    el.dataset.spikeN=String(count+1);el.dataset.spikeHang=JSON.stringify({id:n.id,table:n.table,name:n.name});
    setSpikeSrc(el,count===0?'visi':'visipada');spikeLabel(el);
    var b=el.querySelector('.body');
    try{if(b)b.animate([{translate:'0 -8px',opacity:.4},{translate:'0 0',opacity:1}],{duration:260,easing:'ease-out'})}catch(_){}
    try{if(window.CooksterSave)CooksterSave.schedule()}catch(_){}
    try{playImpactSound(el,'hang')}catch(e){}
  }
  if(count>=1){setSpikeSrc(el,'pada');fallPaper(el,hang)}else hang();
}
setInterval(function(){                               // a spike that was restored from a save gets its name back
  (window.items||[]).forEach(function(el){if(el&&el.dataset&&el.dataset.itemId===SPIKE_ID&&!el.dataset.label.match(/Šiljak/))spikeLabel(el)});
},1000);

// ---------- the bell ----------
var actx=null;
function ringBell(el){
  try{playImpactSound(el,'ring')}catch(e){}
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
  snd('note','open');
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
  var im=food==='drink'&&drinkOk?drinkImg:food?foodImg:imgs[frame];if(!im||!im.complete||!im.naturalWidth)return;
  var w=im.naturalWidth,h=im.naturalHeight;
  X.save();
  X.fillStyle='rgba(20,8,2,.3)';X.beginPath();X.ellipse(x,y+3,95,18,0,0,Math.PI*2);X.fill();
  X.translate(x,y);if(lean)X.rotate(lean);if(flip)X.scale(-1,1);
  X.drawImage(im,-w/2,-h,w,h);
  X.restore();
}
// what the waiter takes to a table: a finished bowl of sour cabbage (the picture of the bowl has turned into the dish) or the drinks that were ordered
// (the bottles and glasses from "Piće" that stand in the kitchen); the oldest paper that can be fulfilled goes first
function haveCounts(){var have={};(window.items||[]).forEach(function(it){var id=it.dataset&&it.dataset.itemId;if(id)have[id]=(have[id]||0)+1});return have}
function freeBowls(){return(window.items||[]).filter(function(b){return b.dataset&&b.dataset.itemId==='posuda_za_kupus'&&b.classList.contains('bowl-photo-look')})}
function missingFor(n){
  var have=haveCounts(),bowls=freeBowls().length,out=[];
  noteLines(n).forEach(function(l){
    if(l.items&&l.items.length){l.items.forEach(function(id){if(have[id]>0)have[id]--;else out.push(ITEM_NAMES[id]||id)})}
    else{if(bowls>0)bowls--;else out.push('kiseli kupus')}
  });
  return out;
}
// the waiter takes from a paper everything that can be served now (the rest stays on the paper) and brings it to the table in one trip
function takeDish(){
  var list=window.items||[];
  for(var k=0;k<notes.length;k++){
    var n=notes[k],have=haveCounts(),bowls=freeBowls(),lines=noteLines(n),left=[],all=[];
    lines.forEach(function(l){
      if(l.items&&l.items.length){
        var ok=l.items.every(function(id){return have[id]>0});
        if(!ok){left.push(l);return}
        var used={};
        l.items.forEach(function(id){have[id]--;for(var i=0;i<list.length;i++){var it=list[i];if(it.dataset&&it.dataset.itemId===id&&!used[i]&&!it._takenByWaiter){used[i]=1;it._takenByWaiter=1;try{removeItem(it)}catch(e){}break}}});
        all.push({kind:'drink',items:l.items.slice(),seatId:l.seatId,ev:{score:2,issues:[],perfect:true,amounts:{}}});
      }else{
        var bowl=bowls.shift();if(!bowl){left.push(l);return}
        var sp={};try{sp=JSON.parse(bowl.dataset.spices||'{}')}catch(e){}
        var ev=window.CooksterQuality?window.CooksterQuality.evaluate(bowl,'kiseli_kupus'):null;
        all.push({kind:(sp.tucana>0||sp.paprika>0)?'paprika':'plain',seatId:l.seatId,ev:ev});
        try{removeItem(bowl)}catch(e){}
      }
    });
    if(!all.length)continue;
    var el=scene.querySelector('.ko-note[data-id="'+n.id+'"]');
    if(left.length){n.lines=left;if(el){var nn=noteEl(n,false);nn.addEventListener('pointerdown',function(e){if(e.button===0)startNoteDrag(e,n,nn)});el.replaceWith(nn)}}
    else{notes.splice(k,1);if(el)el.remove()}
    save();
    var head=all.filter(function(x){return x.kind==='drink'})[0]||all[0];
    return{table:n.table,kind:head.kind,seatId:head.seatId,items:head.items||null,ev:head.ev,all:all};
  }
  return null;
}
function start(){
  var o=pending[0];if(!o)return;
  anim={o:o,t:0,x:STOP_X,phase:'in',dropped:false,last:performance.now()};snd('waiter','appear');
  requestAnimationFrame(tick);
}
// the bell: the waiter comes into the kitchen and waits for a moment (what he takes away comes later)
var called=false;
var calledAt=0;
function callWaiter(){called=true;calledAt=Date.now()+3000+Math.random()*2000}   // he comes 3-5 seconds after the bell
function startCall(){
  called=false;
  anim={o:null,call:true,t:0,x:STOP_X,phase:'in',last:performance.now()};snd('waiter','appear');
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
    if(!anim.checked&&anim.t>1.2){
      anim.checked=true;var dish=takeDish();
      if(dish)anim.carry=dish;
      else{var mn=null;for(var q=0;q<notes.length;q++)if(missingFor(notes[q]).length){mn=notes[q];break}
        if(mn){var ms=missingFor(mn);if(ms.length)anim.say='Fali: '+ms.join(', ')}}
    }
    if(anim.t>2.4){anim.phase='out';anim.t=0}
  }else if(anim.phase==='wait'){
    if(anim.t>.35){anim.phase='put';anim.t=0}
  }else if(anim.phase==='put'){
    lean=Math.sin(Math.min(1,anim.t/.7)*Math.PI)*.07;
    if(!anim.dropped&&anim.t>.3){
      anim.dropped=true;
      var o=anim.o,sp=spotFor(notes.length),lst=(o.list&&o.list.length)?o.list:[{ord:o.ord||null,seatId:o.seatId}];
      var lines=lst.map(function(e){var od=e.ord||{};return{name:od.name||ITEM.name,extra:od.extra!=null?od.extra:ITEM.extra,cyr:od.cyr||ITEM.cyr,cyrExtra:od.cyr?(od.cyrExtra||''):ITEM.cyrExtra,items:od.items||null,key:od.key||'kupus',seatId:e.seatId==null?-1:e.seatId}});
      var n={id:o.id,table:o.table,name:lines[0].name+(lines.length>1?' +'+(lines.length-1):''),lines:lines,x:sp.x,y:sp.y,rot:sp.rot};
      notes.push(n);placeNote(n,true);save();
    }
    if(anim.t>.9){anim.phase='out';anim.t=0}
  }else if(anim.phase==='out'){
    alpha=Math.max(0,1-anim.t/.2);
    if(anim.t>=.2){
      if(!anim.call){pending.shift();save()}
      if(anim.carry&&window.CooksterTavern&&window.CooksterTavern.deliver)(anim.carry.all||[anim.carry]).forEach(function(d){window.CooksterTavern.deliver(anim.carry.table-1,d.kind,d.ev,d.seatId,d.items||null)});
      anim=null;X.clearRect(0,0,W,H);return;
    }
  }
  X.globalAlpha=alpha;
  drawWaiter(anim.x,FLOOR_Y,frame,flip,lean,anim.carry?(anim.carry.kind==='drink'?'drink':'food'):false);X.globalAlpha=1;
  if(anim.phase==='listen'&&anim.t>.3)speech(anim.carry?(anim.carry.kind==='drink'?'Odnosim piće!':'Odnosim kupus!'):(anim.say||'Izvolite?'),anim.x,FLOOR_Y-440);
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
  add:function(table,list){
    if(list&&!Array.isArray(list))list=[{ord:list,seatId:arguments[2]}];
    pending.push({id:++uid,table:table,list:list||[],readyAt:Date.now()+TRIP_MS});save()},
  make:makeOrder,
  busy:function(){return pending.length>0||!!anim||called},          // the waiter is away from the tavern
  debug:function(){return{pending:pending.slice(),notes:notes.slice(),animating:!!anim,called:called}},
  ringBell:callWaiter,
  reset:function(){pending=[];notes=[];anim=null;save();scene.querySelectorAll('.ko-note').forEach(function(e){e.remove()});X.clearRect(0,0,W,H)}
};
})();
