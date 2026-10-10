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
  'filter:drop-shadow(0 5px 6px rgba(40,20,5,.5));transition:transform .15s,left .45s ease,top .45s ease,height .3s}'+
'.ko-note:not(.big){background:none}.ko-note .ko-im{position:absolute;inset:0;background:url('+NOTE_IMG+') center/100% 100% no-repeat}.ko-note .ko-sh{display:none;position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;background:url('+NOTE_IMG+') center/100% 100% no-repeat;transform-origin:50% 100%}'+
'.ko-note:hover{transform:scale(1.07) rotate(var(--r,0deg))}'+
'.ko-note.big{aspect-ratio:1000/1340;background:url('+NOTE_BIG+') center/100% 100% no-repeat;filter:drop-shadow(0 14px 18px rgba(30,15,5,.6))}'+
// the handwriting goes into the rows of the table printed on the paper (11 rows: the number, the dish, the amount)
'.ko-c{position:absolute;white-space:nowrap;transform:translateY(-50%)}'+
'.ko-c.c1{left:6%;width:13%;text-align:center}'+
'.ko-c.c2{left:24%;width:51%;text-align:left;overflow:hidden}'+
'.ko-c.c3{left:79%;width:14%;text-align:center}'+
'.ko-c.rw{font-size:.92em}.ko-c.rw small{font-size:.6em;font-weight:600}'+
'.ko-c.x{text-decoration:line-through;text-decoration-thickness:.14em;text-decoration-color:#b3261e;opacity:.8}'+
'.ko-note.ko-complete::after,.ko-note.ko-served::after{content:"✓";position:absolute;right:-5px;top:-7px;width:19px;height:19px;border-radius:50%;background:#2e8b3d;color:#fff;font:700 13px/19px system-ui,sans-serif;text-align:center;box-shadow:0 0 8px #7dff8f}'+
'.ko-note.ko-left::before{content:"✓";position:absolute;left:50%;margin-left:-11px;top:-19px;width:22px;height:22px;border-radius:50%;background-color:#b3261e;background-image:linear-gradient(135deg,transparent 47%,#2b0a08 47%,#2b0a08 53%,transparent 53%);color:#fff;font:700 14px/22px system-ui,sans-serif;text-align:center;box-shadow:0 0 8px #ff8a80;z-index:2}'+
'.ko-note.ko-served::after{background:#8a8a8a;box-shadow:none}.ko-note.ko-served{opacity:.85}'+
'.ko-railfront{position:absolute;pointer-events:none;background-repeat:no-repeat;background-size:100% 100%}'+
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
// the rows that are written on the paper: a "kilo na kilo" is written once (wine, soda) and the glasses of the whole table are counted together below it ("3 x čaša za špricer")
var GLASS_CYR={pice_casa_spricer:'Чаша за шприцер',pice_casa_belo_vino:'Чаша белог вина',pice_casa_crno_vino:'Чаша црног вина'};
function displayRows(L,ok){
  var rows=[],gl={},order=[];
  function addGlass(id,i){if(!gl[id])gl[id]={q:0,done:true};order.indexOf(id)<0&&order.push(id);gl[id].q++;if(!(ok&&ok[i]))gl[id].done=false}
  L.forEach(function(l,i){
    var it=l.items||[],g=it.filter(function(id){return GLASS_CYR[id]}),d=!!(ok&&ok[i]);
    if(l.key==='kilo'&&g.length&&it.length>1){rows.push({cyr:l.cyr,cyrExtra:'бело вино, сода',q:1,done:d});g.forEach(function(id){addGlass(id,i)})}
    else if(it.length===1&&GLASS_CYR[it[0]])addGlass(it[0],i);
    else rows.push({cyr:l.cyr,cyrExtra:l.cyrExtra,q:1,done:d});
  });
  order.forEach(function(id){rows.push({cyr:GLASS_CYR[id],cyrExtra:'',q:gl[id].q,done:gl[id].done})});
  return rows;
}
function noteEl(n,big){
  var d=mk('div','ko-note'+(big?' big':''));d.dataset.id=n.id;
  if(big){
    var rows=displayRows(noteLines(n),rt(n).ok),h='';
    rows.forEach(function(r,i){var top=(43.8+4.65*i).toFixed(2)+'%',ex=r.cyrExtra?' <small>'+r.cyrExtra+'</small>':'';
      var x=r.done?' x':'';
      h+='<span class="ko-c c1'+x+'" style="top:'+top+'">'+(i+1)+'.</span><span class="ko-c c2 rw'+x+'" style="top:'+top+'">'+(r.cyr||ITEM.cyr)+ex+'</span><span class="ko-c c3'+x+'" style="top:'+top+'">'+r.q+'</span>'});
    h+='<span class="ko-c tb">Сто '+n.table+'</span>';
    d.innerHTML=h;
  }else{
    d.style.setProperty('--h','100px');
    d.appendChild(mk('div','ko-sh'));d.appendChild(mk('div','ko-im'));
    applyPos(d,n);
  }
  return d;
}
// a sound chosen in the tool "Zvuk" replaces the built-in one
function snd(name,action,fallback){if(!kitchenVisible())return false;var ok=false;try{ok=!!(window.CooksterSound&&window.CooksterSound.play(name,action))}catch(e){}if(!ok&&fallback){try{fallback()}catch(e){}}return ok}
function placeNote(n,drop){
  var d=noteEl(n,false);if(drop)d.classList.add('ko-drop');
  d.addEventListener('animationend',function(){d.classList.remove('ko-drop')});
  d.addEventListener('click',function(e){e.stopPropagation();if(!hand)openNote(n,d)});                    // a click opens the paper big, a second click puts it back
  d.addEventListener('contextmenu',function(e){e.preventDefault();e.stopPropagation();startHand(n,d)});    // the right button takes it in the hand
  d.addEventListener('pointerdown',function(e){if(e.button===0){snd('note','pickup');e.stopPropagation()}});
  scene.appendChild(d);layoutRail();
}
// A paper is taken in the hand with the right button: the left button puts it on the spike (it is hung there), or on the table next to the things for the waiter (anywhere on the table),
// or back into the ticket rail; the right button / Esc gives it back where it was.
function spikeAt(x,y){
  var list=window.items||[];
  for(var i=0;i<list.length;i++){
    var el=list[i];if(!el||!el.dataset||el.dataset.itemId!==SPIKE_ID)continue;
    var r=el.getBoundingClientRect(),px=r.width*.25;
    if(x>=r.left-px&&x<=r.right+px&&y>=r.top&&y<=r.bottom+r.height*.05)return el;
  }
  return null;
}
var hand=null;
function onTable(p){
  try{var poly=placementGeometry&&placementGeometry.SURFACES&&placementGeometry.SURFACES.tablePoly;if(poly&&poly.length>2)return pointInPoly(p.x,p.y,poly)}catch(_){}
  return p.x>420&&p.x<1230&&p.y>235&&p.y<560;
}
function onRail(p){var rl=railEl();if(!rl)return false;var cx=+rl.dataset.cx,by=+rl.dataset.by,w=parseFloat(rl.style.width)||420,h=parseFloat(rl.style.height)||58;return p.x>=cx-w/2-30&&p.x<=cx+w/2+30&&p.y>=by-h-110&&p.y<=by+20}
function startHand(n,d){
  if(hand)return;
  snd('note','pickup');
  var r0=d.getBoundingClientRect(),ghost=noteEl(n,false);
  ghost.classList.add('ko-ghost');ghost.style.setProperty('--h',Math.round(r0.height)+'px');ghost.style.setProperty('--r','0deg');ghost.style.transform='none';
  document.body.appendChild(ghost);d.style.opacity='.25';
  hand={n:n,d:d,ghost:ghost,at:n.at,x:n.x,y:n.y,w:r0.width,h:r0.height};
  function place(ev){ghost.style.left=(ev.clientX-hand.w/2)+'px';ghost.style.top=(ev.clientY-hand.h/2)+'px';ghost.classList.toggle('ko-ready',!!spikeAt(ev.clientX,ev.clientY))}
  function end(){
    removeEventListener('pointermove',mv,true);removeEventListener('pointerdown',dn,true);removeEventListener('contextmenu',cm,true);removeEventListener('keydown',kd,true);
    ghost.remove();d.style.opacity='';hand=null;
  }
  function cancel(){var h=hand;n.at=h.at;n.x=h.x;n.y=h.y;end();layoutRail();applyPos(d,n);save()}
  function mv(ev){place(ev)}
  function dn(ev){
    ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();
    if(ev.button===2){cancel();return}
    if(ev.button!==0)return;
    var sp=spikeAt(ev.clientX,ev.clientY);
    if(sp){end();hangOnSpike(sp,n);return}
    var p=null;try{p=screenToScene(ev.clientX,ev.clientY)}catch(_){return}
    if(onRail(p)){n.at='rail';end();layoutRail();save();snd('note','drop');return}
    if(onTable(p)){n.at='table';n.x=Math.round(p.x-56);n.y=Math.round(p.y-50);n.rot=Math.round((Math.random()*8-4)*10)/10;end();applyPos(d,n);layoutRail();save();snd('note','drop')}
  }
  function cm(ev){ev.preventDefault();ev.stopPropagation()}
  function kd(ev){if(ev.key==='Escape'){ev.stopPropagation();cancel()}}
  addEventListener('pointermove',mv,true);addEventListener('pointerdown',dn,true);addEventListener('contextmenu',cm,true);addEventListener('keydown',kd,true);
  place({clientX:r0.left+r0.width/2,clientY:r0.top+r0.height/2});
}
// ---------- the ticket rail ----------
// A rail on the wall (a kitchen element: "Ticket rail za narudžbine", placed with the other elements): the papers that the waiter brings slide into its first place and push the others on.
var RAIL_ID='ticket_rail',RAIL_MAX=6;
function railEl(){var l=window.items||[];for(var i=0;i<l.length;i++)if(l[i]&&l[i].dataset&&l[i].dataset.itemId===RAIL_ID)return l[i];return null}
function applyPos(el,n){
  if(n.at==='rail')return;
  el.style.setProperty('--h','100px');el.style.zIndex='';el.style.left=n.x+'px';el.style.top=n.y+'px';
  el.style.transform='rotate('+(n.rot||0)+'deg)';el.style.setProperty('--r',(n.rot||0)+'deg');
}
function layoutRail(){
  var rl=railEl(),list=notes.filter(function(n){return n.at==='rail'}).sort(function(a,b){return b.id-a.id});
  list.forEach(function(n,i){
    var el=scene.querySelector('.ko-note[data-id="'+n.id+'"]');if(!el||(hand&&hand.d===el&&false))return;
    var cx,by,w,h;
    if(rl){cx=+rl.dataset.cx;by=+rl.dataset.by;w=parseFloat(rl.style.width)||420;h=parseFloat(rl.style.height)||58}
    else{cx=1060;by=215;w=420;h=58}
    var L=cx-w/2,ph=Math.round(h*1.3),pw=ph*1.12,pitch=w*.125,x=L+w*.05+Math.min(i,RAIL_MAX-1)*pitch;
    var z=(rl?parseInt(rl.style.zIndex)||250:250)+1+(RAIL_MAX-1-Math.min(i,RAIL_MAX-1));
    el.style.setProperty('--h',ph+'px');el.style.left=Math.round(x)+'px';el.style.top=Math.round(by-h*.58-ph)+'px';
    el.style.zIndex=String(Math.max(1,z));el.style.transform='rotate('+((i%2?1:-1)*1.2)+'deg)';el.style.setProperty('--r',((i%2?1:-1)*1.2)+'deg');
  });
}
// the front bar of the rail is drawn again above the papers, so that they stand IN the slot (between the back bar and the front bar)
var RAIL_FRONT={top:.21,bottom:.55};
function railFront(){
  var rl=railEl(),f=document.getElementById('koRailFront');
  if(!rl||!notes.some(function(n){return n.at==='rail'})){if(f)f.style.display='none';return}
  if(!f){f=mk('div','ko-railfront');f.id='koRailFront';scene.appendChild(f)}
  var img=rl.querySelector('.body'),src=img&&img.src;if(src&&f.dataset.src!==src){f.dataset.src=src;f.style.backgroundImage='url("'+src+'")'}
  var st=rl.style;f.style.display='block';f.style.left=st.left;f.style.top=st.top;f.style.width=st.width;f.style.height=st.height;f.style.transform=st.transform;f.style.transformOrigin=st.transformOrigin;
  f.style.clipPath='inset('+(RAIL_FRONT.top*100)+'% 0 '+((1-RAIL_FRONT.bottom)*100)+'% 0)';
  f.style.zIndex=String((parseInt(st.zIndex)||250)+RAIL_MAX+3);
}
// a world that was saved before the rail existed gets one
var railTried=0;
function ensureRail(){
  if(railTried>=3||typeof makeItem!=='function'||typeof kitchenEquipmentDef!=='function'||!window.items||!window.items.length)return;
  if(railEl()){railTried=9;return}
  railTried++;
  try{
    var def=kitchenEquipmentDef(RAIL_ID);if(!def)return;
    var el=makeItem(Object.assign({},def,{instanceId:nextItemInstanceId(def.id),x:1060-def.w/2-CENTER_OFFSET,y:215-def.h,z:++zCounter}));
    if(el){el.dataset.surfaceZone='decor';setPose(el,1060,215,1)}
  }catch(e){}
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
// ---------- what the waiter takes ----------
// Everything that the player puts on the kitchen table is crossed off the papers by itself: the papers are served in the order they came (a paper that was laid on the table first),
// and every row whose things are on the table gets a line through it. When all the rows of a paper are crossed off the paper is ready (a green tick); when the bell rings the waiter takes
// the things of all ready papers (table after table) and the player puts the paper on the spike. A guest who has left does not matter: the things are put on his table anyway.
function isFood(el){var id=el.dataset&&el.dataset.itemId;return !!id&&(id.indexOf('pice_')===0||(id==='posuda_za_kupus'&&el.classList.contains('bowl-photo-look')))}
function paperOrder(){return notes.filter(function(n){return !n.served}).sort(function(a,b){return((a.at==='table'?0:1)-(b.at==='table'?0:1))||(a.id-b.id)})}
// the game remembers which things belong to which paper: a thing that was reserved for a paper stays with it (it is never moved to another order); a new thing goes to the first paper
// that still needs it. This is kept outside of the notes (RT) because the notes are saved.
var RT={};
function rt(n){return RT[n.id]||(RT[n.id]={res:[],ok:[],els:[],miss:[],ready:false})}
function slotsOf(l){return(l.items&&l.items.length)?l.items.slice():['__bowl']}
function slotValid(el,id){
  if(!el||!el.isConnected||(window.items||[]).indexOf(el)<0)return false;
  return id==='__bowl'?el.classList.contains('bowl-photo-look'):el.dataset.itemId===id;
}
function allocate(){
  var all=window.items||[],pool={},claimed=[],order=paperOrder();
  Object.keys(RT).forEach(function(k){if(!notes.some(function(n){return String(n.id)===k&&!n.served}))delete RT[k]});
  order.forEach(function(n){                              // what was reserved stays reserved, as long as it is still there
    var r=rt(n);noteLines(n).forEach(function(l,i){
      var sl=slotsOf(l),cur=r.res[i]||(r.res[i]=[]);
      sl.forEach(function(id,j){if(cur[j]&&slotValid(cur[j],id))claimed.push(cur[j]);else cur[j]=null});
    });
  });
  all.forEach(function(el){                               // the free things on the table
    if(!isFood(el)||el.classList.contains('held')||claimed.indexOf(el)>=0)return;
    var id=el.dataset.itemId==='posuda_za_kupus'?'__bowl':el.dataset.itemId;(pool[id]=pool[id]||[]).push(el);
  });
  notes.forEach(function(n){if(n.served){var r=rt(n);r.ok=noteLines(n).map(function(){return true});r.ready=false}});
  order.forEach(function(n){
    var r=rt(n),lines=noteLines(n),ready=true,any=false;r.ok=[];r.els=[];r.miss=[];
    lines.forEach(function(l,i){
      var optional=l.seatId===-2,sl=slotsOf(l),cur=r.res[i],full=true;
      sl.forEach(function(id,j){
        if(!cur[j]&&pool[id]&&pool[id].length)cur[j]=pool[id].shift();       // reserve a free thing for this paper
        if(!cur[j]){full=false;if(!optional)r.miss.push(id==='__bowl'?'kiseli kupus':(ITEM_NAMES[id]||id))}
      });
      r.ok[i]=full;r.els[i]=full?cur.slice():null;
      if(full)any=true;else if(!optional)ready=false;
    });
    r.ready=ready&&any;
  });
  notes.forEach(function(n){n.ready=!!(RT[n.id]&&RT[n.id].ready)});
}
function takeOrders(){
  allocate();
  var order=paperOrder(),ready=order.filter(function(n){return n.ready}),all=[],used=[];
  ready.forEach(function(n){
    noteLines(n).forEach(function(l,i){
      var els=rt(n).els[i];if(!els)return;
      used=used.concat(els);
      if(l.items&&l.items.length){all.push({kind:'drink',items:l.items.slice(),seatId:l.seatId,table:n.table,ev:{score:2,issues:[],perfect:true,amounts:{}}});return}
      var bowl=els[0],sp={};try{sp=JSON.parse(bowl.dataset.spices||'{}')}catch(e){}
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
      all.push({kind:(sp.tucana>0||sp.paprika>0)?'paprika':'plain',seatId:l.seatId,table:n.table,ev:ev});
    });
  });
  var first=order.filter(function(n){return !n.ready})[0],say=first&&rt(first).miss.length?'Fali — sto '+first.table+': '+rt(first).miss.join(', '):null;
  if(!all.length)return{say:say};
  used.forEach(function(it){try{removeItem(it)}catch(e){}});
  ready.forEach(function(n){n.served=true;delete RT[n.id]});            // the papers stay in the rail with every row crossed off, until the player puts them on the spike
  save();refreshPapers();
  var head=all.filter(function(x){return x.kind==='drink'})[0]||all[0];
  return{carry:{table:head.table,kind:head.kind,seatId:head.seatId,items:head.items||null,ev:head.ev,all:all},say:say};
}
function refreshPapers(){
  allocate();
  notes.forEach(function(n){
    var el=scene.querySelector('.ko-note[data-id="'+n.id+'"]');if(!el)return;
    el.classList.toggle('ko-complete',!!n.ready&&!n.served);el.classList.toggle('ko-served',!!n.served);el.classList.toggle('ko-left',noteLines(n).some(function(l){return l.seatId===-2}));
  });
  layoutRail();
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
    if(!anim.checked&&anim.t>.6){
      anim.checked=true;var tk=takeOrders();
      if(tk.carry)anim.carry=tk.carry;
      if(tk.say)anim.say=tk.say;
    }
    if(anim.t>2.6){anim.phase='out';anim.t=0}
  }else if(anim.phase==='wait'){
    if(anim.t>.35){anim.phase='put';anim.t=0}
  }else if(anim.phase==='put'){
    lean=Math.sin(Math.min(1,anim.t/.7)*Math.PI)*.07;
    if(!anim.dropped&&anim.t>.3){
      anim.dropped=true;
      var o=anim.o,sp=spotFor(0),lst=(o.list&&o.list.length)?o.list:[{ord:o.ord||null,seatId:o.seatId}];
      var lines=lst.map(function(e){var od=e.ord||{};return{name:od.name||ITEM.name,extra:od.extra!=null?od.extra:ITEM.extra,cyr:od.cyr||ITEM.cyr,cyrExtra:od.cyr?(od.cyrExtra||''):ITEM.cyrExtra,items:od.items||null,key:od.key||'kupus',req:od.req||null,seatId:e.seatId==null?-1:e.seatId}});
      var n={id:o.id,table:o.table,name:lines[0].name+(lines.length>1?' +'+(lines.length-1):''),lines:lines,x:sp.x,y:sp.y,rot:sp.rot,at:'rail'};
      notes.push(n);placeNote(n,true);save();
    }
    if(anim.t>.9){anim.phase='out';anim.t=0}
  }else if(anim.phase==='out'){
    alpha=Math.max(0,1-anim.t/.2);
    if(anim.t>=.2){
      if(!anim.call){pending.shift();save()}
      if(anim.carry&&window.CooksterTavern&&window.CooksterTavern.deliver)(anim.carry.all||[anim.carry]).forEach(function(d){window.CooksterTavern.deliver((d.table||anim.carry.table)-1,d.kind,d.ev,d.seatId,d.items||null)});
      anim=null;X.clearRect(0,0,W,H);return;
    }
  }
  X.globalAlpha=alpha;
  drawWaiter(anim.x,FLOOR_Y,frame,flip,lean,anim.carry?(anim.carry.kind==='drink'?'drink':'food'):false);X.globalAlpha=1;
  if(anim.phase==='listen'&&anim.checked&&(anim.carry||anim.say))speech(anim.carry?((anim.carry.all&&anim.carry.all.length>1?'Odnosim sve ('+anim.carry.all.length+')!':(anim.carry.kind==='drink'?'Odnosim piće!':'Odnosim kupus!'))+(anim.say?' '+anim.say:'')):anim.say,anim.x,FLOOR_Y-440);
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
setInterval(refreshPapers,350);setInterval(railFront,100);setInterval(ensureRail,1500);

window.CooksterOrders={
  // the waiter has taken an order at a table (1, 2, 3...): after a while he arrives in the kitchen
  add:function(table,list){
    if(list&&!Array.isArray(list))list=[{ord:list,seatId:arguments[2]}];
    pending.push({id:++uid,table:table,list:list||[],readyAt:Date.now()+TRIP_MS});save()},
  make:makeOrder,
  // a guest got up and left: his lines are taken off the paper and off the orders that are still on their way
  cancelSeat:function(table,seatId){
    // the lines of the guest who left stay on the papers (the waiter takes them along if they are on the table, nobody waits for them): they get seat -2
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
