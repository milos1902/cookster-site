/* Cookster - the orders in the kitchen.
   When the waiter has taken an order in the tavern, he walks to the kitchen: the next time the kitchen is on the screen he walks in from the left,
   leaves a little paper on the table (the number of the table and what was ordered) and walks out again. A click on the paper opens it big.
   The papers are saved in the browser (cookster.kitchen-orders.v1), so they are there after a reload.
   The picture of the paper: assets/ui/order_note.webp (if it is missing, a plain paper drawn with CSS is used). */
(function(){
'use strict';
var scene=document.getElementById('scene');
if(!scene||window.CooksterOrders)return;
var W=1672,H=941,KEY='cookster.kitchen-orders.v1',WAITER='assets/tavern/waiter/waiter_walks',NOTE_IMG='assets/ui/order_note_table.webp?v=1',NOTE_BIG='assets/ui/order_note_big.webp?v=1';
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
  if(key==='kupus'&&Math.random()<.4){                 // the guest asks for a little more / less of oil or paprika
    var ing=Math.random()<.5?'ulje':'paprika',dir=Math.random()<.5?-1:1;
    o.req={ing:ing,dir:dir};
    var gen=ing==='ulje'?(dir<0?'manje ulja':'više ulja'):(dir<0?'manje paprike':'više paprike'),cg=ing==='ulje'?(dir<0?'мање уља':'више уља'):(dir<0?'мање паприке':'више паприке');
    o.extra='malo '+gen;o.cyrExtra='мало '+cg;
  }
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
      // after a refresh the game starts a new day: old orders are not brought back (the guests are not either), so no pile of papers is left on the table
      pending=[];notes=[];
      uid=isFinite(o.uid)?o.uid:Math.max(0,pending.concat(notes).reduce(function(m,n){return Math.max(m,n.id)},0));
    }
  }catch(_){}
}
function mk(tag,cls){var e=document.createElement(tag);if(cls)e.className=cls;return e}

// ---------- looks ----------
var css=document.createElement('style');
css.textContent=
'#kitchenWaiter{position:absolute;left:0;top:0;width:'+W+'px;height:'+H+'px;pointer-events:none;z-index:46}'+
'.ko-note{position:absolute;height:var(--h,200px);aspect-ratio:560/500;z-index:3000;cursor:pointer;color:#17275c;font:700 calc(var(--h,200px)*.03)/1 "Segoe Print","Bradley Hand","Comic Sans MS",cursive;'+
  'filter:drop-shadow(0 5px 6px rgba(40,20,5,.5));transition:transform .15s}'+
'.ko-note:not(.big){background:none}.ko-note .ko-im{position:absolute;inset:0;background:url('+NOTE_IMG+') center/100% 100% no-repeat}.ko-note .ko-sh{display:none;position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;background:url('+NOTE_IMG+') center/100% 100% no-repeat;transform-origin:50% 100%}'+
'.ko-note:hover{transform:scale(1.07) rotate(var(--r,0deg))}'+
'.ko-note.big{aspect-ratio:1000/1340;background:url('+NOTE_BIG+') center/100% 100% no-repeat;filter:drop-shadow(0 14px 18px rgba(30,15,5,.6))}'+
// the handwriting goes into the rows of the table printed on the paper (11 rows: the number, the dish, the amount)
'.ko-c{position:absolute;white-space:nowrap;transform:translateY(-50%)}'+
'.ko-c.c1{left:6%;width:13%;text-align:center}'+
'.ko-c.c2{left:24%;width:51%;text-align:left;overflow:hidden}'+
'.ko-c.c3{left:79%;width:14%;text-align:center}'+
'.ko-c.rw{font-size:.92em}.ko-c.rw small{font-size:.6em;font-weight:600}'+
'.ko-c.tb{left:9%;top:94%;width:50%;text-align:left;font-size:1.15em}'+
'.ko-ghost{position:fixed!important;z-index:2147483000;pointer-events:none;transition:none!important;filter:drop-shadow(0 10px 12px rgba(30,15,5,.55))}'+
'.ko-ghost.ko-ready{filter:drop-shadow(0 0 10px #ffd84d) drop-shadow(0 10px 12px rgba(30,15,5,.55))}'+
'.ko-drop{animation:koSlide .75s cubic-bezier(.2,.7,.25,1) both}'+
'@keyframes koSlide{0%{opacity:0;translate:-62px 4px;rotate:-5deg}30%{opacity:1}100%{opacity:1;translate:0 0;rotate:0deg}}'+
'.ko-modal{position:fixed;inset:0;z-index:2147483000;background:rgba(10,5,2,.62);display:flex;align-items:center;justify-content:center;cursor:pointer}'+
'.ko-modal .ko-note{position:relative;--h:min(86vh,820px);--r:-1.5deg;cursor:default;transition:none;transform:rotate(-1.5deg)}'+
'.ko-modal .ko-note:hover{transform:rotate(-1.5deg)}'+
'.ko-done{position:absolute;left:50%;bottom:-54px;transform:translateX(-50%);padding:9px 18px;border:2px solid #351b0d;border-radius:9px;background:#e8c27a;color:#351b0d;font:700 15px system-ui,sans-serif;cursor:pointer;white-space:nowrap}';
document.head.appendChild(css);
var cv=mk('canvas');cv.id='kitchenWaiter';cv.width=W;cv.height=H;scene.appendChild(cv);
var X=cv.getContext('2d');
for(var i=1;i<=3;i++){var im=new Image();im.src=WAITER+i+'.webp?v=4';imgs[i]=im}
var foodImg=new Image();foodImg.src='assets/tavern/waiter/waiter_foods2.webp?v=2';
var drinkImg=new Image(),drinkOk=false;drinkImg.onload=function(){drinkOk=true};drinkImg.src='assets/tavern/waiter/waiter_drinks2.webp?v=2';

// stop the clicks on a paper from reaching the game
['pointerdown','pointerup','mousedown','mouseup','click','dblclick','contextmenu','touchstart','wheel'].forEach(function(n){
  scene.addEventListener(n,function(e){if(e.target&&e.target.closest&&e.target.closest('.ko-note'))e.stopPropagation()},false);
});

// one paper holds the whole order of the table: one row for every thing that was ordered (older single-line papers are wrapped)
function noteLines(n){
  if(n.lines&&n.lines.length)return n.lines;
  return[{name:n.name,extra:n.extra,cyr:n.cyr,cyrExtra:n.cyrExtra,items:n.items||null,key:n.key,seatId:n.seatId,req:n.req||null}];
}
function noteEl(n,big){
  var d=mk('div','ko-note'+(big?' big':''));d.dataset.id=n.id;
  if(big){
    var L=noteLines(n),h='';
    L.forEach(function(l,i){var top=(43.8+4.65*i).toFixed(2)+'%',ex=l.cyrExtra?' <small>'+l.cyrExtra+'</small>':'';
      h+='<span class="ko-c c1" style="top:'+top+'">'+(i+1)+'.</span><span class="ko-c c2 rw" style="top:'+top+'">'+(l.cyr||ITEM.cyr)+ex+'</span><span class="ko-c c3" style="top:'+top+'">1</span>'});
    h+='<span class="ko-c tb">Сто '+n.table+'</span>';
    d.innerHTML=h;
  }else{
    d.style.setProperty('--h','100px');
    d.appendChild(mk('div','ko-sh'));d.appendChild(mk('div','ko-im'));
    d.style.left=n.x+'px';d.style.top=n.y+'px';d.style.transform='rotate('+n.rot+'deg)';d.style.setProperty('--r',n.rot+'deg');
  }
  return d;
}
// a sound chosen in the tool "Zvuk" replaces the built-in one
function snd(name,action,fallback){if(!kitchenVisible())return false;var ok=false;try{ok=!!(window.CooksterSound&&window.CooksterSound.play(name,action))}catch(e){}if(!ok&&fallback){try{fallback()}catch(e){}}return ok}
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
    var t=spikeAt(ev.clientX,ev.clientY),tp=null;
    try{var q=screenToScene(ev.clientX-ox+r0.width/2,ev.clientY-oy+r0.height/2);tp=trayAt(q.x,q.y)}catch(_){}
    ghost.classList.toggle('ko-ready',!!t||!!tp);
  }
  function mv(ev){
    if(!moved){
      if(Math.hypot(ev.clientX-sx,ev.clientY-sy)<6)return;
      moved=true;if(n.tray){n.tray=null;save()}
      ghost=noteEl(n,false);ghost.classList.add('ko-ghost');ghost.style.setProperty('--h',Math.round(r0.height)+'px');
      ghost.style.setProperty('--r',n.rot+'deg');ghost.style.transform='rotate('+n.rot+'deg)';
      document.body.appendChild(ghost);d.style.opacity='.25';
    }
    ghost.style.left=(ev.clientX-ox)+'px';ghost.style.top=(ev.clientY-oy)+'px';over(ev);
  }
  function up(ev){
    removeEventListener('pointermove',mv,true);removeEventListener('pointerup',up,true);removeEventListener('pointercancel',up,true);
    d.style.opacity='';
    if(!moved){openNote(n,d);return}
    ghost.remove();
    var sp=spikeAt(ev.clientX,ev.clientY);
    if(sp){hangOnSpike(sp,n);return}
    try{
      var p=screenToScene(ev.clientX-ox+r0.width/2,ev.clientY-oy+r0.height/2);   // where the middle of the paper is now, in the scene
      var tr=trayAt(p.x,p.y);if(tr){snapToTray(n,tr,d);return}
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
// a spike that was restored from a save is emptied (its orders belong to the day that is over)
var spikesCleared=0;
setInterval(function(){
  if(spikesCleared>=8)return;
  var any=false;
  (window.items||[]).forEach(function(el){if(el&&el.dataset&&el.dataset.itemId===SPIKE_ID){any=true;if(!el._ko_cleared){el._ko_cleared=1;el.dataset.spikeN='0';el.dataset.spikeHang='';try{setSpikeSrc(el,'prazan')}catch(e){}spikeLabel(el)}}});
  if(any)spikesCleared++;
},700);
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
function openNote(n,small){
  snd('note','open');
  var m=mk('div','ko-modal'),d=noteEl(n,true),b=mk('button','ko-done'),closing=false;
  b.type='button';b.textContent='✓ Gotovo (ukloni papirić)';
  d.appendChild(b);m.appendChild(d);document.body.appendChild(m);
  // the paper rises from the table to the front: it starts where the small one lies and grows to the big one
  var sr=small&&small.getBoundingClientRect(),br=d.getBoundingClientRect(),from=null;
  if(sr&&br.width&&d.animate){
    var sc=sr.height/br.height,dx=(sr.left+sr.width/2)-(br.left+br.width/2),dy=(sr.top+sr.height/2)-(br.top+br.height/2);
    from='translate('+dx.toFixed(1)+'px,'+dy.toFixed(1)+'px) scale('+sc.toFixed(3)+') rotate('+(n.rot||0)+'deg)';
    small.style.opacity='0';
    d.animate([{transform:from,opacity:.35},{opacity:1,offset:.3},{transform:'rotate(-1.5deg)',opacity:1}],{duration:460,easing:'cubic-bezier(.2,.8,.25,1)',fill:'both'});
    if(m.animate)m.animate([{opacity:0},{opacity:1}],{duration:300,fill:'both'});
  }
  function shut(){
    if(closing)return;closing=true;
    if(from&&d.animate){
      var a=d.animate([{transform:'rotate(-1.5deg)',opacity:1},{opacity:1,offset:.7},{transform:from,opacity:.35}],{duration:320,easing:'ease-in',fill:'both'});
      if(m.animate)m.animate([{opacity:1},{opacity:0}],{duration:320,fill:'both'});
      a.onfinish=function(){m.remove();if(small)small.style.opacity=''};
    }else{m.remove();if(small)small.style.opacity=''}
  }
  function stop(e){e.stopPropagation()}
  ['pointerdown','pointerup','mousedown','mouseup','wheel','contextmenu','keydown'].forEach(function(t){m.addEventListener(t,stop)});
  m.addEventListener('click',function(e){e.stopPropagation();shut()});
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
// ---------- the trays ----------
// Every order goes on its own tray: the player puts a tray on the table, makes everything that is on the paper, lays it on the tray and puts the paper on the tray too
// (it snaps into the corner). The waiter takes the whole tray to the table of the paper, whether the guests are still there or not. There are 12 trays in all.
var TRAY_ID='posluzavnik_narudzbine',TRAY_MAX=12,TRAY_SPOT={x:585,y:545},TRAY_BACK_MS=25000,restock=[];
function trays(){return(window.items||[]).filter(function(el){return el&&el.dataset&&el.dataset.itemId===TRAY_ID})}
function trayRect(t){var cx=+t.dataset.cx,by=+t.dataset.by,w=parseFloat(t.style.width)||300,h=parseFloat(t.style.height)||172;return{l:cx-w/2,r:cx+w/2,t:by-h,b:by,w:w,h:h}}
function noteOfTray(t){var id=t.dataset.instanceId;for(var i=0;i<notes.length;i++)if(notes[i].tray===id)return notes[i];return null}
function isFood(el){var id=el.dataset&&el.dataset.itemId;return !!id&&(id.indexOf('pice_')===0||(id==='posuda_za_kupus'&&el.classList.contains('bowl-photo-look')))}
// which food lies on which tray (one thing lies on one tray only: the one with a paper, else the one in front)
function trayMap(){
  var T=trays(),map=new Map();T.forEach(function(t){map.set(t,[])});
  (window.items||[]).forEach(function(el){
    if(!isFood(el)||el.classList.contains('held'))return;
    var cx=+el.dataset.cx,by=+el.dataset.by,best=null;
    T.forEach(function(t){var r=trayRect(t);
      if(cx>=r.l&&cx<=r.r&&by>=r.t+r.h*.15&&by<=r.b+r.h*.12){
        if(!best){best=t;return}
        var a=!!noteOfTray(t),b=!!noteOfTray(best);
        if((a&&!b)||(a===b&&(+t.dataset.by>+best.dataset.by)))best=t;
      }});
    if(best)map.get(best).push(el);
  });
  return map;
}
function trayAt(x,y){var best=null;trays().forEach(function(t){var r=trayRect(t);if(x>=r.l-20&&x<=r.r+20&&y>=r.t-20&&y<=r.b+20&&!noteOfTray(t)){if(!best||+t.dataset.by>+best.dataset.by)best=t}});return best}
function snapToTray(n,t,d){
  var r=trayRect(t);n.tray=t.dataset.instanceId;n.x=Math.round(r.l+10);n.y=Math.round(r.b-100-8);
  if(d){d.style.left=n.x+'px';d.style.top=n.y+'px'}
  save();snd('note','drop');
}
// the paper and the things on a tray move with it
function followTrays(){
  var map=trayMap();
  trays().forEach(function(t){
    var cx=+t.dataset.cx,by=+t.dataset.by,last=t._ko_last;
    if(last&&(cx!==last[0]||by!==last[1])){
      var dx=cx-last[0],dy=by-last[1],n=noteOfTray(t);
      if(n){n.x+=dx;n.y+=dy;var el=scene.querySelector('.ko-note[data-id="'+n.id+'"]');if(el){el.style.left=n.x+'px';el.style.top=n.y+'px'}}
      (t._ko_on||[]).forEach(function(it){if(it.isConnected&&!it.classList.contains('held')){try{setPose(it,(+it.dataset.cx)+dx,(+it.dataset.by)+dy,+it.dataset.vis||1)}catch(e){}}});
    }
    t._ko_last=[+t.dataset.cx,+t.dataset.by];t._ko_on=(map.get(t)||[]).slice();
  });
}
function spawnTray(){
  try{
    var def=kitchenEquipmentDef(TRAY_ID);if(!def)return false;
    var el=makeItem(Object.assign({},def,{instanceId:nextItemInstanceId(def.id),x:TRAY_SPOT.x-def.w/2-CENTER_OFFSET,y:TRAY_SPOT.y-def.h,z:++zCounter}));
    if(!el)return false;el.dataset.surfaceZone='table';setPose(el,TRAY_SPOT.x,TRAY_SPOT.y,1);return true;
  }catch(e){return false}
}
// there is always an empty tray at the left end of the table (until all 12 are in use); the ones the waiter took come back after a while
function maintainTrays(){
  var now=Date.now();restock=restock.filter(function(t){return t>now});
  if(typeof makeItem!=='function'||typeof kitchenEquipmentDef!=='function'||!window.items)return;
  var T=trays(),map=trayMap(),free=false;
  T.forEach(function(t){var r=trayRect(t);if(Math.abs((+t.dataset.cx)-TRAY_SPOT.x)<40&&Math.abs((+t.dataset.by)-TRAY_SPOT.y)<40&&!noteOfTray(t)&&!(map.get(t)||[]).length)free=true});
  if(!free&&T.length+restock.length<TRAY_MAX)spawnTray();
}
// the waiter takes the oldest tray that is complete; a thing that is missing on a tray is said aloud
function takeTray(){
  var map=trayMap(),cand=[],loose=0,miss=null;
  trays().forEach(function(t){var n=noteOfTray(t);if(n)cand.push({t:t,n:n,on:map.get(t)||[]})});
  cand.sort(function(a,b){return a.n.id-b.n.id});
  for(var k=0;k<cand.length;k++){
    var c=cand[k],n=c.n,pool={},bowls=[],missing=[],all=[],used=[];
    c.on.forEach(function(el){var id=el.dataset.itemId;if(id==='posuda_za_kupus')bowls.push(el);else(pool[id]=pool[id]||[]).push(el)});
    noteLines(n).forEach(function(l){
      var optional=l.seatId===-2;                       // the guest has left: his order is taken along if it is there, but it is not waited for
      if(l.items&&l.items.length){
        var ok=true,cnt={};l.items.forEach(function(id){cnt[id]=(cnt[id]||0)+1;if((pool[id]||[]).length<cnt[id])ok=false});
        if(!ok){if(!optional)l.items.forEach(function(id){if(!(pool[id]||[]).length)missing.push(ITEM_NAMES[id]||id)});return}
        l.items.forEach(function(id){used.push(pool[id].shift())});
        all.push({kind:'drink',items:l.items.slice(),seatId:l.seatId,ev:{score:2,issues:[],perfect:true,amounts:{}}});
      }else{
        var bowl=bowls.shift();if(!bowl){if(!optional)missing.push('kiseli kupus');return}
        used.push(bowl);
        var sp={};try{sp=JSON.parse(bowl.dataset.spices||'{}')}catch(e){}
        var ev=window.CooksterQuality?window.CooksterQuality.evaluate(bowl,'kiseli_kupus'):null;
        if(ev&&l.req){                                       // did he get the "little more / less" he asked for?
          var Q=window.CooksterQuality,rp=Q.RECIPES.kiseli_kupus.parts[l.req.ing],v=Q.amountsOf(bowl)[l.req.ing]||0;
          if(rp){
            var mid=(rp.lo+rp.hi)/2,hit=l.req.dir<0?(v>=rp.lo*.7&&v<mid):(v>mid&&v<=rp.hi*1.3);
            var what=l.req.ing==='ulje'?'ulja':'paprike';
            var HITS=['Tačno kako sam tražio!','Baš po mojoj meri!','Savršeno, kao što sam rekao!','Pogodio si ukus, svaka čast!','Tako treba, majstore!','Upravo ovako sam voleo!','Čuo si me, hvala!','Taman koliko treba!','Mnogo dobro, baš kako volim!','Ovo je to, bravo kuvaru!'],
                MISS=['Tražio sam malo {q}!','Rekao sam malo {q}, zar ne?','Pa nisam ovo tražio, hteo sam malo {q}.','Nije to – ja sam hteo malo {q}.','Zar nisi čuo? Malo {q}!','Ovo nije po mom ukusu, trebalo je malo {q}.','Hej, ja sam naručio malo {q}!','Pogrešno, tražio sam malo {q}.','Ne ide to tako, malo {q} sam rekao.','Baš sam jasno rekao: malo {q}!'],
                q=(l.req.dir<0?'manje ':'više ')+what,rn=function(a){return a[Math.floor(Math.random()*a.length)]};
            ev=hit?{score:3,issues:[rn(HITS)],perfect:true,amounts:ev.amounts,good:true}:{score:Math.min(ev.score,0)-2,issues:[rn(MISS).replace('{q}',q)],perfect:false,amounts:ev.amounts};
          }
        }
        all.push({kind:(sp.tucana>0||sp.paprika>0)?'paprika':'plain',seatId:l.seatId,ev:ev});
      }
    });
    if(missing.length){if(!miss)miss='Fali na poslužavniku (sto '+n.table+'): '+missing.join(', ');continue}
    if(!all.length)continue;
    used.forEach(function(it){try{removeItem(it)}catch(e){}});                    // the things leave with the waiter ...
    try{removeItem(c.t)}catch(e){}                                                    // ... and so does the tray (it comes back later) ...
    var nel=scene.querySelector('.ko-note[data-id="'+n.id+'"]');if(nel)nel.remove();
    notes.splice(notes.indexOf(n),1);save();                                          // ... and the paper
    restock.push(Date.now()+TRAY_BACK_MS);
    var head=all.filter(function(x){return x.kind==='drink'})[0]||all[0];
    return{carry:{table:n.table,kind:head.kind,seatId:head.seatId,items:head.items||null,ev:head.ev,all:all}};
  }
  notes.forEach(function(n){if(!n.tray)loose++});
  return{say:miss||(loose?'Stavi papirić na poslužavnik sa onim što piše!':(notes.length?'Fali nešto na poslužavniku.':null))};
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
      anim.checked=true;var tk=takeTray();
      if(tk.carry)anim.carry=tk.carry;
      if(tk.say)anim.say=tk.say;
    }
    if(anim.t>2.4){anim.phase='out';anim.t=0}
  }else if(anim.phase==='wait'){
    if(anim.t>.35){anim.phase='put';anim.t=0}
  }else if(anim.phase==='put'){
    lean=Math.sin(Math.min(1,anim.t/.7)*Math.PI)*.07;
    if(!anim.dropped&&anim.t>.3){
      anim.dropped=true;
      var o=anim.o,sp=spotFor(notes.length),lst=(o.list&&o.list.length)?o.list:[{ord:o.ord||null,seatId:o.seatId}];
      var lines=lst.map(function(e){var od=e.ord||{};return{name:od.name||ITEM.name,extra:od.extra!=null?od.extra:ITEM.extra,cyr:od.cyr||ITEM.cyr,cyrExtra:od.cyr?(od.cyrExtra||''):ITEM.cyrExtra,items:od.items||null,key:od.key||'kupus',req:od.req||null,seatId:e.seatId==null?-1:e.seatId}});
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
  if(anim.phase==='listen'&&anim.t>.3)speech(anim.carry?((anim.carry.all&&anim.carry.all.length>1?'Odnosim sve ('+anim.carry.all.length+')!':(anim.carry.kind==='drink'?'Odnosim piće!':'Odnosim kupus!'))+(anim.say?' '+anim.say:'')):(anim.say||'Izvolite?'),anim.x,FLOOR_Y-440);
  requestAnimationFrame(tick);
}
setInterval(function(){
  if(!anim){                                           // the waiter does his work also while the player is in the tavern or the pantry (the kitchen is just not on the screen then)
    if(called){if(Date.now()>=calledAt)startCall();}
    else if(pending.length&&Date.now()>=pending[0].readyAt)start();
  }
},300);

load();
notes.forEach(function(n){placeNote(n,false)});
var shSig='';
function noteShadow(){                                  // the shadow of the paper is calibrated in the tool "senke" (Papirić narudžbine)
  var c=null;try{c=window.CooksterContactShadowCfg&&window.CooksterContactShadowCfg('order_note_paper')}catch(e){}
  var sig=JSON.stringify(c);if(sig===shSig)return;shSig=sig;
  var st=document.getElementById('koShStyle');if(!st){st=document.createElement('style');st.id='koShStyle';document.head.appendChild(st)}
  if(!c){st.textContent='';return}
  var h=100,w=112,sx=+c.width||.72,sy=+c.height||.07,op=Math.max(0,Math.min(1,c.opacity==null?.5:+c.opacity));
  st.textContent='.ko-note:not(.big){filter:none!important}.ko-note:not(.big) .ko-sh{display:block;filter:brightness(0) blur('+(+c.blur||0)+'px);opacity:'+op+';transform:translate('+(+c.shadowX||0)+'px,'+(+c.shadowY||0)+'px) rotate('+(+c.angle||0)+'deg) scale('+sx+','+sy+')}';
}
setInterval(noteShadow,700);noteShadow();
setInterval(followTrays,80);setInterval(maintainTrays,1000);

window.CooksterOrders={
  // the waiter has taken an order at a table (1, 2, 3...): after a while he arrives in the kitchen
  add:function(table,list){
    if(list&&!Array.isArray(list))list=[{ord:list,seatId:arguments[2]}];
    pending.push({id:++uid,table:table,list:list||[],readyAt:Date.now()+TRIP_MS});save()},
  make:makeOrder,
  // a guest got up and left: his lines are taken off the paper and off the orders that are still on their way
  cancelSeat:function(table,seatId){
    // the lines of the guest who left stay on the papers (the waiter takes them along if they are on the tray, nobody waits for them): they get seat -2
    function orphan(l){if(l&&l.seatId===seatId)l.seatId=-2}
    pending.forEach(function(o){if(o.table===table)(o.list||[]).forEach(orphan)});
    notes.forEach(function(n){if(n.table===table)(n.lines||[]).forEach(orphan)});
    save();
  },
  busy:function(){return pending.length>0||!!anim||called},          // the waiter is away from the tavern
  debug:function(){return{pending:pending.slice(),notes:notes.slice(),animating:!!anim,called:called}},
  ringBell:callWaiter,
  reset:function(){pending=[];notes=[];anim=null;save();scene.querySelectorAll('.ko-note').forEach(function(e){e.remove()});X.clearRect(0,0,W,H)}
};
})();
